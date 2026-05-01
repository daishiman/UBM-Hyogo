# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の e2e architecture について alternative 3 案を比較し、PASS-MINOR-MAJOR で 1 案を選定する。

## 実行タスク

- [ ] alternative 3 案を列挙し table 化
- [ ] 各案の PASS-MINOR-MAJOR 判定
- [ ] 採用案確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 |

## alternative 3 案

| 案 | web 起動 | api 起動 | D1 | 長所 | 短所 |
| --- | --- | --- | --- | --- | --- |
| A. **local web + local api**（採用） | `pnpm dev`（Next.js dev） | wrangler dev | local D1 seed | 開発と同じ環境、無料、CI 0 円 | wrangler dev 起動コスト ~ 5 sec |
| B. **staging URL** | Cloudflare Workers staging | Workers staging | D1 staging | 本番に近い、network 越しで実環境観測 | staging 不安定時 false positive、09a の責務と被る |
| C. **preview URL**（PR ごと） | Cloudflare Workers preview | Workers preview | D1 dev binding | PR 単位で隔離 | preview deploy が 30 sec 以上かかる、cron / scheduled が動かない |

## PASS-MINOR-MAJOR 判定

- 採用: **A**
- PASS: AC-1〜8 達成可能、無料枠で運用可、open source dependency のみ
- MINOR: wrangler dev 起動 ~ 5 sec を `playwright.config.ts` の `webServer.timeout` で吸収。Phase 5 runbook で `pnpm e2e:setup` を整備
- MAJOR: なし

## 不変条件適合度

| 不変条件 | A | B | C |
| --- | --- | --- | --- |
| #4 profile 編集なし | 同等 | 同等 | 同等 |
| #8 localStorage 不正利用 | 同等 | 同等 | 同等 |
| #9 `/no-access` 不在 | 同等 | 同等 | 同等 |
| #15 attendance 二重防御 | 同等 | 同等 | 同等 |
| 無料枠 | ◎ | △ staging 利用枠 | △ preview deploy |
| 速度 | ◎ ~ 30 sec / suite | △ network latency | × deploy 待ち |
| CI 安定性 | ◎ 完全 isolated | △ staging 障害連鎖 | △ preview build fail |

## 開発体験 (DX)

- A は `pnpm e2e` 一発で起動。失敗時も local debug 容易
- B / C は外部依存があり debug に Cloudflare dashboard 必要

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | A 案で verify suite 設計 |
| Phase 5 | runbook（webServer + seed 手順） |
| Phase 7 | AC × A 案の対応 |

## 多角的チェック観点

- 不変条件 **#4 / #8 / #9 / #15**: いずれの案も適合度は同等。差は速度 / 無料枠 / CI 安定性
- 無料枠: A は CI 時間 ≤ 10 min を目指す（chromium + webkit + a11y）
- secret hygiene: AUTH_SECRET は test 用、ファイル commit 禁止（CI は GitHub Secrets 経由で投入）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案 | 3 | pending | A / B / C |
| 2 | PASS-MINOR-MAJOR | 3 | pending | 採用 A |
| 3 | 不変条件適合度 | 3 | pending | matrix |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 3 案以上列挙
- [ ] PASS-MINOR-MAJOR 判定記録
- [ ] 採用案確定

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 採用案 A と MINOR (wrangler dev 起動 timeout 設定)
- ブロック条件: MAJOR 残置なら Phase 2 戻し
