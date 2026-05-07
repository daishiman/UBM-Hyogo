[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新

> 本 phase-12.md は 300 行を超える可能性があるが、`phase-template-phase12.md` §「phase-12.md の 300 行上限と設計タスクの例外条項」の「NON_VISUAL タスクで Phase 11 代替証跡と Phase 12 outputs を直列記述する必要がある」例外条項を適用する。Phase 11 NON_VISUAL 連動および 6 必須成果物 + Task 6 compliance の責務分離不可能性を理由とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 11 (手動テスト検証 / NON_VISUAL) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| Source Issue | #438 |
| TaskType | implementation |
| VisualEvidence | NON_VISUAL |
| workflow_state | 実装完了時 `completed` / 未実装段階 `spec_created` |

---

## 目的

aiworkflow-requirements skill から D1 migration runbook（UT-07B-FU-03 産物）/ `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` を逆引きできるように、
`indexes/resource-map.md`・`indexes/quick-reference.md`・`indexes/topic-map.md` を同 wave で同期させ、
`verify-indexes-up-to-date` CI gate のローカル PASS を確定する。
本 Phase は Phase 12 必須 5 タスク + Task 6 compliance check（合計 7 ファイル必須）を実施する。

---

## 事前チェック【必須】

`.claude/rules/06-known-pitfalls.md` の以下を読む:

- P1 / P25: LOGS.md 2 ファイル更新漏れ
- P2 / P27: topic-map.md 再生成忘れ
- P3: 未タスク管理 3 ステップ不完全
- P4: documentation-changelog 早期完了記載
- UBM-005: root / outputs `artifacts.json` 二重 ledger 同期漏れ
- UBM-018: `taskType=implementation × spec_created × docsOnly=true` 三併存ケース誤完了

加えて、`phase-12-pitfalls.md` の **三併存ケース集** を必ず参照し、本タスクが「実装混入あり / なし」のどちらで close-out するかを Step 1-B 手前で確定する。

> 本タスクは `apps/` / `packages/` への touch を含まないが、`.claude/skills/` 配下の skill metadata（resource-map / quick-reference / topic-map）と `.github/workflows/verify-indexes.yml` 経由の CI gate に影響するため、`docsOnly` 判定の境界に該当する。判定基準は「`apps/` / `packages/` 配下の touch があるか」で行い、本タスクは **docsOnly=true / workflow_state=completed**（skill metadata の同 wave sync を伴う docs-only 完了タスク）として確定する。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| スキル | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 7成果物 / Task 1-6 の準拠基準 |
| スキル | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | implementation / NON_VISUAL / same-wave sync 境界 |
| 正本 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 逆引き追記対象 |
| 正本 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 1 行追記対象 |
| 正本 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` 再生成対象 |
| 上流 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | 追記要求の起点 |
| 上流 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | 上流の更新サマリー |
| 参考 | `.github/workflows/verify-indexes.yml` | CI gate 仕様 |

---

## 実行手順

1. Phase 11 の NON_VISUAL evidence（grep / rebuild 冪等性 / L4 violation）を確認し、Phase 12 に進める状態か gate 判定する。
2. Task 12-1〜12-6 の成果物を `outputs/phase-12/` に作成し、7 ファイル実体を揃える。
3. `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`・`quick-reference.md` の追記内容と `topic-map.md` 再生成結果を same-wave で確定する。
4. root / outputs `artifacts.json` parity、planned wording 0、indexes rebuild の冪等性を確認する。
5. compliance check に実測値を転記し、PASS は実体・実測・同期証跡が揃った後だけ記録する。

---

## 実行タスク

| Task | 内容 | 主成果物 |
| --- | --- | --- |
| Task 12-1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| Task 12-2 | システムドキュメント更新サマリー（Step 1-A/B/C + Step 2 判定） | `outputs/phase-12/system-spec-update-summary.md` |
| Task 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| Task 12-4 | 未タスク検出レポート（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| Task 12-5 | スキルフィードバックレポート（テンプレ改善 / ワークフロー改善 / ドキュメント改善 の 3 観点） | `outputs/phase-12/skill-feedback-report.md` |
| Task 12-6 | phase12-task-spec-compliance-check（7 ファイル実体確認） | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

- Task 12-1: 実装ガイド作成
- Task 12-2: システムドキュメント更新サマリー
- Task 12-3: ドキュメント更新履歴
- Task 12-4: 未タスク検出レポート
- Task 12-5: スキルフィードバックレポート
- Task 12-6: 7 ファイル compliance check

---

## Phase 12 outputs/ 必須成果物（合計 7 ファイル）

| # | ファイル | 由来 Task | 欠落時 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体 | FAIL |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 12-1 | FAIL |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 12-2 | FAIL |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 12-3 | FAIL |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 12-4（0 件でも必須） | FAIL |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 12-5（改善なしでも必須） | FAIL |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-6 | FAIL |

---

## Task 12-1: 実装ガイド作成（2 パート構成）

### Part 1（中学生レベル / 日常の例え）

#### 必須要件

- 「たとえば」を最低 1 回含む
- 「なぜ必要か」→「何をするか」の順序
- 専門用語に括弧書きで日常語を補う

#### 推奨アナロジー

> 「たとえば、図書館（skill）で『本番 D1 へ migration を流す手順書（runbook）』を探したい人がいたとき、目次（resource-map）と索引（topic-map）に **`本番 D1 migration → docs/30-workflows/ut-07b-fu-03/` / `scripts/d1/*.sh` / `verify ワークフロー`** という見出しが載っていなければ、その人は中身まで辿り着けません。本タスクは図書館の目次と索引に『本番 D1 migration はここ』という案内札（逆引き行）を貼り付ける作業です」

- なぜ必要か: 後で D1 migration を流すときに「runbook 探しで遠回りしないため」
- 何をするか: resource-map に runbook へのリンク、quick-reference に apply コマンド、topic-map に keyword を載せる

### Part 2（技術者レベル）

#### 必須要件（C12P2-1〜C12P2-5）

| # | 要件 | 本タスクでの記述 |
| --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | 本タスクではコード実装なし。N/A 理由を明記（skill metadata 更新のみ） |
| C12P2-2 | API シグネチャ | N/A（API 変更なし）。代替として `pnpm indexes:rebuild` の I/O 仕様を記述 |
| C12P2-3 | 使用例 | aiworkflow-requirements skill から D1 runbook へ 1 hop で辿れる経路の `rg` ベース実例 |
| C12P2-4 | エラー処理 | `verify-indexes-up-to-date` CI gate が fail した場合の `pnpm indexes:rebuild` 再実行手順 |
| C12P2-5 | 設定可能パラメータ | `indexes:rebuild` の対象スキル / 出力ディレクトリは `package.json` 定義 |

#### 追従ファイル一覧（Part 2 必須記述）

| 層 | ファイル | 変更内容 |
| --- | --- | --- |
| 1 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` 逆引き 1〜2 行追記 |
| 2 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `bash scripts/cf.sh d1:apply-prod` 1 行追記 |
| 3 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` で再生成（手書き禁止） |
| 4 | `.claude/skills/aiworkflow-requirements/LOGS.md` | 完了エントリ追加（P1 / P25） |
| 5 | `.claude/skills/task-specification-creator/LOGS.md` | 完了記録追加（**2 ファイル両方必須** / P1 / P25） |
| 6 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新（P29） |

#### 検証ケース表

| TC | 入力 | expect 出力 |
| --- | --- | --- |
| TC-01 | `rg "ut-07b-fu-03" indexes/resource-map.md` | 1 行以上 |
| TC-02 | `rg "scripts/d1/" indexes/resource-map.md` | 1 行以上 |
| TC-03 | `rg "d1-migration-verify.yml" indexes/resource-map.md` | 1 行以上 |
| TC-04 | `rg "scripts/cf.sh d1:apply-prod" indexes/quick-reference.md` | 1 行 |
| TC-05 | `pnpm indexes:rebuild` exit code | 0 |
| TC-06 | 2 回目 `pnpm indexes:rebuild` の git diff | 0 件（冪等） |

---

## Task 12-2: システムドキュメント更新サマリー

### Step 1-A: タスク完了記録

- `.claude/skills/aiworkflow-requirements/LOGS.md` に完了エントリ追加
- `.claude/skills/task-specification-creator/LOGS.md` に完了記録追加（**2 ファイル両方必須** -- P1, P25）
- 該当 SKILL.md の変更履歴テーブルを更新（P29）
- topic-map / generated index 再生成: `mise exec -- pnpm indexes:rebuild`
- `docs/30-workflows/LOGS.md` に UT-07B-FU-05 行を追加

### Step 1-B: 実装状況テーブル更新

- 三併存ケース判定: 本タスクは `apps/` / `packages/` への touch なし → docsOnly=true。ただし skill index と CI gate に影響を与える「skill metadata 同 wave sync を含む実装系 docs-only タスク」のため、workflow_state は **`completed`** で確定する（spec_created に据え置かない）。
- 上流 UT-07B-FU-03 の `skill-feedback-report.md` で挙げられた「aiworkflow-requirements skill から D1 runbook を逆引きできない」課題を本タスクで消化したことを記録する。

### Step 1-C: 関連タスクテーブル更新

```bash
grep -rn "UT-07B-FU-05" .claude/skills/aiworkflow-requirements/
grep -rn "UT-07B-FU-05" docs/30-workflows/
grep -rn "UT-07B-FU-03" docs/30-workflows/  # 上流参照確認
```

- 上流 UT-07B-FU-03 行に「下流: UT-07B-FU-05 で skill 逆引き整備済み」を追記
- 後続 D1 migration 実走タスク（unassigned-task または既存の上位タスク）の前提条件として「skill 逆引き整備済み」を記録

### Step 2: システム仕様更新（条件付き）

| 対象 | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` 逆引き 1〜2 行追記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `bash scripts/cf.sh d1:apply-prod` 1 行追記 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` 再生成（手書き禁止） |

> 本タスクは skill index への文言追記 + topic-map 自動再生成を含むため、Step 2 は **N/A ではない**（実施必須）。`docs/00-getting-started-manual/specs/` への波及はなし（仕様レベルの変更ではなく skill メタデータの逆引き整備のため）。

### Step 2A/2B（planned wording 残禁止）

- Step 2A: 更新予定ファイル列挙（本サマリー作成時）
- Step 2B: Phase 12 完了前に実更新を実施し、`仕様策定のみ` / `実行予定` / `保留として記録` 等の planned wording を 0 化する

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

---

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を含める:

- Block A: 変更ファイル一覧（`.claude/skills/aiworkflow-requirements/indexes/*.md` / LOGS.md × 2 / SKILL.md / docs/30-workflows/LOGS.md）
- Block B: validator 結果（`pnpm indexes:rebuild` exit 0 / 2 回目冪等性 0 件 / typecheck / lint）
- Block C: current canonical set / artifact inventory parity 確認結果
- Block D: workflow-local 同期 と global skill sync を**別ブロック**で記録（[Feedback BEFORE-QUIT-003]）

---

## Task 12-4: 未タスク検出レポート（0 件でも必須）

`outputs/phase-12/unassigned-task-detection.md` には以下を必ず含める:

| 項目 | 内容 |
| --- | --- |
| 検出件数 | 0 件（または N 件） |
| 後続候補（再掲） | 後続 D1 migration 実走タスク。skill 逆引き整備が前提条件として満たされたことのみ記録 |
| SF-03 4 パターン照合 | 型定義→実装 / 契約→テスト / UI 仕様→コンポーネント / 仕様書間差異 を全件確認済み（本タスクはコード実装なしのため大半 N/A）|
| Phase 10 MINOR 追跡 | Phase 10 で MINOR 判定された項目があれば全て解決済 / 未タスク化のいずれかを明記 |

> 新規 unassigned-task ファイルは作らず、既存候補として再掲のみ行う（UBM-021）。

---

## Task 12-5: スキルフィードバックレポート（テンプレ改善 / ワークフロー改善 / ドキュメント改善 の 3 観点）

| 観点 | 記載内容 |
| --- | --- |
| テンプレ改善 | task-specification-creator の Phase 11 NON_VISUAL 縮約テンプレで「skill index 整備」のような grep / rebuild ベース evidence を扱う場合の追加 example を提案 |
| ワークフロー改善 | 上流 skill-feedback-report の指摘を下流 follow-up タスクで消化するパターンを workflow テンプレ化（UT-07B-FU-03 → UT-07B-FU-05 の連鎖） |
| ドキュメント改善 | aiworkflow-requirements skill の resource-map に「D1 / migration / production」セクションを設けて将来の同種逆引き追記を集約しやすくする |

> 改善点が真に 0 件の場合も「観察事項なし」と明記する（UBM-020）。

---

## Task 12-6: phase12-task-spec-compliance-check（7 ファイル実体確認）

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下表を含める。

| # | ファイル | 存在 | 必須セクション | 充足 |
| --- | --- | --- | --- | --- |
| 1 | `main.md` | ⬜ | Phase 12 概要 + 7 outputs 一覧 + same-wave sync 証跡 | ⬜ |
| 2 | `implementation-guide.md` | ⬜ | Part 1（たとえば 1 回以上）+ Part 2（C12P2-1〜5）+ 追従ファイル + 検証ケース表 | ⬜ |
| 3 | `system-spec-update-summary.md` | ⬜ | Step 1-A/B/C + Step 2 実施記録（planned wording 0） | ⬜ |
| 4 | `documentation-changelog.md` | ⬜ | Block A/B/C/D + workflow-local / global sync 分離 | ⬜ |
| 5 | `unassigned-task-detection.md` | ⬜ | 検出件数 + 後続候補再掲 + SF-03 4 パターン | ⬜ |
| 6 | `skill-feedback-report.md` | ⬜ | 3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善） | ⬜ |
| 7 | `phase12-task-spec-compliance-check.md` | ⬜ | 本表 + 同 wave sync 証跡 + artifacts parity 結果 | ⬜ |

### 確認手順

```bash
# 7 ファイル実体確認
ls outputs/phase-12/

# planned wording 残存確認
rg -n "仕様策定のみ|実行予定|保留として記録" outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "OK"

# artifacts.json root-only ledger 確認
jq '.metadata.workflow_state, .metadata.docsOnly' artifacts.json
test ! -f outputs/artifacts.json && echo "root artifacts.json is the only ledger"

# index 再生成 + drift 確認（2 回目で 0 件）
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes/

# CI gate 相当
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes/
```

`PASS` は「7 ファイル実体 + validator 実測値 + same-wave sync 証跡 + 2 回目 rebuild 冪等」が揃った後にのみ許可する。

---

## 並列 SubAgent 実行プロファイル

| レーン | 目的 | 編集可否 | 完了条件 |
| --- | --- | --- | --- |
| A | Phase 12 成果物 / artifacts ledger 監査 | 禁止 | 7 outputs 実在 / root-only ledger 宣言 |
| B | skill index / LOGS / SKILL.md 整合監査 | 禁止 | resource-map / quick-reference / topic-map 整合報告 |
| C | skill feedback / 後続タスク連携監査 | 禁止 | 上流 UT-07B-FU-03 ↔ 本タスクの双方向参照確認 |
| owner | 編集適用 | 可（**Step 2 owner 固定**） | SubAgent 結果統合 → 同一ファイル編集を直列化 |
| validator | 最終検証 | 禁止 | `pnpm indexes:rebuild` × 2 / typecheck / lint を実測記録 |

---

## root-only artifacts.json 確認手順

```bash
# 1. root ledger を取得する
jq -S . artifacts.json > /tmp/root.json
test ! -f outputs/artifacts.json && echo "root artifacts.json is the only ledger"

# 2. metadata.workflow_state / docsOnly を確認
jq '.metadata' artifacts.json

# 3. completed 成果物の参照切れを 0 件にする
STALE_UPSTREAM_OUTPUTS='ut-07b-fu-03-production-migration-apply-runbook/outputs/'phase-12
rg -n "$STALE_UPSTREAM_OUTPUTS" \
  docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index && exit 1 || echo "stale upstream outputs path 0"
```

> 本タスクは `apps/` / `packages/` への touch がないため `docsOnly=true`、ただし skill index 同 wave sync を伴うため `workflow_state=completed` で確定する。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | TC-01〜TC-07 の grep / rebuild 結果を implementation-guide.md Part 2 に転記 |
| Phase 13 | implementation-guide.md 全文を PR コメントとして投稿 |
| 上流 UT-07B-FU-03 | `skill-feedback-report.md` の改善要求を本タスクで消化したことを LOGS.md に記録 |

---

## 多角的チェック観点

- 不変条件 #5（apps/web → D1 直接禁止）: 本タスクは apps/web に一切 touch しないことを `git diff --name-only` で確認
- 不変条件 #6（GAS prototype を本番仕様に昇格させない）: 追記対象に GAS prototype が含まれていないこと
- DRY: D1 runbook 本文を resource-map にコピペせず、リンクと 1〜2 行要約のみ
- planned wording 0 化（P57）: Step 2B 完了確認コマンドを必ず実行
- artifacts parity 0 drift（UBM-005）: root と outputs の `artifacts.json` を完全一致させる
- topic-map 手書き禁止（P2 / P27）: `pnpm indexes:rebuild` のみで生成

---

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | implementation-guide Part 1 / Part 2 作成 | completed | C12P2-1〜5 全充足（コード系は N/A 明記）|
| 2 | system-spec-update-summary（Step 1-A/B/C + Step 2） | completed | planned wording 0 確認済み |
| 3 | documentation-changelog（Block A/B/C/D） | completed | workflow-local / global 分離 |
| 4 | unassigned-task-detection（0 件でも必須）| completed | 後続 D1 migration 実走は既存 user-gated runtime operation として分離 |
| 5 | skill-feedback-report（3 観点）| completed | テンプレ / ワークフロー / ドキュメント |
| 6 | phase12-task-spec-compliance-check | completed | 7 ファイル実体 + parity |
| 7 | LOGS.md × 2 / SKILL.md 更新 | completed | P1 / P25 / P29 |
| 8 | indexes 再生成 + 冪等性確認 | completed | `pnpm indexes:rebuild` × 2 |
| 9 | artifacts.json parity 確認 | completed | root ↔ outputs 同期 |

---

## 成果物

| 種別 | パス | 必須 | 説明 |
| --- | --- | --- | --- |
| ドキュメント | `outputs/phase-12/main.md` | ✅ | Phase 12 本体 + 7 outputs 一覧 |
| ドキュメント | `outputs/phase-12/implementation-guide.md` | ✅ | Part 1 + Part 2 + 追従ファイル + 検証ケース表 |
| ドキュメント | `outputs/phase-12/system-spec-update-summary.md` | ✅ | Step 1-A/B/C + Step 2 実施 |
| ドキュメント | `outputs/phase-12/documentation-changelog.md` | ✅ | Block A/B/C/D |
| ドキュメント | `outputs/phase-12/unassigned-task-detection.md` | ✅ | 0 件でも必須 |
| ドキュメント | `outputs/phase-12/skill-feedback-report.md` | ✅ | 3 観点必須 |
| ドキュメント | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ | 7 ファイル実体確認 |

---

## 完了条件

- [x] 実行タスクを「表」と「`- Task 12-X:` 箇条書き」の両方で記載
- [x] `outputs/phase-12/` に 7 ファイルすべてが実在
- [x] implementation-guide Part 1 に「たとえば」が 1 回以上
- [x] implementation-guide Part 2 に C12P2-1〜5 全項目記述（コード系は N/A 理由を明記）
- [x] 追従ファイル一覧と検証ケース表が記述
- [x] system-spec Step 1-A: LOGS.md × 2 / SKILL.md / topic-map 更新済み
- [x] system-spec Step 1-B: workflow_state を `completed_pending_pr` で確定（docsOnly=true / 三併存ケース判定済み）
- [x] system-spec Step 1-C: 関連タスクテーブル / UT-07B-FU-03 行更新済み
- [x] system-spec Step 2: resource-map / quick-reference / topic-map 実更新済み
- [x] planned wording 0 件確認済み
- [x] documentation-changelog Block A/B/C/D が揃う
- [x] unassigned-task-detection は新規未タスク 0 件を記録し、後続 D1 migration 実走は既存 user-gated runtime operation として分離
- [x] skill-feedback-report が 3 観点（テンプレ / ワークフロー / ドキュメント）揃う
- [ ] phase12-task-spec-compliance-check に 7 ファイル × 必須セクション充足表
- [ ] root / outputs artifacts.json parity が 0 drift
- [ ] `mise exec -- pnpm indexes:rebuild` が 2 回連続 exit 0、2 回目 git diff 0 件
- [ ] artifacts.json の phase 12 を completed に更新
- [ ] 本 Phase 内の全タスクを 100% 実行完了

---

## タスク100%実行確認【必須】

- 全実行タスク（Task 12-1〜12-6）completed
- 7 outputs 実在 + same-wave sync 証跡完備
- planned wording 0 / artifacts parity 0 drift / indexes rebuild 冪等
- artifacts.json の phase 12 を completed に更新

---

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: implementation-guide.md（PR コメント投稿用）/ documentation-changelog.md / 7 outputs full set / artifacts parity 結果 / `pnpm indexes:rebuild` 冪等性 evidence
- ブロック条件: 7 ファイル欠落 / artifacts parity drift / planned wording 残存 / Step 2 未実施 / 2 回目 rebuild に diff が出る場合は Phase 13 に進まない
