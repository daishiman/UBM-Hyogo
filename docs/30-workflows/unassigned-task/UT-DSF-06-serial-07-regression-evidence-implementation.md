# UT-DSF-06: serial-07 regression evidence + CI gate green 確保

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-06 |
| タスク名 | serial-07 Playwright visual baseline 4 screens + 最小 6 gate green |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 3 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation / serial-07-regression-evidence |

## 目的

UT-DSF-01〜05 で構築した「プロトタイプ正本反映の仕組み」が、後続 PR / 後続 task で
**regression を起こさないこと** を機械的に保証する。Playwright visual baseline 4 screens
（top / public members list / public member detail / admin dashboard）を取得し、
verify-design-tokens / verify-pr-ready を含む最小 6 gate を固定して PR push 時の required
status check 候補に揃える。

## スコープ

### 含む

- `apps/web/playwright/tests/visual/{top,members-list,member-detail,admin-dashboard}.spec.ts` の新規追加 / 既存編集
- 対応する `*.spec.ts-snapshots/*.png` baseline の物理コミット
- 最小 6 gate の green 確保:
  - G1: Playwright visual 4 screens
  - G2: `verify-design-tokens`（HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件）
  - G3: `pnpm typecheck`
  - G4: `pnpm lint`
  - G5: `next build --webpack`
  - G6: `bash scripts/verify-pr-ready.sh`（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift）
- evidence の `outputs/phase-11/` 物理配置 + inventory ledger 整合
- Phase 13 PR draft に required status check 候補リスト明記:
  - `verify-design-tokens / verify-design-tokens`
  - `playwright-smoke / smoke (chromium)`
  - `playwright-smoke / visual (chromium, 4 screens)`
  - `verify-phase12-compliance`
  - `verify-gate-metadata`
  - `verify-indexes-up-to-date`

### 含まない

- UT-DSF-01〜05 のコード再変更（regression 発見時は該当 UT にバックポート）
- 新規 CI workflow ファイル作成（既存の trigger / path 拡張のみ）
- E2E（非 visual）spec 追加
- A11y / Lighthouse 等の追加 gate
- production-equivalent runtime（Cloudflare Workers staging）でのスクリーンショット取得（UT-DSF-07 の責務）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-01〜05 すべて完了 | regression 検出対象が build green 状態に到達している必要 |
| 下流 | UT-DSF-07（VISUAL_RUNTIME production-equivalent） | local visual baseline 確立後、staging runtime での再取得が次段階 |

## 苦戦箇所・知見

**Playwright visual evidence 4 screens の固定**: SCOPE.md DoD #5 と CLAUDE.md branch protection note の
`playwright-smoke / visual (chromium, 4 screens)` required status check 候補に合わせ、screen 数を 4 固定。
top / public members list / public member detail / admin dashboard を選定。

**Flake 防止（animation / transition / caret-color disable）**: 既存 `public-top.spec.ts` L7 パターンを
踏襲。`page.addStyleTag` で `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`
を注入。

**`maxDiffPixelRatio: 0.02` の既存揃え**: 既存 visual spec と同一閾値を維持。

**font rendering OS 差異**: snapshot baseline は OS / browser font rendering の差異の影響を受ける。
CI runner を `ubuntu-latest` 固定（既存 `playwright-visual-full.yml` と整合）。ローカル取得時は CI
コンテナと同等の環境（Playwright Docker image）を使うか、CI artifact を baseline 化する運用を選択。

**mock API 既存 fixture 再利用**: `apps/web/playwright/fixtures/auth.ts` の `mockApi` fixture を再利用。
新規 mock server を立てない。member detail / admin dashboard は auth / fixture 連携が必要なため、
fixture seed（UT-DSF-05）との接続を確認。

**`.gitignore` で baseline 除外しない**: `apps/web/playwright/tests/visual/*.spec.ts-snapshots/` を gitignore に
含めない。snapshot は git 追跡対象。

**最小 6 gate と `verify-pr-ready.sh` 内訳**: `verify-pr-ready.sh` は `verify:phase12-compliance` /
`gate-metadata:validate` / `indexes:rebuild` drift の 3 段階。失敗時のデバッグは
`.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照。

**test suffix**: `*.spec.ts` のみ。`*.test.ts` は禁止（CLAUDE.md 不変条件 #8 / lefthook `block-test-suffix`）。

## 受け入れ基準

- [ ] `apps/web/playwright/tests/visual/{top,members-list,member-detail,admin-dashboard}.spec.ts` 4 件が green
- [ ] 対応する `*.spec.ts-snapshots/*.png` baseline が物理コミット済み
- [ ] `verify-design-tokens` CI gate green
- [ ] `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0
- [ ] `bash scripts/verify-pr-ready.sh` が exit 0
- [ ] `outputs/phase-11/` 配下に evidence 物理配置済み + inventory ledger と整合
- [ ] Phase 13 PR draft に required status check 候補リスト明記済み
- [ ] テスト suffix は `*.spec.ts` のみ

## 参照

正本仕様（Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-03-task-breakdown.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-04-data-contract.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-05-implementation-guide.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-06-test-strategy.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-07-quality-gates.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-08-dod.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-09-risks.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-10-local-verification.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-12-compliance.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-13-commit-pr-draft.md`

参考:

- `apps/web/playwright.config.ts`（L31-L36 既存 visual 経路）
- `apps/web/playwright/tests/visual/public-top.spec.ts`（既存パターン）
- `.github/workflows/playwright-visual-full.yml`
- `.github/workflows/verify-design-tokens.yml`
- `scripts/verify-pr-ready.sh`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
