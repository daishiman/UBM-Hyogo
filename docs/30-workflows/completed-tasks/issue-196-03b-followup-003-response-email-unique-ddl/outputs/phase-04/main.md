# Phase 4: テスト戦略

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 4 |
| status | `done` |

## 目的

コメント / spec 文言のみの変更を安全に検証するため、実行コマンドと期待結果を定義する。

## 実行タスク

- grep / SQL semantic diff / typecheck / lint の検証手段を定義する。
- migration hash drift 確認を Phase 6 / Phase 11 に接続する。

## 参照資料

- `phase-02.md`
- `phase-06.md`
- `apps/api/migrations/0001_init.sql`

## 統合テスト連携

新規テスト追加は不要。既存 typecheck / lint と Phase 11 の NON_VISUAL smoke evidence で確認する。

## 検証方法

スキーマ変更を伴わないため、ユニットテスト追加は不要。代わりに次の grep / static check と既存の type/lint gate を検証手段とする。

### 検証 1: 共通語彙の存在 grep

```bash
# 正本 UNIQUE 文言が spec doc に存在することを確認
grep -n "正本 UNIQUE" .claude/skills/aiworkflow-requirements/references/database-schema.md
grep -n "member_identities.response_email" .claude/skills/aiworkflow-requirements/references/database-schema.md

# 正本 UNIQUE 文言が 0001 SQL コメントに存在することを確認
grep -n "正本 UNIQUE" apps/api/migrations/0001_init.sql

# 0005 既存コメントが共通語彙に揃っていること
grep -n "正本 UNIQUE\|再宣言" apps/api/migrations/0005_response_sync.sql
```

期待: 各コマンドが 1 行以上ヒットし、文言が Phase 2 のテンプレートと一致する。

### 検証 2: SQL semantics 不変

```bash
# コメント以外の SQL 行に差分がないこと（コメント行と空白行を除外して diff）
git diff main -- apps/api/migrations/0001_init.sql | grep -E '^[+-][^-+]' | grep -vE '^[+-]\s*--' | grep -vE '^[+-]\s*$'
```

期待: 出力が空（コメント以外の追加/削除なし）。

### 検証 3: type / lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: exit=0。

### 検証 4: migration hash drift（Phase 6 へ移譲）

D1 既適用環境で migration hash drift が発生しないこと。詳細手順は Phase 6。

## 追加テストファイル

なし（既存 unit / integration test に対する新規追加なし）。

## 完了条件

- [x] 検証 1〜3 のコマンド・期待結果が定義されている
- [x] 既存 test suite を破壊しない（spec / コメント編集のみ）
- [x] Phase 6 への migration hash 検証移譲が明示されている

## 成果物

- `outputs/phase-04/main.md`: 本テスト戦略のコピー
