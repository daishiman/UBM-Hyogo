# Phase 13: PR 作成（task-21-w2-par-screen-blueprints-admin）

[実装区分: ドキュメントのみ]

> 判定根拠注記: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` の新規作成のみで、コード変更を一切伴わない pure docs タスクのため、CONST_004 の例外条件に該当する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-21-w2-par-screen-blueprints-admin` |
| Phase | 13 / 13（PR 作成） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 12 |
| タスク種別 | `docs-only` / `NON_VISUAL` / `spec_created` |
| approval gate | **三役ゲート**（user 承認 / commit&push / PR 作成）。本タスクは不可逆 API（branch protection PUT / Cloudflare deploy / D1 migration）を含まないため、**G1-G4 multi-stage approval gate は適用しない**（三役ゲートで十分）。 |
| 改訂日 | 2026-05-07 |

---

## 0. 自己完結コンテキスト

task-21 は apps/packages コード変更ゼロの docs PR。本 Phase で local check / change-summary / PR 作成 / CI 結果記録を行う。Phase 12 の 7 必須成果物が完了していることが前提。

---

## 1. 目的

Phase 12 完了後、ローカル検証 → change-summary 作成 → user 承認待ちまでを直列で完了する。commit / push / PR 作成 / CI 結果記録はユーザーが明示指示した後にのみ実行し、承認前の本 Phase 判定は `blocked_pending_user_approval` とする。

---

## 2. 必須成果物（4 ファイル）

phase-template-phase13.md `## quick-summary` に従う:

| ファイル | 役割 |
|---------|------|
| `outputs/phase-13/local-check-result.md` | typecheck / lint / build などローカル検証ログ |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前に user に提示） |
| `outputs/phase-13/pr-info.md` | 承認前は `blocked_pending_user_approval`、承認後に PR URL / CI 結果 / Issue 参照 |
| `outputs/phase-13/pr-creation-result.md` | 承認前は未実行理由、承認後に PR 作成プロセスの実行ログ |

---

## 3. ローカル検証

本タスクは apps/packages コード変更ゼロのため、code 系 typecheck / build は **N/A**。実行するのは markdown / spec 検証のみ:

```bash
# 1. 09g 本体の存在
test -f docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md

# 2. Phase 07 verify ハーネス再実行
bash scripts/verify-09g-screen-blueprints-admin.sh

# 3. markdown lint
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md

# 4. git diff 範囲確認（task package + 09g + outputs/phase-* のみであること）
git diff --name-only main...HEAD
```

期待:

- 09g 本体 1 ファイル
- `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-{01..13}.md` 13 ファイル
- `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/outputs/phase-{06..13}/...` 各 Phase 成果物

---

## 4. 三役ゲート（直列実行）

### Gate 1: user 承認ゲート

- **通過条件**: change-summary.md を提示し、user の **明示文言**（「承認」「approve」「OK で PR 作成」等）で承認取得
- **提示内容**:
  - 変更範囲（09g 新規 / task package phase-01..13 / outputs/phase-XX）
  - 各ファイルの追加行数サマリ
  - PR title / body draft
  - rollback 手順（09g を `git rm` で削除すれば原状復帰）
- **曖昧な合意は不可**（「いいよ」程度では実行しない）
- **Claude 実行可能範囲**: 承認取得まで commit / push / PR 作成禁止

### Gate 2: commit / push ゲート

- **通過条件**: Gate 1 PASS 後にユーザーが commit / push を明示指示した場合のみ、commit 粒度ごとに `git add` → `git commit` → `git push`
- **commit 粒度**（推奨 2 単位）:
  - commit 1: `docs(specs): add 09g-screen-blueprints-admin (admin 8 routes + sidebar)`（09g 本体 + INDEX 任意更新）
  - commit 2: `docs(workflow): add task-21 phase-01..13 + outputs`（workflow package 全体）
- **commit message** 末尾に `Refs #<issue>` を付ける（`Closes` は使わない）
- **push**: `git push -u origin feat/<branch>`

### Gate 3: PR 作成ゲート

- **通過条件**: Gate 2 PASS 後にユーザーが PR 作成を明示指示した場合のみ、`gh pr create` で PR 作成
- **PR title**: `docs(specs): add 09g screen blueprints admin (task-21)`
- **PR base**: `dev`（または solo dev で `main` 直接）
- **PR body** template:

```markdown
## Summary

- task-21（W2 / parallel / screen blueprints admin）の admin 層 blueprint を追加
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` を新規作成（700〜1200 行）
- admin 8 routes（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit）+ AdminSidebar 共通 = 9 セクション
- プロトタイプ掲載 4 画面は `pages-admin.jsx` から JSX 一字一句転記
- 未掲載 4 画面は phase-3 §3 §5.3〜§5.7 派生ルールに従い再現
- 視覚値（HEX / oklch / px / `bg-[`）0 件 / API 表 current admin API contract 一致 / confirm Modal a11y 4 要素完備

