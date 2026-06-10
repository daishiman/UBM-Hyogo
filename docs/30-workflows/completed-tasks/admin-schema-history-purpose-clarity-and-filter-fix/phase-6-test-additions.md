# Phase 6: テスト追加

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。Phase 4 の基本ケースに対し、fail path / 回帰 guard / 補助ケースを追加する。新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 #6）。

## 1. 位置づけ

Phase 4 が AC ごとの「正常系 + 主要分岐」を固定するのに対し、Phase 6 は以下を上乗せして堅牢性を担保する:

- **fail path**: 異常入力・サーバー異常・予期せぬキー混入時の振る舞い。
- **回帰 guard（防御性維持）**: Lane A で batchId を許容しても `.strict()` の防御が残ること、Lane B で raw JSON が二度と漏れないこと。
- **補助ケース**: 空配列・null フォールバック・境界文言。

追加先は既存 spec ファイルに足す（新規ファイルは作らない）。Path は Phase 4 §2 と同一。

---

## 2. `api.spec.ts` 追記（Lane A・防御性維持）

| TC-ID | 観点 | 入力 | 期待結果 |
|-------|------|------|----------|
| TC-A-GUARD-01 | **batchId と別の予期せぬキーが共存しても依然 strict で reject**（防御性維持） | `appliedFilters: { …, batchId:null, limit:50, unexpectedKey:"x" }` | `SchemaAliasHistoryResponseZ.parse` が `ZodError`（`unrecognized_keys` に `unexpectedKey`）を throw する。batchId の許容が「strict の緩和」ではなく「1 キーの明示追加」であることを固定（[`phase-2-design.md`](./phase-2-design.md) §Lane A の設計判断 = passthrough 化しない の回帰） |
| TC-A-GUARD-02 | batchId の型ガード | `appliedFilters.batchId: 123`（number） | `parse` が `ZodError` を throw（`z.string().nullable()` のため number 不可）。`null` / `string` のみ受理を固定 |
| TC-A-GUARD-03 | item の strict 維持（無関係キー混入で reject） | `items: [{ auditId:"a1", actorEmail:null, createdAt:"t", beforeStableKey:null, afterStableKey:null, questionText:null, extra:"x" }]` | `SchemaAliasHistoryItemZ` の `.strict()` により `parse` が `ZodError` を throw。projection は既知キーのみ生成するため経路上は発生しないが、schema 契約として固定 |
| TC-A-FETCH-FAIL-01 | HTTP 500 → メッセージが Lane B で変換可能な形 | `global.fetch` が `{ ok:false, status:500 }` を返す | `fetchSchemaAliasHistory` が reject し `Error.message` が `/HTTP\s*500/` にマッチ。さらに `formatSchemaHistoryError(error)` を通すと「履歴の取得に失敗しました（サーバー応答エラー）。…」になる（end-to-end の fail path 連結確認） |
| TC-A-FETCH-FAIL-02 | HTTP 403 等の他ステータス | `{ ok:false, status:403 }` | reject。`message` に `HTTP 403` を含み、`formatSchemaHistoryError` がサーバー応答エラー文へ変換 |

---

## 3. `schemaHistoryError.spec.ts` 追加（Lane B・raw JSON 漏れ防止の回帰 guard）

| TC-ID | 観点 | 入力 | 期待結果 |
|-------|------|------|----------|
| TC-E-GUARD-01 | **実 ZodError（unrecognized_keys 込み）でも raw JSON を出さない** | `AppliedFiltersZ` 相当を `.parse({ batchId: null, foo: "x" })` などで実際に throw させた `ZodError` | 戻り値に `"unrecognized_keys"` / `"batchId"` / `"["` / `"{"` / `"path"` を一切含まない。元ユーザー報告の raw JSON 文字列が UI に再流出しないことの恒久 guard |
| TC-E-GUARD-02 | HTTP 系判定が message 部分一致で誤爆しない | `new Error("download failed: cHTTP")`（`HTTP` を含むが `\d{3}` 無し） | `/HTTP\s*\d{3}/` にマッチせず「履歴の取得に失敗しました。時間をおいて再度お試しください。」（汎用 Error 分岐）になる |
| TC-E-GUARD-03 | message 中に複数の HTTP 風文字列 | `new Error("retry after HTTP 500 then HTTP 503")` | サーバー応答エラー文（最初にマッチすれば true）。throw しない |
| TC-E-GUARD-04 | 純関数性（副作用なし・同入力同出力） | 同一入力で 2 回呼ぶ | 2 回の戻り値が厳密一致。入力オブジェクトが変異しない |

