# Forms to D1 sync legacy umbrella close-out - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-sync-forms-d1-legacy-umbrella-001 |
| 旧ID | UT-09 |
| タスク名 | Forms to D1 sync legacy umbrella close-out |
| 分類 | 改善 |
| 対象機能 | Google Forms sync / D1 projection / Workers Cron |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 skill準拠検証 |
| 発見日 | 2026-04-27 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

旧 UT-09 は「Sheets→D1 同期ジョブ実装」として作られたが、現在の正本仕様では同期対象が Google Sheets API v4 の行取得ではなく、Google Forms API の `forms.get` と `forms.responses.list` に分割されている。実装責務も 03a schema sync、03b response sync、04c admin endpoint、09b cron/runbook へ分解済みである。

### 1.2 問題点・課題

旧 UT-09 をそのまま実装すると、Forms API sync と Sheets API sync の二重正本が生まれる。さらに単一 `/admin/sync` endpoint、`sync_audit` 前提、`dev / main` 環境表記が、現行の `/admin/sync/schema` / `/admin/sync/responses`、`sync_jobs`、staging / production 運用と衝突する。

### 1.3 放置した場合の影響

実装者が stale な UT-09 を参照すると、`apps/api` に不要な Sheets API 経路や別監査テーブルを追加し、`responseId` / `memberId` / current response / consent snapshot の整合性を壊す可能性がある。未タスク監査でも大文字ファイル名と必須セクション欠落により current violations が残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

旧 UT-09 を新規実装タスクではなく legacy umbrella として閉じ、現行タスク群へ吸収済みの責務と、未反映の品質要件だけを明確に分離する。

### 2.2 最終ゴール

この指示書を読めば、旧 UT-09 を直接実装せず、03a / 03b / 04c / 09b を実装対象にする判断が一意にできる状態にする。あわせて D1 競合対策、WAL 非前提、二重起動防止、cron 検証を現行タスクの受入条件へ反映する。

### 2.3 スコープ

#### 含むもの

- 旧 UT-09 の責務を現行タスクへ対応付ける
- Google Sheets API v4 前提を Google Forms API 前提へ置換する
- `dev branch -> staging env`、`main branch -> production/top-level env` の環境対応を固定する
- D1 current facts を明示する
- WAL 非前提の runtime mitigation を現行タスクへ移植する
- 未タスク監査の必須 9 セクションと lowercase filename に準拠する

#### 含まないもの

- 新しい sync 実装コードの追加
- 03a / 03b / 04c / 09b の Phase 実行そのもの
- commit、push、PR 作成
- stale な `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` パスの作成

### 2.4 成果物

- 本ファイル: `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md`
- 旧 UT-09 置換マッピング
- 現行タスクへ移植する品質要件一覧
- 検証コマンド結果

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03a / 03b / 04c / 09b の index が存在する
- `task-specification-creator` の未タスク監査を使える
- `aiworkflow-requirements` の current facts を参照できる

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | `forms.get`、schema sync、`POST /admin/sync/schema` job 関数の実体 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | `forms.responses.list`、response sync、current response、consent snapshot の実体 |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | `/admin/sync/schema` / `/admin/sync/responses` の admin gate と endpoint expose |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | Workers Cron Triggers、release runbook、incident response |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `sync_jobs` repository と apps/web から D1 直接禁止の境界 |
| 上流 | Cloudflare secret 配備 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` が必要 |
| 下流 | 09a / 09c deploy smoke | staging / production で cron と sync job を確認する |

### 3.3 必要な知識

- Cloudflare Workers Cron Triggers
- Cloudflare D1 と Workers binding
- Google Forms API service account 認証
- `sync_jobs` による同種 job 排他
- D1 write contention と `SQLITE_BUSY` retry/backoff

### 3.4 推奨アプローチ

旧 UT-09 の実装は行わない。現行タスクへの置換関係を記録し、旧 UT-09 に含まれていた有効な耐障害要件だけを 03a / 03b / 09b の検証観点として移植する。

---

## 4. 実行手順

### Phase構成

1. 旧 UT-09 の stale 前提を棚卸しする
2. 現行タスクへの責務移管を確認する
3. 移植すべき品質要件を現行タスクに追記する
4. 監査コマンドで未タスク形式を検証する

### Phase 1: stale 前提の棚卸し

#### 目的

旧 UT-09 のうち、現行仕様と矛盾する記述を明確にする。

#### 手順

1. `Google Sheets API v4`、`spreadsheets.values.get`、単一 `/admin/sync`、`sync_audit` を stale 前提として扱う。
2. 現行仕様では Google Forms API、`/admin/sync/schema`、`/admin/sync/responses`、`sync_jobs` を正とする。
3. `dev / main 環境` は環境名ではなく branch 名として扱い、`dev branch -> staging env`、`main branch -> production/top-level env` に正規化する。

#### 成果物

- stale 前提一覧

#### 完了条件

- stale 前提と現行正本の対応が説明できる

### Phase 2: 責務移管の確認

#### 目的

旧 UT-09 の責務を現行タスクへ漏れなく割り当てる。

#### 手順

1. schema 取得と `schema_questions` upsert は 03a に割り当てる。
2. response 取得、cursor pagination、`member_responses` / `member_identities` / `member_status` 反映は 03b に割り当てる。
3. manual trigger は 04c の `/admin/sync/schema` / `/admin/sync/responses` に割り当てる。
4. cron schedule、pause/resume、release / incident runbook は 09b に割り当てる。

#### 成果物

| 旧 UT-09 の内容 | 現行タスク |
| --- | --- |
| schema 取得・schema upsert | 03a |
| response 取得・cursor pagination・current response | 03b |
| 手動同期 endpoint | 04c |
| cron schedule / deploy / pause / resume | 09b |
| monitoring / alert | 09b / observability guardrails |
| D1 contention / WAL 非前提 | 03a / 03b / 09b |
| secret | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` 方針 |

