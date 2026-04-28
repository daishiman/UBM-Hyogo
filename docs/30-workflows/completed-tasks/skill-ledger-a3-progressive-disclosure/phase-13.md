# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（PR 作成手順 / approval gate） |
| user_approval_required | **true** |

## 目的

Phase 1〜12 の成果物（仕様書 / 分割済み SKILL.md / references / smoke 証跡 / docs sync）を **per-skill PR 計画** に従って分割提出し、ユーザーの明示的な承認を経てレビュー → マージへ進める。1 PR = 1 skill 分割 を厳守し、本体 revert を独立可能に保つ。承認ゲート前のいかなる commit / push / PR 作成も禁止する。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | 行数 / リンク / mirror diff / link-checklist 全採取済 | 要確認 |
| Phase 12 compliance check | 全項目 PASS（FAIL / BLOCKED が無い） | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が per-skill PR 計画と変更内容を把握 | **user 承認待ち** |
| 機密情報の非混入 | docs-only のため対象外（grep 0 件で確認） | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## per-skill PR 計画【必須】

| # | PR | 対象 skill | 内容 | 優先度 |
| --- | --- | --- | --- | --- |
| 1 | **PR-1** | `task-specification-creator` | SKILL.md 200 行未満化 + references/<topic>.md 群追加 + mirror 同期 | **最優先（ドッグフーディング解消）** |
| 2 | PR-2 | 残対象 skill #1（Phase 1 棚卸しで確定） | 同上（1 PR = 1 skill） | 中 |
| 3 | PR-3 | 残対象 skill #2 | 同上 | 中 |
| n | PR-n | 残対象 skill #(n-1) | 同上 | 中 |
| N | **PR-N** | 全 skill 横断 | skill 改修ガイドへの「fragment で書け」「200 行を超えたら分割」**Anchor 追記のみ**（別 PR で本体 revert を独立可能に保つ） | 低（最終） |

> 1 PR = 1 skill を厳守し、本体分割と Anchor 追記を必ず別 PR に分離する（implementation-guide.md §ロールバック戦略）。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint）を実行・記録する（Markdown のみのためスキップ可だが実行ログを残す）。
3. change-summary（per-PR の変更ファイル一覧）を作成する。
4. PR テンプレ（`outputs/phase-13/pr-template.md`）を作成する。
5. user 承認後、PR-1（`task-specification-creator`）から順にブランチ作成 → commit → push → PR 作成を実行する。
6. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/documentation-changelog.md | per-PR の変更ファイル根拠 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-11/main.md | 動作確認サマリー |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | PR タイトル / 説明根拠 / AC-1〜AC-11 |
| 必須 | CLAUDE.md | ブランチ戦略 / レビュー人数（solo 開発のため required reviewers = 0） |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 manual evidence / Phase 12 compliance check が全 PASS であることを確認する。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認する。
3. per-skill PR 計画と change-summary を user に提示し、**明示的な承認**を待つ。
4. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック（本タスクは Markdown のみのため影響範囲は無いが実行記録を残す）
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# A-3 固有の検証（Phase 11 で実施済みの再確認）
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  [[ $lines -ge 200 ]] && echo "FAIL: $f = $lines" || echo "OK: $f = $lines"
done

# canonical / mirror diff 再確認
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  diff -r ".claude/skills/$name" ".agents/skills/$name" || true
done

# 機密情報チェック（docs-only のため対象外だが念のため）
git diff --cached | rg -E 'ya29\.|-----BEGIN PRIVATE|Bearer ' || echo "OK: no secrets"
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0（影響範囲外でもスキップ理由を明記） | outputs/phase-13/local-check-result.md |
| lint | exit 0 | 同上 |
| 行数検査 | 全 SKILL.md `OK` | 同上 |
| mirror diff | `diff -r` 差分 0 | 同上 |
| `git status` で意図せぬ変更がない | clean | 同上 |
| 機密情報 grep | 0 件 | 同上 |

> 本タスクは Markdown のみのため `pnpm typecheck` / `pnpm lint` の影響範囲は事実上無いが、CI gate との整合のため**実行記録は必ず残す**（CLAUDE.md branch protection 整合）。

