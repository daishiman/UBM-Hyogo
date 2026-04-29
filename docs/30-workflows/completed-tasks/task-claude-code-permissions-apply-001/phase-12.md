# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 11（手動テスト） |
| 下流 | Phase 13（PR 作成・user 承認後のみ） |
| 状態 | blocked（Phase 11 完了または docs-ready-execution-blocked 分岐確定まで着手禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| 元タスク | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |

## 目的

Phase 11 までの実機反映と smoke 結果を、Phase 12 canonical 7 成果物としてまとめ、
システム仕様書（`docs/00-getting-started-manual/claude-code-config.md`）と元タスク成果物への
反映を確定する。元タスクが残した「U1 反映完了」を `skill-feedback-report.md` に追記する責務も含む。

## 入力

| 種別 | パス |
| --- | --- |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` |
| Phase 11 manual-smoke-log | `outputs/phase-11/manual-smoke-log.md` |
| Phase 11 main | `outputs/phase-11/main.md` |
| 元タスク Phase 12 implementation-guide | `completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` |
| 元タスク skill-feedback-report | `completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/skill-feedback-report.md` |
| 元タスク台帳 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` |
| compliance template | `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md` |

## 事前作業（必須・最初に実施）

[Feedback 2] 反映:

1. `artifacts.json` の `phases[11].outputs` と `outputs/artifacts.json`（存在すれば）の artifact 名を **逐字突合**
2. ファイル名のずれが 1 件でもあれば本 Phase の他作業を **block** し、突合表を `documentation-changelog.md` の最初のブロックに記録
3. 突合 OK 後に Task 1 へ進む

[UBM-012] 規約再掲（本タスクは Cloudflare 触らないが破らない）:
- `wrangler` 直接実行禁止 / `bash scripts/cf.sh` ラッパー強制
- deploy 系コマンドが本 Phase の検証手順に出てきた場合は scripts/cf.sh 経由のみ許可

## 必須 7 成果物

| Task | 成果物 | 必須 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術詳細） | ✅ |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力） | ✅ |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力） | ✅ |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |
| 12-7 | `outputs/phase-12/final-30-method-elegant-verification.md` | ✅ |

## Task 12-1: 実装ガイド（2 パート構成）

### Part 1（中学生レベル・鍵の例え話の続き）

> 元タスクで「家族なら鍵を毎回確認しない設定」を**設計図**にしました。本タスクではその設計図どおりに
> **実際に鍵屋さんを呼んで取り付ける**作業をしました。取り付け後、家のすべての扉
> （3 つの設定ファイル）と玄関の合言葉（`cc` の起動コマンド）が同じルールで動くか、
> 1 つずつドアを開け閉めして確かめました（Phase 11 の TC-01〜TC-R-01）。

書き分けの正本ルール:
- 元タスクの implementation-guide.md = **設計時の guide（before）**
- 本タスクの implementation-guide.md = **実反映後の guide（after）**：実機の値・backup ファイル名（`*.bak.<TS>`）・smoke 結果サマリを反映

### Part 2（技術詳細）

含めるべき内容:
- E-1 / E-2 / E-3 の **実反映結果**（Phase 5 runbook-execution-log の要約）
- 階層優先順位の再掲:
  ```
  project/.claude/settings.local.json > project/.claude/settings.json
    > ~/.claude/settings.local.json > ~/.claude/settings.json
  ```
- backup ファイル一覧（`*.bak.<TS>` 4 件）と rollback 手順への参照
- TC-01〜TC-R-01 の判定サマリ表
- NON_VISUAL の根拠（証跡 = `manual-smoke-log.md`、screenshot 不要）
- 元タスク guide との差分セクション（before → after）

## Task 12-2: システム仕様更新

### Step 1-A: 完了タスク記録

- `docs/30-workflows/task-claude-code-permissions-apply-001/` を `docs/30-workflows/completed-tasks/` 配下へ移動する手順を記録（実移動はクローズ時）
- LOGS.md × 2 ファイル更新（aiworkflow-requirements / task-specification-creator）
- topic-map.md にエントリ追加

### Step 1-B: 実装状況テーブル

- 本タスクのステータス: **`completed`**（実機反映済 + smoke PASS の場合）
- TC-05 が `BLOCKED` の場合: `docs-ready-execution-blocked` 状態として記録

