# Phase 12: メイン

## メタ情報
正本: `outputs/phase-12/main.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | `implementation` |
| visualEvidence | NON_VISUAL（証跡は focused vitest + grep gate + diff + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_mode | `existing-hardening`（既存 route/middleware の防御強化・新規 endpoint なし） |
| 想定 PR base | `dev` |

## 1. サマリ

Issue #1190「/me 5xx の根治（session-resolver / API worker / D1）」を**現行コード（HEAD 52ade3866・2026-06-12）に最適化**して根本解決する実装仕様書群（Phase 1-13）を作成した。起票時のブロッカー `deferred_pending_root_cause`（「真因 H4 が staging で確定し例外箇所が特定されてから着手」）は、本 WF Phase 1 の静的監査により **5xx 発生経路が P1-P8 マップとして特定済み**となり解消した。

再定義された根本問題は (F-1) `/me/profile` 二次データの fail-soft 不統一（`getPendingRequestsForMember` だけ fail-hard で全体 500）、(F-2) 一次データ D1 例外の分類不足（既定義 `UBM-5001` 未使用・発生 scope 不明）、(F-3) 5xx 契約テスト不在、の 3 つ。タスクは T01（fail-soft 統一・200 維持）/ T02（`UBM-5001` + `context.scope` 分類 rethrow・status 体系不変）/ T03（D1 例外注入契約テスト TC-1〜TC-4）/ T04（Issue #1190 最適化草稿）で 1 本サイクル完結（CONST_007）。

本サイクルは**コード実装・ローカル検証まで完了**（`implemented_local_evidence_captured`）。focused vitest は実行済み。commit・push・PR・staging deploy・Issue mutation は user-gated（AC-10）。

## 2. 変更ファイル分類

| 分類 | ファイル | 状態 |
|------|----------|------|
| workflow spec（本サイクル作成） | `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/**`（`_shared-context.md` / index.md / phase-1..13 / outputs / artifacts.json） | implemented_local_evidence_captured |
| 実装対象（本サイクル実装） | `apps/api/src/routes/me/index.ts`（T01 fail-soft + T02 builder 分類）/ `apps/api/src/middleware/session-guard.ts`（T02 分類） | 実装済み |
| テスト対象（本サイクル実装） | `apps/api/src/routes/me/index.contract.spec.ts`（D1 failure proxy + TC-1〜TC-4 追記。新規 spec ファイルなし） | 実装済み |
| apps/web（非接触） | `apps/web/**` | 非接触（diff 空が DoD・AC-6） |
| 不変（利用のみ） | `apps/api/src/middleware/error-handler.ts` / `packages/shared/src/errors.ts`（`UBM-5001` 既定義）/ `packages/shared/src/logging.ts` | 無変更（既設インフラを利用） |
| Issue 草稿（T04） | `outputs/phase-12/issue-1190-comment-draft.md` | 作成済み（投稿は user-gated） |
| skill / requirements 同期 | `.claude/skills/task-specification-creator/**` / `.claude/skills/aiworkflow-requirements/**` | 同一サイクルで反映済み（skill feedback promotion、quick-reference、resource-map、task-workflow-active、artifact inventory、changelog） |

## 3. 本 WF の新規価値（既存にない差分のみ）

1. **deferred ブロッカーの静的解消** — 「例外箇所が特定されてから着手」を staging 実機待ちにせず、現行コード監査（P1-P8 経路マップ・行番号実測検証済み）で解消した。真因が H4 でなくても F-1〜F-3 は実在する欠陥であり、解消すれば再発時に worker ログ 1 件（`UBM-5001` + scope）で即時確定できる。
2. **回避可能な全体 500 の根治設計** — 二次データ（pendingRequests）の D1 例外でマイページ全体が 500 になる経路（P4）を、既存前例（photoUrl / editResponseUrl）と同方針の fail-soft（200 + `{}`）へ統一する。
3. **5xx 契約の固定** — D1 例外注入時の problem+json shape / status / fail-soft 挙動を契約テスト（TC-1〜TC-4）で固定し、`/me` の status 体系（200/401/404/410/5xx）不変を機械検証可能にする。

## 4. user-gated 境界

本 wave で実施済み: Phase 1-13 仕様書・`_shared-context.md`（SSOT）・strict Phase 12 成果物・T04 草稿・`artifacts.json` ⇔ `outputs/artifacts.json`。

依然 user-gated（本 wave で未実施）:

- staging deploy・staging実機ログ確認（Phase 13 G4）
- commit / push / PR 作成（Phase 13 G2）
- Issue #1190 への mutation（コメント投稿・ラベル変更・close。草稿は `issue-1190-comment-draft.md`）（Phase 13 G3）
- staging deploy・`cf.sh tail` 実機確認（MT-5/MT-6）（Phase 13 G4）

## 完了条件
- [x] サマリ・変更ファイル分類（計画含む）・新規価値・user-gated 境界を記録した。

## 成果物
- `outputs/phase-12/main.md`（本ファイル）

## 参照資料
- `../../_shared-context.md`（SSOT §1 再定義 / §2 経路マップ / §3 タスク分解）
- `implementation-guide.md` / `unassigned-task-detection.md` / `issue-1190-comment-draft.md`

## 統合テスト連携
Phase 11 の証跡計画（TC-1〜TC-4 + MT-1〜MT-6・local present/staging pending）と Phase 13 の PR 計画（G1-G4）を引き継ぐ。
