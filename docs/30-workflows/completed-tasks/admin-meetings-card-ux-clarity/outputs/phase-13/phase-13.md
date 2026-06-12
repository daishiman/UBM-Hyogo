# Phase 13: PR 作成・ドキュメント更新仕様

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

実装完了後の PR 作成手順を固定する。CLAUDE.md「PR 作成の完全自律フロー」と整合。**commit / push / PR 作成 / staging deploy / screenshot 取得はすべて `pending_user_approval`（user-gated）**。本 Phase ではコード実装・git 操作を行わない。

## 1. 前提

- base ブランチ: **`dev`**（CLAUDE.md 既定）
- 作業ブランチ: `feat/admin-meetings-card-ux-clarity`
- 全 Phase 4-11 の DoD クリア
- Phase 11 evidence（local validation summary + local screenshot 5 枚 + grep log）tracked-commit 対象。staging screenshot は user-gated 取得後に差替/追加
- API 不変（`git diff -- apps/api` 空）/ HEX 0 / data-testid contract 保持を確認済

## 2. PR 作成前検証（CLAUDE.md PR 自律フロー §実行順序）

```bash
git fetch origin dev
git checkout dev
git merge --ff-only origin/dev || git pull --ff-only origin dev
git checkout feat/admin-meetings-card-ux-clarity
git merge dev   # コンフリクト発生時は dev 側採用 + 必要差分再適用（CLAUDE.md 既定方針）

mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で push 可。`verify-pr-ready.sh` が fail した場合は skill `references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い解消。

> **user-gated（pending_user_approval）**: 上記コマンドの実行および push は user 明示承認後にのみ行う。

### 実装 wave で取得する検証コマンド一覧（DoD evidence）

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# vitest（_meetings 4 spec + 追加ケース DR-1〜DR-3 / TL-1）
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx

PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/admin-meetings-card-ux-clarity/outputs/phase-11 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=desktop-chromium playwright/tests/admin-meetings-card-ux-clarity.spec.ts

# token 正本（HEX 0 / var(--ubm-*) 経由）
mise exec -- pnpm verify:tokens

# 新規 HEX 0 件 grep
grep -rn "bg-\[#\|text-\[#" apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css

# API 不変（空期待・AC-8）
git diff dev -- apps/api

# data-testid contract 保持（wrapper移動後も同一ID維持・AC-6）
git diff -- apps/web/src/features/admin/components/_meetings | grep '^[-+].*data-testid'
```

## 3. 正本仕様への反映

本サイクルは `docs/00-getting-started-manual/specs/` の正本更新を伴わない（`system-spec-update-summary.md` Step 1 / Step 2 ともに N/A）。

ただし `docs/30-workflows/LOGS.md` への 1 行追加と aiworkflow-requirements 5 surface 同期は必須:

```bash
# same-wave skill sync
mise exec -- pnpm indexes:rebuild   # idempotent（drift 0）確認
git diff --stat .claude/skills/aiworkflow-requirements docs/30-workflows/LOGS.md
```

## 4. PR 本文テンプレート（`.claude/commands/ai/diff-to-pr.md` 準拠）

```markdown
## Summary

- staging `/admin/meetings`（開催日管理）の視覚情報設計を apps/web 表現層で改善
- 未定義 BEM クラス（`.admin-timeline*` / `.admin-meeting-drawer` / `.ui-card--flat`）を `var(--ubm-*)` 経由で CSS 実体化し、カードを境界線 + gap で分離（影消し）
- 展開ドロワー内 4 セクションを見出し付きサブカード（`.admin-detail-section`）へ整理、出席者を行リスト（`.admin-attendee-row`）化、見出しに人数 `(N名)` を表示
- 既存 API endpoint surface / D1 schema / Google Form 仕様は不変（`git diff dev -- apps/api` 空）
- OKLch tokens 経由（HEX 直書き 0 件）/ data-testid・aria・role 不変（contract 保持）

## 変更スコープ

- F1: `apps/web/src/styles/globals.css`（BEM 実体化 + 汎用 primitive `.admin-detail-section*` / `.admin-attendee-row*` 新設）
- F2: `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`（サブカード化 + 出席者行 + 人数）
- F3: `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`（heading wrapper・任意）
- T1/T2: `__tests__/MeetingAttendanceDrawer.spec.tsx` / `MeetingTimeline.spec.tsx`（DR-1〜DR-3 / TL-1 構造ケース追加）
- docs: `docs/30-workflows/admin-meetings-card-ux-clarity/**`（Phase 1-13 + evidence）
- skill: aiworkflow-requirements 5 surface + indexes:rebuild

