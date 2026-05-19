# Phase 3: 設計レビュー

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 2: [`phase-2-design.md`](./phase-2-design.md)

---

## 1. 設計レビュー観点

| 観点 | 確認内容 |
|------|---------|
| O-1 | shared 既存 6 ファイルと配置・命名・export パターン整合 |
| O-2 | `z.infer` 強制ルールが設計に組み込まれているか |
| O-3 | 配置（`sync-log.ts` 単独ファイル + index.ts re-export 末尾追加）が最小差分か |
| O-4 | consumer 改修の影響範囲が `apps/api/src/sync/` と `apps/api/src/jobs/sync-sheets-to-d1.ts` に閉じているか |
| O-5 | migration 不要性が物理 DDL と SQL bind 値の両面で証明されているか |
| O-6 | `sync_jobs`（#195）契約との混同が構造的に防がれているか |
| O-7 | Phase 1 「真の論点」と Phase 2 「正本値の決定根拠」が論理的に一貫しているか |

---

## 2. shared 既存パターンとの整合

### 2.1 既存 6 ファイルとの比較

| 既存ファイル | export パターン | 本タスク `sync-log.ts` 整合 |
|------|------|------|
| `primitives.ts` | `export const XxxZ = z.enum([...]); export type Xxx = z.infer<typeof XxxZ>` | ✅ 一致 |
| `field.ts` | `z.object({ ... })` + `z.infer` 型 export | ✅ 一致 |
| `schema.ts` | `z.object({ ... })` + `z.infer` 型 export | ✅ 一致 |
| `response.ts` | `z.object({ ... })` + `z.infer` 型 export | ✅ 一致 |
| `identity.ts` | `z.object({ ... })` + `z.infer` 型 export | ✅ 一致 |
| `viewmodel.ts` | `z.object({ ... })` + `z.infer` 型 export | ✅ 一致 |

**結論**: パターン整合 OK。新規 primitive を生やさず、`Iso8601Z` / `NonEmptyStringZ` を再利用する設計は既存と同じ凝集度。

### 2.2 spec ファイル併設パターン

既存 spec: `field.spec.ts` / `identity.spec.ts` / `index.spec.ts` / `response.spec.ts` / `viewmodel.spec.ts`。

本タスクの `sync-log.spec.ts` を併設することで、shared 配下の spec 配置パターンと整合。

### 2.3 命名の妥当性レビュー

| 検討案 | 採否 | 理由 |
|------|------|------|
| `sync.ts` | ✗ | `sync_jobs`（#195）契約と将来共存する余地が消える |
| `sync-log.ts` | ✓ | 物理テーブル `sync_job_logs` の論理単位と一致、将来 `sync-job.ts` 追加可 |
| `sync_log.ts` (snake_case) | ✗ | 既存 shared ファイルが全て hyphen / 単語のみ |
| `syncLog.ts` (camelCase) | ✗ | 同上 |

**結論**: `sync-log.ts` 採用妥当。

---

## 3. `z.infer` 強制ルールの検証

### 3.1 設計上の保証

Phase 2 §2.1 のコード例で `export type SyncLogStatus = z.infer<typeof SyncLogStatusZ>` を明示。`type SyncLogStatus = "running" | ...` の独立宣言は **ファイル内に書かない**ことで物理的に drift 不可。

### 3.2 consumer 側の drift 防止

`apps/api/src/sync/types.ts` の改修後:

```ts
import type { SyncLogStatus, SyncTriggerType } from "@ubm-hyogo/shared";

export type SyncTrigger = SyncTriggerType;
export type AuditStatus = SyncLogStatus;
```

- `export type` の右辺は shared 由来のみ。文字列リテラル union を書かない
- これにより `types.ts` 内での独立宣言再発を構造的に封じる

### 3.3 残存リスク

`apps/api` 配下の他ファイルで誰かが `type Foo = "cron" | "admin" | "backfill"` を再宣言する余地は残る。本 PR では grep / lint で gate しないが、Phase 12 documentation で「sync trigger は `@ubm-hyogo/shared` 由来のみ」と運用ルール化。後続 lint 強化 task で構造的 gate 化。

---

## 4. 配置レビュー

### 4.1 `index.ts` への 1 行追加が最小差分か

```diff
 export * from "./viewmodel";
+export * from "./sync-log";
```

- 既存 6 行は順序・内容ともに不変
- conflict surface 最小（sync-merge 時の resolver 介入不要）
- `viewmodel.ts` の export 名と `sync-log.ts` の export 名で名前衝突なし（`MemberProfileZ` 等と `SyncLogStatusZ` 等は無関係）

### 4.2 export 名前衝突 check

| shared 既存 export 名 | `sync-log.ts` export 名 | 衝突 |
|------|------|------|
| `MemberProfileZ` / `MemberIdentityZ` / `FormFieldDefinitionZ` etc | `SyncLogStatusZ` / `SyncTriggerTypeZ` / `SyncLogRecordZ` | なし |
| `Iso8601Z` / `NonEmptyStringZ` | （再利用のみで再 export しない） | なし |

**結論**: 衝突なし。配置 OK。

---

## 5. consumer 影響範囲レビュー

### 5.1 改修対象ファイル一覧（再掲）

| ファイル | 改修種別 | 影響度 |
|------|------|------|
| `apps/api/src/sync/types.ts` | import + re-export 置換 | 低 |
| `apps/api/src/sync/audit.ts` | `lockTriggerOf` 削除 | 中（function 削除） |
| `apps/api/src/sync/manual.ts` | 文字列リテラル 1 箇所 | 極低 |
| `apps/api/src/sync/scheduled.ts` | 文字列リテラル 1 箇所 + SQL IN 句簡素化 | 中（cursor 計算挙動変化） |
| `apps/api/src/sync/backfill.ts` | 変更なし | - |
| `apps/api/src/sync/index.ts` | 変更なし（types.ts re-export 経由で自動解決） | - |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | trigger bind 値の上流整合のみ確認 | 低 |

