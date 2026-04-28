# Phase 13: PR 作成（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003-codeowners-governance-paths) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |
| GitHub Issue | #146 |
| user_approval_required | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は PR テンプレ・local check 手順・change-summary を「予約」する目的で作成され、`git commit` / `git push` / `gh pr create` は user の明示指示があるまで一切実行しない。
> **本ワークフローは Phase 12 までの成果物と `.github/CODEOWNERS` / docs 整理差分を含む。** Phase 13 はユーザー明示承認後に PR を作成する。

## 目的

Phase 11 / 12 の成果物（phase-{11,12,13}.md + outputs/phase-{11,12,13}/）を 1 PR にまとめ、user の明示承認後に GitHub Issue #146 へリンクして提出する。本 PR は docs-only に近い性質（実 CODEOWNERS / `doc/` 置換は含まない / markdown のみ追加）。

## 承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 11 必須 3 outputs | main.md / manual-smoke-log.md / link-checklist.md | 要確認 |
| Phase 12 必須 5 outputs | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report | 要確認 |
| Phase 12 main.md（統合サマリー） | 存在 | 要確認 |
| 1Password URI 混入チェック | 0 件 | 要確認 |
| 計画系 wording 残存チェック | 0 件 | 要確認 |
| Secret 混入チェック | 0 件 | 要確認 |
| user の明示承認 | user から「PR を作成してよい」の明示指示 | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない。**

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check（docs validator のみ）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. **user 明示承認後**、ブランチ確認 → 必要なファイルを明示 add → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## local-check（docs-only スコープ）

```bash
# 必須 outputs ファイル存在確認
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/  # 3 files
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/  # 6 files (main + 5 outputs)
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-13/  # 1 file (本 main.md)

# screenshots/ が無いこと
test ! -d docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/screenshots && echo "OK: NON_VISUAL 整合"

# 計画系 wording 混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/ \
  || echo "計画系 wording なし"

# 1Password URI / secret 混入チェック
rg -n "op://" docs/30-workflows/ut-gov-003-codeowners-governance-paths/ \
  || echo "1Password URI 混入なし"
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=" docs/30-workflows/ut-gov-003-codeowners-governance-paths/ \
  || echo "Secret 混入なし"

# Part 1 / Part 2 構造確認
rg -n "^## Part [12]" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/implementation-guide.md

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-gov-003-codeowners-governance-paths
```

## 実行手順

1. 承認ゲートと local-check を user に提示する。
2. user の明示承認を得た場合のみ、ブランチ確認、明示 add、commit、push、PR 作成へ進む。
3. user 承認が無い場合は本 Phase を NOT EXECUTED のまま保持する。

## 統合テスト連携

PR 作成前の docs validator を最終 gate とする。typecheck / lint / app test は本 PR スコープ外（Phase 13 PR smoke でも本ファイル修正のみのため不要）。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR 作成手順 | outputs/phase-13/main.md | 承認ゲート、PR body、コマンド、ブロック条件 |

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| **title** | `docs(workflow): add UT-GOV-003 codeowners governance task spec (#146)` |
| base | `dev` |
| head | 現行 worktree branch（`feat/ut-gov-003-codeowners-governance-paths` 等） |
| labels | `area:docs` / `task:ut-gov-003` / `governance` |
| linked issue | #146 (`Refs #146`: 本 PR は仕様書化のみのため Issue close はPhase 13 PR smoke で行う) |

### PR body テンプレ

