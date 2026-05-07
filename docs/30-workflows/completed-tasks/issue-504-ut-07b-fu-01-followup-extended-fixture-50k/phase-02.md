# Phase 2: fixture row 構造設計 / dedupe_key 採番ルール / synthetic data ポリシー

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-2/phase-2.md` |

## 目的
50,000 行 fixture の row 構造を確定し、PII / token / 実 ID を一切含まない synthetic data 採番ルールを設計する。Phase 1 の SSOT を実装可能な型・関数シグネチャまで具体化する。

## 実行タスク
1. fixture row の TypeScript 型 `Fixture50kRow` を定義（`schema_diff_queue` の column と 1:1 対応）。
2. `generateRow(index: number): Fixture50kRow` の純関数シグネチャを設計（副作用なし、入力 `index` のみで決定）。
3. dedupe_key 採番式を確定: `ubm-test-fixture-50k-${index.toString().padStart(7, "0")}-${sha256(String(index)).slice(0, 12)}`。
   - `ubm-test-fixture-50k-` prefix は count / cleanup の選択子として使う。
   - hash suffix は人間可読 prefix を保ったまま衝突耐性を補助する。
4. synthetic data ポリシー: email = `fixture-${index}@example.invalid`、name = `Fixture User ${index}`、`responseEmail` 禁止項目は明示除外。
5. SQL 出力形式を確定（`INSERT INTO schema_diff_queue (...) VALUES (...)` をバッチサイズ 500 で chunk）。

## 統合テスト連携
Phase 4 vitest で `generateRow` の決定論性（同 index → 同 row）と全 50,000 行の dedupe_key 重複ゼロを検証。

## 参照資料
- `outputs/phase-1/phase-1.md`
- `apps/api/src/repository/schemaDiffQueue.ts`

## 成果物
- `outputs/phase-2/phase-2.md`
- `outputs/phase-2/fixture-row-schema.md`

## 完了条件
- `Fixture50kRow` 型と `generateRow(index)` シグネチャが確定。
- dedupe_key 採番式 / synthetic data ポリシー / SQL chunk size が SSOT として記録。
- seed 検証と cleanup が `dedupe_key LIKE 'ubm-test-fixture-50k-%'` で同じ fixture 集合を選択できる。
- redaction 対象パターン（`@gmail` / `@senpai-lab` / `token` / `secret`）が一致しないことが採番式上保証される。
