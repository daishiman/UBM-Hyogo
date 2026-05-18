# Phase 13: PR・振り返り

## User approval gate

**本 Phase の commit / push / PR 発行は user 明示承認後のみ実行**する。

## PR 作成手順 (user 承認後)

### 1. ブランチ確認・dev 同期

```bash
git status
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout <feature-branch>
git merge dev
```

### 2. 品質検証

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components
```

### 3. コミット

```bash
git add apps/web/app/profile/_components/VisibilityRequestDialog.tsx \
        apps/web/app/profile/_components/DeleteRequestDialog.tsx \
        apps/web/app/profile/_components/RequestActionPanel.tsx \
        apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx \
        apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx \
        apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx \
        docs/30-workflows/parallel-i03-dialog-refresh-order

git commit -m "$(cat <<'EOF'
feat(parallel-i03): fix profile dialog router.refresh() call order

親仕様 parallel-02-state-sync §4.2 が定める refresh → onSubmitted → onClose 順序を
dialog component 内で固定し、unmounted-component warning と race condition を排除する。

- VisibilityRequestDialog / DeleteRequestDialog で router.refresh() を最先発火
- RequestActionPanel から router.refresh() 撤去（二重発火防止）
- 3 component spec に callOrder assertion / 非発火 assertion を追加

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### 4. push & PR

```bash
git push -u origin <feature-branch>

gh pr create --base dev --title "feat(parallel-i03): fix profile dialog router.refresh() call order" --body "$(cat <<'EOF'
## Summary
- profile request dialog で router.refresh() → onSubmitted → onClose の順序を dialog 側で固定
- RequestActionPanel から refresh 発火責務を撤去（二重発火・race condition 排除）
- 3 component spec に順序 / 非発火 assertion を追加

## 親仕様
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-02-state-sync §4.2

## visual evidence
NON_VISUAL（UI race condition 排除のため画面差分は実質なし。component spec の callOrder assertion を evidence とする）

## Test plan
- [x] pnpm typecheck PASS
- [x] pnpm lint PASS
- [x] VisibilityRequestDialog.component.spec: success callOrder === ["refresh","onSubmitted","onClose"] PASS
- [x] VisibilityRequestDialog.component.spec: duplicate pending callOrder === ["refresh","onSubmitted"] PASS
- [x] DeleteRequestDialog.component.spec: success callOrder === ["refresh","onSubmitted","onClose"] PASS
- [x] DeleteRequestDialog.component.spec: duplicate pending callOrder === ["refresh","onSubmitted"] PASS
- [x] RequestActionPanel.component.spec: refresh not.toHaveBeenCalled PASS

🤖 Generated with Claude Code
EOF
)"
```

## PR base branch

**`dev`** （`main` 直接 PR 禁止）。

## 振り返り項目（PR merge 後に記録）

| 項目 | 内容 |
|------|------|
| 工数実績 vs 推定 | 推定合計 ~2h に対し実績を記録 |
| race condition 再発有無 | staging 観測ログから確認 |
| 順序契約の他 dialog 展開可否 | unassigned-task-detection で記録した候補の優先度判定 |
| skill フィードバック | phase-12 skill-feedback-report.md に統合 |

## DoD

- [ ] PR URL が `outputs/phase-13/pr-summary.md` に記録
- [x] Gate-C は external ops なしとして `passed`
- [ ] Gate-D の status が PR 完了で `passed` に更新可能
- [ ] 振り返り項目が merge 後 1 週間以内に記録
