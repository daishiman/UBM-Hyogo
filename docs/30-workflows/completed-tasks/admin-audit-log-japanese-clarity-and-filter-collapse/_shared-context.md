# admin-audit-log-japanese-clarity-and-filter-collapse — 共有コンテキスト（SSOT）

> 本ファイルは全 Phase（1〜13）が矛盾なく参照する単一の正本（Single Source of Truth）。
> 各 phase / outputs はここで固定した真因・方針・AC・ファイル一覧・不変条件に従う。

## 0. タスク要約

`/admin/audit`（監査ログ）画面を、**Apple UI/UX エンジニアの視点で非エンジニアの管理者でも直感的に操作できる**よう、
英語表記・技術キー名の露出を日本語へ平易化し、フィルタフォームを段階開示（よく使う項目 + 詳細な絞り込み）へ再構成し、
カードブロックのレイアウトを整列する。**API / D1 / Google Form schema / 型は一切変更せず、`apps/web` 表現層のみで達成する。**

- 実装区分: **実装仕様書（VISUAL / コード変更を伴う）**
- 種別: implementation（implemented_local_evidence_captured — apps/web 表現層実装 + focused Vitest 完了。staging screenshot / commit / PR は user-gated）
- スコープ: `web_presentation_layer`（apps/web の component / glossary / globals.css / focused test のみ）

## 1. 背景・前提

監査ログ画面は先行タスク `admin-audit-log-ux-clarity-and-reduce-error-fix`（#1202）で
「カード型タイムライン + 目的・用語ガイド常時表示 + appliedFilters 可視化 + エラー親切化」へ刷新済み。
しかし依然として **英語表記・技術キー名が UI に露出**しており、非エンジニアの管理者には直感的でない。
本タスクはその上位レイヤの「言葉の平易化 + 操作導線の段階化 + ブロック整列」を担う追従改善。

## 2. 真因（すべて apps/web 表現層）

| # | 現象 | 真因（file:line 目安） |
| --- | --- | --- |
| R-1 | フィルタフォームのラベルが英語キー名そのまま（`action` / `actorEmail` / `targetType` / `targetId` / `from (JST)` / `to (JST)` / `batchId` / `limit`） | `AuditLogPanel.tsx` の `FormField` `label` に技術キーを直接渡している（L90/103/106/119/122/125/129/139 付近） |
| R-2 | 適用フィルタチップが英語（`action` / `actor` / `target type` / `target id` / `batchId` / `limit`） | `auditAppliedFilters.ts` の `chips.push({ label: "action", ... })` 等（L29-41 付近）が英語ラベル固定 |
| R-3 | 操作コード（`attendance.add` / `admin.member.status_updated` 等）・対象種別（`meeting` / `admin_member_note` 等）が生表示 | `AuditLogCard.tsx` が `item.action` / `item.targetType` を変換なしで表示。datalist プリセットも生コード |
| R-4 | `auditId` ラベル生表示 + datalist プレースホルダ（`attendance.add` / `meeting \| admin_member_note` / `batch-id (uuid)`）が英語キー丸出し | `AuditLogCard.tsx` L54 の `auditId` ラベル、`AuditLogPanel.tsx` datalist の placeholder |
| R-5 | カードブロック未整列：適用フィルタチップ行が改行/はみ出し、用語集グリッド `minmax(170px)` 不均等、カード meta `minmax(150px)` 幅不定で truncate、フィルタ8項目フラットで初見負荷 | `globals.css` の `.chip-row`（wrap 未指定）/ `.admin-audit-glossary`（minmax）/ `.admin-audit-card__meta`（minmax）/ フォーム grid |

> **API は無罪**: `apps/api/src/routes/admin/audit.ts` の endpoint surface（query param キー `action`/`actorEmail`/`targetType`/`targetId`/`from`/`to`/`batchId`/`cursor`/`limit`）は変更しない。
> UI のラベルだけ日本語化し、`<input name="...">` の name 属性（= query param キー）は英語のまま維持する（API 契約）。

## 3. ユーザー確定方針（AskUserQuestion 2026-06-11）

| 論点 | 確定 |
| --- | --- |
| 操作コード・対象種別の表示 | **日本語ラベルのみ表示（生コード非表示）**。用語集 SSOT で変換し、未登録コードのみ情報欠落防止として生コードを fallback 表示する |
| フィルタフォーム構成 | **よく使う項目を常時表示、上級者向けは「詳細な絞り込み」折りたたみへ格納**。常時=操作の種類/実行者/期間(開始)/期間(終了)/表示件数、details=対象の種類/対象ID/一括処理ID |

## 4. 解決方針（concern 分割）

### C1: 日本語化 + 用語集SSOT拡張（`auditGlossary.ts`）

既存 `auditGlossary.ts`（`AUDIT_GLOSSARY` / `AUDIT_ACTION_PRESETS` / `AUDIT_TARGET_TYPE_PRESETS`）に以下を追加する。

