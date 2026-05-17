# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 正本同期 |
| 前 Phase | 11 (NON_VISUAL evidence) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | completed |

## 目的

7 必須 output を strict compliance で生成し、本タスクの成果を正本ドキュメントに同期する。

## 7 必須 output

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | outputs/phase-12/main.md | 本タスクの最終 summary（中学生レベル概念説明含む） |
| 2 | outputs/phase-12/implementation-guide.md | 実装ガイド (後続者が読む) |
| 3 | outputs/phase-12/system-spec-update-summary.md | 正本仕様への影響 summary |
| 4 | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴 |
| 5 | outputs/phase-12/unassigned-task-detection.md | 未割当 / 後続 followup 検出 |
| 6 | outputs/phase-12/skill-feedback-report.md | skill / プロンプト改善 feedback |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 strict compliance 検証 |

---

## 1. main.md (要件)

以下を含める:

- タスクメタ情報 (issue 番号 / 採用方針 / 完了状態)
- 変更サマリ (workflow yaml 1 行削除 + repo secret 5 件 + repo variable 9 件複製)
- AC-1〜AC-8 の最終判定 (Phase 09 から転記)
- runtime evidence への link (Phase 11)
- **Phase 12 必須: 中学生レベル概念説明** (200〜400 字程度)

中学生レベル概念説明の draft:

> GitHub には「production」という鍵付き部屋があって、その鍵は `main` ブランチを持つ人だけが
> 持てるルールでした。ところが、毎時 1 回 Cloudflare のログを見に行く「見守り係」も、
> たまたまその鍵付き部屋に置かれていたため、`dev` ブランチから動かそうとすると鍵が無くて
> 入れず、30 日以上ずっと記録が取れない状態でした。
>
> 今回は、見守り係を鍵付き部屋の外に出して、必要な合言葉（secret）を「リポジトリ全体の
> 戸棚」にコピーして持たせる方法を選びました。`production` 部屋自体の鍵は外していないので、
> deploy 担当の他の係の安全はそのまま保たれます。最後に、見守り係が 6 時間連続でちゃんと
> 記録が取れていることを確かめれば、復旧完了です。

---

## 2. implementation-guide.md (要件)

後続者がそのまま実行できる粒度で:

- Step 0〜Step 10 を Phase 06 から要約転記
- user-gate 境界を明示
- 1Password 経由注入のコマンドサンプル
- rollback 計画 (Phase 05 Case 1〜4)
- 「ここを読めば本タスクを再現できる」自己完結性

---

## 3. system-spec-update-summary.md (要件)

正本仕様への影響:

| 正本ドキュメント | 影響 | 詳細 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 追記 | 監視系 / deploy 系の environment 分離原則セクション |
| `.github/workflows/cf-audit-log-monitor.yml` | 変更 | `environment: production` 行削除 |
| repository-level secrets | 追加 | 5 件複製 (CF_AUDIT_D1_TOKEN_PROD 他) |
| repository-level variables | 追加 | 9 件複製 |
| `docs/00-getting-started-manual/specs/00-overview.md` | 影響なし | — |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 影響なし | — |
| CLAUDE.md | 影響なし | — |

不変条件への影響: なし (CLAUDE.md `重要な不変条件` 1〜8 は不変)。

---

## 4. documentation-changelog.md (要件)

| 日時 | 種別 | パス | 変更内容 |
| --- | --- | --- | --- |
| 2026-05-16 | 新規 | `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/` | 仕様書 14 ファイル (index + phase-01〜13) |
| (実装日) | 更新 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 末尾に environment 分離原則セクション追加 |
| (実装日) | 変更 | `.github/workflows/cf-audit-log-monitor.yml` | L39 削除 |
| (実装日) | 更新 | `outputs/phase-02/environment-separation-adr.md` | status: proposed → accepted |
| (実装日) | 更新 (or 移送) | `docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` | 状態を consumed_via_issue_720_followup_spec に同期、または completed-tasks/ に移送 |

---

## 5. unassigned-task-detection.md (要件)

本タスク完了時点で検出された後続 followup を明示的に記録:

### Followup 1: production env 側 monitor 専用 secret 削除

