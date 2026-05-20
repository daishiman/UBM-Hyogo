# dev sync: visual-harness `allowed` Set への両側追加は union 解消

- 日時: 2026-05-20
- ブランチ: `feat/profile-loading-skeleton-oklch` ← `dev`
- 関連: `aiworkflow-requirements/changelog/20260520-dev-sync-visual-harness-allowed-set-union-resolve.md`
- 事象: `apps/web/app/visual-harness/[name]/page.tsx` の visual scenario 登録 `allowed` Set で両側追加コンフリクト（HEAD: `"profile-loading"` / dev: `"parallel-02-css-rules"`）。`pnpm sync:resolve` の resolver が `apps/**` を handle しないため UU 残置。
- 解消: 両側のシナリオ名は独立しているため union 採用で両方残す。後段の `if (name === "profile-loading") {...}` などの dispatch ロジックは HEAD 側を保持。
- Phase 11 evidence checklist への影響: visual scenario が増えた場合、`outputs/phase-11/` の visual evidence inventory も両側ぶん必要。`verify-phase11-evidence` gate で missing-evidence にならないよう、sync-merge 後に inventory を再生成・確認すること。
- 反映先 (本 skill 側):
  - `references/pr-pre-flight-ci-gate-checklist.md` の visual-harness 関連 gate チェックポイントに「両側追加 union 採用後の inventory 再確認」を将来追加する候補として記録。