```ts
// 操作コード → 日本語ラベル（生コード非表示の正本）
export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  "attendance.add": "出席を追加",
  "attendance.remove": "出席を取り消し",
  "identity.merge": "会員の名寄せ（統合）",
  "identity.dismiss": "名寄せ候補を却下",
  "admin.member.tag_assigned": "タグを割り当て",
  "admin.member.tag_unassigned": "タグを解除",
  "admin.member.status_updated": "会員ステータスを更新",
  "admin.tag.created": "タグを作成",
  "admin.request.approve": "申請を承認",
  "admin.meeting.created": "開催日を作成",
};

// 対象種別 → 日本語ラベル
export const AUDIT_TARGET_TYPE_LABELS: Readonly<Record<string, string>> = {
  meeting: "開催日",
  member: "会員",
  admin_member_note: "管理メモ",
  tag: "タグ",
};

// フィルタ/フォーム/チップのフィールド日本語ラベル（query param キー → 表示ラベル）
export const AUDIT_FIELD_LABELS: Readonly<Record<string, string>> = {
  action: "操作の種類",
  actorEmail: "実行者（メール）",
  targetType: "対象の種類",
  targetId: "対象ID",
  from: "期間（開始）",
  to: "期間（終了）",
  batchId: "一括処理ID",
  limit: "表示件数",
};

// helper: 登録あれば日本語、未登録は生コード fallback（情報欠落防止）
export const describeAuditAction = (code: string): string =>
  AUDIT_ACTION_LABELS[code] ?? code;
export const describeAuditTargetType = (code: string | null): string =>
  code == null ? "—" : (AUDIT_TARGET_TYPE_LABELS[code] ?? code);
export const describeAuditField = (key: string): string =>
  AUDIT_FIELD_LABELS[key] ?? key;
```

- 操作コードは**日本語ラベルのみ表示**（生コード非表示）。`describeAuditAction` が未登録時のみ生コードを返す（情報欠落防止の安全弁。常用想定ではない）。
- raw fallback の理由を spec / コメントに明記し、未登録コードが出た場合は Phase 12 未タスク（SSOT追記）候補として記録する。

### C2: フィルタフォーム段階開示（`AuditLogPanel.tsx`）

フォームを 2 層に再構成する。

- **常時表示**: 操作の種類（action）/ 実行者（actorEmail）/ 期間（開始）（from）/ 期間（終了）（to）/ 表示件数（limit）＋ 検索 / リセット
- **詳細な絞り込み**（`<details className="admin-audit-filter-advanced">` + `<summary>詳細な絞り込み（対象・一括処理ID）</summary>`）: 対象の種類（targetType）/ 対象ID（targetId）/ 一括処理ID（batchId）
- details の `open` 既定: **詳細フィルタ（targetType / targetId / batchId）に値があれば `open`**（適用中の高度条件を隠さない）。値が無ければ閉じた状態で初見負荷を下げる。
- 全 `FormField` の `label` は `describeAuditField(key)` 経由の日本語ラベル。`<input name>` / datalist は query param キー（英語）を維持。
- datalist `placeholder` は日本語の例示（例: 操作の種類 = 「例: 出席を追加」）へ。生コード露出を避ける。

### C3: カードブロック整列（`globals.css` / `AuditLogCard.tsx` / `AuditPurposeGuide.tsx`）

- 適用フィルタチップ行 `.chip-row`（または該当ラッパ）に `display:flex; flex-wrap:wrap; gap:var(--ubm-space-2)` を明示し、改行/はみ出しを解消。
- 用語集グリッド `.admin-audit-glossary` の `minmax(170px,1fr)` を整列が破綻しない値へ調整（行ごとの高さ揃え含む）。
- カード meta `.admin-audit-card__meta` の `minmax(150px,1fr)` を整列・truncate 安全な構成へ。
- フィルタ 2 層用の `.admin-audit-filter-advanced`（details）スタイルを追加。
- `AuditLogCard.tsx`: 操作（action）を `describeAuditAction`、対象種別を `describeAuditTargetType` で表示。`auditId` ラベルは「ログID」等の日本語へ。
- CSS は全て `var(--ubm-*)` トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止。配置は `globals.css` の `@layer components` 末尾。

## 5. 受入条件 (AC)

