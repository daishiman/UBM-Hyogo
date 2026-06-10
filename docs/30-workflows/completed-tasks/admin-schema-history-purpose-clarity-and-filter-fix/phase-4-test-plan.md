# Phase 4: テスト計画

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。新規 spec の Path・対象関数・データ構造の正本は §5 / §6、AC は §8。

## 1. テスト方針

- TDD: 各 Lane の振る舞いを spec で先に固定し、実装が AC を満たすことを保証する。
- テストランナー: Vitest（`pnpm --filter @ubm-hyogo/web test --run`）。component は `@testing-library/react`。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 #6 / CLAUDE.md 不変条件 #8）。`*.test.*` は禁止。
- component spec は `*.component.spec.tsx` 慣行（既存 `SchemaDiffHistoryPanel.component.spec.tsx` に整合）。
- fetch のモックは既存 `SchemaDiffHistoryPanel.component.spec.tsx` の `vi.mock("../../../lib/admin/api", …)` + `fetchHistoryMock` パターンに合わせる。api.ts 直接テスト（`api.spec.ts`）は `global.fetch` を `vi.fn()` で差し替え、`Response` 風オブジェクト（`{ ok, status, json }`）を返すモックパターンを用いる。

### TDD 命名規則整合（[`phase-1-requirements.md`](./phase-1-requirements.md) §命名規則）

| 種別 | 規則 | 本タスクの対象 |
|------|------|----------------|
| React component | PascalCase | `SchemaHistoryPurposeExplainer` |
| lib module / 純関数 | camelCase | `formatSchemaHistoryError` |
| 純データ export | camelCase | `schemaHistoryGlossary` / `schemaHistoryPurposeSteps` |
| zod schema | PascalCase + `Z` suffix | `AppliedFiltersZ` / `SchemaAliasHistoryResponseZ` |
| test ファイル | `*.spec.{ts,tsx}`（component は `*.component.spec.tsx`） | 下表 4 ファイル |

> **private / internal メンバーのテスト分離**: 本タスクの対象（純関数 `formatSchemaHistoryError`・純データ export・export 済 zod schema・export 済 component）はすべて public export であり、private/internal なメンバーを直接テストする必要は無い。**該当なし**。テストは公開 API（export されたシンボル）越しに検証する。

## 2. spec ファイル一覧（SSOT §5）