## 変更内容

- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（new, 700〜1200 行）
- `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-{01..13}.md`（new, 13 ファイル）
- `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/outputs/phase-{06..13}/...`（new, Phase 成果物）

## Test plan

- [x] Phase 07 verify ハーネス T-01〜T-17 全 PASS
- [x] Phase 08 link integrity check（09a/09b/09c/09d 想定 mapping 整合）
- [x] Phase 09 DoD D-01〜D-11 全 PASS
- [x] Phase 11 docs walkthrough（NON_VISUAL 代替証跡）
- [x] markdown lint error 0
- [x] 視覚値 0 件 / API trace 完全一致

## visualEvidence

NON_VISUAL（spec markdown のみ・apps/web 画面実装ゼロのため screenshot 不要 / Phase 11 docs walkthrough で代替）

Refs #<issue>
```

---

## 5. CI 結果記録（Gate 3 後）

- `outputs/phase-13/pr-info.md` に PR URL / CI ステータス / Issue link を記録
- CI red の場合は Phase 05 へループバック

---

## 6. Rollback 手順

| 状況 | 手順 |
|------|------|
| commit 前に問題発覚 | 09g を編集修正し再 verify |
| commit 後 push 前 | `git reset --soft HEAD~1` |
| push 後 PR 作成前 | `git revert <hash>` または force-push 不使用方針で新 commit で修正 |
| PR 作成後 | PR を close + 修正 PR を新規作成 |
| merge 後 | `git revert <merge-hash>` で 09g 削除 + workflow package 削除 |

---

## 7. 完了条件（task-21 完了 gate）

- [ ] `outputs/phase-13/local-check-result.md` 配置（verify ハーネス全 PASS / markdown lint error 0）
- [ ] `outputs/phase-13/change-summary.md` 配置（変更範囲 / 行数 / PR draft）
- [ ] Gate 1 user 承認待ち or 承認済
- [ ] Gate 2 commit / push 実行済（承認後）
- [ ] Gate 3 PR 作成済（承認後）
- [ ] `outputs/phase-13/pr-info.md` に PR URL 記録（承認後）

---

## 8. プロトタイプ参照表

本 Phase は PR 作成のため prototype 直接参照なし。

---

## 9. リスク / 注意

| リスク | 緩和 |
|-------|------|
| 承認前に commit / push してしまう | Gate 1 → 2 → 3 の順序遵守 |
| diff scope 規律違反（task 範囲外ファイル混入） | 本 §3 step 4 で `git diff --name-only main...HEAD` 確認 |
| sync-merge で他 task package 混入 | source §「diff scope 規律」に従い `git checkout HEAD -- <path>` で復旧 |
| PR body の DoD と実状の drift | Phase 09 結果ログを引用 |

---

## 10. 次 Phase への引き渡し

task-21 完了。後続:

- **task-15** (admin dashboard + members 実装): 09g §2 / §3 を入力として apps/web 実装
- **task-16** (admin tags / meetings / requests 実装): 09g §4 / §5 / §7
- **task-17** (admin schema / conflicts / audit 実装): 09g §6 / §8 / §9
- **task-22** (W7 統合): 09g link 先 anchor の最終整合確認

## 実行タスク

- ローカル検証 → change-summary 作成 → 三役ゲート順次実行（user 承認後のみ）

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| phase-template-phase13 | skill `task-specification-creator` references/ | 三役ゲート / 4 必須成果物 |
| Phase 12 | `phase-12.md` | 7 必須成果物 |
| 09g 本体 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | PR 主成果物 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| local-check-result | `outputs/phase-13/local-check-result.md` | verify ハーネス実行ログ |
| change-summary | `outputs/phase-13/change-summary.md` | PR 提示用サマリ |
| pr-info | `outputs/phase-13/pr-info.md` | PR URL / CI / Issue |
| pr-creation-result | `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスログ |
| phase specification | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-13.md` | 本 phase の仕様書 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] 三役ゲート Gate 1〜3 が承認順序通りに実行されている。
- [ ] PR URL が記録されている（承認後）。

## 目的

- task-21 を PR 作成まで完遂し、後続 task-15/16/17 が 09g を入力として実装着手できる状態を確立する。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL のため Vitest 統合テストは対象外。Phase 07 verify ハーネスを CI gate として運用する想定（task-22 で 09 系 spec 全体の verify gate に統合）。
