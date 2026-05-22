// UT-17: Cloudflare Notifications generic webhook の入力型。
// Cloudflare 公式は payload を完全契約として公開していないため、
// 実フィールドは optional として受ける。

export interface CloudflareNotificationPayload {
  readonly name?: string;
  readonly text?: string;
  readonly data?: Record<string, unknown>;
  readonly policy_id?: string;
  readonly account_id?: string;
  readonly alert_type?: string;
  readonly severity?: string;
  readonly ts?: number;
}

export type AlertMetric =
  | "workers_daily_requests"
  | "d1_read_rows"
  | "d1_write_rows"
  | "pages_build"
  | "r2_class_a"
  | "unknown";
