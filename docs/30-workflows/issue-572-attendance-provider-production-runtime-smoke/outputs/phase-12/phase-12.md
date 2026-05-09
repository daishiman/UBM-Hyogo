# Phase 12: ドキュメント整備（6 必須タスク）— 索引

> **CONST_004 / CONST_005 準拠の実装仕様書**。task-specification-creator skill 規定の 6 必須タスクを整備し、attendanceProvider DI 完了化 production runtime smoke の判断・実装プロセスを Part 1（中学生レベル）/ Part 2（技術者レベル）両面で説明する仕様。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | implemented-local / production runtime smoke は Phase 11 で取得 |
| 親 Issue | #572（CLOSED） |
| 関連 Issue | #531 / #371 / #571（すべて CLOSED） |
| workflow_state ルール | local 整備は `implemented-local`。Phase 11 の production smoke 完遂後に `PASS_RUNTIME_VERIFIED` を documentation に反映。`PASS` 単独表記は禁止。 |

## 目的

attendanceProvider DI 完了化の production runtime smoke 完遂プロセスを Part 1 / Part 2 両面で説明し、aiworkflow-requirements `references/` / `topic-map` / `keywords` への SSOT 反映、未タスク検出、skill feedback、compliance check を整備する。本仕様書は **#572 / #371 / #531 / #571 すべて CLOSED 後のレトロスペクティブ記録** としても機能する。

## Step 0: P50 チェック（必須）

- [ ] Phase 11 NON_VISUAL runtime evidence 9 ファイルが実体配置済（production smoke は user gate 解除後）
- [ ] 親 Issue #371 を `PASS_RUNTIME_VERIFIED` / `completed` に昇格する commit hash を確認（user gate 解除後）
- [ ] `redact-filter-zero-hit.log` が 0 hit（user gate 解除後）
- [x] aiworkflow-requirements `references/` 反映先が確定

## 6 必須タスクと成果物

| # | 必須タスク | 成果物 |
| --- | --- | --- |
| 1 | implementation guide（中学生レベル + 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| 2 | aiworkflow-requirements SSOT 反映ログ | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | docs / SSOT 更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 4 | 残課題（unassigned）検出（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | task-specification-creator skill への feedback（3 観点） | `outputs/phase-12/skill-feedback-report.md` |
| 6 | spec compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 各成果物の必須内容

### 1. `implementation-guide.md`

- **Part 1（中学生レベル / 比喩 = 出席簿）**: 「クラスの出席簿は、誰がいつ来たかを並べた『リスト（配列）』。誰がリストを用意するかをはっきり決めておかないと、本番で『出席簿が空のまま』になる事故が起きる。今回は『誰が用意するか』をクラスの仕組み（DI）に正式登録し、本番で出席簿が必ず配列として返ってくることを 2 つの画面（管理者用・本人用）で確かめた」を 200-300 字で説明。
- **Part 2（技術者レベル）**: 以下を含める。
  - data flow: `Hono route handler` → `attendanceProvider` (DI-bound) → `D1 binding` → `MemberDetail` / `MeProfile` response → `.attendance: AttendanceEntry[]`
  - DI-bound evidence: `.attendance | type == "array"` を `/admin/members/:memberId` と `/me/profile` 双方で確認
  - production smoke の read-only GET 限定理由（副作用回避 / Google Form 仕様への影響回避）
  - redact filter（cookie / Bearer / cf-* / OAuth secret / email / fullName 実値の禁則 grep）
  - 親 Issue #371 の状態遷移: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` → `completed`
  - 関連 Issue 群（#531 / #371 / #571 / #572）すべて CLOSED の relationship 図
  - API contract `MemberDetail.attendance` / `MeProfile.attendance` は不変（DI 配線の確定のみ）
- 期待行数: 150-300 行

### 2. `system-spec-update-summary.md`

aiworkflow-requirements への反映ログ:

