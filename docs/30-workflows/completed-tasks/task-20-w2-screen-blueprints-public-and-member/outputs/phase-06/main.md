# Phase 06 — 異常系検証

状態: `COMPLETED`
正本: `../../phase-06.md`

## 検出対象異常パターン

| # | 異常 | 検出方法 | 対応 |
| --- | --- | --- | --- |
| E1 | コピー原文ドリフト | `grep` で prototype 内文字列と spec 内文字列を比較 | 一致まで再転記 |
| E2 | API 表ドリフト | §X.4 method × endpoint × route が現行 API 正本と不一致 | apps/api / apps/web BFF / aiworkflow-requirements を正本として書き換え |
| E3 | 視覚値混入 | grep `#[0-9a-fA-F]{3,8}` / `oklch\(` / `[0-9]+px` / `bg-\[` | token 名 link に置換、視覚値は除去 |
| E4 | login 5+1 状態欠落 | §1.3 mermaid に `input` / `sent` / `unregistered` / `deleted` / `rules_declined` / `error` 全数 | 不足状態を mermaid に追記 |
| E5 | 不採用要素混入 | §99 表に TweaksPanel / theme switcher / AvatarStoreProvider#localStorage / GAS 由来 | 4 行揃いを確認 |
| E6 | mermaid 構文エラー | `stateDiagram-v2` 構文 / `[*] -->` / `-->` arrow 揃い | mermaid lint（手動目視）で修正 |

## 結果

09e / 09f は E1〜E6 すべて PASS。phase-09 の grep gate result.md にも反映。
