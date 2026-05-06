# Phase 12: ドキュメント更新 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 12 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| visualEvidenceClass | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

Phase 1〜11 の成果（postmortem 生成スクリプト・template・runbook README・unit test・CLI smoke evidence）を、正本仕様書および workflow artifacts に反映し、後続の運用担当者が「どこを見れば postmortem を生成できるか / blame 排除・evidence 必須・runbook 責務分離 がなぜ重要か」を**自走で理解できる状態**にする。

本 Phase の責務は **ドキュメント整備のみ** であり、`workflow_state` の `spec_created → completed` への昇格は本仕様書の責務外（実装完了後の別 wave で扱う）。`apps/api` `apps/web` の不変条件には触れず、`scripts/postmortem/` と `docs/30-workflows/runbooks/postmortem/` の追加に閉じる。

## 事前チェック【必須】

1. P1: LOGS.md 更新漏れがないこと（`.claude/skills/task-specification-creator/LOGS.md` を本タスク完了時に追記する）
2. P2: aiworkflow-requirements skill の `indexes/` に drift がないこと（`pnpm indexes:rebuild` 実行要否を判定）
3. P3: 未タスク管理の 3 ステップ（検出 → 起票判断 → unassigned-task-detection.md 記録）が完了していること
4. P29: SKILL.md / 関連 reference 更新有無を判定（reference 更新が発生する場合のみ本 Phase で実施）
5. CONST_007: 本 Phase 内に「Phase 2 で対応」「別 PR で」等の先送り表現を残さないこと

## 実行タスク（必須 6 タスク）

| Task | 内容 | 主成果物 |
| --- | --- | --- |
| Task 12-1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者詳細） | `outputs/phase-12/implementation-guide.md` |
| Task 12-2 | システム仕様書更新サマリー | `outputs/phase-12/system-spec-update-summary.md` |
| Task 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| Task 12-4 | 未タスク検出レポート | `outputs/phase-12/unassigned-task-detection.md` |
| Task 12-5 | スキルフィードバックレポート | `outputs/phase-12/skill-feedback-report.md` |
| Task 12-6 | Task 12-1〜12-5 準拠確認 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

`outputs/phase-12/main.md`（Phase 12 全体サマリー）を加えて **計 7 ファイル** を実体出力する。`artifacts.json` の `phase12Outputs` 配列と 1:1 一致させる。

## 参照資料

| 資料 | パス |
| --- | --- |
| Phase 1 要件定義 | `outputs/phase-01/main.md` |
| Phase 2 設計 | `outputs/phase-02/main.md` |
| Phase 3 設計レビュー | `outputs/phase-03/main.md` |
| Phase 9 品質保証 | `outputs/phase-09/main.md` |
| Phase 11 手動 smoke evidence | `outputs/phase-11/main.md` |
| 09c Phase 11 evidence（input） | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| infra runbook（更新対象） | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |
| Phase 12 テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` |
| Phase 12 詳細テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md` |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` |
| Phase 12 documentation guide | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` |
| Phase 12 pitfalls | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` |

## Task 12-1: 実装ガイド（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` に Part 1 / Part 2 を 1 ファイルで記載する。

### Part 1: 中学生レベル（順序固定 3 トピック / 各トピックに「たとえば」を最低 1 回）

1. 「postmortem（事後検証）とは何か」
   - たとえば: テストで間違えた問題のあとに、答案を見返して「どこで間違えたか・次どうするか」を書くノートのようなもの。
   - なぜ必要か: incident（障害）が起きたあと、原因と再発防止を **責任追及ではなく事実ベース**で残しておかないと、同じ障害が何度も起きてしまう。
   - 何をするか: rollback 直後に `pnpm postmortem:generate` を実行し、決まった形（timeline / impact / detection / response / root cause / prevention / follow-up issues）の markdown を雛形として吐き出す。

2. 「blame（責任追及）を構造的に書けない仕組みとは何か」
   - たとえば: 「誰が遅刻したか」を書く欄が時間割の表に**そもそもない**から、書きようがないのと同じ。
   - なぜ必要か: 個人を責める postmortem は再発防止につながらず、次回以降「正直に書く人」がいなくなる。
   - 何をするか: template の見出しを 7 種類に**固定**し、Root Cause の主語を「コード / 構成 / プロセス」にすることで、書く欄そのものから人名を排除する。