```markdown
## Summary
GitHub Issue #146「[UT-GOV-003] CODEOWNERS governance path 整備」のタスク仕様書を Phase 11 / 12 / 13 として `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` 配下に整備する PR。

- 実 `.github/CODEOWNERS` 適用 / `doc/` `docs/` 整理は本差分に含む。
- 本 PR の差分は markdown のみ。apps/ / packages/ / wrangler 設定 / Cloudflare Secret への影響なし。

## 変更内容
- 新規: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-{11,12,13}.md`
- 新規: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/{main,manual-smoke-log,link-checklist}.md`
- 新規: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md`
- 新規: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-13/main.md`

## Test plan
- [ ] Phase 11 NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の 4 階層が `outputs/phase-11/main.md` に記載
- [ ] 5 governance path × suggested reviewer 観察手順と `gh api .../codeowners/errors` 実行結果が `outputs/phase-11/manual-smoke-log.md` に記載
- [ ] Phase 12 必須 5 outputs（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）が揃っている
- [ ] implementation-guide が Part 1（中学生レベル 4 概念）+ Part 2（運用 + 移行手順）構成
- [ ] 1Password URI / 計画系 wording / Secret 混入が 0 件
- [ ] docs validator PASS

## Issue reference
- Refs #146（Closes にするかはユーザー承認時に判断）
- 関連: UT-GOV-001 / UT-GOV-002 / UT-GOV-004 / UT-GOV-005

## 注意事項
- 本 PR は仕様書整備のみ。実 `.github/CODEOWNERS` 編集は別 PR で行う。
- solo 運用方針のため `require_code_owner_reviews=true` は本 PR でも後続 PR でも有効化しない。
- `doc/` `docs/` 表記揺れの実置換は別タスク（C-4 として unassigned-task-detection.md 記載）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## PR 作成コマンド（user 承認後のみ実行）

```bash
# 現在ブランチ確認
git status
git branch --show-current

# 必要なファイルを明示 add（git add . / -A は禁止）
git add docs/30-workflows/ut-gov-003-codeowners-governance-paths/

# コミット
git commit -m "$(cat <<'EOF'
docs(workflow): add UT-GOV-003 codeowners governance task spec (#146)

- Phase 11 / 12 / 13 仕様書を新規作成
- NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）を CODEOWNERS 適用版で固定
- Phase 12 必須 5 outputs（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）
- 実 .github/CODEOWNERS 適用 / doc/docs 整理は本差分に含む

Refs #146

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# push
git push -u origin <current-branch>

# PR 作成
gh pr create \
  --title "docs(workflow): add UT-GOV-003 codeowners governance task spec (#146)" \
  --base dev \
  --body "$(cat <<'EOF'
（上記 PR body テンプレを貼付）
EOF
)"
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/main.md | Phase 12 統合記録 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/main.md | NON_VISUAL 代替 evidence サマリー |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック |
| 必須 | CLAUDE.md | ブランチ戦略（feature → dev → main / solo 開発レビュア 0） |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-13.md | PR Phase 構造リファレンス |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check（docs validator）が PASS
- [ ] 1Password URI / 計画系 wording / Secret 混入が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #146 にリンク（`Refs #146`）
- [ ] CI（`gh pr checks`）が green

## 苦戦防止メモ

1. **Issue #146 の close 判定はユーザー承認時に確認**: 本差分は CODEOWNERS 実適用を含むが、suggested reviewer 観察は未実行のため `Refs` / `Closes` は PR 作成時に選ぶ。
2. **`git add .` / `git add -A` 禁止**: 他ワークツリーや無関係ファイルが混入する事故を防ぐため、必ずパス明示で add する。本 PR では `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` 配下のみ add。
3. **base = `dev`**: feature → dev → main のブランチ戦略を厳守。直接 main へは PR しない。
4. **user 承認なしでの commit / push / PR 作成は禁止**: 承認ゲート PASS が確認できるまで、ローカル変更は staging されない状態で待機する。
5. **本 PR は `.github/CODEOWNERS` を含む**: ownership 文書化として current applied に反映済み。`require_code_owner_reviews=true` は有効化しない。

## 次 Phase

- 次: なし（タスク完了）
- マージ後フォロー:
  - GitHub UI の suggested reviewer 観察を本仕様書へ追記
  - GitHub Issue #146 へ「spec 完了 / 実 CODEOWNERS 適用は本差分に含む」コメント追加
  - C-1（`codeowners-validator` action 導入）の unassigned-task ファイル化を検討
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check（docs validator）が FAIL（→ Phase 12 へ差し戻し）
  - 計画系 wording / 1Password URI / Secret 混入が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