- `references/api-contracts.md` の編集箇所（`/admin/members/:memberId` / `/me/profile` の `.attendance` 型確定）
- `references/task-workflow.md` の編集箇所（issue-371 を `PASS_RUNTIME_VERIFIED` / `completed` に昇格）
- `references/lessons-learned.md` の編集箇所（production runtime smoke を summary-only で取る運用パターンの追加）
- `indexes/keywords.json` に追加するキーワード候補: `attendanceProvider`, `production-runtime-smoke`, `PASS_RUNTIME_VERIFIED`, `redact-filter-zero-hit`, `DI-bound-evidence`
- topic-map の状態語彙更新内容（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` 遷移パスの明記）
- `pnpm indexes:rebuild` 実行コマンドと再生成 evidence 保存先（`outputs/phase-12/indexes-rebuild.log`）
- 親 Issue #371 昇格 commit hash の記載
- 関連 Issue #531 / #371 / #571 / #572 すべて CLOSED の retrospective 記述
- 期待行数: 60-150 行

### 3. `documentation-changelog.md`

新規 / 編集ファイルを表形式で列挙:

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/` | 新規 | 本仕様書一式（13 phase + outputs） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 編集 | issue-371 を `PASS_RUNTIME_VERIFIED` / `completed` に更新 |
| `.claude/skills/aiworkflow-requirements/references/api-contracts.md` | 編集 | `.attendance` array 型の DI-bound 確定記述 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | 編集 | production runtime smoke summary-only 運用 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | キーワード追加（5 件） |

期待行数: 40-80 行

### 4. `unassigned-task-detection.md`

**0 件でも出力必須**。後続タスク化候補:

- production POST/PUT/DELETE smoke の evidence 取得（本タスクは read-only GET のみ）
- DI-bound evidence の自動 regression test 化（手動 smoke を CI gate に昇格）
- redact filter の自動 enforcement 化（grep gate を CI に組込）
- 関連 Issue #531 / #371 / #571 / #572 のレトロスペクティブ統合レポート（任意）

該当なしの場合は「検出なし」と明記し、判定理由（スコープ完結を確認した evidence ファイル名）を併記する。

期待行数: 30-80 行

### 5. `skill-feedback-report.md`

task-specification-creator skill への feedback。**3 観点固定**:

1. **テンプレート観点**: NON_VISUAL evidence の必須ファイル化（Phase 11 の 9 ファイル）が production runtime smoke タスクで再利用できたか / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` 遷移語彙の事前確定が機能したか
2. **ワークフロー観点**: G1-G4 multi-stage approval gate と user gate（Phase 11 production smoke / Phase 13 PR 作成）の境界が明示できたか / 親 Issue 昇格 commit と子タスク PR の責務分離が機能したか
3. **ドキュメント観点**: redact filter zero-hit ルール（cookie / Bearer / cf-* / OAuth secret / email / fullName 実値の禁則）が summary-only evidence の運用パターンとして再利用可能か / レトロスペクティブ仕様書（CLOSED Issue 群の記録）として task-specification-creator のテンプレに昇格させるべきか

期待行数: 50-100 行

### 6. `phase12-task-spec-compliance-check.md`

compliance 検証チェックリスト:

- [ ] Phase 1-13 すべてに index.md からの参照が通っている
- [ ] artifacts.json の `phases.phase-N.outputs` がすべて実体ファイルと一致
- [ ] Phase 12 6 必須成果物がすべて実体配置
- [ ] Phase 11 NON_VISUAL evidence 9 ファイルが実体配置
- [ ] index.md `claudeCodeContext` の値が Phase 13 の `gh pr create` 引数と一致
- [ ] `PASS` 単独表記が outputs 配下に存在しない（grep 確認）
- [ ] redact filter zero-hit ログが 0 hit
- [ ] 親 Issue #371 昇格 commit hash が `production-smoke-summary.md` と `system-spec-update-summary.md` の双方に記載
- [ ] CI `verify-indexes-up-to-date` gate clean
- [ ] CONST_004 / CONST_005 「実装仕様書」明示が冒頭に存在

期待行数: 50-100 行

## DoD

- [ ] 6 必須成果物すべて実体配置
- [ ] `implementation-guide.md` に Part 1 / Part 2 両方が含まれる
- [ ] `unassigned-task-detection.md` が 0 件の場合でも判定理由付きで存在
- [x] `system-spec-update-summary.md` に `pnpm indexes:rebuild` evidence への参照
- [ ] `system-spec-update-summary.md` に親 Issue #371 昇格 commit hash の記載（user gate 解除後）
- [ ] 関連 Issue #531 / #371 / #571 / #572 すべて CLOSED のレトロスペクティブ記述
- [x] workflow_state は `implemented-local`。production smoke evidence で `PASS_RUNTIME_VERIFIED` を最終確定

## 成果物

- `outputs/phase-12/phase-12.md`（本ファイル / 索引）
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 次 Phase の前提条件

6 必須成果物すべての実体配置と compliance check PASS。
