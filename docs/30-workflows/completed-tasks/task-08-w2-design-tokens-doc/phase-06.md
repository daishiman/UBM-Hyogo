# Phase 6: 異常系検証

実装区分: ドキュメントのみ仕様書

## 異常系シナリオと対応

### 1. OKLch 非対応ブラウザでの色化け

| 状況 | 対応 |
| --- | --- |
| Safari < 15.4 / iOS Safari < 15.4 等の OKLch 非対応 | §3.5 で `@supports not (color: oklch(0% 0 0))` ブロック内に sRGB 近似 HEX を提供 |
| 近似値の精度不足で意図と乖離 | `task-09` 適用時に Culori / `colorjs.io` で gamut-mapped 再計算する旨を §3.5 末尾で明記 |

### 2. 3 テーマで上書き漏れ

| 状況 | 対応 |
| --- | --- |
| warm/cool で `ok/warn/danger/info` を上書きしていない | プロトタイプ準拠で **stone と共通**として §3.4 末尾に注記。「上書き漏れではなく仕様」と明記 |
| warm/cool で surface / text / border の一部が抜ける | §3.4.2 / §3.4.3 表は元仕様 §4.3 の行数（warm 12 行 / cool 12 行）を最低保証 |

### 3. JSON / CSS 二重メンテによる drift

| 状況 | 対応 |
| --- | --- |
| §9 inline JSON と §3.4 値表で値が乖離 | §9 を正本とし、§3.4 / §10 は派生位置付け（§1.1 で明文化） |
| MVP 後に generator 化したいが手動転記中に typo | Phase 9 cross-check で `oklch(...)` リテラル単位の双方向 grep を実施 |

### 4. dark mode 実装着手時に値未定で停止

| 状況 | 対応 |
| --- | --- |
| 後続 task が `[data-theme="dark"]` 値を要求 | §11 placeholder のみ提示。値確定は別 workflow と明記。`09-ui-ux.md` §6 「dark MVP 非対応」と整合 |

### 5. 命名衝突

| 状況 | 対応 |
| --- | --- |
| 既存 Tailwind / Radix / shadcn が同名 var を持つ | `--ubm-*` 専用 prefix で衝突回避。Phase 9 grep gate で `--ubm-` 以外の token 宣言を 0 件保証 |
| 旧プロトタイプ `--bg` / `--text` / `--accent` の残置 | 本ファイル正本化時に rename。task-09 で `tokens.css` に転記する際は新名のみ |

### 6. zone 色の独自値要求（将来）

| 状況 | 対応 |
| --- | --- |
| zone a..e に独自 OKLch 値が必要 | §3.3 alias 構造により、`--ubm-color-zone-*` のみ書き換えれば全画面追随 |

### 7. 行数オーバー / アンダー

| 状況 | 対応 |
| --- | --- |
| 380 行未満で章立てスカスカ | §3.4 値表 / §9 JSON / §10 テンプレ を密度のある転記で埋める |
| 540 行超で冗長 | §10 の説明文を簡潔化、§3.5 fallback の例示数を抑える |

### 8. JSON parse 失敗

| 状況 | 対応 |
| --- | --- |
| inline JSON のカンマ抜け / 引用符抜け | Phase 9 で `jq .` exit 0 を必須化。失敗時は markdown 修正 |
| `{color.status.info}` 参照 token が Style Dictionary 構文非対応 | MVP は手動でも OK。Style Dictionary 採用時は `value: "{color.status.info}"` のまま resolver に解釈させる |

## 完了条件

- [ ] 異常系 8 シナリオすべてに対応方針が定義
- [ ] 対応方針が §3〜§11 のいずれかと紐付いている
- [ ] Phase 9 検証ゲートで機械化可能な項目が grep / jq で表現されている
