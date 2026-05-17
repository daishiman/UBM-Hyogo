# serial-05 step-03 schema alias rollback / undo 経路追加 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | serial-05-step-03-followup-004-schema-alias-rollback-undo                                       |
| タスク名     | SchemaDiffPanel alias resolve の rollback / undo UI + API 経路追加                              |
| 分類         | 改善 / 運用リスク低減                                                                           |
| 対象機能     | `/admin/schema` SchemaDiffPanel での alias resolve 取り消し（rollback / undo）                  |
| 優先度       | 中                                                                                              |
| 見積もり規模 | 中規模                                                                                          |
| ステータス   | pending                                                                                         |
| 発見元       | serial-05 step-03 Phase 12 後続候補                                                             |
| 発見日       | 2026-05-17                                                                                      |
| 依存タスク   | `serial-05-step-03-followup-003-schema-alias-history-view`（履歴 UI）推奨                       |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/`
- 親タスク状態: `completed`（本 followup は 親 step 完了後の独立タスク）
- 関連 outputs:
  - `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md`
  - `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`（§3 後続候補「alias rollback / undo」）
- 関連実装:
  - `apps/web/src/components/admin/SchemaDiffPanel.tsx`
  - `apps/web/src/lib/admin/api.ts`（`postSchemaAlias()`）
  - `apps/api/src/routes/admin/schema.ts`（`GET /admin/schema/diff` / `POST /admin/schema/aliases`）
  - D1 migration: `apps/api/migrations/0008_create_schema_aliases.sql` / `0008_schema_alias_hardening.sql` / `0011_identity_aliases.sql`
- 関連仕様:
  - `docs/00-getting-started-manual/specs/11-admin-management.md`
  - `docs/00-getting-started-manual/specs/01-api-schema.md`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-05 step-03 で `/admin/schema` に SchemaDiffPanel を追加し、Google Form schema diff（added / changed / removed / unresolved）に対し管理者が stableKey を入力して `POST /admin/schema/aliases` で resolve できる経路を提供した。この経路は片方向であり、一度 resolve された alias を UI から取り消す経路は存在しない。

実運用では、resolve 時に以下の誤操作が起こり得る:

- 入力ミスで誤った stableKey に紐付けた（例: `full_name_kana` を `full_name_kanji` と取り違え）
- 仕様判断が後から覆り、別 stableKey への再配置が必要になった
- queued diff を同一 stableKey に重複 resolve した

現状これらが発生すると、admin actor は D1 に対して直接 SQL を実行する以外に修正手段がなく、`scripts/cf.sh d1 execute` 経由でのオペレーションが恒常化している。

### 1.2 問題点・課題

- 質問応答が誤 stableKey に紐付けされたまま集計に取り込まれ、`stable_key_aliases` を経由した join 結果が汚染される
- D1 直接修正は audit log を残せず、いつ誰が何を取り消したかが追跡不能（`cf_audit_log` に手動 row 投入も実態と乖離）
- CLAUDE.md 不変条件「D1 直接アクセスは `apps/api` に閉じる」と整合しない例外運用が常態化
- `11-admin-management.md` が定義する「操作はすべて API + 監査ログを通る」原則が SchemaDiffPanel だけ満たされない
- 後続の `followup-003 history view` が出ても、閲覧のみで rollback 経路がなければ運用負荷は減らない

### 1.3 放置した場合の影響

- 誤 resolve の発見が遅れた場合、`schema_aliases` を参照する集計 view / report がサイレントに不正値を返し続ける
- D1 直接修正の事故率上昇（schema_aliases 以外の row を巻き込む UPDATE / DELETE のリスク）
- 管理者の心理的負荷増（一度の入力ミスがすぐに recover できない）により resolve 操作自体が遅延、queued diff が滞留
- 監査要件（誰が何を取り消したか）に対する説明責任を果たせない

---

## 2. 何を達成するか（What）

### 2.1 目的

SchemaDiffPanel から誤 resolve を **API + 監査ログ経由で** 取り消せる経路を提供する。UI は「rollback（履歴から特定 entry を指定して取消）」と「undo（直近 resolve のクイック取消）」の二系統を用意し、いずれも `cf_audit_log` に記録する。

### 2.2 最終ゴール

- SchemaDiffPanel に rollback / undo 操作 UI が組み込まれ、admin actor が D1 直接アクセスなしに誤 resolve を取り消せる
- rollback / undo 操作自体が audit log に記録され、誰が・いつ・どの alias を取り消したかが追跡可能
- 集計影響範囲（再集計の要否）が UI 上で確認可能
- `11-admin-management.md` に rollback / undo の操作仕様が追記される

### 2.3 スコープ

#### 含むもの

- **UI（`SchemaDiffPanel.tsx`）**
  - 履歴ベース rollback: followup-003 が提供する履歴一覧から特定 alias entry を選び、確認 modal を経て取消
  - クイック undo: 直近 resolve から N 分以内（既定 5 分）に限り、トースト等の即時 UI から 1 click 取消
  - 取消確認 modal: 影響範囲（紐付け済み応答件数 / 再集計要否）を表示
- **API（`apps/api/src/routes/admin/schema.ts`）**
  - 既存 endpoint surface 維持原則を踏まえつつ、rollback semantics は別 endpoint として追加判断（`POST /admin/schema/aliases/:aliasId/rollback` 形式を第一候補）
  - 同一 endpoint に `op=rollback` body を追加する案との比較を spec 内で明示し、`01-api-schema.md` 既存規約と整合する側を採用
- **audit trail**
  - rollback / undo 操作自体を `cf_audit_log` に `schema_alias.rollback` action として記録
  - 元 resolve の `auditId` を `relatedAuditId` として保持
- **D1 schema 判断**
  - 既存 `schema_aliases` row の物理 DELETE vs soft delete（`deleted_at` 列追加）を §3 で判断
  - soft delete を採用する場合、新規 migration（`00NN_schema_alias_soft_delete.sql`）を追加し、`stable_key_aliases` を join する側の WHERE 条件を更新

#### 含まないもの

- followup-003（schema alias history view）の UI 実装本体（依存先）
- 集計バッチの再実行ロジック（影響範囲表示までを本タスク、再集計実行は別 followup）
- bulk rollback（複数 alias の一括取消は別 followup）
- admin notification（rollback 発生時の通知は別 followup）

### 2.4 成果物

- `apps/web/src/components/admin/SchemaDiffPanel.tsx` に rollback / undo UI 追加
- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` に新規 spec 追加
- `apps/web/src/lib/admin/api.ts` に `rollbackSchemaAlias()` helper 追加
- `apps/web/src/lib/admin/__tests__/api.spec.ts` に対応 spec
- `apps/api/src/routes/admin/schema.ts` に rollback endpoint 追加
- D1 schema 変更が必要な場合 `apps/api/migrations/00NN_schema_alias_soft_delete.sql`
- `docs/00-getting-started-manual/specs/11-admin-management.md` に rollback / undo 操作仕様追記
- `docs/00-getting-started-manual/specs/01-api-schema.md` に新 endpoint 追記

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 集計済み応答データの rollback semantics

