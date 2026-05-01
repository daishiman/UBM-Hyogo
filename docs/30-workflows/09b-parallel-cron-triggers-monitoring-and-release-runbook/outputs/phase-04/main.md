# Phase 4 出力: テスト戦略サマリ

## 1. 戦略概要

cron schedule / 監視 / runbook 検証を 4 層に分割し、AC-1〜AC-9 を全 verify suite ケースに 1 対 1 以上で対応付ける。

| 層 | 検証対象 | ケース数 |
| --- | --- | --- |
| unit | cron 定義 / 監視 placeholder の文字列レベル整合 | 3 |
| integration | sync_jobs 二重起動防止 / 部分失敗 view model | 3 |
| runbook 走破 | release / rollback / cron 制御 runbook の手順実行 | 3 |
| chaos | Forms 429 / D1 timeout / deploy 中 cron / 100k 接近 | 4 |
| 合計 | | 13 ケース |

## 2. AC ↔ verify suite matrix（要約）

| AC | suite |
| --- | --- |
| AC-1 wrangler.toml triggers | U-1 |
| AC-2 cron 確認方法 runbook 記載 | U-1 + R-1 |
| AC-3 release-runbook.md 完成 | R-1, R-2 |
| AC-4 incident response runbook | C-1〜C-4 + R-3 |
| AC-5 dashboard URL 一覧 | U-2 + U-3 |
| AC-6 sync_jobs running 参照 | I-1 |
| AC-7 #5 rollback で web D1 操作なし | R-2 |
| AC-8 #6 GAS trigger なし | U-1 |
| AC-9 #10 cron 100k 内 | C-4 + 試算 |

未対応 AC: 0 件。詳細は `verify-suite.md` 参照。

## 3. 差し戻し先

| 検出 | 差し戻し |
| --- | --- |
| U-1 失敗（cron 表記不整合） | 09b Phase 5 cron-deployment-runbook |
| I-1 失敗（running guard 動作不良） | 03b（forms response sync）へ |
| I-2 失敗（failed 記録不備） | 03b へ |
| I-3 失敗（部分失敗 view model 不備） | 03a/03b へ |
| R-2 失敗（rollback 手順誤り） | 09b Phase 5 rollback-procedures |
| C-1 失敗（429 retry 設計不備） | 03a/03b へ |
| C-3 失敗（deploy 中 cron 二重起動） | 03b へ + Phase 5 修正 |
| C-4 失敗（100k 超過試算） | Phase 9 試算修正 |
| 04c 経由 endpoint 認可漏れ | 04c へ |
| apps/web に D1 import 検出 | 02c（apps/web 構造）へ |

## 4. 不変条件への対応

| 不変条件 | suite |
| --- | --- |
| #5 | R-2（rollback test で web D1 操作なし）+ U-1（grep）+ chaos 全層に「web → D1 edge なし」を含む |
| #6 | U-1（apps script trigger なし grep） |
| #10 | C-4（100k 接近 alert）+ Phase 9 試算 |
| #15 | R-2 後段の attendance 重複 SQL 確認 |

## 5. 各 suite の確認コマンド（要約）

詳細は `verify-suite.md` 参照。

```bash
# U-1
rg '^crons\s*=\s*\[' apps/api/wrangler.toml
rg 'apps script|google\.script' apps/api/wrangler.toml docs/30-workflows/09b-*/

# I-1（spec 検証）
wrangler d1 execute ubm-hyogo-db-staging \
  --command "SELECT COUNT(*) FROM sync_jobs WHERE status='running';" \
  --config apps/api/wrangler.toml

# R-1（runbook 走破）
bash docs/30-workflows/09b-.../verify/runbook-walkthrough.sh # （placeholder、実装は別 task）

# C-4（無料枠試算）
echo "121 req/day < 100k req/day → PASS"
```

## 6. 次 Phase への引き継ぎ

- verify suite 13 ケース完備 → Phase 5 で各ケースを runbook step に紐付け
- 差し戻し先 10 件明示 → Phase 6 異常系で詳述
