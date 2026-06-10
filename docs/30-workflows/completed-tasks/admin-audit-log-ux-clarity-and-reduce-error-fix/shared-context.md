# shared-context.md — admin-audit-log-ux-clarity-and-reduce-error-fix（SSOT）

> 本ファイルは全 SubAgent / 実装者の **唯一の設計正本（Single Source Of Truth）**。
> Phase 1-3 設計書・Phase 4-13 仕様書・outputs はすべて本ファイルと矛盾しないこと。
> 矛盾が出た場合は本ファイルを正とし、当該 phase ファイルを修正する。

---

## 0. メタ情報

| 項目 | 値 |
|------|-----|
| workflow id | `admin-audit-log-ux-clarity-and-reduce-error-fix` |
| canonical path | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/` |
| created_at | 2026-06-10 |
| 実装区分 | **[実装区分: 実装仕様書]**（CONST_004 デフォルト。コード変更を伴う） |
| status | `implemented_local_evidence_captured` |
| task_type | `implementation` |
| visual_category | `VISUAL`（管理画面UI/UX改善を含む） |
| implementation_mode | `new`（新規実装。RED/GREEN サイクル） |
| relatedIssue | null（ユーザー口頭依頼。staging `/admin/audit` UI/UX 改善 + reduce エラー） |
| branch | `feat/admin-audit-ux-clarity-and-error-fix`（origin/dev tip 6581abd から作成済み） |
| scope_routes | `/(admin)/admin/audit`（主）, `/(admin)/admin/tags/catalog`（reduce エラー防御） |
| 本プロンプトの責務 | **タスク仕様書の作成のみ**。コード実装・commit・PR・push はしない（Phase 13 は user-gated） |

---

## 1. 真の論点（要件レビュー思考法の一次結論）

### 1-1. 真の論点（1文固定）
**監査ログ画面 `/admin/audit` は「何をする画面か・何が絞り込まれているか・各ログで誰が何をしたか」が表現層の情報設計欠如で伝わらず、加えて admin 共通エラー境界に別画面（tags/catalog）の `reduce` クラッシュが漏れ出して体験を毀損している。** API/D1/Google Form は無罪で、修正対象は `apps/web` 表現層に閉じる。

### 1-2. 1提案に混ざった複数案件の切り分け
ユーザーの1つの報告に、独立した2案件が混在している:
- **案件1（主）**: 監査ログ画面の UI/UX が見にくい・目的が不明（情報設計問題）
- **案件2（副）**: コンソールの `reduce` エラー（真因は `/admin/tags/catalog`、admin scope の error boundary で表面化）

ユーザー確認（AskUserQuestion）で「**案件2 も今回サイクルで一緒に修正**」と決定済み。両者とも `apps/web` 表現層で 1 PR / 1 サイクル完了可能 → CONST_007 準拠で分離しない。

### 1-3. why now / why this way（仮説）
- why now: staging で実際に管理者が監査ログを開いた際、画面が読み取れず + コンソールにエラーが出続ける運用上の支障が顕在化した。
- why this way: API は zod 検証 + PII redact + cursor pagination で堅牢（調査で確認済み）。不足は「表現層の情報設計」と「client component の防御ガード」だけ。よって API/D1 を触らず表現層に閉じるのが最小コスト・最大価値。

### 1-4. 因果ループ（最低1本ずつ）
- バランスループ（改善）: 情報設計を足す → 管理者が監査ログを自力で読める → 問い合わせ/誤操作が減る → 運用負荷が下がる。
- 強化ループ（悪化・現状）: 画面が読めない → 管理者が監査ログを使わない → 監査運用が形骸化 → 不正/誤操作の検知が遅れる。

### 1-5. 価値とコストの均衡
- 初回価値: 「監査ログが読める・目的が分かる・絞り込み条件が見える・エラーが消える」。管理者の理解コストを直接下げる。
- 高コスト部品: なし（新規 API / D1 / 型公開なし）。カード型タイムラインの CSS と純関数 + 防御ガードのみ。将来拡張（total件数表示・CSV エクスポート等）は初回価値に混ぜない（未タスク候補へ）。

### 1-6. 4条件の評価（一次結論）
| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者の「読めない・目的不明・エラー」の3コストを表現層改善で直接低減 |
| 実現性 | PASS | apps/web 表現層のみ。新規コンポーネント + 純関数 + 防御ガード + CSS。1サイクルで実装可能な厚み |
| 整合性 | PASS | 既存 API endpoint surface のみ利用。`appliedFilters` は既に型・APIに存在。D1/Form 不変。状態所有権は server component が fetch、client は表示のみ |
| 運用性 | PASS | OKLch トークン正本・既存 primitive 再利用・回帰 spec 追加で verify/regression 破綻なし |

---

## 2. 不変条件（UI prototype alignment / MVP recovery 準拠）

1. **既存 API のみ接続**: `apps/api/src/routes/admin/audit.ts` / `.../tags.ts` の現行 endpoint surface のみ利用。**新 endpoint 追加・D1 schema 変更・Google Form 仕様変更・apps/api 変更は禁止**。AC で `git diff --name-only -- apps/api` が空であることを必須検証。
2. **OKLch トークン正本**: 色は `apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/design-tokens.md` が正本。**HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止**。CI gate `verify-design-tokens` で fail。CSS は `apps/web/src/styles/globals.css` の `@layer components` 末尾に追記し、`var(--ubm-*)` / `color-mix(in oklch, ...)` のみ使用。
3. **プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens + rhythm をデザイン言語の正本とする。新規 primitive を生やさない（既存 Card / Chip / Banner / EmptyState / FormField / Button / Pagination を再利用）。
4. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止を継続。
5. **CLAUDE.md invariant #9**: admin の form input は `FormField` 経由を標準とする。
6. **CLAUDE.md invariant #10**: admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（本タスクは新規 mutation を足さない）。
7. **test suffix**: 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
8. **機械可読 id 不変**: 既存 `data-testid` / `data-component` / `data-role` / `aria-label` は、既存テストが参照しているため**原則維持**。新規要素には新規 id を付与する。表示テキスト・配置・補助要素の追加が中心。

---

## 3. 既存実装の現状（調査確定事実・行番号付き）

### 3-1. 監査ログ画面（案件1）
| ファイル | 行 | 現状 |
|---------|-----|------|
| `apps/web/app/(admin)/admin/audit/page.tsx` | 41-77 | Server Component。`buildAuditApiPath` で query→API path 変換、`safeServerFetch<AdminAuditListResponse>` で取得し `AuditLogPanel` に `data`/`values`/`error` を渡す。`AdminPageHeader`（eyebrow=ADMIN/AUDIT, title=監査ログ, description=1行）を描画 |
| `apps/web/app/(admin)/admin/audit/audit-query.ts` | 1-13 | `jstLocalToUtcIso()`（JST datetime-local → UTC ISO） |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 1-307 | 監査ログ本体。フィルタフォーム（FormField×8）+ **4列テーブル**（`日時/ID`・`action/actor`・`target`・`JSON`）+ Pagination。`AuditRow`(136-170) が各行で `<JsonDisclosure>` を before/after の2個描画。`maskAuditJson`/`summarizeAuditJson`/`formatJst`/`maskAuditText`/`buildAuditHref`/`extractBatchId` は exported 純関数（テスト済み・**シグネチャ維持**） |
| `apps/web/src/lib/admin/types.ts` | 1-31 | `AdminAuditFilters`（action..cursor）/ `AdminAuditListItem`（auditId, actorEmail, action, targetType, targetId, maskedBefore/After, beforeJson/afterJson, parseError, createdAt）/ `AdminAuditListResponse`（items, nextCursor, **appliedFilters?: AdminAuditFilters**） |
| `apps/api/src/routes/admin/audit.ts` | 30-51 | レスポンス schema に `appliedFilters`（action..limit, strict）含む。**API は appliedFilters を返している** |
| `apps/web/src/styles/globals.css` | 1602-1618 | `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table` 既存 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | — | 既存テスト（maskAuditJson nested, pagination href, formatJst, filter form, 404 hint, empty/error）。**既存 assertion を壊さないこと** |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 1-57 | page の query→path 変換テスト |

**確定事実**: `appliedFilters` は型(types.ts:30)・API(audit.ts:30-51)の両方に既に存在するが、**UI(AuditLogPanel)で一切表示していない**。→ 既存 surface で可視化可能（API 変更不要）。

### 3-2. reduce エラー（案件2）
| ファイル | 行 | 現状 / 問題 |
|---------|-----|------|
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | 44 | `const [items, setItems] = useState(initial.items);` — **`initial.items` が undefined を踏みうる**（防御なし） |
| 〃 | 69-80 | `const counts = useMemo(() => items.reduce(...), [items])` — **items が undefined だと `Cannot read properties of undefined (reading 'reduce')` で error.boundary に落ちる**（= 報告のエラー） |
| 〃 | 164 | `<Chip tone="warm">全体 {initial.total}件</Chip>` — `initial.total` も undefined を踏みうる |
| 〃 | 205, 210 | `Math.ceil(initial.total / pageSize)` / `page * pageSize >= initial.total` — `initial.total` undefined で NaN |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | 28-30, 44-50 | `safeServerFetch<TagCatalogListView>("/admin/tags?...")` の `result.data` を `initial` で渡す。`result.ok` でも `result.data.items` が undefined になりうる（**真因 = レスポンス shape と `TagCatalogListView{total,items}` の不整合、または空レスポンス**） |

**真因確定**: `TagCatalogPanel` が **client 受領 props の防御ガードを欠く**ため、`safeServerFetch` の `result.data` が期待 shape (`{total, items}`) でない場合（空・malformed・配列直返し等）に `items.reduce` でクラッシュする。error boundary が `scope: admin` 共通のため、ユーザーが別画面（`/admin/audit`）を開いていてもナビ prefetch 等で catalog コンポーネントが評価されエラーが表面化する。

**修正方針（2段防御）**:
- **(a) 表層対症（必須・確実な再発防止）**: `TagCatalogPanel` の props 受領を防御化（`initial?.items ?? []`, `initial?.total ?? 0`）。`reduce` が undefined を踏まない。
- **(b) 真因確認（実装 Phase 1 で確定）**: 実装着手時に `safeServerFetch` 戻り値と `/admin/tags?page=&pageSize=` の実レスポンス shape を照合。`{total, items}` で正しいなら (a) のみで根治。shape 不整合（例: 配列直返し / `{data:{...}}` ラップ）が判明したら page.tsx の adapter 正規化も是正する。**いずれの場合も (a) は必ず入れる**（防御は恒久的価値）。

> 注: メモリ上、別ワークフロー `admin-tag-definition-unify-create-and-catalog-fix` で catalog→redirect 化・TagCatalogPanel 削除の計画があるが、**現 dev tip(6581abd) には TagCatalogPanel.tsx が存在しバグも残存**している。本タスクは現行コードの防御を確実に入れる（将来の統合と矛盾しない最小防御）。

---

## 4. レーン構成（実装時の関心分離。仕様書はこの3レーンの実装手順を記述する）

> 仕様書作成 SubAgent は「phase ファイルを書く」担当であり、ファイル競合はしない。
> 下記レーンは **Phase 5（実装手順）で記述する実装単位**。

### Lane A — 監査ログ結果表示のカード型タイムライン刷新 + appliedFilters 可視化
- **対象**: `apps/web/src/components/admin/AuditLogPanel.tsx`（編集・主担当）, 新規 `AuditLogCard.tsx`, 新規 `auditAppliedFilters.ts`（純関数）, `globals.css`（編集・カードクラス追加）
- **内容**:
  1. 結果テーブル（279-293 の `<table className="tbl">` ブロック）を **カード型タイムライン**へ置換。各ログ = 1 カード（`AuditLogCard`）で「いつ（JST 日時）/ 誰が（actor・mask済）/ 何を（action バッジ）/ 対象（targetType/targetId）/ バッチ（batchId + コピー）/ ▸ 変更内容を表示（before→after を1つの折りたたみに集約）」を縦並び表示。
  2. `appliedFilters` 可視化: 結果カードの上に「現在の絞り込み条件」チップ列（`auditAppliedFilters.ts` が `appliedFilters` → 表示用ラベル配列に変換。例: `action=identity.merge`, `期間: 2026-06-01〜2026-06-09`, `limit=50`）。フィルタ未指定時は「全件（直近 N 件）」。
  3. 既存 exported 純関数（maskAuditJson 等）と `BatchIdCopyButton` を再利用。`JsonDisclosure` の before/after 2個 → 1個の折りたたみ（before/after を内部で並置）に集約。
  4. Pagination / EmptyState / Banner / form は維持。
- **id 方針**: カードに新規 `data-testid="audit-log-card"`、appliedFilters 列に `data-testid="audit-applied-filters"`。既存 `data-testid="audit-batch-id"` / `before-json` / `after-json` 等は可能な範囲で維持（テスト整合）。

### Lane B — 目的・用語ガイド常時表示 + エラーメッセージ親切化 + datalist 拡充
- **対象**: 新規 `AuditPurposeGuide.tsx`, 新規 `auditGlossary.ts`（用語SSOT・純データ）, 新規 `auditErrorMessage.ts`（純関数）, `AuditLogPanel.tsx`（Lane A と統合）, `app/(admin)/admin/audit/page.tsx`（guide 配置）, `globals.css`（共有）
- **内容**:
  1. `AuditPurposeGuide.tsx`: 「■ この画面でできること」+「用語ガイド（action=操作種別 / actor=実行者 / target=操作対象 / batchId=一括処理ID / PII=個人情報は自動マスク）」を**常時表示**（result.ok の内外問わず最上部・フィルタフォームの前）。やさしい日本語を主、技術名を併記。
  2. `auditGlossary.ts`: 用語定義の純データ（`{ term, plain, technical }[]`）を SSOT 化。Lane A/B どちらからも import 可。
  3. `auditErrorMessage.ts`: API エラー文字列 → 親切な日本語 + 対処ヒントへ変換する純関数。404 / date range（from>to）/ invalid cursor / generic を分岐。既存の 404 hint（266-268）を本関数へ集約。
  4. datalist 拡充: `action` プリセットに実 action（attendance.add, identity.merge, identity.dismiss 等、判明分）を追加。`targetType` にも datalist（meeting, admin_member_note 等）を付与。
- **id 方針**: guide に `data-component="audit-purpose-guide"`、用語リストに `data-testid="audit-glossary"`。
- **統合方針（Lane A との競合回避）**: `AuditLogPanel.tsx` の編集は **Lane A が構造の最終統合責任**を持つ。Lane B は新規ファイル3点を作り、AuditLogPanel への差し込み位置（guide=最上部, error=auditErrorMessage 経由）を仕様で明記。実装時は Lane A→B の順、または同一担当が統合する。Phase 5 仕様書に統合手順を明記。

### Lane C — reduce エラー根絶 + 回帰 spec
- **対象**: `apps/web/src/components/admin/TagCatalogPanel.tsx`（編集）, `apps/web/app/(admin)/admin/tags/catalog/page.tsx`（必要時編集）, 新規/編集 `apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx`
- **内容**:
  1. `TagCatalogPanel`: §3-2 の防御ガード (a) を実装（`initial?.items ?? []`, `initial?.total ?? 0`）。`counts` useMemo / pager 計算が undefined を踏まない。
  2. 真因確認 (b): `safeServerFetch` / `/admin/tags` レスポンス shape を実装時に照合。shape 不整合なら page.tsx で正規化。
  3. 回帰 spec: `initial.items === undefined` / `initial === undefined` / `initial.total === undefined` でクラッシュせず空表示になることを検証する component spec を追加。

---

## 5. デザイン仕様（カード型タイムライン）

### 5-1. カードレイアウト（AuditLogCard）
```
┌──────────────────────────────────────────────┐
│ 2026-06-09 21:52:38 JST        [identity.merge] │  ← 日時(時刻) + action バッジ(Chip tone=info)
│ 実行者: a***@example.com                          │  ← actor（maskAuditText）。system の場合「システム」
│ 対象: member / MEM-01                            │  ← targetType / targetId（null は「—」）
│ バッチ: 91ea7d09… [コピー]                        │  ← batchId があれば。BatchIdCopyButton 再利用
│ ▸ 変更内容を表示（before → after）                 │  ← 1つの <details>。中に before/after を並置
└──────────────────────────────────────────────┘
```
- カード = `<article>` or `<li>`。タイムラインは `<ol>`/`<ul>`。
- action バッジは既存 `Chip`（tone="info" 等）を再利用。
- 折りたたみ内: before（マスク済 JSON）と after（マスク済 JSON）を縦に並置 + parseError があれば note。

### 5-2. appliedFilters チップ列
```
現在の絞り込み:  [action=identity.merge] [期間 2026-06-01〜2026-06-09] [limit=50]
（未指定時）   現在の絞り込み: なし（直近 50 件を新しい順に表示）
```
- `auditAppliedFilters.ts` の純関数 `toAppliedFilterChips(filters: AdminAuditFilters | undefined, fallbackLimit: string): AppliedFilterChip[]` で生成。
- 各チップは既存 `Chip` primitive。

### 5-3. CSS（globals.css `@layer components` 末尾追記）
- `.admin-audit-timeline`（縦並び gap）, `.admin-audit-card`（border/padding/radius は既存トークン）, `.admin-audit-card__head`（日時 + action 横並び）, `.admin-audit-applied-filters`（chip-row）, `.admin-audit-purpose`（guide 枠）。
- 色・余白は `var(--ubm-color-*)` / `var(--ubm-space-*)` / `color-mix(in oklch, ...)` のみ。**HEX 禁止**。
- 既存 `.admin-audit-table*` は当面残置可（他参照確認後、未使用なら Phase 8 リファクタで削除検討。削除時は `grep` でゼロ参照を証跡化）。

---

## 6. 受入条件（AC）

| ID | 受入条件 | 検証方法 |
|----|---------|---------|
| AC-1 | `/admin/audit` の結果表示がカード型タイムラインで、各ログの「いつ/誰が/何を/対象/バッチ/変更内容」が1カードで読める | AuditLogCard component spec + Phase11 screenshot |
| AC-2 | `appliedFilters` が画面上部にチップ列で可視化される（未指定時は「なし（直近N件）」） | auditAppliedFilters 純関数 spec + AuditLogPanel spec |
| AC-3 | 「この画面でできること」+ 用語ガイドが常時表示される（result.ok 内外問わず） | AuditPurposeGuide spec + page 統合 |
| AC-4 | API エラーが親切な日本語 + 対処ヒントで表示される（404/date range/cursor/generic 分岐） | auditErrorMessage 純関数 spec |
| AC-5 | action / targetType に入力補助 datalist がある | AuditLogPanel spec（datalist option 検証） |
| AC-6 | `TagCatalogPanel` が `initial.items`/`initial.total` undefined でクラッシュせず空表示になる（reduce エラー根絶） | TagCatalogPanel.reduce-guard spec |
| AC-7 | 既存 exported 純関数（maskAuditJson 等）のシグネチャと既存テストが維持される | 既存 AuditLogPanel.component.spec 全 PASS |
| AC-8 | `apps/api` 非変更（既存 endpoint surface のみ利用・D1/Form 不変） | `git diff --name-only -- apps/api` が空 |
| AC-9 | HEX 直書きゼロ・OKLch トークンのみ | `mise exec -- pnpm verify:tokens`（design-token gate） |
| AC-10 | typecheck / lint / 対象 vitest が緑 | 検証コマンド（§8） |

---

## 7. スコープ外（未タスク候補・先送り判断の根拠付き）

> CONST_007: 以下は「今回サイクル内で完了させると破綻する／独立スコープ」の明確な理由があるもののみ。分量・複雑さを理由に切らない。

| 候補 | 今回やらない理由（破綻条件） | 実施場所 |
|------|------------------------------|---------|
| OOS-1: 監査ログ total 件数表示 | API が append-only cursor pagination 設計で total を返さない。total 表示には **API endpoint 変更**が必要 → 不変条件1（apps/api 非変更）に抵触 | 別Issue（API 拡張を伴う） |
| OOS-2: CSV/JSON エクスポート | 新規 endpoint または client 側大規模機能。初回価値（読める化）と無関係な独立スコープ | 別Issue |
| OOS-3: catalog→redirect 統合（TagCatalogPanel 廃止） | 別ワークフロー `admin-tag-definition-unify-...` の責務。本タスクは現行コードの防御に限定（重複実装回避） | 既存別WF |
| OOS-4: 旧 `.admin-audit-table*` CSS 削除 | 他画面参照の有無を全 grep 確認後に判断。未使用確定なら Phase 8 で削除、参照ありなら残置 | 本タスク Phase 8 で判定（残れば未タスク） |

---

## 8. 検証コマンド（実装時に実行・本プロンプトでは実行しない）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \
  apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx
git diff --name-only -- apps/api    # 空であること（AC-8）
# 仕様書 gate（本プロンプトで実行）
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/artifacts.json \
  docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/outputs/artifacts.json
mise exec -- pnpm indexes:rebuild
```

