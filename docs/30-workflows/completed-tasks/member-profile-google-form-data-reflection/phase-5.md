# Phase 5: 実装

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 5 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 4（RED test 確定）完了。TC-01〜12 が現状 FAIL |
| 主担当 | Lane A / Lane B / Lane C |
| ゴール | Phase 4 の RED test を最小差分で GREEN にし、Lane C 復旧 runbook を作成する |
| 不変条件 | `apps/web` 非接触（#1）/ D1 migration・Form schema・cron 間隔 非変更（AC-G2）/ D1 操作は `cf.sh` 経由（#3）/ commit・PR・deploy・staging mutation は user-gated（#6） |

## 目的

真因 RC-3（schema_questions 空）に対し、(A) qidMap を schema_questions 非依存化して raw form fallback を効かせ、(B) fail-silent を検知して `SYNC_ALERTS` に記録し、(C) 復旧 runbook を整備する。各 Lane の「新規作成 / 修正」ファイル・関数シグネチャ・before/after 概念・差分方針を後続実装者がそのまま適用できる粒度で確定する。

## 実行タスク

### TECH-M-01 確定: `rawFormToStableKeyMap` の配置先

**決定: `packages/integrations/google/src/forms/mapper.ts` の named export とする。**

| 候補 | 採否 | 理由 |
|------|------|------|
| `mapper.ts` の named export | ✅ 採用 | `deriveStableKey` / `STABLE_KEY_BY_LABEL` と同階層・同責務（ラベル→stableKey 解決の正本）。`client.ts` も `apps/api/src/index.ts` も `mapper.ts` を import 済みのため依存方向が増えない。schema 側 `mapFormSchema` と response 側 qidMap が同一 module の同一ロジックを共有でき「対称化」が物理的に保証される |
| `client.ts` の named export | 却下 | `client.ts` は I/O（fetch/auth/backoff）の責務。純粋な変換 helper を混在させると責務境界が濁る。`apps/api/src/index.ts` から純関数 1 本のために I/O module を import する依存も不自然 |

### 1. 新規作成 / 修正ファイル一覧（current facts）

| パス | 種別 | Lane | 変更概要 |
|------|------|------|---------|
| `packages/integrations/google/src/forms/mapper.ts` | 修正 | A | `deriveStableKey`(89) と `STABLE_KEY_BY_LABEL`(53) を `export` 化。新規 `export function rawFormToStableKeyMap(raw: RawForm): Record<string,string>` を追加（TECH-M-01） |
| `packages/integrations/google/src/forms/client.ts` | 修正 | A | `defaultQuestionIdMap`(65-73) と inline `qidMapFn`(84-91) を `rawFormToStableKeyMap` 呼び出しへ置換（生 title→正規化 stableKey、schema 側と対称化） |
| `apps/api/src/forms/build-qid-map.ts` | **新規作成** | A | `index.ts` のインライン closure(175-186) から純関数 `buildQuestionIdToStableKey` を抽出（`{...fromRaw, ...fromSchema}` マージ） |
| `apps/api/src/index.ts` | 修正 | A | `questionIdToStableKey` closure を `buildQuestionIdToStableKey(rows, raw)` 呼び出しへ置換（schema_questions 空時に raw fallback 起動） |
| `apps/api/src/jobs/sync-forms-responses.ts` | 修正 | B | `ResponseSyncResult` に `qidMapSize` / `fullyUnmappedResponses` を追加。`processResponse` 戻り値に unmapped 判定を加え、`runResponseSync` で集計し空 qidMap / 全 unmapped を `SYNC_ALERTS` 記録 |
| `packages/integrations/google/src/forms/mapper.spec.ts` | 修正 | A | TC-01/02/03/05/08（Phase 4 で追加済み・GREEN 化） |
| `packages/integrations/google/src/forms/client.spec.ts` | 修正 | A | TC-04（同上） |
| `apps/api/src/forms/build-qid-map.spec.ts` | 新規 | A | TC-06/07（Phase 4 で追加済み・GREEN 化） |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | 新規 | B | TC-09〜12（同上） |
| `docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/runbooks/recovery.md` | **新規作成** | C | 復旧 runbook + 診断クエリ集 |

