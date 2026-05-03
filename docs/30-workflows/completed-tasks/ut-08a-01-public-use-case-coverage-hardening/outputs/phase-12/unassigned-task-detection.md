# Unassigned Task Detection — ut-08a-01-public-use-case-coverage-hardening

`.claude/skills/task-specification-creator/references/phase-template-phase12.md` §「設計タスク特有の未タスク検出パターン（SF-03対応）」に従い、4 パターン照合を実施した結果を全パターン列挙する。本タスクは `taskType: implementation` だが、SF-03 は責務分離スキャンとして全タスクで実施するため適用する。

## SF-03 4 パターン照合

### パターン 1: 型定義 → 実装乖離

| 項目 | 内容 |
| --- | --- |
| 該当 | なし |
| 該当なし理由 | UT-08A-01 で新規導入した型は `PublicD1MockOptions` のみで、テストヘルパー `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` 内で `createPublicD1Mock` が直接消費する。型定義とランタイム実装が同一ファイルに配置されており、ハンドラ側未実装は構造的に発生しない。既存 use-case 4 本（`getFormPreviewUseCase` / `getPublicMemberProfileUseCase` / `getPublicStats` / `listPublicMembersUseCase`）の型と実装は本タスク以前に完了しており、本タスクはテスト追加のみ。 |
| 根拠 | `outputs/phase-12/implementation-guide.md` §「主要シグネチャ」、追加ファイル一覧 |

### パターン 2: 契約 → テスト乖離

| 項目 | 内容 |
| --- | --- |
| 該当 | なし |
| 該当なし理由 | 本タスクの目的そのものが「既存 public use-case 4 本 + public route 4 endpoint の契約に対するテスト追加」であり、テスト不足を解消する側のタスク。新規契約を導入していないため「契約定義したがテストなし」の発生余地がない。focused vitest 17/17 PASS で既存契約の充足を確認済。 |
| 根拠 | `outputs/phase-12/implementation-guide.md` §「実装結果 → 検証結果」、`apps/api/src/use-cases/public/__tests__/`、`apps/api/src/routes/public/index.test.ts` |

### パターン 3: UI 仕様 → コンポーネント乖離

| 項目 | 内容 |
| --- | --- |
| 該当 | なし |
| 該当なし理由 | 本タスクは apps/api 配下のテスト追加のみで、apps/web の React コンポーネント / UI route / UI 仕様には一切触れていない（visualEvidence: NON_VISUAL）。UI 仕様の差分自体が存在しないため、コンポーネント未実装の派生未タスクは発生しない。 |
| 根拠 | `outputs/phase-12/implementation-guide.md` §「変更対象ファイル」（apps/api 限定）、`outputs/phase-12/main.md` `visualEvidence: NON_VISUAL` |

### パターン 4: 仕様書間差異 → 設計決定未確定

| 項目 | 内容 |
| --- | --- |
| 該当 | なし |
| 該当なし理由 | 本タスクで参照する仕様書群（`docs/00-getting-started-manual/specs/01-api-schema.md` / `03-data-fetching.md`、`.claude/skills/aiworkflow-requirements/references/api-endpoints.md` / `task-workflow-active.md`）間で public use-case の挙動について矛盾はなく、`existsPublicMember` の eligible 条件（`public_consent='consented' / publish_state='public' / is_deleted=0`）も `member_status` schema と一意に整合する。`schemaAliasAssign` timeout は本タスクの仕様間差異ではなく、apps/api 全体の独立した実行時リスクとして `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` で別途追跡されており、UT-08A-01 のスコープ外。 |
| 根拠 | `outputs/phase-12/implementation-guide.md` §「設計上の判断」、`.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` Gate Boundary 段落 |

## 結論

**0 件、SF-03 確認済。**

CONST_007 に従い、public use-case 4 本、route handler test、coverage evidence、aiworkflow-requirements 正本同期 4 ファイルを同一実装サイクルで完了した。新規未タスクの起票は不要。`schemaAliasAssign` timeout 起因の全体 coverage 取得未完は既存追跡 (`ut-web-cov-05-followup-post-wave2-gap-analysis`) に委譲済で、本タスクからの新規派生未タスクではない。
