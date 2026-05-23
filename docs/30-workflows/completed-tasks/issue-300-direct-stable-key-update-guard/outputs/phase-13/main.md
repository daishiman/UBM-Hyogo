[実装区分: 実装仕様書]

# Phase 13 Output: user approval gate

仕様本体: `../../phase-13.md`

## 状態

`blocked`（user 明示承認まで commit / push / PR は実行禁止）

## Gate G1-G4

- G1 technical_go: Phase 10 PASS で取得
- G2 user_approved: pending
- G3 commit: pending
- G4 push / PR: pending（`gh pr create --base dev`）

## 完了条件

- [ ] G2 取得
- [ ] G3 hook PASS
- [ ] G4 PR URL 取得 → completed-tasks/ 移動
