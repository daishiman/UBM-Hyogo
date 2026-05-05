# Implementation Guide

## Part 1: 中学生レベルの説明

これは、すでに用意したプロフィール画面テストを、承認されたログイン状態で実行して、画面の写真と編集フォームが無いことの記録を取るための作業です。まだ実行していないので、今あるファイルは「どこに何を保存するか」を間違えないための準備記録です。

## Part 2: Technical Notes

- Runtime command: pending user approval.
- Evidence root: `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/`.
- Wrapper: `scripts/capture-profile-evidence.sh`.
- Playwright spec: `apps/web/playwright/tests/profile-readonly.spec.ts`.
- Secret boundary: storageState contents, cookies, tokens, URLs with Magic Link tokens, and email values must not be committed.
- Current status: `NOT_EXECUTED_PENDING_USER_APPROVAL`.
