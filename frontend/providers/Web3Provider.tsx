"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { type ReactNode, useState } from "react";

// Wagmi config — Sepolia testnet only
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});

/**
 * Defers RainbowKit rendering until after hydration so
 * the server and client produce identical initial HTML.
 * Without this, useTheme() returns different values on
 * server vs client causing a hydration mismatch in RainbowKit's
 * injected <style> tag.
 */
function RainbowKitThemeWrapper({ children }: { children: ReactNode }) {
  // Neo-Brutalist themed RainbowKit — sharp borders, lime accent
  const theme = lightTheme({
    accentColor: "#D4F933",
    accentColorForeground: "#000000",
    borderRadius: "none",
  });

  return <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeWrapper>{children}</RainbowKitThemeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
