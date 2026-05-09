import "react-native-gesture-handler";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppBottomBar } from "../components/AppBottomBar";
import { AskAiChatSheet } from "../components/AskAiChatSheet";
import { AskAiChatProvider } from "../contexts/AskAiChatContext";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AskAiChatProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{ headerShown: false, animation: "slide_from_right" }}
            >
              {/* Bottom bar: Home + Profile switch instantly (no horizontal slide) */}
              <Stack.Screen name="index" options={{ animation: "none" }} />
              <Stack.Screen name="profile" options={{ animation: "none" }} />
            </Stack>
            <AppBottomBar />
            <AskAiChatSheet />
          </AskAiChatProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
