# Phase 6 成果物: 異常系テスト実行結果 (anomaly-test-result.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 6 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 実機実施区分 | docs-only タスクのため、実環境テストは将来タスク (future-file-upload-implementation Phase 6 再生時) で実施 |

## 1. 実行サマリ

| FC | カテゴリ | 期待挙動定義 | mitigation 記録 | spec_created 完了状態 |
| --- | --- | --- | --- | --- |
| FC-01 | CORS 違反 | preflight 403 | AllowedOrigins 追加手順 | PASS（手順定義済） |
| FC-02 | Token 権限不足 | HTTP 403 | 専用 Token 採用 / Edit 付与 | PASS（手順定義済） |
| FC-03 | 無料枠超過 | 仕様引用済 | UT-17 連携 / 月次手動 | PASS（MINOR 申し送り） |
| FC-04 | バインディング誤設定 | bucket not found | binding-name-registry.md 正本化 | PASS |
| FC-05 | apps/web 混入 | grep 検出 | Pre-commit hook 申し送り | PASS（MINOR 申し送り） |
| FC-06 | ロールバック実機 | 全削除成功 | rollback-procedure.md 検証 | PASS（手順定義済） |

## 2. 各 FC の詳細結果

### FC-01: CORS 違反

| 項目 | 値 |
| --- | --- |
| 実機実行 | 未実施（spec_created） |
| 手順検証 | PASS（anomaly-test-cases.md FC-01 参照） |
| 期待結果 | preflight OPTIONS 失敗 / Access-Control-Allow-Origin ヘッダ不一致 |
| Mitigation | AllowedOrigins 追加 + `wrangler r2 bucket cors put` 再適用 |
| AC 対応 | AC-5 PASS |

### FC-02: 権限不足 Token

| 項目 | 値 |
| --- | --- |
| 実機実行 | 未実施 |
| 手順検証 | PASS |
| 期待結果 | HTTP 403 unauthorized |
| Mitigation | Edit 権限付与 / 専用 Token 採用案D |
| AC 対応 | AC-3 PASS |

### FC-03: 無料枠超過仕様

| 項目 | 値 |
| --- | --- |
| 実機実行 | 不実施（仕様確認のみ） |
| 仕様引用 | Cloudflare 公式 R2 pricing ドキュメント |
| 期待挙動 | Storage 超過時書き込み拒否 / Class A/B 上限で throttling |
| Mitigation | UT-17 で 80% 自動通知 / 未着手期間は月次手動確認 |
| AC 対応 | AC-6 PASS（MINOR: UT-17 未着手） |
| 申し送り先 | Phase 12 implementation-guide / unassigned-task-detection.md |

### FC-04: バインディング誤設定

| 項目 | 値 |
| --- | --- |
| 実機実行 | 未実施（dry-run 手順定義） |
| 手順検証 | PASS |
| 期待結果 | `bucket not found` または `binding mismatch` エラー |
| Mitigation | binding-name-registry.md を正本として参照 |
| AC 対応 | AC-2 / AC-7 PASS |

### FC-05: apps/web への混入検出

| 項目 | 値 |
| --- | --- |
| 実機実行 | 検証コマンドは記載済（grep） |
| 手順検証 | PASS |
| 期待結果 | grep 出力なし |
| Mitigation | Pre-commit hook 導入を Phase 12 unassigned-task-detection.md に登録 |
| AC 対応 | 不変条件 5 防衛 |

### FC-06: ロールバック実機テスト

| 項目 | 値 |
| --- | --- |
| 実機実行 | 未実施（テスト手順定義済） |
| 手順検証 | PASS |
| 期待結果 | rollback-procedure.md S-1〜S-3 全成功 / 5 分以内 |
| Mitigation | 失敗時は rollback-procedure.md に追記 |
| AC 対応 | 運用性 PASS |

## 3. FC × AC 対応表（再掲）

| FC | AC | 充足状態 |
| --- | --- | --- |
| FC-01 | AC-5 | PASS |
| FC-02 | AC-3 | PASS |
| FC-03 | AC-6 | PASS（MINOR） |
| FC-04 | AC-2 / AC-7 | PASS |
| FC-05 | 不変条件 5 | PASS |
| FC-06 | 運用性 | PASS |

## 4. 申し送り事項（Phase 12）

- **M-3 (Phase 6 由来)**: Pre-commit hook での `apps/web` R2 混入検出を unassigned-task-detection.md に登録
- **M-4 (Phase 6 由来)**: UT-17 着手まで FC-03 の通知系は月次手動確認 → implementation-guide に手順記載

## 5. 残存リスク

- spec_created タスクのため**実環境での FC 実施は将来タスクで再生**する必要あり
- 将来タスクでの実機 FC 結果が本書を上書きする
- production 環境への破壊的操作は将来タスクでも禁止

## 6. 完了条件チェック

- [x] FC-01〜FC-06 の結果が記録（spec_created として手順定義 PASS）
- [x] FC × AC 対応表が最新
- [x] mitigation が各ケースに記録
- [x] Phase 12 申し送り事項が整理
- [x] 残存リスクが明記
