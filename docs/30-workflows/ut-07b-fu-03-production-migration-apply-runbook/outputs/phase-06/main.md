# Phase 6 成果物: 異常系・失敗ハンドリング

本ドキュメントは `phase-06.md` の正式成果物。orchestrator スクリプト（F1〜F7, F9）と CI gate（F6）に対応する
26 異常シナリオを 6 領域で網羅し、検出経路 / 停止条件 / rollback 可否を一意に決定する。

## 全体マップ

| 領域 | 検出層 | exit | FC |
| --- | --- | --- | --- |
| 適用前 | preflight.sh | 2, 3 | FC-01〜05, FC-26 |
| 適用中 | apply-prod.sh / wrangler | 4 | FC-06〜09 |
| 適用後 | postcheck.sh | 5 | FC-10〜14 |
| evidence | evidence.sh / redaction-check | 6 | FC-15〜18 |
| 開発時 | bats / CI gate / shellcheck | 1, 2 | FC-23〜25 |
| scope 外 | 派生タスク | n/a | FC-19〜22 |

## 1. 適用前

| FC | 異常 | 検出 | exit | rollback |
| --- | --- | --- | --- | --- |
| FC-01 | 二重適用 | preflight.sh `assert_unapplied`（TC-U-PF-02） | 3 | 不要、適用済記録して終了 |
| FC-02 | DB 取り違え | preflight.sh `parse_args` / `verify_db_exists` | 2 | 引数訂正 |
| FC-03 | 認証失敗 | preflight.sh `verify_auth` | 3 | U-FIX-CF-ACCT-01 |
| FC-04 | 承認ゲート未充足 | runbook 冒頭 4 ゲート目視 | n/a | 4 ゲート完了まで待機 |
| FC-05 | commit/SQL 差分 | `head_sha` 不一致 | 3 | 再承認 |
| FC-26 | ALTER TABLE 二重 | preflight.sh `PRAGMA table_info` | 3 | apply skip |

## 2. 適用中

| FC | 異常 | 検出 | exit | rollback |
| --- | --- | --- | --- | --- |
| FC-06 | UNIQUE 衝突 | wrangler stderr `UNIQUE constraint failed` | 4 | **不可**、自己判断で `DROP INDEX` / `DELETE` 発行禁止、別 migration 起票 |
| FC-07 | duplicate column | wrangler stderr `duplicate column name` | 4 | **不可**、`DROP COLUMN` 自己判断禁止 |
| FC-08 | ネット中断 | wrangler 5xx / network | 4 | 1 回のみ同一コマンド再試行 |
| FC-09 | apply 出力 Token 混入 | `evidence.sh verify_redaction` | 6 | redact + Token Roll 検討 |

## 3. 適用後

| FC | 異常 | 検出 | exit | rollback |
| --- | --- | --- | --- | --- |
| FC-10 | `schema_aliases` 不在 | postcheck.sh 0 行 | 5 | DB binding 確認 |
| FC-11 | UNIQUE index 1 件のみ | postcheck.sh 1 行（TC-U-PC-02） | 5 | 不可、判断待ち |
| FC-12 | カラム欠落 | postcheck.sh PRAGMA（TC-U-PC-03） | 5 | 不可、判断待ち |
| FC-13 | destructive smoke 誤発行 | コマンド履歴 | n/a | incident 化 |
| FC-14 | back-fill 実処理混入 | コマンド履歴 | n/a | scope 外、別タスク |

## 4. Evidence

| FC | 異常 | 検出 | exit | 対応 |
| --- | --- | --- | --- | --- |
| FC-15 | Token 様混入 | TC-E01 grep `[A-Za-z0-9_-]{40,}` | 6 | incident: redact → Token Roll → Secret 更新 → git history 確認 → meta.json incident log |
| FC-16 | Account ID 様（32 桁 hex） | TC-E02 grep | 6 | redact |
| FC-17 | `set -x` 由来 | TC-E03 grep `^\+ (bash\|wrangler\|cf\.sh\|scripts/) ` | 6 | `set -x` 禁止再徹底 |
| FC-18 | wrangler 直叩きログ | TC-E04 grep | 6 | `cf.sh` 経由縛り再徹底 |

