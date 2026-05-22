# Phase 06: 異常系検証

state: COMPLETED

## 異常系シナリオと対応

| シナリオ | 対応 | 文書箇所 |
| --- | --- | --- |
| OKLch 非対応ブラウザ（Safari < 15.4 等） | sRGB fallback `@supports not (color: oklch(0% 0 0))` で hex 値提示 | §3.5 / §10 |
| theme 上書き漏れ（stone のみ定義し warm/cool 漏れ） | 3 theme 全 token を §3.4.1〜§3.4.3 で網羅必須 | §3.4 |
| dark mode 値未定 | placeholder のみ、値は別 workflow で確定 | §11 |
| `--ubm-*` 以外の prefix 混入 | grep gate で 0 件確認 | Phase 9 verify |
| zone token 値の独立定義 | MVP では status alias で統一、独立値は scope out | §3.3 / §4.4 |
| JSON 内 trailing comma | jq parse で fail 検出 | Phase 4 Layer 2 |

## 結論

異常系すべてが文書側で対応済み、Phase 11 evidence で確認可能。
