# Skill Feedback Report

## テンプレ改善

- hook 設計 spec に「DI 必須項目チェックリスト」（`redirector` / `toaster` / `currentPath` のような副作用境界を必ず DI に分離）を追加すると、Phase 2 hook-design.md の漏れが減る。
- `apps/web` の lint rule (`no-restricted-globals: window`) は Phase 5 implementation-plan.md の「不変条件」段に常に転記すべき。本サイクルでも実装後の lint 修正で気付いたため、事前テンプレに `isBrowser()` 経由を要求するチェック項目を入れたい。

## ワークフロー改善

- Toast variant 拡張のような「後方互換だが既存 caller の見直しが必要な変更」では、Phase 5 で `grep` ベースの「既存 caller 影響範囲」確認を必須化したい。本サイクルは optional 引数のため安全だったが、汎用テンプレ化したい。
- `pnpm` script の引数は vitest にそのまま伝わらず full suite が実行されるため、Phase 6 step 7 の検証コマンドには「pnpm 経由でも fail しないが filter が効かないことがある」旨を注記すべき。

## ドキュメント改善

- `02-auth.md` に新設した「Client 401 / 403 ハンドリング」セクションを正本にし、`useAdminMutation` 利用 caller を増やすときの参照導線を整える。
- `aiworkflow-requirements` skill の `quick-reference.md` に parallel-10 Auth Session Handling の早見表を追加済み。今後の類似タスクでは Phase 8 の same-wave 更新対象として最初から含める。
