---
実装区分: 実装仕様書
状態: pending_user_approval
Phase: 13
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-12-documentation.md](./phase-12-documentation.md)
---

# Phase 13: PR 作成 (commit-pr-release)

> **user 明示承認後のみ実施**。Claude Code は事前に本 Phase を走らせない。

## 1. 前提

- Phase 1〜12 の DoD が全て満たされていること
- Phase 11 staging / local 評価で blocker 0 件
- Phase 12 の 7 必須成果物が `outputs/phase-12/` に揃っている

## 2. PR base / 命名

| 項目 | 値 |
| --- | --- |
| base | `dev` |
| head | `feat/dashboard-prototype-alignment` |
| PR title 案 | `feat(public): align landing dashboard with prototype (Hero/Stats/About/Featured/Timeline)` |
| labels | `area/public`, `type/feat`, `visual` (リポジトリ定義済みのみ) |

## 3. Pre-flight (自動)

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

すべて exit 0 を確認してから PR を作成。失敗時の対処は CLAUDE.md `### 品質検証失敗時の自動修復` に従う。

## 4. Commit 方針

- Phase 5-8 の実装 commit はそのまま保持
- Phase 12 の docs 追加分は `docs(public):` prefix で 1 commit
- 直前に `git status --porcelain` が空であること

## 5. PR body 雛形 (`.claude/commands/ai/diff-to-pr.md` 準拠)

```md
## Summary

- 公開トップ `/` の Hero / Stats / Timeline をプロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152) と整合
- About + Three Zones の 2-card セクション `AboutUbm` を新規追加 (`/` ホームに配線)
- Featured Members を `items.length === 0` でも heading を維持 + EmptyState フォールバック
- Timeline に eyebrow / chip / tl-row layout と `note` / `attendees` の graceful fallback を導入
- OKLch token のみ使用 (HEX 直書き 0 件)、新規 API endpoint なし、D1 schema 変更なし

## Scope (1 route)

- `/` (apps/web/app/page.tsx + apps/web/src/components/public/{Hero,Stats,AboutUbm,MemberGrid,Timeline}.tsx + apps/web/src/styles/legacy-public.css)

## Invariants

- CLAUDE.md #1 (Form schema 不変), #5 (D1 直接アクセスなし), #8 (`*.spec.*` のみ)
- ワークフロー固有: 新規 API endpoint 禁止 / HEX 直書き禁止 / プロトタイプ正本順位 / API 拡張禁止

## Test plan

- [x] Unit: 5 component (TC-HERO/STATS/ABOUT/TL/MG)
- [x] Page: `app/page.spec.tsx` (TC-PAGE-*) — section 配線 + ZoneIntro 削除 + featured-members heading 維持
- [x] Playwright smoke: 4 viewport (TC-SMK-001..004)
- [x] Coverage: 改修ブロック line ≥ 95%

## Manual / VISUAL evidence

- staging URL: https://ubm-hyogo-web-staging.daishimanju.workers.dev/
- Screenshots (6 枚): `docs/30-workflows/public-dashboard-prototype-alignment/outputs/phase-11/`
  - 4 viewport × 1 screen = 4 (normal)
  - empty 2 (desktop / mobile)
- 3 層評価: `outputs/phase-11/manual-test-result.md`

## Documentation

- `outputs/phase-12/implementation-guide.md` (Part 1 中学生 + Part 2 技術)
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md` (0 件)
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Rollback

- DB / schema 変更なし、Cloudflare resource 操作なしのため `git revert` で完結

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> スクリーンショット参照は Phase 11 成果物 (`outputs/phase-11/home-*.png`) を相対 link で添付。画像 0 件の場合は当該セクションを削除する (CLAUDE.md `## PR作成の完全自律フロー § PR作成前チェック`)。

## 6. PR 作成コマンド

```bash
gh pr create --base dev --head feat/dashboard-prototype-alignment \
  --title "feat(public): align landing dashboard with prototype (Hero/Stats/About/Featured/Timeline)" \
  --body "$(cat <<'EOF'
...上記 §5 の本文...
EOF
)"
```

## 7. PR 作成後

- `outputs/phase-13/pr-creation-result.md` に PR URL / pre-flight 結果 / 解消したコンフリクト / 残課題 を記録
- `artifacts.json` の Gate-C `status` を `pending` → `completed` に更新
- staging deploy の自動完了を待ち、Phase 11 screenshot を最新 commit のもので refresh (必要時)

## 8. DoD (Phase 13)

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 13
- workflow_state: `spec_created`

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
- [ ] PR base = `dev`、head = `feat/dashboard-prototype-alignment`
- [ ] PR body にスクリーンショット参照 / implementation-guide 参照が含まれる
- [ ] `outputs/phase-13/pr-creation-result.md` 作成済み
- [ ] PR URL を user に報告
