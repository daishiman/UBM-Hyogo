# Phase 10: リリース計画 (dev → main / rollback)

**[実装区分: 実装仕様書]**

CLAUDE.md ブランチ戦略 (`feature/* → dev → main`) と solo 運用 CI gate 前提でのリリース計画。本サイクルは (A) UI prototype alignment + (B) staging 404 修正の 1 PR にまとめ、`dev` へ merge 後 staging で B 系再現有無を確認してから `main` へ昇格する。

## 1. ブランチ・PR 構成

| 項目 | 値 |
|------|----|
| 作業ブランチ | `feat/admin-identity-conflicts-prototype-alignment` |
| base | `dev` |
| 想定 PR 件数 | 1 (A + B 同梱) |
| 想定 commit | 5〜8 (UI / safe-server-fetch warn / contract spec / playwright spec / docs / skill sync) |
| reviewer 必須数 | 0 (solo 運用) |
| 必須 status check | CI gate (typecheck / lint / playwright-smoke / verify-design-tokens / verify-indexes-up-to-date / verify-phase12-compliance / gate-metadata) |

## 2. リリース順序

```
1. feature branch local 実装 + Phase 11 evidence 取得
2. PR open (base=dev) → CI gate 緑化
3. user 承認後 merge to dev
4. dev → staging Cloudflare Workers auto deploy (既存 pipeline)
5. staging で B 系再現確認 (smoke curl + 認証後 page open)
6. staging green を確認後、dev → main release PR
7. main merge で production deploy
```

## 3. required status check への影響

本サイクルで新規 CI gate を追加しない。既存 gate のみで判定する:

| gate | 期待 |
|------|------|
| typecheck | exit 0 |
| lint | exit 0 |
| playwright-smoke / smoke (chromium) | admin-identity-conflicts.spec.ts pass |
| playwright-smoke / visual (chromium, 4 screens) | visual baseline diff = 0 (baseline 更新有無は §4) |
| verify-design-tokens | apps/web で HEX 直書き 0 件 |
| verify-indexes-up-to-date | `pnpm indexes:rebuild` idempotent |
| verify-phase12-compliance | canonical 9 headings + Phase 11 evidence inventory + workflow root scan |
| gate-metadata:validate | artifacts.json zod schema pass |

## 4. visual baseline 更新方針

UI 改修 (A) により Playwright visual snapshot が drift する。baseline 3 枚 (mobile / tablet / desktop) を regenerate 必要:

- `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-admin-identity-conflicts-{mobile,tablet,desktop}-visual-full-chromium-{mobile,tablet,desktop}-linux.png`
- Linux baseline は CI bot 経由で update し、空コミットを自分のトークンで push して required checks を再トリガーする (既存運用パターン: feedback_visual_baseline_github_token_retrigger)

## 5. rollback 計画

### 5.1 dev rollback

staging で B 系修復が効いていない / 別の regression を観測した場合:

```bash
# 直前 commit を revert
gh pr create --base dev --title "revert: admin-identity-conflicts prototype alignment" --body "rollback: see issue link"
```

revert PR を merge → staging が前 commit に戻る。

### 5.2 main rollback (production)

production deploy 直後の重大 regression 時:

```bash
# scripts/cf.sh 経由で Workers version rollback
bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env production
```

VERSION_ID は `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production` で取得。

### 5.3 rollback 判断基準

- staging で `admin_fetch_404` Sentry tag が deploy 後 1h で 1 件以上発生
- merge / dismiss の成功率が deploy 前比で -20% 以上低下
- a11y / focus order regression が user 報告で発生

## 6. リリース後検証 (staging)

merge → staging auto deploy 後、以下を user-gated で実施:

```bash
# 1. B 系修復確認 (curl)
curl -i https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/identity-conflicts
#    -> 200 (admin cookie あり) / 302 to /login (cookie なし) を期待。404 は禁止

# 2. 認証後 page open + screenshot
#    - input state (empty list / non-empty list)
#    - merge 二段階 confirm
#    - dismiss modal

# 3. Sentry tag 検索 (24h ウィンドウ)
#    area:admin.identity-conflicts event:admin_fetch_404 -> 0 件
```

## 7. DoD

- [ ] PR base = `dev` で作成
- [ ] §3 全 status check green
- [ ] §4 visual baseline 3 枚 (Linux) が tracked-commit 済み
- [ ] §6 staging 検証 3 項目すべて user 承認済み
- [ ] dev → main release PR が separate に切られている (本 PR 内に main 直 PR を含めない)
- [ ] rollback 手順 (§5) が PR description に転記済み

## 8. 参照

- CLAUDE.md ブランチ戦略
- `outputs/phase-8/phase-8.md` (Sentry tag scheme = rollback 判断基準のソース)
- `outputs/phase-11/phase-11.md` (Linux baseline 取得手順)
- `outputs/phase-13/phase-13.md` (PR 本文テンプレート)
