# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 12 |
| 下流 | - |
| 状態 | blocked |
| user_approval_required | true |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| Issue | #142（**CLOSED のまま運用**。本 PR では reopen しない） |

## 目的

タスク仕様書（`docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/`）の commit と PR 作成。**ユーザーの明示承認後のみ実施**する。

## 重要ルール

- commit / push / PR 作成は user の明示承認なしに実行しない
- 本タスクは `workflow: spec_only` のため、コード変更は含まない（Markdown と JSON のみ）
- ブランチ戦略: `feature/* → dev → main`（CLAUDE.md ルール準拠）
- Issue #142 は CLOSED 維持。reopen せず、PR description でリンク参照のみ行う
- 実 `~/.claude/settings.json` / `~/.zshrc` への書き換えは本 PR に含めない（apply タスクで別 PR）

## 事前チェック

- [ ] Phase 12 の成果物 + `main.md` が揃っている
- [ ] artifacts.json の outputs 配列と実体ファイルが同期済み
- [ ] `git status` で意図したファイルのみ stage 候補（`docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/` 配下のみ）
- [ ] `.env` 実値 / API token / OAuth トークンの混入 0 件:
      `grep -rE "(sk-|api_key|API_KEY|CLOUDFLARE_API_TOKEN)" docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/`
- [ ] `task-claude-code-permissions-apply-001` 指示書の参照欄に本ドキュメント追記依頼が unassigned-task-detection.md / documentation-changelog.md に記録されている

## PR テンプレート（草案）

`outputs/phase-13/pr-template.md` に以下を保存する。

```
## Summary
- Claude Code permissions の project-local-first vs global-first 比較設計タスク仕様書を追加
- 4 層責務表（global / global.local / project / project.local）と各層の評価軸を確定
- 案 A（global + shell alias）/ 案 B（project-local-first）/ ハイブリッドの 3 案比較表を整備
- 採用方針を 1 案に確定し、`task-claude-code-permissions-apply-001` の設計入力としてハンドオフ
- 設計のみ（spec_only / docs-only / NON_VISUAL）。実 settings / shell alias の書き換えは別タスク

## Related
- Issue: #142（**CLOSED のまま運用**。本 PR では reopen しない）
- 前提: `docs/30-workflows/task-claude-code-permissions-decisive-mode/`（Phase 3 / Phase 12 成果物を参照）
- 実装ハンドオフ先: `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
  → 当該タスク指示書の参照欄に本ドキュメントを追記する依頼を Phase 12 成果物に含める
- 並行: `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md`

## Test plan
- [ ] phase-01〜phase-13.md と outputs/phase-1〜phase-13/ が揃う
- [ ] artifacts.json が JSON valid
- [ ] index.md の Phase 表が artifacts.json と一致
- [ ] secrets 漏洩 0 件
- [ ] 比較表に出典（公式 docs / 実機読み取りログ）が 100% 紐付く
- [ ] 他プロジェクト副作用（`scripts/cf.sh` / `op run` / 他 worktree）への言及がある
- [ ] `task-claude-code-permissions-apply-001` 参照欄追記依頼が unassigned-task-detection.md に記録
```

## ローカルチェック

```bash
# JSON validity
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/artifacts.json','utf8'))"

# 成果物の完全性
ls docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/phase-*.md | wc -l   # → 13
ls docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/ | wc -l     # → 13

# secrets スキャン
grep -rE "(sk-|api_key|API_KEY|CLOUDFLARE_API_TOKEN)" \
  docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/ || echo "OK: no secrets"
```

## 禁止事項

- `git push --force` to main / master
- `--no-verify` で hook をスキップ
- ユーザー承認なしの auto commit / auto push / auto PR
- Issue #142 の reopen（CLOSED 維持運用）
- `~/.claude/settings.json` / `~/.zshrc` / `<project>/.claude/settings*.json` の書き換えコミット混入

## 主成果物

- `outputs/phase-13/main.md`（PR 着手判定記録 / ユーザー承認待ち blocked 状態の記録）
- `outputs/phase-13/pr-template.md`（上記 PR テンプレート草案。Issue #142 参照と CLOSED 維持運用、`task-claude-code-permissions-apply-001` の参照欄追記依頼を含む）
- `outputs/phase-13/local-check-result.md`（ローカルチェック結果）
- `outputs/phase-13/change-summary.md`（変更要約）

## 完了条件

- [ ] ユーザーが PR 作成を明示承認した時点で実施
- [ ] それまでは blocked のまま維持
- [ ] PR description に Issue #142 のリンクと「CLOSED のまま運用」明記
- [ ] PR description に `task-claude-code-permissions-apply-001` 参照欄追記依頼を明記

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する

## 参照資料

- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`
- Phase 1〜12: `outputs/phase-1/` 〜 `outputs/phase-12/`
- Phase 1: `outputs/phase-1/`
- Phase 2: `outputs/phase-2/`
- Phase 5: `outputs/phase-5/`
- Phase 6: `outputs/phase-6/`
- Phase 7: `outputs/phase-7/`
- Phase 8: `outputs/phase-8/`
- Phase 9: `outputs/phase-9/`
- Phase 10: `outputs/phase-10/`
- Phase 11: `outputs/phase-11/`
- Phase 12: `outputs/phase-12/`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする
