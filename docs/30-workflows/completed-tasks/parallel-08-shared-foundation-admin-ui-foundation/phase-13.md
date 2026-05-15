# Phase 13: PR 作成

## メタ情報

- **タスク**: parallel-08-shared-foundation-admin-ui-foundation
- **Phase**: 13 / 13
- **[実装区分: 実装仕様書]**
- **判定根拠**: 本タスクは apps/web 配下に code 差分を持つため、PR base は `dev`、PR 本文には Phase 12 implementation-guide を必ず反映する。
- **重要**: 本 Phase の `git commit` / `git push` / `gh pr create` の実行は、**ユーザーの明示承認後のみ**。Claude Code は事前準備（dry-run / diff 確認 / 本文素案）まで実行し、承認待ちで停止する。
- **screenshot**: NON_VISUAL タスクのため、PR 本文に screenshot 専用セクションを作らない。

---

## 目的

`gh pr create --base dev` で PR を作成し、Phase 12 で生成した implementation-guide を PR 本文に反映する。
作成完了後に workflow_state を `implemented_local_evidence_captured` から `completed` に昇格する。

---

## 実行タスク

1. PR 作成前 dry-run（status / diff / commit log 確認）
2. PR 本文素案（Phase 12 implementation-guide を要約反映、screenshot セクションは作らない）
3. **ユーザー明示承認を待機**（承認なしに git push / gh pr create を実行しない）
4. 承認後: `git add` → commit → `git push -u origin <branch>` → `gh pr create --base dev`
5. PR URL 取得・記録
6. workflow_state を `implemented_local_evidence_captured` から `completed` に昇格

---

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- CLAUDE.md「PR作成の完全自律フロー」セクション
- `.claude/commands/ai/diff-to-pr.md`

---

## 実行手順

### Step 1: dry-run 確認

```bash
git status --porcelain
git diff --name-only dev...HEAD
git log dev..HEAD --oneline
```

期待:
- 未コミット 0（または phase docs のみ）
- diff: `apps/web/app/layout.tsx` / `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `apps/web/src/features/admin/hooks/index.ts` + docs/phase ドキュメント

### Step 2: dev 同期

```bash
git fetch origin dev
git checkout dev && git merge --ff-only origin/dev
git checkout -
git merge dev
# conflict 時は CLAUDE.md の「コンフリクト解消の既定方針」に従う
```

### Step 3: 品質再検証（3 コマンド）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

すべて exit 0。失敗時は最大 3 回まで自動修復、修復差分はコミット。

### Step 4: PR 本文素案

```
## Summary
- admin UI 共通基盤を明示化: ToastProvider root 配置 / useAdminMutation 型契約 / admin error.tsx + middleware の確認
- serial-05/step-01 が `import { useAdminMutation } from "@/features/admin/hooks"` を type-only で先行解決できるようにする
- API error inventory と parser compatibility 境界を確認

## Changes
- `apps/web/app/layout.tsx`: ToastProvider で children を wrap
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`: 型 + skeleton（実装は serial-05/step-01）
- `apps/web/src/features/admin/hooks/index.ts`: re-export

## Evidence
- outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log すべて PASS
- Playwright @admin-smoke pass
- coverage >= 80%

## Test plan
- [ ] /admin で ToastProvider scope 内 useToast 動作
- [ ] (admin)/admin/error.tsx が useAdminMutation throw を catch
- [ ] serial-05/step-01 が import 成功

## Invariants
- D1 直接アクセス禁止 / OKLch / getEnv() / *.spec.ts 命名 すべて pass
```

screenshot セクションは作らない（NON_VISUAL）。

### Step 5: ユーザー明示承認待機

ここで一旦停止し、ユーザーに「commit / push / PR 作成を実行してよいか」を確認する。
**承認が出るまで `git commit` / `git push` / `gh pr create` を実行しない。**

### Step 6: 承認後の実行

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(parallel-08): admin UI 共通基盤を明示化（ToastProvider / useAdminMutation 型契約）

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push -u origin "$(git branch --show-current)"
gh pr create --base dev --title "feat(parallel-08): admin UI 共通基盤を明示化" --body "$(cat outputs/phase-13/pr-body.md)"
```

### Step 7: PR URL 記録 + workflow_state 昇格

- `outputs/phase-13/pr-url.txt` に URL 記録
- workflow_state: `implemented_local_evidence_captured → completed`

---

## 多角的チェック観点（AI が判断）

- **base ブランチ**: `dev`（`main` は禁止）
- **承認ゲート**: ユーザー明示承認なしに push / PR 作成を実行しない
- **本文反映**: Phase 12 implementation-guide の Part 2 要点が PR 本文に含まれる
- **screenshot**: NON_VISUAL のためセクションを作らない
- **CLAUDE.md フロー遵守**: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` の 3 コマンドを実行

---

## サブタスク管理

| No | サブタスク | 完了条件 |
|----|-----------|---------|
| 13-1 | dry-run 確認 | status / diff / log 取得 |
| 13-2 | dev 同期 + 品質再検証 | 3 コマンド exit 0 |
| 13-3 | PR 本文素案 | outputs/phase-13/pr-body.md 作成 |
| 13-4 | ユーザー承認待機 | 明示承認取得 |
| 13-5 | commit / push / PR 作成 | PR URL 取得 |
| 13-6 | workflow_state 昇格 | completed |

---

## 成果物

- `outputs/phase-13/pr-body.md`
- `outputs/phase-13/pr-url.txt`
- workflow_state 昇格記録

---

## 完了条件

- [ ] PR が `dev` 宛で作成済み
- [ ] PR 本文に Phase 12 implementation-guide 反映
- [ ] screenshot セクションなし（NON_VISUAL）
- [ ] workflow_state = completed
- [ ] ユーザー明示承認後に実行したことを記録

---

## タスク 100% 実行確認【必須】

- [ ] 上記 6 サブタスク完遂
- [ ] 承認前に push / PR 作成を実行していないこと
- [ ] CONST_007 遵守（1 サイクル内完了）

---

## 次 Phase

なし（Phase 13 で完了）。後続は serial-05/step-01 が本タスクの型契約に基づき実装本体に着手する。
