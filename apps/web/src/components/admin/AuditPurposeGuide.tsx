import { Card } from "../ui/Card";
import { AUDIT_GLOSSARY } from "./auditGlossary";

export function AuditPurposeGuide() {
  return (
    <Card className="admin-audit-guide" data-component="audit-purpose-guide">
      <div>
        <p className="admin-audit-guide__eyebrow">この画面で確認すること</p>
        <h2>誰が、いつ、何を変えたかを追跡します</h2>
        <p>
          監査ログは管理操作の履歴を読むための画面です。操作種別、操作者、対象、
          期間、batchId で絞り込み、必要な差分だけを展開して確認します。
        </p>
      </div>
      <dl className="admin-audit-glossary" aria-label="監査ログ用語">
        {AUDIT_GLOSSARY.map((entry) => (
          <div key={entry.term}>
            <dt>{entry.term}</dt>
            <dd>
              <strong>{entry.plain}</strong>（{entry.technical}）
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
