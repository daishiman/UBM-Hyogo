# Phase 6 — テスト追加（fail path / 回帰 guard）

> 正本: [shared-context.md](./shared-context.md)。本書は Phase 4（RED 設計）を補完する
> **fail path / 境界値 / 回帰 guard** の追加テストケースを列挙する。実装は行わない（ケース記述のみ）。
> 対象 spec は shared-context §8 の6ファイル。全件 `pnpm test` ではなく対象指定実行（SIGKILL 回避）。

---

## 0. 方針

- 純関数（`auditAppliedFilters` / `auditErrorMessage`）は **表駆動**で input→output を網羅。例外を投げない（[WEEKGRD-02] 防御的返却）。
- presentational component（`AuditLogCard` / `AuditPurposeGuide`）は **external props 注入**のみ（internal state なし・[VSCPKR-03]）。
- `TagCatalogPanel` reduce-guard は `initial` prop の undefined パターンを注入。`window.api` モックは `Object.defineProperty` 経由（[VSCPKR-02] `vi.stubGlobal("window")` 禁止）。
- 既存 `AuditLogPanel.component.spec.tsx` の assertion 意図（mask / href / empty / 404 / batchId）は**保持**し、カード化に伴う DOM 依存箇所のみ最小調整（AC-7）。

---

## 1. auditErrorMessage.spec.ts（新規・fail path 網羅）

`toAuditErrorView(error: string): { title; hint? }` の全分岐。falsy / 空文字 / 未知エラーを網羅列挙する。

| ケース id | 入力 `error` | 期待 |
|-----------|-------------|------|
| [UT-W3-HTTP-1] 404 含む | `"admin api /admin/audit?limit=50 failed: 404"` | title に「読み込めませんでした」相当、hint に「疎通 / staging deploy / admin 認可」キーワードを含む |
| [UT-W3-HTTP-2] 401/403 含む | `"... failed: 403"` | title + 認可ヒント（404 と別 or 共通可。実装の分岐定義に従う） |
| [UT-W3-HTTP-3] 500 含む | `"status 500"` | title に元エラー趣旨、hint は generic（時間をおいて再試行 等） |
| [UT-W3-RANGE-1] from>to レンジ | `"from must be before to"` 相当（実 API 文言を Phase 5 で確定） | hint に「期間の前後（from は to より前）」 |
| [UT-W3-CURSOR-1] invalid cursor | `"invalid cursor"` 相当 | hint に「リセットして再検索」誘導 |
| [UT-W3-GENERIC-1] 未知エラー | `"something unexpected"` | title に原文 or 汎用文、hint は generic or undefined（分岐定義に従い固定） |
| [UT-W3-FALSY-1] 空文字 | `""` | クラッシュせず generic view を返す（title は空にしない） |
| [UT-W3-FALSY-2] 空白のみ | `"   "` | trim 後 generic（[UT-W3-FALSY-1] と同等扱い） |

- **境界**: いずれの入力でも throw しないこと（`expect(() => toAuditErrorView(x)).not.toThrow()`）。
- **回帰**: 既存 404 hint（AuditLogPanel.tsx 265-268 由来）の「staging deploy」「admin 認可」文言が `toAuditErrorView` 経由でも保持されること（AuditLogPanel.component.spec の 404 テストと二重防御）。

---

## 2. auditAppliedFilters.spec.ts（新規・期間表現 + 未指定）

`toAppliedFilterChips(filters: AdminAuditFilters | undefined, fallbackLimit: string): AppliedFilterChip[]`

| ケース id | filters | 期待チップ |
|-----------|---------|-----------|
| [UT-AF-NONE] undefined | `undefined` | `[]`（UI 側で「なし（直近 N 件）」を表示。N=fallbackLimit） |
| [UT-AF-EMPTY] 全フィールド空 | `{ action:"", from:"", to:"", limit:"" }` | `[]`（空文字は未指定扱い） |
| [UT-AF-ACTION] action のみ | `{ action:"identity.merge" }` | `[{ key:"action", label:"action=identity.merge" }]` |
| [UT-AF-FROM] from のみ | `{ from:"2026-06-01..." }` | 期間チップ label に「2026-06-01 以降」相当 |
| [UT-AF-TO] to のみ | `{ to:"2026-06-09..." }` | 期間チップ label に「2026-06-09 まで」相当 |
| [UT-AF-BOTH] from と to 両方 | `{ from:"2026-06-01...", to:"2026-06-09..." }` | 期間チップ label に「2026-06-01〜2026-06-09」相当（1チップに集約） |
| [UT-AF-LIMIT] limit のみ | `{ limit:"50" }` | `[{ key:"limit", label:"limit=50" }]`（※ fallback と区別: 明示指定時はチップ化、未指定は空配列） |
| [UT-AF-MULTI] 複合 | action + 期間 + limit | 3 チップ（順序は実装定義を固定し assert） |

