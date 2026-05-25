# Phase 13: PR 作成

> **重要: commit / push / PR 作成 / Issue 変更は、ユーザーの明示承認後にのみ実行する。** 本ファイルは「承認後に何をどう作るか」の仕様であり、仕様書作成段階では一切の git mutation を行わない（PR / commit / push 自動実行禁止）。
> Issue #842 は **CLOSED のまま**。PR 文言は `Closes` ではなく `Refs #842` を使う。

## 1. ブランチ

`feat/issue-842-admin-mutation-reliability-policy`（worktree で `dev` から分岐）。

## 2. base ブランチ

`dev`（CLAUDE.md 既定 / memory `feedback_default_branch_dev`）。`main` への PR は production リリース時の `dev → main` のみで、本タスクは対象外。

## 3. PR 前チェック（承認後・実装完了後に実行）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git status --porcelain            # 空であること
git diff dev...HEAD --name-only   # PR に入るファイル一覧確認
```

## 4. PR タイトル案

```
feat(issue-842): useAdminMutation reliability policy (timeout/retry/idempotency/abort) + legacy cleanup
```

## 5. PR 本文構成案

```markdown
## 背景

admin 配下の全 destructive/mutating 操作は `useAdminMutation` を通るが、現 hook は fetch ラッパ + エラーハンドリング + `router.refresh()` までで、timeout / retry / idempotency / abort 連携が無い。
通信ハング放置による重複操作・audit log 汚染、一過性 5xx の即失敗、二重押下保護の不在という信頼性 gap が admin 全体に温存されている。
また legacy `apps/web/src/lib/useAdminMutation.ts` が 0 caller の dead code として残り、import auto-suggest 誤誘導の温床になっている。

Refs #842（CLOSED のまま実装 — 調査の結果、信頼性 gap が現存し実装が必要。issue 前提は一部陳腐化しているため最新コードに最適化して根本対応する）

## 変更内容

- `useAdminMutation` に reliability policy を追加
  - `timeoutMs`（既定 10000ms）: AbortController で fetch 打ち切り。AbortError は silent
  - `retry`（RetryPolicy）: idempotent method（PUT/DELETE）限定・opt-in・既定オフ。exponential backoff（baseDelay 200ms / maxDelay 2000ms）
  - `idempotencyKey`: 指定時のみ `Idempotency-Key` header 送出（既定生成なし）
  - `treat404AsSuccess`: `false | 'silent' | { toast }` の 3 値
  - method 型に `DELETE` 追加・`abort()` 返却追加
  - overload で POST/PATCH に `retry` を型レベルで渡せないよう制約
- `useConfirmDialog` に `onCancelMutation?` を追加し `closeConfirm` で abort 連携（focus restore は ConfirmDialog.tsx 責務のまま）
- legacy `apps/web/src/lib/useAdminMutation.ts` と専用テストを物理削除（0 caller / 互換不能で re-export 不能）
- `useAdminMutation.spec.ts` に timeout / retry / idempotency-key / 404 三値 / abort の 5 観点追加

## AC 対応

| AC | 対応 |
|---|---|
| AC-1〜AC-4 | timeout / retry / idempotencyKey / treat404AsSuccess を型 + 実装 + JSDoc で追加 |
| AC-5 | useConfirmDialog の onCancelMutation 連携 |
| AC-6（最適化） | treat404AsSuccess は汎用 policy として実装。MeetingAttendancePanel は不変（DELETE 未実装のため） |
| AC-7（最適化） | legacy 本体 + 専用テストを物理削除（grep で 0 caller 証跡化） |
| AC-8〜AC-11 | 新基盤のみ参照 / API・D1・直接アクセス変更なし |
| AC-12〜AC-15 | spec 5 観点 PASS / typecheck・lint・vitest green |

## テスト

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS（warning baseline 維持）
- [ ] `useAdminMutation.spec.ts` / `useConfirmDialog.spec.ts` 0 fail（5 観点含む）
- [ ] `grep -rn "lib/useAdminMutation" apps/web`（テスト除く）0 件
- [ ] 既存 caller（POST/PATCH）に意図しない型エラー・挙動変化なし

## issue 陳腐化への最適化注記

issue AC-6 が前提とした「MeetingAttendancePanel の DELETE 404 を hook へ移譲」は、現コードで DELETE attendance が未実装のため陳腐化している。本 PR は `treat404AsSuccess` を汎用 policy 基盤として実装するのみで、MeetingAttendancePanel は変更しない（POST 404 は既定 false で失敗扱いのまま）。DELETE route 自体の実装は step-06 が将来 task と明記しスコープ外。

## 視覚証跡

UI/UX 変更なし（NON_VISUAL）のため Phase 11 スクリーンショットなし。代替証跡として vitest 5 観点の source-level PASS を `outputs/phase-11/manual-test-result.md` に記録。
```

## 6. 作成コマンド（承認後に実行）

```bash
gh pr create --base dev \
  --title "feat(issue-842): useAdminMutation reliability policy (timeout/retry/idempotency/abort) + legacy cleanup" \
  --body "$(cat <<'EOF'
... (上記 §5 テンプレート)
EOF
)"
```

## 7. CLOSED issue へのリンク戦略

- PR description 冒頭に `Refs #842`（`Closes` ではない）
- 本文に「issue は CLOSED だが調査の結果、信頼性 gap が現存し実装が必要であった。issue 前提は一部陳腐化しているため最新コードに最適化して対応する」旨を 1 行明記
- Issue #842 の状態変更（reopen / comment 追記）は行わない。必要なら PR merge 後に**ユーザー明示承認のうえ**手動で実施

## 8. 関連ドキュメントの追従（PR 内で同時実施）

- `docs/30-workflows/completed-tasks/admin-mutation-timeout-policy.md`（前身 one-pager）の status を `pending` → 仕様書化済みへ更新し、本ワークフローへの参照リンクを冒頭に追記（Phase 12 Step 1-C）
- PR merge 後（別 commit / 別 PR 可）に `docs/30-workflows/issue-842-admin-mutation-reliability-policy/` を `docs/30-workflows/completed-tasks/` 配下へ移動

## 9. 完了条件（Phase 13 DoD）

- [ ] base = `dev` を確認
- [ ] PR タイトル・本文（背景 / 変更内容 / AC 対応 / テスト / 陳腐化注記 / `Refs #842`）を §4・§5 どおり用意
- [ ] PR 前チェック 4 コマンド + `git status` / `git diff` を承認後に実行
- [ ] commit / push / PR 作成 / Issue 変更は **ユーザー明示承認後にのみ**実行（仕様書作成段階では未実行）
