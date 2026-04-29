# Phase 12 Implementation Guide — reconciliation 実行手順ガイド

> 正本仕様: `../../phase-12.md` §タスク 1
> 本タスクは docs-only / NON_VISUAL のため、「実装」= 「方針統一の進め方」と読み替える。
> 本ガイドは Phase 13 で生成する PR description 草案の根拠となる重要文書。

---

## Part 1: 中学生レベル — 例え話で理解する reconciliation

### 全体導入

学校の文化祭で、A 案（劇）と B 案（合唱）の両方が同時に「正本の出し物」として動き出していた状態を、
先生 1 人の判断で **A 案 1 本に揃え直す段取りの話**です。コードや migration を実際に消す作業は
別の人（別タスク）に任せて、本タスクでは **「どっちに揃えるか」と「揃え方の段取り」を紙に書き残すだけ**
を行います。

### 例え話 1: 二重正本（current Forms 分割方針 vs Sheets 採用方針）

> クラスのアンケート用紙が **2 種類同時に出回っていて**、係の人が両方とも「正本」だと思って配ってしまっている状態。
> 誰かが 1 つに決めないと、回答が混ざってしまい、誰の票が正しいのか分からなくなります。

UT-09 でも同じことが起きていました。Forms 分割方針（A）が legacy umbrella で先に確定していたのに、
別ワークツリーで Sheets 直接実装方針（B）が進んでしまい、PR 直前で「2 つの正本」が衝突していました。
本 reconciliation は、A を正本に決めて B を撤回候補とする **正本宣言** の作業です。

### 例え話 2: 撤回 / 移植マッピング

> B 案（合唱）を捨てる時に、B 案で作ってしまった舞台道具のうち、**「丈夫な釘の打ち方」だけはノートに書き残して**、
> A 案（劇）でも使えるようにします。これが「移植」です。道具そのものは捨てるけれど、知恵だけは残す。

撤回対象（コード / migration / endpoint / Secret / Cron schedule）はノートに「捨てるリスト」として書き、
移植対象（D1 contention mitigation の 5 知見 = retry/backoff・短い transaction・batch-size 制限など）は
「保存するリスト」として 03a / 03b / 09b の品質要件に書き写します。

### 例え話 3: 5 文書同期チェック

> 学級会のしおり 5 冊（legacy umbrella / 03a / 03b / 04c / 09b）を、机に並べて 1 ページずつ見比べて、
> **内容が食い違っていないか確認する作業**です。1 冊だけ古い版が混ざっていると、来週の話し合いが噛み合いません。

Phase 9 で実施した contract-sync-check はこの「並べて見比べる」作業そのものです。Phase 12 では結果を
`system-spec-update-summary.md` に転記し、A 維持なら 5 冊の更新は最小限、B 採用なら 5 冊全部書き換える、
という条件分岐を明文化します。

### 例え話 4: pending と PASS の区別

> 「**まだ走っていないテスト**」は「合格」ではなく「未走」です。pending（実機未走行）と PASS（走らせて合格）を
> ごちゃ混ぜにすると、走らせていないのに通った扱いになって、後で「あれ、本当は通ってなかった」と大事故になります。

UT-09 系で過去に staging smoke が pending のまま「PASS」と書かれていた痕跡があったため、本 reconciliation で
**実機未走行 = pending、合否判定 = PASS / FAIL** を運用ルール 1 として固定します。Phase 11 main.md §6 でも
staging 系を一切 PASS と表記していません。

### 例え話 5（補足）: unrelated 削除を混ぜない

> 文化祭の出し物を 1 本に揃える話し合いの最中に、**全然関係のない「掃除当番表の改訂」を混ぜ込まない**。
> 関係ない議題を混ぜると、文化祭の決定が掃除当番の議論で止まってしまいます。

unrelated verification-report の削除は本 reconciliation PR に混ぜない、を運用ルール 2 として固定します。
Phase 13 GO/NO-GO で混入検出時は NO-GO とします。

---

## Part 2: 技術者レベル — reconciliation 実行手順 / 採用方針別発火条件 / 5 文書同期 / 運用ルール

### 2.1 reconciliation 実行手順（base case = 案 a / 採用方針 A 維持）

1. **Phase 1〜3 成果物の read-only 再確認**
   - `outputs/phase-01/main.md`（4 条件評価 / true issue / Ownership 宣言）
   - `outputs/phase-02/reconciliation-design.md`（撤回 5 軸 / 移植 5 知見 / 5 文書同期チェック手順）
   - `outputs/phase-02/option-comparison.md`（A vs B 比較）
   - `outputs/phase-03/main.md`（base case PASS / 30 種思考法 / open question 6 件 / 運用ルール 2 件）

