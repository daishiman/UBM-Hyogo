# Phase 13: PR 作成（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 13 / 13（PR 作成） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 12 |
| タスク種別 | `docs-only` / `NON_VISUAL` / `spec_created` |
| approval gate | **三役ゲート**（user 承認 / commit&push / PR 作成）。本タスクは不可逆 API（branch protection PUT / Cloudflare deploy / D1 migration）を含まないため、**G1-G4 multi-stage approval gate は適用しない**（三役ゲートで十分）。 |

---

## 0. 自己完結コンテキスト

task-01 は apps/packages コード変更ゼロの docs PR。本 Phase で local check / change-summary / PR 作成 / CI 結果記録を行う。Phase 12 の 7 必須成果物が完了していることが前提。

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

## 3. 三役ゲート（直列実行）

### Gate 1: user 承認ゲート

- **通過条件**: change-summary.md を提示し、user の **明示文言**（「承認」「approve」「OK で PR 作成」等）で承認取得
- **提示内容**:
  - 変更範囲（CLAUDE.md edit / specs/00-overview.md edit / SCOPE.md new / task package / completed-tasks archive rename）
  - 各ファイルの追加行数サマリ
  - PR title / body draft
  - rollback 手順（phase-08 §5）
- **曖昧な合意は不可**（「いいよ」程度では実行しない）
- **Claude 実行可能範囲**: 承認取得まで commit / push / PR 作成禁止

### Gate 2: commit / push ゲート

- **通過条件**: Gate 1 PASS 後にユーザーが commit / push を明示指示した場合のみ、commit 粒度ごとに `git add` → `git commit` → `git push`
- **commit 粒度**（5 単位ベースで本タスクに合わせて 1-2 単位に圧縮）:
  - 1 commit: `docs(scope-gate): add ui-prototype-alignment-mvp-recovery scope gate to CLAUDE.md / specs / SCOPE.md`
  - もしくは 2 commit: spec edits（CLAUDE.md / specs）と SCOPE.md new を分離
- **commit message** 末尾に `Refs #<issue>` を付ける（`Closes` は使わない: phase-template-phase13.md §「Issue 参照」）
- **push**: `git push -u origin feat/ui-prototype-alignment-mvp-recovery-task-01`

### Gate 3: PR 作成ゲート

- **通過条件**: Gate 2 PASS 後にユーザーが PR 作成を明示指示した場合のみ、`gh pr create` で PR 作成
- **PR title**: `docs(scope-gate): add ui-prototype-alignment-mvp-recovery scope gate (task-01)`
- **PR base**: `dev`（または solo dev で `main` 直接）
- **PR body** template:

```markdown
## Summary
- task-01 (W1 / solo scope gate / all screens) の docs scope gate を追加
- CLAUDE.md / specs/00-overview.md / SCOPE.md に 19 routes スコープ・既存 API のみ接続・OKLch トークン正本化の 3 合意を明文化
- 後続 task-02..22 の scope gate を確立（W2 起動の前提）

## 変更内容
- `CLAUDE.md` (edit): `## UI prototype alignment / MVP recovery（進行中ワークフロー）` セクション追記
- `docs/00-getting-started-manual/specs/00-overview.md` (edit): 末尾に「画面一覧（19 routes）と API mapping」節追加
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` (new): §1 routes / §2 API mapping / §3 不変条件 / §4 正本順位 / §5 後続タスク導線

## Test plan
- [x] `mise exec -- pnpm lint` exit 0
- [x] `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` 1 件以上
- [x] `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` 1 件以上
- [x] SCOPE.md §1 で `公開` 6 / `会員` 2 / `管理` 8 / `共通` 3 = 計 19
- [x] SCOPE.md §2 endpoint と phase-3 §2 / §7 矛盾なし
- [x] `git diff --name-status main...HEAD` が正本 docs / task package / approved archive のみ
- [x] coverage AC 適用外（pure-docs / vitest 対象なし）

## prototype 参照
- OKLch token 正本: `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-70
- 13 primitive 正本: `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` L1-272

