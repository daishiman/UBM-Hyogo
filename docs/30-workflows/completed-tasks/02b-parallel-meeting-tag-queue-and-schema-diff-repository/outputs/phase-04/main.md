# Phase 4: テスト戦略 — main

## テスト方針
- **unit / contract**: vitest + 軽量 fake D1。SQL 文字列とパラメータ・状態遷移ロジックを検証
- **PK 制約**: fake D1 が unique 違反時に D1 と同等の error を投げ、`addAttendance` が `{ ok:false, reason:"duplicate" }` で受ける
- **無料枠**: `EXPLAIN QUERY PLAN` 確認は手動 smoke (Phase 11)

## レイヤ
| レイヤ | 内容 | ツール |
| --- | --- | --- |
| 純粋関数 | `transitionStatus` 許容遷移マップ | vitest |
| repository contract | 各関数が想定 SQL / パラメータを発行 | vitest + spy fake D1 |
| 制約検証 | PK 重複・latest active 1 件・queued ソート | fake D1 in-memory |
| AC マッピング | AC-1〜AC-9 を test に対応付け | Phase 7 で集約 |

## カバレッジ目標
- repository.ts 各関数 100%（分岐含む）
- 状態遷移マトリクス 全パス
