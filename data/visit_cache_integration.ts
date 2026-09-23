import AsyncStorage from "@react-native-async-storage/async-storage";
import { visitCacheRepository } from "@/data/offline_visit_cache";
import { getRules } from "@/data/rules_repository";
import { log } from "@/utils/logger";

/**
 * Populate the visit cache after a successful check-in.
 * Called with the Slot object returned from check-in, which embeds the Visit and Patient.
 *
 * This happens in the background and doesn't block navigation.
 */
export async function cacheVisitDataAfterCheckIn(
  slot: Record<string, any>,
  userId: number,
): Promise<void> {
  try {
    const visit = slot.visit;
    const patient = slot.patient ?? visit?.patient;
    const visitId = visit?.id;

    if (!visitId || !patient) {
      log("[VisitCacheIntegration]", "Check-in response missing visit or patient");
      return;
    }

    log("[VisitCacheIntegration]", `Caching visit ${visitId} after check-in`);

    // Fetch rules globally (shared across all visits in this session)
    let rules: string[] = [];
    try {
      rules = await getRules();
    } catch (error) {
      log("[VisitCacheIntegration]", `Failed to fetch rules: ${error}`);
    }

    // Store the visit cache entry in AsyncStorage
    const entry = {
      visitId,
      slotId: slot.id ?? null,
      patientId: patient.id,
      visit,
      slot: {
        id: slot.id,
        status: slot.status,
        appointmentId: slot.appointment_id,
        // Include only essential slot fields, not the full embedded visit
      },
      patient,
      rules,
      cachedAt: Date.now(),
      userId,
      appVersion: "1.0.0", // TODO: Get from app.json
      inventory: visit?.inventory ?? null,
      medicationAdministration: null,
      dialysisOrders: null,
      isFull: false, // Will be set to true after prefetch completes
      prefetchErrors: {},
    };

    // Store in AsyncStorage
    const key = `@goconnect/visit-cache:${visitId}`;
    await AsyncStorage.setItem(key, JSON.stringify(entry));

    // Update rules cache globally
    await visitCacheRepository.updateCachedRules(rules);

    log(
      "[VisitCacheIntegration]",
      `Cached visit ${visitId}. Rules: ${rules.length} items`,
    );
  } catch (error) {
    log("[VisitCacheIntegration]", `Error caching visit data: ${error}`);
    // Non-fatal — don't block navigation
  }
}
