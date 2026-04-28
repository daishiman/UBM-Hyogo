# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 12 |
| 下流 | - |
| 状態 | blocked |
| user_approval_required | true |

## 目的

タスク仕様書（`docs/30-workflows/task-claude-code-permissions-decisive-mode/`）の commit と PR 作成。**ユーザーの明示承認後のみ実施**する。

## 重要ルール

- commit / push / PR 作成は user の明示承認なしに実行しない
- 本タスクは `workflow: spec_created` のため、コード変更は含まない（Markdown と JSON のみ）
- ブランチ戦略: `feature/* → dev → main`（CLAUDE.md ルール準拠）

## 事前チェック

- [ ] Phase 12 の 6 成果物が揃っている
- [ ] artifacts.json の `phase12_completed` 同期済み
- [ ] `git status` で意図したファイルのみ stage 候補
- [ ] `.env` 実値 / API token の混入 0 件（`grep -rE "(sk-|api_key)" docs/30-workflows/task-claude-code-permissions-decisive-mode/`）

## PR テンプレート（草案）

```
## Summary
- Claude Code 起動時に Bypass Permissions Mode が消える問題の恒久対策タスク仕様書を追加
- E-1: settings 3 層の defaultMode 統一設計
- E-2: cc エイリアスへ --dangerously-skip-permissions 併用設計
- E-3: permissions whitelist 整理設計
- 設計のみ（spec_created）。実機の settings / .zshrc 書き換えは別タスク

## Test plan
- [ ] phase-01〜phase-13.md と outputs/phase-1〜phase-13/.gitkeep が揃う
- [ ] artifacts.json が JSON valid
- [ ] index.md の Phase 表が artifacts.json と一致
- [ ] secrets 漏洩 0 件
```

## ローカルチェック

```bash
# JSON validity
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/task-claude-code-permissions-decisive-mode/artifacts.json','utf8'))"

# 成果物の完全性
ls docs/30-workflows/task-claude-code-permissions-decisive-mode/phase-*.md | wc -l   # → 13
ls docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/ | wc -l     # → 13
```

## 禁止事項

- `git push --force` to main / master
- `--no-verify` で hook をスキップ
- ユーザー承認なしの auto commit

## 主成果物

- `outputs/phase-13/main.md`（PR 着手判定記録）
- `outputs/phase-13/pr-template.md`

## 完了条件

- [ ] ユーザーが PR 作成を明示承認した時点で実施
- [ ] それまでは blocked のまま維持

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する。
- Phase 2: `outputs/phase-2/` を参照する。
- Phase 5: `outputs/phase-5/` を参照する。
- Phase 6: `outputs/phase-6/` を参照する。
- Phase 7: `outputs/phase-7/` を参照する。
- Phase 8: `outputs/phase-8/` を参照する。
- Phase 9: `outputs/phase-9/` を参照する。
- Phase 10: `outputs/phase-10/` を参照する。
- Phase 11: `outputs/phase-11/` を参照する。
- Phase 12: `outputs/phase-12/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。
