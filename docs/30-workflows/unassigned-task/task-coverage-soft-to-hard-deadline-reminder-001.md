# Coverage soft → hard 切替期限リマインダ - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-coverage-soft-to-hard-deadline-reminder-001                      |
| タスク名     | coverage-gate soft → hard 切替期限の自動リマインダ                    |
| 分類         | CI/CD / 運用ガバナンス                                                |
| 対象機能     | `.github/workflows/` scheduled workflow + GitHub Issue reminder       |
| 優先度       | 高                                                                    |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施 (proposed)                                                     |
| 親タスク     | coverage-80-enforcement                                               |
| 発見元       | coverage-80-enforcement Phase 12 unassigned-task-detection (U-4)      |
| 発見日       | 2026-04-29                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`coverage-80-enforcement` は PR① (soft gate / `continue-on-error: true`) → PR② (テスト追加) → PR③ (hard gate) の 3 段階で適用される。PR① merge 後に PR③ が出されないと、`coverage-gate` job は warning 表示のまま定着し、目的（80% hard gate 化）が達成されない。

### 1.2 問題点・課題

- soft gate は警告のみで block しないため、放置しても merge が通る
- PR③ の所有者・期限が runbook に記載されても、人間のリマインドに依存すると忘却リスクが高い
- 既存の lefthook pre-push は coverage-guard を動かすが、CI hard gate 化を促すトリガーにはならない

### 1.3 放置した場合の影響

- coverage-gate job が永続的に soft のまま定着
- 80% 強制が形骸化し、新規 PR の品質劣化を block できない
- aiworkflow-requirements の正本値（80%）と実運用ゲートが乖離する

---

## 2. 何を達成するか（What）

### 2.1 目的

PR① merge 後に固定期限内で PR③ を出させるため、scheduled workflow + Issue reminder で切替期限を強制する。

### 2.2 最終ゴール（想定 AC）

1. PR① merge をトリガーに、期限 Issue（`coverage-gate hard 化期限: YYYY-MM-DD`）が自動作成される
2. `.github/workflows/coverage-deadline-reminder.yml`（scheduled workflow）が週次で期限 Issue の残日数を確認し、期限超過時に労務 Issue を escalate する
3. PR③ merge 時に reminder Issue が自動 close される
4. runbook（`docs/30-workflows/coverage-80-enforcement/outputs/phase-13/pr1-runbook.md`）に期限値（PR① merge 日 + N 週間）が固定で記載される

### 2.3 スコープ

#### 含むもの

- scheduled workflow YAML 設計
- 期限 Issue テンプレ（labels: `coverage-gate`, `priority:high`, `governance`）
- PR③ merge 検知での auto-close ロジック

#### 含まないもの

- coverage 計測ロジック自体の変更（coverage-80-enforcement で完結）
- branch protection 適用（UT-GOV-001 / UT-GOV-004 で実施）

### 2.4 成果物

- `.github/workflows/coverage-deadline-reminder.yml`
- runbook 期限明記差分
- Issue テンプレ（`.github/ISSUE_TEMPLATE/coverage-deadline.md`）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- coverage-80-enforcement PR① が merge 済み
- `coverage-gate` job 名が `.github/workflows/ci.yml` で固定済み

### 3.2 依存タスク

- 親: coverage-80-enforcement（PR① 完了）
- 関連: UT-GOV-001（branch protection apply）, UT-GOV-004（required_status_checks contexts 同期）

### 3.3 推奨アプローチ

PR① merge 直後に独立 PR で投入。期限値は runbook の合意値（推奨 4〜6 週間）を採用する。

---

## 4. 苦戦箇所【記入必須】

soft gate は CI で `continue-on-error: true` で warning 化されるため見逃しやすい。PR③ を出さずに放置されると、実質的に 80% 強制が機能しなくなる。人間のリマインドに頼らず GitHub の機構（scheduled workflow / Issue）で強制する以外、確実な手段がない。期限値の妥当性（短すぎると PR② テスト追加が間に合わない / 長すぎると形骸化）も runbook 合意で慎重に決める必要がある。

---

## 5. 影響範囲

- `.github/workflows/coverage-deadline-reminder.yml`（新規）
- `.github/ISSUE_TEMPLATE/coverage-deadline.md`（新規）
- `docs/30-workflows/coverage-80-enforcement/outputs/phase-13/pr1-runbook.md`（期限値追記）

---

## 6. 推奨タスクタイプ

implementation / NON_VISUAL（CI workflow + Issue 自動化）

---

## 7. 参照情報

- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-4
- 親 index: `docs/30-workflows/coverage-80-enforcement/index.md`（苦戦想定 #5）
- 上流正本: `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`

---

## 8. 備考

PR① merge から N 週間以内に PR③ を強制するため、期限 Issue は `governance` ラベルで監視する。reminder workflow 自体のテストは scheduled workflow を `workflow_dispatch` でも起動可能にして手動 smoke する。
