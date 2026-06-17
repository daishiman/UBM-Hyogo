# Phase 1 要件定義 — main

> 正本: `../../_shared-context.md`。本ファイルは Phase 1 の要件確定実体。

## Step 0: P50 前提確認（実装状態の git/grep 確認）

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在するか | **Yes** — `/admin/audit` は稼働中。先行タスク #1202（`admin-audit-log-ux-clarity-and-reduce-error-fix`）でカード型タイムライン + 用語ガイド常時表示 + appliedFilters 可視化 + エラー親切化が実装済み |
| 現状の問題 | **英語表記・技術キー名が UI 露出**。①フィルタフォームの `FormField` label が技術キー（`action` / `actorEmail` / `targetType` / `targetId` / `from (JST)` / `to (JST)` / `batchId` / `limit`）、②適用フィルタチップが英語（`action` / `actor` / `target type` 等）、③カードの操作コード（`attendance.add` / `admin.member.status_updated`）・対象種別（`meeting` / `admin_member_note`）が生表示、④`auditId` ラベル + datalist placeholder が英語丸出し、⑤カードブロック未整列（チップ改行はみ出し・用語集/カード meta グリッド不均等・フィルタ 8 項目フラットで初見負荷） |
| upstream（dev / main）にマージ済みか | #1202 は merge 済み。**本タスクは表現層（component + glossary + globals.css）の追従改善**であり、新規ファイル追加は無し（既存ファイル編集 + テスト追加のみ） |
| 前提タスク完了済みか | **Yes** — #1202（カード型タイムライン基盤）・ui-prototype-alignment（tokens / primitives 正本）が完了済み。依存解消タスク不要 |

> **結論**: 本タスクは「データ供給・カード基盤は完備しているが、言葉が英語・技術キーのままで非エンジニアに不親切」という表現層の問題への追従改善。`implementation_mode = enhance`。データ取得・型・endpoint・query param キーは既存をそのまま使うため、Phase 5 の実装範囲は `apps/web/src/components/admin/` 配下と `globals.css` に閉じる。

## Inventory（対象資産）

### 対象実装ファイル（6 件・全て `apps/web/src/`）

| # | ファイル | current 役割 | 本タスクの改修方針（concern） |
| --- | --- | --- | --- |
| 1 | `components/admin/auditGlossary.ts` | 用語集 SSOT（`AUDIT_GLOSSARY` / `AUDIT_ACTION_PRESETS` / `AUDIT_TARGET_TYPE_PRESETS`） | **C1**: `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` + `describeAuditAction` / `describeAuditTargetType` / `describeAuditField`（未登録 raw fallback）を追加 |
| 2 | `components/admin/AuditLogPanel.tsx` | フィルタフォーム（`FormField` 8 項目）+ ログリスト統括 | **C1/C2**: ラベルを `describeAuditField` 経由で日本語化 + 2 層段階開示（`<details className="admin-audit-filter-advanced">`）+ datalist placeholder 日本語化 |
| 3 | `components/admin/AuditLogCard.tsx` | 監査ログ 1 件のカード（`item.action` / `item.targetType` 生表示・`auditId` ラベル） | **C1/C3**: action を `describeAuditAction`、targetType を `describeAuditTargetType` で表示。`auditId` ラベルを「ログID」等へ |
| 4 | `components/admin/auditAppliedFilters.ts` | 適用フィルタチップ生成（純関数・英語 label 固定） | **C1**: チップ label / value を describe helper 経由で日本語化（英語キー名露出ゼロ） |
| 5 | `components/admin/AuditPurposeGuide.tsx` | 用語ガイド常時表示（用語集グリッド） | **C3**: 用語集グリッド整列に伴う軽微調整（必要時のみ） |
| 6 | `styles/globals.css` | `.admin-audit-*` 系 / `.chip-row` のスタイル実体 | **C3**: `.chip-row` flex-wrap / `.admin-audit-glossary` / `.admin-audit-card__meta` 整列 + `.admin-audit-filter-advanced`（details）追加 |

