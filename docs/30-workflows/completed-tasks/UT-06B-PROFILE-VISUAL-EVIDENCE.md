# UT-06B-PROFILE-VISUAL-EVIDENCE

## Canonical Status

This file is a legacy summary stub. The canonical workflow is:

`docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/`

Current canonical state is `spec_created`; Phase 11 visual evidence is not captured yet. Do not treat this legacy summary as completed evidence.

## Summary

06b `/profile` logged-in visual evidence を取得する。2026-04-29 review では `/login` 5 状態 screenshot と `/profile` 未ログイン redirect curl は取得済みだが、実 session / API fixture が未準備のため `/profile` logged-in screenshot は未取得。

## Why

`/profile` は read-only 境界、不変条件 #4 / #5 / #8 / #11 を人の目で確認すべき UI である。Phase 11 の M-08〜M-10、M-14〜M-16 を完了させるには、ログイン済み session と `/me` `/me/profile` の実データが必要。

## Acceptance Criteria

- `outputs/phase-11/evidence/screenshot/M-08-profile.png` が取得されている
- `outputs/phase-11/evidence/screenshot/M-09-no-form.png` が取得され、アプリ内本文編集 form / input / textarea / submit button が 0 件である
- `outputs/phase-11/evidence/screenshot/M-10-edit-query-ignored.png` が取得され、`/profile?edit=true` でも read-only が維持される
- staging deploy 後、M-14〜M-16 の screenshot / DevTools evidence が取得されている
- `manual-smoke-evidence.md` の該当行が `pending` から `captured` に更新されている

## Dependencies

- 04b `/me` `/me/profile` が staging/local fixture で利用可能
- 05a/05b session が local or staging で確立可能

## Priority

High for visual QA close-out before PR.
