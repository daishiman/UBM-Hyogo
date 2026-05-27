# Unassigned task detection

## Scan result

`/admin/members` プロトタイプ準拠化 + 404 fix のスコープに対し、本 followup で未拾い上げのタスクが残っていないかを検査。

| 候補 | 判定 | 理由 |
|------|------|------|
| 他 admin route の同様プロトタイプ準拠化（dashboard / tags / schema 等） | out-of-scope | スコープ宣言済み（独立 followup として別途発行） |
| `apps/web` から D1 直接アクセス化で 404 回避 | rejected | 不変条件 #5 違反 |
| 新 endpoint `/admin/members/v2` 追加 | rejected | 不変条件 #1 違反 |
| pill-nav primitive の global 適用 | rejected | 本 followup の AC は `/admin/members` 局所適用のみ。global rollout はスコープ拡張であり、今回の問題解決に不要 |
| CSV エクスポート / Forms 取り込みの actual 実装 | out-of-scope | AC は prototype action row の表示のみ。実動作は MVP 範囲外で、`disabled + title` 表示により誤操作を防ぐ |

unassigned-task = 0 件。上記 2 件は「未着手の残タスク」ではなく、今回 AC から明示的に外した非目標であるため backlog / Issue 化しない。
