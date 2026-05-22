# Phase 11: 手動 smoke / 実測 evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |
| 区分 | 実装仕様書 |
| visual_class | VISUAL_ON_EXECUTION（4 画面 + 404 page のスクリーンショットを実測 evidence として要求） |

## 目的

task-12 の 4 画面（`/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）+ 404 page について、ローカル / staging で手動 smoke を実行し、スクリーンショット・runtime log・grep gate 出力・data-stable-key 焼き込み監査を canonical path に記録する。runtime evidence は user-gated とし、未取得時は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を維持する（false-green 禁止）。

## 実行タスク

- [ ] §手動 smoke 手順 を 5 routes すべてで実行し、結果を `outputs/phase-11/main.md` に記録
- [ ] スクリーンショット 5 枚を canonical path に保存
- [ ] runtime log 5 種（typecheck / lint / test / build / e2e）+ grep gate / stable-key audit / d1-isolation を取得
- [ ] axe-core critical=0 evidence を取得
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（§5.2 / §6 / §7）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`（19 routes 正本のうち 4 routes が本 task）
- `apps/web/src/styles/tokens.css`（OKLch tokens 正本）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/screenshots/{member-detail,register,privacy,terms,not-found}.png`
- `outputs/phase-11/evidence/*.log`（下記 evidence canonical path 表）

## 統合テスト連携

- `apps/web/playwright/tests/public-detail-register-legal.spec.ts` を Playwright project `desktop-chromium` で実行し、4 画面 + 404 page の 200 / 主要要素 visible / screenshot 保存 / axe critical=0 を実測する。
- task-05 の 19 routes staging smoke（`apps/web/tests/e2e/staging-smoke.spec.ts`）と本 task の Playwright spec は別 spec として共存し、本 task は **画面個別の DOM 焼き込み監査**に責務を絞る。

## evidence canonical path

repo root から実行し、`docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/` 配下に配置する。`tee outputs/...` の相対配置は禁止。

| file | 取得方法 |
| --- | --- |
| `typecheck.log` | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 \| tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/typecheck.log` |
| `lint.log` | `mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 \| tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/lint.log` |
| `test.log` | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal 2>&1 \| tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/test.log` |
| `build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/build.log` |
| `e2e.log` | `PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium 2>&1 \| tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/e2e.log` |
| `axe-report.json` | Playwright spec 内で @axe-core/playwright が `outputs/phase-11/evidence/axe-report.json` に出力 |
| `grep-gate.log` | §grep gate の 3 コマンドを連結し記録 |
| `stable-key-audit.log` | §data-stable-key 監査コマンドの出力 |
| `d1-isolation.log` | §D1 isolation 監査コマンドの出力 |
| `coverage/coverage-summary.json` | `pnpm --filter @ubm-hyogo/web test --coverage` |
| `screenshots/member-detail.png` | `/members/<seedId>` の画面 |
| `screenshots/register.png` | `/register` の画面 |
| `screenshots/privacy.png` | `/privacy` の画面 |
| `screenshots/terms.png` | `/terms` の画面 |
| `screenshots/not-found.png` | `/members/non-existent-id` で表示される 404 page |

## 手動 smoke 手順

```bash
# 1. ローカル起動（API + Web 並走）
mise exec -- pnpm --filter api dev &      # Hono Worker on :8787
mise exec -- pnpm --filter @ubm-hyogo/web dev &      # Next.js on :3000

# 2. 各画面を手動で開いてスクリーンショットを撮影
open http://localhost:3000/members/<seedId>          # → screenshots/member-detail.png
open http://localhost:3000/members/non-existent-id    # → screenshots/not-found.png（404 page）
open http://localhost:3000/register                   # → screenshots/register.png
open http://localhost:3000/privacy                    # → screenshots/privacy.png
open http://localhost:3000/terms                      # → screenshots/terms.png

# 3. 自動 smoke（axe-core 込み）
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium

# 4. staging 確認（任意。task-05 の staging-smoke spec と同じ STAGING_BASE_URL を共有）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
export STAGING_BASE_URL=$(op read "op://UBM/staging-hyogo/web_base_url")
# 各 URL を手動で開き直して staging 環境でも目視確認
```

## 期待 evidence

- 4 画面すべて 200、404 page は `notFound()` 経由で表示
- ProfileHero / MemberDetailSections / MemberTags / MemberLinks / RegisterCallout / FormPreviewSections / LegalProse の主要 DOM が visible
- `<a target="_blank">` 要素はすべて `rel="noopener noreferrer"` を持つ
- axe-core critical=0（4 画面 + 404 page）
- `data-stable-key` が詳細ページの全 KV row に焼かれている
- HEX 直書き grep gate 0 件
- `apps/web` 内に `D1Database` 参照 0 件

## grep gate（HEX 直書き 0 件確認 / 出力転記欄）

```bash
# 走査対象は本 task が触った範囲に限定（task-18 の全域走査とは別）
TARGET_DIRS="apps/web/app/(public)/members apps/web/app/(public)/register apps/web/app/privacy apps/web/app/terms apps/web/src/components/public apps/web/src/components/legal"

# 1. bg-[#xxx] / text-[#xxx] 直書き（Tailwind arbitrary value での HEX 利用）
mise exec -- rg -n --no-heading 'bg-\[#|text-\[#' $TARGET_DIRS \
  | tee -a docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/grep-gate.log

# 2. CSS / TS 内の HEX リテラル
mise exec -- rg -n --no-heading '#[0-9a-fA-F]{3,8}\b' $TARGET_DIRS \
  | tee -a docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/grep-gate.log

# 3. inline style での color/background 指定
mise exec -- rg -n --no-heading 'style=\{.*(color|background).*#' $TARGET_DIRS \
  | tee -a docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/grep-gate.log

# 期待: 3 コマンドすべて 0 件 → grep-gate.log は空または「0 matches」のみ
```

期待出力転記欄（実測時に貼り付け）:

```
$ rg -n 'bg-\[#|text-\[#' <TARGET_DIRS>
(no output)

$ rg -n '#[0-9a-fA-F]{3,8}\b' <TARGET_DIRS>
(no output)

$ rg -n 'style=\{.*(color|background).*#' <TARGET_DIRS>
(no output)
```

## data-stable-key 焼き込み監査（不変条件 #1）

```bash
# 1. MemberDetailSections の生成 DOM に data-stable-key が含まれていることを vitest snapshot 由来で確認
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public/__tests__/MemberDetailSections.test.tsx \
  2>&1 | tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/stable-key-audit.log

# 2. 直接 Playwright 経由で詳細ページの DOM をスキャン（実 fixture id を使用）
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium \
  --project=desktop-chromium \
  --grep "data-stable-key" \
  2>&1 | tee -a docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/stable-key-audit.log

# 期待: 詳細ページに `[data-stable-key]` 要素が >= 1 件、かつ全 KV row に存在
```

## D1 isolation 監査（不変条件 #5）

```bash
mise exec -- rg -n --no-heading 'D1Database|env\.DB|env\.DATABASE' apps/web \
  | tee docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/d1-isolation.log

# 期待: 0 件（apps/web から D1 binding 参照禁止）
```

## 状態語彙

`outputs/phase-11/main.md` の status は次のいずれかで close-out する:

- `local PASS + smoke PASS（4 画面 + 404 page）+ axe critical=0 + grep gate 0 件 + stable-key audit PASS` → `completed` 候補
- `local PASS のみで runtime / staging 未取得` → `IMPLEMENTED_LOCAL_RUNTIME_PENDING`（合算 PASS 表記禁止）

## 完了条件

- [ ] スクリーンショット 5 枚が canonical path に配置
- [ ] runtime evidence log 5 種 + grep-gate / stable-key-audit / d1-isolation / axe-report が canonical path に配置
- [ ] grep gate 3 コマンドすべて 0 件で `grep-gate.log` を確定
- [ ] `stable-key-audit.log` で詳細ページの全 KV row に `data-stable-key` 焼き込みを確認
- [ ] `d1-isolation.log` が 0 件（apps/web から D1 binding 参照なし）
- [ ] axe-core critical violation = 0（4 画面 + 404 page）
- [ ] runtime 未取得なら `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 状態と再取得計画を `outputs/phase-11/main.md` に明記
