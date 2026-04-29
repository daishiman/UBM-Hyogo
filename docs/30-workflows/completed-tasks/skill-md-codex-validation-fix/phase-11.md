# Phase 11: 手動テスト（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 名称 | 手動テスト（NON_VISUAL） |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

UI 変更を伴わない CLI / YAML / Markdown 改修について、スクリーンショットではなくログとリンク確認で受入条件を検証する。

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（CLI / YAML / Markdown 改修のみ。UI 変更ゼロ） |
| 非視覚的理由 | Codex / Claude Code の起動時警告は terminal 出力。スクリーンショットでは状態を表現できない。証跡は標準出力ログで保持 |
| 代替証跡 | (1) Codex 起動ログの警告 0 件確認、(2) Claude Code セッション開始時の skill 一覧に warning ヘッダーが出ない確認、(3) skill-creator unit test 全件 Green ログ |

## 実行タスク

- `outputs/phase-11/main.md` に手動確認結果の総括を記録する。
- `outputs/phase-11/manual-smoke-log.md` に Codex / Claude Code / skill-creator の smoke ログを記録する。
- `outputs/phase-11/link-checklist.md` に成果物・参照リンクの存在確認を記録する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 design | `outputs/phase-2/design.md` | smoke 対象 |
| Phase 5 diff | `outputs/phase-5/diff-summary.md` | smoke 対象 |
| Phase 6 tests | `outputs/phase-6/extended-tests.md` | 回帰確認 |
| Phase 7 coverage | `outputs/phase-7/coverage-report.md` | coverage 確認 |
| Phase 8 refactor | `outputs/phase-8/refactor-report.md` | refactor 確認 |
| NON_VISUAL evidence | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | 代替 evidence |
| Phase 9 | `phase-9.md` | QA 結果 |
| Phase 10 | `phase-10.md` | AC 判定 |

## 手動テスト手順

### TC-MAN-01: Codex 起動時警告ゼロ確認

```bash
codex --help 2>&1 | tee outputs/phase-11/codex-startup-log.txt
# 期待: "Skipped loading N skill(s)" の文字列が出ない
grep -c "Skipped loading" outputs/phase-11/codex-startup-log.txt
# 期待: 0
```

### TC-MAN-02: Claude Code セッション起動時の skill 一覧

新規 Claude Code セッションを別ターミナルで開始し、最初の system reminder の skill 一覧 / warning が出ないことを目視確認。`outputs/phase-11/claude-code-session-skill-list.md` に skill 一覧を貼付。

### TC-MAN-03: skill-creator 自動テスト全件

```bash
cd .claude/skills/skill-creator
npm run validate -- . 2>&1 | tee ../../../docs/30-workflows/skill-md-codex-validation-fix/outputs/phase-11/manual-smoke-log.md
# 期待: 全件 PASS
```

### TC-MAN-04: 全 SKILL.md を validate-skill-md.js に通す

```bash
node .claude/skills/skill-creator/scripts/validate_all.js .claude/skills/aiworkflow-requirements --verbose
node .claude/skills/skill-creator/scripts/validate_all.js .claude/skills/skill-creator --verbose
# 期待: 全件 PASS
```

### TC-MAN-05: 新規スキル生成 smoke

```bash
# テンプレートから新規スキルを生成し、ガード経路を実走
node .claude/skills/skill-creator/scripts/init_skill.js \
  --name test-codex-guard \
  --summary "test summary" \
  --anchors "A1,A2,A3,A4,A5,A6" \
  --dry-run 2>&1 | tee outputs/phase-11/init-skill-dry-run.txt
# 期待: Anchors 6 件目が references/anchors.md に退避される確認、または 5 件超過時の throw 確認
```

## 環境ブロッカー記録欄

source-level PASS と環境ブロッカーは別カテゴリで記録する（混在禁止）:

| 区分 | 内容 | 状態 |
| --- | --- | --- |
| source-level | TC-MAN-01〜05 | （実施結果） |
| 環境ブロッカー | esbuild mismatch / mise install 未済等 | （あれば記録） |

## 統合テスト連携

Phase 9 の自動 QA と同じコマンドを手動 smoke として再実行し、環境ブロッカーと source-level failure を分けて記録する。

## 受入条件（Phase 11 完了条件）

- [ ] TC-MAN-01〜05 すべて PASS
- [ ] `outputs/phase-11/main.md` に証跡サマリ
- [ ] `outputs/phase-11/manual-smoke-log.md` に実行ログ
- [ ] `outputs/phase-11/link-checklist.md` にリンク確認
- [ ] screenshot 系成果物と `screenshots/` ディレクトリを作成しない

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 完了条件

- [ ] NON_VISUAL 必須3成果物が揃っている
- [ ] screenshot 系成果物が artifacts.json に登録されていない
- [ ] 手動 smoke の未確認項目が Phase 12 の未タスク検出へ申し送りされている

## タスク100%実行確認【必須】

- [ ] Phase 11 の成果物と artifacts.json の登録が一致している
