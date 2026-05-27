# 2026-05-27: dev sync で新規 lint gate が降ってきた場合の post-merge 検出と置換

## 背景

`feat/admin-attendance-analytics-redesign` ← dev (`04c569a48` 累積、`0df8ecc55` issue-924 inline-style guard を含む) の sync-merge で、conflict 0 / `pnpm sync:resolve` 不要だったが、merge 直後の `pnpm lint` 実行で `verify-no-inline-style: FAIL` が発生した。本ブランチ側で先行追加していた attendance redesign 系 progress bar 2 ファイルが、dev 側で新規追加された broad grep gate (`scripts/verify-no-inline-style.sh` の `style={` detection) に検出された。

## task-specification-creator への影響

タスク仕様書を作成・更新する際の Phase 4 / Phase 9 / Phase 12 で「dev 側に追加された invariant gate が feature 側既存実装に及ぶケース」を必ず想定する。具体的には:

1. **Phase 4 test-plan**: dev 側で `verify-*` 系 gate が追加されている場合、自タスクの touched paths がその gate scope に入るかを `bash scripts/verify-*` 実行で事前検証する step を必ず入れる。
2. **Phase 9 QA matrix**: `pnpm lint` / `pnpm typecheck` / `bash scripts/verify-pr-ready.sh` を dev sync 直後にも完走させる規範を明示する（PR 作成直前ではなく merge commit 直後）。
3. **Phase 12 compliance-check**: `verify-no-inline-style` / `verify-design-tokens` / `verify-test-suffix` 等の dev 側追加 gate を 1 度でも踏んだ場合、artifacts.json `metadata.gates` に該当 gate 名と PASS 経緯を残す（`metadata.gates` の zod schema は既存のまま）。

## 関連 SSOT

- `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-050 が正本
- 置換 pattern (区分C 連続値 → SVG `<rect>`) は `lessons-learned-issue-924-style-src-attr-retirement-2026-05.md` L-I924-004 が正本
- task-specification-creator 側は本 changelog で参照記録のみ。Phase template への独自ルール追加は不要（既存 phase-template-core.md の「Phase 9 で `pnpm lint` 完走」「Phase 12 で `bash scripts/verify-pr-ready.sh` 完走」規範で吸収可能）。
