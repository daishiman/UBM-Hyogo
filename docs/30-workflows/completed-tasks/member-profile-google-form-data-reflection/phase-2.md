# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 2 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 1 完了（真因確定・inventory 固定） |

## 目的

3 lane（A: qidMap 堅牢化 / B: fail-silent 検知 / C: 復旧 runbook）の target topology・閾値・validation matrix・型配置を確定する。

## 実行タスク

本 Phase の実行ステップ:

1. 3 lane topology（A: qidMap 堅牢化 / B: fail-silent 検知 / C: 復旧 runbook）を table 化する
2. Lane A の stableKey 解決対称化（マージ戦略 `{...fromRaw, ...fromSchema}`）を確定する
3. Lane B の fail-silent 検知の閾値・中断有無・サマリー型・SYNC_ALERTS スキーマを確定する
4. Lane C の復旧 runbook 構成を確定する
5. validation matrix を command 単位で定義する

### 1. Lane topology（3 lane 以下）

| Lane | concern | 主変更ファイル | 依存境界 |
|------|---------|---------------|---------|
| A | qidMap を schema_questions 非依存化（堅牢化） | `mapper.ts`(export), `client.ts`(default qidMap), `apps/api/src/index.ts`(fallback) | Lane B は A の qidMap が正しい前提に立つが、A 不在でも B 単独で検知可能（疎結合） |
| B | response sync の fail-silent 検知 | `sync-forms-responses.ts` | 既存 `SYNC_ALERTS` / `processResponse` 戻り値を拡張。A と独立 |
| C | 復旧 runbook + 診断 | `docs/30-workflows/.../runbooks/` | コード非依存（運用ドキュメント）。A/B 反映後の検証手順を含む |

### 2. Lane A 設計 — stableKey 解決の対称化

**問題**: schema 側 `mapFormSchema` は `deriveStableKey(item.title)` で正規化するが、response 側 qidMap（`index.ts` / client デフォルト）は schema_questions lookup または生ラベルに依存し、非対称。

**設計**:

```typescript
// mapper.ts: named export 追加（既存ロジック不変、export のみ）
export function deriveStableKey(label: string | undefined): string; // 既存(89-92)
export const STABLE_KEY_BY_LABEL: Record<string, string>;           // 既存(53-87)

// client.ts: 生ラベル → deriveStableKey へ（schema 側と対称化）
//   defaultQuestionIdMap(65-73) と inline qidMapFn(84-91) を共通 helper に統合:
function rawFormToStableKeyMap(raw: RawForm): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of raw.items ?? []) {
    const qid = item.questionItem?.question?.questionId;
    if (!qid || !item.title) continue;
    map[qid] = deriveStableKey(item.title); // ← 生 title ではなく正規化
  }
  return map;
}

// apps/api/src/index.ts: questionIdToStableKey の堅牢化（schema_questions 非依存 fallback）
questionIdToStableKey: async (raw) => {
  const rows = await listFieldsByVersion(dbCtx({ DB: env.DB }), formId, raw.revisionId ?? "unknown");
  const fromSchema = Object.fromEntries(
    rows.filter((r) => r.questionId).map((r) => [r.questionId as string, r.stableKey]),
  );
  // fallback: schema_questions が空/欠落でも raw form から導出（RC-3 対策）
  const fromRaw = rawFormToStableKeyMap(raw);
  return { ...fromRaw, ...fromSchema }; // schema 側を優先しつつ、欠落は raw で補完
};
```

**マージ戦略の決定**: `{ ...fromRaw, ...fromSchema }`（schema_questions に登録された stableKey を最優先、未登録 questionId のみ raw fallback で補完）。これにより schema sync 済み環境では従来挙動を維持し、schema_questions 空環境（RC-3）でも反映が機能する。

> `rawFormToStableKeyMap` は `client.ts`（mapper と同階層）に置き `index.ts` から import するか、`mapper.ts` に置く。DI 境界判断: 複数箇所（client / index）で共有するため `mapper.ts` または `client.ts` の named export とする（Phase 5 で配置確定）。

### 3. Lane B 設計 — fail-silent 検知ガード

**閾値・挙動の決定**（AC-B3 で要求された明示）:

| 検知 | 条件 | 挙動 |
|------|------|------|
| qidMap 空 | `Object.keys(questionIdToStableKey).length === 0` | warning ログ + `SYNC_ALERTS` 1 レコード（`kind="qid_map_empty"`）。**sync は中断せず継続**（既存挙動を破壊しない＝AC-B3）。Lane A 反映後は raw fallback により空になりにくいが、raw items も questionId 無の異常時に発火 |
| 全 unmapped response | 1 response で `normalizeResponse(resp).known.size === 0` かつ `Object.keys(resp.rawAnswersByQuestionId).length > 0` | `fullyUnmappedResponses` カウンタを +1。sync サマリーに含める |
| 全 unmapped 多発 | sync 全体で `fullyUnmappedResponses === 処理 response 数` かつ 1 件以上 | warning ログ + `SYNC_ALERTS` 1 レコード（`kind="all_responses_unmapped"`） |

