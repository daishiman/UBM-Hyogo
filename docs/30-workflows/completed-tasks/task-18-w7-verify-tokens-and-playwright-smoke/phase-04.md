# Phase 4: テスト戦略

## 目的

「回帰防止 gate を作る」タスクであるため、**gate 自身が機能する**ことを二重に検証する。test specification を Phase 5 の RED に持ち込めるレベルまで固める。

## 4.1 verify-design-tokens.test.ts（Vitest unit）

| ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| C1 | 完全一致 | 09b JSON と tokens.css 同値、globals bridge 完全 | `ok: true` / drifts.length === 0 / exit 0 |
| C2 | 値ミスマッチ | tokens.css 側 `--ubm-color-accent` を `oklch(0.99 0 0)` に書換（fixture） | `value-mismatch` 1 件 / exit 1 |
| C3 | tokens.css 側欠落 | tokens.css fixture から `--ubm-color-ok-soft` 削除 | `missing-in-tokens-css` 1 件 / exit 1 |
| C4 | 09b 側欠落 | 09b fixture から `--ubm-color-info` 削除 | `missing-in-09b` 1 件 / exit 1 |
| C5 | 空白正規化 | `oklch(0.58  0.10  55)` vs `oklch(0.58 0.10 55)` | drift 0 |
| C6 | ネスト無視 | `color-mix(in oklch, var(--accent) 12%, transparent)` | OKLch literal として扱わない（drift 0） |
| C7 | theme bridge 欠落 | globals.css fixture から `--color-accent` 削除 | `missing-theme-bridge` 1 件 / exit 1 |

実装方針:
- fixture は test file 内 inline string で構築（temp file 不要）
- `verifyDesignTokens({ specPath, tokensCssPath, globalsCssPath })` を直接呼ぶ
- 並列実行可（fixture が独立）

実行: `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts`

## 4.2 Playwright smoke self-test（手動 + 自動）

| ID | ケース | 仕掛け | 期待 |
| --- | --- | --- | --- |
| S1 | 全 route 200 | local dev で `e2e:smoke` | 17 URL routes 全 PASS |
| S2 | 1 route 500 | `/admin/audit` route handler 一時 throw | smoke 1 件 fail / exit 1 |
| S3 | a11y violation 注入 | `/login` の `<label>` 一時削除 | axe-core serious で fail |
| S4 | landmark 欠落 | `/profile` の `<main>` 一時削除 | landmark waitFor timeout |
| S5 | redirect 期待 | 未認証で `/profile` 訪問 | login redirect が検出される |

S2〜S5 は PR レビュー時に 1 回手動で「壊して通るか」を確認。S1 は CI で自動。

## 4.3 Visual diff self-test

| ID | ケース | 仕掛け | 期待 |
| --- | --- | --- | --- |
| V1 | baseline 確立 | 初回 `e2e:visual:update` | 4 PNG が `__screenshots__/` に生成・commit 可能 |
| V2 | 微小差分 | typo 修正レベル（< 2% pixel） | PASS |
| V3 | 大規模 layout 変更 | `/admin` レイアウト改変 | FAIL + diff artifact upload |

## 4.4 既存 PASS 5-set との関係

`references/phase-11-guide.md` の local PASS 5-set（typecheck / lint / test / build / grep-gate）を本タスクでも採用:

| evidence | 取得コマンド | 出力先 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.txt` |
| lint | `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.txt` |
| test | `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts` | `outputs/phase-11/evidence/test.txt` |
| build | `pnpm --filter @ubm-hyogo/web build` | `outputs/phase-11/evidence/build.txt` |
| verify:tokens | `mise exec -- pnpm verify:tokens` | `outputs/phase-11/evidence/verify-tokens.txt` |
| smoke | `pnpm --filter @ubm-hyogo/web e2e:smoke` | `outputs/phase-11/evidence/e2e-smoke.txt` |
| visual | `pnpm --filter @ubm-hyogo/web e2e:visual` | `outputs/phase-11/evidence/e2e-visual.txt` |

## 4.5 テスト常時実行可能性 DoD（references/quality-gates.md §7 反映）

- 対象 spec の列挙: `apps/web/playwright/tests/full-smoke.spec.ts` / `apps/web/playwright/tests/visual/{login,public-top,admin-dashboard,profile}.spec.ts`
- 1 行実行コマンド: `pnpm --filter @ubm-hyogo/web e2e:smoke` / `pnpm --filter @ubm-hyogo/web e2e:visual`
- 実行前提と自動化: `.github/workflows/playwright-smoke.yml` で `pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium` を実行
- un-skip 不変条件: `test.describe.skip` / `test.skip` / `test.todo` を**先送り目的で使わない**（CONST_007）。fixture 未整備で skip する場合は Phase 12 で unassigned 起票
- browser binary 自動 install: workflow step と Phase 8 command に明記
- dev server 自動起動: `apps/web/playwright.config.ts` の `webServer` を使用
- CI gate 化: `.github/workflows/playwright-smoke.yml` の `smoke (chromium)` / `visual (chromium, 4 screens)` を required context 候補にする
- E2E coverage ≥ 80%: 既存 `.github/workflows/e2e-tests.yml` / `e2e-tests-coverage-gate` が repository threshold を担当し、本タスクの smoke/visual は coverage gate を置き換えない

## 完了条件

- [ ] C1〜C7 の入力/期待値が確定
- [ ] S1〜S5 / V1〜V3 が確定
- [ ] PASS 5-set + smoke + visual の 7 evidence path 確定
- [ ] test.skip 残留禁止が明記

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- verify script、smoke、visual baseline のテスト戦略と E2E DoD を固定する。

| Task | 内容 |
| --- | --- |
| 4-A | verify-design-tokens unit C1〜C7 を定義する |
| 4-B | smoke / visual の self-test と常時実行可能性 DoD 8 点を定義する |
| 4-C | ignored `.log` を避け、tracked `.txt` evidence path を正本化する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| quality gates | `.claude/skills/task-specification-creator/references/quality-gates.md` | テスト常時実行可能性 DoD |
| Playwright config | `apps/web/playwright.config.ts` | webServer / evidence output |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 4 仕様 | `phase-04.md` | テスト戦略 / DoD |

## 統合テスト連携

Phase 4 では integration 実行条件を固定する。実測は Phase 8 の local gate と Phase 11 evidence で行う。
