# Phase 7: correlate.ts 実装（v1 + v2 group merge）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |
| 実装区分 | 実装仕様書（pure function 拡張） |

## 目的

`apps/api/src/audit-correlation/correlate.ts` の `groupByActor` 関数を拡張し、record 間で `record.fingerprintHashes.v1` と他 record の `fingerprintHashes.v2` が一致した場合に「同一 actor」として group merge する。これにより rotation 期間を跨ぐ HIGH alert 検知（IP 急変等）が分裂しない連続性を担保する。既存の HIGH severity 判定（時系列順 IP 変化検知）は無変更とし、副作用なしを維持する。

## 実行タスク

詳細は `outputs/phase-7/phase-7.md` を正本とする。

## 統合テスト連携

- Phase 4 で設計した「v1+v2 mix の HIGH alert 連続性」シナリオが本 Phase の契約。
- v1-only / v2-only / v1+v2 mix の 3 ケースで group の merge 結果が一致することを確認する。
- group merge ロジックが O(N) 程度で済むよう、v1/v2 hash の逆引き Map を 1 pass で構築する。

## 参照資料

- `outputs/phase-7/phase-7.md`
- `apps/api/src/audit-correlation/correlate.ts`
- index.md「目的」項 3 / 「苦戦箇所・知見」項 1（IP 急変検知との両立）

## 成果物

- `outputs/phase-7/phase-7.md`
- `apps/api/src/audit-correlation/correlate.ts` の group merge 拡張仕様（実装は Phase 13 まで保留）

## 完了条件

- v1 ↔ v2 hash 逆引き Map のデータ構造が確定。
- 既存 HIGH severity 判定が無変更であることが明記。
- pure function（外部 I/O 禁止）の不変条件が明記。
- merge 結果がストリーム順序と独立に決定論的であることが test 観点として記載。
