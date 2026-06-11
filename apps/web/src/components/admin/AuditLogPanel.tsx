import Link from "next/link";
import type { AdminAuditListResponse } from "../../lib/admin/types";
import { Banner } from "../ui/Banner";
import { Button, buttonVariants } from "../ui/Button";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { Pagination } from "../ui/Pagination";
import { Select } from "../ui/Select";
import { AuditLogCard } from "./AuditLogCard";
import { AuditPurposeGuide } from "./AuditPurposeGuide";
import { toAppliedFilterChips } from "./auditAppliedFilters";
import { AUDIT_ACTION_PRESETS, AUDIT_TARGET_TYPE_PRESETS } from "./auditGlossary";
import { toAuditErrorView } from "./auditErrorMessage";
export {
  extractBatchId,
  formatJst,
  maskAuditJson,
  maskAuditText,
  summarizeAuditJson,
} from "./auditLogDisplay";

export interface AuditSearchValues {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly fromLocal?: string;
  readonly toLocal?: string;
  readonly batchId?: string;
  readonly limit?: string;
  readonly cursor?: string;
}

export function buildAuditHref(values: AuditSearchValues, cursor?: string | null): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | undefined | null) => {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  };
  set("action", values.action);
  set("actorEmail", values.actorEmail);
  set("targetType", values.targetType);
  set("targetId", values.targetId);
  set("from", values.fromLocal);
  set("to", values.toLocal);
  set("batchId", values.batchId);
  set("limit", values.limit);
  set("cursor", cursor);
  const qs = params.toString();
  return `/admin/audit${qs ? `?${qs}` : ""}`;
}

export function AuditLogPanel({
  data,
  values,
  error,
  showHeading = false,
}: {
  readonly data: AdminAuditListResponse | null;
  readonly values: AuditSearchValues;
  readonly error?: string;
  readonly showHeading?: boolean;
}) {
  const items = data?.items ?? [];
  const fallbackLimit = values.limit ?? "50";
  const appliedFilterChips = toAppliedFilterChips(data?.appliedFilters, fallbackLimit);
  const errorView = error ? toAuditErrorView(error) : null;
  return (
    <section
      aria-labelledby={showHeading ? "admin-audit-h" : undefined}
      aria-label={showHeading ? undefined : "監査ログ"}
      data-component="admin-audit"
      className="flex flex-col gap-4"
    >
      {showHeading ? (
        <header>
          <h1 id="admin-audit-h">監査ログ</h1>
        </header>
      ) : null}
      <AuditPurposeGuide />
      <Card>
        <form
          action="/admin/audit"
          aria-label="監査ログフィルター"
          className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4"
        >
          <FormField name="action" label="action">
            <Input
              name="action"
              defaultValue={values.action ?? ""}
              placeholder="attendance.add"
              list="audit-action-presets"
            />
          </FormField>
          <datalist id="audit-action-presets">
            {AUDIT_ACTION_PRESETS.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <FormField name="actorEmail" label="actorEmail">
            <Input name="actorEmail" defaultValue={values.actorEmail ?? ""} inputMode="email" />
          </FormField>
          <FormField name="targetType" label="targetType">
            <Input
              name="targetType"
              defaultValue={values.targetType ?? ""}
              placeholder="meeting | admin_member_note"
              list="audit-target-type-presets"
            />
          </FormField>
          <datalist id="audit-target-type-presets">
            {AUDIT_TARGET_TYPE_PRESETS.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <FormField name="targetId" label="targetId">
            <Input name="targetId" defaultValue={values.targetId ?? ""} />
          </FormField>
          <FormField name="from" label="from (JST)">
            <Input name="from" type="datetime-local" defaultValue={values.fromLocal ?? ""} />
          </FormField>
          <FormField name="to" label="to (JST)">
            <Input name="to" type="datetime-local" defaultValue={values.toLocal ?? ""} />
          </FormField>
          <FormField
            name="batchId"
            label="batchId"
            helper="batchId は from/to や action と併用推奨（full scan 回避）"
          >
            <Input
              name="batchId"
              defaultValue={values.batchId ?? ""}
              placeholder="batch-id (uuid)"
            />
          </FormField>
          <FormField name="limit" label="limit">
            <Select name="limit" defaultValue={values.limit ?? "50"}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </FormField>
          <div className="col-span-full flex justify-end gap-2">
            <Button type="submit" variant="primary">
              検索
            </Button>
            <Link
              href="/admin/audit"
              data-role="reset"
              className={buttonVariants({ variant: "ghost", size: "md" })}
            >
              リセット
            </Link>
          </div>
        </form>
      </Card>

      <Card className="admin-audit-applied-filters" data-testid="audit-applied-filters">
        <h2>現在の絞り込み</h2>
        {appliedFilterChips.length > 0 ? (
          <div className="chip-row" aria-label="現在の絞り込み条件">
            {appliedFilterChips.map((chip) => (
              <Chip key={chip.key} tone="info">
                {chip.label}: {chip.value}
              </Chip>
            ))}
          </div>
        ) : (
          <p>なし（直近 {fallbackLimit} 件を新しい順に表示）</p>
        )}
      </Card>

      {errorView ? (
        <Banner tone="warning" title={errorView.title}>
          {errorView.hint ? (
            <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">{errorView.hint}</p>
          ) : null}
        </Banner>
      ) : null}
      {!error && items.length === 0 ? (
        <EmptyState title="該当する監査ログはありません。" />
      ) : null}

      {items.length > 0 ? (
        <Card>
          <ol className="admin-audit-timeline" aria-label="監査ログ一覧">
            {items.map((item) => (
              <AuditLogCard key={item.auditId} item={item} />
            ))}
          </ol>
          <Pagination
            current={1}
            hasPrev={false}
            hasNext={Boolean(data?.nextCursor)}
            nextHref={data?.nextCursor ? buildAuditHref(values, data.nextCursor) : undefined}
            nextLabel="次のページ"
          />
          {!data?.nextCursor ? <span>次のページはありません</span> : null}
        </Card>
      ) : null}
    </section>
  );
}
