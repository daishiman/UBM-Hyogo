---
phase: 11
title: Evidence inventory — Playwright snapshot + adapter unit 結果
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. Evidence file 一覧

本 inventory は実 evidence ファイルを **本仕様書作成時には生成しない**。Phase 13 PR 作成時に下記取得手順に従って `outputs/phase-11/` 配下へ配置することを義務とする。

| # | evidence | パス（絶対） | 種別 | 取得手順 |
|---|----------|-------------|------|---------|
| E-01 | Playwright visual snapshot (chromium) | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/screenshots/public-member-detail.png` | image/png | `apps/web/playwright/tests/serial-06-member-detail.spec.ts` が取得 |
| E-02 | adapter unit spec 出力 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/adapter-spec.txt` | text/plain | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts \| tee outputs/phase-11/adapter-spec.txt` |
| E-03 | Playwright spec 出力 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/playwright-result.txt` | text/plain | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-member-detail --project=chromium \| tee outputs/phase-11/playwright-result.txt` |
| E-04 | visibility filter DOM assertion 結果 | E-03 に含まれる | text/plain | E-03 と同一 |
| E-05 | typecheck 結果 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/typecheck.txt` | text/plain | `mise exec -- pnpm typecheck \| tee outputs/phase-11/typecheck.txt` |
| E-06 | lint 結果 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/lint.txt` | text/plain | `mise exec -- pnpm lint \| tee outputs/phase-11/lint.txt` |
| E-07 | verify-pr-ready 結果 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/verify-pr-ready.txt` | text/plain | `bash scripts/verify-pr-ready.sh \| tee outputs/phase-11/verify-pr-ready.txt` |
| E-08（任意） | adapter coverage report | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/adapter-coverage.txt` | text/plain | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts --coverage \| tee outputs/phase-11/adapter-coverage.txt` |

## 2. evidence existence validator 対応

`task-specification-creator` の `phase11 evidence existence validator` が parse できる形式で記述する:

- 各 evidence 行は `| E-XX | <name> | <path> | <type> | <method> |` 形式で 1 行に収める
- path は絶対パスで記述
- 取得未了でも仕様書としては valid（実取得は Phase 13 PR 作成時）
- Phase 13 PR 作成時には E-01 / E-02 / E-03 / E-05 / E-06 / E-07 が実在することを必須とする（E-04 / E-08 は任意）

## 3. evidence ディレクトリ作成

```bash
mkdir -p docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11
```

## 4. 完了判定

- [ ] E-01 〜 E-07 全てが `outputs/phase-11/` に実ファイルとして存在する
- [ ] E-01 が PR 本文に画像参照として含まれる（CLAUDE.md「PR作成の完全自律フロー」§PR作成前チェック）
- [ ] E-03 内で `[data-stable-key="response_email"]` / `[data-stable-key="public_consent"]` の `toHaveCount(0)` assertion が green
- [ ] E-04（visibility filter）が E-03 内で明示的に green である

## 5. PR 本文への引用

PR 本文（Phase 13 §4）には少なくとも以下を含める:

```markdown
## Evidence
- Playwright snapshot: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/screenshots/public-member-detail.png`
- adapter spec output: `outputs/phase-11/adapter-spec.txt`
- Playwright result: `outputs/phase-11/playwright-result.txt`
- typecheck / lint / verify-pr-ready: `outputs/phase-11/{typecheck,lint,verify-pr-ready}.txt`
```

スクリーンショット（E-01）が存在しない場合は **スクリーンショット専用セクションを PR 本文に残さない**（CLAUDE.md PR 作成前チェック）。

## 6. 参照

- Phase 6 テスト方針
- Phase 10 ローカル検証
- Phase 13 commit & PR
- `.claude/skills/task-specification-creator/references/phase-11-guide.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
