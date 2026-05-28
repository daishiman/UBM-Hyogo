import { cn } from "../../../../lib/cn";

type RecoveryHint = {
  readonly title: string;
  readonly body: string;
};

const HINT_BY_CODE: Record<string, RecoveryHint> = {
  ADMIN_FETCH_401: {
    title: "セッションが切れています",
    body: "ログインし直してから、もう一度この画面を開いてください。",
  },
  ADMIN_FETCH_403: {
    title: "管理者権限がありません",
    body: "管理者アカウントでログインしているか確認してください。",
  },
  ADMIN_FETCH_404: {
    title: "API に到達できません",
    body: "INTERNAL_API_BASE_URL の向き先、または内部 API Worker の最新デプロイを確認してください。",
  },
  ADMIN_FETCH_500: {
    title: "サーバー設定エラーです",
    body: "AUTH_SECRET や内部 API 用の環境変数が staging に入っているか確認してください。",
  },
};

function resolveRecoveryHint(code?: string): RecoveryHint | null {
  if (!code) return null;
  if (HINT_BY_CODE[code]) return HINT_BY_CODE[code];
  if (/^ADMIN_FETCH_5\d\d$/.test(code)) return HINT_BY_CODE.ADMIN_FETCH_500;
  return null;
}

export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

export function AdminSectionError({
  sectionLabel,
  code,
  correlationId,
  message,
  className,
  onRetry,
  retryLabel = "再読み込み",
  isRetrying = false,
}: AdminSectionErrorProps) {
  const hint = resolveRecoveryHint(code);
  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="admin-section-error"
      className={cn("admin-section-error", className)}
    >
      <p className="admin-section-error__title">
        {sectionLabel} の読み込みに失敗しました
      </p>
      <p className="admin-section-error__message">
        {message ?? "再読み込みしてください。"}
      </p>
      <dl className="admin-section-error__meta">
        {code ? (
          <>
            <dt>code</dt>
            <dd>
              <code>{code}</code>
            </dd>
          </>
        ) : null}
        {correlationId ? (
          <>
            <dt>correlation</dt>
            <dd>
              <code>{correlationId}</code>
            </dd>
          </>
        ) : null}
      </dl>
      {hint ? (
        <div className="admin-section-error__hint">
          <strong>{hint.title}</strong>
          <p>{hint.body}</p>
        </div>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          data-testid="admin-section-error-retry"
          className="admin-section-error__retry"
          aria-label={`${sectionLabel} を再読み込み`}
          aria-busy={isRetrying ? "true" : "false"}
          disabled={isRetrying}
          onClick={() => {
            if (isRetrying) return;
            onRetry();
          }}
        >
          {isRetrying ? `${retryLabel}中…` : retryLabel}
        </button>
      ) : null}
    </div>
  );
}