| Path | Lane | 種別 | 対象 |
|------|------|------|------|
| `apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts` | E | 新規 | `formatSchemaHistoryError` 純関数 unit |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | E | 追記 | `SchemaAliasHistoryResponseZ.parse` / `fetchSchemaAliasHistory` の batchId parse 回帰 |
| `apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | E | 新規 | explainer 描画回帰 |
| `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` | E | 追記 | human-readable error / card 描画 / explainer 表示 回帰 |

---

## 3. `schemaHistoryError.spec.ts`（Lane B / AC-3）

対象: `formatSchemaHistoryError(e: unknown): string`（`apps/web/src/lib/admin/schemaHistoryError.ts`）。純関数のため副作用なし・モック不要。`ZodError` は `zod` から、HTTP 系は `new Error("… HTTP 500")` で生成する。

| TC-ID | 対象 / 分岐 | 入力 | 期待結果 |
|-------|------------|------|----------|
| TC-E-ERR-01 | ZodError → 形式不一致 | `AppliedFiltersZ.parse({})` などで実際に throw させた `ZodError`、または `new ZodError([])` | 戻り値が `"履歴データの形式が想定と一致しませんでした。時間をおいて再度お試しください。"`。raw JSON（`[`/`{`/`unrecognized_keys`/`batchId`）を含まない |
| TC-E-ERR-02 | HTTP 系 Error → サーバー応答エラー | `new Error("fetchSchemaAliasHistory failed: HTTP 500")` | 戻り値が `"履歴の取得に失敗しました（サーバー応答エラー）。時間をおいて再度お試しください。"`。`/HTTP\s*\d{3}/` にマッチする分岐が選ばれる |
| TC-E-ERR-02b | HTTP 系 Error（別ステータス・空白あり） | `new Error("HTTP 404 not found")` / `new Error("HTTP  503")` | TC-E-ERR-02 と同じサーバー応答エラーメッセージ（`\s*` で空白許容を確認） |
| TC-E-ERR-03 | その他 Error → 汎用 | `new Error("net")`（HTTP を含まない） | 戻り値が `"履歴の取得に失敗しました。時間をおいて再度お試しください。"`。raw `"net"` を含まない |
| TC-E-ERR-04 | 非 Error → 汎用 | `"plain string"` / `null` / `undefined` / `{ foo: 1 }` | 戻り値が `"履歴の取得に失敗しました。"`（末尾の短い汎用メッセージ）。throw しない |

> 判定順序の回帰: `ZodError` は `Error` のサブクラスのため、TC-E-ERR-01 が `instanceof Error` 分岐へ落ちず ZodError 分岐で処理されること（順序保証）を併せて確認する。

---

## 4. `api.spec.ts`（Lane A / AC-1 / AC-2）

対象: `SchemaAliasHistoryResponseZ`（経由で `AppliedFiltersZ`）の parse 受理範囲、および `fetchSchemaAliasHistory` の end-to-end parse 成功。

### 4-1. `SchemaAliasHistoryResponseZ.parse` 受理範囲（pure parse）

ベース fixture は SSOT §6 の `EMPTY_RESPONSE.appliedFilters` 形（batchId 追加後）を使う。

| TC-ID | 対象 | 入力（appliedFilters 抜粋） | 期待結果 |
|-------|------|------------------------------|----------|
| TC-A-PARSE-01 | batchId=string を受理 | `{ action, actorEmail:null, targetType:null, targetId:null, from:null, to:null, batchId:"batch-123", limit:50 }` | `parse` が throw せず成功。結果 `.appliedFilters.batchId === "batch-123"` |
| TC-A-PARSE-02 | batchId=null を受理（schema history 通常系） | `… batchId:null …` | `parse` 成功。`.appliedFilters.batchId === null` |
| TC-A-PARSE-03 | **batchId 欠落は reject（strict 後方互換確認）** | `… to:null, limit:50 }`（batchId キー無し） | `parse` が `ZodError` を throw する。SSOT §6 で `batchId: z.string().nullable()`（optional ではない）= **必須**のため。`.strict()` 維持下では batchId は必須キーであることを固定する |
| TC-A-PARSE-04 | 未知キー混入は依然 reject（strict 維持の防御性） | `… batchId:null, limit:50, unexpectedKey:"x" }` | `parse` が `ZodError`（`unrecognized_keys`）を throw する。batchId 追加後も strict が他キーを拒否し続けることを保証 |

> **実装との整合（SSOT §6 の決定）**: web zod 側は API の生レスポンスを直接 parse するのではなく、`projectAuditRowsToHistory` → `normalizeAppliedFilters`（`defaultAppliedFilters()` を base にスプレッド）を通した `projected` を parse する。実装で `defaultAppliedFilters()` に `batchId: null` を追加するため、最終 parse 入力には常に batchId キーが存在する。よって TC-A-PARSE-03 の「欠落 reject」は zod schema 自体の契約（batchId 必須）を固定するもので、`fetchSchemaAliasHistory` 経路では発生しない（4-2 で経路の安全性を別途確認）。

### 4-2. `fetchSchemaAliasHistory` end-to-end（fetch モック）

`global.fetch` を `vi.fn()` で差し替え、`{ ok: true, status: 200, json: async () => raw }` を返す。

| TC-ID | 対象 | 入力（API raw レスポンス） | 期待結果 |
|-------|------|----------------------------|----------|
| TC-A-FETCH-01 | batchId=null を含む API 応答で parse 成功（AC-1 回帰） | `{ items:[], nextCursor:null, appliedFilters:{ …, batchId:null, limit:50 } }` | resolve され throw しない。`.appliedFilters.batchId === null`。`unrecognized_keys` ZodError が発生しない |
| TC-A-FETCH-02 | batchId=string を含む API 応答で parse 成功 | `appliedFilters.batchId:"b-1"` | resolve。`.appliedFilters.batchId === "b-1"` |
| TC-A-FETCH-03 | appliedFilters 欠落 API 応答でも `normalizeAppliedFilters` の default が補完し batchId:null で成功 | `{ items:[], nextCursor:null }`（appliedFilters 無し） | resolve。`.appliedFilters.batchId === null`（`defaultAppliedFilters()` に batchId:null が入ることを確認）。これが TC-A-PARSE-03 を経路上回避する根拠 |
| TC-A-FETCH-04 | `res.ok=false` で HTTP Error throw（Lane B 連携） | `{ ok:false, status:500, json:… }` | reject し `Error.message` が `/HTTP\s*500/` にマッチ（後段 `formatSchemaHistoryError` が「サーバー応答エラー」へ変換できる前提を固定） |
| TC-A-FETCH-05 | 正常 item の projection 回帰 | `items:[{ auditId:"a1", actorEmail:"x@e.com", createdAt:"…", maskedAfter:{ stableKey:"full_name", questionText:"氏名" }, maskedBefore:{ stableKey:"unknown" } }]` | `.items[0].afterStableKey === "full_name"` / `.beforeStableKey === "unknown"` / `.questionText === "氏名"` |

---

## 5. `SchemaHistoryPurposeExplainer.component.spec.tsx`（Lane C / AC-5）

対象: `SchemaHistoryPurposeExplainer`（props なし・状態なし純表示）。`render(<SchemaHistoryPurposeExplainer />)` のみ。fetch モック不要。`schemaHistoryGlossary` / `schemaHistoryPurposeSteps`（SSOT §6）の実データを描画することを確認する。

| TC-ID | 対象 | 入力 / 操作 | 期待結果 |
|-------|------|------------|----------|
| TC-C-EXP-01 | root data-testid 描画 | `render` | `screen.getByTestId("schema-history-purpose-explainer")` が存在する |
| TC-C-EXP-02 | 見出し + 1 文要約 | `render` | 「この画面でできること」見出しと、「Google フォームの設問を新旧で紐付け（alias resolve）した操作の履歴を確認できます」の要約文が描画される |
| TC-C-EXP-03 | 流れ 3 ステップ描画 | `render` | `schemaHistoryPurposeSteps` の 3 ラベルがすべて描画される（「Google フォームの設問が追加・変更される」/「…stableKey を紐付ける（alias resolve）」/「…記録される」）。順序 1→2→3 で並ぶ |
| TC-C-EXP-04 | 用語集 plain + term 併記 | `render` | `schemaHistoryGlossary` 4 件すべての `plain`（やさしい言い換え）と `term`（技術名）が描画される（例: term「stableKey」と plain「設問につける変わらない名札…」が両方表示） |
| TC-C-EXP-05 | HEX 直書きなし（静的確認の代替） | `render` | data-testid 要素配下の `style` 属性に `#` 始まりの色値が無い（OKLch token / class 経由であることの軽量確認。最終 gate は `verify-design-tokens`） |

