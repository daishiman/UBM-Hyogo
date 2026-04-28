# Phase 13: PR 作成（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| user_approval_required | **true** |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は PR テンプレ・local check 手順・change-summary を「予約」する目的で作成され、`git commit` / `git push` / `gh pr create` は user の明示指示があるまで一切実行しない。本ワークフロー成果物（仕様書・outputs）も Phase 13 完了時点では未コミット状態で待機する。

## 目的

Phase 1〜12 の成果物（Phase 1〜13 の仕様書 + outputs/phase-{01,02,03,11,12,13}/ + index.md + artifacts.json）を 1 PR にまとめ、user の明示承認後に GitHub Issue #129 へリンクして提出する。本タスクは docs-only のため、PR の差分は markdown / JSON のみで、apps/ / packages/ への影響は無い。

PR 草案は Phase 2 の設計、Phase 6 の fail path、Phase 7 の coverage map、Phase 8 の DRY 化方針、Phase 9 の品質保証、Phase 10 の GO/NO-GO、Phase 12 の更新履歴を入力にする。

## 承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 の状態 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜10 状態 | `pending`（本ワークフローは仕様書作成のみのため） | 確認済 |
| Phase 11 必須 3 outputs | main.md / manual-smoke-log.md / link-checklist.md が揃っている | 要確認 |
| Phase 12 必須 5 outputs | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report | 要確認 |
| `1Password secret URI` 混入チェック | 0 件 | 要確認 |
| 計画系 wording 残存チェック | 0 件 | 要確認 |
| user の明示承認 | user から「PR を作成してよい」の明示指示 | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない。**

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check（docs validator のみ。typecheck / lint / test は本タスク無関係のため対象外）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. **user 明示承認後**、ブランチ確認 → 必要なファイルを明示 add → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## local-check（docs-only スコープ）

```bash
# 必須 outputs ファイル存在確認
ls docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/  # 3 files
ls docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/  # 6 files
ls docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-13/  # 1 file (本 main.md)

# screenshots/ が無いこと
test ! -d docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/screenshots && echo "OK: NON_VISUAL 整合"

# 計画系 wording / 1Password secret URI 混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/skill-ledger-a1-gitignore/outputs/ \
  || echo "計画系 wording なし"
rg -n "1Password secret URI" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/implementation-guide.md \
  || echo "1Password secret URI 混入なし"

# 機密情報チェック（本タスクは Secret 導入なしのため 0 件期待）
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=" docs/30-workflows/skill-ledger-a1-gitignore/ \
  || echo "Secret 混入なし"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-a1-gitignore
```

## 実行手順

1. 承認ゲートと local-check を user に提示する。
2. user の明示承認を得た場合のみ、ブランチ確認、明示 add、commit、push、PR 作成へ進む。
3. user 承認が無い場合は本 Phase を NOT EXECUTED のまま保持する。

## 統合テスト連携

PR 作成前の docs validator を最終 gate とする。typecheck / lint / app test は docs-only スコープ外のため対象外。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR 作成手順 | outputs/phase-13/main.md | 承認ゲート、PR body、コマンド、ブロック条件 |

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| **title** | `docs(workflow): add skill-ledger A-1 gitignore Phase 1-13 task spec (Issue #129)` |
| base | `dev` |
| head | `feat/skill-ledger-a1-gitignore`（または現行 worktree branch） |
| labels | `area:docs` / `task:skill-ledger-a1` / `wave:0` / `governance` |
| linked issue | #129 (`Closes #129` ではなく `Refs #129`: 本タスクは仕様書化のみのため Issue clos は実装 PR で行う) |

### PR body テンプレ