- ID: `followup-issue-720-prod-env-secret-cleanup-001`
- 内容: 移行期間（hourly 6 連続 success 確定後 + 任意の安全期間）が経過したら、`production` environment 側の `CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` / `SLACK_WEBHOOK_INCIDENT` / `EMAIL_WEBHOOK_URL` を削除する
- gate: user 承認後 `gh secret delete --env production`
- 優先度: LOW (運用上の clean-up)
- 前提: 本タスク (issue-720 fix) の 6 連続 success が確定済

### Followup 2: 他 workflow への適用可否

- ID: `followup-issue-720-other-workflows-env-audit-001`
- 内容: Phase 10 の grep 結果に基づき、他に `environment: production` を指定している監視系 workflow が見つかった場合の同方針適用
- gate: 個別判断

### CLOSED Issue #720 fold-state sync

- 原典 unassigned-task (`task-issue-655-cf-audit-log-monitor-production-env-protection-001.md`) の状態を `consumed_via_issue_720_followup_spec` に更新する、または `completed-tasks/` に移送する。
- CLOSED Issue は reopen しない。

### recovery 2nd cycle D'+0 起算

- 本タスク完了後に user が別途実施。本仕様書では only 起算前提が成立したことのみ記録する。

---

## 6. skill-feedback-report.md (要件)

本タスク実行から得た skill / プロンプト改善 feedback:

- `task-specification-creator` skill 適用: 適切に Phase 1-13 を生成できたか
- 「監視系 vs deploy 系」の environment 分離原則を AI が事前に推奨できる judgement gate を skill に追加するか
- 1Password 経由 secret 投入コマンド (`$(op read op://...)`) の boilerplate を skill template に組み込むか
- CLOSED Issue を扱う際の fold-state sync 規約を skill template に追加するか

形式は他タスクの skill-feedback-report.md に合わせる（Anchors / Trigger / Improvement proposals）。

---

## 7. phase12-task-spec-compliance-check.md (要件)

strict compliance 検証:

### 4 条件チェック

| 条件 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| 1. 7 必須 output ファイル存在 | `outputs/phase-12/` に 7 件 | `ls outputs/phase-12/ | wc -l` | PASS / FAIL |
| 2. main.md に中学生レベル概念説明あり | 200 字以上 | grep + wc | PASS / FAIL |
| 3. system-spec-update-summary に正本仕様影響表あり | 1 表以上 | grep | PASS / FAIL |
| 4. documentation-changelog にこの cycle の変更が記録 | 5 行以上 | wc -l | PASS / FAIL |

### 30 種 compact evidence (Phase 12 SSOT)

`.claude/skills/task-specification-creator/references/` の compliance check リストに従い、30 項目を 1 行ずつ PASS / FAIL で記録する。具体項目は本仕様書では列挙しないが、`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/phase12-task-spec-compliance-check.md` の構造を参照する。

### 総合判定

- Local 4 条件 + 30 種すべて PASS、かつ runtime pending boundary が明示されている → `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → user-gated Phase 13 に進める
- 1 件でも FAIL、または runtime evidence を local PASS と誤記 → 該当 Phase に差し戻し

---

## 不変条件

1. 7 必須 output は **すべて** `outputs/phase-12/` 配下に生成する
2. main.md には **必ず** 中学生レベル概念説明を含める (Phase 12 SSOT)
3. CLOSED Issue #720 を reopen しない
4. unassigned-task 原典の状態同期は fold-state sync ルールに従う
5. `phase12-task-spec-compliance-check.md` が PASS でない限り Phase 13 に進めない

## 実行タスク

- [ ] outputs/phase-12/main.md 作成
- [ ] outputs/phase-12/implementation-guide.md 作成
- [ ] outputs/phase-12/system-spec-update-summary.md 作成
- [ ] outputs/phase-12/documentation-changelog.md 作成
- [ ] outputs/phase-12/unassigned-task-detection.md 作成
- [ ] outputs/phase-12/skill-feedback-report.md 作成
- [ ] outputs/phase-12/phase12-task-spec-compliance-check.md 作成 (PASS 判定)

## 完了条件

- [ ] 7 必須 output ファイルすべて存在
- [x] phase12-task-spec-compliance-check が local readiness PASS / runtime pending boundary を明示
- [ ] CLOSED Issue #720 の reopen 無し
- [ ] unassigned-task 原典の状態同期完了

## 次 Phase

- 次: 13 (PR・振り返り)
- 引き継ぎ事項: PASS 確定後に user-gated commit / push / PR
