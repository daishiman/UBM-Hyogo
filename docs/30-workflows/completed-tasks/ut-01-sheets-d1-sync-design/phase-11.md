# Phase 11: 手動 smoke（docs-only / NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke（docs walkthrough / link 検証） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 10（最終レビュー / Go 判定） |
| 下流 | Phase 12（ドキュメント更新） |
| 状態 | spec_created |
| user_approval_required | false |
| タスク種別 | docs-only / NON_VISUAL（screenshot 不要） |
| visualEvidence | NON_VISUAL |
| scope | design_specification |
| workflow_state | spec_created（Phase 12 close-out 後も据え置き） |
| 縮約テンプレ適用 | UT-GOV-005 で整備された docs-only / NON_VISUAL 縮約テンプレ第 N 適用例 |

## 目的

UT-01 は **設計仕様策定タスク（docs-only / NON_VISUAL / spec_created）** であり、コード実装・UI 変更・runtime 影響を一切持たない。
そのため Phase 11 では UT-GOV-005 で整備された **docs-only / NON_VISUAL 縮約テンプレ** を適用し、
artefact を **3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）に固定**して docs walkthrough と link 整合検証で Phase 11 を完結させる。

screenshot は **明示的に作成しない**（false green 防止）。代わりに以下を主証跡とする:

- 仕様書 walkthrough（index.md / phase-01〜10 / outputs/phase-01〜03 の self-completeness 検証）
- 仕様書 → references / `.claude` ↔ `.agents` mirror / workflow 内リンク の link 死活検証
- AC-1〜AC-10 の trace（Phase 7 ac-matrix 確定値の再確認のみ）

本 Phase 終了時点で AC-9（UT-09 が本仕様書のみで実装着手可能）と AC-10（メタ整合 / `workflow_state=spec_created` 据え置き）を最終 GREEN 化する。

## 入力

- `outputs/phase-10/go-no-go.md`（Go 判定）
- `outputs/phase-09/main.md`（typecheck / lint 副作用なし、docs-only であるため lint 影響想定 0）
- `outputs/phase-07/ac-matrix.md`（AC-1〜AC-10 の最終トレース）
- `outputs/phase-03/main.md`（PASS 判定 / Phase 3 MINOR 4 件 / リスク R-1〜R-7）
- `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`
- `outputs/phase-01/main.md`（要件・苦戦箇所 7 件・4 条件評価）
- `index.md`（メタ情報 / `workflow_state=spec_created` の正本）
- `artifacts.json`（`metadata.visualEvidence=NON_VISUAL` / `taskType=docs-only` / `scope=design_specification`）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（縮約テンプレ正本）
- `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/`（第一適用例）

## テスト方式

| 項目 | 値 |
| --- | --- |
| 種別 | NON_VISUAL（docs walkthrough + link 整合検証 + mirror parity 検証） |
| screenshot | **不要**（visualEvidence=NON_VISUAL / docs-only / spec_created / UI・runtime 変更なし） |
| 代替 evidence | `main.md` / `manual-smoke-log.md` / `link-checklist.md`（必須 3 点固定） |
| 主証跡 | spec walkthrough セッション + `rg` / `diff -qr` / `ls` による静的検証 |
| 冗長 artefact | 作成禁止（`screenshot-plan.json` / `manual-test-result.md` / `discovered-issues.md` 等は本 Phase では生成しない） |

### NON_VISUAL 宣言（Phase 11 必須）

`outputs/phase-11/main.md` 冒頭に以下を必ず記録する。

- 証跡の主ソース: spec walkthrough（S-1〜S-6）+ link 死活検証 + mirror parity diff
- screenshot 非作成理由: `visualEvidence=NON_VISUAL` / `taskType=docs-only` / `scope=design_specification` / `workflow_state=spec_created`
- 縮約テンプレ発火判定: `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` を機械判定し本テンプレを採用
- 第一適用例参照: `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/`

## smoke シナリオ

### S-1 仕様書 self-completeness walkthrough（AC-9 担保）

UT-09 が本仕様書のみで着手可能か、open question 0 件か、設計成果物が揃っているかを目視確認する。

```bash
# 主要ファイル存在確認
ls docs/30-workflows/ut-01-sheets-d1-sync-design/index.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/phase-{01..13}.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-flow-diagrams.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-03/main.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-03/alternatives.md

# open question grep（0 件であること）
rg -n 'TBD|TODO|FIXME|要検討|open question' \
  docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/ \
  | rg -v 'phase-11/manual-smoke-log\.md|phase-11/link-checklist\.md' \
  || echo 'open question 0 件'
```

期待: 全成果物存在 / open question 0 件 / UT-09 着手準備チェック（Phase 3 §8）が GREEN。

### S-2 メタ情報整合検証（AC-10）

`index.md` / `artifacts.json` / `phase-01.md` で宣言されたメタ情報が一致しているかを確認する。

```bash
# artifacts.json 側のメタ
jq -r '.metadata.taskType, .metadata.visualEvidence, .metadata.workflow_state, .metadata.scope' \
  docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json

# index.md 側のメタ
rg -n 'タスク種別|visualEvidence|workflow_state|状態|scope' \
  docs/30-workflows/ut-01-sheets-d1-sync-design/index.md
```

