import { useCallback, useState } from "react";

/**
 * Manages pull-to-refresh state for a list backed by a React Query hook.
 *
 * Usage:
 *   const { data, isLoading, refetch } = useVisits();
 *   const { refreshing, onRefresh } = usePullToRefresh(refetch);
 *   const showSkeleton = isLoading || refreshing;
 *
 *   {showSkeleton ? <Skeleton /> : <FlatList refreshControl={
 *     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 *   } ... />}
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
