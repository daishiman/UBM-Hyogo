<!-- workflow: members-list-ux-clarity / task: A / phase: 13 -->

# Phase 13 — PR 作成 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

> **user-gated**: commit / push / PR は user の明示承認後にのみ実行する。本ファイルは内容のテンプレ。

## 1. PR title

```
feat(members-density-toggle): sublabel + HelpHint で密度モードの意味伝達を強化 (Task A)
```

(70 文字以内)

## 2. PR base / head

- base: `dev`
- head: `feat/members-list-ux-clarity`

## 3. PR body テンプレ

```markdown
## Summary

- `/members` の DensityToggle (ゆったり / 密 / リスト) に **sublabel + HelpHint popover** を追加し、各モードの用途が画面上で 2 秒以内に判別できるようにした
- プロトタイプ主ラベルは不変。`Segmented` の option 型を optional prop で加法拡張し、`HelpHint` は `<details>` ベースの feature レベル client component (新 primitive 0)
- URL query / OKLch tokens / API / D1 schema 変更なし

親 workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
本 PR は Task A 単独。Task B / C は別 PR。

## 変更点

| 種別 | パス |
| ---- | ---- |
| 修正 | `apps/web/src/components/public/DensityToggle.client.tsx` |
| 修正 | `apps/web/src/components/ui/Segmented.tsx` (optional prop 加法) |
| 新規 | `apps/web/src/components/public/DensityToggle.client.tsx` |
| 修正 | `apps/web/src/styles/legacy-public.css` |
| 修正 | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` |

## Test plan

- [x] `pnpm --filter @ubm/web vitest run src/components/public/__tests__/DensityToggle.client.spec.tsx` (12 ケース GREEN)
- [x] `pnpm --filter @ubm/web typecheck`
- [x] `pnpm --filter @ubm/web lint`
- [x] `pnpm verify-design-tokens` (HEX 0 / 新 primitive 0)
- [x] desktop / mobile / VoiceOver 手動確認 (`outputs/phase-11/manual-test-result.md`)
- [x] screenshot 6 枚 (`outputs/phase-11/screenshots/`)

## スクリーンショット

`outputs/phase-11/screenshots/` 配下:
- `density-toggle-desktop-comfy.png`
- `density-toggle-desktop-help-open.png`
- `density-toggle-desktop-dense.png`
- `density-toggle-desktop-list.png`
- `density-toggle-mobile-comfy.png`
- `density-toggle-mobile-help-open.png`

## 不変条件確認

- INV-1 既存 API endpoint surface 維持: OK
- INV-2 URL query SSOT (`density` のみ操作): OK (TC-A12)
- INV-3 新 primitive 0: OK (`HelpHint` は `components/public/`)
- INV-4 OKLch tokens 正本: OK (`verify-design-tokens` GREEN)
- INV-5 プロトタイプ主ラベル不変: OK (TC-A7)
- INV-6 Server Component 構造不変: OK (本タスクは client component のみ変更)
```

## 4. 検証手順 (PR 作成前)

```bash
# diff 確認
git status --porcelain
git diff dev...HEAD --name-only

# 4 ゲート
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## 5. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(members-density-toggle): sublabel + HelpHint で密度モードの意味伝達を強化 (Task A)" --body "$(cat <<'EOF'
... (上記 PR body をそのまま貼り付け) ...
EOF
)"
```

## 6. DoD

- [ ] user の明示承認を得てから commit / push / PR
- [ ] PR title 70 文字以内
- [ ] PR body にスクリーンショット 6 枚参照を含む (`outputs/phase-11/screenshots/`)
- [ ] 4 ゲート (install / typecheck / lint / verify-pr-ready) PASS
- [ ] base = `dev` を明示
- [ ] 親 workflow と Task B / C の関係を本 PR 内で参照
