# Phase 13: PR 作成

## メタ情報
正本: `outputs/phase-13/phase-13.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | NON_VISUAL |
| workflow_state | `implemented_local_evidence_captured` |
| PR base | `dev` |
| 実行可否 | **user-gated（本 Phase では実行しない）** |

## 目的
本ワークフローの PR 作成の多段ゲートと手順を固定する。local 実コード実装・focused tests・静的 gate は完了済みで、staging deploy / `wrangler tail` 実機確認 / commit / push / PR 作成は user-gated のため、本 Phase では**実行しない**。

## 1. PR 概要（計画）

| 項目 | 値 |
|------|------|
| base ブランチ | `dev`（開発統合ブランチ・既定） |
| 作業ブランチ | `fix/profile-session-staging-localhost-endpoint`（起点 `origin/dev` d0dd40069） |
| タイトル（案） | `fix(web): /profile transport 観測性強化 + localhost fail-closed（server_fetch_failed に transportKind/baseHost 追加）` |
| 区分 | NON_VISUAL（fetch/transport 層 + ログ・UI 表現変更なし） |

## 2. 多段ゲート（実行は user-gated）

PR 作成前に以下を順に通す。local で実行済みの gate は再実行確認対象、staging/commit/PR は user-gated とする。

| Gate | 内容 | コマンド | 状態 |
|------|------|----------|------|
| G-1 typecheck | 型チェック | `mise exec -- pnpm typecheck` | pending（user-gated） |
| G-2 lint | リント（必要時 `--fix`） | `mise exec -- pnpm lint` | pending（user-gated） |
| G-3 focused tests | T1-T5 の RED → GREEN・既存回帰ゼロ | `mise exec -- pnpm exec vitest run apps/web/src/lib/fetch/transport.spec.ts apps/web/src/lib/fetch/__tests__/transport-select.spec.ts apps/web/src/lib/fetch/authed.spec.ts apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts apps/web/src/lib/__tests__/env.spec.ts` | pending（user-gated） |
| G-4 localhost gate | 新規 localhost/8787/8888 リテラル 0 | `bash scripts/verify-no-localhost-bake.sh --src-only` | pending（user-gated） |
| G-5 script syntax | diagnose script 構文 | `bash -n scripts/diagnose-profile-session.sh` | pending（user-gated） |
| G-6 apps/api 非接触 | API surface 不変（diff 空・AC-9） | `git diff --stat -- apps/api`（空であること） | pending（user-gated） |
| G-7 PR pre-flight | docs-only gate / phase12-compliance / gate-metadata / indexes drift | `bash scripts/verify-pr-ready.sh` | pending（user-gated） |
| G-8 staging 実機ログ | `server_fetch_failed` の `{transportKind, baseHost, status}` 観測・真因確定（MT-A〜MT-D） | `bash scripts/cf.sh deploy ...` → `bash scripts/cf.sh tail ...` | pending（user-gated・DoD の一部） |

## 3. PR 作成手順（計画）

実行は user-gated。CLAUDE.md「PR作成の完全自律フロー」に従う。

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `fix/profile-session-staging-localhost-endpoint` に `dev` をマージ（コンフリクトは既定方針で自律解消）。
3. 品質検証 4 コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）+ 本タスク固有 gate（G-3〜G-6）を実行。
4. `git status --porcelain` で未コミット変更なしを確認。
5. `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得（実装 6 ファイル + テスト 5 ファイル + workflow spec）。
6. `implementation-guide.md` の Part 1 / Part 2 / 視覚証跡を PR 本文に反映。NON_VISUAL ゆえスクリーンショット専用セクションは作らない。
7. `gh pr create --base dev` で作成。

## 4. PR 本文に含める内容（計画）

- 調査結論（ユーザー疑問「localhost を見に行っていないか」→ No・根拠）。
- 新規価値（transport 可視化 + localhost fail-closed）。
- 変更ファイル（F1-F6 + T1-T5）。
- 検証結果（G-1〜G-7 の green）。
- staging 実機ログ確認（MT-A〜MT-D）の結果と真因（C1/C2/C3）確定。
- baseline 未タスク（B-1〜B-4）は既存 #1189-1192 に統合（新規起票しない）。
- 視覚証跡: UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は manual-test-result.md と focused tests（スクリーンショット専用セクションは作らない）。

## 完了条件
- [x] 多段ゲート（G-1〜G-8）を計画として固定した。
- [x] PR base = `dev`・作業ブランチ・PR 本文内容を計画として固定した。
- [x] 実行は user-gated（本 Phase では commit / push / PR を実行しない）旨を明記した。

## 成果物
- `outputs/phase-13/phase-13.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §8（検証コマンド）/ §9（DoD）
- `.claude/commands/ai/diff-to-pr.md`（Phase 13 仕様）
- `implementation-guide.md`（PR 本文反映元）

## 統合テスト連携
PR 作成前の G-8（staging 実機ログ・真因確定）が AC-1/AC-2 の最終証跡。真因確定後に該当 Issue（#1189-1192）へ根拠追記して本格修正に引き継ぐ。すべて user-gated。