### テストファイル（4 件・`apps/web/src/components/admin/__tests__/`）

| # | ファイル | 区分 | 本タスクの扱い |
| --- | --- | --- | --- |
| 1 | `__tests__/auditGlossary.spec.ts` | 新規 | describe helper 正常系 + 未登録 raw fallback / ラベルマップのユニットテスト |
| 2 | `__tests__/auditAppliedFilters.spec.ts` | 新規/追従 | チップ日本語化・英語キー名ゼロの検証 |
| 3 | `__tests__/AuditLogPanel.component.spec.tsx` | 新規/追従 | 日本語ラベル表示・details 段階開示（値ありで open）・`<input name>` 英語維持の検証 |
| 4 | `__tests__/AuditLogCard.spec.tsx` | 新規/追従 | action/targetType 日本語表示・未登録 raw fallback の検証 |

> `__tests__/` の実ファイル名は Phase 4/5 で既存テスト構成を確認のうえ確定する（既存があれば追従、無ければ新規）。新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。

### スタイリング / token

| 対象 | パス | 本タスクの扱い |
| --- | --- | --- |
| `.admin-audit-*` / `.chip-row` 系 | `apps/web/src/styles/globals.css`（`@layer components`） | flex-wrap / grid 整列クラス追加・既存クラスのリズム調整 |
| design token 正本 | `apps/web/src/styles/tokens.css` | 参照のみ（token 追加なし）。色 OKLch / 余白 4px grid（`--ubm-space-2` 等） |

## 命名規則（current コードベース分析）

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| React コンポーネント | **PascalCase**（ファイル名 = export 名） | `AuditLogPanel.tsx` → `AuditLogPanel`、`AuditLogCard.tsx` → `AuditLogCard`、`AuditPurposeGuide.tsx` → `AuditPurposeGuide` |
| ヘルパ関数 | **camelCase** | `describeAuditAction` / `describeAuditTargetType` / `describeAuditField`（新規・既存 helper 規則と整合） |
| 定数 map | **UPPER_SNAKE_CASE** | `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS`（既存 `AUDIT_GLOSSARY` / `AUDIT_ACTION_PRESETS` 規則と整合） |
| helper / 定数モジュール | **camelCase ファイル名** | `auditGlossary.ts` / `auditAppliedFilters.ts` |
| CSS クラス | **`.admin-audit-*` BEM 風**（`__` element / `--` modifier） | `.admin-audit-glossary` / `.admin-audit-card__meta` / 新規 `.admin-audit-filter-advanced`。チップ行は既存 `.chip-row` |

> **命名一貫性（[FB-SDK-07-4]）**: 新規 helper は `describeAuditXxx`（camelCase・`Audit` を含む）、map は `AUDIT_XXX_LABELS`（UPPER_SNAKE）とし、既存命名規則と完全整合する。

## 受入条件（AC-1〜AC-12）と test 検証手段

