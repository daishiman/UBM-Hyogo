---
実装区分: 実装仕様書
状態: pending_user_approval
Phase: 13
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-12-documentation.md](./phase-12-documentation.md)
---

# Phase 13: PR 作成 (commit-pr-release)

> **user 明示承認後のみ実施**。Claude Code は事前に本 Phase を走らせない。

## 1. 前提

- Phase 1〜12 の DoD が全て満たされていること
- Phase 11 staging 評価で blocker 0 件
- Phase 12 の 6 必須成果物が `outputs/phase-12/` に揃っている

## 2. PR base / 命名

| 項目 | 値 |
| ---- | ---- |
| base | `dev` (CLAUDE.md `## ブランチ戦略` 通り。production は別 PR で `dev → main`) |
| head | `feat/admin-ui-prototype-alignment` |
| PR title 案 | `feat(admin): align admin UI with prototype and add per-section degrade` |
| labels | `area/admin`, `type/feat`, `visual` (リポジトリで定義済みであれば) |

## 3. Pre-flight (自動)

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

すべて exit 0 を確認してから PR を作成する。失敗時の対処は CLAUDE.md `### 品質検証失敗時の自動修復` に従う。

## 4. Commit 方針

- 既存の Phase 5-8 の作業 commit はそのまま保持
- Phase 12 の docs 追加分は `docs(admin):` prefix で 1 commit
- 直前に `git status --porcelain` が空であること

## 5. PR body 雛形 (`.claude/commands/ai/diff-to-pr.md` 準拠)

```md
## Summary

- staging で発生していた `/admin` 全画面エラーバウンダリ停止を per-section degrade に切替
- admin 11 route をプロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`) と整合
- 共通コンポーネント `apps/web/src/features/admin/components/_shared/` (6 component + barrel) を導入し、`safeServerFetch` で server fetch を安全化
- OKLch token のみ使用 (HEX 直書き 0 件)、新規 API endpoint なし、D1 schema 変更なし

## Scope (11 routes)

- `/admin`, `/admin/dashboard/attendance`
- `/admin/members`, `/admin/tags`
- `/admin/meetings`, `/admin/meetings/[id]`
- `/admin/schema`, `/admin/schema/history`
- `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`

## Invariants

- CLAUDE.md #5 (D1 直接アクセスなし), #8 (`*.spec.*` のみ), #9 (FormField), #10 (useAdminMutation)
- ワークフロー固有: 新規 API endpoint 禁止 / HEX 直書き禁止 / プロトタイプ正本順位

## Test plan

- [x] Unit: `_shared/` 6 component (TC-SC/SE/ES/ST/TB/QP)
- [x] Page: 11 route の per-section degrade (TC-PG-*)
- [x] Helper: `safeServerFetch` 境界条件 (TC-SF-001..007)
- [x] Playwright smoke: 11 route 200 + degrade case
- [x] Coverage: `_shared/` line ≥ 90% / branch ≥ 85%

## Manual / VISUAL evidence

- staging URL: https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin
- Screenshots (25 枚): `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/`
  - 4 viewport × 5 key screen = 20 (normal)
  - degrade 5 (dashboard/members/tags/schema)
- 3 層評価: `outputs/phase-11/manual-test-result.md`

## Documentation

- `outputs/phase-12/implementation-guide.md` (Part 1 中学生レベル + Part 2 技術詳細)
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md` (0 件)
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Rollback

- DB / schema 変更なし、Cloudflare resource 操作なしのため `git revert` で完結

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> スクリーンショット参照は Phase 11 成果物 (`outputs/phase-11/admin-*.png`) を相対 link で添付。画像 0 件の場合は当該セクションを削除する (CLAUDE.md `## PR作成の完全自律フロー § PR作成前チェック`)。

## 6. PR 作成コマンド

```bash
gh pr create --base dev --head feat/admin-ui-prototype-alignment \
  --title "feat(admin): align admin UI with prototype and add per-section degrade" \
  --body "$(cat <<'EOF'
...上記 §5 の本文...
EOF
)"
```

## 7. PR 作成後

- `outputs/phase-13/pr-creation-result.md` に PR URL / pre-flight 結果 / 解消したコンフリクト / 残課題 を記録
- `artifacts.json` の Gate-C `status` を `pending` → `completed` に更新
- staging deploy の自動完了を待ち、Phase 11 screenshot を最新 commit のものに refresh (必要時)

## 8. DoD (Phase 13)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 13
- workflow_state: `implemented_local_runtime_pending`

## 目的

ユーザー明示承認後に commit / push / PR を実行し、PR evidence を記録する。

## 実行タスク

- pre-flight を実行する
- ユーザー承認後に commit / push / PR を作成する
- PR URL と post-PR staging refresh の境界を記録する

## 参照資料

- `phase-12-documentation.md`
- `scripts/verify-pr-ready.sh`

## 成果物/実行手順

- `outputs/phase-13/pr-creation-result.md` に PR URL / pre-flight / 残リスクを記録する

## 完了条件

- ユーザー承認なしに commit / push / PR を実行していない

- [ ] user 明示承認を得ている
- [ ] Pre-flight 4 コマンドが全 PASS
- [ ] PR base = `dev`、head = `feat/admin-ui-prototype-alignment`
- [ ] PR body にスクリーンショット参照 / implementation-guide 参照が含まれる
- [ ] `outputs/phase-13/pr-creation-result.md` 作成済み
- [ ] PR URL を user に報告
