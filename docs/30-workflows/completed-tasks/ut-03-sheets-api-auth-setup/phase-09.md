# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |

## 目的

typecheck / lint / test / build / coverage / secret hygiene / 不変条件 #5 / Cloudflare 無料枠の 8 項目を検査し、本タスクが production ready であることを確定する。すべて `mise exec --` 経由で再現可能なコマンドで実施する。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-09/main.md | 8 項目チェック表（コマンド + 結果） |
| outputs/phase-09/free-tier-estimation.md | Cloudflare / Sheets API 無料枠想定 |
| outputs/phase-09/secret-hygiene.md | Service Account JSON の混入防止チェックリスト |

## 完了条件

- [ ] 全 8 項目が PASS
- [ ] coverage が Phase 4 目標値を満たす
- [ ] `wrangler` 直接実行コマンドが成果物に含まれない
- [ ] `.env` 実値が成果物・log に含まれない
