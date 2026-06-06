"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

export function BatchIdCopyButton({ batchId }: { readonly batchId: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(batchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onCopy}
      aria-label={`batchId ${batchId} をコピー`}
    >
      {copied ? "コピー済み" : "コピー"}
    </Button>
  );
}
