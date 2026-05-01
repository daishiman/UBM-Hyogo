# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

cron schedule の無料枠試算、secret hygiene（特に Sentry DSN placeholder 取扱い）、a11y は対象外でも runbook の「アクセシビリティに配慮した記述」を確認し、Phase 10 GO/NO-GO の根拠とする。

## 実行タスク

1. cron 頻度 100k req/day 試算
2. secret hygiene（placeholder と実値の混在チェック）
3. runbook の a11y（読みやすさ / 一意な手順番号 / リンク有効性）
4. 品質ガード（lint / typecheck / test / build）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | cron 正本 |
| 参考 | CLAUDE.md | secret 管理 |

## 実行手順

### ステップ 1: cron 頻度試算
- `*/15 * * * *` = 24 × 4 = 96 req/day per worker
- `0 * * * *` = 24 req/day per worker（legacy current-fact 監視対象）
- `0 18 * * *` = 1 req/day per worker
- 合計: 121 req/day（cron だけ）→ 100k req/day の 0.2% 以下

### ステップ 2: secret hygiene
- Sentry DSN は placeholder 文字列のみ（実値なし）
- リポジトリに `SENTRY_DSN=https://*` のような実値がない

### ステップ 3: runbook a11y
- 手順番号が連続
- placeholder 表記が `<placeholder>` 統一
- 内部リンクが有効

### ステップ 4: 品質ガード

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 根拠 |
| Phase 11 | manual evidence で再確認 |
| 並列 09a | 無料枠試算の合計値を共有 |
| 下流 09c | production 試算に転用 |

## 多角的チェック観点（不変条件）

- #5: 設計に web 直 D1 操作が含まれない
- #6: GAS apps script 不採用
- #10: 無料枠試算 PASS
- #15: rollback 後 attendance 整合性

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | cron 頻度試算 | 9 | pending | 121 req/day |
| 2 | secret hygiene | 9 | pending | placeholder のみ |
| 3 | runbook a11y | 9 | pending | 手順番号 / link |
| 4 | 品質ガード | 9 | pending | lint / typecheck / test / build |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質サマリ + 試算 |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 完了条件

- [ ] 無料枠試算 PASS
- [ ] secret 実値 0 件
- [ ] runbook 手順番号 / link 100%
- [ ] 品質ガード 4 件 green

## タスク100%実行確認【必須】

- 全実行タスクが completed
- main.md 完成
- artifacts.json の phase 9 を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 試算値 / hygiene 結果 / runbook 整合
- ブロック条件: いずれかで違反 1 件以上で次 Phase に進まない

## 無料枠試算（cron のみ）

| trigger | 頻度 | req/day |
| --- | --- | --- |
| `0 * * * *` | 1 時間毎 | 24 |
| `*/15 * * * *` | 15 分毎 | 96 |
| `0 18 * * *` | 1 日 1 回 | 1 |
| 合計 | - | 121 |

- 無料枠 100k req/day に対して 0.2% 以下
- API 呼び出し / Pages 呼び出しを合算しても余裕

## Secret hygiene チェックリスト

| # | 項目 | 確認 | 期待 |
| --- | --- | --- | --- |
| 1 | リポジトリに secret 平文がない | `git grep -n "SENTRY_DSN=https"` | 0 hit |
| 2 | runbook に secret 実値がない | `rg "DSN=https" docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | 0 hit |
| 3 | placeholder 表記統一 | `rg "<placeholder>" docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | 統一されている |
| 4 | `.env` 系がコミット対象外 | `git check-ignore` | 全て ignored |

## Runbook a11y

| 項目 | 確認 | 期待 |
| --- | --- | --- |
| 手順番号連続 | 目視 | 1, 2, 3, … 連続 |
| placeholder 統一 | grep | `<placeholder>` のみ |
| 内部 link 有効 | manual click | 全 link 有効 |
| code block 言語指定 | grep ` ```bash ` | bash / toml / text 等指定 |

## 品質ガード

| ガード | コマンド | 期待 |
| --- | --- | --- |
| lint | `pnpm lint` | exit 0 |
| typecheck | `pnpm typecheck` | exit 0 |
| test | `pnpm test` | exit 0 |
| build | `pnpm build` | exit 0 |
