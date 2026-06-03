# Phase 13: PR

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 13 / 13 |
| 名称 | commit / push / PR |
| status | **blocked**（commit / push / PR は user-gated・未実施）|
| base ブランチ | dev |
| work ブランチ | feat/sidebar-footer-pinning-and-account-popover-ux |
| created_at | 2026-06-02 |

> 本タスクは **implemented_local_evidence_captured**。実コードは本サイクルで実装済み。本 Phase の commit / push / PR / screenshot 取得は **user 明示承認後のみ** 実施する。現時点では PR ドラフトの整備までを行い、実 git/gh 操作は行わない（blocked）。

## 目的

Phase 1-12 で固定した実装仕様と Phase 12 成果物を前提に、実装サイクル完了後に作成する PR の本文ドラフト・base ブランチ・タイトル案・変更ファイル一覧・テスト結果欄を準備する。commit / push / PR 作成は user-gated のため本 Phase では実行しない。

## 実行タスク

| Task | 内容 | 状態 |
|------|------|------|
| Task 13-1 | base=dev / work=feat ブランチ・PR タイトル案の確定 | [x] ドラフト確定 |
| Task 13-2 | 4 concern サマリ + 変更ファイル一覧 + テスト結果欄を含む PR 本文ドラフト作成 | [x] ドラフト確定 |
| Task 13-3 | `outputs/phase-13/pr-creation-result.md` に blocked 記録 + ドラフトを保存 | [x] 作成済 |
| Task 13-4 | commit / push / `gh pr create` の実行 | [ ] **blocked（user-gated・未実施）** |
| Task 13-5 | Phase 11 screenshot（staging 認証必須）取得と PR 本文への添付 | [ ] **blocked（user-gated・未実施）** |

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`（PR 本文 Phase 13 仕様）
- Phase 1-3（要件 / C1-C4 設計 / レビュー）/ Phase 12 implementation-guide.md
- `index.md`（AC-1〜AC-6 / scope 8 ファイル）
- `artifacts.json`（phase 13 status=blocked / blockedReason="commit, push, PR are user-gated"）

## 実行手順

1. 実装サイクルが完了し apps/web の差分が確定したら、`git status --porcelain` で全変更を確認する（user 承認後）。
2. `git fetch origin dev` → ローカル dev を fast-forward 同期 → work ブランチへ merge（user 承認後）。
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` を実走する（user 承認後）。
4. Phase 11 screenshot を staging で取得し `outputs/phase-11/` に保存後、PR 本文へ参照を追加する（user 承認後）。
5. `gh pr create --base dev` で本ドラフトを本文に PR を作成する（user 承認後）。

> 1〜5 はすべて **user 明示承認後** に実施する。本 implemented_local_evidence_captured サイクルでは未実行（blocked）。

## 統合テスト連携

- PR 作成前提として、実装サイクルで Phase 4 targeted vitest（`SidebarShell.spec` / `SidebarUserMenu.spec` / `SidebarNavItem.spec` / `SidebarShell.server.spec` / `useSidebarState.spec` / `PublicFooter.spec` / `(public)/layout.spec`）が green であることを PR テスト結果欄に転記する。
- `verify-design-tokens` gate（HEX 直書き 0 件・AC-5）の結果を PR に含める。

## 多角的チェック観点（AIが判断）

- **運用性**: base は必ず `dev`（production リリース時のみ `dev → main`）。本タスクは feature → dev。
- **境界**: commit / push / PR / screenshot は user-gated。implemented_local_evidence_captured 段階で実 git 操作を行わない。
- **整合性**: PR 本文の変更ファイル一覧は artifacts.json `scope_files`（8 ファイル）と 1:1 一致させる。

## サブタスク管理

| Task | 状態 |
|------|------|
| 13-1 ブランチ / タイトル案 | [x] |
| 13-2 PR 本文ドラフト | [x] |
| 13-3 pr-creation-result.md | [x] |
| 13-4 commit/push/PR 実行 | [ ] blocked |
| 13-5 screenshot 取得・添付 | [ ] blocked |

## 成果物

- `outputs/phase-13/pr-creation-result.md`（blocked 記録 + PR 本文ドラフト）

## 完了条件

- [x] base=dev / work=feat / PR タイトル案を確定した
- [x] 4 concern サマリ + 変更ファイル一覧 + テスト結果欄を含む PR 本文ドラフトを作成した
- [x] `outputs/phase-13/pr-creation-result.md` に blocked 記録を保存した
- [ ] commit / push / PR 作成（**user-gated・未実施**）
- [ ] Phase 11 screenshot 取得・添付（**user-gated・未実施**）

## タスク100%実行確認【必須】

- [x] 実行可能タスク（13-1〜13-3 = ドラフト整備）を完了
- [x] user-gated タスク（13-4 / 13-5）を blocked として明示
- [x] base=dev / status=blocked が artifacts.json と整合

## ワークフロー完了

Phase 1-12 の仕様書本文と Phase 12 必須 6 成果物・Phase 13 ドラフトが揃い、**implemented_local_evidence_captured ワークフローとして close-out 可能**。実コード実装・commit・push・PR・screenshot は user 明示承認後の本サイクルで実施する。
