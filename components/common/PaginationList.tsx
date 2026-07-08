import React, { useRef } from "react";
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
    | "onScrollBeginDrag"
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
  // FlatList fires onEndReached as soon as the content is shorter than the
  // viewport — with no scroll at all — which otherwise chain-loads every
  // remaining page the instant a short/filtered list mounts. Only start
  // paging once the user has actually touched the list.
  const hasUserScrolled = useRef(false);

  return (
    <FlatList
      data={data}
      extraData={count}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={() => { hasUserScrolled.current = true; }}
      onEndReachedThreshold={threshold}
      onEndReached={() => {
        if (hasUserScrolled.current && hasNextPage && !isFetchingNextPage) fetchNextPage?.();
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
