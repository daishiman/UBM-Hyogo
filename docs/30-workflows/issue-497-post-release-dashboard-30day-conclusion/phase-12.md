# Phase 12: ドキュメント更新（skill references / changelog）

> **本仕様書は docs-only タスクであるが、Phase 12 の 6 必須タスクの構成が意味的に分割不可能なため、行数 200〜350 行を許容する**
> （`.claude/skills/task-specification-creator/references/phase-template-phase12.md` §「phase-12.md の 300 行上限と例外条項」準拠）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（skill references / changelog） |
| 作成日 | 2026-05-06 |
| 前 Phase | 11（NON_VISUAL 縮約 / 30 日 gh run 集計実行） |
| 次 Phase | 13（PR 作成 / **user_approval_required = true**） |
| 状態 | spec_created → completed_pending_pr（30 日 gate PASS 後、Phase 12 7 必須成果物と skill 同期が完了した時） |
| タスク分類 | docs-only（CONST_004 例外） |
| 実装区分 | ドキュメントのみ |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | spec_created（30 日 gate 未達時は維持） / completed_pending_pr（30 日 gate PASS 後の Phase 12 完了時） |
| user_approval_required | true（Phase 13 commit / push / PR 作成に必要） |
| GitHub Issue | #497（CLOSED 据え置き / 再 OPEN 禁止） |
| 変更対象ファイル | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`, `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`, 本タスク仕様書配下の outputs |
| 関数シグネチャ | N/A（コード変更なし） |
| unit/integration/e2e tests | N/A（コード変更なし） |

---

## 目的

Phase 11 で取得した 30 日実測値（conclusion 分布 / 連続 failure 区間 / failure rate / root cause 分類）を、`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章に「30 日実測 feedback」として正本化する。同時に `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` に反映し、7 必須成果物を `outputs/phase-12/` 配下に配置する。

GitHub Issue #497 は **CLOSED のまま据え置き**。Issue ライフサイクルは再 OPEN せず、`gh issue comment 497` で PR / 仕様書リンクを残す形で履歴を完結させる。

---

## 必須 6 タスク（task-specification-creator skill phase-12-spec.md 準拠）

| # | Task ID | 成果物 | 欠落時の扱い |
| --- | --- | --- | --- |
| 1 | Task 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | FAIL |
| 2 | Task 12-2 | `outputs/phase-12/system-spec-update-summary.md`（deployment-gha.md 追記 diff 概要） | FAIL |
| 3 | Task 12-3 | `outputs/phase-12/documentation-changelog.md`（skill changelog fragment 反映行） | FAIL |
| 4 | Task 12-4 | `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**） | FAIL |
| 5 | Task 12-5 | `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須** / 3 観点固定） | FAIL |
| 6 | Task 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | FAIL |

加えて集約用の `outputs/phase-12/main.md` を含め、`outputs/phase-12/` 配下に **最低 7 ファイル** を実体配置する（Task 6 PASS 断言の前提）。

---

## workflow_state 取り扱い

| 状態 | docsOnly | github_issue_state | Phase 13 |
| --- | --- | --- | --- |
| 30 日 gate 未達 | true | CLOSED | 未実行（workflow_state は `spec_created` 維持） |
| Phase 12 完了 | true | CLOSED | 実行（user_approval 必須 / workflow_state は `completed_pending_pr`） |