## Screenshots

`docs/30-workflows/admin-meetings-card-ux-clarity/outputs/phase-11/screenshots/` の 5 PNG を本文中に参照:

- `meetings-list-default-desktop.png`
- `meetings-list-default-mobile.png`
- `meetings-card-expanded-desktop.png`
- `meetings-card-expanded-mobile.png`
- `meetings-attendees-list-desktop.png`

## Test plan

- [x] `pnpm typecheck` exit 0
- [x] `pnpm lint` exit 0
- [x] `pnpm exec vitest run apps/web/src/features/admin/components/_meetings/__tests__/*.spec.tsx`（_meetings 4 spec + DR-1〜DR-3 / TL-1）exit 0
- [x] local Playwright screenshot 5 枚（admin auth fixture）exit 0
- [x] `pnpm verify:tokens` exit 0（HEX 0 / token 経由）
- [x] `grep "bg-[#|text-[#"`（_meetings + globals.css）0 件
- [x] `git diff dev -- apps/api` 空（API 不変）
- [x] `git diff dev ... | grep '^-' | grep 'data-testid'` 0 件（contract 保持）
- [ ] staging `/admin/meetings` 視覚確認（カード分離 / 展開階層 / 出席者行）— user-gated
- [ ] `bash scripts/verify-pr-ready.sh` exit 0

## Follow-ups

- OOS-1: 他 admin 一覧（members / tags / audit / schema / requests / identity）への共通 primitive DOM 適用
- OOS-2: 開催日カードの色設計見直し
- OOS-3: 右スライドドロワー化
- OOS-4: 出席者のチップ / タグ集約表示

## Phase 11 evidence

`docs/30-workflows/admin-meetings-card-ux-clarity/outputs/phase-11/` 配下に inventory（local screenshot 5 + log 8 + local validation summary 1 + local visual review 1）。staging screenshot は user-gated 取得。
```

## 5. PR 作成コマンド（pending_user_approval）

```bash
gh pr create --base dev \
  --title "feat(admin-meetings): カード分離・展開編集・出席者一覧の視覚情報設計を改善" \
  --body "$(cat <<'EOF'
…上記テンプレート…
EOF
)"
```

> **user 明示承認後のみ実行**。

## 6. PR 後の追加対応（pending_user_approval）

- `docs/30-workflows/LOGS.md` に本ワークフロー root の 1 行を追加（本 PR に含める）
- aiworkflow-requirements 5 surface 同期を本 PR に含める
- merge 後、OOS-1（primitive の他画面適用）が必要なら follow-up タスク / GitHub Issue を起票

## 7. リリース後検証（staging）— pending_user_approval

merge → dev → staging deploy 後:

```bash
# user 明示承認後のみ。staging deploy → 認証 → screenshot
# 1. /admin/meetings 一覧（折りたたみ）desktop / mobile でカード分離を確認
# 2. カード 1 件展開 desktop / mobile で 3 セクション（編集 / 出席を追加 / 出席者）の階層を確認
# 3. 出席者セクションで行リスト + 人数 (N名) + 削除ボタン右寄せを確認
# 生成 PNG は outputs/phase-11/screenshots/ 配下に canonical 名で保存し tracked-commit
```

production 反映は `dev → main` リリースサイクルで実施。

## 8. DoD

- [ ] §2 PR 作成前検証コマンドすべて exit 0
- [ ] §3 skill sync + indexes:rebuild idempotent（drift 0）
- [ ] §4 PR 本文が全項目埋まっている
- [ ] §5 PR 作成は user 明示承認後
- [ ] §6 LOGS.md 追記 + skill sync が同 PR に含まれる
- [ ] §7 staging 検証 3 項目すべて user 承認済み
- [ ] PR URL が user に共有される

## 9. user-gated 境界サマリ

| 操作 | 状態 |
|---|---|
| commit | pending_user_approval |
| push | pending_user_approval |
| PR 作成（base=dev） | pending_user_approval |
| staging deploy | pending_user_approval |
| screenshot 取得 | pending_user_approval |

## 10. 参照

- CLAUDE.md「PR 作成の完全自律フロー」
- `outputs/phase-10/phase-10.md`（リリース計画 / rollback）
- `outputs/phase-11/phase-11.md`（evidence inventory / screenshot-plan）
- `outputs/phase-12/implementation-guide.md`（実装ハンドブック）
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