3. 「evidence link を必須にして、空っぽの postmortem を防ぐとはどういうことか」
   - たとえば: 宿題の感想文を出すときに「読んだ本の名前」が空欄だと先生が受け取らないのと同じ。
   - なぜ必要か: 09c Phase 11 evidence（rollback の証拠）にリンクが張られていない postmortem は「あとで誰かが書く」状態のまま放置され、結局誰も書かなくなる。
   - 何をするか: `--evidence` 引数を必須にし、path が存在しなければスクリプトを exit 1 で失敗させる。

### Part 2: 技術詳細（必須 5 項目 C12P2-1〜C12P2-5）

| 項目 | 内容 |
| --- | --- |
| Summary | `pnpm postmortem:generate` 経由で `scripts/postmortem/generate-postmortem.ts` を CLI 実行。pure 関数 `generatePostmortem(input)` が markdown 文字列を返す。CLI 層が引数解析・evidence 実在チェック・stdout / 任意 file 出力を担う |
| 追加ファイル | `scripts/postmortem/generate-postmortem.ts`、`scripts/postmortem/__tests__/generate-postmortem.test.ts`、`docs/30-workflows/runbooks/postmortem/template.md`、`docs/30-workflows/runbooks/postmortem/README.md` |
| 変更ファイル | `package.json`（`scripts.postmortem:generate` 追加）、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（rollback 後の postmortem 生成手順への参照リンク追記） |
| CLI contract | `--release vX.Y.Z` `--commit <sha>` `--evidence <dir>` `--rollback-evidence <md>` `--occurred-at <iso8601>`（必須）、`--detected-at` `--resolved-at` `--severity` `--out`（任意）。exit 0 / 1（バリデーション） / 2（I/O） |
| Test coverage | unit line 80%+ / branch 60%+（Phase 9 計測）、CLI smoke 1 件以上（Phase 11） |
| Invariants | なし（運用ツール / docs 追加。`apps/api` `apps/web` の不変条件には触れない） |
| Out of scope | incident response runbook 本文の置換、Slack 通知、GitHub Releases 自動生成、root cause の AI 生成 |
| Error 処理 | `--evidence` path 不在 → exit 1、release/commit 形式不正 → exit 1、`--out` write 失敗 → exit 2。stderr に欠落 path / 不正値を明示 |

#### C12P2-1 型定義

```ts
export type PostmortemInput = {
  release: string;              // /^v\d+\.\d+\.\d+$/
  commit: string;               // /^[0-9a-f]{7,40}$/
  evidencePath: string;         // 09c Phase 11 evidence directory（必須・実在チェック）
  rollbackEvidencePath: string; // rollback 実施記録 path
  occurredAt: string;           // ISO8601（S4 冪等性のため必須）
  detectedAt?: string;
  resolvedAt?: string;
  severity?: string;
};

export type ValidationResult =
  | { ok: true; input: PostmortemInput }
  | { ok: false; reason: string };
```

#### C12P2-2 API シグネチャ

```ts
export function validateInput(raw: Record<string, string | undefined>): ValidationResult;
export function ensureEvidencePathExists(path: string): { ok: boolean; reason?: string };
export function generatePostmortem(input: PostmortemInput): string; // pure
async function main(argv: string[]): Promise<number>; // exit code を返す
```

#### C12P2-3 使用例

```bash
mise exec -- pnpm postmortem:generate -- \
  --release v0.3.1 \
  --commit abc1234def5 \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence outputs/incident/2026-05-05/rollback.md \
  --occurred-at 2026-05-05T10:00:00Z \
  --out outputs/incident/2026-05-05/postmortem.md
```

#### C12P2-4 エラー処理

| 状況 | exit | stderr |
| --- | --- | --- |
| `--evidence` 不在 path | 1 | `evidence path not found: <path>` |
| release / commit 形式不正 | 1 | `invalid <field>: <value>` |
| `--out` write 失敗 | 2 | `failed to write: <path>` (`error.message`) |

#### C12P2-5 設定値