2. **撤回対象 5 軸 / 移植対象 5 知見の別タスク登録**
   - 撤回対象（軸 → 別タスク ID）:
     | 軸 | 対象 | 別タスク |
     | --- | --- | --- |
     | コード | `apps/api/src/jobs/sync-sheets-to-d1.ts` 系 / `apps/api/src/routes/admin/sync.ts`（単一 endpoint） | B-01: `task-ut09-sheets-impl-withdrawal-001` |
     | migration | `sync_locks` / `sync_job_logs` の up/down 削除 | B-02: `task-ut09-sheets-migration-withdrawal-001` |
     | endpoint | 単一 `/admin/sync` の撤回 / 2 endpoint へ統合 | B-01 内 |
     | Secret | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` の削除 | B-07: `task-ut09-sheets-secrets-withdrawal-001` |
     | Cron schedule | Sheets 単一経路 cron の撤回 / Forms 2 経路維持 | B-01 / B-04 連動 |
   - 移植対象 5 知見（→ 03a / 03b / 09b の AC として継承）:
     1. retry / exponential backoff
     2. short transaction（D1 lock 競合回避）
     3. batch-size 制限
     4. WAL 非前提 / serial write
     5. ledger 排他性確保（`sync_jobs` 単一テーブル）
   - **本タスクでは登録のみ**。実コード変更・migration 削除は B-01〜B-07 で実施する。

3. **option-comparison.md の Phase 9 引渡し**
   - `outputs/phase-09/contract-sync-check.md` で 5 文書 × A/B マトリクスを照合済。Phase 12 では結果を
     `system-spec-update-summary.md` に転記し、A 維持時でも stale 撤回として Step 2 を発火させる対象を確定する。

4. **base case PASS の Phase 13 承認ゲート前提化**
   - `outputs/phase-03/main.md` の base case PASS 判定 + Phase 10 GO 判定を Phase 13 で再確認する。

5. **unassigned-task-detection.md への 10 件検出**
   - open question 6 件 + 追加 4 件 = 10 件。実ファイル起票は `pending_creation` とし、詳細は同ファイル。

### 2.2 採用方針別の発火条件（Step 2 の分岐）

| 採用方針 | Step 2 発火 | aiworkflow-requirements references の更新 |
| --- | --- | --- |
| **A 維持（推奨 / base case）** | **stale 撤回として発火** | current 登録（Forms 分割方針 / `sync_jobs` 単一 ledger / 2 endpoint）を維持しつつ、既存 references / runtime に残る Sheets 系 current 風記述・経路は B-05 / B-10 で撤回・停止する。 |
| **B 採用（要 user 承認）** | **広範囲発火** | `api-endpoints.md`（単一 `/admin/sync`）/ `database-schema.md`（`sync_locks` + `sync_job_logs`）/ `deployment-cloudflare.md`（Sheets 単一 cron）/ `environment-variables.md`（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` 正式採用）/ `topic-map.md` を same-wave 更新。 |

> **本タスクは A 維持で確定（Phase 10 GO 判定）**。Step 2 は「Sheets 採用」では発火しないが、
> stale 撤回としては発火する。stale contract を上書きせず、残存 Sheets 記述・runtime 経路を B-05 / B-10 で除去する。

### 2.3 5 文書同期チェック手順（Phase 9 結果の転記）

| 文書 | チェック項目 | A 採用時 | B 採用時 |
| --- | --- | --- | --- |
| legacy umbrella spec (`task-sync-forms-d1-legacy-umbrella-001`) | 「旧 UT-09 を direct implementation にしない」方針 | 維持 | 更新 |
| `02-application-implementation/03a-.../index.md` | Forms schema sync 責務 | 無変更（双方向リンク追記のみ） | Sheets 前提に再設計 |
| `02-application-implementation/03b-.../index.md` | Forms response sync responseId 解決 | 無変更（双方向リンク追記のみ） | Sheets 前提に再設計 |
| `02-application-implementation/04c-.../index.md` | `/admin/sync*` endpoint 数 / 認可境界 | 2 endpoint 維持（双方向リンク追記のみ） | 単一 endpoint 更新 |
| `09b-.../index.md` | cron schedule / runbook | Forms 2 経路維持（双方向リンク追記のみ） | Sheets 単一経路 |

### 2.4 運用ルール 2 件の運用方法

