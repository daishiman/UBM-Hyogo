# Phase 05: 実装計画

## 実装順序

1. **dialog 2 件の変更** (T-04-1, T-04-2): `useRouter` import + 成功 path に refresh 最先発火
2. **parent の撤去** (T-04-3): `RequestActionPanel.tsx` から refresh 削除 + 未使用 import clean
3. **test 3 件** (T-04-4..6): callOrder assertion + parent 非発火 assertion
4. **静的検証** (T-04-7): typecheck / lint / test 実行
5. **Phase 11 evidence 整理** (T-04-8)
6. **Phase 12 正本同期 7 ファイル** (T-04-9)
7. **Phase 13 PR summary draft** (T-04-10) — user 承認待ち

## ブランチ戦略

- 作業ブランチ: `feat/parallel-i03-dialog-refresh-order` （または既存 worktree のブランチ）
- PR base: `dev`
- merge 後 `dev` → staging へ自動 deploy（既存 CI）

## 環境前提

- Node 24.15.0 / pnpm 10.33.2（`mise exec --` 経由）
- ローカル `apps/web` での dev server 起動は本タスクでは必須ではない（ユニットテストで完結）

## ロールバック方針

- 万一 production で issue が発生した場合は revert PR で 3 ファイル + 3 test ファイルを元に戻す
- D1 schema / API endpoint は変更しないため backward compatibility 問題なし

## DoD

- [x] `outputs/phase-05/implementation-plan.md` に上記順序・ブランチ戦略・ロールバック方針を記載
