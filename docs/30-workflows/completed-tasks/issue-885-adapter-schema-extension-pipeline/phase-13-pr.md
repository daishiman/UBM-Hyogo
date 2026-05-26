# Phase 13: PR 作成

## 1. ブランチ / base

- 作業ブランチ: `feat/issue-885-adapter-schema-extension-pipeline`（推奨）
- base: `dev`
- Issue: [#885](https://github.com/daishiman/UBM-Hyogo/issues/885)（CLOSED のまま維持）

## 2. PR タイトル

```
docs(adapters): document schema extension pipeline for member-detail adapter (#885)
```

## 3. PR 本文テンプレ

```markdown
## Summary

- `apps/web/src/lib/adapters/README.md` を新規作成し、`PublicMemberProfileZ` 拡張時の 5 ステップ checklist（zod → fixture → spec → adapter → primitive）と責務 mapping 表（既存 8 spec ケース × 5 列）を明文化
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` 末尾に `// === EXTENSION TEMPLATE ===` コメントブロックを追加し、新 kind 追加時のコピペ雛形を提供
- adapter ロジック本体は **未変更**（README + spec コメントのみ）

## Why

serial-06 (`form-response-binding`) で実装した adapter は `PublicMemberProfileZ` の現状 shape を前提に書かれている。schema 拡張時の手順が暗黙知化していたため、引き継ぎコストを下げる目的でドキュメント整備。

## Refs

- Refs #885（Issue は CLOSED のまま維持。`Fixes` / `Closes` は使わない）
- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/`
- 仕様書: `docs/30-workflows/completed-tasks/issue-885-adapter-schema-extension-pipeline/`

## Test plan

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts`（既存 8 ケース PASS / 新規ケース追加なし）
- [x] `bash scripts/verify-pr-ready.sh`
- [x] `apps/web/src/lib/adapters/README.md` の 5 ステップ / 責務 mapping 表 / 落とし穴 2 トピックを目視確認
- [x] `grep -c "EXTENSION TEMPLATE" apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` が `2`
- [x] `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md` 削除済
- [x] stale 参照 grep 0 件

## Out of scope

- 実 schema 拡張（仮の `socialLinks` 追加など）
- primitive 拡張
- API 側 use case 変更
- adapter ロジック本体の変更
```

## 4. PR 作成コマンド

```bash
gh pr create --base dev --title "docs(adapters): document schema extension pipeline for member-detail adapter (#885)" --body "$(cat <<'EOF'
（上記 PR 本文をそのまま貼り付け）
EOF
)"
```

## 5. PR 作成前 final gate

```bash
git status --porcelain   # empty
git diff --name-only dev...HEAD  # 期待ファイルのみ
pnpm typecheck && pnpm lint
bash scripts/verify-pr-ready.sh
```

## 6. Issue クローズ状態の確認

- 本 PR では `Fixes #885` / `Closes #885` を **使わない**（Issue は CLOSED のまま）
- `Refs #885` のみ記載
- マージ後も Issue 状態は変えない
