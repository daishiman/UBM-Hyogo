# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終） |
| 状態 | pending |
| user_approval_required | true |

## 目的

local check → commit → push → PR 作成の最終ゲートを通す。**ユーザーの明示的な承認なく PR を作成してはならない。**

## 三役ゲート

| ゲート | 内容 | 承認者 |
| --- | --- | --- |
| 1. user 承認 | 「PR 作成して」の明示指示 | ユーザー |
| 2. local-check-result | typecheck / lint / link-checklist / secret hygiene grep の PASS | 本 Phase |
| 3. push & PR | feature ブランチ push + `gh pr create` | 本 Phase |

## local-check-result.md

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# evidence secret hygiene 再 grep
grep -iE '(token|cookie|authorization|bearer|set-cookie)' \
  docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/outputs/phase-11/evidence/**/*.txt || echo 'PASS'
# artifacts.json parity
node scripts/verify-task-artifacts.mjs docs/30-workflows/ut-06b-profile-logged-in-visual-evidence  # 仮
```

すべて PASS を `outputs/phase-13/local-check-result.md` に記録。

## change-summary.md

- 新規ディレクトリ: `docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/`
- index.md / artifacts.json / phase-01〜13.md
- outputs/phase-01〜13/ 各種成果物
- outputs/phase-11/evidence/screenshot/ に 6 png + 3 txt、Phase 11 補助 metadata 4 ファイル、manual diff 1 ファイル
- outputs/phase-11/evidence/manual-smoke-evidence-update.diff
- 親 06b workflow `manual-smoke-evidence.md` 6 行更新

## PR template（`outputs/phase-13/pr-template.md`）

```
title: docs(issue-278): UT-06B /profile logged-in visual evidence task spec

body:
## Summary
- Issue #278 のタスク仕様書を `docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/` 配下に作成
- Phase 1〜13 + index.md + artifacts.json
- 親 06b workflow の visual evidence pending を closed-loop 化する仕様

## Refs
Refs #278

## Plan
- [ ] Phase 1〜10 完了
- [ ] Phase 11 で local M-08〜M-10 取得
- [ ] staging deploy 後に M-14〜M-16 取得
- [ ] manual-smoke-evidence.md 6 行更新
- [ ] Phase 12 documentation 7 ファイル
- [ ] Phase 13 PR 承認

## Evidence
- outputs/phase-11/evidence/screenshot/* (取得後)
- outputs/phase-13/local-check-result.md
```

注意:
- `Closes #278`（自動 close）は **使わない**。issue は既に closed のため `Refs #278` を採用。
- コミット粒度は 5 単位（spec 群 / outputs 群 / runbook 群 / Phase 12 docs / artifacts.json 最終確定）

## rollback

- spec / docs のみのため、PR revert で完全に戻る
- 親 06b workflow `manual-smoke-evidence.md` の更新は別 commit にし、revert 容易性を確保

## 実行タスク

- [ ] user 承認待ち
- [ ] local check 実行 → `local-check-result.md` 記録
- [ ] change-summary.md 作成
- [ ] PR template 確認
- [ ] **user 承認後** push + `gh pr create`
- [ ] PR URL を記録

## 完了条件

- [ ] 三役ゲートすべて PASS
- [ ] PR URL 取得済み
- [ ] artifacts.json の phase 13 を completed
- [ ] root workflow_state を `completed`（VISUAL 取得 partial 時は `partial` 据え置き）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 13 を completed
- [ ] PR URL を artifacts.json か outputs/phase-13/main.md に記録

## 終了

本タスク完了をもって、親 06b workflow の `/profile` logged-in visual evidence pending が closed-loop 化される。
