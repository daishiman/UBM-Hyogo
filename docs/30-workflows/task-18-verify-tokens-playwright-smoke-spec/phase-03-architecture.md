[実装区分: 実装仕様書]

# Phase 3: アーキテクチャ設計 — task-18 verify-tokens & playwright-smoke

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Task ID | `task-18-verify-tokens-and-playwright-smoke` |
| Phase | 3 / 13（アーキテクチャ設計） |
| 目的 | CI ワークフロー 2 本（verify-design-tokens.yml / playwright-smoke.yml）の job 関係・トリガ・nightly schedule・required check 配置・既存 e2e-tests.yml との責務分離を確定する |
| 依存 (前) | Phase 1（要件）/ Phase 2（API） |
| 依存 (後) | Phase 4（テスト戦略） |
| 想定工数 | 0.15 人日 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- CI ワークフロー 2 本の構成と job 分割を確定する
- `verify-design-tokens` / `playwright-smoke (smoke / visual)` の required status check 配置を確定する
- nightly schedule（`0 18 * * *` UTC = JST 03:00）の運用を確定する
- 既存 `.github/workflows/e2e-tests.yml`（functional E2E）との責務分離方針を確定する
- branch protection に登録する context 名を確定する

### 2.2 非ゴール

- ワークフロー実装そのもの（Phase 5 以降）
- self-test の網羅ケース確定（Phase 4 で扱う）

---

## 3. 変更対象ファイル一覧

| パス | 種別 | 説明 |
|------|------|------|
| `.github/workflows/verify-design-tokens.yml` | new | PR / push で verify-design-tokens を実行 |
| `.github/workflows/playwright-smoke.yml` | new | PR / main merge / nightly で smoke + visual を実行 |
| `.github/workflows/e2e-tests.yml` | edit (任意) | 既存 functional E2E と責務分離。重複トリガを避ける |
| `apps/web/playwright.config.ts` | reference | projects と baseURL 仕様（Phase 2 確定） |
| `package.json` / `apps/web/package.json` | reference | `verify:tokens` / `e2e:smoke` / `e2e:visual` / `e2e:visual:update` |

---

## 4. CI ワークフロー構成図

```
[PR open / sync]
   │
   ├─ verify-design-tokens.yml
   │     └─ job: verify-design-tokens (ubuntu-latest, 5min)
   │            steps: checkout → mise → pnpm install --frozen-lockfile → pnpm verify:tokens
   │            → required status check: "verify-design-tokens / verify-design-tokens"
   │
   └─ playwright-smoke.yml
         ├─ job: smoke (chromium)            ← required
         │     env: PLAYWRIGHT_BASE_URL / E2E_ADMIN_SESSION_TOKEN / E2E_MEMBER_SESSION_TOKEN
         │     steps: checkout → mise → install → playwright install --with-deps chromium
         │            → pnpm e2e:smoke → upload playwright-report (always)
         │
         └─ job: visual (chromium, 4 screens) ← required (PR / push のみ, nightly は除外)
               needs: smoke
               if: github.event_name != 'schedule'
               steps: checkout → mise → install → playwright install → e2e:visual
                      → on failure: upload test-results as "visual-diff"

[push to main]
   └─ playwright-smoke.yml を再実行（regression catch）

[schedule: 0 18 * * * UTC = JST 03:00]
   └─ playwright-smoke.yml の smoke のみ実行（visual は除外）
        workflow_dispatch で base_url 上書き可（staging / preview）
```

---

## 5. 各ワークフローの責務

### 5.1 `verify-design-tokens.yml`

- トリガ:
  - `pull_request` (branches: `main`, `dev`; paths: `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` / `scripts/verify-design-tokens.ts` / `.github/workflows/verify-design-tokens.yml`)
  - `push` (branches: `main`, `dev`)
- concurrency: `verify-design-tokens-${{ github.ref }}`、`cancel-in-progress: true`
- 単一 job `verify-design-tokens` / ubuntu-latest / timeout 5 分
- steps: checkout → `jdx/mise-action@v2` → `pnpm install --frozen-lockfile` → `pnpm verify:tokens`
- exit 0 で context green、exit 1 で red

### 5.2 `playwright-smoke.yml`

