# Phase 6 成果物 — 異常系・回帰テスト拡充

## 1. 異常系テストケース TC-E01〜TC-E05

| TC | 対象関数 | 異常系入力 | 期待挙動 | AC |
| --- | --- | --- | --- | --- |
| TC-E01 | main | 3 ソースのいずれか不在（ENOENT） | 例外を握り潰さず decisive log + 非ゼロ exit（誤 pass 防止） | AC-7 |
| TC-E02 | parseInventoryRows / reconcile | 棚卸し表 state 列が未知語 | `state:"unknown"` 正規化 + warn にとどめ FAIL させない（誤 fail 防止・R-3） | AC-3/AC-4 |
| TC-E03 | parseWranglerBindings | binding 行なし / 空 TOML / block ヘッダのみ | 当該 block 無視・例外なし・空抽出 | AC-1 |
| TC-E04 | parseWranglerBindings | env-prefix 重複（片方コメントアウト） | `{name,kind}` 1 エントリ集約 + `applied` OR（誤 pass 防止） | AC-1/AC-5 |
| TC-E05 | parseWranglerBindings / parseInventoryRows | 壊れた table 行 / 不正 block 行 | 該当行スキップ・throw なし・整合行のみ抽出 | AC-1 |

> phase-06.md「異常系・境界テストケース TC-E01〜TC-E05」を正本とする。

## 2. 誤 fail / 誤 pass の境界判断

- **ENOENT = fail（TC-E01）**: 正本が読めない＝drift 不在を断定不能 → 非ゼロ exit。沈黙 pass を防ぐ。
- **unknown state = warn（TC-E02）**: 自由記述の厳格パースで誤 fail しない。ただし `active` 行の orphan 検出（AC-4）は維持。
- **空 / 壊れた行 = skip（TC-E03/E05）**: 部分抽出で堅牢化。1 行の破損で全 gate を誤 fail させない。
- **env-prefix 重複 = OR 集約（TC-E04）**: `applied` は OR（片 env だけ適用済みでも applied:true）で誤 pass を防ぐ。

## 3. 設計目標

実 drift（MEMBER_PHOTOS 欠落 = TC-06）は確実に検出しつつ、表記揺れ・空 block・壊れた行で誤 fail / 誤 pass しない。TC-E01 のみ非ゼロ exit、TC-E02〜E05 は誤検出抑制方向の guard。

## 4. 結論

TC-E01〜TC-E05 が誤 fail（unknown / 空 / 破損）と誤 pass（ENOENT / 片 env 適用）の両方向を guard。Phase 7 AC カバレッジマトリクスへ。
