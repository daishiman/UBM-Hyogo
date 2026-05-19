---
phase: 13
title: Commit / PR draft — ブランチ・メッセージ・PR title/body 案
workflow_id: parallel-i05-login-loading-and-error-focus
status: pending_user_approval
---

# Phase 13: Commit / PR Draft

[実装区分: 実装仕様書]

> **重要**: 本 Phase は user の明示承認後のみ実行する。本ワークフローの仕様書作成プロンプトは commit / PR を行わない。

## 1. ブランチ

| 項目 | 値 |
|------|-----|
| base | `dev`（CLAUDE.md「既定の PR base ブランチは dev」） |
| topic | `feat/i05-login-loading-and-error-focus` |
| 起点 | `origin/dev` の最新 |

ブランチ作成コマンド（ワークツリー起動直後の例）:

```bash
git fetch origin dev
git switch -c feat/i05-login-loading-and-error-focus origin/dev
```

## 2. コミット粒度

UI コンポーネント追加 + 改修 + spec の小規模変更のため、**1 コミットに集約**する。

### 2.1 コミットメッセージ案

```
feat(login): loading skeleton 新規作成 + error.tsx に h1 自動 focus を追加

- /login/loading.tsx 新規: role=status / aria-busy=true / OKLch skeleton
- /login/error.tsx: h1 への自動 focus、aria-live=assertive、digest 条件表示
- vitest: loading 2 件 / error 5 件
- parallel-07-auth-and-shared spec §4.1 / §4.2 完了
```

## 3. PR

### 3.1 PR title

```
feat(i05): /login loading.tsx 新規 + error.tsx focus 管理
```

### 3.2 PR body 案

```markdown
## Summary
- `apps/web/app/login/loading.tsx` を新規作成（OKLch skeleton + a11y 属性）
- `apps/web/app/login/error.tsx` に h1 への自動 focus、`aria-live="assertive"`、digest 条件表示を追加
- parallel-07-auth-and-shared spec §4.1 / §4.2（DoD line 141, 142）を完了

## Changes
- create: `apps/web/app/login/loading.tsx`
- modify: `apps/web/app/login/error.tsx`
- create: `apps/web/app/login/loading.spec.tsx`
- create: `apps/web/app/login/error.spec.tsx`
- (条件付き) modify: `apps/web/src/styles/globals.css`（`bg-surface-2` utility 未定義時のみ）

## Test plan
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run login` PASS（4 件・7 contract assertions）
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" build` exit 0
- [ ] HEX 直書き grep 0 件
- [ ] `*.test.tsx` 0 件
- [ ] screenshot 4 件（TC-01〜TC-04）

## Screenshots
- TC-01: `outputs/phase-11/screenshots/login-loading-skeleton.png`
- TC-02: `outputs/phase-11/screenshots/login-error-default.png`
- TC-03: `outputs/phase-11/screenshots/login-error-with-digest.png`
- TC-04: `outputs/phase-11/screenshots/login-error-focused-heading.png`

## References
- Spec: `docs/30-workflows/parallel-i05-login-loading-and-error-focus/`
- 発注書: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
- 親 SW: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md` §4.1 / §4.2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(i05): /login loading.tsx 新規 + error.tsx focus 管理" --body "$(cat <<'EOF'
... (上記 PR body 案)
EOF
)"
```

## 5. pre-flight gate

PR 作成前に `bash scripts/verify-pr-ready.sh` を実行し、`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証する（CLAUDE.md PR 作成フロー準拠）。

## 6. ユーザー承認待ち

本 Phase は user の明示承認まで実行禁止。承認サインは:

- 「PR まで進めて」
- 「diff-to-pr」
- 「Phase 13 実行」

のいずれかが揃った時点で commit → push → PR の自律フローへ移行する。


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 13 |
| status | pending_user_approval |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。