---

## 9. 想定変更ファイル一覧（Phase 5 で確定）

| パス | 種別 | レーン |
|------|------|--------|
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | A(主)/B(統合) |
| `apps/web/src/components/admin/AuditLogCard.tsx` | 新規 | A |
| `apps/web/src/components/admin/auditAppliedFilters.ts` | 新規 | A |
| `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 新規 | B |
| `apps/web/src/components/admin/auditGlossary.ts` | 新規 | B |
| `apps/web/src/components/admin/auditErrorMessage.ts` | 新規 | B |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | B |
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | 編集 | C |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | 編集（真因が shape 不整合の場合のみ） | C |
| `apps/web/src/styles/globals.css` | 編集 | A/B |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 新規 | A |
| `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | 新規 | A |
| `apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx` | 新規 | B |
| `apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts` | 新規 | B |
| `apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx` | 新規 | C |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 編集（カード化に伴う既存 assertion 調整・既存意図は保持） | A |

---

## 10. Phase 12 正本フォーマット注意（gate 厳格・先例 admin-attendance-dashboard-ux 準拠）

- `outputs/phase-12/` strict 7: `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md`。
- `implementation-guide.md` は **Part 1（中学生レベル・例え話）/ Part 2（技術詳細）/ 視覚証跡** を必須。
- `phase12-task-spec-compliance-check.md` の canonical 9 セクション: 1.Summary verdict / 2.Changed-files classification / 3.workflow_state and phase status consistency / 4.Phase 11 evidence file inventory / 5.Phase 12 strict 7 file inventory / 6.Skill/reference/system spec same-wave sync / 7.Runtime or user-gated boundary / 8.Archive/delete stale-reference gate / 9.Four-condition verdict。
- Phase 11 evidence inventory の status 語彙は **`present` / `pending` / `n/a` のみ**（厳密）。`implemented_local_evidence_captured` ゆえ実 PNG は無し → screenshot 行は `pending`（capture runtime_pending）。
- `implemented_local_evidence_captured` なので Phase 11 screenshot は実 PNG 不要。`screenshots/.gitkeep` を残す or `pending` 明記。VISUAL なので screenshot-plan は VISUAL + capture pending。
- `gate-metadata`: pending gate には `passed_at: null` を明示。Gate-A=spec_review(passed), Gate-B=implementation_review(passed: local implementation + focused tests), Gate-C=external_ops(pending)。
- `artifacts.json` と `outputs/artifacts.json` は parity（同一 metadata/gates/phases）。
- close-out（completed-tasks 移動）は**しない**（implemented_local_evidence_captured・実装/PR は user-gated 別タスク）。

---

## 11. user-gated 境界（本プロンプトで絶対にしないこと）

- コード実装の実行（仕様書に手順を書くのみ）
- commit / git push / PR 作成
- staging deploy / D1 操作 / screenshot 実撮影
- これらはすべて Phase 13 = user の明示承認後。
