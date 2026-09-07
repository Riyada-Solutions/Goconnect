import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { isEffectivelyOnline } from "@/context/NetworkContext";
import { visitCacheRepository } from "@/data/offline_visit_cache";
import { log } from "@/utils/logger";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface OfflineQueueMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  visitId: number;
  operationType: string; // e.g., "submit_flow_sheet"
  endpoint: string; // e.g., "/visits/{id}/forms/flowsheet"
  method?: "POST" | "PUT" | "PATCH";
  onOfflineQueued?: (idempotencyKey: string) => void;
}

/**
 * Drop-in replacement for useMutation that queues mutations offline.
 *
 * When online: sends to server immediately.
 * When offline: queues locally, updates cache optimistically, syncs when reconnected.
 *
 * Example:
 * ```
 * const submitMutation = useMutationWithOfflineQueue({
 *   mutationFn: submitPatientMedications,
 *   visitId: numId,
 *   operationType: "submit_patient_medications",
 *   endpoint: "/visits/{id}/medications",
 *   onSuccess: () => showDialog({ message: "Saved" }),
 * })
 * ```
 */
export function useMutationWithOfflineQueue<TData, TVariables>({
  mutationFn,
  visitId,
  operationType,
  endpoint,
  method = "POST",
  onOfflineQueued,
  ...options
}: OfflineQueueMutationOptions<TData, TVariables>) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const online = await isEffectivelyOnline();
      const idempotencyKey = generateUUID();

      log(
        "[useMutationWithOfflineQueue]",
        `Mutation ${operationType} (online=${online})`,
      );

      // 1. Queue the mutation for potential replay
      await visitCacheRepository.queueMutation({
        visitId,
        operationType,
        endpoint,
        method,
        payload: variables as Record<string, any>,
        idempotencyKey,
        appliedToCache: false,
        retries: 0,
      });

      // 2. If offline: apply optimistically and return
      if (!online) {
        log(
          "[useMutationWithOfflineQueue]",
          `Queued ${operationType} for later sync`,
        );
        onOfflineQueued?.(idempotencyKey);
        // Return optimistic data (caller should handle this gracefully)
        return variables as unknown as TData;
      }

      // 3. If online: send to server
      try {
        const result = await mutationFn(variables);

        // 4. Mark as synced in the queue
        await visitCacheRepository.markMutationSynced(idempotencyKey, result);

        return result;
      } catch (error) {
        log(
          "[useMutationWithOfflineQueue]",
          `Mutation failed: ${error}. Will retry on reconnect.`,
        );
        throw error;
      }
    },
    ...options,
  });
}
