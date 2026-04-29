## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | task-04a-followup-005-tags-bulk-fetch-n-plus-1-prevention |
| タスク名     | tags 一括取得の N+1 防止（multi-member 対応） |
| 分類         | パフォーマンス / D1 クエリ最適化 |
| 対象機能     | members list の tag 取得経路 |
| 優先度       | 低（要件発生待ち） |
| 見積もり規模 | 小規模 |
| ステータス   | 未実施 |
| 発見元       | 04a Phase 12 |
| 発見日       | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a 時点では `/public/members` は member ごとに必要最小限の field のみを返し、tag を expand しない。member 単体プロフィールでは 1 member 分の tag 取得で問題ない。

### 1.2 問題点・課題

- 将来 members list に tag expand 要望が出ると、N+1 クエリ（member 件数分の tag SELECT）になり、limit=100 のページで 1 + 100 クエリが走る。
- D1 read コスト増 + レスポンスタイム増。

### 1.3 放置した場合の影響

- 06a / 07a 等で「members list に tag を出したい」要望が来たとき、安易に loop 内 SELECT を入れる実装になりやすい。

---

## 2. 何を達成するか（What）

### 2.1 目的

members list で複数 member の tag を取得する場合に、`WHERE memberId IN (?, ?, ...)` の単一クエリで取得する helper を `apps/api/src/repository/_shared/` 配下に整備する。

### 2.2 含まないもの

- 04a のレスポンス schema 拡張（tags expand）そのものは別タスクで仕様化する
- tag 編集系の changes

---

## 3. どのように実行するか（How）

### 3.1 trigger 条件

- members list 系 endpoint で tag expand 要望が出たとき

### 3.2 推奨アプローチ

`getTagsByMemberIds(memberIds: string[]): Map<memberId, Tag[]>` の bulk fetch helper を実装し、view-model builder で member ごとに引き当てる。

---

## 4. 完了条件チェックリスト

- [ ] bulk fetch helper が実装され unit test 緑
- [ ] N+1 が起きないことを explain analyze 等で確認
- [ ] 不変条件 #15（削除済み除外）等の filter が helper 経路でも適用される

---

## 5. 参照情報

- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/unassigned-task-detection.md`（U-5）
- `apps/api/src/repository/publicMembers.ts`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
