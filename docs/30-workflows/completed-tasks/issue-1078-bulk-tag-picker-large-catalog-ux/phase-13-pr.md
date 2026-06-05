# Phase 13: PR 作成（user-gated）

> issue #1078。段階: **implemented_local_evidence_captured**。commit / push / PR 作成は user-gated。
> **commit / PR 作成 / issue の mutation（close・コメント）/ staging visual baseline は全て user の明示承認後のみ実行**（CONST_002・Gate-C pending）。

---

## 1. 前提・境界

| 項目 | 値 |
| --- | --- |
| PR base ブランチ | `dev`（既定。`main` への PR は production リリース時のみ） |
| Gate-C 状態 | `pending_user_approval`（commit / push / PR / staging visual は未実行） |
| issue #1078 の実状態 | **OPEN**（ユーザーはクローズド認識だが GitHub 上は OPEN）。本タスク仕様書作成では **issue を mutate しない**。 |
| 変更範囲 | `apps/web` のみ（`apps/api` 非変更） |
| タスク種別 | `VISUAL_ON_EXECUTION`（PR 本文に screenshot 参照を含める。実画像は user-gated 取得後） |

---

## 2. 実行順序（実装 land + user 承認後）

1. 作業ブランチ確認。`dev` 直上なら主題から `fix/`（contract バグが主因）で作業ブランチを自律作成（例: `fix/issue-1078-bulk-tag-picker-large-catalog`）。
2. `git fetch origin dev` → ローカル `dev` を fast-forward 同期 → 作業ブランチへ `dev` をマージ（コンフリクトは CLAUDE.md 既定方針で解消）。
3. 品質検証（4コマンド）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
4. 失敗時は最大3回まで自動修復しコミット。
5. `git status --porcelain` で残変更を確認し `git add -A`。
6. PR に含めるファイル一覧を取得（§4）。
7. PR 本文を作成し `gh pr create --base dev`。

---

## 3. 想定 PR タイトル / 本文構成

### タイトル（案）
```
fix(admin): BulkActionBar tag picker 大規模 catalog UX 改善 + tag master read contract 修正 (issue-1078)
```

### 本文構成
- **概要**: root-cause（`fetchTagMaster` が `{ total, items }` を `{ available }` と誤読 → picker が無言で空）と、その隠蔽（テスト mock が `{ available }` を返していた）を修正。大規模 catalog 向けに検索 / 折りたたみ / max-height / 選択中固定行 / pagination を追加。
- **AC 対応表**: AC-0（contract 修正）/ AC-1（検索）/ AC-2（折りたたみ・max-height）/ AC-3（max-height スクロール）/ AC-4（選択中固定行）/ AC-5（mobile sticky・pagination）。
- **実装ガイド反映**: `outputs/phase-12/implementation-guide.md` の主要見出し（型定義 / `fetchTagMaster` / `fetchAllTagMaster` / 設定パラメータ / 視覚証跡）を漏れなく反映。
- **スクリーンショット**: `outputs/phase-11/screenshots/` に実画像がある場合のみ参照を含める（canonical 名 S-1..S-4）。**画像が無い場合はスクリーンショット専用セクションを作らない**。
- **テスト**: `BulkActionBar.spec.tsx` / `members.spec.ts`（mock を実 API 形 `{ total, items }` へ是正）の結果。
- **影響範囲**: `apps/web` のみ・`apps/api` 非変更を明記。
- フッタに `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。

---

## 4. PR に含めるファイル一覧の取得方法

```bash
git diff dev...HEAD --name-only   # PR に入る全ファイル（漏れなし確認の正本）
git status --porcelain            # 未コミット変更が空であること
```

`outputs/phase-11/` 配下の画像数（png/jpg/jpeg/gif/webp）と PR 本文の画像参照数が整合していること。画像が無ければスクリーンショット項目を残さない。

---

## 5. issue #1078 の取り扱い（user-gated）

- issue #1078 は GitHub 上 **OPEN**。本フェーズでも **状態を変更しない**。
- PR 本文に `Closes #1078` を入れる / issue にコメントする / issue を close する操作は、**いずれも user の明示承認後にのみ実行**する。
- ユーザーがクローズド認識である乖離は最終レポートで明示し、状態変更は指示を待つ。

---

## 6. user-gated 段階の明記

本 Phase 13 は **未実行**。local 実装と品質検証は完了済みで、user が commit / PR 作成を承認した後にのみ実行する。staging visual baseline の更新も同様に user-gated。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [x] 必須見出しが揃っている。
- [x] 状態語彙が `implemented_local_evidence_captured` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と整合している。
