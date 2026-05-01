# Phase 4: テスト戦略（docs-only ドキュメント整合性検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | legacy-closeout |
| Mode | docs-only / spec_created / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

本タスクは旧 UT-09 を legacy umbrella として閉じる docs-only タスクであり、
runtime コードを生成しない。したがって unit / contract / E2E / authorization
は **N/A** とし、代わりに「ドキュメント整合性検証」スイートを 5 層で定義し、
元仕様 §6 のテストケース（format audit / dependency mapping / stale path scan
/ conflict marker scan）を AC-1〜AC-14 と 1 対多で対応付ける。

## 実行タスク

1. ドキュメント整合性 verify suite を 5 層 × 2〜4 ケース で設計
2. AC（元仕様 §5 完了条件チェックリスト）↔ verify suite matrix を Phase 7 へ引き渡せる粒度で構築
3. 失敗時の差し戻し先（旧 UT-09 ファイル / 03a / 03b / 04c / 09b / 02c / current facts 参照）を確定
4. unit / contract / E2E / authorization が N/A である根拠を明文化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 元仕様（§5 完了条件 / §6 検証 / §7 リスク） |
| 必須 | .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js | 未タスク監査スクリプト |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | D1 / deployment current facts |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 PRAGMA 制約 / branch ↔ env 対応 |
| 参考 | docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | schema sync 移管先 |
| 参考 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | response sync 移管先 |
| 参考 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin sync endpoint 移管先 |
| 参考 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | cron / runbook 移管先 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | spec 整合性検証の正本（form schema） |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | spec 整合性検証の正本（sync_jobs / cursor / current response / consent snapshot） |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | spec 整合性検証の正本（D1 / WAL 非対応 / PRAGMA 制約） |

## 実行手順

### ステップ 1: 5 層 verify suite を設計

下記「Verify suite 設計」セクションに沿って各層の検証コマンドと期待値を確定。

### ステップ 2: AC ↔ verify suite matrix の骨子作成

Phase 7 で完成させる matrix の前段として AC-1〜AC-14 を列挙し各 AC の verify
suite 候補を 1 件以上対応付ける。

### ステップ 3: 失敗時差し戻し先の確定

各 ID（D-1〜D-4 系）について「失敗 → どの phase / どの上流タスクに戻すか」
を明記し、Phase 5 runbook の sanity check と整合する形にする。

### ステップ 4: N/A 根拠の明文化

unit / contract / E2E / authorization は「コード変更ゼロ」「endpoint 新規追加
なし」「権限境界変更なし」を理由に Phase 4 では検証対象外であることを記す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | verify suite を runbook の sanity check に紐付け |
| Phase 6 | 失敗時シナリオを failure case と共通化 |
| Phase 7 | AC matrix の base lines |
| 上流 03a / 03b | 異常系セクションへの SQLITE_BUSY retry/backoff 移植検証を要請 |
| 上流 09b | runbook への pause/resume 移植検証を要請 |

## 多角的チェック観点（不変条件）

- **#1**（実フォーム schema をコード固定しすぎない）: スイートが Forms API
  前提に揃っているか確認、Sheets API 関連テストを増やさない。
- **#5**（D1 直接アクセスは apps/api 限定）: ドキュメント上 apps/web から
  D1 を呼ぶ表現が残らないか stale path scan で副次的に検証。
- **#6**（GAS prototype は本番仕様に昇格しない）: GAS apps script trigger を
  cron 候補として書く文書が残っていないか rg で検出。
- **#10**（無料枠運用）: cron 頻度・100k 内試算が 09b へ移植済みか確認。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | format audit suite 設計 | 4 | pending | audit-unassigned-tasks.js |
| 2 | dependency mapping suite 設計 | 4 | pending | 03a/03b/04c/09b 全件割当 |
| 3 | stale path scan suite 設計 | 4 | pending | rg pattern 確定 |
| 4 | conflict marker scan suite 設計 | 4 | pending | rg pattern 確定 |
| 5 | AC ↔ suite 仮 matrix | 4 | pending | Phase 7 へ引き渡し |
| 6 | N/A 根拠明文化 | 4 | pending | unit/contract/E2E/auth |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略サマリ |
| ドキュメント | outputs/phase-04/verify-suite.md | 5 層 × ケース詳細 |
| ドキュメント | outputs/phase-04/ac-suite-mapping-draft.md | AC ↔ suite 仮対応表 |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 完了条件

- [ ] 5 層 × 2〜4 ケース = 10〜20 ケース が記述済み
- [ ] AC-1〜AC-14 すべてに verify suite 候補が 1 件以上対応
- [ ] 各 suite に確認コマンドと期待値が付与されている
- [ ] unit / contract / E2E / authorization の N/A 根拠が明記されている

## タスク100%実行確認【必須】

- 全実行タスク (1〜4) が completed
- verify-suite.md / ac-suite-mapping-draft.md が outputs/phase-04/ に配置
- artifacts.json の phase 4 を completed に更新

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項: verify suite 5 層 / AC 仮 matrix / 差し戻し先一覧
- ブロック条件: AC に未対応 suite 1 件以上、または stale path scan / conflict
  marker scan の検証コマンドが未確定の場合は次 Phase に進まない

---

## Verify suite 設計（ドキュメント整合性検証 5 層）

### 1. format audit 層（未タスク監査）

| ID | ケース | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| D-1 | 元仕様ファイルが必須 9 セクションを満たす | `node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | current violations 0 |
| D-2 | filename が lowercase / hyphen / `.md` | `ls docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` でファイル存在 + `[A-Z_ ]` 不一致 | 命名規則違反 0 件 |
| D-3 | 苦戦箇所セクションが記入済み | `rg -n "^### 苦戦箇所" docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 1 hit + 4 行（症状/原因/対応/再発防止） |

