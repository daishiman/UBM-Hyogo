# Phase 6: テスト拡充

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。Phase 4/5 の正常 GREEN に対し、fail path・回帰 guard・境界条件を追加して耐性化の網羅性を担保する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 6（テスト拡充） |
| 依存 | Phase 4（RED）/ Phase 5（GREEN 実装方針） |
| 分類 | NON_VISUAL（`apps/api` のみ） |
| implementation_mode | `new` |
| 主成果物 | fail path / 回帰 guard / 境界条件テストケース集 |

## 目的

Phase 4 の AC 直結ケースに加え、failure path（不正入力・D1 例外）、回帰 guard（正常会員の出力完全一致）、境界条件（hiddenReason のみ更新時の行生成・既存 status 非破壊・空 answers_json）を追加し、耐性化が既存挙動を壊さないことと、欠落の各組合せで安全に劣化することを固定する。

## 実行タスク

- 6.1 fail path（不正 JSON / refine / enum 違反 / tags 空）を 4 ケース追加する。
- 6.2 回帰 guard（正常会員の出力一致 / 既存 setter 無影響 / 削除会員 view）を 4 ケース追加する。
- 6.3 境界（hiddenReason のみ生成 / ensure 非破壊 / 空 answers_json / responseId フォールバック / orphan 0 件 / identity 0 件）を追加する。
- 6.4 ingest 例外時の行保持を間接検証するケースを追加する。
- 6.5 拡充テストの実行コマンドを確定し全 GREEN を確認する。

### 6.1 fail path（不正入力・例外経路）

| 対象 spec | ケース名（`it`） | セットアップ | 期待値 |
|-----------|------------------|-------------|--------|
| member-status.contract.spec | `body 不正 JSON は 404 でなく 400（identity 判定より前に弾く）` | identity あり `m1` | 壊れた JSON body → `res.status === 400`（既存 `invalid json` 経路を回帰確認） |
| member-status.contract.spec | `publishState/hiddenReason 両方欠落は 400（refine）` | identity あり `m1` | body `{}` → `400`（既存 `body 空は 400` の維持確認） |
| member-status.contract.spec | `publishState が enum 外は 400` | identity あり `m1` | body `{ publishState: "invalid_state" }` → `400`（zod `PublishStateZ` 違反） |
| builder.repository.spec | `tags 取得が空でも劣化 view は 200（tags=[]）` | identity あり / status あり / response 無し / `store.memberTags=[]` | `result.profile.tags` が `toEqual([])`・`not.toBeNull()` |

### 6.2 回帰 guard（正常会員の非回帰 = AC-7）

正常会員（identity + status + response すべて存在）の出力が現行と完全一致することを固定する。これが degraded 分岐追加による副作用ゼロの証跡。

| 対象 spec | ケース名（`it`） | 期待値 |
|-----------|------------------|--------|
| builder.repository.spec | `正常会員の view は status を effStatus 経由でも従来と同一` | `MEMBER_IDENTITY_1` + `MEMBER_STATUS_CONSENTED` + `MEMBER_RESPONSE_1` で `result.profile.sections.length > 0`・`result.status.publishState === "public"`・`result.profile.summary.fullName` が fixture 値と一致・`result.profile.responseId` が `MEMBER_RESPONSE_1.response_id` と一致 |
| builder.repository.spec | `is_deleted=1 の正常会員も従来どおり view を返す` | `MEMBER_IDENTITY_DELETED` + `MEMBER_STATUS_DELETED` + response あり → `result.status.isDeleted === true`・`not.toBeNull()`（削除会員でも detail は取得可能のまま） |
| member-status.contract.spec | `正常会員 publishState 更新の after が反映される` | identity+status `m1` → `{ publishState: "public" }` → after 行 `publish_state === "public"`（AC-7） |
| status.repository.spec | `既存 setConsentSnapshot / setPublishState / setDeleted は無影響` | 既存 3 describe（`setConsentSnapshot`/`setPublishState`/`setDeleted`）が GREEN を維持（helper 追加で既存挙動が変わらないこと） |

### 6.3 境界条件

