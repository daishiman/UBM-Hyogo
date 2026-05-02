# Phase 5: 実装手順

[実装区分: 実装仕様書 / NON_VISUAL]

> 本 Phase はランブックである。実行は本仕様書の責務外。後続実装者が次の手順をそのまま実行できるレベルで記述する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 5 |
| status | `done` |

## 目的

実装 follow-up で実行する編集手順と検証手順を再現可能にする。

## 実行タスク

- `database-schema.md` の正本文言を適用する。
- migration コメント編集の可否を判定し、可能な場合のみ 0001 / 0005 のコメントを整合させる。
- Phase 11 evidence を取得する。

## 参照資料

- `phase-02.md`
- `phase-04.md`
- `phase-06.md`

## 統合テスト連携

本 Phase 自体では実行しない。実装 follow-up で Phase 11 の `quality-gates.md` に typecheck / lint / build 結果を記録する。

## ステップ 1: 仕様書ブランチで作業確認

```bash
git status --short
git branch --show-current   # docs/issue-196-response-email-unique-ddl-spec を想定
```

## ステップ 2: `database-schema.md` を編集

対象: `.claude/skills/aiworkflow-requirements/references/database-schema.md`

行 50 (`member_responses`) の説明を以下で置換:

```
| `member_responses` | `response_id` 単位の履歴。`response_email` は system field として列に保存し、`answers_json` / `raw_answers_json` / `extra_fields_json` も保持する。`response_email` 列に UNIQUE 制約は付与しない（履歴行のため同値重複を許容する。正本 UNIQUE は `member_identities.response_email` 側） |
```

行 51 (`member_identities`) の説明を以下で置換:

```
| `member_identities` | `response_email` ごとの identity。最新 `submitted_at`、同値時は `response_id` 降順で `current_response_id` を更新する。`response_email` は本テーブルにて `NOT NULL UNIQUE`（`apps/api/migrations/0001_init.sql` で宣言）であり、システム全体の **正本 UNIQUE** 所在である |
```

## ステップ 3: `0001_init.sql` のコメント追記

対象: `apps/api/migrations/0001_init.sql`

行 54 (`response_email TEXT,`) を含む列定義の直前に SQL コメント行を挿入（または既存末尾コメントに追記）:

```sql
  -- NOTE: response_email に UNIQUE は付与しない。member_responses は履歴行のため
  --       同一 email で複数 row を許容する。正本 UNIQUE は member_identities.response_email
  --       （本 file 行 90 付近）に存在する。
  response_email             TEXT,
```

行 90 (`response_email TEXT NOT NULL UNIQUE,`) 直前に SQL コメント行を挿入:

```sql
  -- NOTE: 正本 UNIQUE。response_email の一意性はここで保証する。
  --       member_responses 側には UNIQUE を付与しない（履歴行のため）。
  response_email      TEXT NOT NULL UNIQUE,
```

## ステップ 4: `0005_response_sync.sql` の文言整合

対象: `apps/api/migrations/0005_response_sync.sql` 行 7

```sql
-- 2. member_identities.response_email は 0001_init.sql で正本 UNIQUE が宣言済み（再宣言・再付与なし）。
```

## ステップ 5: 検証コマンド実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Phase 4 検証 1 / 2 を実行
grep -n "正本 UNIQUE" .claude/skills/aiworkflow-requirements/references/database-schema.md
grep -n "正本 UNIQUE" apps/api/migrations/0001_init.sql
git diff main -- apps/api/migrations/0001_init.sql | grep -E '^[+-][^-+]' | grep -vE '^[+-]\s*--' | grep -vE '^[+-]\s*$' || echo "no semantic diff"
```

## ステップ 6: 成果物確認

- 編集ファイル 3 件すべてに上記テンプレが反映されている
- `git diff --stat` で 3 ファイル以下（必要なら `database-schema.md` 内の主要 UNIQUE 一覧節更新を含めて 4 件まで）

## DoD（Definition of Done）

- [ ] `pnpm typecheck` exit=0
- [ ] `pnpm lint` exit=0
- [ ] `grep "正本 UNIQUE" database-schema.md` ヒット

## 完了条件

- [x] 実装手順が順序付きで定義されている
- [x] DoD が定義されている
- [ ] `grep "正本 UNIQUE" 0001_init.sql` ヒット
- [ ] SQL semantic diff が空
- [ ] AC-1〜AC-9 が個別チェックで満たされている

## 成果物

- `outputs/phase-05/main.md`: 本ランブックのコピー
