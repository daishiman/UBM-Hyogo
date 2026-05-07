# Followup タスクディレクトリ命名規則

## 形式
`<親wave>-<実行順レター>-<topic-kebab-case>`

例: `06b-A-me-api-authjs-session-resolver`

## ルール

1. **親wave**: 既存 wave 番号（`05a` `05b` `06a` `06b` `06c` `07a` `07b` `07c` `08a` `08b` `09a` `09b` `09c` `meta`）。新規 follow-up は所属する親 wave に従う。

2. **実行順レター**: A から開始し、依存順に B、C、D... と進める。同じ親 wave 内で:
   - A が最先行（他に依存しない or 親 wave 本体だけに依存）
   - B は A の後続
   - C は B の後続（必要なら）
   - 真に並列実行可能でも sort 順を維持するため任意順で A/B/C... と振る

3. **アルファベット順 = 実行順** の原則:
   - `ls` で sort された結果がそのまま topological execution order になること
   - クロス wave の場合: `06b-X` < `06c-Y`（lexicographic）なので 06b 系が先に完了してから 06c 系へ進む
   - これにより `Depends On` / `Blocks` の整合とディレクトリ並びが自然に一致する

4. **mode キーワードを名前に含めない**: 旧形式の `-parallel-` `-serial-` は廃止。並列可否は `Depends On` / `Blocks` でのみ判定する。

5. **topic 部分**: kebab-case、`<役割>-<対象>-<動作>` の語順。3〜6 単語が目安。

## アンチパターン

- `06b-followup-001-parallel-...`（旧形式。`-followup-` `-parallel-` は禁止）
- 数字枝番 `001/002`（sort 上は OK だが「並列だと誤解」を招くため非推奨）
- 親 wave letter のスキップ（A → C のように B を飛ばさない）

## 既存 wave との整合
本規則は 2026-05-01 以降の new follow-up に適用。既存の親 wave（05a/05b/06a/06b/06c/...）のディレクトリ自体は本規則に該当せず、これまでのまま。

## 参照
- `_templates/task-index-template.md`: index.md 章立て
- `_templates/artifacts-template.json`: artifacts.json スキーマ
- `_templates/phase-template-app.md`: phase ファイル必須セクション
