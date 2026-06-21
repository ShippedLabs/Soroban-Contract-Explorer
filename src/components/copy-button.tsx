"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-neutral-500 hover:text-neutral-300"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
