# Phase 13: PR 作成

## メタ情報
正本: `outputs/phase-13/phase-13.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | `implementation` |
| workflow_state | `implemented_local_evidence_captured` |
| PR base | `dev` |
| 実行可否 | **G1 は本サイクルで完了。G2-G4 は user-gated・未実行** |

## 目的
本ワークフローの外部反映（コード実装 → commit/push/PR → Issue mutation → staging 検証）を多段ゲート G1-G4 として固定する。本サイクルで G1（ローカル実装・検証）は完了。G2-G4 は user-gated・未実行。各ゲートはユーザーの明示承認後にのみ進める。

## 1. 多段ゲート（G1 完了 / G2-G4 user-gated）

| Gate | 内容 | 承認対象 | 状態 |
|------|------|----------|------|
| **G1: ローカル実装レビュー** | T01-T03 のコード実装（`apps/api/src/routes/me/index.ts` / `session-guard.ts` / 既存 `index.contract.spec.ts`）+ focused vitest（TC-1〜TC-4）+ API typecheck/lint + grep gate + diff 証跡取得（MT-1〜MT-4） | ローカル実装と検証結果確認 | **passed（本サイクルで実行済み）** |
| **G2: commit + push + PR 承認** | `git commit` / `git push` / `gh pr create --base dev`。CLAUDE.md「PR作成の完全自律フロー」に従う | 外部リポジトリへの反映 | **pending（user-gated・未実行）** |
| **G3: Issue mutation 承認** | `issue-1190-comment-draft.md` の #1190 への投稿。ラベル変更・close の要否判断 | GitHub Issue への mutation（AC-10） | **pending（user-gated・未実行）** |
| **G4: staging 検証承認** | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（MT-5）+ `cf.sh tail` での `UBM-5001` + scope 実機確認（MT-6） | 不可逆な deploy と実機操作 | **pending（user-gated・未実行）** |

> 順序は G1 → G2 → G3 → G4 を既定とする（G3 は実装完了の根拠を持って投稿するため G2 以降を推奨。G4 は dev マージ後の staging 反映に合わせてもよい）。各ゲートを飛ばす・並べ替える場合はユーザー判断による。

## 2. PR 概要（計画）

| 項目 | 値 |
|------|------|
| base ブランチ | `dev`（開発統合ブランチ・既定） |
| 作業ブランチ | `docs/issue-1190-me-5xx-root-fix-spec` |
| タイトル（案） | `fix(api): /me 5xx の構造的根治 — pendingRequests fail-soft 統一 + D1 例外の UBM-5001/scope 分類 + 契約テスト (#1190)` |
| 区分 | NON_VISUAL（apps/api エラーハンドリング・ログ・テストのみ・UI 表現変更なし） |

## 3. PR 作成手順（計画・G2 で実行）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチに `dev` をマージ（コンフリクトは CLAUDE.md 既定方針で自律解消）。
3. 品質検証（`mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/me/index.contract.spec.ts` / `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/api lint`）+ 本タスク固有 gate（grep gate / `git diff --stat -- apps/web` 空）を実行。
4. `git status --porcelain` で未コミット変更なしを確認。
5. `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得（production 2 + contract spec 1 + workflow docs + skill ledgers）。
6. `implementation-guide.md`（Part 1 / Part 2 / 視覚証跡）を PR 本文に反映。NON_VISUAL ゆえスクリーンショット専用セクションは作らない。
7. `gh pr create --base dev` で作成。

## 4. PR 本文に含める内容（計画）

- Issue #1190 の現行コード最適化（deferred ブロッカー解消の根拠 = P1-P8 経路マップ・F-1〜F-3 再定義）。
- 変更内容（T01 fail-soft 統一 / T02 `UBM-5001` + scope 分類 / T03 契約テスト TC-1〜TC-4）と不変条件（`/me` status 体系・shape 不変、apps/web 非接触、#11）。
- 検証結果（focused vitest / typecheck / lint / grep gate / diff 証跡の green）。
- 視覚証跡: UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `manual-test-result.md` と focused vitest（スクリーンショット専用セクションは作らない）。
- Issue mutation（G3）と staging 検証（G4）の残ゲート状況。

## 完了条件
- [x] G1（ローカル実装レビュー）は本サイクルで完了し、G2（commit+push+PR）/ G3（Issue mutation）/ G4（staging 検証）は user-gated として固定した。
- [x] 外部操作ゲート G2-G4 が未実行である旨を明記した。
- [x] PR base = `dev`・タイトル案・PR 本文内容を計画として固定した。

## 成果物
- `outputs/phase-13/phase-13.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §6（検証コマンド）/ §7（DoD）/ §4（AC-10）
- `.claude/commands/ai/diff-to-pr.md`（Phase 13 仕様）
- `../phase-12/implementation-guide.md`（PR 本文反映元）/ `../phase-12/issue-1190-comment-draft.md`（G3 投稿草稿）
- `../phase-11/manual-test-result.md`（MT-1〜MT-6・G1/G4 の証跡手順）

## 統合テスト連携
G1 の focused vitest（TC-1〜TC-4）全緑が AC-1〜AC-5/AC-8 の証跡正本。G4 の staging 実機確認（`UBM-5001` + scope ログ）が運用上の最終確認。G2-G4 は user-gated であり、本サイクルでは実行していない。