- template 7 見出し（順序固定 / 列追加禁止）: Header / Timeline / Impact / Detection / Response / Root Cause / Prevention / Follow-up Issues
- placeholder 形式: `{{release}}` `{{commit}}` `{{occurredAt}}` 等の二重波括弧。スクリプトは単純文字列置換のみで埋める（テンプレートエンジン依存追加なし）

## Task 12-2: システム仕様書更新サマリー

`outputs/phase-12/system-spec-update-summary.md` に Step 1-A / 1-B / 1-C を必ず記載し、必要に応じ Step 2 を追記する。

### Step 1-A: 更新対象正本仕様の特定

| 仕様 | 更新理由 |
| --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook 配下に「rollback 完了後 24 時間以内に `pnpm postmortem:generate` で postmortem 雛形を生成し、`docs/30-workflows/runbooks/postmortem/README.md` に従い follow-up issue を起票する」セクションを追記。本文置換は行わず、参照リンクのみ追加（S3 runbook 責務分離） |

### Step 1-B: 追記する文面（差分案）

```markdown
## Postmortem 生成（rollback 後の必須運用）

rollback 実行後 24 時間以内に、production 担当者は以下を実施する。

1. `pnpm postmortem:generate` を実行し、`outputs/incident/<date>/postmortem.md` に雛形を生成する。
2. timeline / impact / detection / response / root cause / prevention を人が記入する（**人名・"責任" は書かない**）。
3. Prevention セクションを基に `gh issue create --label type:operations` で follow-up issue を 1 件以上起票する。

詳細手順は `docs/30-workflows/runbooks/postmortem/README.md` を参照。
本タスクは postmortem 生成のみを担い、incident response 手順 / Slack 通知連携は本ファイル既存セクションが正本である。
```

### Step 1-C: drift チェックコマンド

```bash
rg -n "postmortem:generate|runbooks/postmortem" docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
rg -n "postmortem" docs/30-workflows/runbooks/postmortem/README.md
diff <(git show HEAD:docs/00-getting-started-manual/specs/15-infrastructure-runbook.md) docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
```

### Step 2（必須）: aiworkflow-requirements skill 正本仕様の更新判定

- 判定: **更新必要**。
- 理由: unassigned-task から正式 workflow root へ昇格し、`docs/30-workflows/runbooks/postmortem/` と `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に運用入口が増えるため。
- 同一 wave 更新対象: `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`、`.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`、`.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`、`.claude/skills/aiworkflow-requirements/LOGS/`、`.claude/skills/task-specification-creator/LOGS/`。
- `pnpm indexes:rebuild` の要否: aiworkflow-requirements 正本 index を手更新した後に実行し、drift 0 を確認する。

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下の **canonical absolute path** を漏れなく列挙する（最小エントリセット）。

| 区分 | パス | 種別 |
| --- | --- | --- |
| skill 正本 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/task-specification-creator/SKILL.md` | 更新が発生した場合のみ。発生しない場合は「更新なし」と明記 |
| skill 履歴 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/task-specification-creator/LOGS/` | 本タスクの完了 fragment を必須追加 |
| reference 更新 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/task-specification-creator/references/*.md` | 更新が発生したファイルを 1 行ずつ列挙。発生しない場合は「更新なし」 |
| workflow artifacts | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/issue-352-postmortem-template-automation/artifacts.json` | phase12 完了で `phases[12].status` を `completed` に変更 |
| workflow outputs | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/issue-352-postmortem-template-automation/outputs/artifacts.json` | root と parity を保つ |
| outputs（Phase 12 7 ファイル） | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/issue-352-postmortem-template-automation/outputs/phase-12/main.md` 他 6 ファイル | 個別に列挙 |
| system spec | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Step 1-B の差分を適用したコミット hash を記録 |

記録する情報:

- baseline / current の境界（baseline = `main` HEAD 時点、current = 本タスクブランチ HEAD）
- validator 結果（`pnpm typecheck` `pnpm lint` `pnpm vitest run scripts/postmortem`）
- artifacts.json と outputs/artifacts.json の同期確認結果
- Phase 12 7 ファイルの実体存在確認 (`ls outputs/phase-12/`)

## Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` に以下の構造で記載する（**0 件でも出力必須**）。

