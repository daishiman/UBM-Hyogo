# Phase 04 成果物: テスト戦略（ドキュメント整合性検証 5 層）

## サマリ

本タスクは docs-only / NON_VISUAL のため、unit / contract / E2E / authorization は **N/A**。代わりに 5 層のドキュメント整合性 verify suite を定義し、AC-1〜AC-14 を 1 対多で対応付ける。失敗時の差し戻し先（旧 UT-09 ファイル / 03a / 03b / 04c / 09b / 02c / current facts）を明確化する。

## N/A 領域の根拠

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| unit | N/A | runtime コードを追加・変更しない（docs-only） |
| contract | N/A | API endpoint・schema の新規追加なし。`POST /admin/sync/schema` / `POST /admin/sync/responses` は 04c 責務 |
| E2E | N/A | UI / 画面遷移を変更しない（NON_VISUAL） |
| authorization | N/A | 認可境界を変更しない。admin gate は 04c が正本 |

## 5 層 verify suite サマリ

| 層 | ID prefix | ケース数 | 目的 |
| --- | --- | --- | --- |
| 1. format audit | D-1〜D-3 | 3 | 未タスクテンプレ 9 セクション / lowercase / hyphen / 苦戦箇所セクション |
| 2. dependency mapping | M-1〜M-4 | 4 | 03a / 03b / 04c / 09b への割当キーワード hit |
| 3. stale path scan | S-1〜S-4 | 4 | 旧パス / Sheets API / 単一 endpoint / `sync_audit` / `dev/main 環境` |
| 4. spec consistency | SP-1〜SP-3 | 3 | specs/01 / 03 / 08 と矛盾しない |
| 5. conflict marker scan | C-1〜C-3 | 3 | git 衝突跡 0 件 |

合計: 17 ケース（5 層 × 2〜4 ケース、phase-04.md の規定範囲内）

## 詳細ケース（phase-04.md 「Verify suite 設計」より参照）

### 1. format audit

- D-1: `audit-unassigned-tasks.js --target-file ...` で current violations 0
- D-2: `ls` でファイル存在 + lowercase / hyphen / `.md`
- D-3: `rg "^### 苦戦箇所"` で 1 hit + 4 行（症状 / 原因 / 対応 / 再発防止）

### 2. dependency mapping

- M-1: 03a に `POST /admin/sync/schema` / `forms.get` / `schema_questions` 全 hit
- M-2: 03b に `forms.responses.list` / `member_responses` / current response 全 hit
- M-3: api-endpoints.md に `/admin/sync/schema` / `/admin/sync/responses` 全 hit
- M-4: 09b に cron / pause / resume / incident 全 hit

### 3. stale path scan

- S-1: 旧 UT-09 path / id が新規導線として 0 hit
- S-2: Sheets API 表記 0 hit
- S-3: 単一 `/admin/sync` / `sync_audit` 0 hit（分割 endpoint を除く）
- S-4: `dev / main 環境` 単独表記 0 hit

### 4. spec consistency

- SP-1: `responseId` / `publicConsent` / `rulesConsent` が specs/01-api-schema.md と一致
- SP-2: sync_jobs / cursor / current response / consent snapshot が specs/03-data-fetching.md と一致
- SP-3: WAL / PRAGMA 表現が specs/08-free-database.md と矛盾しない

### 5. conflict marker scan

- C-1: 正本仕様（`.claude/skills/aiworkflow-requirements/references`）で 0 hit
- C-2: 移管先タスク群で 0 hit
- C-3: 元仕様ファイルで 0 hit

## AC ↔ verify suite 仮 matrix（Phase 7 で確定）

| AC | 内容 | 候補 verify suite |
| --- | --- | --- |
| AC-1 | legacy umbrella として扱う | D-1, D-3, S-1 |
| AC-2 | 03a/03b/04c/09b/02c に分解 | M-1, M-2, M-3, M-4 |
| AC-3 | Forms API 統一 | S-2 |
| AC-4 | 分割 endpoint 採用、単一 `/admin/sync` 不採用 | S-3, M-3 |
| AC-5 | SQLITE_BUSY retry/backoff / batch / 短 tx 移植 | M-1, M-2（異常系セクション grep） |
| AC-6 | sync_jobs 排他で 409 | S-3, M-3 |
| AC-7 | Cron Triggers pause/resume/evidence | M-4 |
| AC-8 | dev branch -> staging env / main branch -> production env | S-4 |
| AC-9 | apps/web→D1 直接禁止 | S-3（02c）+ #5 監査 |
| AC-10 | 必須 9 セクション | D-1 |
| AC-11 | filename lowercase / hyphen | D-2 |
| AC-12 | stale ut-09 path 新設禁止 | S-1 |
| AC-13 | specs と矛盾しない | SP-1, SP-2, SP-3 |
| AC-14 | Phase 13 user_approval_required | -（運用 gate、verify 対象外） |

## 失敗時差し戻し先

| 失敗 ID | 差し戻し先 |
| --- | --- |
| D-* | 旧 UT-09 ファイル `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` を再編集 |
| M-1 | 03a の index.md / phase-02.md に追記タスク起票 |
| M-2 | 03b の index.md / phase-02.md に追記タスク起票 |
| M-3 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` 再確認 |
| M-4 | 09b の runbook（phase-05.md）追記 |
| S-* | 該当 hit 箇所を Forms API / 分割 endpoint / `sync_jobs` / 正規環境表記に置換 |
| SP-* | `docs/00-getting-started-manual/specs/` 側を正本として読替 |
| C-* | conflict marker を解消する merge 修正 |

## エビデンス / 参照

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` §5 / §6 / §7
- `.claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js`
- `.claude/skills/aiworkflow-requirements/references/task-workflow.md` / `deployment-cloudflare.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md` / `03-data-fetching.md` / `08-free-database.md`

## 不変条件チェック

| 不変条件 | Phase 04 での扱い |
| --- | --- |
| #1 | S-2 で Sheets API 表記が新規追加されないことを検証 |
| #5 | S-3 で `apps/web` から D1 を呼ぶ表現の不在を副次的に検証 |
| #6 | stale path scan で GAS apps script trigger の不採用を確認 |

## 次 Phase（05 実装ランブック）への引き渡し

1. verify suite 5 層 ID（D-/M-/S-/SP-/C-）
2. AC 仮 matrix
3. 失敗時差し戻し先
4. N/A 根拠（unit/contract/E2E/auth）
