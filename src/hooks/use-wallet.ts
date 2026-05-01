"use client";

import { useState, useCallback, useEffect } from "react";
import {
  isConnected,
  isAllowed,
  getPublicKey,
  requestAccess,
} from "@stellar/freighter-api";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
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
        const pk = await getPublicKey();
        if (!cancelled && pk) setAddress(pk);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return { address, connecting, error, connect, disconnect };
}