```markdown
## 概要
GitHub Issue #129 の派生実装タスク「自動生成 skill ledger の gitignore 化（A-1）」を、Phase 1〜13 の実行可能なタスク仕様書として `docs/30-workflows/skill-ledger-a1-gitignore/` 配下に固定する docs-only PR。実 `.gitignore` 適用 / `git rm --cached` 実行 / hook 配置は Phase 5 以降の別 PR で行う。

## 動機
- task-conflict-prevention-skill-state-redesign Phase 5 で runbook 化された A-1 施策を実行可能な spec へ昇格する
- 4 worktree 並列開発における skill ledger 派生物 conflict 0 化の前提整備
- A-2（fragment）→ A-1（本タスク）→ A-3（progressive disclosure）→ B-1（gitattributes）→ T-6（hooks）の実装順序確立

## 変更内容（docs-only）
- 新規: `docs/30-workflows/skill-ledger-a1-gitignore/`
  - `index.md` / `artifacts.json`
  - `phase-01.md` 〜 `phase-13.md`（13 ファイル）
  - `outputs/phase-01/main.md` / `phase-02/main.md` / `phase-03/main.md`
  - `outputs/phase-11/{main.md, manual-smoke-log.md, link-checklist.md}`
  - `outputs/phase-12/{implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md}`
  - `outputs/phase-13/main.md`
- 同期: `docs/30-workflows/LOGS.md` / `.claude/skills/task-specification-creator/LOGS.md`
- 新規未タスク: `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md`
- 関連リンク: A-2 / A-3 / B-1 は既存仕様を参照し、T-6 は本 PR で未タスク化

## 動作確認
- Phase 11 NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）適用済（spec walkthrough）
- 4 worktree 並列再生成 smoke コマンド系列は仕様レベルで固定（NOT EXECUTED — Phase 5 以降で実走）
- docs validator PASS

## リスク・後方互換性
- **破壊的変更なし**（markdown / JSON のみ追加）
- apps/ / packages/ / migration / wrangler 設定 / Cloudflare Secret への影響なし
- 実 `.gitignore` 編集は本 PR では行わない（別 PR で実施）

## 関連
- Refs #129
- 上流: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md`
- 並列: A-2 (fragment) / A-3 (progressive disclosure) / B-1 (gitattributes) / T-6 (hooks)

## 注意事項
- A-1 の実適用（`.gitignore` 追記 / `git rm --cached` / hook 冪等化）は **A-2 完了が必須前提**。A-2 未完了下で A-1 を実走すると `LOGS.md` 履歴喪失事故が発生するため、Phase 1 / 2 / 3 の 3 箇所で重複明記している。
```

## PR 作成コマンド（user 承認後のみ実行）

```bash
# 現在ブランチ確認
git status
git branch --show-current

# 必要なファイルを明示 add（git add . / -A は禁止）
git add docs/30-workflows/skill-ledger-a1-gitignore/ \
        docs/30-workflows/LOGS.md \
        .claude/skills/task-specification-creator/LOGS.md \
        docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md

# コミット
git commit -m "$(cat <<'EOF'
docs(workflow): add skill-ledger A-1 gitignore Phase 1-13 task spec (Issue #129)

- skill-ledger-a1-gitignore ワークフロー新規作成（Phase 1〜13 仕様書 + outputs）
- 4 worktree 並列再生成 smoke のコマンド系列を仕様レベル固定
- A-2 完了必須前提を Phase 1 / 2 / 3 で 3 重明記
- 実 gitignore 適用は Phase 5 以降の別 PR（本 PR は docs-only）

Refs #129

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# push
git push -u origin <current-branch>

# PR 作成
gh pr create \
  --title "docs(workflow): add skill-ledger A-1 gitignore Phase 1-13 task spec (Issue #129)" \
  --base dev \
  --body "$(cat <<'EOF'
（上記 PR body テンプレを貼付）
EOF
)"
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/main.md | Phase 12 統合記録 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/main.md | NON_VISUAL 代替 evidence サマリー |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature → dev → main / solo 開発レビュア 0） |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-13.md | PR Phase 構造リファレンス |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check（docs validator）が PASS
- [ ] `1Password secret URI` / 計画系 wording / Secret 混入が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #129 にリンク（`Refs #129`）
- [ ] CI（`gh pr checks`）が green
- [ ] マージ後、artifacts.json の Phase 13 が `completed` に更新される（user マージ後）

## 苦戦防止メモ

1. **`Closes #129` ではなく `Refs #129`**: 本 PR は仕様書化のみであり、Issue #129 の本体（実 gitignore 適用）は Phase 5 以降の実装 PR で close される。Issue を誤 close しない。
2. **`git add .` / `git add -A` 禁止**: 他ワークツリーや無関係ファイルが混入する事故を防ぐため、必ずパス明示で add する。
3. **base = `dev`**: feature → dev → main のブランチ戦略を厳守。直接 main へは PR しない。
4. **user 承認なしでの commit / push / PR 作成は禁止**: 承認ゲート PASS が確認できるまで、ローカル変更は staging されない状態で待機する。
5. **本タスクは Secret 導入なし**: `1Password secret URI` / API token / OAuth は触らない。Cloudflare CLI ラッパー（`scripts/cf.sh`）も使わない。

## 次 Phase

- 次: なし（タスク完了）
- マージ後フォロー:
  - artifacts.json の Phase 13 を `completed` に更新
  - A-2 完了確認後、本仕様書を入力にして Phase 5 実装ランブック（実 `.gitignore` 適用 PR）を別タスクで起票
  - GitHub Issue #129 へ「spec 完了 / 実装は別 PR」コメント追加
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check（docs validator）が FAIL（→ Phase 12 へ差し戻し）
  - 計画系 wording / 1Password secret URI / Secret 混入が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