- 30 日 gate 未達時は `phases[*].status` と root `workflow_state` を `spec_created` のまま維持する。
- 30 日 gate PASS 後に Phase 11 / 12 evidence と skill 同期が完了した場合のみ、該当 Phase の `status` を `completed` に更新する。
- `metadata.docsOnly = true` を維持（コード変更なし）。
- root `workflow_state` は `completed` 単独ではなく `completed_pending_pr` とし、Phase 13 の user approval gate と区別する。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 構造定義（6 必須タスク） |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | 漏れパターン |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | 実装ガイド執筆要領 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | docs-only 系の縮約条項 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/` | 集計 evidence（本 Phase の入力） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先（Step 1-A 同期先） |
| 必須 | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | changelog 反映先 |
| 必須 | `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` | 起票元 unassigned task spec（trace 追記対象） |
| 必須 | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md` | 親タスク unassigned-task-detection（U-1 trace 追記対象） |
| 必須 | `CLAUDE.md` | 不変条件 / ブランチ戦略 / solo 運用 |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 想定影響 | 緩和策 |
| --- | --- | --- | --- |
| 1 | `deployment-gha.md` に 30 日 / 60 日 / 90 日で section を分けるかどうかの構造判断ブレ | 後続 60 日 / 90 日 follow-up 時に追記方針が定まらず drift | 本 Phase で「30 日実測 feedback (since YYYY-MM-DD)」セクションを 1 つだけ追加し、60 日 / 90 日は別 follow-up タスクで議論する旨を `system-spec-update-summary.md` に明記 |
| 2 | changelog fragment と workflow-local 記録の二重管理ブレ | skill changelog と workflow close-out の片方だけが更新される | 本 Phase は `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` を一次として作成し、必要に応じて workflow-local close-out 行を `documentation-changelog.md` に記録する |
| 3 | `aiworkflow-requirements` の indexes 再生成要否の判定ブレ | CI `verify-indexes-up-to-date` が FAIL し PR がマージ不可 | content-only 追記（keywords / トピックマップに新キー追加なし）の場合 indexes 再生成不要。新キー追加時は `mise exec -- pnpm indexes:rebuild` を実行する旨を判定フローとして本 Phase に明記 |
| 4 | failure rate `>= 10%` 時の別 unassigned task（issue-497-fu-01）と本タスク unassigned-task-detection の trace 重複 | 起票二重化 / 監査時の追跡コスト | `unassigned-task-detection.md` には「Phase 11 で起票済 issue 番号への trace のみ」を記載し、本タスク内で再度起票しない |
| 5 | 親タスク（issue-351）unassigned-task-detection.md U-1 への formalize trace 追記漏れ | 親子タスクの追跡が切れる | 本 Phase Task 12-7 として「親タスク Phase 12 unassigned-task-detection.md U-1 への formalize 済 trace 1 行追加」を必須化 |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 30 日実測 feedback が正本化され、後続 60 日 / 90 日 follow-up の比較ベースラインになる |
| 実現性 | PASS | content-only markdown 追記 + changelog 1 行で完結 / indexes 再生成は条件付き |
| 整合性 | PASS | AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-11 と直接対応。親タスク 351 Phase 12 と章立てを揃える |
| 運用性 | PASS | 7 必須成果物の構成で監査追跡可能。Issue #497 reopen 禁止 / `Refs #497, Refs #351` で履歴連結 |

---

## 受入条件（AC 紐付け）

| AC | 紐付け |
| --- | --- |
| AC-2 | `deployment-gha.md` 追記内 conclusion 分布表 |
| AC-3 | `deployment-gha.md` 追記内 root cause 分類表 |
| AC-4 | `deployment-gha.md` 追記内 連続 failure 区間記載 |
| AC-5 | `deployment-gha.md` 追記内 次アクション判断 + 起票 issue 番号 |
| AC-6 | `documentation-changelog.md` + aiworkflow-requirements changelog fragment 反映行 |
| AC-9 | `gh issue view 497` が CLOSED |
| AC-10 | 4 条件評価が全 PASS |
| AC-11 | 必須 7 ファイル + aiworkflow-requirements 同期完了 |

---

## 実行手順

### Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

1 ファイル内で **Part 1 + Part 2** を 2 部構成で記述する。

**Part 1（中学生レベル / 例え話 + 専門用語回避）必須要件**:

- 「GitHub の workflow（自動で動くロボット）が 30 日間、毎日 0 時に正しく走ったかをチェックして、失敗したパターンをノートにまとめる作業」と説明する。
- 「conclusion」を「ロボットの今日の成績通知（合格 / 失敗 / 途中棄権 / 起動失敗 / 時間切れ / 要対応）」と例える。
- 「failure rate `>= 10%`」を「30 日のうち 3 日以上失敗していたら、自動再試行や通知を入れる別タスクを作る」と例える。
- 専門用語セルフチェック: 「GitHub Actions」「workflow」「conclusion」「cron」を使う場合は括弧書きで日常語を補う。

**Part 2（技術者レベル）必須要件**:

- `gh run list --workflow=post-release-dashboard.yml --limit=80 --json ...` の集計手順
- redaction grep のパターン（`token` / `bearer` / `secret` / `Authorization` / `ya29\.` / `ghp_` / `ghs_`）
- `deployment-gha.md` への追記構造（30 日実測 feedback セクションの heading / 4 表構造: conclusion 分布 / root cause / 連続 failure / 次アクション）
- failure rate 判定分岐（`< 10%`: 現状維持 / `>= 10%`: 別 unassigned task 起票）
- Phase 11 数値の転記表（conclusion 分布 / 連続 failure 最大日数 / failure rate %）

### Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

更新対象: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の post-release-dashboard 章。

**追加セクション**:

```markdown
### 30 日実測 feedback (since 2026-MM-DD)

#### conclusion 分布
（Phase 11 conclusion-distribution.md から転記）

#### failure root cause 分類
（Phase 11 log-failed-<id>.log の分類結果から転記）

#### 連続 failure 区間
（Phase 11 consecutive-failure-window.md から転記）

#### 次アクション
- failure rate: X.X%（< 10% / >= 10%）
- 判断: 現状維持 / retry/alert 追加（issue-497-fu-01 起票済）
```

