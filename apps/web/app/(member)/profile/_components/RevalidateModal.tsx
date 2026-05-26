// workflow: mypage-prototype-alignment / Phase 5 / ST-4
// 役割: Google Form 再回答導線の説明 Modal。internal state を持たず open は external prop。
// 不変条件: 新規 primitive ゼロ（Modal / Button / Icon の合成）。HEX 直書き禁止。
"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface RevalidateModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}

export function RevalidateModal({
  open,
  onClose,
  editResponseUrl,
  fallbackResponderUrl,
}: RevalidateModalProps) {
  const href = editResponseUrl ?? fallbackResponderUrl;
  return (
    <Modal open={open} onClose={onClose} title="情報を最新化しますか？">
      <div data-region="revalidate-modal">
        <p>
          情報の更新は、Googleフォームから再回答する形で行います。新しい回答があった場合、古い回答はアーカイブされ、自動的に新しい回答に置き換わります。
        </p>
        <p className="muted">
          <span aria-hidden="true">
            <Icon name="check" />
          </span>{" "}
          フォームの設問が変更されている場合、過去の回答内容は項目ごとに引き継がれます（stableKey による紐付け）。
        </p>
        <div className="btn-row">
          <Button variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="ui-button ui-button-primary ui-button-md"
            data-cta="open-revalidate-form"
          >
            <span aria-hidden="true">
              <Icon name="external-link" />
            </span>
            フォームを開く
          </a>
        </div>
      </div>
    </Modal>
  );
}