### 2. dependency mapping 層（責務移管の網羅性）

| ID | ケース | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| M-1 | 旧 UT-09 schema 取得が 03a に割当済み | `rg -l "POST /admin/sync/schema\|forms\\.get\|schema_questions" docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` | 3 keyword 全 hit |
| M-2 | response 取得 / cursor / current response が 03b に割当済み | `rg -l "forms\\.responses\\.list\|member_responses\|current response" docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/` | 3 keyword 全 hit |
| M-3 | 手動同期 endpoint が 04c に割当済み | `rg -l "/admin/sync/schema\|/admin/sync/responses" .claude/skills/aiworkflow-requirements/references/` | 2 endpoint 全 hit |
| M-4 | cron / pause / resume / runbook が 09b に割当済み | `rg -l "cron\|pause\|resume\|incident" docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | 4 keyword 全 hit |

### 3. stale path scan 層（旧パス・旧表記の混入防止）

| ID | ケース | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| S-1 | 旧 UT-09 path / id が新規導線に出現していない | `rg -n "UT-09-sheets-d1-sync-job-implementation\|ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references` | legacy umbrella 文脈以外 0 hit |
| S-2 | Sheets API 表記が新規 sync 仕様として残存していない | `rg -n "Google Sheets API v4\|spreadsheets\\.values\\.get" docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver` | 0 hit |
| S-3 | 単一 `/admin/sync` endpoint や `sync_audit` table が現行仕様に出現していない | `rg --pcre2 -n "/admin/sync(?!/)|sync_audit" .claude/skills/aiworkflow-requirements/references docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary` | 分割 endpoint を除き 0 hit |
| S-4 | `dev / main 環境` 表記が branch 名でなく env 名として残存していない | `rg -n "dev / main 環境\|dev/main 環境" docs/30-workflows/02-application-implementation` | 0 hit |

### 4. spec consistency 層（specs 正本との矛盾検出）

| ID | ケース | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| SP-1 | `responseId` / `publicConsent` / `rulesConsent` の表記が specs/01-api-schema.md と矛盾しない | `rg -n "responseId\|publicConsent\|rulesConsent" docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001 docs/00-getting-started-manual/specs/01-api-schema.md` | キー名が両者で一致（読み替えゼロ） |
| SP-2 | sync_jobs / cursor pagination / current response / consent snapshot の用語が specs/03-data-fetching.md と一致 | `rg -n "sync_jobs\|cursor\|current response\|consent snapshot" docs/00-getting-started-manual/specs/03-data-fetching.md docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001` | 4 用語すべて両者で hit、独自読み替えなし |
| SP-3 | WAL 非対応 / PRAGMA 制約の表現が specs/08-free-database.md と矛盾しない | `rg -n "WAL\|PRAGMA" docs/00-getting-started-manual/specs/08-free-database.md docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001` | 「WAL 前提」「PRAGMA を必須化」などの表現が新規追加されていない |

### 5. conflict marker scan 層（git 衝突跡の根絶）

| ID | ケース | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| C-1 | 正本仕様に conflict marker が残っていない | `rg -n "^(<<<<<<<\|=======\|>>>>>>>)" .claude/skills/aiworkflow-requirements/references` | 0 hit |
| C-2 | 移管先タスク群に conflict marker が残っていない | `rg -n "^(<<<<<<<\|=======\|>>>>>>>)" docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver .claude/skills/aiworkflow-requirements/references docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook` | 0 hit |
| C-3 | 元仕様ファイルに conflict marker が残っていない | `rg -n "^(<<<<<<<\|=======\|>>>>>>>)" docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 0 hit |

## N/A 領域の根拠

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| unit | N/A | runtime コードを追加・変更しない（docs-only） |
| contract | N/A | API endpoint・schema の新規追加なし。`/admin/sync/schema` / `/admin/sync/responses` は 04c の責務 |
| E2E | N/A | UI / 画面遷移を変更しない（NON_VISUAL） |
| authorization | N/A | 認可境界を変更しない。admin gate は 04c が正本 |

## AC ↔ verify suite 仮 matrix（Phase 7 で確定）

| AC | 内容（元仕様 §5 抜粋） | 候補 verify suite |
| --- | --- | --- |
| AC-1 | 旧 UT-09 が legacy umbrella として扱われる | D-1, D-3, S-1 |
| AC-2 | 実装対象が 03a / 03b / 04c / 09b / 02c に分解 | M-1, M-2, M-3, M-4 |
| AC-3 | Forms API 前提に統一 | S-2 |
| AC-4 | `/admin/sync/schema` / `/admin/sync/responses` を正、単一 `/admin/sync` 不採用 | S-3, M-3 |
| AC-5 | SQLITE_BUSY retry / backoff / 短い transaction / batch-size 制限が 03a/03b で追跡 | M-1, M-2（再走時に異常系セクションを grep） |
| AC-6 | sync_jobs 同種 job 排他で 409 Conflict | S-3, M-3 |
| AC-7 | Workers Cron Triggers が 09b runbook で pause/resume/evidence | M-4 |
| AC-8 | dev branch -> staging env / main branch -> production/top-level env が明記 | S-4 |
| AC-9 | apps/web から D1 直接アクセスなし | S-3（02c 範囲）と #5 監査 |
| AC-10 | 必須 9 セクション充足 | D-1 |
| AC-11 | filename lowercase / hyphen | D-2 |
| AC-12 | stale `ut-09-sheets-to-d1-cron-sync-job/` パスを作らない | S-1 |
