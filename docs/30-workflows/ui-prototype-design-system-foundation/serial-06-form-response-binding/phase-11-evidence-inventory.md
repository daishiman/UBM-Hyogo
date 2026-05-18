---
phase: 11
title: Evidence inventory — Playwright snapshot + adapter unit 結果
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. Evidence file 一覧

| # | evidence | パス（絶対） | 種別 | 取得手順 |
|---|----------|-------------|------|---------|
| E-01 | Playwright visual snapshot (chromium) | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/public-member-detail.png` | image/png | Phase 10 §5.1 |
| E-02 | adapter unit spec 出力 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/adapter-spec.txt` | text | `pnpm test -- adapters/__tests__/member-detail \| tee outputs/phase-11/adapter-spec.txt` |
| E-03 | Playwright spec 出力 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/playwright-result.txt` | text | `pnpm exec playwright test public-member-detail \| tee outputs/phase-11/playwright-result.txt` |
| E-04 | visibility filter DOM assertion 結果 | E-03 に含まれる | text | E-03 と同一 |
| E-05 | typecheck 結果 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/typecheck.txt` | text | `pnpm typecheck \| tee outputs/phase-11/typecheck.txt` |
| E-06 | lint 結果 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/lint.txt` | text | `pnpm lint \| tee outputs/phase-11/lint.txt` |
| E-07 | verify-pr-ready 結果 | `/docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/verify-pr-ready.txt` | text | `bash scripts/verify-pr-ready.sh \| tee outputs/phase-11/verify-pr-ready.txt` |

## 2. evidence existence validator 対応

Phase 11 evidence inventory parser（既存 skill `task-specification-creator` の `phase11 evidence existence validator`）が parse できる形式で記述する。

- 各 evidence 行は `| E-XX | <name> | <path> | <type> | <method> |` 形式
- path は絶対パスで記述
- 取得未了でも構わないが、Phase 13 PR 作成時には E-01 / E-02 / E-03 / E-05 / E-06 / E-07 が実在することを必須とする

## 3. 完了判定

- [ ] E-01 〜 E-07 全てが outputs/phase-11/ に存在する
- [ ] E-01 が PR 本文に画像参照として含まれる（CLAUDE.md「PR作成の完全自律フロー」§PR作成前チェック）
- [ ] E-03 内で visibility filter assertion が green

## 4. 参照

- Phase 6 テスト方針
- Phase 10 ローカル検証
- `.claude/skills/task-specification-creator/references/` Phase 11 evidence 関連