### 2. Lane A 実装手順（qidMap 堅牢化＝schema_questions 非依存化）

#### A-1. `mapper.ts` — export 化 + helper 追加

before（抜粋）:
```typescript
const STABLE_KEY_BY_LABEL: Record<string, string> = { /* ... */ };
function deriveStableKey(label: string | undefined): string { /* ... */ }
```
after:
```typescript
export const STABLE_KEY_BY_LABEL: Record<string, string> = { /* 既存内容そのまま */ };
export function deriveStableKey(label: string | undefined): string { /* 既存ロジック不変 */ }

// 新規: raw form items から正規化 qidMap を導出（schema_questions 非依存）
export function rawFormToStableKeyMap(raw: RawForm): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of raw.items ?? []) {
    const qid = item.questionItem?.question?.questionId;
    if (!qid || !item.title) continue;
    map[qid] = deriveStableKey(item.title);
  }
  return map;
}
```
- ロジック変更は無し（export 追加 + helper 新設のみ）。`slugify`(94) は private のまま。
- **満たす AC**: AC-A1（export）。**GREEN 化 TC**: TC-01/02/03/05。

#### A-2. `client.ts` — デフォルト qidMap を正規化へ

before（65-91）:
```typescript
function defaultQuestionIdMap(raw: RawForm): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of raw.items ?? []) {
    const qid = item.questionItem?.question?.questionId;
    if (!qid || !item.title) continue;
    map[qid] = (raw.items ?? []).find((it) => it === item)?.title ?? qid; // 生 title
  }
  return map;
}
// ...
const qidMapFn = deps.questionIdToStableKey ?? ((raw: RawForm) => {
  const map: Record<string, string> = {};
  for (const item of raw.items ?? []) {
    const qid = item.questionItem?.question?.questionId;
    if (qid && item.title) map[qid] = item.title; // 生 title
  }
  return map;
});
```
after:
```typescript
import { /* 既存 */, rawFormToStableKeyMap } from "./mapper";

function defaultQuestionIdMap(raw: RawForm): Record<string, string> {
  return rawFormToStableKeyMap(raw);
}
// ...
const qidMapFn = deps.questionIdToStableKey ?? ((raw: RawForm) => rawFormToStableKeyMap(raw));
```
- `export { defaultSchemaHash, defaultQuestionIdMap };`(143) は維持。
- **満たす AC**: AC-A3。**GREEN 化 TC**: TC-04。

#### A-3. `apps/api/src/forms/build-qid-map.ts` — 純関数抽出（新規）

```typescript
import { rawFormToStableKeyMap, type RawForm } from "@ubm-hyogo/integrations"; // 実 import 経路は package barrel を grep で確定

export interface SchemaQuestionRow {
  readonly questionId: string | null;
  readonly stableKey: string;
}

/**
 * schema_questions lookup 結果（rows）と raw form から qidMap を構築する。
 * schema 行を最優先しつつ、schema_questions が空/欠落（RC-3）の questionId を
 * raw form の deriveStableKey fallback で補完する。
 */
export function buildQuestionIdToStableKey(
  rows: readonly SchemaQuestionRow[],
  raw: RawForm,
): Record<string, string> {
  const fromSchema = Object.fromEntries(
    rows.filter((r) => r.questionId).map((r) => [r.questionId as string, r.stableKey]),
  );
  const fromRaw = rawFormToStableKeyMap(raw);
  return { ...fromRaw, ...fromSchema }; // schema 優先・欠落のみ raw 補完
}
```
- **満たす AC**: AC-A2。**GREEN 化 TC**: TC-06/07。

#### A-4. `apps/api/src/index.ts` — closure を抽出関数へ