| AC | 内容 | test 検証手段 |
| --- | --- | --- |
| **AC-1** | フィルタフォーム全ラベルが日本語化。`<input name>`（query param キー）は英語のまま不変 | `AuditLogPanel.component.spec.tsx` で `getByLabelText("操作の種類")` の `name` 属性が `"action"` であることを assert |
| **AC-2** | フィルタが 2 層（常時 5 / details「詳細な絞り込み」3）。詳細フィルタに値があれば details デフォルト `open` | `AuditLogPanel.component.spec.tsx` で `<details>` の `[open]` 属性を値あり/なしの 2 ケースで assert |
| **AC-3** | カードの action / targetType が日本語表示。未登録のみ生コード fallback | `AuditLogCard.spec.tsx` で「出席を追加」等の日本語 + 未登録コードの raw fallback を assert |
| **AC-4** | 適用フィルタチップが日本語化、英語キー名露出ゼロ | `auditAppliedFilters.spec.ts` で日本語 label + 英語キー名 `queryByText` が null |
| **AC-5** | datalist placeholder / `auditId` ラベルの英語キー名解消 | `AuditLogPanel.component.spec.tsx` / `AuditLogCard.spec.tsx` で placeholder 日本語例示 + `auditId` → 「ログID」 assert |
| **AC-6** | `auditGlossary.ts` に 3 ラベルマップ + 3 describe helper（raw fallback） | `auditGlossary.spec.ts` で各 helper の正常系 + 未登録 fallback を unit テスト |
| **AC-7** | カードブロック整列（チップ flex-wrap / グリッド破綻なし） | `verify-design-tokens` + Phase 11 visual + DOM クラス存在 assert |
| **AC-8** | 全色 OKLch トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` ゼロ | `grep -rnE "#[0-9a-fA-F]{3,6}\|bg-\[#\|text-\[#"` で 0 件（`verify-design-tokens` gate） |
| **AC-9** | API / D1 / Form / shared 型変更ゼロ。query param キー名不変 | `git diff --name-only -- apps/api packages/shared` が空 |
| **AC-10** | 新規 primitive 追加ゼロ（既存 `Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / native `<details>` 再利用） | `apps/web/src/components/ui/` への新規ファイル追加 diff が 0 件 |
| **AC-11** | アクセシビリティ維持（label 関連付け / `<details>`/`<summary>` キーボード / 適用フィルタ `aria-label` / WCAG 2 AA） | spec で `getByLabelText` / `aria-label` の存在 assert + Phase 11 でコントラスト確認 |
| **AC-12** | 既存挙動温存（検索 / リセット / ページネーション / PII マスク / JSON 開示 / エラー親切メッセージ不変） | 既存 spec の回帰 PASS + 該当挙動 spec |

## VISUAL タスク宣言

- 本タスクは **VISUAL タスク**（UI/UX 表現層の変更を伴う）。
- Phase 11 で screenshot を取得する。`screenshot-plan.json` は `mode: "VISUAL"` をデフォルトとし、`phase11-capture-metadata.json` の `taskId` を `admin-audit-log-japanese-clarity-and-filter-collapse` に一致させる。
- screenshot 命名は canonical 名（`audit-page-full` 等、screenshot-plan.json と一致）を使う（[FB-VISUAL-CAP-001]）。
- Phase 11 着手時に本宣言を必ず参照し、分類変更があれば再判定を明示する（[Feedback 3]）。
- capture 対象: `/admin/audit`（staging 認証済み admin）。状態 = 通常（ログあり）/ 詳細フィルタ閉（値なし）/ 詳細フィルタ開（値あり）/ 適用チップ複数 / モバイル幅。

## スコープ外（今サイクルでは扱わない）

| 項目 | 除外理由 |
| --- | --- |
| CSV エクスポート / total 件数表示 | 先行タスクの Future scope 踏襲・本サイクル対象外 |
| query param キー名の日本語化 | API 契約のため不可（`<input name>` は英語維持・UI ラベルのみ日本語化）→ AC-9 / 不変条件 ui-prototype #1 |
| 監査ログ以外の admin 画面の同種改善 | 別タスク |
| 未登録 action コードの SSOT 網羅 | DB 実データ調査が必要 → 出現時に Phase 12 未タスク化候補 |
| 新規 UI primitive の追加 | AC-10 / ui-prototype #3 違反 |

> 上記はスコープ外として明記するのみ。未タスク化（backlog 起票）の判断は Phase 12 で行う。

## handoff（Phase 2 へ）

1. concern は C1（用語集 SSOT 拡張）/ C2（フィルタ段階開示）/ C3（カードブロック整列）の 3 分割。
2. C1 helper（`describeAuditXxx`）・map（`AUDIT_XXX_LABELS`）は既存命名規則に整合。未登録 raw fallback を持つ。
3. 状態所有権: フィルタ値（既存・query param 駆動）は不変 / details open は新規だが DOM 属性 `defaultOpen` 算出（内部 state を新設しない・[VSCPKR-03]）。
4. 既存 primitive のみ使用（`Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / native `<details>`）。
5. `<input name>`（query param キー）は英語のまま不変（AC-9）。describe helper は表示専用。
