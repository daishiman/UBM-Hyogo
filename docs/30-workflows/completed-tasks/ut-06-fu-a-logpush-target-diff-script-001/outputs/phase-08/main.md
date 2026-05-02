# Phase 8 成果物: リファクタリング

## 関数分離の最終形 (SRP)

| 関数 | 責務 | 配置 | I/O |
| --- | --- | --- | --- |
| `parse_args` | CLI 引数解析 + usage + バリデーション | `observability-target-diff.sh` | side-effect: グローバル変数 + exit |
| `cf_call` | `bash scripts/cf.sh` 唯一の呼び出し点 (allowlist) | 同上 | external (cf.sh) |
| `toml_get` / `toml_has_section` | wrangler.toml 限定の小型 parser | 同上 | 純粋 (file → stdout) |
| `fetch_r1_workers_logs` / `fetch_r2_tail` / `fetch_r3_logpush` / `fetch_r4_analytics` | 4 軸ごとの取得 | 同上 | I/O (toml + cf_call) |
| `classify_axis` | 軸ごとの diff 分類 | 同上 | 純粋 (string × string → string) |
| `format_md` / `format_json` | 出力整形 | 同上 | 純粋 |
| `redact_stream` / `redact_string` | redaction 適用 | `scripts/lib/redaction.sh` | 純粋 (stdin → stdout) |
| `log` / `warn` / `err` | stderr ログ (redaction 通過必須) | 同上 | side-effect: stderr |

## 行数バジェット
- `scripts/observability-target-diff.sh`: ~ 180 行
- `scripts/lib/redaction.sh`: ~ 40 行
- 合計 ~ 220 行 (Phase 8 budget = 250 行以内)

## bypass 経路 0 件 (再点検)
- script 内の出力は `printf '%s\n' "$out" | redact_stream` のみ (main 末尾)
- `format_md` / `format_json` は内部で出力せず文字列を返すのみ
- `log` / `warn` / `err` は redact_stream を経由する pipe を使用
- 直 `echo` / 直 `printf` で stderr / stdout に書き出す経路: usage の `cat <<EOF >&2` のみ (固定文字列で token を含まないため redaction 不要)

## shellcheck pass
- `bash -n` syntax check: PASS
- `shellcheck` 実行は CI 設定に依存。手動実行で Phase 9 に引き継ぎ。

## golden 一致 (リファクタ前後)
- 出力フォーマットの安定化済み: 各セクション固定順 `R1 → R2 → R3 → R4 → Diff summary`
- `tests/golden/diff-mismatch.md` との byte-level 一致は本実装で確認済み

## 不変条件
- 挙動変更なし: integration / unit テストすべて PASS
- redaction bypass 0 件
- HTTP method GET only (script に POST/PUT/DELETE/PATCH リテラル 0 件、コメントを除く)
