# Implementation Guide

## Part 1: 中学生レベル

adapter は、給食を教室で食べやすい皿に盛り付ける係のようなものです。材料を作る係ではなく、受け取った形を画面が使いやすい形に整えます。

新しい項目を増やすときは、材料のルール、サンプル、テスト、盛り付け係、画面の順に確認すると、どこで失敗したか分かりやすくなります。

## Part 2: 技術者向け

Implemented files:

- `apps/web/src/lib/adapters/README.md`
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`

The README records the zod -> fixture -> spec -> adapter -> primitive order, the adapter invariants, and the eight-case responsibility mapping. The spec template remains commented and does not add a runtime test case.

## Part 3: Visual Evidence

This task is NON_VISUAL. It does not change rendered UI, CSS, routes, API payloads, or adapter runtime behavior. Therefore no screenshot is required for Phase 11; the Phase 11 evidence is the walkthrough at `outputs/phase-11/walkthrough.md`.
