# Phase 3 成果物 — 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase | 3 / 13（設計レビュー） |
| 作成日 | 2026-04-30 |
| レビュー対象 | `outputs/phase-02/main.md` + `e2e-architecture.mmd` + `scenario-matrix.md` |
| 状態 | completed |

---

## 1. alternative 3 案

| 案 | web 起動 | api 起動 | D1 | 起動コスト | network 安定性 | 無料枠 |
| --- | --- | --- | --- | --- | --- | --- |
| **A. local web + local api**（採用） | `pnpm --filter @apps/web dev`（Next.js dev） | `wrangler dev`（apps/api） | local D1 (`--local`) seed | ~5 sec | ○ 完全 isolated | ◎ 0 円 |
| B. staging URL | Cloudflare Workers staging | Workers staging | D1 staging | 0 sec（既稼働） | △ network latency / staging 障害連鎖 | △ staging 利用枠 |
| C. preview URL（PR ごと） | Cloudflare Workers preview | Workers preview | D1 dev binding | 30+ sec deploy 待ち | △ preview build fail 影響 | △ preview deploy 枠 |

---

## 2. PASS-MINOR-MAJOR 判定

### A. local web + local api（採用）

| 観点 | 判定 | 内容 |
| --- | --- | --- |
| AC-1〜8 達成 | **PASS** | 10 画面 × 2 viewport / 5 AuthGateState / 6 検索 / 30 枚 screenshot / WCAG AA 0 件すべて到達可能 |
| 無料枠 | **PASS** | Cloudflare 課金なし、CI ubuntu-latest 標準枠 |
| 不変条件 #4 #8 #9 #15 | **PASS** | 実 D1 + 実 cookie + 実 SSR で恒久固定 |
| 起動コスト | **MINOR** | wrangler dev 起動 ~5 sec → `playwright.config.ts.webServer.timeout = 60_000` で吸収 |
| seed の冪等性 | **MINOR** | `pnpm seed:e2e` を `globalSetup` で確実に呼ぶ runbook 整備（Phase 5） |
| 致命欠陥 | **なし (NO MAJOR)** | — |

→ **採用判定: A（PASS、MINOR 2 件は Phase 5 runbook で吸収）**

### B. staging URL

| 観点 | 判定 | 内容 |
| --- | --- | --- |
| AC 達成 | PASS | 達成可能 |
| 09a との重複 | **MAJOR** | 09a-parallel-staging-deploy-smoke の責務と完全重複、本タスクは scope out |
| network 安定性 | **MAJOR** | staging 障害時に E2E が false positive で fail し、UI 改修側に責任誤帰属 |

→ **不採用（MAJOR 2 件）**

### C. preview URL

| 観点 | 判定 | 内容 |
| --- | --- | --- |
| AC 達成 | PASS | 達成可能 |
| 起動コスト | **MAJOR** | preview deploy 30 sec 以上、PR ごとに 7 spec 実行で CI 時間が 10 min を超過する見込み |
| cron / scheduled | MINOR | preview では cron が動かないが、本タスクは UI E2E のため影響軽微 |
| 不変条件 | PASS | 同等 |

→ **不採用（MAJOR 1 件: 起動コスト）**

---

## 3. 採用案: A（local web + local api）

### 採用理由

1. **PASS のみ / MAJOR なし**: AC-1〜8 全達成、不変条件 #4 #8 #9 #15 を実環境近似で検証
2. **無料枠**: Cloudflare 課金リソース不要、CI ubuntu-latest で完結
3. **DX**: `pnpm e2e` 一発起動、失敗時の local debug が容易
4. **責務分離**: 09a (staging smoke) / 09b (release runbook) と非重複

### MINOR 2 件のリゾルブ

| MINOR | 解消策 | 担当 Phase |
| --- | --- | --- |
| wrangler dev 起動 ~5 sec | `playwright.config.ts.webServer.timeout = 60_000` + `reuseExistingServer = !CI` | Phase 5 (実装ランブック) |
| seed の冪等性 | `globalSetup` で `pnpm db:reset:e2e && pnpm db:migrate:e2e && pnpm seed:e2e` を順次実行、SQL fixture を `apps/web/playwright/fixtures/seed/*.sql` で版管理 | Phase 5 |

---

## 4. 不変条件適合度（再確認）

| 不変条件 | A | B | C | コメント |
| --- | --- | --- | --- | --- |
| #4 profile 編集 form 不在 | ○ | ○ | ○ | 同等 |
| #8 localStorage 非依存 (reload 後 state 維持) | ○ | ○ | ○ | 同等 |
| #9 `/no-access` 不在 | ○ | ○ | ○ | 同等 |
| #15 attendance 二重防御 | ○ | ○ | ○ | 同等 |
| 無料枠 | ◎ | △ | △ | A 優位 |
| CI 安定性 | ◎ | △ | △ | A 優位 |
| 速度 (~ suite 完走時間) | ◎ ~ 5 min | △ network latency | × deploy 待ち | A 優位 |

---

## 5. レビュー指摘とリゾルブ

| # | 指摘 | 重大度 | リゾルブ | 担当 Phase |
| --- | --- | --- | --- | --- |
| 1 | wrangler dev 起動が flaky になる懸念 | MINOR | webServer.timeout=60s + healthcheck retry 3 | 5 |
| 2 | mobile viewport を実機 emulator にすべきでは | INFO | desktop chromium で `viewport: 390x844` 代替（無料枠優先）。実機 emulator は nightly 別 workflow で検討 | 5 / 9 |
| 3 | webkit / firefox を常時実行に含めるか | INFO | chromium 常時 + nightly で webkit、firefox は当面除外 | 9 |
| 4 | a11y assertion を全 spec で実行するか | MINOR | public / login / profile / admin の 4 spec のみ（search / density / attendance は layout 検証中心） | 4 |
| 5 | screenshot 命名規約 | MINOR | `outputs/phase-11/evidence/{desktop|mobile}/{scenario}-{state}.png` で確定 | 5 |
| 6 | AUTH_SECRET 漏洩リスク | MINOR | local: `.env` の op 参照、CI: GitHub Secrets。リポジトリには test 値も commit しない | 5 / 9 |

すべて MINOR / INFO レベルで、Phase 5 (実装ランブック) / Phase 9 (品質保証) で吸収可能。**MAJOR は 0 件**。

---

## タスク完了

- [x] alternative 3 案列挙（A / B / C）
- [x] 各案の PASS-MINOR-MAJOR 判定
- [x] 採用案: **A（local web + local api）** 確定
- [x] MINOR 2 件のリゾルブ手段定義
- [x] 不変条件適合度マトリクス
- [x] レビュー指摘 6 件のトリアージ

→ Phase 4（テスト戦略）へ handoff 可能。引き継ぎ事項: 採用案 A、MINOR 2 件、レビュー指摘 6 件のリゾルブ計画。
