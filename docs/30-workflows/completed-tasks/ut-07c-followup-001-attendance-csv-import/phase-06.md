# Phase 6 — テスト拡充

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 名前 | テスト拡充 |
| 状態 | spec_created |
| 依存 | Phase 5 |
| 入力 | outputs/phase-05/implementation-plan.md |
| 出力 | outputs/phase-06/test-augmentation.md |

## 目的

Phase 4 で定義した正常系・主要異常系に加え、fail path / 境界値 / commit semantics を追加し、
本機能の脆弱性を網羅する。

## タスク

- [ ] fail path 追加ケースを列挙する
- [ ] 境界値ケースを追加する
- [ ] dry-run 副作用なし保証のテストを追加する

## 追加テストケース

| # | 対象 | ケース | 期待 |
| --- | --- | --- | --- |
| F1 | parse-attendance.ts | malformed CSV (引用符不整合) | errors 配列に該当行が記録される |
| F2 | parse-attendance.ts | 空ファイル | rows=[], errors=[] |
| F3 | parse-attendance.ts | header のみ / data 行 0 | rows=[], errors=[] |
| F4 | import-attendance-bulk.ts | 同一 email 重複行 | 2 行目以降は `duplicate` 扱い |
| F5 | import-attendance-bulk.ts | 全角混在 email | NFKC 正規化後マッチ |
| F6 | import-attendance-bulk.ts | D1 batch 部分失敗 (chunk 2/3 で失敗) | 事前 preflight により通常経路では発生しない。mock で D1 例外を注入した場合は error を返し、成功済み chunk 分の audit_log 件数と insert 件数が一致していることを検証する |
| F7 | import-attendance-bulk.ts | dry-run で副作用なし保証 | D1 mock の write API 呼び出し 0 / audit_log 0 |
| F8 | AttendanceCsvImportPanel.spec.tsx | parsing 中の cancel | state が idle に戻る |
| F9 | attendance-import.contract.spec.ts | 境界値: 500 行ちょうど | 200 |
| F10 | attendance-import.contract.spec.ts | 境界値: 501 行 | zod 400 ではなく route 先行分岐で 413 |
| F11 | import-attendance-bulk.ts | memberId と email が別 member を指す | `invalid` + `memberId_email_mismatch` |

## 成果物

- `outputs/phase-06/test-augmentation.md`
  - 追加ケース一覧表
  - commit semantics の説明（dry-run は副作用なし保証、commit は全行 preflight ok の場合のみ insert）
  - mock 設定の補足

## 完了条件

- 追加 10 ケースすべてが緑
- 既存 Phase 4 の 14 ケースに regression なし
- D1 batch 部分失敗のシナリオが test mock で再現できている

## 注意点 / リスク

- D1 batch は全件巻き戻しを保証しない。mock では明示的に `statements[1].run()` で reject し、成功済み chunk 分の insert と audit_log 件数が一致すること、UI/API が再試行可能な失敗として表示することを検証する
- NFKC 正規化テストは UT-07b のテストヘルパーを参考にする
