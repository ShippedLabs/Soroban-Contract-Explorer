"use client";

import { useState, useCallback, useEffect } from "react";
import {
  isConnected,
  isAllowed,
  getPublicKey,
  getNetwork,
  requestAccess,
} from "@stellar/freighter-api";

function normalizeNetwork(value: string): "testnet" | "mainnet" | "other" {
  const upper = value.toUpperCase();
  if (upper === "TESTNET") return "testnet";
  if (upper === "PUBLIC" || upper === "MAINNET") return "mainnet";
  return "other";
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<"testnet" | "mainnet" | "other" | null>(
    null
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const installed = await isConnected();
        if (!installed) return;
        const allowed = await isAllowed();
        if (!allowed) return;
        const [pk, net] = await Promise.all([getPublicKey(), getNetwork()]);
        if (cancelled) return;
        if (pk) setAddress(pk);
        if (net) setNetwork(normalizeNetwork(net));
      } catch {
        // user hasn't authorized this site yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      const installed = await isConnected();
      if (!installed) {
        setError("Freighter not detected. Install it from freighter.app.");
        return;
      }

      const pk = await requestAccess();
      if (!pk) {
        setError("Connection rejected");
        return;
      }

      setAddress(pk);
      const net = await getNetwork();
      if (net) setNetwork(normalizeNetwork(net));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
    setError(null);
  }, []);

  return { address, network, connecting, error, connect, disconnect };
}
