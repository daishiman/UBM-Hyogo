# Workflow: issue-1190-me-5xx-root-fix

`[実装区分: 実装仕様書]`（NON_VISUAL / apps/api `/me` 系 5xx の構造的根治 + 契約テスト）

## 概要

Issue [#1190](https://github.com/daishiman/UBM-Hyogo/issues/1190)「/me 5xx の根治（session-resolver / API worker / D1）」を**現行コード（HEAD 52ade3866・2026-06-12）に最適化**して根本解決する実装仕様書群。起票時の前提「真因 H4 確定までは例外箇所を特定できず着手不可（`deferred_pending_root_cause`）」は、本 WF Phase 1 の静的監査により**例外箇所が特定済み**となり解消した。グローバル `errorHandler`（`UBM-5000` problem+json + 構造化ログ）は既設である一方、(F-1) `/me/profile` 二次データの fail-soft 不統一による回避可能な全体 500、(F-2) 一次データ D1 例外の分類不足（`UBM-5001` 未使用・発生 scope 不明）、(F-3) 5xx 契約テスト不在、の 3 つが現行コードに実在する根本問題であり、これらを今回 1 サイクルで完結するスコープ（T01-T04）として仕様化した。

> 実装区分の根拠（CONST_004）: 「5xx の根治」はコード変更（fail-soft 統一・例外分類・テスト追加）なしに達成不可能なため実装仕様書（デフォルト準拠）。
>
> Issue 状態に関する注記: 2026-06-12 時点の ground truth では Issue #1190 は **OPEN**（closedAt: null）。ユーザー指示「クローズドのまま仕様書作成」に従い、Issue への mutation（コメント・ラベル・close）は一切行わない（AC-10 / user-gated）。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `docs/issue-1190-me-5xx-root-fix-spec` |
| 起点 | `origin/dev`（52ade3866）・`main`（61bd5b5a6）同期済み（祖先） |
| 種別 | existing-hardening（既存 route/middleware の防御強化・新規 endpoint なし） |
| 実装区分 | 実装仕様書（NON_VISUAL） |
| implementation_mode | `existing-hardening` |
| taskType | `implementation` |
| visualEvidence | NON_VISUAL（UI 表現変更なし・スクリーンショット不要・代替証跡は focused vitest + grep/diff + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured`（本サイクルでコード実装・ローカル検証まで完了。commit・PR は user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | #1190（OPEN・mutation 禁止） |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `phase-1.md` / `outputs/phase-1/phase-1.md` | 要件定義：Issue 再定義・現行コード監査（5xx 経路マップ P1-P8）・F-1〜F-3・AC-1〜10 |
| 2 | `phase-2.md` / `outputs/phase-2/phase-2.md` | 設計：fail-soft 境界（一次/二次データ）・ApiError 分類設計・scope context・状態所有権 |
| 3 | `phase-3.md` / `outputs/phase-3/phase-3.md` | 設計レビュー・4条件評価・Phase 4 進行判定 |
| 4 | `phase-4.md` / `outputs/phase-4/phase-4.md` | I/O 契約：エラー shape・logError payload・テスト期待値表 |
| 5 | `phase-5.md` / `outputs/phase-5/phase-5.md` + `task-01..04-*.md` | 実装手順インデックス + タスク本体（T01-T04） |
| 6 | `phase-6.md` / `outputs/phase-6/phase-6.md` | テスト拡充（D1 例外注入・回帰 guard） |
| 7 | `phase-7.md` / `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロックの line/branch） |
| 8 | `phase-8.md` / `outputs/phase-8/phase-8.md` | リファクタリング（分類 helper の純関数化検討）+ rollback |
| 9 | `phase-9.md` / `outputs/phase-9/phase-9.md` | 品質保証（typecheck/lint/focused tests・apps/web 非接触 gate） |
| 10 | `phase-10.md` / `outputs/phase-10/phase-10.md` | 最終レビュー（AC 充足・blocker） |
| 11 | `phase-11.md` / `outputs/phase-11/phase-11.md` ほか | NON_VISUAL 宣言 + 証跡計画（focused tests / grep / diff。本サイクルで取得済み） |
| 12 | `phase-12.md` / `outputs/phase-12/phase-12.md` + strict 7 | 実装ガイド・SSOT 同期・Issue 最適化草稿（T04）・未タスク検出・compliance |
| 13 | `phase-13.md` / `outputs/phase-13/phase-13.md` | PR 作成（多段ゲート・`dev` base・user-gated） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で byte-identical に保つ。設計の正本（SSOT）は `_shared-context.md`。

## 根本問題（要約 / 詳細は `_shared-context.md` §1-2）

| ID | 問題 | 根拠 |
|----|------|------|
| F-1 | `getPendingRequestsForMember` だけ fail-hard で二次データ失敗が全体 500 | `apps/api/src/routes/me/index.ts:181` |
| F-2 | 一次データ D1 例外が汎用 `UBM-5000` に丸まり scope 特定不能（`UBM-5001` 未使用） | `session-guard.ts:84-87` / `index.ts:170-175` |
| F-3 | `/me` 系 5xx の契約テスト不在 | `index.contract.spec.ts` は正常系のみ |

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 概要 |
|--------|------|------|------|
| T01 | `apps/api/src/routes/me/index.ts` | 編集 | pendingRequests の fail-soft 化（200 維持 + 構造化 logError） |
| T02 | `session-guard.ts` + `routes/me/index.ts` | 編集 | 一次データ D1 例外を `UBM-5001` + `context.scope` で分類 rethrow |
| T03 | 既存 contract spec | 編集 | D1 例外注入の契約テスト（TC-1〜TC-4）。新規 spec ファイルは作らず `apps/api/src/routes/me/index.contract.spec.ts` へ集約 |
| T04 | docs / Issue コメント草稿 | 新規（docs） | Issue #1190 現行コード最適化草稿（GitHub 反映は user-gated） |

## 不変条件（CLAUDE.md / プロジェクト準拠）

- `/me` の path・shape・status 体系（200/401/404/410/5xx）不変。意図された status を変えず「5xx の発生のしかた」だけを変える。
- D1 直接アクセスは `apps/api` に閉じる（#5）。D1 schema・Google Form 仕様変更なし。
- 不変条件 #11: memberId / email をエラー response・ログ context に露出しない。
- apps/web 非接触（web 側は 5xx degrade 済み・diff 空が DoD）。
- 新規 test は `*.spec.ts` のみ。`wrangler` 直叩き禁止（`scripts/cf.sh` 経由・user-gated）。

## 既知のスコープ外

| 事象 | 理由 / 対応先 |
|------|---------------|
| staging 実機の真因確定（MT-A〜D・wrangler tail） | user-gated。本 WF は真因確定に依存しない |
| H3（410）復帰運用 / H5（transport）根治 | #1189 系 / `profile-session-staging-transport-recovery` WF の責務 |
| Issue #1190 の close・ラベル・コメント投稿 | user-gated（AC-10） |
| `/me` 以外への同型 hardening 横展開 | 本 Issue 責務外（Phase 12 未タスク検出で記録のみ） |

## 正本順位（衝突時）

1. `_shared-context.md`（SSOT）
2. 本 `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`
4. `outputs/phase-5/task-0N-*.md`
5. `docs/00-getting-started-manual/specs/*.md`
6. Issue #1190 本文（起票時前提は監査結果で上書き）
