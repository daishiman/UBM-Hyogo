# Phase 11: Evidence (証跡) 取得仕様

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/login-page-prototype-alignment/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| evidence canonical path | `outputs/phase-11/evidence/` および `outputs/phase-11/screenshots/` |
| 状態 | `local_visual_evidence_captured` |
| 関連 reference | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` |

## 1. 目的

`/login` プロトタイプ整合タスクの実装完了後、AC-1〜AC-12 を客観的に検証するための evidence を物理ファイルとして tracked-commit する。

evidence は次の 2 カテゴリに分類する。

- **non-visual evidence**: 静的検証ログ（typecheck / lint / test / build / grep gate）
- **visual evidence**: Playwright で取得する screenshot（4 viewport × 5 state のサブセットを MVP）

本サイクルでは local static validation と local Playwright screenshot を取得済み。staging visual smoke は Phase 13 の user-gated 操作として残す。

## 2. 取得手順

### 2.1 共通前提

```bash
mise exec -- pnpm install --force
mkdir -p docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence
mkdir -p docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/screenshots
WF=docs/30-workflows/login-page-prototype-alignment
```

### 2.2 non-visual evidence の取得

```bash
mise exec -- pnpm typecheck 2>&1 | tee "$WF/outputs/phase-11/evidence/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$WF/outputs/phase-11/evidence/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee "$WF/outputs/phase-11/evidence/test.log"
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$WF/outputs/phase-11/evidence/build.log"

# HEX 直書き grep gate（auth.css / *.tsx に対する verify-design-tokens 相当）
rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/styles/auth.css apps/web/app/login \
  2>&1 | tee "$WF/outputs/phase-11/evidence/grep-gate.log"
```

> `.log` 拡張子は repository 全体の `.gitignore` で除外されている場合があるため、commit 直前に `git check-ignore -v outputs/phase-11/evidence/*.log` を確認すること。除外される場合は `.txt` に rename する（skill reference の Evidence 拡張子規約に準拠）。

### 2.3 visual evidence の取得（4 viewport × 5 state サブセット）

```bash
# dev server を起動（別ターミナル）
mise exec -- pnpm --filter @ubm-hyogo/web dev

# Playwright で screenshot を撮る（chromium / desktop + mobile）
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/login-smoke.spec.ts --project=desktop-chromium
```

撮影対象 5 state:

| state | URL | viewport |
|---|---|---|
| input | `/login` | 1440x900 (chromium desktop) |
| input-mobile | `/login` | 375x812 (chromium mobile) |
| sent | `/login?state=sent&email=test@example.com&redirect=/` | 1440x900 |
| error | `/login?state=error` | 1440x900 |
| unregistered | `/login?state=unregistered` | 1440x900 |

撮影後、生成 PNG は `outputs/phase-11/screenshots/` 配下に直接保存する。

## 3. provenance

| 種別 | provenance | 補足 |
|---|---|---|
| typecheck.log 〜 build.log | local `mise exec -- pnpm` | Node 24.15.0 / pnpm 10.33.2 を `.mise.toml` で固定 |
| grep-gate.log | local `rg` | `verify-design-tokens` CI gate と等価判定 |
| screenshots/*.png | local Playwright (chromium) | staging fresh evidence は Phase 13 後の user-gated task で差し替え |

staging visual smoke は本 Phase 11 では取得対象外（Phase 13 後の user-gated unassigned task で扱う）。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | present |
| typecheck log | outputs/phase-11/evidence/typecheck.log | n/a (summary に集約) |
| lint log | outputs/phase-11/evidence/lint.log | n/a (summary に集約) |
| test log | outputs/phase-11/evidence/test.log | n/a (summary に集約) |
| build log | outputs/phase-11/evidence/build.log | n/a (summary に集約) |
| grep gate log | outputs/phase-11/evidence/grep-gate.log | n/a (summary に集約) |
| screenshot (input desktop) | outputs/phase-11/screenshots/login-input.png | present |
| screenshot (input mobile) | outputs/phase-11/screenshots/login-input-mobile.png | present |
| screenshot (sent) | outputs/phase-11/screenshots/login-sent.png | present |
| screenshot (error) | outputs/phase-11/screenshots/login-error.png | present |
| screenshot (unregistered) | outputs/phase-11/screenshots/login-unregistered.png | present |
| screenshot (deleted) | outputs/phase-11/screenshots/login-deleted.png | present |
| screenshot (rules declined) | outputs/phase-11/screenshots/login-rules-declined.png | present |
| screenshot (admin gate) | outputs/phase-11/screenshots/login-gate-admin.png | present |

## 5. 受け入れ判定との対応

| AC | 対応 evidence |
|---|---|
| AC-1 / AC-2 / AC-3 / AC-4 / AC-6 / AC-7 | screenshots/login-input.png, screenshots/login-input-mobile.png |
| AC-5 | screenshots/login-sent.png |
| AC-8 | grep-gate.log |
| AC-9 | test.log（MagicLinkForm.component.spec.tsx の cooldown / submit / error 系） |
| AC-10 | typecheck.log / lint.log / build.log |
| AC-11 | screenshots/* の物理存在（Phase 11 inventory 表で `present`） |
| AC-12 | `bash scripts/verify-pr-ready.sh` の exit 0（Phase 12 compliance check に転記） |

## 6. 落とし穴と回避策

| 落とし穴 | 回避策 |
|---|---|
| `.log` が `.gitignore` で除外され compliance check が `missing-evidence` で fail | commit 直前に `git check-ignore -v` で確認し、除外される場合は `.txt` 拡張子に統一 |
| Server Component の SSR fetch が Playwright `page.route()` で intercept できない | `/login` は Server Component だが magic-link は client form 経由のため `page.route()` 不要。dev server を local 起動して直接撮影 |
| screenshot が responsive 切り替えで他 DOM を捕まえる | viewport を明示固定し、`page.setViewportSize({ width, height })` を spec に書く |
| HEX 直書きが google icon brand color で発生 | `currentColor` 1-tone fallback に振る（Phase 3 §6 のリスク対策に整合） |
| sent state の email を query string で安全に渡せない | `encodeURIComponent` 経由で URL を組む |

## 7. Phase 11 完了条件

- [x] §4 inventory 表の必須 screenshot 5 件が `Status=present`
- [x] tracked commit 対象に上記 screenshot と local summary を含める
- [x] AC-1〜AC-12 の evidence trail が §5 表で full-coverage
- [x] Phase 12 compliance check のセクション 1 / 4 へ本 inventory を転記済み