resolve 済みの alias が既に集計に取り込まれている場合、rollback で alias row を消すだけでは集計結果は古い stableKey 紐付けのまま残る。

- **判断ポイント**: rollback は (a) alias row の状態のみ戻し、再集計は別タスクで明示実行とするか、(b) rollback 時に集計影響範囲を計算し、再集計フラグを `schema_diff_queue` に書き戻すか
- **初期方針候補**: (a) を採用。UI には「影響応答件数 N 件」「再集計が必要」を warning 表示し、再集計実行は admin actor が followup-005（仮）から明示トリガする
- **検証要件**: rollback 後に集計 view を query して値が変わらないことを spec 化

### 3.2 D1 transaction 境界

rollback は `schema_aliases` 削除（または soft delete）+ `cf_audit_log` insert + `schema_diff_queue` の status 戻し（resolved → queued）の 3 操作を含む。

- D1 は transaction 単位の制約があるため、3 操作を 1 batch で実行できるか検証
- 失敗時の中間状態（alias は消えたが audit log は残らない等）を許容しない設計が必要
- Worker 側で `db.batch([...])` の atomicity 保証範囲を確認

### 3.3 並列 resolve / rollback の競合

同一 stableKey に対し複数 admin actor が並列で resolve / rollback を行うケース:

- A が resolve → B が別 stableKey に rolling forward → A が rollback、を想定したロック戦略が必要
- 楽観ロック（`schema_aliases.version` 列導入）か悲観ロック（`schema_diff_queue.lock_owner`）かを判断
- followup-003 の history view が並列タイムラインを表示できるかと連動