before（175-186）:
```typescript
questionIdToStableKey: async (raw) => {
  const rows = await listFieldsByVersion(dbCtx({ DB: env.DB }), env.GOOGLE_FORM_ID ?? env.FORM_ID ?? "", raw.revisionId ?? "unknown");
  return Object.fromEntries(rows.filter((row) => row.questionId).map((row) => [row.questionId as string, row.stableKey]));
},
```
after:
```typescript
import { buildQuestionIdToStableKey } from "./jobs/build-qid-map";
// ...
questionIdToStableKey: async (raw) => {
  const rows = await listFieldsByVersion(dbCtx({ DB: env.DB }), env.GOOGLE_FORM_ID ?? env.FORM_ID ?? "", raw.revisionId ?? "unknown");
  return buildQuestionIdToStableKey(rows, raw); // schema 空時 raw fallback
},
```
- `listFieldsByVersion` の戻り行型が `SchemaQuestionRow`（`questionId`/`stableKey`）と構造一致することを typecheck で確認。差異がある場合は `build-qid-map.ts` の `SchemaQuestionRow` を実型に合わせる（フィールド名は実 repository に従う）。
- **満たす AC**: AC-A2（本番経路で fallback 起動）。

### 3. Lane B 実装手順（fail-silent 検知ガード）

#### B-1. サマリー型拡張（`ResponseSyncResult`）

before（98-107）:
```typescript
export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly durationMs: number;
  readonly skippedReason?: string;
  readonly error?: string;
}
```
after（追加 2 フィールド。skipped/failed 経路では 0 を返す）:
```typescript
export interface ResponseSyncResult {
  // 既存 ...
  readonly qidMapSize: number;             // 当該 sync で解決された qidMap の entry 数
  readonly fullyUnmappedResponses: number; // known 0 件で処理された response 数
}
```
- 既存の `return { status: "skipped", ... }`(175) / `return { status: "failed", ... }`(247) / `return { status: "succeeded", ... }`(291) に `qidMapSize` / `fullyUnmappedResponses` を追加する。skipped/failed では `qidMapSize: 0, fullyUnmappedResponses: 0`（または failed 時点までの集計値）。

#### B-2. `processResponse` 戻り値に unmapped 判定を追加

before（376-378）:
```typescript
interface PerResponseStats {
  readonly writeCount: number;
}
```
after:
```typescript
interface PerResponseStats {
  readonly writeCount: number;
  readonly fullyUnmapped: boolean; // known 0 件 かつ raw answer >=1 件
}
```
- `processResponse` 内 `const normalized = normalizeResponse(resp);`(435) の直後に判定:
  ```typescript
  const fullyUnmapped = normalized.known.size === 0 && Object.keys(resp.rawAnswersByQuestionId).length > 0;
  ```
  関数の各 `return { writeCount }` を `return { writeCount, fullyUnmapped }` に置換（responseEmail 無で early-return する 393-395 は `fullyUnmapped: false`）。

#### B-3. `runResponseSync` で集計 + qidMapSize 取得

- qidMapSize の取得経路（Phase 4 TC-09/10 が依存）:
  - `runResponseSync` は `options.client.listResponses` 経由で qidMap を内部解決するため、qidMap entry 数を外に出す経路が無い。**最小差分案**: `GoogleFormsClient` に `getQuestionIdToStableKey(formId): Promise<Record<string,string>>` を追加し、sync 側で 1 回呼んで `qidMapSize = Object.keys(map).length` を得る。これは I/O 1 回追加だが `listResponses` 内で既に form fetch 済みのため重複は許容範囲。
  - 代替（client API を増やさない案）: `listResponses` の戻りに `qidMapSize?: number` を含める。**採用は Phase 8（refactor）で確定**。Phase 5 では「client から qidMapSize を 1 経路で取得しサマリーへ伝播する」契約のみ固定し、実装は client API 追加案を既定とする。
- ループ内集計:
  ```typescript
  let fullyUnmappedResponses = 0;
  // for (const resp of page.responses) { ... }
  const stats = await processResponse(env.DB, resp, { tagQueuePaused, autoPublishEnabled });
  if (stats.fullyUnmapped) fullyUnmappedResponses += 1;
  ```

#### B-4. fail-silent 検知 + `SYNC_ALERTS` 記録

