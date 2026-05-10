# Phase 13: PR 作成

[実装区分: 実装仕様書]

> 目的: user の **明示承認後のみ** PR を作成する。CLAUDE.md 「PR作成の完全自律フロー」に準拠。
> 既定 base ブランチ: **`dev`**（main は production リリース時のみ）

---

## 1. 着手 gate

- [ ] **user の明示承認** を得たこと
- [ ] Phase 12 close-out が完全完了
- [ ] `outputs/phase-12/` strict 7 files が揃っている
- [ ] `artifacts.json` と `outputs/artifacts.json` の parity OK
- [ ] vitest / typecheck / lint / verify-design-tokens が green

承認なしの場合は実行禁止。Phase 12 完了時点で「Phase 13 PR 作成を開始してよいか？」と user に確認する。

---

## 2. 自律実行手順（CLAUDE.md「PR作成の完全自律フロー」）

### 2.1 ブランチ準備

```bash
# 作業ブランチ確認・必要なら作成
CURRENT=$(git branch --show-current)
# task-15 は feat/task-15-admin-dashboard-and-members 等で

# dev 同期
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout "$CURRENT"
git merge dev
# コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従う
```

### 2.2 品質検証（最大 3 回まで自動修復）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

失敗時の自動修復方針:
- typecheck: unused import / null許容 / 型注釈漏れを最小差分で修正
- lint: `pnpm lint --fix` → 残りを手修正

### 2.3 残変更チェック

```bash
git status --porcelain  # 空でなければ git add -A して commit
```

### 2.4 PR 作成

```bash
git diff dev...HEAD --name-only  # PR に入るファイル一覧確認

gh pr create --base dev --title "feat(admin): task-15 admin dashboard & members + (admin)/layout 確定" --body "$(cat <<'EOF'
## Summary
- `/admin` (KPI ダッシュボード) と `/admin/members` (会員管理テーブル) を OKLch tokens ベースで再構築
- `(admin)/layout.tsx` を確定（task-16/17 着手 gate）
- 既存 admin endpoint 4 つを adapter 経由で接続（API 側変更 0 行）

## Changes
- 17 新規 component + 3 page.tsx 修正
- vitest 36 ケース PASS / jest-axe violations 0
- HEX 直書き 0 件 / `apps/api` 差分 0 行
- 旧 `apps/web/src/components/admin/` 残骸を git delete

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm verify-design-tokens` green
- [ ] `pnpm -F @ubm-hyogo/web test --run src/features/admin` 36 PASS
- [ ] dev server で `/admin` `/admin/members` を目視
- [ ] Phase 11 screenshot 9 枚を確認

## Screenshots
（Phase 11 取得分を 9 枚参照）
- admin-dashboard-default.png
- admin-dashboard-schema-alert.png
- admin-dashboard-zone-placeholder.png
- admin-members-default.png
- admin-members-filter-published.png
- admin-members-bulk-selected.png
- admin-members-drawer-open.png
- admin-members-empty.png
- admin-layout-sidebar-active.png

## Related
- 元仕様: docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md
- 仕様書: docs/30-workflows/task-15-admin-dashboard-and-members/
- 後続: task-16 / task-17（layout merge gate 通過後）, task-18（regression）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 2.5 Phase 11 画像参照ルール

`outputs/phase-11/` にスクリーンショット画像がある場合のみ PR 本文に参照を含める。画像が無い場合は「Screenshots」セクションを作らない。

---

## 3. PR 作成前最終チェック（CLAUDE.md 準拠）

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が PR ファイル一覧として取得済み
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映
- [ ] `outputs/phase-11/` の画像数（9 枚）と PR 本文の画像参照数が一致
- [ ] スクリーンショットなし → 専用セクションを残さない（本タスクは VISUAL なので 9 件残す）

---

## 4. 最終レポート

PR 作成完了後、user に以下を **1 回だけ** 報告:

- PR URL
- 採用ブランチ（base / head）
- 実行した自動修復（あれば）
- 解消したコンフリクト（あれば）
- 残課題の有無（unassigned-task に登録した 4 件など）

---

## 5. 禁止事項（CLAUDE.md Git Safety Protocol 再掲）

- `git push --force` を main / dev へ実行しない
- `--no-verify` を hook skip 目的で使わない（merge sync は自動 skip 対応済み）
- `git config` を更新しない
- `git rm -r` で完了 workflow dir を純削除しない（`git mv` で `completed-tasks/` へアーカイブ）

---

## 6. 完了条件（DoD）

- [ ] §1 着手 gate すべて満たす
- [ ] §2 自律実行手順 success
- [ ] §3 PR 作成前チェックすべて pass
- [ ] §4 最終レポート 1 回送信
- [ ] PR URL 取得完了

## 成果物

- `outputs/phase-13/pr-readiness-checklist.md`（着手 gate 確認 + PR URL）
- user 承認後の PR 作成完了時に `artifacts.json` の `phase13.status` を `completed` へ更新（承認前は `blocked`）
