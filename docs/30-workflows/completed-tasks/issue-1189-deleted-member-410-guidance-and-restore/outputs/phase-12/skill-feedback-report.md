# Phase 12: skill フィードバックレポート（skill-feedback-report）

本タスク（issue #1189 起点の implementation / VISUAL workflow）で得た知見を 3 観点で記録する。

## 観点 1: テンプレート改善

**知見: implementation target が明確な VISUAL workflow で local code が実装済みになったら、Phase 10〜12 の plan-only 文言を同一 wave で撤回する必要がある。**

今回の automation-30 検証で、root `artifacts.json` は `implemented_local_evidence_captured` へ更新済みなのに、`index.md` / Phase 11 / Phase 12 compliance が `spec_created` / 後続実装のまま残っていた。
これは既存 `task-specification-creator/references/phase12-skill-feedback-promotion.md` の Same-Wave Implementation Evidence Reclassification Gate に該当するため、テンプレート新設ではなく既存 gate の適用漏れとして同一 wave 修正した。

Routing: `task-specification-creator` への新規昇格は **no-op**。既存 gate で十分。
Evidence: 本ファイル、`phase12-task-spec-compliance-check.md`、`documentation-changelog.md`。

## 観点 2: ワークフロー改善

**知見: restore UI の focused test は `useAdminMutation` mock ではなく、実 hook + fetch mock で契約を固定する方が漏れが少ない。**

初期 `MemberDrawer.restore.spec.tsx` は `useAdminMutation` を丸ごと mock していたため、Phase 4/6 に列挙された confirm cancel、409、404、network、loading 二重送信を検証できていなかった。
実 hook を通し、外部 I/O のみ `fetch` mock にすることで、success toast、`FetchAuthedError` status mapping、in-flight guard、button loading state を実装に近い形で固定できた。

Routing: domain-specific lesson として aiworkflow artifact inventory に記録。
Evidence: `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx`。

## 観点 3: ドキュメント改善

**知見: VISUAL task は staging が user-gated でも、local static PNG を同一 cycle で作れるなら作成し、staging pending と分離する。**

local focused tests は 24 tests PASS。追加で Playwright static local contract により PNG 3 点を `outputs/phase-11/screenshots/` へ保存した。
staging D1 mutation と authenticated screenshot は user-gated で未実行のため、workflow state は `implemented_local_evidence_captured`、
local visual artifact は `present`、staging runtime は `pending_user_gate` と分けて記録した。
「local 実装済み」「local static visual present」「staging runtime 未取得」は矛盾ではなく、Phase 11 evidence inventory で別行に分けるべき境界である。

Routing: aiworkflow artifact inventory に記録。task-spec template 追加は no-op（Phase 11 two-tier status rule 既存）。
Evidence: `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/screenshot-plan.json`, `outputs/phase-11/screenshot-coverage.md`, `outputs/phase-11/screenshots/phase11-capture-metadata.json`。
