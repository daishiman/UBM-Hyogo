# Phase 3: タスク分割 / 設計レビュー

## 3.1 タスク分割（単一責務 / CONST_007 準拠）

| Task | 責務（単一） | 実装区分 | 依存 | 実行サイクル |
|------|------------|---------|------|------------|
| [Task A](tasks/task-a-production-flag-enablement.md) | production flag enablement + 既実装回帰確認 | 実装仕様書（コード変更 1 点 + verify_existing） | なし | 実装サイクル内 |
| [Task B](tasks/task-b-staging-runtime-verification.md) | staging runtime 検証 runbook | 実装仕様書（runtime-ops / user-gated） | Task A | user-gated runtime |
| [Task C](tasks/task-c-production-runtime-rollout.md) | production runtime rollout runbook | 実装仕様書（runtime-ops / user-gated） | Task A + Task B evidence | user-gated runtime |

## 3.2 CONST_007 スコープ判定

- Task A（`wrangler.toml` 1 行 + 回帰確認）は実装サイクル（`03.実装.md`）の 1 サイクル内で完了可能。**先送りなし**。
- Task B/C の runtime ops は user-gated。これは「分量が多い」「念のため」ではなく、**Cloudflare secret + 本番 D1 mutation を伴う本質的な user-gated 分離**（原 issue #998 でも `governance_mutation_user_gate=true` で明示）。runbook は本サイクルで確定し、実行のみ承認待ちとする。
- → CONST_007 例外条件「今回サイクル内完了が技術的に破綻する明確な理由（runtime mutation の承認待ち）」に該当。実施時期=ユーザー承認時、実施場所=本ワークフロー Task B/C runbook、と明記済み。

## 3.3 設計レビュー（Phase 4 へ進む判定）

| 観点 | 判定 | 根拠 |
|------|------|------|
| 価値性 | ✅ | 本番公開ディレクトリ復旧（誰の=会員・公開閲覧者、何を=可視性） |
| 実現性 | ✅ | コードは実装済み・変更は flag 1 行に収束 |
| 整合性 | ✅ | 公開フィルタ不変・admin override 保護・状態所有権が D1 に閉じる |
| 運用性 | ✅ | dry-run + approval marker + redaction grep + rollback 手順で監査運用が閉じる |

→ **Phase 4 へ進行可**。

## 3.4 conditional implementation 注記

backfill dry-run の結果、`candidates=0`（既に全件 public 化済み、または昇格対象なし）の場合:
- apply はスキップしてよい（no-op）。
- その場合は `/members` 非表示の別原因（H1 ingest / H2 identity / H4 schema）を疑い、親ワークフローの該当 CLOSED issue（#956/#957/#959）の runtime ops を参照する。
- 本ワークフローでは UI / API への追加実装は行わず、別原因が判明したら follow-up として切り出す（Phase 12 unassigned-task-detection で記録）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 3（タスク分割 / 設計レビュー） |
| タスク数 | 3（Task A/B/C） |

## 目的

単一責務原則で Task A/B/C を分割し、CONST_007 スコープ判定と 4 条件で Phase 4 進行可否を判定する。

## 実行タスク

1. Task A/B/C を単一責務で分割し依存関係を定義する。
2. CONST_007 スコープ判定（先送りなし / user-gated 分離の妥当性）を記録する。
3. 4 条件（価値性/実現性/整合性/運用性）で設計レビューする。

## 参照資料

- `tasks/task-a-production-flag-enablement.md` / `task-b-staging-runtime-verification.md` / `task-c-production-runtime-rollout.md`
- `index.md`（スコープ表）

## 成果物

- 本 `phase-03-task-breakdown.md`（タスク分割・CONST_007 判定・設計レビュー）。

## 完了条件

- [x] Task A/B/C が単一責務で分割されている。
- [x] CONST_007 判定が記録されている。
- [x] 4 条件レビューで Phase 4 進行可と判定されている。

## 統合テスト連携

Task A→B→C の直列依存により、staging evidence なしに production を実行しない安全順序を強制する。結合の最終確認は Phase 11 の production smoke。
