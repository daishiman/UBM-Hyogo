# Phase 13: PR 作成

[実装区分: ドキュメントのみ]

**判定根拠**: PR 本文の生成と作成のみ。runtime code 変更なし。user 明示承認後のみ実行。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

closed-issue-canonical-workflow-recovery パターンに従い、`Refs #291` のみで base=dev に PR を作成する。`Closes #291` は禁止（Issue は既に CLOSED のため、自動再 close を避ける）。

---

## 2. スコープ

### 対象

- PR 本文の生成（Phase 12 implementation-guide.md ベース）
- `gh pr create --base dev` で PR 作成
- PR URL の最終レポート

### 対象外

- commit / push の事前自動実行（user 明示承認後）
- main への直接 PR（base は dev 固定）

---

## 3. 前提条件

- **user の明示承認**（PR 作成許可）
- Phase 12 全成果物が完了
- `bash scripts/verify-pr-ready.sh` exit 0
- 作業ブランチが dev と sync 済み

---

## 実行タスク

### 4.1 pre-flight 確認

```bash
git status --porcelain
git diff dev...HEAD --name-only
bash scripts/verify-pr-ready.sh
```

**期待**: status clean、diff にて編集対象ファイルが全件含まれる、verify-pr-ready exit 0

### 4.2 PR 本文の生成

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、Phase 12 `implementation-guide.md` を反映:

```markdown
## Summary

- `.claude/skills/aiworkflow-requirements/references/` の stale current guidance を整理
- 単一 `/admin/sync` / `sync_audit` / Google Sheets API を current guidance から外し historical に格下げ
- 03a / 03b / 04c / 09b / 02c から legacy umbrella (`task-sync-forms-d1-legacy-umbrella-001`) への逆リンクを追記

## 背景

旧 UT-09 を閉じた `task-sync-forms-d1-legacy-umbrella-001` の close-out 後も、references 5 ファイル + backlog 1 ファイルに stale current guidance が残存していた。本 PR で current = Forms API + `/admin/sync/schema` + `/admin/sync/responses` + `sync_jobs` に統一する。

## 変更内容

| カテゴリ | ファイル | 概要 |
|---------|---------|------|
| references current drift 解消 | api-endpoints.md / environment-variables.md / deployment-cloudflare.md / deployment-secrets-management.md / architecture-overview-core.md | 互換 mount / Sheets API 経路を historical 化、Forms API split endpoint を current として固定 |
| backlog supersede | task-workflow-backlog.md | UT-DSC-MIGRATION-SCRIPT-001 / UT-DSC-SYNC-AUDIT-APPEND-ONLY-001 を `status: superseded` |
| 逆リンク追記 | 03a / 03b / 04c / 09b / 02c | legacy umbrella への逆引きリンクを related-tasks セクションに追加 |
| skill indexes | aiworkflow-requirements/indexes | `pnpm indexes:rebuild` で同期 |

## 実装区分

ドキュメントのみ（runtime code / D1 migration / Cloudflare Secret 変更なし）。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/rg-before-after.md` 参照。

## Test plan

- [ ] stale current scan: 0 hit（historical 除外フィルタ後）
- [ ] conflict marker scan: 0 hit
- [ ] backlink scan: 3 physical file hit + 2 ledger fallback rows
- [ ] index drift: 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0（Phase 12 strict 7 outputs 生成後）
- [ ] historical ファイル（lessons-learned-* / completed / inventory）に編集差分 0

## Issue 参照

Refs #291

（注: Issue #291 は既に CLOSED のため `Closes #291` は使用しない）

🤖 Generated with Claude Code
```

### 4.3 PR 作成コマンド

```bash
gh pr create --base dev --title "docs(skill): forms D1 legacy follow-up cleanup (Refs #291)" --body "$(cat <<'EOF'
（4.2 で生成した本文をここに）
EOF
)"
```

**注意事項**:

- base は `dev` 固定（CLAUDE.md § PR作成の完全自律フロー 参照）
- title に Issue 番号を含めるが `Closes` 文言は禁止
- body 内 `Refs #291` のみ。`Closes #291` / `Fixes #291` / `Resolves #291` は全て禁止

### 4.4 PR 作成後の確認

```bash
gh pr view --json url,number,baseRefName,title
```

**期待**:
- baseRefName: `dev`
- title に `Refs #291` を含む
- body に `Closes` / `Fixes` / `Resolves` が含まれない

### 4.5 closed issue 自動再 open チェック

PR 作成後に Issue #291 の state を確認:

```bash
gh issue view 291 --json state
```

**期待**: `closed`（PR 作成で reopen されていないこと）

---

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-13/main.md` | PR 作成サマリ + URL + base + Issue 参照モード確認結果 |
| `outputs/phase-13/pr-body.md` | PR 本文の最終版 |

---

## 完了条件

- [ ] user 明示承認後に実行
- [ ] base=dev で PR 作成
- [ ] title / body に `Refs #291` のみ含み `Closes` 系は含まれない
- [ ] Issue #291 が closed のままで reopen されていない
- [ ] PR URL が `outputs/phase-13/main.md` に記録
- [ ] `artifacts.json` phase 13 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| user 承認なしに PR 作成 | 本 phase は `user_approval_required: true`。承認ログを `main.md` に記録 |
| `Closes #291` を誤って付与し Issue が状態揺れする | PR 本文を最終確認時に `rg -n "Closes|Fixes|Resolves" outputs/phase-13/pr-body.md` で 0 hit を verify |
| base を main に向けてしまう | gh pr create に `--base dev` を必須引数として明示 |
| verify-pr-ready が失敗 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照して原因切り分け |

---

## 参照資料

- `CLAUDE.md` § PR作成の完全自律フロー
- `.claude/commands/ai/diff-to-pr.md`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

---

## 9. 次フェーズへの引き継ぎ

PR レビュー / merge 後に本 workflow を `docs/30-workflows/completed-tasks/` へ移送するかは別判断（recovery-workflow / completed-tasks 移動ルールに従う）。`artifacts.json` の `workflow_state` は本 PR merge 後に `completed` へ更新する。