期待: artifacts.json と index.md で `docs-only` / `NON_VISUAL` / `spec_created` / `design_specification` が一致。

### S-3 縮約テンプレ発火条件の機械判定（縮約テンプレ正本との整合）

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json
# => NON_VISUAL を出力すること
```

期待: `NON_VISUAL` 単一行出力。空・未設定なら Phase 1 違反。

### S-4 link 死活検証（仕様書 → references / mirror / workflow 内）

`link-checklist.md` の対象 link を 1 件ずつ存在チェック。

```bash
# 仕様書 → references
ls .claude/skills/task-specification-creator/references/phase-template-phase11.md
ls .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md
ls .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
ls .claude/skills/aiworkflow-requirements/references/database-schema.md

# 仕様書 → 上流 / 下流タスク
ls docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md
ls docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md
ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/index.md
ls docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md
ls docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md
ls docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap/index.md
ls docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/index.md

# workflow 内リンク（index.md ↔ phase-NN.md ↔ outputs/）
ls docs/30-workflows/ut-01-sheets-d1-sync-design/index.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-{01..03}/
```

期待: 全 link 存在（exit 0）/ Broken 0 件。

### S-5 `.claude` ↔ `.agents` mirror parity（task-specification-creator skill）

本タスクは task-specification-creator skill 縮約テンプレを参照のみで利用する。`.claude` / `.agents` の skill 本体に編集を加えていないため diff は 0 行であるべき。

```bash
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
echo $?    # => 0
```

期待: 出力 0 行 / exit 0。1 行でも差分があれば本タスクスコープ外編集が混入したとして FAIL。

### S-6 自己適用 3 点固定セルフチェック（縮約テンプレ準拠）

Phase 11 終了直前に outputs/phase-11/ が 3 点のみで構成されていることを確認する。

```bash
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-11/
# 期待出力（3 点のみ）:
# main.md
# manual-smoke-log.md
# link-checklist.md
```

screenshot ファイル / `manual-test-result.md` / `manual-test-checklist.md` / `discovered-issues.md` / `screenshot-plan.json` / `phase11-capture-metadata.json` 等の冗長 artefact が **存在しないこと** を確認する。混入していれば縮約テンプレ違反として削除。

## 必須 evidence（3 点固定）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / docs walkthrough 結果サマリ / S-1〜S-6 結果 / AC 確定マーク / 第一適用例参照 |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-6 の実行コマンド・期待・実測・PASS/FAIL テーブル / 実行日時 / branch 名 / screenshot 非作成理由 |
| `outputs/phase-11/link-checklist.md` | 仕様書 → references / `.claude` ↔ `.agents` mirror / workflow 内リンク の 3 系統死活 checklist |

### `manual-smoke-log.md` 必須メタ

- 証跡の主ソース: spec walkthrough（S-1〜S-6）+ `rg` / `diff -qr` / `ls` 出力
- screenshot 非作成理由: `visualEvidence=NON_VISUAL` / `taskType=docs-only` / `scope=design_specification` / `workflow_state=spec_created`（4 要素を明記）
- 実行日時 / 実行者（worktree branch 名）
- mirror diff 結果（`diff -qr` 出力 0 行の証跡）
- 縮約テンプレ第一適用例（UT-GOV-005）への参照リンク

### `link-checklist.md` 最小 3 系統

| 系統 | 対象 |
| --- | --- |
| 仕様書 → references | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` / `.claude/skills/aiworkflow-requirements/references/{architecture-overview-core,deployment-cloudflare,database-schema}.md` |
| `.claude` ↔ `.agents` mirror parity | `task-specification-creator` skill 本体（diff -qr 出力 0 行であること） |
| workflow 内リンク | `index.md` ↔ `phase-01〜13.md` ↔ `outputs/phase-01〜03/*` 双方向 / 上流 3 タスク（02-monorepo / 01b-cloudflare / 01c-google-workspace）/ 下流（UT-03 / UT-09）/ 原典 unassigned-task / GitHub Issue #50 |

各 link は「参照元 → 参照先 / 状態（OK / Broken）」テーブルで表現する。Broken が 1 件でもあれば Phase 11 FAIL。

## 実行タスク

1. S-1〜S-6 を順次実行し、生コマンド出力を `manual-smoke-log.md` に保存する
2. PASS/FAIL テーブルを `manual-smoke-log.md` に記録する
3. `link-checklist.md` の cross-reference 全件を OK 化する（Broken 0 件）
4. `main.md` に NON_VISUAL 宣言（4 要素）/ docs walkthrough 結果 / AC-9 / AC-10 確定マーク / 第一適用例参照を記録する
5. S-6 で自己適用 3 点構成が崩れていないか最終チェックする
6. screenshot / `manual-test-result.md` / `screenshot-plan.json` 等の冗長 artefact が **作成されていない** ことを `ls` で確認する
7. `index.md` の `workflow_state=spec_created` を **書き換えない**（Phase 11 の段階で誤って更新しない）

