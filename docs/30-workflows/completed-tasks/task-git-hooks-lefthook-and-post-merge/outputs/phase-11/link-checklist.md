# Phase 11 — link-checklist.md

## Status

completed

## 目的

タスク仕様書群（`docs/30-workflows/task-git-hooks-lefthook-and-post-merge/`）が参照する内部 / 外部リンクが、すべて実在のパスまたは到達可能 URL であることを検証する。

## 内部リンク（リポジトリ内パス）

### Phase 仕様書間

| 参照元 | 参照先 | 種別 | 実在 |
| --- | --- | --- | --- |
| `outputs/phase-2/main.md` | `outputs/phase-2/design.md` | mirror | YES |
| `outputs/phase-3/main.md` | `outputs/phase-3/review.md` | mirror | YES |
| `outputs/phase-8/main.md` | `outputs/phase-8/before-after.md` | mirror | YES |
| `outputs/phase-9/main.md` | `outputs/phase-9/quality-gate.md` | mirror | YES |
| `outputs/phase-10/main.md` | `outputs/phase-10/go-no-go.md` | mirror | YES |
| `outputs/phase-11/main.md` | `outputs/phase-11/manual-smoke-log.md` | mirror | YES |
| `outputs/phase-11/main.md` | `outputs/phase-11/link-checklist.md` | mirror | YES |
| `outputs/phase-10/go-no-go.md` | `outputs/phase-2/design.md` | cross-phase | YES |
| `outputs/phase-10/go-no-go.md` | `outputs/phase-8/before-after.md` | cross-phase | YES |
| `outputs/phase-10/go-no-go.md` | `outputs/phase-11/manual-smoke-log.md` | cross-phase | YES |
| `outputs/phase-10/go-no-go.md` | `outputs/phase-11/main.md` | cross-phase | YES |
| `outputs/phase-8/before-after.md` | `outputs/phase-12/unassigned-task-detection.md` | cross-phase | YES |

### artifacts.json と outputs の 1:1 対応

| `artifacts.json :: phases[].outputs` | 実ファイル |
| --- | --- |
| `outputs/phase-1/main.md` | YES |
| `outputs/phase-2/main.md` / `design.md` | YES / YES |
| `outputs/phase-3/main.md` / `review.md` | YES / YES |
| `outputs/phase-4/main.md` / `test-matrix.md` | YES / YES |
| `outputs/phase-5/main.md` / `runbook.md` | YES / YES |
| `outputs/phase-6/main.md` / `failure-cases.md` | YES / YES |
| `outputs/phase-7/main.md` / `coverage.md` | YES / YES |
| `outputs/phase-8/main.md` / `before-after.md` | YES / YES（本 Phase で作成） |
| `outputs/phase-9/main.md` / `quality-gate.md` | YES / YES（本 Phase で作成） |
| `outputs/phase-10/main.md` / `go-no-go.md` | YES / YES（本 Phase で作成） |
| `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` | YES / YES / YES（本 Phase で作成） |
| `outputs/phase-12/main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` | YES / YES / YES / YES / YES / YES / YES |
| `outputs/phase-13/main.md` / `change-summary.md` / `pr-template.md` | YES / YES / YES |

### リポジトリルート参照

| 参照元 | 参照先 | 実在 | 備考 |
| --- | --- | --- | --- |
| 本タスク全般 | `CLAUDE.md` | YES | プロジェクト基準ファイル |
| Phase 1 / 2 | `scripts/new-worktree.sh` | YES | 既存スクリプト |
| 本タスク全般 | `scripts/cf.sh` | YES | Cloudflare CLI ラッパー |
| Phase 8 before-after | `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | YES | 維持対象（hook 経路からは切離し） |
| Phase 8 before-after | `.gitattributes`（merge=ours 設定） | YES | 変更しない |
| Phase 2 / 8 | `package.json`（`prepare` / `indexes:rebuild` script 追加予定） | YES | 本タスクで編集 |

## 外部リンク

| URL | 用途 | 確認 |
| --- | --- | --- |
| `https://lefthook.dev/configuration/` | lefthook 公式ドキュメント | 到達可能（公開ドキュメント） |

## チェック手順（Phase 11 実機検証時）

```bash
# 1. 内部リンクのファイル存在確認
grep -rEho 'outputs/phase-[0-9]+/[A-Za-z\-]+\.md' \
  docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs \
  | sort -u | while read p; do
    [ -f "docs/30-workflows/task-git-hooks-lefthook-and-post-merge/$p" ] \
      || echo "MISSING: $p"
done

# 2. リポジトリルート参照の存在確認
for p in CLAUDE.md scripts/new-worktree.sh scripts/cf.sh \
         .claude/skills/aiworkflow-requirements/scripts/generate-index.js \
         .gitattributes package.json; do
  [ -e "$p" ] || echo "MISSING: $p"
done

# 3. artifacts.json と outputs の 1:1 対応
node -e "
  const a = require('./docs/30-workflows/task-git-hooks-lefthook-and-post-merge/artifacts.json');
  const fs = require('fs');
  const base = 'docs/30-workflows/task-git-hooks-lefthook-and-post-merge';
  for (const p of a.phases) for (const o of p.outputs)
    if (!fs.existsSync(\`\${base}/\${o}\`)) console.log('MISSING:', o);
"
```

## 合格条件

- 上記 3 コマンドの出力に `MISSING:` が 1 件も含まれないこと
- 外部リンク（lefthook.dev）が HTTP 200 で到達可能であること（`curl -I` で確認）

## 不合格時の対応

| 検出 | 対応 |
| --- | --- |
| `outputs/phase-N/*.md` が不足 | 該当 Phase の main / detail を生成し直す |
| `artifacts.json` 側の余剰 | artifacts.json から該当 entry を削除（Phase 7 coverage と整合させる） |
| ルート参照不在 | 仕様書側の参照を修正、または該当ファイルを新設 |
| 外部リンク 404 | lefthook 公式の最新 URL に更新 |