- **境界**: 例外を投げない。日付は JST 表示（実装が `formatJst` 系 or 専用フォーマッタを使うかは Phase 5 確定。spec は表示文字列のサブストリングで検証）。
- **key 一意性**: 返却チップの `key` が重複しないこと（React list key 健全性）。

---

## 3. AuditLogCard.spec.tsx（新規・カード描画 + 境界）

`<AuditLogCard item={...} />`（props のみ）。

| ケース id | item の状態 | 期待 |
|-----------|------------|------|
| [UT-CARD-FULL] 全項目あり | actor/target/batchId/before/after 全有 | 日時(JST)・action バッジ・実行者(mask済)・対象・batchId + コピーボタン・「変更内容を表示」details を描画 |
| [UT-CARD-SYSTEM] actorEmail=null | `actorEmail:null` | 「実行者: システム」表示（`maskAuditText` が "system" → UI で「システム」へ写像） |
| [UT-CARD-PII] actor が email | `actorEmail:"a@b.com"` | 表示に raw email が出ない（`[masked-email]`）。`document.body.textContent` に raw 文字列を含まない |
| [UT-CARD-NOTARGET] target null | `targetType:null, targetId:null` | 対象「—」表示 |
| [UT-CARD-BOTH-NULL] before/after 両方 null | `maskedBefore:null, maskedAfter:null, beforeJson/afterJson なし` | parseError なしの折りたたみ summary が「変更内容: なし」相当（`summarizeAuditJson(null)=なし` を内部利用） |
| [UT-CARD-FALLBACK] masked* なし | `beforeJson/afterJson` のみ | beforeJson/afterJson にフォールバックして summary 表示 |
| [UT-CARD-PARSEERR] parseError あり | `parseError:true` | parse warning note（`role="note"`）を描画 |
| [UT-CARD-NOBATCH] batchId なし | batchId 抽出不可 | batchId 行とコピーボタンを描画しない |
| [UT-CARD-BATCH] batchId あり | `maskedAfter:{ batchId:"batch-1079" }` | batchId 表示 + `BatchIdCopyButton`（既存 aria-label "batchId batch-1079 をコピー"）描画 |
| [UT-CARD-SEMANTICS] DOM | 任意 item | カードが `<li>` で、内部 details が **1個**（before/after を内部並置。旧 JsonDisclosure 2個でないこと） |

- **回帰**: 既存 `extractBatchId` / `maskAuditText` / `summarizeAuditJson` / `formatJst` のシグネチャ・出力が AuditLogCard 経由でも維持されること（AC-7）。

---

## 4. AuditPurposeGuide.spec.tsx（新規・常時表示 + 用語）

`<AuditPurposeGuide />`（props なし・静的）。

| ケース id | 期待 |
|-----------|------|
| [UT-GUIDE-RENDER] 「この画面でできること」見出しと本文を描画する |
| [UT-GUIDE-GLOSSARY] `AUDIT_GLOSSARY` の各エントリ（action / actor / target / batchId / PII）の plain（やさしい日本語）と technical（技術名）を両方描画する |
| [UT-GUIDE-A11Y] `<section aria-label="この画面の説明">` 相当のランドマークを持つ |
| [UT-GUIDE-TESTID] `data-component="audit-purpose-guide"` と `data-testid="audit-glossary"` を持つ |
| [UT-GUIDE-PURE] props なしで安定描画（同一出力・副作用なし） |

---

## 5. TagCatalogPanel.reduce-guard.spec.tsx（新規・reduce-guard エッジ）

`<TagCatalogPanel initial={...} query="" page={1} pageSize={20} />`。`useRouter` / `useAdminMutation` はモック。`window` 系参照は `Object.defineProperty`。

