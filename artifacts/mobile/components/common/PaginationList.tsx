import React from "react";
import {
  ActivityIndicator,
  FlatList,
  FlatListProps,
  RefreshControl,
  View,
} from "react-native";

import { Colors } from "@/theme/colors";

interface PaginationListProps<T>
  extends Omit<
    FlatListProps<T>,
    | "onEndReached"
    | "onEndReachedThreshold"
    | "ItemSeparatorComponent"
    | "ListFooterComponent"
    | "extraData"
    | "showsVerticalScrollIndicator"
    | "refreshControl"
  > {
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  refreshing?: boolean
  onRefresh?: () => void
  itemGap?: number
  threshold?: number
}

export function PaginationList<T>({
  data,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refreshing = false,
  onRefresh,
  itemGap = 10,
  threshold = 1,
  contentContainerStyle,
  ...rest
}: PaginationListProps<T>) {
  const count = (data as T[] | undefined)?.length ?? 0;

  return (
    <FlatList
      data={data}
      extraData={count}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={threshold}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage?.();
      }}
      ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={{ paddingVertical: 16 }}
          />
        ) : null
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
      contentContainerStyle={
        count === 0
          ? [{ flexGrow: 1 }, contentContainerStyle]
          : contentContainerStyle
      }
      {...rest}
    />
  );
}
