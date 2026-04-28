# PR Template Draft — task-github-governance-branch-protection

> 本テンプレは **草案**。ユーザー承認後、`feature/* → dev` の PR 作成時に使用する。
> dev でのレビュー完了後、`dev → main` に昇格させる際にも同テンプレを基に再記述する。

---

## Title（70 文字以内）

```
docs(governance): branch protection / squash-only / auto-rebase 草案を追加
```

## Summary（3〜5 bullet）

- GitHub branch protection JSON 草案（dev / main 差分込み）を `outputs/phase-2/` に追加
- squash-only マージポリシー、auto-rebase workflow、pull_request_target safety gate の草案を文書化
- 横断依存（conflict-prevention / git-hooks / worktree / permissions）との整合を Phase 3 / 10 で検証済み
- docs-only / NON_VISUAL / spec_created — 実コード変更ゼロ
- 後続実装タスクで `gh api` 適用と Workflow push を実施予定

## Test plan（docs-only のため文書整合チェック）

- [ ] `phase-01.md` 〜 `phase-13.md` のメタ情報テーブルが artifacts.json と一致
- [ ] 各 `outputs/phase-N/` 配下の成果物が phase-XX.md の「成果物」欄と一致
- [ ] 横断依存 4 タスクへの参照リンク切れなし
- [ ] Phase 13 outputs（main / change-summary / pr-template）が user_approval_required を明示
- [ ] 全 phase-XX.md 末尾に「ユーザー承認なしの commit / push / PR 作成を行わない」記載あり
- [ ] `branch protection JSON` 草案に `required_pull_request_reviews` / `required_status_checks` / `allow_squash_merge` の指定がある
- [ ] auto-rebase workflow と `pull_request_target` safety gate が、それぞれの権限制限を明記している

## レビュアー指定方針

| マージ先 | 必要レビュー人数 | 指定方針 |
| --- | --- | --- |
| `feature/* → dev` | 1 名 | docs オーナー（仕様策定者）1 名 |
| `dev → main` | 2 名 | docs オーナー + インフラ責任者（CODEOWNERS で明示） |

## 昇格手順（dev → main）

1. dev での staging 検証完了（本タスクは docs-only のためリンク・整合チェックのみ）
2. 2 名の approve 取得
3. squash merge で main へ昇格
4. main 反映後、後続実装タスクで branch protection JSON を `gh api` 適用

## 禁止事項

- ユーザー承認なしの commit / push / PR 作成
- 草案 JSON / Workflow をそのまま本番ブランチ（main）へ直接適用すること
- `wrangler` 直接実行（`scripts/cf.sh` 経由必須）
