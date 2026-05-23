# Phase 9: 品質保証（local PASS 5 点セット）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 |
| task | task-12-member-detail-register-legal |
| state | spec-fixed / implementation pending / runtime evidence pending_user_approval |

## 目的

task-12 の実装に対する local PASS 5 点（typecheck / lint / build / vitest / playwright）+ 周辺 grep gate（HEX 直書き / `D1Database` / `data-stable-key` 焼き込み / consent キー / iframe 禁止 / skip 禁止）+ axe critical=0 を確定する。Phase 11 の runtime evidence 提出はこの Phase の出力を入力とする。

## 実行タスク

- [ ] local PASS 5 点が exit 0 になることを確認する
- [ ] grep gate（5 系統）が exit 0 になることを確認する
- [ ] axe-core critical violation が 0 件であることを確認する
- [ ] `data-stable-key` 焼き込み監査が pass する
- [ ] coverage 目標を達成する
- [ ] runtime evidence は user-gated として false-green にしない

## 参照資料

- 本 workflow `phase-05.md` / `phase-06.md` / `phase-07.md` / `phase-08.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（一次原典 §6 実行コマンド / §7 DoD）
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- task-18（regression / verify-design-tokens）: `apps/web/scripts/verify-design-tokens.ts`（task-12 完了後にこの走査対象に含まれる）

## 成果物

- `outputs/phase-09/main.md`
- `outputs/phase-11/evidence/{typecheck,lint,test,build,e2e,grep-gate,axe,coverage}.log`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` を `apps/web/playwright.config.ts` の web project（既存）で実行する。staging-smoke project（task-05）には乗せない（本 spec は local / CI 双方で動かす dev gate）。

## local PASS 5 点

| # | gate | コマンド | evidence path |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.log` |
| 2 | lint | `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.log` |
| 3 | unit test | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal` | `outputs/phase-11/evidence/test.log` |
| 4 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | `outputs/phase-11/evidence/build.log` |
| 5 | e2e (Playwright) | `PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium` | `outputs/phase-11/evidence/e2e.log` + `playwright-report/` |

5 項目すべて exit 0 を期待。

## grep gate（5 系統）

```bash
# (a) HEX 直書き / Tailwind arbitrary color 禁止（OKLch tokens 必須）
! rg -n '#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#' \
  apps/web/src/components/public \
  apps/web/src/components/legal \
  'apps/web/app/(public)/members/[id]/page.tsx' \
  'apps/web/app/(public)/register/page.tsx' \
  apps/web/app/privacy/page.tsx \
  apps/web/app/terms/page.tsx

# (b) D1Database 直接参照禁止（不変条件 #5）
! rg -n 'D1Database' apps/web/src apps/web/app

# (c) iframe 埋め込み禁止（不変条件 #7）
! rg -n '<iframe' \
  'apps/web/app/(public)/register/page.tsx' \
  apps/web/src/components/public/RegisterCallout.tsx

# (d) consent キー統一（不変条件 #2）— 許可キーは publicConsent / rulesConsent のみ
rg -n 'Consent' apps/web/src/components/public/RegisterCallout.tsx \
  | rg -v 'publicConsent|rulesConsent' \
  | (! grep . )

# (e) skip 禁止（テスト false-green 防止）
! rg -n 'test\.describe\.skip|test\.skip\(true|it\.skip|describe\.skip|xit\(' \
  apps/web/playwright/tests/public-detail-register-legal.spec.ts \
  apps/web/src/components/public \
  apps/web/src/components/legal
```

5 項目すべて exit 0 を期待。

## data-stable-key 焼き込み監査

不変条件 #1 の遵守確認。task-18 verify-design-tokens.ts の派生として **本 task では vitest assert で代替** する。

```bash
# 静的 grep（参考）— MemberDetailSections / MemberLinks / MemberActivity / FormPreviewSections に必ず付く
rg -n 'data-stable-key=' apps/web/src/components/public/MemberDetailSections.tsx \
  apps/web/src/components/public/MemberLinks.tsx \
  apps/web/src/components/public/MemberActivity.tsx \
  apps/web/src/components/public/FormPreviewSections.tsx
