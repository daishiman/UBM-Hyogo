# Phase 10: tokens / lint gate — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 10 / 13 |
| wave | w5-par |
| mode | sequential |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

OKLch tokens 経由のみで色が定義されていることを `verify-design-tokens` で確定し、lint / typecheck の最終 gate を通す。

## 実行タスク

1. `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` を実行し、`apps/web/app/login/**` の HEX マッチが 0 件であることを確認。
2. `pnpm typecheck` / `pnpm lint` を実行し、すべて green であることを確認。
3. `react/jsx-no-target-blank` lint ルールで `<a target="_blank">` が `rel="noopener noreferrer"` を持つことを確認。
4. `git diff --stat` で変更範囲が出典 §3 ファイル表に収まっていることを確認。

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# HEX 直書き grep（最終チェック）
grep -RnE '#[0-9a-fA-F]{3,8}\b' apps/web/app/login || echo "OK: no HEX"

# 範囲外の変更検査
git diff --name-only main...HEAD | grep -v -E '^(apps/web/app/login/|apps/web/src/lib/url/login-query|apps/web/playwright/tests/login-smoke|docs/30-workflows/task-13-login-rebuild/)'
```

## 参照資料

- 出典タスク §17（CI / lint 連動）, §13（DoD D-2）
- task-18 verify-design-tokens 仕様

## 依存 Phase 成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 5〜9

## 多角的チェック観点

- HEX マッチ: `apps/web/app/login` 配下で 0 件（コメント・テストデータ含めて 0）
- `bg-[#xxx]` `text-[#xxx]` 等 Tailwind arbitrary value 形式の HEX も 0
- diff scope 規律: `git diff --name-only main...HEAD` が出典 §3 + 本 task package のみ
- typecheck で `LoginGateState` exhaustive switch が `never` 通過

## 統合テスト連携

- Phase 10 は Phase 5〜9 の実装・テスト結果を最終 static gate として集約する。
- `@ubm-hyogo/web` の package name を正本とし、stale `web` filter を使わない。
- HEX grep / API auth diff 0 / D1 direct access grep を Phase 11 visual evidence 前の停止条件にする。

## サブタスク管理

- [ ] verify-design-tokens green
- [ ] typecheck green
- [ ] lint green
- [ ] HEX grep 0 件
- [ ] diff scope OK

## 成果物

- outputs/phase-10/main.md（gate 実行ログ）

## 完了条件

- [ ] 4 つの gate（verify-design-tokens / typecheck / lint / HEX grep）がすべて green
- [ ] diff scope 規律 OK

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 11（視覚 evidence）へ、gate green を渡す。
