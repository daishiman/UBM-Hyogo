# Phase 13: PR — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. ブランチ

- 作業ブランチ: `feat/issue-769-root-error-focus`
- base: `dev`（CLAUDE.md「PR作成の完全自律フロー」既定）

## 2. PR タイトル

```
feat(issue-769): root error.tsx h1 auto-focus for screen reader
```

## 3. PR 本文テンプレート

```markdown
## 関連

- Issue: #769
- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`
- 本タスク workflow: `docs/30-workflows/issue-769-root-error-focus/`
- 消費される未タスク: `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md`（status: consumed_by_issue_769_local_implementation）

## Summary

`parallel-07` spec section 4.3 「Root error.tsx focus 管理」未達を解消。`apps/web/app/error.tsx` の h1 にマウント直後の自動 focus を移譲し、screen reader によるエラー見出しの即時読み上げを促進する。

差分は 4 行 + テスト 3 ケース。

## Part 1: 中学生レベルの説明

エラー画面が出た瞬間に、画面の大見出し（`<h1>画面を表示できませんでした</h1>`）に自動でカーソル（focus）を移します。これによりスクリーンリーダーが見出しを即座に読み上げ、目が見えにくい人がエラーに気付くまでの時間が短縮されます。`preventScroll: true` を指定することで、focus 移動時に画面がトップへスナップする UX 回帰も防ぎます。

## Part 2: 技術者向け

### 変更

- `apps/web/app/error.tsx`:
  - `useRef` import 追加
  - `headingRef = useRef<HTMLHeadingElement>(null)` 生成
  - 既存 `useEffect([error])` 末尾に `headingRef.current?.focus({ preventScroll: true })` 追加
  - h1 に `ref={headingRef}` + `tabIndex={-1}` 付与
- `apps/web/app/__tests__/error.component.spec.tsx`:
  - TC-U-09a: focus が h1 に当たる
  - TC-U-09b: tabIndex=-1
  - TC-U-09c: focus 引数 `{ preventScroll: true }`

### 不変

- 関数シグネチャ
- className（OKLch トークン）
- 文言
- logger.error 引数 shape
- 依存配列 `[error]`
- 既存 TC-U-01〜TC-U-08

## Documentation Changes

- `docs/30-workflows/issue-769-root-error-focus/` — Phase 1-13 仕様一式
- `docs/30-workflows/issue-769-root-error-focus/outputs/phase-11/manual-smoke-log.md` — manual a11y observation
- `docs/30-workflows/issue-769-root-error-focus/outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,skill-feedback-report,unassigned-task-detection,phase12-task-spec-compliance-check,main}.md`
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` → status `consumed_by_issue_769_local_implementation`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` — i06 行を `implemented_local_evidence_captured` に更新

## Quality Verification

- `mise exec -- pnpm typecheck`: PASS
- `mise exec -- pnpm lint`: PASS
- `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component`: PASS（web suite 89 files / 618 tests passed, 1 skipped）

## Screenshots

NON_VISUAL タスクのためスクリーンショットなし（`outputs/phase-11/` には `.md` のみ）。

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `error.component.spec.tsx` PASS（web suite 89 files / 618 tests passed, 1 skipped）
- [ ] CI required status checks（dev base）green
- [ ] Manual a11y smoke: VoiceOver / NVDA で h1 即時読み上げを確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド（自律実行時）

```bash
gh pr create --base dev --title "feat(issue-769): root error.tsx h1 auto-focus for screen reader" --body "$(cat <<'EOF'
... (上記本文)
EOF
)"
```

## 5. merge 後の手動 followup

| タスク | コマンド / 操作 |
|---|---|
| 親 workflow index.md の i06 行更新 | local implementation wave で更新済み |
| unassigned-task spec の status 更新 | local implementation wave で `consumed_by_issue_769_local_implementation` へ更新済み |
| Issue #769 クローズ | PR merge で自動クローズされる場合はそのまま、されない場合は `gh issue close 769` |

## 6. follow-up issue 候補

- `useAutoFocusOnMount(ref)` 共通 hook 抽出（i05 + i06 両方 merge 後）
- `/profile/error.tsx` / `/admin/error.tsx` への同パターン適用
