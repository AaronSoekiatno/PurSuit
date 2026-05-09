import type { FlatList } from "react-native";

import type { FeedPost } from "./fixtures";

/** Home assigns this so `AppBottomBar` can scroll-to-top and refresh the feed. */
export const homeFeedListRef = {
  current: null as FlatList<FeedPost> | null,
};

/**
 * Home registers `() => setTab("foryou")` so the tab bar can leave the empty Following
 * state when the user taps Home while already on the home route.
 */
export const homeFeedSwitchToForYouRef = {
  current: null as (() => void) | null,
};