| 候補 | 判定 | 起票判断 |
| --- | --- | --- |
| Slack 通知連携（postmortem 生成完了を `#incident` channel に通知） | 別タスク責務 | 起票見送り（task-09c-incident-runbook-slack-delivery-001 の責務） |
| GitHub Releases 自動生成（release tag 自動作成） | 別タスク責務 | 起票見送り（task-09c-github-release-tag-automation-001 の責務） |
| postmortem markdown の AI 補完（root cause 候補の自動推論） | open / 別 wave | YAGNI で起票見送り（人が書く前提を維持） |
| postmortem CLI から `gh issue create` を直接叩く統合 | open / 別 wave | runbook README 内の手動手順で十分 / 起票見送り |

SF-03 4 パターン照合結果を必ず記録する:

- パターン A（既存タスクで吸収可能）: 該当 0 件
- パターン B（別 wave で起票推奨）: 該当 0 件（本タスクスコープの完結性を維持）
- パターン C（YAGNI で見送り）: 上記 4 候補すべて
- パターン D（CONST_007 違反: 本タスク内で対応すべき先送り）: 該当 0 件であることを明記

## Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` に章立て **3 観点固定**（テンプレ改善 / ワークフロー改善 / ドキュメント改善）で記載する。**改善なしでも各章に「なし」と理由を記録**する。

### 章 1: テンプレ改善（task-specification-creator）

- 観点: phase-template-phase2 に「pure 関数 / CLI 層」の 2 層構造を推奨例として追記すべきか
- 観点: phase-template-phase12-detail に「runbook 責務分離（既存 runbook 本文を編集しない）」のチェック項目を追加すべきか
- 改善なしの場合は「なし: 既存テンプレで本タスクの 13 phase が 100% 表現できた」と明記

### 章 2: ワークフロー改善（aiworkflow-requirements / 30-workflows 運用）

- 観点: `docs/30-workflows/runbooks/` ディレクトリが新規作成されるが、CODEOWNERS の governance path（`docs/30-workflows/**` は既登録）と整合しているか
- 観点: 未割当タスク（unassigned-task）から正式タスクに昇格する手順の文書化漏れがないか
- 改善なしの場合は「なし」と明記

### 章 3: ドキュメント改善（specs / runbooks）

- 観点: `15-infrastructure-runbook.md` の rollback 章末尾に postmortem 参照リンクを追記する設計が他の runbook（incident response 等）にも適用可能か
- 観点: postmortem README の「7 見出し固定 / 列追加禁止」ルールを skill reference に転記すべきか
- 改善なしの場合は「なし」と明記

## Task 12-6: phase12-task-spec-compliance-check

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下を記載。

- Task 12-1〜12-5 全完了確認（各成果物の path と先頭 5 行抜粋）
- planned wording (`計画`/`予定`/`TODO`/`保留`/`Phase X で対応`) が `outputs/phase-12/` 配下に残っていないことを `rg` で確認:

  ```bash
  rg -n '計画|予定|TODO|保留|Phase \d+ で対応|別 PR で' outputs/phase-12/ || echo "PASS: planned wording 0 件"
  ```

- artifacts.json の `phase12Outputs` と `outputs/phase-12/` 実体ファイルの 1:1 一致確認:

  ```bash
  ls outputs/phase-12/ | sort > /tmp/actual.txt
  jq -r '.phase12Outputs[] | sub("outputs/phase-12/"; "")' artifacts.json | sort > /tmp/expected.txt
  diff /tmp/expected.txt /tmp/actual.txt && echo "PASS: 1:1"
  ```

- root `artifacts.json` と `outputs/artifacts.json` の parity 確認

## 多角的チェック観点

- 不変条件: なし（`apps/api` `apps/web` 触らず）。`apps/web` から D1 直接アクセス禁止（#5）の境界に踏み込んでいないことを念のため確認。
- S1 (blame 排除構造) が implementation-guide / system-spec-update-summary 双方に明示されているか
- S2 (evidence path 必須) が implementation-guide の C12P2-4 エラー処理表に明示されているか
- S3 (runbook 責務分離) が system-spec-update-summary Step 1-B の「本文置換しない / 参照リンクのみ追加」に明示されているか
- S4 (冪等性) が C12P2-1 の `occurredAt` 必須化と C12P2-5 の placeholder 単純置換方針に明示されているか
- S5 (pnpm 統合) が C12P2-3 使用例と Task 12-3 の package.json 編集記録に明示されているか
- 未実装/未実測を PASS と扱わない（Phase 9 / Phase 11 の結果を必ず参照）