---

## 4. `SchemaDiffHistoryPanel.component.spec.tsx` 追加（fail path / 補助）

| TC-ID | 観点 / Lane | 入力 / 操作 | 期待結果 |
|-------|------------|-------------|----------|
| TC-C-FAIL-01 | onNext（2 回目 fetch）失敗でも日本語メッセージ（Lane B） | 初回 `okResp([item], "cur-1")` 成功 → 「次の 50 件」クリック時 `mockRejectedValueOnce(new Error("HTTP 500"))` | `role="alert"` に「履歴の取得に失敗しました（サーバー応答エラー）。…」。初回表示済みの card は消えない（既存表示の維持） |
| TC-C-FAIL-02 | error 後に再取得成功で alert が消える（回復導線） | reject → 再 render/再 fetch で `okResp([item])` | 成功時に `setError(null)`（既存 onNext / load 挙動）で `role="alert"` が消え card が出る。raw JSON が残らない |
| TC-C-EMPTY-01 | **空配列で EmptyState 維持（card 化後も回帰）**（Lane D） | `okResp([])` | 「該当する履歴がありません」が描画され、`.schema-history-card` が 0 件、「次の 50 件」非描画。explainer（`data-testid`）は空でも表示され続ける |
| TC-C-EMPTY-02 | client filter で 0 件になっても EmptyState（補助） | `okResp([item({ questionText:"alpha" })])` + `initialFilters.questionTextLike="zzz"` | filter 後 0 件で EmptyState 表示・card 0 件 |
| TC-C-CARD-NULL-01 | 全 stableKey/question null の card（Lane D 補助） | `item({ beforeStableKey:null, afterStableKey:null, questionText:null })` | card 内 stableKey / 旧→新 / question が `"—"`、操作者 null は `"(unknown)"`。throw しない |
| TC-C-A11Y-01 | card リストの aria（補助） | `okResp([item])` | `aria-label="resolve 履歴"` を持つリスト（`<ul>`）が存在し、取得中 `aria-busy` を反映 |

---

## 5. `SchemaHistoryPurposeExplainer.component.spec.tsx` 追加（補助）

| TC-ID | 観点 | 入力 / 操作 | 期待結果 |
|-------|------|------------|----------|
| TC-C-EXP-GUARD-01 | データ件数の回帰固定 | `render` | 流れが**ちょうど 3 ステップ**（`schemaHistoryPurposeSteps.length === 3`）、用語集が**ちょうど 4 件**（`schemaHistoryGlossary.length === 4`）描画される。将来データ増減時に意図せぬ表示崩れを検出 |
| TC-C-EXP-GUARD-02 | 流れの順序固定 | `render` | order 1→2→3 の順で DOM に並ぶ（番号付きリスト `<ol>` での出現順 = データ order 昇順） |
| TC-C-EXP-GUARD-03 | term と plain の両方が必ず併記 | `render` | 各用語で `plain`（やさしい言い換え）と `term`（技術名）の両テキストが同一エントリ内に存在（plain のみ / term のみの欠落が無い） |

---

## 6. 回帰サマリ（このタスク固有の guard）

| guard | 守る対象 | TC |
|-------|----------|----|
| batchId 許容 ≠ strict 緩和 | RC-1 修正が防御性を落とさない | TC-A-GUARD-01 / TC-A-GUARD-02 |
| raw JSON 非流出（恒久） | RC-2 のユーザー報告再発防止 | TC-E-GUARD-01 / TC-C-ERR-02（Phase 4） |
| HTTP 系メッセージ変換 | サーバー異常時の可読性 | TC-A-FETCH-FAIL-01/02 / TC-E-ERR-02 |
| 空配列 EmptyState 維持 | card 化リファクタの回帰 | TC-C-EMPTY-01/02 |
| explainer データ件数・順序固定 | 情報設計（RC-3）の表示安定 | TC-C-EXP-GUARD-01〜03 |

## 7. 実行コマンド（Phase 4 と同一・SSOT §11）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/lib/admin/__tests__/schemaHistoryError.spec.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx \
  src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx
```

> 全 TC（Phase 4 + Phase 6）が GREEN で AC-2 / AC-3 / AC-5 / AC-7 / AC-10 を満たす。commit / PR は Phase 13（user-gated）。