---

## 6. `SchemaDiffHistoryPanel.component.spec.tsx` 追記（Lane B/C/D / AC-3 / AC-4 / AC-5 / AC-7）

既存 spec（TC-C-01 〜 TC-C-09a）は card 化に伴い更新する。`okResp` ヘルパの `appliedFilters` に `batchId: null` を追加し、新フィールドへ整合させる。`item()` ヘルパは流用。

### 6-1. 既存 TC の card 化更新

| TC-ID | 旧前提 | 更新後の期待 |
|-------|--------|--------------|
| TC-C-01/02（更新） | `role="columnheader"` 5 カラム header | card 形式へ移行。`.schema-history-card` が item 数ぶん描画され、各 card に stableKey / 旧→新 / questionText / 日時 / 操作者が含まれる（columnheader アサーションは削除） |
| TC-C-06（維持） | items 空で EmptyState、pagination 非描画 | **維持**。`EmptyState`「該当する履歴がありません」が出て `.schema-history-card` が 0 件、「次の 50 件」ボタンも非描画 |
| TC-C-04/05a（維持・参照変更） | table 行から取得 | card（`.schema-history-card` / `data-audit-id`）から取得するよう参照を変更。pagination 挙動自体は不変 |

### 6-2. 新規追記 TC

| TC-ID | 対象 / Lane | 入力 / 操作 | 期待結果 |
|-------|------------|-------------|----------|
| TC-C-ERR-01 | 取得失敗で日本語メッセージ（Lane B / AC-3） | `fetchHistoryMock.mockRejectedValue(new Error("net"))` | `role="alert"` 要素の textContent が `"履歴の取得に失敗しました。時間をおいて再度お試しください。"`（`formatSchemaHistoryError` 経由）。**raw `"net"` を含まない**（既存 TC-C-08a の `toContain("net")` は反転させ、含まないことを確認） |
| TC-C-ERR-02 | ZodError を raw JSON で出さない（Lane B / AC-3） | `fetchHistoryMock.mockRejectedValue(new (zod の ZodError)([]))` | alert textContent が「履歴データの形式が想定と一致しませんでした。…」。`"unrecognized_keys"` / `"batchId"` / `"["` を含まない |
| TC-C-ERR-03 | error 要素に class が付く（Lane B / AC-4） | TC-C-ERR-01 と同じ reject | `screen.getByRole("alert")` が `className` に `schema-history-error` を含む（`.classList.contains("schema-history-error")`） |
| TC-C-EXP-IN-01 | explainer が panel 冒頭に表示（Lane C / AC-5） | `fetchHistoryMock.mockResolvedValue(okResp([]))` で `render` | `screen.getByTestId("schema-history-purpose-explainer")` が存在する。流れ 3 ステップのいずれかのラベルが描画される |
| TC-C-CARD-01 | card 形式描画（Lane D / AC-7） | `okResp([item({ auditId:"row1", questionText:"Q-row1", beforeStableKey:"unknown", afterStableKey:"full_name" })])` | `.schema-history-card` が 1 件描画され、その中に stableKey（`full_name`）/ 旧→新（`unknown` → `full_name`）/ question（`Q-row1`）/ 日時 / 操作者 が含まれる |
| TC-C-CARD-02 | `data-audit-id` 保持（Lane D / 既存 spec 互換） | TC-C-CARD-01 と同じ | card 要素（`<li>`）が `data-audit-id="row1"` を持つ（`container.querySelector('[data-audit-id="row1"]')` が非 null） |
| TC-C-CARD-03 | stableKey null フォールバック | `item({ beforeStableKey:null, afterStableKey:null, questionText:null })` | stableKey / question が `"—"` で描画され throw しない |