### ステップ 3: change-summary（per-PR の変更ファイル一覧）

`outputs/phase-13/change-summary.md` に以下構造で記述する。

```markdown
## PR-1: task-specification-creator
- 変更（移動）: .claude/skills/task-specification-creator/SKILL.md（200 行未満化）
- 新規: .claude/skills/task-specification-creator/references/<topic>.md（複数）
- 同期: .agents/skills/task-specification-creator/ （canonical → mirror）
- docs: docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-*

## PR-2: <次の対象 skill>
- 変更（移動）: .claude/skills/<skill>/SKILL.md
- 新規: .claude/skills/<skill>/references/<topic>.md
- 同期: .agents/skills/<skill>/

## PR-N: skill 改修ガイドへの Anchor 追記
- 変更: .claude/skills/task-specification-creator/SKILL.md（Anchors セクションのみ）
- 変更: .claude/skills/task-specification-creator/references/<改修ガイド対応 topic>.md
```

### ステップ 4: PR テンプレ作成

`outputs/phase-13/pr-template.md` に以下構造を記述する（PR-1 / PR-2 / PR-N で再利用）。

```markdown
## Summary
<skill-name>/SKILL.md を 200 行未満の entrypoint に縮約し、詳細を references/<topic>.md 群へ Progressive Disclosure 方式で分割する。Issue #131 (skill-ledger A-3)。

## Changes
- .claude/skills/<skill>/SKILL.md（200 行未満化、front matter / trigger / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow を残置）
- .claude/skills/<skill>/references/<topic>.md（複数の単一責務 topic に分割）
- .agents/skills/<skill>/（canonical → mirror 同期、`diff -r` = 0）
- docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-*

## Test plan
- [x] 行数検査: `for f in .claude/skills/*/SKILL.md; do ...` → 全件 `OK`
- [x] リンク健全性: `rg -n 'references/' .claude/skills/<skill>/SKILL.md` → 切れ 0
- [x] 未参照 reference 検出: 0 件
- [x] canonical / mirror 差分: `diff -r .claude/skills/<skill> .agents/skills/<skill>` → 差分 0
- [x] `pnpm typecheck` / `pnpm lint`: exit 0（Markdown のみのため影響範囲外、実行記録のみ）

## Rollback
本 PR は機械的 cut & paste のみで意味的書き換えを含まない。`git revert <merge-commit>` で 1 PR 単位に戻る。skill 改修ガイドへの Anchor 追記は別 PR（PR-N）で分離されているため、本体 revert と独立。

## Closes
Closes #131
```

### ステップ 5: PR 作成（user 承認後のみ・PR-1 から順次）

```bash
# 現在のブランチが feat/skill-ledger-a3-<skill-name> であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . は使わない）
git add .claude/skills/task-specification-creator/ \
        .agents/skills/task-specification-creator/ \
        docs/30-workflows/skill-ledger-a3-progressive-disclosure/

# コミット
git commit -m "$(cat <<'EOF'
refactor(skill-ledger): split task-specification-creator/SKILL.md into references (A-3)

- SKILL.md を 200 行未満 entrypoint に縮約
- 詳細を references/<topic>.md 群へ Progressive Disclosure 分割
- canonical (.claude/skills/) / mirror (.agents/skills/) 同期完了
- 機械的 cut & paste のみ（意味的書き換えなし）

Closes #131
EOF
)"

# push
git push -u origin feat/skill-ledger-a3-task-specification-creator

# PR 作成（PR-1 = task-specification-creator）
gh pr create \
  --title "refactor(skill-ledger): split task-specification-creator/SKILL.md into references (A-3)" \
  --base dev \
  --head feat/skill-ledger-a3-task-specification-creator \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

> PR-2 以降も同じテンプレで順次作成する。PR-N（Anchor 追記）は本体 PR の merge 後に別ブランチで作成し、本体 revert を独立可能に保つ。

## PR テンプレ規約

| 項目 | 値 |
| --- | --- |
| title | `refactor(skill-ledger): split <skill-name>/SKILL.md into references (A-3)` |
| body | Summary / Changes / Test plan / Rollback / Closes #131（pr-template.md に従う） |
| reviewer | solo 開発のため required reviewers = 0（CLAUDE.md branch protection） |
| base | `dev`（推奨） → 後段で `main` へ昇格 |
| head | `feat/skill-ledger-a3-<skill-name>` |
| labels | `area:skill` / `task:A-3` / `wave:skill-ledger` |
| linked issue | #131 |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`dev` から `main` への昇格 PR を別途作成する。
- 全 PR マージ完了後、artifacts.json の全 Phase を `completed` に更新する。

## 多角的チェック観点

- 価値性: PR-1 が `task-specification-creator` を最優先で 200 行未満化し、ドッグフーディング矛盾を解消できるか。
- 実現性: per-skill PR 計画通りに 1 PR = 1 skill が成立しているか。
- 整合性: change-summary が Phase 12 documentation-changelog と 1:1 一致しているか。
- 運用性: 各 PR が独立 revert 可能か（Anchor 追記 PR が分離されているか）。
- 認可境界: docs-only のため Secret は無い。grep で 0 件確認。
- 後方互換性: skill loader が分割後 SKILL.md を entrypoint として正しく解決するか（Phase 11 smoke で確認済み）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/行数/mirror diff） | 13 | spec_created | 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | change-summary 作成（per-PR） | 13 | spec_created | user 提示用 |
| 5 | pr-template 作成 | 13 | spec_created | PR-1〜PR-N で再利用 |
| 6 | PR-1（task-specification-creator）作成手順 | 13 | spec_created | 最優先。user 承認後のみ実行 |
| 7 | PR-2 以降（残 skill 各単独 PR）作成手順 | 13 | spec_created | 1 PR = 1 skill。user 承認後のみ実行 |
| 8 | PR-N（Anchor 追記）作成手順 | 13 | spec_created | 本体 PR merge 後・別ブランチ。user 承認後のみ実行 |
| 9 | CI 確認手順 | 13 | spec_created | gh pr checks の記録手順 |
| 10 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | 承認ログ + per-PR 実行サマリー |
| ログ | outputs/phase-13/local-check-result.md | typecheck / lint / 行数 / mirror diff の実行記録 |
| サマリー | outputs/phase-13/change-summary.md | per-PR の変更ファイル一覧 |
| テンプレ | outputs/phase-13/pr-template.md | PR-1〜PR-N で再利用する PR body テンプレ |
| PR | user 承認後に作成 | A-3 per-skill PR 群（Issue #131 close） |
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / 行数 / mirror diff 全 PASS
- [ ] 機密情報 grep が 0 件
- [ ] change-summary が per-PR 計画と 1:1 対応している
- [ ] pr-template が Summary / Changes / Test plan / Rollback / Closes #131 を含む
- [ ] PR-1（`task-specification-creator`）が最優先・単独 PR として作成可能な手順になっており、user 承認後にのみ Issue #131 へ紐付ける
- [ ] PR-2 以降が 1 PR = 1 skill で作成可能な手順になっており、user 承認後にのみ実行する
- [ ] PR-N（Anchor 追記）が本体 PR と別ブランチで分離される手順になっている
- [ ] CI（`gh pr checks`）確認手順が記録され、PR 作成後に green を確認する条件が明記されている
- [ ] 全 PR マージ後に artifacts.json の全 Phase を `completed` へ更新する手順が明記されている

## タスク 100% 実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている
- approval 取得前に commit / push / PR 作成しない方針が明文化されている
- per-skill PR 計画（PR-1〜PR-N）が 1 PR = 1 skill で構造化されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true`、`status = spec_created`

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - 全 PR マージ後、B-1（gitattributes）wave へ着手可能（実装順序: A-2 → A-1 → **A-3** → B-1）
  - skill-creator テンプレへの 200 行制約組込み（Phase 12 unassigned-task-detection で起票）を後続 wave で実施
  - skill loader doctor スクリプトの提供を後続 wave で起票
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 へ差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止）
  - 1 PR = 1 skill 原則の違反（→ PR を分割し直す）
  - 本体分割 PR と Anchor 追記 PR が同一 PR にまとめられている（→ 分離し直す）
