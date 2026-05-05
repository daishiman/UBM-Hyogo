# 07c Follow-up 003 Audit Log Browsing UI Lessons

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | 07c-followup-003-audit-log-browsing-ui |
| 日付 | 2026-05-01 |
| 対象 | `GET /admin/audit` / `/admin/audit` |
| workflow | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/` |

## L-07C-AUDIT-001: JST入力とUTC API queryの境界をPhase 9で固定する

**苦戦箇所**: Web UI は管理者向けにJSTで日時を入力・表示する一方、API queryはUTC ISOで送る設計だった。API側が当初JST-like入力のみを想定していたため、UIとAPIの境界でrange filterの契約がずれた。

**簡潔解決**: UIはJST入力をUTC ISOへ変換して送信し、APIはUTC ISOを正として受け取る。防御的にJST-like入力もparseするが、仕様上の正本はUTC query + JST displayに分離する。

## L-07C-AUDIT-002: 監査ログ閲覧はraw JSON非公開をAPI契約にする

**苦戦箇所**: `before_json` / `after_json` をそのまま返すと、UIでmaskしてもDOMやnetwork payloadにPIIが残る。閲覧UIの見た目だけでmaskを担保すると、API consumerが増えたときに安全境界が崩れる。

**簡潔解決**: API responseは `maskedBefore` / `maskedAfter` と `parseError` のみを返し、raw JSONを公開しない。UI側でもDOM描画前に再maskし、API層と表示層の二段防御にする。

## L-07C-AUDIT-003: cursor paginationはorder keyを明示して再現可能にする

**苦戦箇所**: audit logは時系列降順で増え続けるため、offset paginationでは追加行によりページ境界が揺れる。cursorの中身を曖昧にするとrepository testとAPI contractが再現しづらい。

**簡潔解決**: orderを `created_at DESC, audit_id DESC` に固定し、cursorをbase64url JSON `{ createdAt, auditId }` として明記する。`limit` は `1..100`、default `50` に固定する。

## L-07C-AUDIT-004: Phase 11 visual evidenceとstaging admin E2Eを混同しない

**苦戦箇所**: ローカル静的render screenshot 7件はUI状態の証跡になるが、authenticated staging admin session + D1 fixtureの実E2E PASSではない。両者を同じPASSとして扱うと09aの責務が曖昧になる。

**簡潔解決**: Phase 11はlocal static visual evidenceとして完了し、staging admin E2E screenshotは `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` に委譲する。

## L-07C-AUDIT-005: skill feedbackは「ルール不足」と「実行漏れ」を分ける

**苦戦箇所**: Phase 12 final reviewで `quick-reference.md` の即時導線漏れを検出したが、既存skillはresource-map / quick-reference / task-workflow-activeの更新判断をすでに要求していた。これを新ルール不足として扱うと、同じ内容の規則を重複追加する。

**簡潔解決**: skill変更は不要と判断し、実行漏れとして同一waveでquick-referenceを修正する。苦戦箇所はlessonsへ記録し、skill本体は重複ルールを増やさない。