### Step 1-C: 関連タスクテーブル

- `task-claude-code-permissions-deny-bypass-verification-001`: 本タスク前提として参照したステータス（completed / unassigned）を反映
- `task-claude-code-permissions-project-local-first-comparison-001`: 同上
- 元タスク `task-claude-code-permissions-decisive-mode`: 本タスクの設計入力として参照記録

### Step 1-D: runbook-diff-plan の判定

- 本タスクで実反映した手順と元タスク `outputs/phase-5/runbook.md` の差分を抽出
- 差分が 0 件の場合: 「runbook 改訂不要」と明記
- 差分があれば、改訂計画（diff plan）を `system-spec-update-summary.md` に記録

### Step 2: システム仕様更新（条件付き）

- 対象: `docs/00-getting-started-manual/claude-code-config.md`
- 新規 interface 追加: **なし** → Step 2 は **N/A** 明記
- 再判定ルール: 「将来 settings の新規キー追加・新 alias 増設・hook 仕様変更が発生した場合は Step 2 を再開する」と明記
- 運用ルール反映（階層優先順位・whitelist 例）は元タスクで既に追記済みのため、本タスクは重複追記禁止（diff 確認のみ）

## Task 12-3: documentation-changelog

ブロック構成（[Feedback BEFORE-QUIT-003]）:

1. **事前突合ブロック**: artifacts.json と outputs/artifacts.json の突合結果
2. **Step 1-A ブロック**: 完了タスク記録の差分
3. **Step 1-B ブロック**: 実装状況テーブル diff
4. **Step 1-C ブロック**: 関連タスクテーブル diff
5. **Step 1-D ブロック**: runbook-diff-plan
6. **Step 2 ブロック**: N/A 理由の明記
7. **workflow-local sync ブロック**: 本タスクディレクトリ内同期
8. **global skill sync ブロック**: `~/.claude/skills/` への波及（独立ブロック・**必須**）

各ブロックに「該当なし」も含めて明記する（空欄禁止）。

## Task 12-4: unassigned-task-detection（0 件でも出力必須）

検出元を表で網羅:

| 検出元 | 候補 | 状態 |
| --- | --- | --- |
| 元タスク Phase 12 unassigned-task-detection | pre-commit hook で alias 整合 check | 反映状態を記録 |
| 元タスク Phase 12 unassigned-task-detection | MCP server permission の挙動検証 | 反映状態を記録 |
| Phase 10 MINOR | `Edit` / `Write` の whitelist 化 | 別タスク化判定 |
| 本タスク中のコードコメント TODO | grep -rn "TODO" outputs/ | 件数を記録（0 件でも記録） |
| Phase 11 TC-05 BLOCKED 由来 | bypass + deny 実効性追検証 | 状態反映 |

検出 0 件の場合も「0 件であることを確認した検出元一覧」を出力（空ファイル禁止）。

## Task 12-5: skill-feedback-report（改善点なしでも出力必須）

必須セクション:

1. **元タスク skill-feedback-report への追記**: 「U1 反映完了」を 1 行追記する手順と差分を記録（AC-9 担保）
2. **テンプレート改善観点**: NON_VISUAL + host 環境書き換えタスクの定型化候補
3. **ワークフロー改善観点**: backup → 反映 → smoke の標準化候補
4. **ドキュメント改善観点**: `claude-code-config.md` への追記方針
5. **改善点なし**の場合も「観点 1〜4 を確認した結果なし」と明記（空ファイル禁止）

## Task 12-6: phase12-task-spec-compliance-check

ベース: `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`

確認項目:
- artifacts.json `phases[11].outputs` と `outputs/phase-12/` 内ファイル名の 1:1 一致
- index.md Phase 12 行と artifacts.json の同期
- identifier consistency（実装値と設計書のキー名一致：`bypassPermissions`, `defaultMode`, `cc` alias 文字列）
- secrets 混入 0 件の grep 再走査
- NON_VISUAL: `screenshots/` 非存在の物理確認

## よくある漏れチェック（本タスク特有）

