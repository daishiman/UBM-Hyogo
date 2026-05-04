# Phase 12: ドキュメント更新（7 必須成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

Phase 12 必須 6 タスク + 7 ファイル成果物を `outputs/phase-12/` に揃え、本タスクの implementation evidence path を `verified` / `implementation_complete_pending_pr` へ整合させる。

## 必須 7 ファイル

| # | ファイル | 由来 Task |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 本体 |
| 2 | `implementation-guide.md` | Task 1（Part 1 中学生レベル + Part 2 技術者レベル） |
| 3 | `system-spec-update-summary.md` | Task 2（Step 1-A/B/C + 条件付き Step 2） |
| 4 | `documentation-changelog.md` | Task 3 |
| 5 | `unassigned-task-detection.md` | Task 4（0 件でも必須） |
| 6 | `skill-feedback-report.md` | Task 5（改善点なしでも必須） |
| 7 | `phase12-task-spec-compliance-check.md` | Task 6（root evidence） |

## Task 1: 実装ガイド作成

### Part 1（中学生レベル）

> ドラフト例（採用時はそのまま implementation-guide.md にコピー）:
>
> CI（自動テスト係）には「テストの点数チェック」というお仕事があります。今までは点数が足りなくても「あ、足りないね、でもまあいいか」と通してくれる優しい設定でした。でも本当はもっと厳しくしたいので、今日からは点数が足りないと「ダメ！直してから出して！」と止めるようにします。これが「ハードゲート化」です。
>
> 例えるなら、学校の宿題提出のとき、先生が「期限過ぎたけど受け取るよ」モードから「期限過ぎたら受け取らないよ」モードに切り替えるようなものです。ルール自体（80 点以上）は変わっていません。チェックの厳しさだけが変わります。

**Part 1 専門用語チェック**:

| 専門用語 | 日常語言い換え |
| --- | --- |
| CI | 自動テスト係 |
| カバレッジ | テストでチェックされた範囲の割合 |
| ハードゲート | 「絶対通さない」関所 |
| ソフトゲート | 「警告だけ出して通す」関所 |
| continue-on-error | 「失敗してもいいよ」設定 |

### Part 2（技術者レベル）

| 項目 | 内容 |
| --- | --- |
| 変更対象 | `.github/workflows/ci.yml` line 56-110 `coverage-gate` job |
| 編集内容 | job レベル + step レベルの `continue-on-error: true` を 2 箇所削除、inline comment 更新 |
| 効果 | coverage 80% 未達時に CI が exit 1 → PR check が red → branch protection で merge blocked（branch protection に context 登録済の場合） |
| 履歴 | PR1/3（soft gate）→ PR2/3（閾値整備）→ **PR3/3（本タスク, hard gate 化）** |
| 検証 | `gh workflow view ci.yml` / `bash scripts/coverage-guard.sh` exit 0 / push して `coverage-gate` job PASS |
| rollback | `git revert <commit>` で即座に soft gate へ戻る |

## Task 2: system spec update

### Step 1-A: タスク完了記録

- 親 wave `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/index.md` の Task E 行を `completed` に更新
- 関連 LOGS（skill 側 / project 側）に PR3/3 完了を記録
- topic-map に `coverage-gate hard gate` キーワードを追加（必要時）

### Step 1-B: 実装状況テーブル更新

- 本 Task の status を `spec_created` → `completed` に変更（実装完了時）

### Step 1-C: 関連タスクテーブル更新

- coverage-80-enforcement の PR3/3 行を `completed` に更新

### Step 1-H: skill feedback routing

- 本タスクで得た知見（hard gate 化テンプレ）を skill-feedback-report.md で routing 判定

### Step 2: 新規インターフェース追加判定

> **判定: N/A**
>
> 理由:
> - 本タスクは workflow yml 編集のみ。TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規追加なし**。
> - coverage 閾値 80% は既存仕様（coverage-80-enforcement PR2/3）にて確定済。本タスクは gate strictness 変更のみ。
> - 関連派生作業はなし。

## Task 3: documentation-changelog.md

- 本タスクで変更した md / yml / sh のリストを Phase 別に列挙
- ci.yml diff の前後を抜粋

## Task 4: unassigned-task-detection.md

- 0 件でも出力必須
- 検出候補:
  - branch protection に `coverage-gate` context 未登録の場合 → 本タスク Phase 12 の readiness gate に記録し、hard gate 化の完了条件として同一サイクル内で解消または user approval gate に紐づける
  - `coverage-80-enforcement` 旧 spec 不在の場合 → 履歴追記対象なしと記録

## Task 5: skill-feedback-report.md（3 観点固定）

| 観点 | 内容 |
| --- | --- |
| テンプレ改善 | NON_VISUAL workflow yml 変更タスクの最小テンプレ化候補 |
| ワークフロー改善 | hard gate 化前後の dry-run 自動化検討 |
| ドキュメント改善 | coverage-standards.md に hard gate 化チェックリスト追加検討 |

> 改善点なしでも 3 観点で「特になし」を明示記載する（空欄禁止）。

## Task 6: phase12-task-spec-compliance-check.md

- 7 ファイル実体チェック
- root `artifacts.json.metadata.workflow_state` を `verified`、`implementation_status` を `implementation_complete_pending_pr` に整合
- `index.md` Status 行と drift がないか確認
- parity セクション: `outputs/artifacts.json` 不在のため、root が唯一正本である旨を以下文言で明記:
  > `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。
- 総合判定行は `verified`（runtime evidence 取得済の場合）または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（runtime evidence pending の場合）

## 完了条件

- [ ] 7 ファイルすべて `outputs/phase-12/` に実体配置
- [ ] Step 1-A/B/C 完了、Step 2 N/A 判定明記
- [ ] Step 1-H で skill feedback routing 完了
- [ ] phase12-task-spec-compliance-check.md の総合判定が PASS / verified
- [ ] root artifacts.json と index.md の status が drift なし
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] 7 ファイルチェックリスト完了
- [ ] Part 1 専門用語チェック表 5 用語以上
- [ ] Part 1 に日常生活の例え話 1 つ以上
- [ ] Step 2 N/A 判定の根拠 3 項目（スコープ / 既存参照 / 派生作業）明記
- [ ] unassigned-task-detection.md は 0 件でも明示記載

## 次 Phase

Phase 13（コミット・PR 作成）。**user 明示承認必須**。