| ケース id | initial | 期待（クラッシュしない・空表示） |
|-----------|---------|----------------------------------|
| [UT-RG-ITEMS-UNDEF] items undefined | `{ total: 0, items: undefined as any }` | `items.reduce` でクラッシュしない。EmptyState「該当するタグはありません」。counts 有効=0/停止中=0 |
| [UT-RG-INITIAL-UNDEF] initial 自体 undefined | `initial={undefined as any}` | クラッシュしない。空表示。total 由来の pager が NaN にならず page 1/1 |
| [UT-RG-INITIAL-EMPTY] initial={} | `initial={{} as any}` | items=[] / total=0 にフォールバック。EmptyState。pager 健全 |
| [UT-RG-TOTAL-NULL] total null | `{ total: null as any, items: [] }` | `Math.ceil(total/pageSize)` が NaN→1 にフォールバック（`Math.max(1, …)` 健全）。全体チップ「全体 0件」 |
| [UT-RG-ITEMS-NULL] items null | `{ total: 3, items: null as any }` | reduce クラッシュなし。空配列扱い。EmptyState。全体チップは total=3 由来（防御後の total）|
| [UT-RG-NORMAL] 正常 | `{ total: 2, items: [active, inactive] }` | 有効1件 / 停止中1件 / 全体2件チップ。行2件描画（回帰: 防御を入れても正常系が壊れない） |

- **検証観点**: `expect(() => render(...)).not.toThrow()` を各ケースの第一 assert に置く（reduce クラッシュ根絶 = AC-6 の核心）。
- **pager 境界**: total フォールバック 0 のとき「次へ」が disabled、「page 1 / 1」表示であること。

---

## 6. 既存 AuditLogPanel.component.spec.tsx の回帰 guard（編集・意図保持）

カード化（テーブル→`<ol>`/`<li>`）に伴い DOM 依存テストを最小調整する。**以下の意図は壊さない**（AC-7）:

| 既存テスト意図 | 調整方針 |
|----------------|---------|
| nested PII マスク（行18-32） | 純関数テストゆえ DOM 非依存。**無変更** |
| `after: email, count` summary 表示（行59） | カード内 details summary に同テキストが出る。セレクタを table→card 構造へ追従（テキスト assert は維持） |
| raw email が DOM に出ない（行60） | カードでも維持。**無変更で通る想定**だが構造変更後に再確認 |
| edit/delete/rerun ボタン無し（行61） | カードでも維持。**無変更** |
| 「次のページ」href に cursor（行62-64） | Pagination 維持ゆえ **無変更** |
| filter form / datalist option（行102-127） | form 維持。datalist は Lane B で **拡充**（後述・既存 assert を上書きでなく拡張） |
| 404 hint「staging deploy」（行129-139） | エラー表示が `auditErrorMessage` 経由へ移行。文言「staging deploy」が出ることを維持（セレクタ調整可） |
| empty / error 状態（行92-100） | 維持 |
| batchId 表示 + copy（行414-443） | カード内 batchId 行へ移動。`data-testid="audit-batch-id"` 維持（不変条件8）。セレクタ追従 |
| before/after summary（行305-377） | 旧「before: なし」「after: なし」2 summary が、カードの単一 details 内表現に変わる場合は assert 文言を Phase 5 の実装表現へ追従（「変更内容: なし」等）。**意図（null→なし表示）は保持** |
| targetType/targetId null→「-」（行379-392） | カードでは「—」に統一する可能性あり。表示文字（- or —）を実装に合わせ assert 調整 |
| parseError note（行394-412） | `role="note"` 維持 |

- **datalist 拡充の回帰**: 既存テスト（行111-114）は `["identity.merge","identity.dismiss"]` を完全一致 assert している。Lane B が preset を `AUDIT_ACTION_PRESETS`（attendance.add 等を含む）へ拡充するため、**この `toEqual` は破綻する**。→ 完全一致 assert を「主要 preset を含む（`toContain`）」へ緩めるか、`AUDIT_ACTION_PRESETS` と一致を assert する形へ Phase 5 で更新する。意図（datalist が存在し action 補助する）は保持。
- **targetType datalist 追加**: Lane B が targetType にも datalist を付与。既存テストに targetType datalist の assert は無いため新規 assert を追加（option に meeting / admin_member_note を含む）。

---

## 7. テスト実行（対象指定・SIGKILL 回避）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \
  apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx
```