- [ ] [Feedback 2] 事前突合（artifacts.json ↔ outputs/artifacts.json）を Phase 12 最初に実施
- [ ] [Feedback 5] index.md / artifacts.json / outputs/artifacts.json の同一 wave 更新
- [ ] [FB-04] ledger 同期 5 ファイル
- [ ] [Feedback BEFORE-QUIT-003] workflow-local sync と global skill sync を別ブロック
- [ ] [UBM-010] placeholder PNG を evidence に使っていない
- [ ] [UBM-012] wrangler 直接実行記述ゼロ・必要時は scripts/cf.sh 経由のみ
- [ ] 元タスク `skill-feedback-report.md` への「U1 反映完了」追記（AC-9）
- [ ] NON_VISUAL: `screenshots/.gitkeep` を作らない・`screenshots/` も作らない
- [ ] LOGS.md × 2 / topic-map.md 反映

## 成果物

artifacts.json の Phase 12 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | Part 1（中学生・鍵の例え話の続き）+ Part 2（技術詳細・実反映後 guide） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1-A〜1-D + Step 2（N/A 明記 + 再判定ルール） |
| `outputs/phase-12/documentation-changelog.md` | 8 ブロック（事前突合 + Step 1-A〜D + Step 2 + workflow-local + global skill） |
| `outputs/phase-12/unassigned-task-detection.md` | 検出元表 + 0 件でも出力 |
| `outputs/phase-12/skill-feedback-report.md` | 元タスク追記 + 4 観点 + なしでも出力 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | template ベースの三者同期チェック結果 |

## 完了条件

- [ ] 7 成果物が揃う（artifacts.json `phases[11].outputs` と完全一致）
- [ ] 事前突合（artifacts.json ↔ outputs/artifacts.json）が PASS
- [ ] 元タスク `skill-feedback-report.md` に「U1 反映完了」が追記済み（AC-9）
- [ ] LOGS.md × 2 / topic-map.md / ledger 5 ファイルが同期
- [ ] `screenshots/` ディレクトリが存在しない（NON_VISUAL 物理担保）
- [ ] secrets 混入 0 件
- [ ] artifacts.json `phase12_completed` 同期

## 検証コマンド

```bash
BASE=docs/30-workflows/task-claude-code-permissions-apply-001

# 7 成果物の存在確認
ls $BASE/outputs/phase-12/ | sort
# implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md
# unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md / final-30-method-elegant-verification.md

# artifacts.json と 1:1 一致確認
node -e "
const j = JSON.parse(require('fs').readFileSync('$BASE/artifacts.json','utf8'));
console.log(j.phases[11].outputs.map(p => p.replace('outputs/phase-12/','')).sort().join('\n'));
"

# NON_VISUAL 物理担保
test ! -e $BASE/outputs/phase-11/screenshots && echo "NON_VISUAL OK"

# 元タスク skill-feedback-report への追記確認（AC-9）
grep -c "U1 反映完了" docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/skill-feedback-report.md
```

## 依存 Phase

- 上流: Phase 11（manual-smoke-log.md / main.md）
- 下流: Phase 13（user 承認後のみ着手可）

## 想定 SubAgent / 並列性

- Task 12-1 / 12-4 / 12-5 は読み取り中心 → 並列化可
- Task 12-2 / 12-3 / 12-6 は逐次（Step 1-A → 1-B → 1-C → 1-D → Step 2 の順序依存あり）
- 事前突合は単一 agent で最初に実施（block ゲート）

## ゲート判定基準

- 完了条件すべて PASS で Phase 13 待機状態へ遷移
- 事前突合 FAIL → Task 1〜6 着手禁止、突合修正を最優先
- 元タスク追記漏れ（AC-9 NG） → Phase 12 未完了

## リスクと対策

| リスク | 対策 |
| --- | --- |
| artifacts.json と outputs/artifacts.json のずれ放置 | 事前突合を Task 12-1 より前にゲート化 |
| 元タスク skill-feedback-report への U1 追記漏れ | 検証コマンドで grep 1 件以上を担保 |
| `screenshots/.gitkeep` を慣性で作成 | 検証コマンドで `screenshots/` 非存在確認 |
| LOGS.md / topic-map.md の片側だけ更新 | ledger 同期 5 ファイルチェックリスト固定 |
| Step 2 N/A の取り扱いミス | 再判定ルールを明記し、将来の interface 追加時に再開できる経路を残す |
| Cloudflare 系コマンドの直接記述混入 | `wrangler` grep 0 件・必要時は scripts/cf.sh 経由のみ |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
