# Phase 13: PR 作成（user 明示承認後のみ）

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 13 / 13 |
| workflow_state | implemented_local_runtime_pending |
| phase status | blocked_user_gated |
| base ブランチ | dev |
| branch | feat/members-search-clear-and-sort-ux |

## 目的

本ウェーブでコード実装とローカル検証は完了した。user の明示承認を受けてから commit・push・PR を作成する手順を確定する。現状の Phase 13 status は blocked_user_gated である。

## 実行タスク

### T13-1 PR 前提条件の確認

- Phase 5-10 のコード実装・テスト GREEN が landed していること。
- Phase 11 の VISUAL screenshot 2 枚（single-clear / four-options）が撮影され `outputs/phase-11/screenshots/` に存在すること。
- Phase 12 strict outputs 7 ファイルが揃っていること。
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が exit 0 であること。

### T13-2 PR 本文構成

- `outputs/phase-12/implementation-guide.md` の Part 1 / Part 2 を反映する。
- `outputs/phase-11/screenshots/` の 2 枚を PR 本文に参照する。
- AC-1..AC-10 の充足を記載する。
- OOS-1（五十音順未対応・Issue 起票候補）を follow-up として明記する。

### T13-3 PR 作成コマンド

- `gh pr create --base dev --head feat/members-search-clear-and-sort-ux` を user 明示承認後に実行する。

## 参照資料

- [index.md](index.md)（branch / base / AC）
- [phase-12-documentation.md](phase-12-documentation.md)（PR 本文の素材）
- [outputs/phase-12/implementation-guide.md](outputs/phase-12/implementation-guide.md)（Part 1 / Part 2）
- [outputs/phase-13/pr-creation-result.md](outputs/phase-13/pr-creation-result.md)（PR 未作成・承認待ち記録）
- `.claude/commands/ai/diff-to-pr.md`（PR 本文仕様）

## 実行手順

1. T13-1 の前提条件を全件確認する。
2. T13-2 の構成で PR 本文を組み立てる。
3. user の明示承認を取得する。
4. T13-3 のコマンドで PR を作成する。
5. PR URL を `outputs/phase-13/pr-creation-result.md` に記録する。

## 完了条件

- [ ] Phase 13 status が blocked_user_gated であることが記録されている
- [ ] PR base が dev・branch が feat/members-search-clear-and-sort-ux と確定している
- [ ] PR 本文に implementation-guide Part 1/2 と screenshot 2 枚の参照を含む構成が定義されている
- [ ] PR 作成が user 明示承認後の後続ウェーブで実行されることが明記されている
- [ ] outputs/phase-13/pr-creation-result.md に PR 未作成・承認待ちが記録されている