- トリガ:
  - `pull_request` (branches: `main`, `dev`; paths: `apps/web/**`, `.github/workflows/playwright-smoke.yml`)
  - `push` (branches: `main`)
  - `schedule: '0 18 * * *'`（UTC、JST 03:00 nightly）
  - `workflow_dispatch` (input: `base_url` 任意 — staging / preview を直接叩く)
- concurrency: `playwright-smoke-${{ github.ref }}`、`cancel-in-progress: true`
- 2 job 構成:
  - `smoke (chromium)`: ubuntu-latest / timeout 20 分 / 常時実行。`upload-artifact@v4` で `playwright-smoke-report` を 14 日保持
  - `visual (chromium, 4 screens)`: needs `smoke` / `if: github.event_name != 'schedule'` / timeout 15 分。失敗時のみ `test-results` を `visual-diff` artifact として 14 日保持

### 5.3 既存 `e2e-tests.yml` との責務分離

| ワークフロー | 責務 | トリガ |
|--------------|------|--------|
| 既存 `e2e-tests.yml` | フル functional E2E（ユーザシナリオ系） | 別途運用 |
| 新規 `playwright-smoke.yml` | 19 routes 軽量 smoke + 4 画面 visual baseline | PR / main / nightly |

責務分離方針:
- smoke から functional をトリガしない（重複実行回避）
- `testMatch` で project を完全分離（smoke / visual / 既存 desktop-chromium / firefox / mobile-webkit）
- 命名規則は既存 `verify-indexes.yml` に倣い、`verify-*` / `playwright-*` プレフィックスで統一

---

## 6. Required status check 配置

`required_pull_request_reviews=null` の solo dev ポリシー下で、以下 3 件を `required_status_checks.contexts` に追加する:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`

設定検証コマンド:

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts'
```

---

## 7. Nightly schedule 設計

- cron: `0 18 * * *`（UTC） = JST 03:00
- 対象: `smoke (chromium)` のみ。`visual` は `if: github.event_name != 'schedule'` で除外
- 目的: staging baseURL を `workflow_dispatch` の `base_url` 入力で切り替え、平日昼前に staging 不調を検知
- `retries: 2`（Playwright config 側）で flaky 抑制。2 回連続失敗時のみ既存 `notify-completion.sh` ルート経由で Slack 通知（運用ルール、本タスクで実装義務はない）

---

## 8. baseURL / Secrets / env 経路

| 用途 | 経路 |
|------|------|
| baseURL 切替 | `PLAYWRIGHT_BASE_URL` (workflow_dispatch input `base_url`) → `PLAYWRIGHT_STAGING_BASE_URL` → `http://localhost:3000` |
| auth fixture | GitHub Secrets `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN`（1Password 参照、平文 `.env` 禁止） |
| Cloudflare 系 | 本タスクは `apps/web` の playwright のみ。Cloudflare CLI は使わない |

---

## 9. テスト方針（Phase 3 として）

- CI 構成の正しさは Phase 4 self-test と組み合わせて検証する
- ワークフロー YAML は `actionlint` を別 gate で守る（本タスクでは workflow 自体の構文を CI で間接検証）

---

## 10. ローカル実行・検証コマンド

```bash
# workflow YAML 構文の事前確認（actionlint がローカルにある場合）
actionlint .github/workflows/verify-design-tokens.yml
actionlint .github/workflows/playwright-smoke.yml

# branch protection の現状確認
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  | jq '.required_status_checks.contexts'
```

---

## 11. DoD（Phase 3 完了条件）

- [ ] verify-design-tokens.yml のトリガ（PR paths / push branches）が確定
- [ ] playwright-smoke.yml の 2 job 構成（smoke / visual）と needs / if 条件が確定
- [ ] nightly cron `0 18 * * *` と visual 除外条件が確定
- [ ] required status check 3 contexts の文字列が確定
- [ ] 既存 e2e-tests.yml との責務分離方針（重複トリガ禁止 / testMatch 分離）が文書化
- [ ] baseURL / Secrets / workflow_dispatch input の経路が確定
- [ ] 命名規則（`verify-*` / `playwright-*`）が既存 verify-indexes.yml と整合
