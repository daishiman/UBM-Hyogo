# Phase 1: 要件定義

`[実装区分: 実装仕様書 / implementation_mode: verify_existing + コード変更 1 点]`

## 1.1 タスク分類

- **タスク種別**: 実装タスク（bugfix close-out / production rollout）。
- **VISUAL 判定**: `VISUAL_ON_EXECUTION`。コード成果物は config 1 行変更で UI 描画変更はないが、根本問題の証明に `/members` の browser smoke screenshot（runtime 実行時）が必須のため VISUAL とする。
- **docs-only か実装仕様書か**: **実装仕様書**。`apps/api/wrangler.toml` のコード変更を伴い（CONST_004）、CONST_005 必須項目（変更ファイル・シグネチャ・入出力・テスト・実行コマンド・DoD）を各 Task 仕様に記載済み。

## 1.2 背景（current facts / 2026-05-30 調査）

- GitHub Issue #998 は **CLOSED**（`gh issue view 998 --json state` で確認）。PR 文脈は `Refs #998` のみを使い、再 close / reopen を発生させない。
- 原 issue #998 のコード実装（diagnostics / auto-publish policy / backfill endpoint / ops scripts）は親ワークフロー `members-not-displaying-form-sync-investigation`（`completed-tasks/`・`implemented_local_runtime_pending`）で**完了済み**。Gate-A / Gate-B PASSED。
- 根本問題「form 回答済み会員が `/members` に出ない」は runtime レベルで残存:
  1. local config は production `MEMBERS_AUTO_PUBLISH_ON_CONSENT = "true"`（`apps/api/wrangler.toml:72`）へ変更済み。ただし production deploy 未実行のため runtime 反映は Gate-C pending。
  2. 既存 record は backfill apply しない限り `publish_state='member_only'` 滞留。

## 1.3 既存コード命名規則（分析記録）

| 対象 | 命名規則 | 例 |
|------|---------|-----|
| policy 関数 | camelCase | `decidePublishState`, `isAdminOverrideStatus`, `normalizePublishState` |
| route export | camelCase + `Route` 接尾 | `adminSyncBackfillPublishStateRoute`, `adminSyncDiagnosticsRoute` |
| env var | UPPER_SNAKE | `MEMBERS_AUTO_PUBLISH_ON_CONSENT`, `SYNC_ADMIN_TOKEN` |
| publish_state canonical | snake / 小文字リテラル | `public` / `member_only` / `hidden` |
| ops script | kebab-case `.sh` | `diagnose-members-pipeline.sh`, `backfill-publish-state.sh` |

> 本タスクは flag 変更のみで新規シンボルを追加しないため、命名 drift リスクは無い（既存規則をそのまま使用）。

## 1.4 受入条件（Acceptance Criteria）

| ID | 条件 | 検証 Phase |
|----|------|-----------|
| AC-1 | production `wrangler.toml` の `MEMBERS_AUTO_PUBLISH_ON_CONSENT` が `"true"` | Phase 10（local） |
| AC-2 | 既実装 4 spec が回帰なく green（typecheck/build 含む） | Phase 10（local） |
| AC-3 | staging deploy → backfill apply → `/members` 復旧の evidence 取得 | Phase 11（runtime, user-gated） |
| AC-4 | production deploy → backfill apply → `/members` 復旧の evidence 取得 | Phase 11（runtime, user-gated） |
| AC-5 | admin override（hidden）が backfill で誤公開されない | Phase 11（spot check） |
| AC-6 | evidence に secret 非混入 | Phase 11（redaction grep） |

## 1.5 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在 | Yes（flag 以外は実装済み） | Phase 5 は flag 変更 + diff check / regression |
| upstream にマージ済み | Yes（親 workflow は dev/main 反映済み） | 再実装不要・回帰確認のみ |
| 前提タスク完了 | Yes（親 Gate-A/B PASSED） | 依存解消タスク不要 |

→ `implementation_mode: "verify_existing"`。Phase 5 は新規実装ではなく flag 変更 + 既実装回帰。

## 1.6 スコープ

### 含む
- production flag enablement（`apps/api/wrangler.toml` コード変更）。
- 既実装の回帰確認。
- staging / production runtime 検証 runbook の確定。

### 含まない
- 新 endpoint 追加・D1 schema 変更・migration 追加・Google Form schema 変更・公開フィルタ変更（不変条件）。
- commit / push / PR（user-gated）。Issue #998 は CLOSED 維持。
- runtime ops の**実行**（本サイクルでは runbook 確定のみ。実行は user-gated）。

## 1.7 inventory（成果物一覧）

- 設計: index.md, phase-01..03。
- 実装仕様: phase-04..10, tasks/A-B-C。
- 検証/エビデンス: phase-11-evidence-inventory.md, outputs/phase-11/manual-test-result.md。
- Phase 12 strict 7: outputs/phase-12/*。
- Phase 13: phase-13-commit-pr-draft.md。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 1（要件定義） |
| 実装区分 | 実装仕様書 |
| implementation_mode | verify_existing + コード変更1点 |
| 対象 issue | #998（CLOSED / Refs only） |

## 目的

issue #998 の根本問題と現状（コード実装済み・runtime 未反映）を確定し、production rollout を含む受入条件・スコープ・命名規則を固定する。

## 実行タスク

1. issue #998 のコード実装状況を current facts として確定する。
2. production flag deploy 未反映と既存 record 滞留の 2 残存原因を特定する。
3. 受入条件 AC-1..6 と P50 チェックを記録する。

## 参照資料

- `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/`（親ワークフロー）
- `apps/api/wrangler.toml`（flag 正本）
- `apps/api/src/lib/policies/auto-publish.ts`

## 成果物

- 本 `phase-01-requirements.md`（受入条件・スコープ・命名規則・P50）。

## 完了条件

- [x] 受入条件 AC-1..6 が記録されている。
- [x] implementation_mode が verify_existing と判定されている。
- [x] スコープの含む/含まないが明記されている。

## 統合テスト連携

本タスクは既存 endpoint surface のみ利用し新規結合点を追加しない。結合検証は Phase 6 の 4 focused spec（policy/backfill/diagnostics/sync）と Phase 11 の runtime smoke（staging→production の `/members` 表示）で担保する。
