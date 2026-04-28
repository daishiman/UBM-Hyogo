# UT-09 direction reconciliation - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-direction-reconciliation-001 |
| タスク名 | UT-09 direction reconciliation |
| 分類 | 改善 |
| 対象機能 | Forms/Sheets to D1 sync |
| 優先度 | 高 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 30種思考法レビュー |
| 発見日 | 2026-04-27 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

現行の `task-sync-forms-d1-legacy-umbrella-001` は、旧 UT-09 を direct implementation として扱わず、Google Forms API の `forms.get` / `forms.responses.list`、`/admin/sync/schema` / `/admin/sync/responses`、`sync_jobs` へ責務分割する方針を定義している。

一方で本ワークツリーには、旧 UT-09 の `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` と、Google Sheets API v4 / 単一 `POST /admin/sync` / `sync_locks` / `sync_job_logs` を前提にした `apps/api` 実装が追加されている。

### 1.2 問題点・課題

このまま PR 化すると、Forms API 系と Sheets API 系の二重正本が生まれる。API 契約、D1 ジョブ台帳、Secret 名、Cron runbook、監査ログ連携が分岐し、後続 03a / 03b / 04c / 09b の実装判断が不安定になる。

### 1.3 放置した場合の影響

- `/admin/sync` と `/admin/sync/schema` / `/admin/sync/responses` の認可境界が競合する
- `sync_locks` / `sync_job_logs` と現行 `sync_jobs` の二重 ledger が発生する
- Google Forms API 前提の current response / consent snapshot と Sheets 行 upsert の責務が混ざる
- 正本仕様へ stale 実装を登録してしまい、後続タスクが誤った contract を参照する

---

## 2. 何を達成するか（What）

### 2.1 目的

UT-09 系同期方針を 1 つに統一し、PR 前に stale 実装・stale 仕様・正本仕様の衝突を解消する。

### 2.2 最終ゴール

次のどちらかを明示的に選び、コード・仕様書・未タスク・正本仕様を同じ方向へ揃える。

| 選択肢 | 内容 |
| --- | --- |
| A: 現行 Forms 分割方針へ寄せる | Sheets API 実装、単一 `/admin/sync`、`sync_locks` / `sync_job_logs`、旧 UT-09 workflow root を撤回し、品質要件だけ 03a / 03b / 04c / 09b へ移植する |
| B: Sheets 実装を採用する | legacy umbrella、03a / 03b / 04c / 09b、api/database/deployment/secrets 正本を same-wave で更新し、Sheets API / 単一 `/admin/sync` を正式 contract にする |

### 2.3 スコープ

#### 含むもの

- `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` の扱い決定
- `apps/api/src/jobs/sync-sheets-to-d1.ts` 系実装の採否決定
- `apps/api/src/routes/admin/sync.ts` と 04c admin endpoint 契約の統一
- D1 ledger を `sync_jobs` に寄せるか、`sync_locks` / `sync_job_logs` を正式採用するかの決定
- 正本仕様と Phase 12 成果物の再同期

#### 含まないもの

- commit、push、PR 作成
- staging 実機 smoke の実施（UT-26 で扱う）

### 2.4 成果物