- **ルール 1（staging smoke 表記）**:
  - pending = 実機未走行
  - PASS = 実機走行 + 合否 OK
  - FAIL = 実機走行 + 合否 NG
  - Phase 12 / Phase 13 で混同検出時は reconciliation タスクを再起票する
  - Phase 11 main.md §6 / 本 implementation-guide でも staging 系は pending と明記

- **ルール 2（unrelated verification-report 削除）**:
  - 本 reconciliation PR には混入させない
  - Phase 13 GO/NO-GO で混入検出時は **NO-GO** とする
  - 削除作業は B-06: `task-verification-report-cleanup-001` として独立 PR で実施

### 2.5 docs-only 境界（本タスクで「やってはいけないこと」）

- `apps/api/src/jobs/sync-sheets-to-d1.ts` 系の削除 → **行わない**（B-01）
- `apps/api/src/routes/admin/sync.ts`（単一 endpoint）の削除 → **行わない**（B-01）
- migration `sync_locks` / `sync_job_logs` の down + 削除 → **行わない**（B-02）
- Cloudflare Secret（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）の削除 → **行わない**（B-07）
- aiworkflow-requirements references の stale 撤回 → **本タスクでは行わない**（B-05）
- Sheets runtime kill-switch / cron 停止 → **本タスクでは行わない**（B-10）
- `pnpm indexes:rebuild` の実行 → **行わない**（drift 解消は B-05）
- unrelated verification-report の削除 → **行わない**（B-06 で独立 PR）
- `wrangler.toml` の `[triggers]` 変更 → **行わない**
- staging 実機 smoke / `wrangler dev` / `curl` → **行わない**（UT-26 staging-deploy-smoke）
- `git commit` / `git push` / PR 作成 → **本 Phase では行わない**（Phase 13）

### 2.6 CLI 規約（別タスク発火時の参照）

- `wrangler` 直接実行は **禁止**。`bash scripts/cf.sh ...` 経由のみ。
- 例: B-07 Sheets Secret 削除時は `bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env production`
- 例: B-02 migration 適用時は `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- 本タスクは docs-only のため CLI は基本不要。別タスクで規約を再掲する。

### 2.7 1Password vault 規約

- 形式: `op://Employee/ubm-hyogo-env/<FIELD>` 固定
- 実値（SA JSON / Bearer / OAuth トークン）の docs 転記は **禁止**
- `.env` には op 参照のみを記述。`scripts/with-env.sh` が `op run --env-file=.env` 経由で動的注入

### 2.8 PR メッセージ草案の元（Phase 13 で活用）

本ガイド + `documentation-changelog.md` + `system-spec-update-summary.md` + `unassigned-task-detection.md` を
PR description の構成要素とする。具体的なテンプレ:

```
## Summary
UT-09 direction reconciliation を docs-only / spec_created で close-out。
base case = 案 a（current Forms 分割方針へ寄せる / 推奨方針 A 維持）。

## What this PR does
- Phase 1〜13 仕様書 + outputs を新規追加（docs/30-workflows/ut09-direction-reconciliation/）
- 5 関連タスクへの双方向リンク追記（legacy umbrella / 03a / 03b / 04c / 09b / ut-09 root / ut-21）
- aiworkflow-requirements references の stale 撤回は含まない（B-05）
- Sheets runtime kill-switch / cron 停止は含まない（B-10）

## What this PR does NOT do（別タスク化）
- Sheets 実装撤回（B-01）
- migration `sync_locks` / `sync_job_logs` 削除（B-02）
- Sheets 系 Cloudflare Secret 削除（B-07）
- 旧 UT-09 root の legacy umbrella 参照復元（B-04）
- references stale audit（B-05）
- unrelated verification-report 削除（B-06）

Refs #94（CLOSED のまま。`Closes` は使用不可）
```

### 2.9 セルフチェック

- [x] Part 1 に 4 つ以上の日常例え話（二重正本 / 撤回・移植 / 5 文書同期 / pending vs PASS / unrelated 削除）
- [x] Part 2 に採用方針 A / B の発火条件分岐
- [x] 5 文書同期チェック表に 5 行
- [x] 運用ルール 2 件が pending/PASS/FAIL の定義付きで記載
- [x] docs-only 境界（コード変更は別タスク）が明文化
- [x] CLI 規約（wrangler 直接禁止 / scripts/cf.sh 経由）明記
- [x] op vault 形式（`op://Employee/ubm-hyogo-env/<FIELD>`）明記
- [x] PR メッセージ草案を Phase 13 引渡し用に内包

---

> **重要**: 本タスクは docs-only。コード変更・migration 削除・Secret 削除・PR 作成は **別タスク**。

状態: spec_created