**diff 概要 / 行数 / セクション構造**:

- 追加行数: 30〜80 行（Phase 11 数値次第）
- セクション depth: 既存の `## post-release-dashboard` 配下に `### 30 日実測 feedback (since YYYY-MM-DD)` を 1 つ追加
- 既存セクション編集なし（追記のみ）

**aiworkflow-requirements indexes 再生成要否**:

- content-only 追記（既存キーワードのみ使用）→ **不要**
- 新キー追加（例: `30day-feedback` / `failure-rate-threshold`）→ `mise exec -- pnpm indexes:rebuild` 実行必須
- 判定結果と実行有無を `system-spec-update-summary.md` に記録

### Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

`.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` への反映例:

```markdown
# Issue #497 post-release-dashboard 30 day feedback

- `references/deployment-gha.md` に post-release-dashboard 30 日実測 feedback を追記。
- 30 日 conclusion 集計は `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/` を正本 evidence とする。
- GitHub Issue は #497 CLOSED 維持。PR 文面は `Refs #497, Refs #351` のみ。
```

workflow-local close-out 行を置く場合の例:

```markdown
| 2026-MM-DD | issue-497 | completed_pending_pr | post-release-dashboard 30 日 conclusion 集計を deployment-gha.md に正本化 |
```

両ブロックを `documentation-changelog.md` に分けて記録する（workflow-local / aiworkflow skill changelog fragment 別ブロック）。

### Task 12-4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`）/ **0 件でも出力必須**

- **改善点なしの場合**: 「30 日連続観測の結果、追加未タスクなし。failure rate `< 10%` のため retry / alert 追加は現時点で不要。再観測ベースラインを `deployment-gha.md` に正本化済。」と明記する。
- **failure rate `>= 10%` だった場合**: 別 unassigned task `issue-497-fu-01` として `gh issue create` 起票済である trace（Phase 11 で取得した issue 番号 / URL）を記載する。本 Phase 内で再起票しない。
- 4 パターン照合表（型定義→実装 / 契約→テスト / UI→component / 仕様間差異→設計決定）を 0 件でも明記し、本タスクが docs-only であるため全パターン非該当である根拠を残す。

### Task 12-5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`）/ **改善点なしでも出力必須 / 3 観点固定**

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善（task-specification-creator） | docs-only / NON_VISUAL / 外部時間依存タスクの phase-11 縮約テンプレに「30 日 gate 判定」項目が未収録 | `phase-template-phase11.md` に「外部時間依存タスクの 30 日 gate 再判定」セクションを追加するか検討 |
| ワークフロー改善 | 30 日経過 trigger を半自動化（schedule reminder）すると人的見落としが減る | `scripts/sync-check.sh` 系に「外部時間依存タスクの gate 到達日通知」機能の追加を検討 |
| ドキュメント改善（aiworkflow-requirements） | `deployment-gha.md` の構造（30 日 / 60 日 / 90 日 で section を分けるか / 1 セクションに時系列追記するか）が未定義 | 60 日 / 90 日 follow-up タスク発生時に section 構造を統一する基準を決定する |

> 改善点なしの観点があれば「観察事項のみ / なし」を 3 観点で必ず明記する。

### Task 12-6: タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル成果物が揃っている | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| implementation-guide が Part 1 / Part 2 構成 | Part 1 例え話 + 専門用語セルフチェック / Part 2 集計手順 + 追記構造 + 分岐 | PASS |
| `deployment-gha.md` 追記構造（30 日 feedback セクション 4 表） | conclusion 分布 / root cause / 連続 failure / 次アクション | PASS |
| aiworkflow-requirements changelog fragment | `changelog/20260506-issue497-30day-feedback.md` 作成 | PASS |
| 親タスク 351 Phase 12 unassigned-task-detection U-1 への formalize trace 追記 | 1 行追加 | PASS |
| 起票元 unassigned task spec への trace | `task-issue-351-post-release-dashboard-30day-conclusion-001.md` 末尾に 1 行追加 | PASS |
| aiworkflow-requirements indexes 再生成要否判定 | content-only=不要 / 新キー追加=実行 | PASS |
| 二重 ledger parity（root artifacts.json / outputs/artifacts.json） | drift 0 | PASS |
| `metadata.docsOnly=true` / `github_issue_state=CLOSED` | 維持 | PASS |
| 不変条件 #1〜#7 | 影響なし（コード変更なし） | PASS |
| Issue #497 再 OPEN 禁止 | `gh issue reopen` 不実行 | PASS |
| Phase 11 数値（conclusion 分布 / 連続 failure / failure rate） | implementation-guide Part 2 に転記済 | PASS |
| Phase 13 連動 | PR title `docs: post-release-dashboard 30-day schedule conclusion feedback (issue-497)` / `Refs #497, Refs #351` | PASS |

