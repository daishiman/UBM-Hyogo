[実装区分: 実装仕様書]

# Phase 9: 品質保証 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 9 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装着手後（または spec 確認段階）にローカル品質ゲートが通ることを保証する。
今回の改善サイクルでは実コード変更済みのため、typecheck / focused unit test /
artifacts validator を実行する。

## 実行タスク

1. web typecheck を実行する。
2. `SignOutButton` focused unit test を実行する。
3. public route への `SignOutButton` 混入を grep で確認する。
4. task-specification validator を実行する。

## 参照資料

- apps/web/package.json
- apps/web/src/components/auth/__tests__/SignOutButton.test.tsx
- .claude/skills/task-specification-creator/scripts/validate-phase-output.js

## 実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web test -- src/components/auth/__tests__/SignOutButton.test.tsx
# optional after authenticated storage state is available:
# mise exec -- pnpm --filter web exec playwright test playwright/tests/auth-signout.spec.ts
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-05a-auth-ui-logout-button-001
```

## 期待結果

- typecheck / lint exit 0
- Vitest unit test PASS
- Playwright E2E は認証済 storage state がある場合のみ実行。今回サイクルは Phase 11 manual smoke placeholder を runtime blocked として保持
- artifacts parity PASS

## 取得不能時 fallback

- Playwright が認証済 state を持たない場合: 手動 smoke で代替し、`outputs/phase-11/manual-smoke-log.md` に記録
- Vitest が `next-auth/react` mock 未整備の場合: テスト戦略 Phase 4 にフィードバック

## 統合テスト連携

- implemented-local 段階のため typecheck / lint は実装差分の確認
- 実装後は本コマンド群が Phase 11 evidence の前提

## 多角的チェック観点

- spec_created 状態を `completed` に書き換えない
- typecheck / lint failure が他タスクの未関連 import 由来でないか切り分ける
- `--no-verify` を使用しない

## サブタスク管理

- [ ] typecheck / lint 結果を outputs/phase-09 に保存
- [ ] Vitest 結果を保存
- [ ] Playwright 結果を保存（または手動 smoke fallback の記録）
- [ ] validator 出力を保存
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md
- outputs/phase-09/typecheck.log
- outputs/phase-09/lint.log
- outputs/phase-09/vitest.log
- outputs/phase-09/playwright.log
- outputs/phase-09/validator.log

## 完了条件

- typecheck / lint exit 0
- artifacts parity PASS
- spec_created を逸脱した PASS 化が起きていない

## タスク100%実行確認

- [ ] ローカル gate が通っている
- [ ] artifacts parity が PASS

## 次 Phase への引き渡し

Phase 10 へ、ローカル QA 結果を渡す。
