# members-not-displaying-form-sync-investigation

`[実装区分: 実装済み / workflow_state: implemented_local_runtime_pending]`

本ファイル群は「原因確認 + 解消」の実装仕様とローカル実装エビデンスである。診断 API 拡張、`public_consent='consented'` に基づく `publish_state='public'` 自動昇格 policy、既存 record backfill endpoint/script はローカル実装済み。Cloudflare staging deploy、staging 診断/backfill apply、`/members` browser smoke、commit/PR は user-gated runtime ops として残る。

## 背景

ユーザー報告: staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` が「0 件中 0 件表示」「該当するメンバーがいません」となる。一方で Google Form (`formId=119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`) には実回答が複数件入っており、リンク済み Spreadsheet (`10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw`) でも確認できる。フォーム→公開メンバー一覧までの連携が機能していない。

スクリーンショットでは Browser Console / Network はクリーン（4xx/5xx エラーなし）。つまり `apps/web` 側は API レスポンスを正しく扱っており、`/api/public/members` が **空配列を返している**のがほぼ確実。

## 既存資産

| Artifact | Path | 状態 |
|----------|------|------|
| 診断基盤 (Spec-A) | `apps/api/src/diagnostics/forms-pipeline.ts`, `member-diagnosis.ts` | 完了 (CLOSED google-form-reflection-diagnostics) |
| Spec-B FU-001 H1 ingest 修復 | Issue #956 | CLOSED (skill 反映済) |
| Spec-B FU-002 H2 identity 再構築 | Issue #957 | CLOSED |
| Spec-B FU-003 H3 publish_state UX | Issue #958 | CLOSED |
| Spec-B FU-004 H4 schema alias | Issue #959 | CLOSED |
| DB default | `apps/api/migrations/0002_admin_managed.sql:9` `publish_state NOT NULL DEFAULT 'member_only'` | 既存 |
| 公開フィルタ | `apps/api/src/routes/public/publicMembers.ts:37-40` `WHERE public_consent='consented' AND publish_state='public' AND is_deleted=0` | 既存 |

H1-H4 followup は全て CLOSED だが、**staging runtime の data state は不明** (sync 実走確認 / publish_state 分布 / public_consent 分布 が未取得)。本ワークフローはまず diagnosis を強制し、確定した原因に対して残存コード gap を埋めるサイクルとして組む。

## スコープ（タスク分割）

| Task | 概要 | 実装区分 | スコープ |
|------|------|---------|---------|
| [Task A](tasks/task-a-runtime-diagnosis.md) | staging 診断 API を叩き H1-H4 のどれが原因か確定 | 実装仕様書（ops script 追加） | `scripts/diagnose-members-pipeline.sh` 追加 + `apps/api/src/diagnostics/forms-pipeline.ts` / `apps/api/src/diagnostics/schema.ts` のレスポンスに不足項目を追記 |
| [Task B](tasks/task-b-auto-publish-on-consent.md) | `public_consent='consented'` の sync 時に `publish_state='public'` を自動設定するポリシー切替 (feature flag) | 実装仕様書 | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/lib/policies/auto-publish.ts`（新規）+ env `MEMBERS_AUTO_PUBLISH_ON_CONSENT` |
| [Task C](tasks/task-c-backfill-existing-records.md) | 既存 staging records の publish_state を policy に従い backfill する idempotent ops script | 実装仕様書（ops script + dry-run 必須） | `scripts/backfill-publish-state.sh` + `apps/api/src/routes/admin/sync-backfill-publish-state.ts` |

> **CONST_007 準拠**: 3 タスクとも同一サイクル内でローカル実装済み。Phase 12 strict 7、aiworkflow-requirements 同期、Gate-B local verification まで完了。staging runtime 操作は Gate-C として user-gated に明示する。
>
> **Conditional Implementation**: Task A の診断結果に応じた分岐は実装プロンプト側 (`03.実装.md`) で扱う。Task B/C は H3 が原因の場合の主修復、H1/H2/H4 が原因と判明した場合はそれぞれの既存 CLOSED workflow の runtime ops（secret 投入 / backfill 等）を再走させる。診断スクリプト自体（Task A）は全分岐共通で必須なので無条件実装。

## Phase 1-13

| Phase | File | 担当 |
|-------|------|------|
| 1 | [phase-01-requirements.md](phase-01-requirements.md) | 要件 |
| 2 | [phase-02-architecture.md](phase-02-architecture.md) | アーキ |
| 3 | [phase-03-task-breakdown.md](phase-03-task-breakdown.md) | タスク分割 |
| 4 | [phase-04-data-contract.md](phase-04-data-contract.md) | データ契約 |
| 5 | [phase-05-implementation-guide.md](phase-05-implementation-guide.md) | 実装ガイド |
| 6 | [phase-06-test-strategy.md](phase-06-test-strategy.md) | テスト戦略 |
| 7 | [phase-07-quality-gates.md](phase-07-quality-gates.md) | 品質ゲート |
| 8 | [phase-08-dod.md](phase-08-dod.md) | DoD |
| 9 | [phase-09-risks.md](phase-09-risks.md) | リスク |
| 10 | [phase-10-local-verification.md](phase-10-local-verification.md) | ローカル検証 |
| 11 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | エビデンス |
| 12 | [phase-12-compliance.md](phase-12-compliance.md) | 適合性 |
| 13 | [phase-13-commit-pr-draft.md](phase-13-commit-pr-draft.md) | commit/PR draft |
