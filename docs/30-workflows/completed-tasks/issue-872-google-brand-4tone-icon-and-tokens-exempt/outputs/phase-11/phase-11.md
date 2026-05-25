**[実装区分: 実装仕様書 / 状態: spec_created]**

# Phase 11: 手動テスト / Evidence 取得仕様 (VISUAL task)

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `new` |
| evidence canonical path | `outputs/phase-11/evidence/` および `outputs/phase-11/screenshots/` |
| 状態 (本仕様書時点) | `spec_created` |
| 状態 (Phase 11 完了後の想定終端) | `implemented_local_visual_evidence_captured` |
| 関連 reference | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` |

## 1. 目的

issue #872 [FU-LOGIN-001] の 11 ファイル変更スコープが、AC-1..AC-9 を客観的に検証可能であることを「物理 evidence」として tracked-commit する。

evidence 3 層:

- **non-visual evidence**: typecheck / lint / build / verify-design-tokens / vitest-verify / playwright-visual のログ
- **visual evidence**: `/login` ページの 4-tone Google button screenshot (desktop + mobile)
- **3 層評価 (VISUAL task 標準)**: Semantic (DOM / a11y) / Visual (pixel diff) / AI UX (heuristics) を本 Phase で全層実行

## 2. 取得手順

### 2.1 共通前提

```bash
mise exec -- pnpm install --force
WF=docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt
mkdir -p "$WF/outputs/phase-11/evidence" "$WF/outputs/phase-11/screenshots"
```

### 2.2 non-visual evidence の取得

```bash
mise exec -- pnpm typecheck                                       2>&1 | tee "$WF/outputs/phase-11/evidence/typecheck.log"
mise exec -- pnpm lint                                            2>&1 | tee "$WF/outputs/phase-11/evidence/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web build                   2>&1 | tee "$WF/outputs/phase-11/evidence/build.log"
mise exec -- pnpm tsx scripts/verify-design-tokens.ts             2>&1 | tee "$WF/outputs/phase-11/evidence/verify-design-tokens.log"
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts 2>&1 | tee "$WF/outputs/phase-11/evidence/vitest-verify.log"
```

> `.log` 拡張子は `.gitignore` で除外される可能性があるため、commit 直前に `git check-ignore -v outputs/phase-11/evidence/*.log` を確認。除外時は `.txt` にリネーム。

### 2.3 visual evidence の取得 (3 層評価)

#### Semantic 層 (DOM / a11y)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/login-a11y.spec.ts --project=desktop-chromium \
  2>&1 | tee "$WF/outputs/phase-11/evidence/semantic-a11y.log"
```

期待: `GoogleBrandIcon` が `aria-hidden="true"`、Button の accessible name が "Google でログイン" 等。

#### Visual 層 (pixel diff baseline)

```bash
# baseline 初回更新
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/visual/login.spec.ts --project=desktop-chromium --update-snapshots

# 再 run で diff=0 確認
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/visual/login.spec.ts --project=desktop-chromium \
  2>&1 | tee "$WF/outputs/phase-11/evidence/playwright-visual.log"
```

更新 baseline:
- `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png`
- (mobile baseline も同 spec 内で取得される場合は同フォルダ配下)

#### AI UX 層 (heuristics)

screenshot を撮り、目視 + ヒューリスティック 5 項目で判定:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/login-smoke.spec.ts --project=desktop-chromium \
  -- --grep "google-4tone-screenshot"
```

撮影対象:

| screenshot | URL | viewport | 保存先 |
|---|---|---|---|
| login-google-button-4tone | `/login` | 1440×900 (chromium desktop) | `outputs/phase-11/screenshots/login-google-button-4tone.png` |
| login-google-button-4tone-mobile | `/login` | 375×812 (chromium mobile) | `outputs/phase-11/screenshots/login-google-button-4tone-mobile.png` |

ヒューリスティック判定 (`local-validation-summary.txt` に転記):

| # | 項目 | 期待 |
|---|------|------|
| 1 | 4 色明確に視認可能 | blue / green / yellow / red の path 4 本が肉眼判別 |
| 2 | Button 内で G icon が左寄せ + label 中央寄せ | OAuth Button 既存レイアウト維持 |
| 3 | G icon サイズが label 文字より小〜同等 | 1.0em〜1.25em 程度 |
| 4 | hover/focus で G icon 色が変化しない | brand-asset 不変条件 |
| 5 | dark mode 想定なし (MVP) | 背景は OKLch surface 一定 |

### 2.4 親プロトタイプとの視覚 diff

```bash
# 親プロトタイプ (claude-design-prototype) の login screenshot を別途取得し、
# 4-tone G の発色が同等 (色ペアが Google 公式と整合) か目視比較
open docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx
```

prototype は jsx mock のため pixel diff ではなく、color spec の 4 値が `#4285F4 / #34A853 / #FBBC05 / #EA4335` で一致するかの目視判定とする。

### 2.5 local-validation-summary の集約

```bash
{
  echo "# local validation summary (issue-872)"
  echo "## typecheck"        ; tail -n 5 "$WF/outputs/phase-11/evidence/typecheck.log"
  echo "## lint"             ; tail -n 5 "$WF/outputs/phase-11/evidence/lint.log"
  echo "## build"            ; tail -n 5 "$WF/outputs/phase-11/evidence/build.log"
  echo "## verify-design-tokens" ; tail -n 5 "$WF/outputs/phase-11/evidence/verify-design-tokens.log"
  echo "## vitest verify"    ; tail -n 5 "$WF/outputs/phase-11/evidence/vitest-verify.log"
  echo "## playwright visual"; tail -n 5 "$WF/outputs/phase-11/evidence/playwright-visual.log"
} > "$WF/outputs/phase-11/evidence/local-validation-summary.txt"
```

## 3. provenance

| 種別 | provenance | 補足 |
|---|---|---|
| typecheck.log 〜 build.log | local `mise exec -- pnpm` | Node 24.15.0 / pnpm 10.33.2 |
| verify-design-tokens.log | local `pnpm tsx scripts/verify-design-tokens.ts` | `DEFAULTS.brandIconExemptPaths` 経由で drift 0 |
| vitest-verify.log | local `pnpm vitest run scripts/verify-design-tokens.spec.ts` | exempt 単体テストが green |
| playwright-visual.log | local Playwright (chromium desktop) | login baseline diff = 0 |
| screenshots/*.png | local Playwright (chromium desktop + mobile) | staging fresh evidence は FU-LOGIN-003 で扱う |
| local-validation-summary.txt | local 集約 | §2.5 |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | pending |
| typecheck log | outputs/phase-11/evidence/typecheck.log | pending |
| lint log | outputs/phase-11/evidence/lint.log | pending |
| build log | outputs/phase-11/evidence/build.log | pending |
| verify-design-tokens log | outputs/phase-11/evidence/verify-design-tokens.log | pending |
| vitest verify log | outputs/phase-11/evidence/vitest-verify.log | pending |
| playwright visual log | outputs/phase-11/evidence/playwright-visual.log | pending |
| visual render (4tone desktop) | outputs/phase-11/screenshots/login-google-button-4tone.png | present |
| visual render (4tone mobile) | outputs/phase-11/screenshots/login-google-button-4tone-mobile.png | present |
| browser screenshot (4tone desktop) | outputs/phase-11/screenshots/login-google-button-4tone.browser.png | pending |
| browser screenshot (4tone mobile) | outputs/phase-11/screenshots/login-google-button-4tone-mobile.browser.png | pending |

2026-05-25 review で `rsvg-convert` による visual render PNG を保存済み。Chromium install と `next build --webpack` は local filesystem `ENOSPC`（空き 103MiB）で止まったため、実ブラウザ screenshot は pending として分離する。

## 5. 受け入れ判定との対応

| AC | 対応 evidence |
|---|---|
| AC-1 | `test -f apps/web/src/components/ui/brand-icons/google.svg` / `test -f apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` + screenshots |
| AC-2 | screenshots/login-google-button-4tone.png / -mobile.png + playwright-visual.log |
| AC-3 | verify-design-tokens.log (exit 0) |
| AC-4 | vitest-verify.log (PASS) |
| AC-5 | typecheck.log (`"google"` literal が IconName から消えても compile pass) + `rg` grep (summary に転記) |
| AC-6 | spec ファイル diff (git log) — `09b-design-tokens.md` の brand-asset 章 |
| AC-7 | 親 workflow の unassigned-task-detection.md / unassigned-task spec の git diff |
| AC-8 | typecheck.log / lint.log / build.log |
| AC-9 | playwright-visual.log (login baseline diff = 0) |

## 6. 落とし穴と回避策

| 落とし穴 | 回避策 |
|---|---|
| `.log` が `.gitignore` で除外され compliance check が `missing-evidence` で fail | commit 前に `git check-ignore -v` で確認し、必要なら `.txt` に統一 |
| Playwright visual baseline がプラットフォーム差分 (chromium-linux vs darwin) で diff | CI baseline は linux 固定。local darwin で取得した baseline は CI で reject される可能性があるため、`--update-snapshots` は CI 環境で実施するか、`playwright.config.ts` で `linux` snapshot のみ commit |
| SVG 4 path の HEX (`#4285F4` 等) が `verify-design-tokens` で drift 検出される | `DEFAULTS.brandIconExemptPaths = ["apps/web/src/components/ui/brand-icons/*.svg"]` を追加し、`scanForbiddenColorLiterals` で path-glob filter 後に scan |
| `IconName` union から `"google"` を削除した後、他 component が壊れる | 事前に `rg 'name="google"' apps/web/src` で参照箇所を 0 件まで剥がす |
| 親 workflow `login-page-prototype-alignment` が completed-tasks 配下のため、consumed 表記更新時に「completed dir への書き込み」検査に引っかかる | unassigned-task-detection.md は in-line 編集を許可 (consumed trace は live ledger 扱い)。skill `references/post-completion-consumed-trace.md` 準拠 |

## 7. Phase 11 完了条件

- [ ] §4 inventory 表すべてが `Status=present`
- [ ] tracked commit 対象に上記 evidence と screenshot を含む
- [ ] AC-1〜AC-9 の evidence trail が §5 で full-coverage
- [ ] Phase 12 compliance check §1 / §4 に本 inventory を転記済

## 次 Phase への引き継ぎ

Phase 12 では本 Phase 11 inventory を `phase12-task-spec-compliance-check.md` §4 (Phase 11 evidence file inventory) に転記し、4 条件 verdict を `implemented_local_visual_evidence_captured` で確定する。`screenshot-plan.json` は本 Phase ディレクトリ配下に併設 (`outputs/phase-11/screenshot-plan.json`、`mode: "VISUAL"`)。
