# Phase 12 メイン仕様 — Issue #408 Cloudflare Audit Logs 監視

## 役割

Phase 12 の必須成果物を一覧化し、各ファイルが満たすべき完了条件と検証コマンドを正本化する。本ファイルは **タスク仕様書策定フェーズ** の終端に位置し、実装着手は本仕様書 PR の merge 後に別ブランチで開始する。

## 成果物一覧と完了条件

### 1. `implementation-guide.md`

- **完了条件**:
  - Part 1（中学生レベル）が約 300 字で「Audit Logs とは何か」「なぜ 1 時間ごとに見張るか」「異常とは何か」を平易に説明
  - Part 2（技術者向け）が Phase 5 で生成される全ファイル（workflow / scripts / migration）に対する file-by-file change を列挙
  - "本番初投入手順" セクションが Token 発行 → Secrets 登録 → 1Password 登録 → workflow enable → 7 日 baseline 学習 → alerting 有効化 の 6 ステップを含む
  - troubleshooting 表が "監視 Token 認証失敗" / "watchdog アラート" / "false positive 急増" の 3 ケースを最低含む
- **検証**: `wc -l outputs/phase-12/implementation-guide.md`（200 行以上目安） / 目視 review

### 2. `documentation-changelog.md`

- **完了条件**: 本タスクで作成 / 編集する全ドキュメント（仕様書本体 + SSOT 3 + source unassigned-task）が表として記載され、change type / 1 行要約を含む
- **検証**: `grep -c "^|" outputs/phase-12/documentation-changelog.md` で行数確認

### 3. `unassigned-task-detection.md`

- **完了条件**: follow-up 候補 4 件（FU-01〜FU-04）を **0 件でも必ず** 記録。各エントリは目的 / 優先度 / 着手判断基準の 3 要素を 1 行で記述
- **検証**: `grep -c "^### FU-" outputs/phase-12/unassigned-task-detection.md` ≥ 1

### 4. `skill-feedback-report.md`

- **完了条件**: テンプレ改善 / ワークフロー改善 / ドキュメント改善 の 3 セクションが各 1 件以上の提案、または "確認済み・改善点なし" を明記
- **検証**: `grep -E "^## (テンプレ|ワークフロー|ドキュメント)改善" outputs/phase-12/skill-feedback-report.md | wc -l` == 3

### 5. `system-spec-update-summary.md`

- **完了条件**:
  - Step 1-A: 影響を受ける aiworkflow-requirements references の行を列挙
  - Step 1-B: 更新差分要旨
  - Step 1-C: 検証コマンド（`grep` / `wc -l` / link integrity）
  - Step 2 (system / operations spec sync): "適用" と明示
- **検証**: `grep -E "^## Step" outputs/phase-12/system-spec-update-summary.md | wc -l` ≥ 4

### 6. `phase12-task-spec-compliance-check.md`

- **完了条件**: 6 項目（13 phase / artifacts.json / index.md / CONST_005 / source link / SSOT 同期計画）について PASS / FAIL / N/A + 根拠 1 行 を記録
- **検証**: `grep -cE "PASS|FAIL|N/A" outputs/phase-12/phase12-task-spec-compliance-check.md` ≥ 6

### 7. `phase-12.md`（エントリ）

- **完了条件**: 7 必須成果物への index と DoD checklist
- **検証**: 本ディレクトリ ls 一致

## 全体検証

```bash
# Phase 12 strict 7 ファイル + workflow-local phase-12.md が実在すること
ls docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-12/ | sort
# 期待: documentation-changelog.md / implementation-guide.md / main.md / phase-12.md
#       / phase12-task-spec-compliance-check.md / skill-feedback-report.md
#       / system-spec-update-summary.md / unassigned-task-detection.md
```

## 統合テスト連携

NON_VISUAL implementation。runtime evidence は Phase 11 の fresh GET / Issue 起票観測 / D1 query log に集約する。Phase 12 はドキュメントの完全性のみを閉じる。

## 参照

- `phase-12.md`（本ディレクトリのエントリ）
- `../../index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