- 方針決定メモ
- 採用方針に合わせた code/doc/spec 差分
- `unassigned-task-detection.md` と Phase 12 compliance の再判定

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-sync-forms-d1-legacy-umbrella-001` を読む
- 03a / 03b / 04c / 09b の index を読む
- UT-09 実装差分を `git status` / `git diff` で確認する

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | 旧 UT-09 を direct implementation にしない current 方針 |
| 上流 | 03a / 03b / 04c / 09b | Forms sync / admin endpoint / cron runbook の正本 |
| 下流 | UT-26 staging-deploy-smoke | 採用後の実機 smoke 証跡 |

### 3.3 必要な知識

- Google Forms API と Google Sheets API の責務差
- Cloudflare Workers Cron Triggers
- D1 write contention mitigation
- task-specification-creator Phase 12 same-wave sync ルール

### 3.4 推奨アプローチ

既存 current facts と後続タスク整合を優先し、原則は選択肢 A（現行 Forms 分割方針）へ寄せる。Sheets 実装を採用する場合は、正本仕様を広範囲に変更するため、PR 前にユーザー承認を得る。

---

## 4. 実行手順

### Phase 1: 方針決定

1. `task-sync-forms-d1-legacy-umbrella-001` と UT-09 実装差分を比較する。
2. 選択肢 A / B のどちらを採るか決定する。
3. 決定理由を Phase 12 成果物に記録する。

### Phase 2-A: Forms 方針へ寄せる場合

1. Sheets API 実装と単一 `/admin/sync` の差分を撤回対象にする。
2. `sync_locks` / `sync_job_logs` migration を撤回対象にする。
3. 旧 UT-09 workflow root を legacy umbrella 参照へ戻す。
4. WAL 非前提、retry/backoff、短い transaction、batch-size 制限だけを 03a / 03b / 09b へ移植する。

### Phase 2-B: Sheets 方針を採用する場合

1. legacy umbrella の「旧 UT-09 を直接実装しない」方針を更新する。
2. 03a / 03b / 04c / 09b の責務境界を Sheets API / 単一 `/admin/sync` 前提へ再設計する。
3. `api-endpoints.md` / `database-schema.md` / `deployment-cloudflare.md` / `deployment-secrets-management.md` / topic-map / LOGS を same-wave 更新する。
4. staging 実機 smoke を UT-26 へ引き継ぐ。

### Phase 3: 検証

1. `pnpm --filter @ubm-hyogo/api typecheck`
2. `pnpm test apps/api/src`
3. `rg -n "ut-09-sheets-to-d1-cron-sync-job|GOOGLE_SHEETS_SA_JSON|/admin/sync" docs .claude/skills/aiworkflow-requirements/references`
4. `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] Forms 方針または Sheets 方針のどちらか 1 つに統一されている
- [ ] API endpoint 契約が 04c と矛盾していない
- [ ] D1 ledger が `sync_jobs` または `sync_locks` / `sync_job_logs` のどちらかに統一されている
- [ ] Secret 名が正本仕様と実装で一致している

### 品質要件

- [ ] D1 contention mitigation が消えていない
- [ ] 二重起動防止の仕様が一貫している
- [ ] staging smoke pending が PASS と誤記されていない
- [ ] unrelated verification-report 削除を同じ PR に混ぜない方針が決まっている

### ドキュメント要件

- [ ] Phase 12 compliance が PASS / FAIL を実態どおりに示している
- [ ] aiworkflow-requirements 正本へ stale contract を登録していない
- [ ] unassigned-task-detection に本タスクが記録されている

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| direction scan | Sheets / Forms 方針の二重化 | 採用方針以外の direct implementation 導線がない |
| endpoint scan | `/admin/sync` 系 endpoint | 04c と一致 |
| D1 schema scan | `sync_jobs` / `sync_locks` / `sync_job_logs` | 採用方針どおり |
| phase12 scan | compliance / AC matrix | staging pending と方針衝突が正しく表現される |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| stale Sheets 実装を正本登録する | 高 | 中 | 正本更新前に legacy umbrella と 03a/03b/04c/09b を必ず照合 |
| Forms 方針へ寄せる際に D1 contention 知見を失う | 中 | 中 | retry/backoff / short transaction / batch-size 制限を現行タスクへ移植 |
| unrelated verification-report 削除が PR を汚す | 中 | 高 | 別タスク化またはユーザー承認後に整理 |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | current 方針 |
| 必須 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | schema sync 正本 |
| 必須 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | response sync 正本 |
| 必須 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | admin endpoint 正本 |
| 必須 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron runbook 正本 |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | UT-09 の Sheets API 実装が、現行正本（Forms API 分割方針）と衝突していた。Phase 12 review まで衝突が表面化しなかった |
| 原因 | task-sync-forms-d1-legacy-umbrella-001 で旧 UT-09 を legacy umbrella として閉じる方針を定めたが、別ワークツリーで旧 UT-09 の直接実装を進めてしまった |
| 対応 | Phase 12 review の 30 種思考法で衝突を検出し、PR blocker として formalize。task-ut09-direction-reconciliation-001 として明文化した |
| 再発防止 | 実装開始前に task-sync-forms-d1-legacy-umbrella-001 と aiworkflow-requirements の current facts を照合し、legacy umbrella タスクに該当しないか確認する |

### 作業ログ

- 2026-04-27: UT-09 Phase 12 review で、legacy umbrella と Sheets API 実装の衝突を PR blocker として formalize。

### 補足事項

- 本タスクは方針統一が目的であり、commit / push / PR 作成は含まない。
- `task-sync-forms-d1-legacy-umbrella-001` が current facts の起点であるため、Sheets 実装を正式採用する場合は正本仕様の広範囲更新が必要。