> 既存 fetch モックパターン（`vi.mock("../../../lib/admin/api", …)` で `fetchSchemaAliasHistory` のみ差し替え）を踏襲する。`SchemaHistoryPurposeExplainer` / `formatSchemaHistoryError` は実モジュールを使用（モックしない）。

---

## 7. AC 対応マトリクス

| AC | 検証 TC |
|----|---------|
| AC-1（batchId ZodError 出ない・parse 成功） | TC-A-FETCH-01 / TC-A-FETCH-03 |
| AC-2（batchId string/null 受理回帰） | TC-A-PARSE-01 / TC-A-PARSE-02 / TC-A-FETCH-01 / TC-A-FETCH-02 |
| AC-3（raw JSON でなく日本語メッセージ） | TC-E-ERR-01〜04 / TC-C-ERR-01 / TC-C-ERR-02 |
| AC-4（`.schema-history-error` クラス + OKLch） | TC-C-ERR-03（class）/ globals.css は `verify-design-tokens`（AC-8） |
| AC-5（explainer + 流れ + 用語集） | TC-C-EXP-01〜05 / TC-C-EXP-IN-01 |
| AC-6（page title/description 平易化） | Phase 5 で page.tsx 編集。spec は不要（静的文言・visual evidence は Phase 11） |
| AC-7（card 形式 stableKey/旧→新/question/日時・操作者） | TC-C-CARD-01〜03 / TC-C-01/02（更新） |
| AC-8（HEX 0 件） | `verify-design-tokens`（TC-C-EXP-05 は軽量補助） |
| AC-9（apps/api diff 空） | `git diff origin/dev...HEAD -- apps/api apps/api/migrations`（Phase 5 検証） |
| AC-10（typecheck/lint/web spec PASS） | 全 spec + SSOT §11 検証コマンド |

## 8. 実行コマンド（SSOT §11）

```bash
pnpm exec vitest run --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx
```
