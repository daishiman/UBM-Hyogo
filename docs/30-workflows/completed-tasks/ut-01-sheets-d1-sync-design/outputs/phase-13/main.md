# Phase 13 main.md（実行時に記入）

> 本ファイルは Phase 13 のトップ index。blocked 理由 / approval status / pre-merge 進捗 / PR 情報を記録する。

## ステータス

| 項目 | 値 |
| --- | --- |
| Phase 状態 | blocked |
| user_approval_required | true |
| user 明示承認 | （実行時に記入：未取得 / 取得済 + 取得日時） |
| Issue #50 状態 | CLOSED（reopen していないこと） |
| ブランチ | （実行時に記入） |

## blocked 理由

- 本 Phase は `user_approval_required: true` のため、user の明示承認なしには `gh pr create` を実行しない
- 承認なしの場合は本ファイルとともに `local-check-result.md` / `change-summary.md` / `pr-template.md` の準備のみで停止する

## pre-merge checklist 進捗

| # | 項目 | 結果 |
| - | --- | --- |
| 1 | `mise exec -- pnpm typecheck` 成功 | （実行時に記入） |
| 2 | `mise exec -- pnpm lint` 成功 | （実行時に記入） |
| 3 | `mise exec -- pnpm indexes:rebuild` 後 git diff 空 | （実行時に記入） |
| 4 | AC-1〜AC-10 全件 PASS | （実行時に記入） |
| 5 | Phase 11 outputs = 3 点固定 | （実行時に記入） |
| 6 | Phase 12 必須 5 タスク全 PASS | （実行時に記入） |
| 7 | `workflow_state=spec_created` 据え置き | （実行時に記入） |
| 8 | Issue #50 CLOSED のまま | （実行時に記入） |
| 9 | 計画系 wording 残存 0 件 | （実行時に記入） |
| 10 | コード変更 0 行（apps / packages / skills 全部） | （実行時に記入） |
| 11 | `.claude` ↔ `.agents` mirror diff 0 行 | （実行時に記入） |
| 12 | user 明示承認取得 | （実行時に記入） |

## PR 情報（user 承認後のみ記入）

| 項目 | 値 |
| --- | --- |
| PR 番号 | （承認後に記入） |
| PR URL | （承認後に記入） |
| 作成日時 | （承認後に記入） |
| マージ戦略 | rebase merge（線形履歴 / squash 禁止） |

## CI 最終ステータス（承認後のみ）

| ジョブ | 結果 |
| --- | --- |
| typecheck | （実行時に記入） |
| lint | （実行時に記入） |
| verify-indexes-up-to-date | （実行時に記入） |

## post-merge 後続作業

- [ ] U-1〜U-10 別 issue 化判定（任意 / 必要なもののみ）
- [ ] `documentation-changelog.md` を merge commit hash / 日時で更新
- [ ] UT-09 / UT-04 への引き継ぎ通知（必要に応じて）

## 必須 outputs リンク

- [`main.md`](./main.md)（本ファイル）
- [`local-check-result.md`](./local-check-result.md)
- [`change-summary.md`](./change-summary.md)
- [`pr-template.md`](./pr-template.md)