## サブタスク管理

- [ ] Part 1（中学生レベル 3 トピック / 「たとえば」最低 1 回）+ Part 2（C12P2-1〜C12P2-5）を含む `implementation-guide.md` 作成
- [ ] `15-infrastructure-runbook.md` の Step 1-A/1-B/1-C を `system-spec-update-summary.md` に記録
- [ ] 必要に応じ Step 2（aiworkflow-requirements 正本仕様更新判定 / `pnpm indexes:rebuild` 要否判定）を追記
- [ ] `documentation-changelog.md` に最小エントリセット（skill 正本 / skill 履歴 / reference / workflow artifacts / outputs / system spec）を canonical absolute path で記録
- [ ] `unassigned-task-detection.md` を 0 件でも出力（SF-03 4 パターン照合）
- [ ] `skill-feedback-report.md` を 3 観点（テンプレ / ワークフロー / ドキュメント）固定で出力（改善なしでも「なし」記録）
- [ ] `phase12-task-spec-compliance-check.md` 作成（planned wording 0 件 / artifacts 1:1 一致確認）
- [ ] `outputs/phase-12/main.md`（Phase 12 全体サマリー）作成
- [ ] artifacts.json `phase12Outputs` と `outputs/phase-12/` 実体 7 ファイルの 1:1 一致確認

## 成果物（artifacts.json `phase12Outputs` と完全一致）

| 成果物 | パス | 必須 |
| --- | --- | --- |
| 集約 | `outputs/phase-12/main.md` | ✅ |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | ✅ |
| 仕様更新サマリー | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 更新履歴 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | ✅ |
| スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | ✅ |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

合計 **7 ファイル** を実体出力する。`artifacts.json` の `phase12Outputs` 配列と 1:1 一致させる（順序不問・件数一致必須）。

## 完了条件

- [ ] Part 1 / Part 2 の implementation-guide.md 完成（Part 1 は順序固定 3 トピック・「たとえば」最低 1 回 / Part 2 は C12P2-1〜C12P2-5 全埋め）
- [ ] `15-infrastructure-runbook.md` への参照リンク追記が Step 1-B に文面案として確定
- [ ] documentation-changelog.md に最小エントリセット（skill 正本 / skill 履歴 / reference / workflow artifacts / outputs / system spec）が canonical absolute path で記録
- [ ] unassigned-task-detection.md が 0 件でも作成
- [ ] skill-feedback-report.md が 3 観点固定で作成
- [ ] phase12-task-spec-compliance-check.md で planned wording 0 件が確認されている
- [ ] artifacts.json `phase12Outputs` と `outputs/phase-12/` 実体 7 ファイルが 1:1 一致
- [ ] root `artifacts.json` と `outputs/artifacts.json` の parity 維持
- [ ] aiworkflow-requirements skill の `indexes/` drift 判定（rebuild 要否）が記録されている
- [ ] aiworkflow-requirements 正本仕様の更新要否判定が記録されている
- [ ] `workflow_state` を `completed` に昇格させていない（本 Phase の責務はドキュメント整備のみ）
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 09c の復活ではなく未割当タスクの正式昇格である旨が implementation-guide に明記
- [ ] 既存 incident response runbook 本文を編集していない（S3）
- [ ] 実装、deploy、commit、push、PR を実行していない（実装本体は Phase 5 / 11 で実行済み、PR は Phase 13 で user 承認後に実行）
- [ ] CONST_007: 「Phase 2 で対応」「別 PR で」等の先送り表現が `outputs/phase-12/` 配下に残っていない

## 次 Phase への引き渡し

Phase 13 へ、PR title 案 / PR body 構成 / approval gate / `implementation-guide.md` の path / 変更ファイル一覧（scripts/postmortem/* / runbooks/postmortem/* / package.json / 15-infrastructure-runbook.md / outputs/phase-12/*）を渡す。