- **AC-1**: フィルタフォームの全ラベルが日本語化（操作の種類 / 実行者（メール）/ 対象の種類 / 対象ID / 期間（開始）/ 期間（終了）/ 一括処理ID / 表示件数）。`<input name>`（query param キー）は英語のまま不変。
- **AC-2**: フィルタフォームが 2 層（常時 = 操作の種類 / 実行者 / 期間×2 / 表示件数、`<details>`「詳細な絞り込み」= 対象の種類 / 対象ID / 一括処理ID）。詳細フィルタに値があれば details はデフォルト `open`。
- **AC-3**: 監査ログカードの操作（action）・対象種別（targetType）が日本語ラベルで表示される。未登録コードのみ生コード fallback。
- **AC-4**: 適用フィルタチップのラベル・値が日本語化され、英語キー名露出がゼロ（`describeAuditField` / `describeAuditAction` / `describeAuditTargetType` 経由）。
- **AC-5**: datalist プレースホルダ / `auditId` ラベル等の英語キー名露出が解消（`auditId` → 「ログID」等、placeholder は日本語例示）。
- **AC-6**: 用語集 SSOT `auditGlossary.ts` に `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` と `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` が追加され、未登録 raw fallback を持つ。
- **AC-7**: カードブロック整列：適用フィルタチップ行が `flex-wrap` で整列、用語集グリッド・カード meta グリッドが画面幅で破綻しない。
- **AC-8**: 全色が OKLch トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` がゼロ（CI gate `verify-design-tokens` pass）。
- **AC-9**: API / D1 / Form / shared 型の変更ゼロ。`apps/api`・`packages/shared` の diff ゼロ。query param キー名不変。
- **AC-10**: 新規 primitive 追加ゼロ（既存 `Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / ネイティブ `<details>` の再利用・invariant ui-prototype #3）。
- **AC-11**: アクセシビリティ維持（`FormField` の `aria-describedby` / label 関連付け、`<details>`/`<summary>` のキーボード操作、適用フィルタ `aria-label="現在の絞り込み条件"` 維持、WCAG 2 AA コントラスト）。
- **AC-12**: 既存挙動温存（検索 / リセット / ページネーション（cursor）/ PII マスク / JSON 開示 / エラー親切メッセージが不変）。

## 6. 変更対象ファイル一覧

| ファイル | 変更種別 | 主な変更 |
| --- | --- | --- |
| `apps/web/src/components/admin/auditGlossary.ts` | 編集 | `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` + `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` 追加（C1） |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | フォームラベル日本語化 + 2 層段階開示（`<details>`）+ datalist placeholder 日本語化（C1/C2） |
| `apps/web/src/components/admin/AuditLogCard.tsx` | 編集 | action / targetType 日本語表示 + `auditId` ラベル日本語化（C1/C3） |
| `apps/web/src/components/admin/auditAppliedFilters.ts` | 編集 | チップ label / value を describe helper 経由で日本語化（C1） |
| `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 編集 | 用語集グリッド整列に伴う軽微調整（C3。必要時のみ） |
| `apps/web/src/styles/globals.css` | 編集 | `.chip-row` wrap / `.admin-audit-glossary` / `.admin-audit-card__meta` 整列 + `.admin-audit-filter-advanced`（details）追加（C3） |
| `apps/web/src/components/admin/__tests__/auditGlossary.spec.ts` | 新規 | describe helper / ラベルマップ / raw fallback のユニットテスト |
| `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | 新規/追従 | チップ日本語化・英語キー名ゼロの検証 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 新規/追従 | 日本語ラベル表示・details 段階開示（値ありで open）・name 属性英語維持の検証 |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 新規/追従 | action/targetType 日本語表示・未登録 raw fallback の検証 |

> `__tests__/` の実ファイル名は Phase 1 で既存テスト構成を確認のうえ確定する（既存があれば追従、無ければ新規）。新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。

## 7. 触れる不変条件

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | `safeServerFetch` 経由のまま。D1 binding 不使用 |
| 8 | 新規 test は `*.spec.{ts,tsx}` のみ | 追加テストは `*.spec.{ts,tsx}` で作成 |
| 9 | admin form input は `FormField` 経由 | 既存 `FormField` を維持・直接 `<input>` を増やさない |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-9 で保証 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-8 で保証（`verify-design-tokens` gate） |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-10 で保証 |

## 8. スコープ外（OOS）

- CSV エクスポート / total 件数表示（先行タスクの Future scope 踏襲・本サイクル対象外）
- query param キー名の日本語化（API 契約のため不可・UI ラベルのみ日本語化）
- 監査ログ以外の admin 画面の同種改善（別タスク）
- 未登録 action コードの SSOT 網羅（DB 実データ調査が必要・出現時に Phase 12 未タスク化候補）

## 9. 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens                       # HEX/arbitrary color 0 件
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/admin/__tests__/auditGlossary.spec.ts apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
git diff --name-only -- apps/api packages/shared      # 空であること（AC-9）
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse
node --import tsx scripts/gate-metadata/validate.ts
```

## 10. 完了判定（仕様書作成タスクとして）

- Phase 1〜13 の仕様書（phase-01..13.md + outputs/phase-N/）が揃い、状態が `artifacts.json` と一致する
- `workflow_state: implemented_local_evidence_captured`（apps/web 表現層実装 + focused Vitest 完了。staging screenshot / commit / PR は user-gated）
- Gate-A（spec_review）passed、Gate-B（implementation_review）passed、Gate-C pending（PR は user-gated）
- focused Vitest / typecheck / lint / verify:tokens は PASS。Phase 11 screenshots 6 PNG は staging authenticated capture のため user-gated pending
- `verify:phase12-compliance` pass（canonical 9 見出し逐語 / Phase 11 evidence inventory `Classification|Path|Status` / local evidence present + screenshot pending）
- `gate-metadata:validate` ERROR 0（Gate-A passed → evidence 実在）
- AC-1〜AC-12 が phase-07（AC マトリクス）/ phase-10（最終レビュー）で完全トレースされる
