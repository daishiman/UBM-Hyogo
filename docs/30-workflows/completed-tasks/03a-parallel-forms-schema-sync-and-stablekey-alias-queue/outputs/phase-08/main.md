# Phase 8 成果物: DRY / 共通化検証 — forms-schema-sync-and-stablekey-alias-queue

Phase 5 実装に対し、命名 / 型 / endpoint / 共通モジュール候補を Before/After で評価する。

---

## 1. 命名 Before/After

| 項目 | Before（候補） | After（採用） | 理由 |
| --- | --- | --- | --- |
| sync 関数 | runSync / doSync | `runSchemaSync` | 既存 `runSync`（sheets sync）と区別 |
| エラー | Error / FormsError | `ConflictError` / `SyncIntegrityError` | 409 と 500 を route で識別する必要 |
| sentinel | "" / null / "UNKNOWN" | `"unknown"` | DB column `stable_key TEXT NOT NULL` 制約に合致 |
| route | /admin/schema/sync | `/admin/sync/schema` | 他 sync route（`/admin/sync/sheets` 想定）と並列にする |
| middleware | authMiddleware | `adminGate` | 一般会員の auth と命名衝突回避 |

---

## 2. 型 Before/After

| 型 | Before | After | 理由 |
| --- | --- | --- | --- |
| 平坦化結果 | RawFormItem[] のまま | `FlatQuestion`（itemId/questionId/sectionIndex 含む） | sectionIndex を flatten 内で確定させ、下流から item 走査を排除 |
| sync 結果 | unknown / void | `RunResult { jobId, status, revisionId, upserted, diffEnqueued }` | route と test の双方で diff 件数まで確認 |
| env | typeof env | `SchemaSyncEnv { DB, GOOGLE_FORM_ID, … }` | テストで部分的に env を構築する必要 |

---

## 3. endpoint Before/After

| 観点 | Before | After |
| --- | --- | --- |
| 認可 | route 内に if (token != …) | `adminGate` middleware に集約 |
| deps | route 内で client を直接 import | `depsFactory(env)` を route 引数に注入 |
| エラーマップ | 例外そのまま 500 | ConflictError → 409, others → 500 を route で集約 |

---

## 4. 共通モジュール候補

| 候補 | 採否 | 備考 |
| --- | --- | --- |
| `adminGate` を `apps/api/src/middleware/` に切り出し | 採用 | 他 admin 系（`/admin/schema` 一覧 / 7b 紐付け）で再利用可 |
| `formsClient` deps factory を `sync/schema/` から `sync/` 直下に上げる | 不採用（現状） | sheets sync は client 依存が違う。共通化は 8b 後に再検討 |
| `STABLE_KEY_LIST` filter helper（`KNOWN_KEY_SET = new Set(STABLE_KEY_LIST)`） | 採用 | sync 内でクロージャ化。重複生成は 1 sync 1 回に抑制 |
| `RunResult` を共通 type へ昇格 | 不採用（現状） | sheets sync 側で別 shape を採る可能性あり、汎化は時期尚早 |

---

## 5. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 命名比較 | completed |
| 2 | 型比較 | completed |
| 3 | endpoint 比較 | completed |
| 4 | 共通モジュール候補列挙 | completed |
| 5 | DRY 評価 | completed |
