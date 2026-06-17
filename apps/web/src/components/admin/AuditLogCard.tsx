import type { AdminAuditListItem } from "../../lib/admin/types";
import { Chip } from "../ui/Chip";
import { BatchIdCopyButton } from "./BatchIdCopyButton";
import { describeAuditAction, describeAuditTargetType } from "./auditGlossary";
import {
  extractBatchId,
  formatJst,
  maskAuditJson,
  maskAuditText,
  summarizeAuditJson,
} from "./auditLogDisplay";

function JsonDisclosure({ label, value }: { readonly label: string; readonly value: unknown }) {
  const safeValue = maskAuditJson(value);
  const json = JSON.stringify(safeValue, null, 2);
  return (
    <details className="admin-audit-json">
      <summary>
        {label}: {summarizeAuditJson(safeValue)}
      </summary>
      <pre data-testid={`${label}-json`}>{json}</pre>
    </details>
  );
}

export function AuditLogCard({ item }: { readonly item: AdminAuditListItem }) {
  const beforeValue = item.maskedBefore ?? item.beforeJson ?? null;
  const afterValue = item.maskedAfter ?? item.afterJson ?? null;
  const batchId = extractBatchId(item);
  const actorLabel = maskAuditText(item.actorEmail, "actorEmail") === "system" ? "システム" : maskAuditText(item.actorEmail, "actorEmail");
  const actionLabel = describeAuditAction(item.action);

  return (
    <li className="admin-audit-card" data-testid="audit-log-card">
      <article aria-labelledby={`audit-${item.auditId}`}>
        <header className="admin-audit-card__head">
          <div>
            <time dateTime={item.createdAt}>{formatJst(item.createdAt)}</time>
            <h3 id={`audit-${item.auditId}`}>{actionLabel}</h3>
          </div>
          <Chip tone="info">{actionLabel}</Chip>
        </header>
        <dl className="admin-audit-card__meta">
          <div>
            <dt>実行者</dt>
            <dd>{actorLabel}</dd>
          </div>
          <div>
            <dt>対象</dt>
            <dd>
              <span>{describeAuditTargetType(item.targetType)}</span>
              <code>{item.targetId ?? "—"}</code>
            </dd>
          </div>
          <div>
            <dt>ログID</dt>
            <dd>
              <code>{item.auditId}</code>
            </dd>
          </div>
        </dl>
        {batchId ? (
          <p className="admin-audit-card__batch" data-testid="audit-batch-id">
            バッチ: <code>{batchId}</code>
            <BatchIdCopyButton batchId={batchId} />
          </p>
        ) : null}
        <div className="admin-audit-card__json">
          <JsonDisclosure label="before" value={beforeValue} />
          <JsonDisclosure label="after" value={afterValue} />
        </div>
        {item.parseError ? <p role="note">JSON parse warning: {item.parseError}</p> : null}
      </article>
    </li>
  );
}