#### 完了条件

- 旧 UT-09 に direct implementation として残す責務が 0 件である

### Phase 3: 品質要件の移植

#### 目的

旧 UT-09 の有用な知見だけを現行タスクの品質 gate に残す。

#### 手順

1. 03a / 03b の異常系に `SQLITE_BUSY` retry/backoff、短い transaction、batch-size 制限を追加する。
2. 03a / 03b の job 排他は `sync_jobs.status='running'` による同種 job 409 Conflict で統一する。
3. 09b の runbook に staging load/contention test、cron trigger evidence、pause/resume 手順を残す。
4. D1 current facts として `member_responses`、`member_identities`、`member_status`、`sync_jobs`、`schema_versions`、`schema_questions`、`schema_diff_queue` を検証対象にする。
5. 03-serial 由来の legacy 4 テーブル文脈を読む場合は `sync_audit` ではなく現行 `sync_jobs` へ読み替える。

#### 成果物

- 移植要件リスト

#### 完了条件

- WAL 非前提の競合対策が実装タスクと運用タスクの両方で追跡される

### Phase 4: 検証

#### 目的

未タスク形式、skill 準拠、依存関係整合を確認する。

#### 手順

1. `node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` を実行する。
2. `rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references` で stale path 参照を確認する。
3. `rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references` で正本仕様に conflict marker が残っていないことを確認する。

#### 成果物

- 検証コマンド結果

#### 完了条件

- 対象ファイルの current violations が 0 件
- stale path を新規導線として参照していない
- conflict marker が 0 件

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 旧 UT-09 が direct implementation task ではなく legacy umbrella として扱われる
- [ ] 実装対象が 03a / 03b / 04c / 09b に分解されている
- [ ] Google Sheets API 前提ではなく Google Forms API 前提に統一されている
- [ ] `/admin/sync/schema` と `/admin/sync/responses` を正とし、単一 `/admin/sync` を新設しない

### 品質要件

- [ ] `SQLITE_BUSY` retry/backoff、短い transaction、batch-size 制限が 03a / 03b の異常系で追跡される
- [ ] `sync_jobs` の同種 job 排他で二重起動が 409 Conflict になる
- [ ] Workers Cron Triggers は 09b の runbook で pause / resume / evidence まで記録される
- [ ] `dev branch -> staging env`、`main branch -> production/top-level env` が明記されている
- [ ] apps/web から D1 へ直接アクセスしない

### ドキュメント要件

- [ ] 未タスクテンプレートの必須 9 セクションを満たす
- [ ] filename が lowercase / hyphen の監査規則を満たす
- [ ] stale な `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` を作らない
- [ ] Phase 13 相当の commit / PR はユーザー承認まで実行しない

---

## 6. 検証方法

### テストケース

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| format audit | 未タスク必須 heading と filename | current violations 0 |
| dependency mapping | 旧 UT-09 責務の移管先 | 03a / 03b / 04c / 09b に全件割当 |
| stale path scan | 存在しない requested path | 新規正本として参照しない |
| conflict marker scan | 正本仕様の衝突記号 | 0 件 |

### 検証手順

```bash
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md

rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
  docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references

rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references
```

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 旧 UT-09 名で参照する文書が残る | 中 | 中 | 参照検索で新ファイルまたは現行 03a / 03b / 04c / 09b に読み替える |
| Sheets API 実装が誤って追加される | 高 | 中 | Google Forms API (`forms.get` / `forms.responses.list`) を唯一の同期 API と明記する |
| D1 競合対策が legacy task と一緒に消える | 高 | 低 | WAL 非前提、retry/backoff、短い transaction、batch-size 制限を移植要件に残す |
| `sync_audit` と `sync_jobs` が混同される | 中 | 中 | 現行 02c / 03a / 03b / 04c の `sync_jobs` を正とする |
| production で未確認 PRAGMA を実行する | 高 | 低 | Cloudflare official compatible PRAGMA 確認なしに `PRAGMA journal_mode=WAL` を実行しない |

---

## 8. 参照情報

### 関連ドキュメント

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | schema sync の正本 |
| 必須 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | response sync の正本 |
| 必須 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | admin sync endpoint の正本 |
| 必須 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron / release runbook の正本 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | D1 / deployment current facts |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | D1 PRAGMA 制約 |

### 参考資料

- Cloudflare Workers Cron Triggers
- Cloudflare D1 limits and PRAGMA compatibility
- Google Forms API `forms.get`
- Google Forms API `forms.responses.list`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | UT-09 は目的自体は有効だが、現行仕様では Google Forms API sync タスク群へ分割済みで、旧 Sheets API 前提が残っていた |
| 原因 | 00-serial / 03-serial 由来の未タスク台帳が、02-application-implementation の 03a / 03b / 04c / 09b へ同期されきっていなかった |
| 対応 | 旧 UT-09 を legacy umbrella として再定義し、実装責務を現行タスクへ割り当て、耐障害要件だけを移植対象として残した |
| 再発防止 | 未タスクを実装前に `aiworkflow-requirements` の current facts と照合し、既に分割済みなら direct implementation ではなく supersede / migrate として閉じる |

### レビュー指摘の原文（該当する場合）

```text
指定パス docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ は存在しない。
UT-09-sheets-d1-sync-job-implementation.md は未タスクテンプレート未準拠で、現行 Forms sync タスク群と責務が重複する。
```

### 補足事項

このファイルは旧 UT-09 の置換記録であり、新しい実装入口ではない。実装は 03a / 03b / 04c / 09b を起点にする。