Refs #<issue-number-if-any>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 4. ローカル検証コマンド（local-check-result.md）

```bash
# typecheck（コード変更なしのため必須ではないが念のため）
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# 検算
test -f CLAUDE.md \
  && test -f docs/00-getting-started-manual/specs/00-overview.md \
  && test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
grep -cE "^\| (公開|会員|管理|共通) \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md   # 19 期待
git diff --name-status main...HEAD   # 正本 docs / task package / approved archive のみ期待
git diff --stat main...HEAD
```

---

## 5. CI 確認

PR 作成後 `gh pr checks <PR-URL>` で以下を確認:

| Check | 期待 |
|-------|------|
| `verify-indexes-up-to-date` | PASS（本 PR は skill indexes に touch しないため green） |
| markdown lint（pipeline 内） | PASS |
| その他既定 CI gate | PASS |

CI green 確認結果を `outputs/phase-13/pr-info.md` に記録。

---

## 6. blocked 条件（実行禁止）

phase-template-phase13.md `## ルール` に従い、以下の状態では PR を作成しない:

- [ ] user の明示承認なし（Gate 1 未 PASS）
- [ ] Phase 12 の 7 必須成果物のいずれかが欠落
- [ ] local-check-result.md で lint / 検算が FAIL
- [ ] `git diff --name-status` に正本 docs / task package / approved archive 以外が含まれる

---

## 7. プロトタイプ参照表

| 成果物 | prototype 参照 | 用途 |
|-------|---------------|------|
| change-summary.md | `styles.css` L1-70 / `primitives.jsx` L1-272 | PR body 「prototype 参照」セクションの根拠 |
| pr-info.md | SCOPE.md §3 #3 #5 | PR レビューで prototype 参照整合確認 |

---

## 8. G1-G4 multi-stage approval gate 不適用の理由（明記）

phase-template-phase13.md `## G1-G4 multi-stage approval gate` の適用条件:

- staging deploy + Forms sync + D1 apply + PR を含む
- `visualEvidence=VISUAL_ON_EXECUTION`

本タスクは:

- staging deploy なし / Forms sync なし / D1 apply なし
- `visualEvidence=NON_VISUAL`

→ **適用条件を満たさない**ため、三役ゲート（§3）で十分。

---

## 9. リスク

| リスク | 緩和 |
|-------|------|
| user 承認なしで commit | Gate 1 で明示文言を要件化 |
| CI fail（markdown lint syntax 違反） | Phase 11 で `pnpm lint` 事前検証 |
| 想定外ファイル混入 | `git diff --name-only` を local-check で再確認 |
| PR base ブランチ誤り（`main` を選ぶべきか `dev` か） | CLAUDE.md `ブランチ戦略` 表で feature → dev → main を確認 |

---

## 10. 最終レポート（Phase 13 完了時）

承認前完了時に以下を 1 回だけ報告:

- 採用ブランチ
- local check 結果
- change-summary 作成結果
- `blocked_pending_user_approval` 状態
- 承認後に実行する Gate 2 / Gate 3 の未実行範囲

---

## 11. 完了条件（タスク全体完了 gate）

- [ ] Gate 1 user 承認待ちとして明示（承認後は PASS に更新）
- [ ] Gate 2 commit / push は承認前未実行として明示
- [ ] Gate 3 PR 作成 / URL 取得は承認前未実行として明示
- [ ] CI green 確認は PR 作成後に実施するものとして明示
- [ ] 4 必須成果物（local-check-result / change-summary / pr-info / pr-creation-result）作成
- [ ] phase-09 §4 W1 → W2 移行 gate 全項目 PASS
- [ ] task-01 全体完了 → workflow W2 起動可

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-01 scope gate の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化の要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照先 |
| workflow 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1 -> W7 DAG |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-13.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。