## 5. 開発時

| FC | 異常 | 検出 | 影響 | 対応 |
| --- | --- | --- | --- | --- |
| FC-23 | bats 失敗 | `pnpm test:scripts` / CI `bats-unit` | PR block | TC RED→GREEN にしてから再 push |
| FC-24 | staging dry-run 失敗 | CI `staging-dry-run` | PR block | `.evidence/` artifact から原因特定 |
| FC-25 | shellcheck 警告 | CI `lint-shell` | PR block | 警告 fix、`disable` 濫用禁止 |

## 6. scope 外（派生タスク候補）

| FC | 内容 | 移管先 |
| --- | --- | --- |
| FC-19 | UNIQUE 衝突 quarantine 自動化 | UT-07B-FU-04 候補 |
| FC-20 | back-fill cursor 実処理 | unassigned-task-detection.md 起票済 |
| FC-21 | admin UI retry label | 別タスク |
| FC-22 | wrangler-action / OIDC 移行 | U-FIX-CF-ACCT-01 Option D 派生 |

## rollback 判断早見表

| 状況 | 可否 | 判断 |
| --- | --- | --- |
| Preflight 失敗 | 不要 | apply 未実行 |
| UNIQUE 衝突 / duplicate column | **不可** | 自己判断 SQL 禁止、別 migration 起票 |
| ネット中断 | 部分可 | `migrations list` 確認後ユーザー判断 |
| postcheck 部分欠落 | 不可 | 判断待ち |
| evidence 混入 | 不要 | redact + Token Roll |
| 開発時失敗 | n/a | PR block |

## 課題スコープ → 検知層マップ

| ケース | 検知層 | exit / 結果 |
| --- | --- | --- |
| 二重適用 | F1 preflight + bats TC-U-PF-02 | exit=3 |
| UNIQUE 衝突 | F4 apply 中 wrangler stderr | exit=4、別 migration 起票 |
| DB 取り違え | F1 引数 parse | exit=2 |
| ALTER TABLE 二重 | F1 `PRAGMA table_info` | exit=3、apply skip |
| evidence 機密混入 | F3 `verify_redaction` | exit=6 |
| `set -x` 混入 | bats + TC-E03 | bats 失敗 / exit=6 |
| CI gate 失敗 | F6 4 ジョブ | PR block |
| Token 漏洩 | F3 + redaction-check + redaction-check.md grep | evidence 削除 + 報告 + Token Roll |

## エラーハンドリング方針

- アプリ実装ロジックを含まないため try/catch は対象外。
- 検出は exit code / SQL 件数 / `migrations list` 出力 / `grep` pattern match の 4 段。
- 復旧操作中に `set -x` を絶対に有効化しない。
- `wrangler` 直叩きは復旧操作でも禁止、`bash scripts/cf.sh` 経由のみ。

## 監視・通知

| 観点 | 経路 | 期間 |
| --- | --- | --- |
| apply 結果 | `cf.sh d1 migrations list` | 直後 / 24h 後 |
| Token 露出 | redaction-check（CI 永続 + Phase 11 直前再実行） | 永続 |
| 既適用差分 | Cloudflare Dashboard | apply 後 24h |
| bats regression | CI `bats-unit` | PR ごと |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 「自己判断 SQL 禁止」「`cf.sh` 経由縛り」全シナリオ統一 |
| 漏れなし | PASS | 6 領域 × 26 シナリオ網羅、UT-07B 4 シナリオ全マップ |
| 整合性 | PASS | Phase 4 TC ID / Phase 5 exit code 規約と FC が 1:1 |
| 依存関係整合 | PASS | UT-07B 継承、Phase 7 AC マトリクスへ接続 |