**中断しない理由**: response sync は差分同期で部分成功も価値がある。中断すると cursor が進まず復旧が複雑化する。可視化（alert）に徹し、運用が schema sync 未実行に気づける状態を作る。

**サマリー拡張**:

```typescript
// runResponseSync 戻り値（インライン型）に追加
{
  // 既存 ...
  writeCount: number,
  qidMapSize: number,             // questionIdToStableKey の entry 数
  fullyUnmappedResponses: number, // known 0 件で処理された response 数
}
```

**SYNC_ALERTS スキーマ**（既存 `cap-alert.ts:84` の `writeDataPoint` 形式を踏襲）:

```typescript
env.SYNC_ALERTS?.writeDataPoint({
  blobs: ["response-sync", kind, env.ENVIRONMENT ?? ""], // kind = "qid_map_empty" | "all_responses_unmapped"
  doubles: [qidMapSize, fullyUnmappedResponses, processedCount],
  indexes: ["response-sync-mapping"],
});
```

### 4. Lane C 設計 — 復旧 runbook 構成

| セクション | 内容 |
|-----------|------|
| 診断 | `cf.sh d1 execute ... --remote --command "SELECT COUNT(*) FROM schema_questions"` で充足確認（期待: > 0） |
| 復旧手順 | ①schema sync（`POST /admin/sync/schema`）→ ②schema_questions 検証 → ③response sync fullSync（`POST /admin/sync/responses?fullSync=true`）→ ④`answers_json`/known `response_fields` 検証 → ⑤詳細ページ確認 |
| クリーンアップ判断 | fullSync 再投入で known stableKey 行が追加されるが、旧 `__extra__:<qid>` 行は別 PK のため残存。表示 API は known stableKey のみ参照するため表示には無害。クリーンアップは任意（runbook に「残存は無害・削除は別タスク」と明記） |

### 5. Validation matrix（command 単位）

| 検証 | コマンド | 期待 |
|------|---------|------|
| 型 | `mise exec -- pnpm typecheck` | エラー 0 |
| lint | `mise exec -- pnpm lint` | エラー 0 |
| Lane A unit | `pnpm --filter @ubm-hyogo/integrations-google test mapper client` | GREEN |
| Lane B test | `pnpm --filter <api> test sync-forms-responses` | GREEN |
| 表現層非接触 | `git diff dev...HEAD --name-only -- apps/web/src` | 空（不変条件 #1） |
| migration 非変更 | `git diff dev...HEAD --name-only -- apps/api/migrations` | 空（AC-G2） |

## 参照資料

| 参照 | パス |
|------|------|
| 既存 alert パターン | `apps/api/src/jobs/cap-alert.ts` |
| normalize-response | `apps/api/src/jobs/mappers/normalize-response.ts` |
| schemaQuestions repo | `apps/api/src/repository/schemaQuestions.ts` |

## 統合テスト連携

- Lane A: `mapFormResponse` に `rawFormToStableKeyMap` 由来の map を渡し known 解決を検証。
- Lane B: `runResponseSync` を空 qidMap で実行し alert/サマリーを検証（DB は in-memory or mock）。

## 多角的チェック観点（AIが判断）

- **因果ループ（バランス）**: schema_questions 空 → 全 unmapped → 空反映。Lane A の raw fallback がこのループを断つ。Lane B はループ発生を可視化する。
- **責務境界**: stableKey 解決の正本を `deriveStableKey`（生ラベル正規化）に一元化し、schema_questions は「優先上書き」に格下げ。二重化を解消。
- **4 条件**: 価値性（会員入力の確実反映）/ 実現性（既存関数の export + fallback マージで小差分）/ 整合性（schema 側と対称化）/ 運用性（runbook + alert で復旧・監視が閉じる）。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P2-A | qidMap 対称化設計 | A |
| P2-B | fail-silent 閾値・サマリー・alert スキーマ | B |
| P2-C | runbook 構成 | C |

## 成果物

- `outputs/phase-2/design.md`

## 完了条件

- [x] 3 lane topology が table 化されている
- [x] Lane A のマージ戦略（`{...fromRaw, ...fromSchema}`）が確定
- [x] Lane B の閾値・中断有無・サマリー型・SYNC_ALERTS スキーマが確定
- [x] Lane C の runbook 構成が確定
- [x] validation matrix が command 単位で定義されている

## タスク100%実行確認【必須】

- [x] 1〜5 を完遂した
- [x] `outputs/phase-2/design.md` が存在する

## 次Phase

Phase 3（設計レビュー）— Phase 4 開始可否を判定する。