### 3.4 admin actor 権限分離

resolve 権限と rollback 権限は同一 admin role に集約するか分離するか。

- 初期方針: 同一 admin role で両方可（既存 `/admin/*` の RBAC 粒度と整合）
- 監査要件として rollback だけは追加確認（confirm modal で actor email 再表示等）を必須化
- 将来 `admin:senior` 等の上位 role を導入する場合の拡張余地を spec に明記

### 3.5 D1 schema 変更の有無判断

- **物理 DELETE 案**: schema 変更不要、ただし audit log のみで履歴復元する必要があり history view 実装が重くなる
- **soft delete 案**: `schema_aliases.deleted_at` 列追加が必要。`stable_key_aliases` 等の join 側で `WHERE deleted_at IS NULL` を追加するため影響範囲広い
- **初期方針**: soft delete を採用（followup-003 history view との親和性と監査要件）。migration plan は §4 AC-5 で確定

---

## 4. 受入条件 (AC)

- **AC-1**: `SchemaDiffPanel` に rollback UI（履歴一覧 → 確認 modal → API 呼び出し）と undo UI（直近 resolve から 5 分以内のクイック取消）が実装され、`SchemaDiffPanel.component.spec.tsx` で両経路のハッピーパス / 失敗パスが検証される
- **AC-2**: `apps/api/src/routes/admin/schema.ts` に rollback endpoint が追加され、`schema_aliases` row の soft delete + `schema_diff_queue.status` の `resolved → queued` 戻し + `cf_audit_log` への `schema_alias.rollback` action 記録が **同一 transaction（`db.batch()`）** で実行される
- **AC-3**: rollback / undo 操作自体が `cf_audit_log` に記録され、元 resolve の `auditId` を `relatedAuditId` として参照可能
- **AC-4**: 影響範囲（紐付け済み応答件数・再集計要否）が rollback 確認 modal に表示され、再集計実行は本タスクのスコープ外であることが UI 上明示される
- **AC-5**: soft delete 採用の場合、新規 migration `apps/api/migrations/00NN_schema_alias_soft_delete.sql` が `schema_aliases.deleted_at` 列を追加し、`stable_key_aliases` を参照する既存 SQL が `WHERE deleted_at IS NULL` を含むよう更新済み。staging への apply 計画が spec に記載
- **AC-6**: `docs/00-getting-started-manual/specs/11-admin-management.md` に rollback / undo の操作仕様（権限・confirm modal 仕様・audit 記録項目）が追記済み
- **AC-7**: `docs/00-getting-started-manual/specs/01-api-schema.md` に rollback endpoint（path / request / response / error 体系）が追記済み
- **AC-8**: design token は OKLch 系の既存 token のみ使用。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を追加しない（CI gate `verify-design-tokens` を pass）
- **AC-9**: 新規 test ファイルは `*.spec.{ts,tsx}` 命名のみ（`*.test.*` 禁止 / `block-test-suffix` lefthook を pass）
- **AC-10**: 並列 resolve / rollback の競合シナリオ（§3.3）が spec 化され、楽観 or 悲観ロックの採用判断が記録される

---

## 5. 依存関係

| 依存先 | 関係 | 備考 |
| --- | --- | --- |
| `serial-05-step-03-followup-003-schema-alias-history-view` | 推奨（強依存ではない） | 履歴 UI 経由 rollback のため。先行が望ましいが、暫定的に rollback API のみ先行実装し UI 統合を後追いする縮退案も可 |
| `serial-05-step-03-schema-diff-resolve` 親 step | 完了済み前提 | `SchemaDiffPanel` / `postSchemaAlias` の存在を前提 |

---

## 6. 状態語彙

| 状態 | 意味 |
| --- | --- |
| `pending` | 未着手 |
| `in_progress` | 実装中 |
| `implemented_local_runtime_pending` | 実装完了・staging runtime 未検証 |
| `completed` | staging runtime 検証完了・本 followup を consumed としてマーク可能 |

完了時には `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3 後続候補から「alias rollback / undo」を consumed に更新する。

---

## 7. 参照資料

- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/api.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/migrations/0008_create_schema_aliases.sql`
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/migrations/0011_identity_aliases.sql`
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション 不変条件1（既存 API のみ接続）/ 不変条件4（D1 直接アクセス禁止）