### 5.2 contract spec の regression リスク

既存 contract spec:

- `apps/api/src/sync/audit.contract.spec.ts`
- `apps/api/src/sync/manual.contract.spec.ts`
- `apps/api/src/sync/scheduled.contract.spec.ts`
- `apps/api/src/sync/backfill.contract.spec.ts`

これらが `"manual"` / `"scheduled"` を期待値として hardcode していた場合、本 PR で **更新が必要**。Phase 5 実装時に確認し、spec 内の期待値も `"admin"` / `"cron"` に置換する。

### 5.3 `audit-route.ts` / `audit-route.contract.spec.ts` の影響

`audit-route.ts` は `listRecent` の結果を JSON 化して admin UI に返す経路。`AuditRow.trigger` は string 型のまま（具体的に shared `SyncTriggerType` で narrow されていない）のため、route 層の改修は不要。API レスポンス JSON shape は変わらない。

### 5.4 `apps/web` への波及

- `apps/web` 配下は本 PR で触らない
- API レスポンス `AuditRow.trigger` の値が `"manual"` / `"scheduled"` から `"admin"` / `"cron"` に変わるため、`apps/web/src/app/(admin)/admin/audit/**` で表示文字列を hardcode 比較している箇所があれば後続 UI 連携 task で対応
- 本 PR では out of scope として index.md に明示済み

---

## 6. migration 不要性の確認

### 6.1 物理 DDL の不変

`apps/api/migrations/0002_sync_logs_locks.sql` は変更しない。物理 schema は既に canonical 値（`cron|admin|backfill` + `running|success|failed|skipped`）を前提に作成済み。

### 6.2 SQL bind 値の境界

- `audit.ts:startRun` の INSERT bind 値は現在 `trigger` 引数を直接 bind しているため、caller が旧 TS 値（`manual` / `scheduled`）を渡している経路では row 書込値が `admin` / `cron` に変わる。
- `acquireSyncLock()` 側は旧 `lockTriggerOf()` によって既に `cron|admin|backfill` を受け取っていたため、lock row の物理値は不変。
- 本 PR の目的はこの非対称性を消し、`sync_job_logs` と `sync_locks` の双方を shared canonical 値（`cron|admin|backfill`）へ揃えること。したがって migration 不要性の根拠は「DDL 不変 + 値集合が物理 canonical 内に収束すること」であり、「全 SQL bind 値が完全不変」ではない。

### 6.3 既存 row との互換

- 過去 row が物理的に `'manual'` / `'scheduled'` 値を持つ可能性は低い（`lockTriggerOf()` が常に変換するため）
- staging D1 で `SELECT DISTINCT trigger_type FROM sync_job_logs` を Phase 5 着手前 gate として確認し、不一致があれば cursor IN 句を hybrid 維持して fallback retirement task を別途起票する。Phase 11 では同じ結果を evidence として保存する。

**結論**: migration 不要。本タスクは **TS 契約面の drift 解消のみ** で完結。

---

## 7. レビュー結論

| 観点 | 結果 |
|------|------|
| O-1 shared 整合 | ✅ |
| O-2 `z.infer` 強制 | ✅ |
| O-3 最小差分配置 | ✅（index.ts 1 行追加） |
| O-4 影響範囲閉鎖 | ✅（`apps/api/src/sync/` + `jobs/sync-sheets-to-d1.ts` のみ） |
| O-5 migration 不要性 | ✅（物理 DDL 不変。SQL bind 値は shared canonical へ収束し、物理値集合内に収まる） |
| O-6 `sync_jobs` 混同防止 | ✅（index.md `out of scope` + Phase 1 §1.4 副次論点で明示） |
| O-7 論理一貫性 | ✅（Phase 1 §1.3 ≡ Phase 2 §6.2） |

**Phase 5 実装着手 GO**。

---

## 8. Open Question

| # | 問い | 暫定回答 | 確定タイミング |
|---|------|---------|--------|
| OQ-1 | staging D1 の `SELECT DISTINCT trigger_type FROM sync_job_logs` 結果に `'manual'` / `'scheduled'` 値が残っているか | Phase 5 着手前 gate で実測し、Phase 11 に evidence 保存 | Phase 5 pre-gate / Phase 11 |
| OQ-2 | `apps/web/src/app/(admin)/admin/audit/**` で `trigger` 値を hardcode 比較している箇所はあるか | 「Phase 11 で grep 確認、本 PR では out of scope」 | Phase 11 grep / 後続 UI task |
| OQ-3 | `sync_jobs`（#195）契約の `SyncJobStatus = "succeeded"` を将来 shared 化する場合、`sync-log.ts` と `sync-job.ts` を分離するか統合するか | 分離（命名空間の独立性維持）。本 PR では決定保留、#195 着手時に再評価 | #195 着手時 |
| OQ-4 | grep gate を本 PR で `.github/workflows/` に追加するか、後続 lint 強化 task に分離するか | 後続 task に分離（本タスクの SRP を超えるため） | 後続 lint 強化 task |
| OQ-5 | `SyncLogRecordZ` の field 命名を snake_case のまま固定して問題ないか（camelCase 派生 schema を別途用意するか） | snake_case のみ。camelCase 変換は `audit.ts:listRecent` の application 層 mapper が継続担当。派生 schema は YAGNI | 本 PR で確定 |