# 期待: 各ファイルで 1 箇所以上ヒット
```

vitest 側で `MemberDetailSections.test.tsx` に次の assert を含める:

```ts
const visibleFieldCount = sections
  .flatMap((s) => s.fields.filter((f) => f.kind !== "url"))
  .length;
const stableKeyCount = container.querySelectorAll('[data-stable-key]').length;
expect(stableKeyCount).toBe(visibleFieldCount);
```

## axe-core critical=0

Playwright spec に組み込み済み（Phase 5 §Step 6）。Phase 11 で `outputs/phase-11/evidence/axe.json` に集計を保存する。

```ts
const axe = await new AxeBuilder({ page }).analyze();
expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
```

対象: `/members/[id]`（200 ページ）/ `/register` / `/privacy` / `/terms`（404 ページの axe は task-05 でカバー済み）。

## 単体テストカバレッジ

| 対象 | Statement | Branch | Function |
| --- | --- | --- | --- |
| `apps/web/src/components/public/MemberDetailSections.tsx` | ≥ 90% | ≥ 85% | ≥ 90% |
| `apps/web/src/components/public/MemberLinks.tsx` | ≥ 90% | ≥ 85% | ≥ 90% |
| `apps/web/src/components/public/MemberTags.tsx` | ≥ 90% | ≥ 85% | ≥ 90% |
| `apps/web/src/components/public/RegisterCallout.tsx` | ≥ 90% | ≥ 80% | ≥ 90% |
| `apps/web/src/components/public/FormPreviewSections.tsx` | ≥ 85% | ≥ 75% | ≥ 85% |
| `apps/web/src/components/public/ProfileHero.tsx` | ≥ 80% | ≥ 70% | ≥ 80% |
| `apps/web/src/components/public/MemberActivity.tsx` | ≥ 80% | ≥ 70% | ≥ 80% |
| `apps/web/src/components/legal/LegalProse.tsx` | ≥ 90% | n/a | ≥ 90% |

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal --coverage
```

evidence: `outputs/phase-11/evidence/coverage.txt`。

## E2E coverage

`coverage/e2e/coverage-summary.json` の lines.pct ≥ 80（task-touched modules）。

## 不変条件チェックリスト（Phase 9 で確認）

| 不変条件 | 確認方法 | 期待 |
| --- | --- | --- |
| #1 stableKey 経由参照 | vitest assert + grep | row 数 = stableKey 数 |
| #2 consent キー統一 | grep gate (d) | exit 0 |
| #5 D1 直接禁止 | grep gate (b) | exit 0 |
| #7 Google Form 再回答経路 | grep gate (c) + Playwright `target="_blank"` assert | exit 0 / pass |
| OKLch tokens 必須 | grep gate (a) | exit 0 |
| 既存 endpoint のみ消費 | `git diff dev...HEAD --name-only \| rg 'apps/api/src/routes/public'` で 0 件 | 0 件 |

## staging smoke の暫定実行（参考）

本 task の e2e spec は local / CI dev で実行する想定で、task-05 の `staging-smoke` project には乗せない。staging で 4 ページの 200 を確認したい場合は task-05 の `staging-smoke.spec.ts` 内 19 routes に既に該当行が含まれているため、追加実装は不要。

## 完了条件

- [ ] local PASS 5 点（typecheck / lint / unit test / build / e2e）が全て exit 0
- [ ] grep gate 5 系統が全て exit 0
- [ ] vitest で `data-stable-key` 焼き込み数 = visible field 数 を assert pass
- [ ] axe critical violation = 0（4 ページ）
- [ ] 単体テストカバレッジが目標達成
- [ ] `coverage/e2e/coverage-summary.json` の lines.pct ≥ 80
- [ ] 不変条件 #1 / #2 / #5 / #7 / OKLch / 既存 endpoint のみ消費 が全て確認済み
- [ ] runtime evidence path が `outputs/phase-11/evidence/` 配下に揃う想定で Phase 11 にエスカレーション可能
