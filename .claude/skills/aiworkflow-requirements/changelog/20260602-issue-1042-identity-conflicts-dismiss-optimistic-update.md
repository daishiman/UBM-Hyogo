# 2026-06-02 issue-1042-identity-conflicts-dismiss-optimistic-update

`issue-1042-identity-conflicts-dismiss-optimistic-update` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期。

- `IdentityConflictRow.tsx` に dismiss 専用 `optimisticDismissed` state を追加し、dismiss trigger 直後に row を非表示、server error 時のみ rollback する。
- render guard は `optimisticMerged || optimisticDismissed` に統合し、state 自体は merge / dismiss で分離する。
- focused Vitest に dismiss optimistic hide / success-stays-hidden / rollback+reason+error を追加。
- Playwright に dismiss optimistic hide / rollback と Issue #1042 screenshot capture helper を追加。
- Phase 11 screenshots 3 PNG を取得し、Phase 12 strict 7 と task-workflow-active / quick-reference / resource-map / artifact inventory を同一 wave で反映。
- Issue #1042 は CLOSED のまま維持し、commit / push / PR は user-gated。
