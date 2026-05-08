# Phase 11 — runtime evidence 取得（PARTIAL / Phase 13 補完）

`visualEvidence: NON_VISUAL`。詳細は `diff-summary.md` を参照。

## 取得済 evidence（read-only GET、副作用なし）

- `before-dev-protection.json`
- `before-main-protection.json`
- `diff-summary.md`（partial）

## Phase 13 で追加取得する evidence

- `after-dev-protection.json` / `after-main-protection.json`（dev → main 順 PUT 後）
- `dev-diff.txt` / `main-diff.txt`（before/after diff）
- `diff-summary.md`（after で更新）
- `pr-pending-check.txt`（任意）

## DoD

- [x] before 2 件取得済
- [x] `diff-summary.md` partial 版作成
- [x] NON_VISUAL evidence policy 明示
- [ ] after 2 件 → Phase 13
- [ ] diff text 2 件 → Phase 13