## 検証項目（AC 確定対応表）

| AC | 確認 smoke | 期待結果 |
| --- | --- | --- |
| AC-9（UT-09 が本仕様のみで着手可能 / open question 0 件） | S-1 | 全成果物存在 / TBD・TODO 0 件 |
| AC-10（メタ整合 / `workflow_state=spec_created` 据え置き） | S-2 / S-3 | artifacts.json と index.md で 4 メタ一致 / `NON_VISUAL` 機械判定成立 |

AC-1〜AC-8 は Phase 1〜10 で確定済（再確認のみ）。Phase 11 は AC-9 / AC-10 を最終 GREEN 化する位置づけ。

## 参照資料

### システム仕様（task-specification-creator skill）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 11 縮約テンプレ正本 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 3 点固定 / screenshot 不要 / 発火条件 |
| Phase 11 NON_VISUAL 代替 evidence プレイブック | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | NON_VISUAL タスクの根拠 |
| SKILL.md タスクタイプ判定フロー | `.claude/skills/task-specification-creator/SKILL.md` | NON_VISUAL → 縮約発火の判定ルール |

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `outputs/phase-09/main.md` |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-03/main.md` / `alternatives.md` |
| 必須 | `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md` |
| 必須 | `outputs/phase-01/main.md` |
| 第一適用例 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` |

## 依存Phase明示

- Phase 1（要件 / メタ情報・visualEvidence=NON_VISUAL）を参照する
- Phase 2（設計成果物 3 点）を参照する
- Phase 3（PASS 判定 / MINOR 追跡 / UT-09 着手準備チェック）を参照する
- Phase 7（AC マトリクス）を参照する
- Phase 9（typecheck / lint / mirror parity）を参照する
- Phase 10（Go 判定）を参照する

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index / NON_VISUAL 宣言 / S-1〜S-6 結果サマリ / AC-9 / AC-10 確定マーク |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-6 実行ログ / PASS-FAIL テーブル（必須） |
| `outputs/phase-11/link-checklist.md` | 3 系統 cross-reference checklist（必須） |

> **重要**: 本 Phase の outputs は **3 点のみ**。screenshot / `manual-test-result.md` / `screenshot-plan.json` 等を作らないこと。
> 冗長 artefact が 1 つでも混入した時点で縮約テンプレ違反として Phase 11 FAIL となる。

## 完了条件 (DoD)

- [ ] S-1 PASS（全成果物存在 / open question 0 件）
- [ ] S-2 PASS（artifacts.json と index.md でメタ 4 要素一致）
- [ ] S-3 PASS（`visualEvidence=NON_VISUAL` 機械判定成立）
- [ ] S-4 PASS（link 死活全 OK / Broken 0 件）
- [ ] S-5 PASS（`.claude` ↔ `.agents` mirror diff 0 行）
- [ ] S-6 PASS（自己適用 3 点構成・冗長 artefact なし）
- [ ] AC-9 / AC-10 確定 GREEN
- [ ] 必須 3 点（main.md / manual-smoke-log.md / link-checklist.md）作成済
- [ ] screenshot / `manual-test-result.md` 等が `outputs/phase-11/` に存在しない
- [ ] `index.md` の `workflow_state=spec_created` が書き換えられていない

## 苦戦箇所・注意

- **screenshot 強要の誤解**: NON_VISUAL タスクで「念のため」screenshot を作ると false green になり縮約テンプレ違反。代替 evidence 3 点を厳守
- **冗長 artefact 混入**: `manual-test-result.md` / `screenshot-plan.json` を追加すると 3 点固定が崩れる。S-6 で必ず 3 点のみであることを確認
- **mirror diff の見落とし**: 本タスクは skill 本体を編集しないため diff 0 が前提。1 行でも差分があればスコープ外編集が混入している
- **workflow_state の誤書換え**: 本タスクは設計仕様策定のみで、実装完了は UT-09 が担う。Phase 11 / Phase 12 close-out で `spec_created` を `completed` に書き換えてはならない
- **link checklist の機械的 OK**: 「存在する」だけでなく「正しい参照先か」を目視確認する。リンク先のメタ情報が古い場合は Phase 12 unassigned-task-detection に転記
- **第一適用例リンク忘れ**: 縮約テンプレ採用根拠として UT-GOV-005 の Phase 11 outputs への link を `main.md` に必ず記載
- **branch protection 抵触**: smoke 実施で main / dev に直接 commit しないこと。本 PR ブランチ内で完結させる

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（3 点）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない
- [ ] **`workflow_state=spec_created` を書き換えていないことを確認する**

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様策定タスクであり、アプリケーション統合テストは追加しない
- 統合検証は `rg` による open question / メタ整合 grep、`diff -qr` mirror parity、`ls` による 3 点固定確認、link 死活 checklist で代替する
- 後続実装タスク（UT-09）の Phase 11 で actual 同期ジョブの smoke が実施される

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ: AC-9 / AC-10 確定 GREEN / 自己適用 evidence 3 点 / mirror diff 0 ログ / `workflow_state=spec_created` 据え置き宣言
