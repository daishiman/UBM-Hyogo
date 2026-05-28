"use client";
import { useEffect, useState } from "react";
import type { PublishState } from "@ubm-hyogo/shared";
import { Switch } from "../../../../components/ui/Switch";
import { useAdminMutation } from "../../hooks/useAdminMutation";

export interface MemberPublishSwitchProps {
  readonly memberId: string;
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
  readonly onSuccess?: (next: PublishState) => void;
}

interface StatusResponse {
  readonly ok: boolean;
  readonly memberId: string;
  readonly publishState?: PublishState;
  readonly status?: {
    readonly publishState?: PublishState;
    readonly publish_state?: PublishState;
  } | null;
}

const resolvePublishState = (
  response: StatusResponse,
  fallback: PublishState,
): PublishState =>
  response.publishState ??
  response.status?.publishState ??
  response.status?.publish_state ??
  fallback;

export function MemberPublishSwitch({
  memberId,
  publishState,
  isDeleted,
  onSuccess,
}: MemberPublishSwitchProps) {
  const [local, setLocal] = useState<PublishState>(publishState);
  const { trigger, isLoading } = useAdminMutation<StatusResponse>(
    `/api/admin/members/${encodeURIComponent(memberId)}/status`,
    "PATCH",
    {
      successMessage: (data) =>
        resolvePublishState(data, local) === "public"
          ? "✓ 公開にしました"
          : "✓ 非公開にしました",
      onSuccess: (data) => {
        const next = resolvePublishState(data, local);
        setLocal(next);
        onSuccess?.(next);
      },
      refreshOnSuccess: false,
    },
  );

  useEffect(() => {
    setLocal(publishState);
  }, [publishState]);

  if (isDeleted) {
    return (
      <span className="text-xs text-[var(--ubm-color-text-muted)]">退会済み</span>
    );
  }

  const onText = local === "public" ? "公開" : "非公開";

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={local === "public"}
        disabled={isLoading}
        label={`公開状態を切替（現在 ${onText}）`}
        onChange={(next) => {
          const prev = local;
          const nextState: PublishState = next ? "public" : "hidden";
          setLocal(nextState);
          trigger({ publishState: nextState }).catch(() => {
            setLocal(prev);
          });
        }}
      />
      <span className="text-xs text-[var(--ubm-color-text-secondary)]">{onText}</span>
    </div>
  );
}