---

## Task 12-7: 親タスク / 起票元への trace 追記

### 親タスク Phase 12 unassigned-task-detection.md（issue-351 側）への trace 1 行追加

対象ファイル: `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`

追記行例（U-1 行の備考欄またはセクション末尾）:

```markdown
> U-1 は本仕様書（issue-497）にて formalize 済（`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`、PR #XXX）。
```

### 起票元 unassigned task spec への trace 1 行追加

対象ファイル: `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md`

末尾追記行例:

```markdown
## 状態遷移

- 2026-MM-DD: 本仕様書 issue-497 (`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`) へ昇格。30 日 gate PASS 後の Phase 12 完了時に `completed_pending_pr` へ遷移。Refs #497, Refs #351
```

---

## aiworkflow-requirements skill 同期チェックリスト

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| references 追記 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | YES |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | YES |
| indexes 再生成 | `.claude/skills/aiworkflow-requirements/indexes/` | content-only 追記=不要 / 新キー追加時=YES |
| workflow-local close-out | `outputs/phase-12/documentation-changelog.md` | YES（workflow-local / skill changelog fragment の両方を記録） |

---

## GitHub Issue #497 への comment（reopen 禁止）

```bash
# Phase 13 PR merge 後に実行
gh issue comment 497 --body "PR <PR URL> でマージ済み。仕様書: docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/"
```

- Issue #497 は **CLOSED 据え置き**。`gh issue reopen 497` を実行しない。
- close-twice も避ける（既に CLOSED のため `gh issue close` も実行しない）。

---

## 完了条件チェックリスト

- [ ] 必須 7 ファイル（main + Task 12-1〜12-6 成果物）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生）と Part 2（技術者）構成で例え話 + 専門用語セルフチェック済
- [ ] system-spec-update-summary に追記対象セクションの diff 概要 / 行数 / 構造が明記され、indexes 再生成要否判定済
- [ ] documentation-changelog で aiworkflow-requirements changelog fragment と workflow-local close-out が別ブロックで記録
- [ ] unassigned-task-detection が 0 件でも出力され、failure rate `>= 10%` 時の起票 trace が記載
- [ ] skill-feedback-report が「テンプレ改善 / ワークフロー改善 / ドキュメント改善」3 観点で出力（改善点なしでも出力）
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] 親タスク 351 Phase 12 unassigned-task-detection.md U-1 行に formalize trace 1 行追加済
- [ ] 起票元 unassigned task spec 末尾に状態遷移 trace 1 行追加済
- [ ] aiworkflow-requirements skill 同期完了（references + changelog / 必要時 indexes rebuild）
- [ ] 30 日 gate PASS 後のみ artifacts.json が `workflow_state = completed_pending_pr` / `phases[11].status = completed` / `phases[12].status = completed` に更新
- [ ] 30 日 gate 未達時は artifacts.json が `workflow_state = spec_created` のまま維持
- [ ] `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"` を維持
- [ ] 不変条件 #1〜#7 影響なし（コード変更なし）
- [ ] GitHub Issue #497 を再 OPEN していない

---

## 不変条件への影響

| # | 不変条件 | 影響 |
| --- | --- | --- |
| 1〜7 | 全項目 | **影響なし**（コード変更なし / markdown 追記のみ） |

---

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 集約 | `outputs/phase-12/main.md` | Phase 12 index / 7 成果物ナビ |
| ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生）+ Part 2（技術者） |
| サマリー | `outputs/phase-12/system-spec-update-summary.md` | deployment-gha.md 追記 diff 概要 |
| 履歴 | `outputs/phase-12/documentation-changelog.md` | aiworkflow-requirements changelog fragment / workflow-local close-out 記録 |
| 検出 | `outputs/phase-12/unassigned-task-detection.md` | 0 件出力 + failure rate `>=10%` 時 trace |
| FB | `outputs/phase-12/skill-feedback-report.md` | 3 観点固定 |
| 検証 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 全項目 PASS 期待 |
| メタ | `artifacts.json`（root） / `outputs/artifacts.json` | 30 日 gate PASS 後のみ `workflow_state = completed_pending_pr` 更新 |

---

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required = true**）
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - failure rate `>= 10%` 時の起票 issue 番号 → PR body の「30 日実測 feedback サマリ」に転記
  - Issue #497 CLOSED 据え置き / `Refs #497, Refs #351` 採用方針を Phase 13 PR body に明記
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - aiworkflow-requirements 同期未完了（references 追記 / changelog 反映）
  - 親タスク 351 / 起票元 unassigned task spec への trace 追記漏れ
  - GitHub Issue #497 を再 OPEN してしまった
  - PR body 草案に `Closes #497` を採用してしまった

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。