`succeed(...)`(258) の後・`writeCapHit` 判定と並列に、`cap-alert.ts` の writeDataPoint パターンを踏襲して記録（中断しない）:
```typescript
const qidMapSize = /* B-3 で取得 */;
function emitMappingAlert(kind: "qid_map_empty" | "all_responses_unmapped") {
  try {
    env.SYNC_ALERTS?.writeDataPoint({
      blobs: ["response-sync", kind, env.ENVIRONMENT ?? ""],
      doubles: [qidMapSize, fullyUnmappedResponses, processed],
      indexes: ["response-sync-mapping"],
    });
  } catch (err) {
    console.warn("[response-sync] mapping alert emit failed", err instanceof Error ? err.message : String(err));
  }
}
if (qidMapSize === 0) {
  console.warn("[response-sync] questionIdToStableKey map is empty — all answers will be unmapped");
  emitMappingAlert("qid_map_empty");
}
if (processed > 0 && fullyUnmappedResponses === processed) {
  console.warn(`[response-sync] all ${processed} responses fully unmapped`);
  emitMappingAlert("all_responses_unmapped");
}
```
- `env.ENVIRONMENT` を blobs に使う場合は `ResponseSyncEnv` に `readonly ENVIRONMENT?: string;` を追加（既存 `SYNC_ALERTS?`(81) と同様 optional）。型追加のみで挙動非変更。
- **閾値・中断有無**（Phase 2 §3 確定）: 中断しない。warning ログ + `SYNC_ALERTS` 1 レコード/種別。`status` は従来判定を維持（AC-B3）。
- **満たす AC**: AC-B1/B2/B3。**GREEN 化 TC**: TC-09/10/11/12。

### 4. Lane C 実装手順（復旧 runbook + 診断）

`docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/runbooks/recovery.md` を新規作成。最低限以下 4 セクションを含める（AC-C1〜C4）:

| セクション | 内容（必須記載） |
|-----------|------------------|
| 1. 診断 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --remote --command "SELECT COUNT(*) AS n FROM schema_questions"`（期待: `n > 0`）。0 のとき RC-3 確定。対象会員の `member_responses.answers_json` / `response_fields.stable_key`（`__extra__:` 比率）の read-only 確認クエリも記載 |
| 2. 復旧手順（順序付き） | ① schema sync 実行 `POST /admin/sync/schema` → ② §1 診断で `schema_questions > 0` 検証 → ③ response sync fullSync `POST /admin/sync/responses?fullSync=true` → ④ `answers_json != '{}'` かつ known `stable_key`（`fullName` 等）が 1 件以上を検証 → ⑤ 公開詳細ページで全項目反映を目視。各手順に期待値を併記 |
| 3. クリーンアップ判断 | fullSync 再投入で known stableKey 行は追加されるが、旧 `__extra__:<qid>` 行は別 PK のため残存。表示 API は known stableKey のみ参照するため**残存は無害**。削除は任意・別タスク（TECH-M-02 として Phase 12 で未タスク判定） |
| 4. 不変条件 | 全 D1 操作は `bash scripts/cf.sh d1 ...` ラッパー経由（`wrangler` 直呼び禁止＝不変条件 #3）。production 適用は user 明示承認後のみ（#6） |

> Lane A 反映後は raw fallback により schema_questions 空でも反映が機能するため、本 runbook は「既存データの再投入」と「監視（SYNC_ALERTS）での再発検知」を主目的とする。

### 5. ローカル実行・検証コマンド

| 検証 | コマンド | 期待 |
|------|---------|------|
| 型 | `mise exec -- pnpm typecheck` | エラー 0 |
| lint | `mise exec -- pnpm lint`（残れば `pnpm lint --fix`） | エラー 0 |
| Lane A unit | `mise exec -- pnpm --filter @ubm-hyogo/integrations-google test mapper client` | TC-01〜05/08 GREEN |
| Lane A fallback | `mise exec -- pnpm --filter @ubm-hyogo/api test build-qid-map` | TC-06/07 GREEN |
| Lane B | `mise exec -- pnpm --filter @ubm-hyogo/api test sync-forms-responses` | TC-09〜12 GREEN |
| 表現層非接触 | `git diff dev...HEAD --name-only -- apps/web/src` | 空（不変条件 #1） |
| migration 非変更 | `git diff dev...HEAD --name-only -- apps/api/migrations` | 空（AC-G2） |
| cron 非変更 | `git diff dev...HEAD -- apps/api/wrangler.toml` の cron 行に差分なし | 空（AC-G2） |

> filter package 名は着手時に `grep -h '"name"' packages/integrations/google/package.json apps/api/package.json` で確定する。

### 6. DoD（Definition of Done）

- [x] AC-A1/A2/A3/A4 を満たす（Lane A の全 TC GREEN）
- [x] AC-B1/B2/B3 を満たす（Lane B の全 TC GREEN・sync の成功/失敗判定と cursor 進行が不変）
- [x] AC-C1/C2/C3/C4 を満たす（runbook 4 セクション完備・`cf.sh` 厳守記載）
- [x] `typecheck` / `lint` がエラー 0
- [x] `apps/web/src` / `apps/api/migrations` / `wrangler.toml` cron に差分が無い
- [x] TECH-M-01（`rawFormToStableKeyMap` 配置先＝`mapper.ts` named export）が反映済み
- [x] コード実装の commit / PR / deploy / staging mutation は未実行（user-gated・#6）

## 参照資料

| 参照 | パス |
|------|------|
| qidMap 本番経路 | `apps/api/src/index.ts`（162-189） |
| sync 本体 | `apps/api/src/jobs/sync-forms-responses.ts`（131-543） |
| alert 記録パターン | `apps/api/src/jobs/cap-alert.ts`（68-95） |
| normalize-response | `apps/api/src/jobs/mappers/normalize-response.ts`（32-57） |
| mapper（変換正本） | `packages/integrations/google/src/forms/mapper.ts` |
| client（デフォルト qidMap） | `packages/integrations/google/src/forms/client.ts`（65-91） |
| 設計（マージ戦略・閾値・SYNC_ALERTS スキーマ） | `phase-2.md` §2-3 |

## 統合テスト連携

- Lane A: A-1〜A-4 の差分が TC-05（helper）→ TC-08（mapFormResponse end-to-end）→ TC-06/07（buildQuestionIdToStableKey マージ）で結合検証される。
- Lane B: B-1〜B-4 が TC-09（空 qidMap alert）/ TC-10（カウンタ）/ TC-11（全 unmapped alert）/ TC-12（非回帰）で検証される。

## 多角的チェック観点（AIが判断）

- **最小差分**: Lane A は「export 追加 + helper 1 本 + 純関数抽出 + closure 置換」。ロジックの新規分岐はマージ `{...fromRaw, ...fromSchema}` のみ。
- **責務一元化**: stableKey 解決を `mapper.ts`（`deriveStableKey` / `rawFormToStableKeyMap`）に集約し、client / index / schema sync の三者が同一変換を共有する（二重化解消）。
- **非中断の根拠**: Lane B は warning + alert に徹し cursor を進める。schema sync 未実行を「黒箱の空反映」から「監視可能な可観測イベント」に変える。
- **不変条件遵守**: apps/web 非接触・migration/cron 非変更を validation matrix の git diff gate で機械検証。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P5-A1 | `mapper.ts` export + `rawFormToStableKeyMap` | A |
| P5-A2 | `client.ts` デフォルト qidMap 正規化 | A |
| P5-A3 | `build-qid-map.ts` 抽出 + `index.ts` 置換 | A |
| P5-B1 | サマリー型拡張 + `processResponse` unmapped 判定 | B |
| P5-B2 | qidMapSize 取得 + 集計 + `SYNC_ALERTS` 記録 | B |
| P5-C1 | `runbooks/recovery.md` 作成 | C |

## 成果物

- `outputs/phase-5/implementation-plan.md`（新規/修正ファイル・差分方針・DoD・検証ログ）
- `docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/runbooks/recovery.md`（Lane C 成果物）

## 完了条件

- [x] 新規/修正ファイル一覧（種別・Lane・変更概要）が記述されている
- [x] 各 Lane の関数シグネチャと before/after が記述されている
- [x] TECH-M-01 が確定（`mapper.ts` named export・理由付き）している
- [x] ローカル検証コマンドと DoD が明記されている
- [x] Lane C runbook 構成（4 セクション・`cf.sh` 厳守）が確定している

## タスク100%実行確認【必須】

- [x] 1〜6 を完遂した
- [x] Lane A/B/C すべての変更ファイル・手順が記述されている
- [x] commit / PR / deploy / staging mutation を未実行に保っている（#6）
- [x] `outputs/phase-5/implementation-plan.md` が存在する

## 次Phase

Phase 6（テスト拡充）— fail path・回帰 guard・境界値を追加し堅牢性を上げる。
