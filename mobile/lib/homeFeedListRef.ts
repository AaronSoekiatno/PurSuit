import type { FlatList } from "react-native";

import type { FeedPost } from "./fixtures";

/** Home assigns this so `AppBottomBar` can scroll-to-top and refresh the feed. */
export const homeFeedListRef = {
  current: null as FlatList<FeedPost> | null,
};
