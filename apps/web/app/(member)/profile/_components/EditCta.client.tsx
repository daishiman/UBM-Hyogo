// workflow: mypage-prototype-alignment / Phase 5 / ST-4
// 役割: 「情報を更新する」/「フォームを開いて更新」ボタン + RevalidateModal 内包（client island）。
// 不変条件 #4: 本文編集 UI を描画しない（Modal 内も外部リンクのみ）。新規 primitive ゼロ。
// 状態所有: open は本コンポーネントの useState（[VSCPKR-03] internal state）。
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RevalidateModal } from "./RevalidateModal";

export interface EditCtaProps {
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
  readonly variant?: "header" | "inline";
}

export function EditCta({
  editResponseUrl,
  fallbackResponderUrl,
  variant = "header",
}: EditCtaProps) {
  const [open, setOpen] = useState(false);

  const label =
    variant === "inline" ? "フォームを開いて更新" : "情報を更新する";

  return (
    <>
      <Button
        variant={variant === "inline" ? "ghost" : "primary"}
        size={variant === "inline" ? "sm" : "md"}
        leftIcon={
          variant === "inline" ? (
            <Icon name="external-link" />
          ) : (
            <Icon name="check" />
          )
        }
        onClick={() => setOpen(true)}
        data-cta={
          variant === "inline" ? "edit-cta-inline" : "edit-cta-header"
        }
      >
        {label}
      </Button>
      <RevalidateModal
        open={open}
        onClose={() => setOpen(false)}
        editResponseUrl={editResponseUrl}
        fallbackResponderUrl={fallbackResponderUrl}
      />
    </>
  );
}