| 対象 spec | ケース名（`it`） | セットアップ | 期待値 |
|-----------|------------------|-------------|--------|
| member-status.contract.spec | `hiddenReason のみ更新でも行欠落から生成し反映する` | identity あり `m_no_status` / status 行無し | body `{ hiddenReason: "退会予定" }` → `200`・after 行存在・`hidden_reason === "退会予定"`・`publish_state` は既定 `"member_only"`（ensure 由来）（境界: hiddenReason のみ更新時の行生成） |
| member-status.contract.spec | `ensure は既存 status を破壊しない（publish_state 温存）` | identity あり / status 行に `publish_state="public"` 既存 | body `{ hiddenReason: "x" }` → after の `publish_state === "public"`（ensure の INSERT OR IGNORE が既存値を上書きしない） |
| builder.repository.spec | `空 answers_json の response でも summary は空で 200` | identity+status あり / response の `answers_json="{}"` | `result.profile.summary.fullName === ""`・`not.toBeNull()`（`extractSummary("{}")` 経路・劣化 view と同じ空 summary 形） |
| builder.repository.spec | `current_response_id が空文字の identity は member_id フォールバック` | identity の `current_response_id=""` / response 無し | `result.profile.responseId` が `identity.member_id` と一致・`.length > 0`（responseId min(1) 充足の境界） |
| migration-0024-backfill.contract.spec | `orphan が 0 件のとき backfill は no-op（COUNT 不変）` | 全 identity に status 行あり | backfill 実行後 `COUNT(*) FROM member_status` 不変（冪等の別側面） |
| migration-0024-backfill.contract.spec | `identity が 0 件でも backfill は安全（エラーなし・0 件挿入）` | `member_identities` 空 | backfill 実行が例外を投げない・`member_status` 0 件のまま |

### 6.4 ingest 例外時の保証（AC-5 補強）

| 対象 spec | ケース名（`it`） | セットアップ | 期待値 |
|-----------|------------------|-------------|--------|
| sync-forms-responses.contract.spec | `新規 identity 直後に member_status 行が立つ（setConsentSnapshot より前）` | 新規 email 1 レスポンス | `runResponseSync` 後 `db.status` に当該 member 行が存在。さらに consent 抽出が default（`unknown`）でも publish_state は `member_only` の既定行が残る（ensure 経路の独立性） |
| sync-forms-responses.contract.spec | `is_deleted=1 の既存会員は consent skip でも行は保持される` | 既存 identity + status `is_deleted=1` | consent skip（`status.is_deleted !== 1` が false）でも member_status 行は破壊されない（既存挙動の回帰確認） |

> ingest 経路で `ensureMemberStatusRow` を `setConsentSnapshot` より前に置くことで、「consent 抽出に到達する前に例外で抜けても行は残る」という設計意図（Phase 2 §2.6 / Phase 3 §3.2 バランスループ）を、行の存在で間接検証する。例外注入が困難な場合は「実行後に必ず member_status 行が存在」で固定し、順序の意図はコードコメントで担保する。

### 6.5 拡充テストの実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/status.repository.spec.ts \
  apps/api/src/repository/__tests__/builder.repository.spec.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/sync/migration-0024-backfill.contract.spec.ts
```

期待: 6.1〜6.4 の追加ケースを含め全 GREEN。既存 spec（`未存在 member は 404` 等）も GREEN を維持。

## 参照資料

- Phase 4（AC 直結 RED ケース）/ Phase 5（実装方針）
- Phase 2 §2.5 status PATCH の 404 境界 / §2.6 ingest 予防
- Phase 3 §3.2 因果ループ（ingest 予防 + backfill + 耐性化の三層）
- `apps/api/src/routes/admin/member-status.ts:18-25`（`PatchBodyZ` refine / zod）
- `apps/api/src/repository/_shared/builder.ts:97-112`（`extractSummary` の空 summary 形）
- `apps/api/src/jobs/sync-forms-responses.ts:381-391`（consent skip 条件 `is_deleted`）

## 成果物

- 本ファイル（Phase 6: fail path / 回帰 guard / 境界条件のケース集）
- 6.1〜6.4 のケース表

## 統合テスト連携

- 6.2 回帰 guard は AC-7（非回帰）の主証跡として Phase 10 の AC 充足判定で参照する。
- 6.3 境界（hiddenReason のみ / 既存非破壊 / 空 answers_json / responseId フォールバック）は Phase 7 の branch coverage 対象（ensure 分岐・degraded 分岐・404 分岐）と対応する。
- 6.4 ingest 補強は AC-5 の網羅性を Phase 9 で確認する。

## 完了条件

- [x] fail path（不正 JSON / refine / enum 違反 / tags 空）を追加した（6.1）
- [x] 回帰 guard（正常会員の出力一致・既存 setter 無影響・削除会員 view）を追加した（6.2）
- [x] 境界（hiddenReason のみ生成 / 既存非破壊 / 空 answers_json / responseId フォールバック / orphan 0 件 / identity 0 件）を追加した（6.3）
- [x] ingest 例外時の行保持を間接検証するケースを追加した（6.4）
- [x] 拡充テストの実行コマンドを確定した（6.5）
