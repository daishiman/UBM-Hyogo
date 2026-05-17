# serial-05 step-03 schema diff resolve 履歴閲覧 UI - タスク指示書

## メタ情報

| 項目         | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| タスクID     | serial-05-step-03-followup-003-schema-diff-history-view                                           |
| タスク名     | SchemaDiffPanel 過去 resolve 履歴閲覧 UI の追加                                                   |
| 分類         | 改善 / admin 監査 UI 拡張                                                                         |
| 対象機能     | admin schema diff resolve の履歴閲覧（誰がいつどの alias を resolve したかの可視化）              |
| 優先度       | 中                                                                                                |
| 見積もり規模 | 中規模                                                                                            |
| ステータス   | pending                                                                                           |
| 発見元       | serial-05 step-03 Phase 12 後続候補                                                               |
| 発見日       | 2026-05-17                                                                                        |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/`
- 親タスク状態: `implemented`（現在 diff の resolve UI は完了、履歴閲覧は未着手）
- Phase 12 evidence 状態: 後続候補として `outputs/phase-12/unassigned-task-detection.md` §3 に明示済み（未消費）
- 関連 outputs:
  - `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md`
  - `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`（§3 後続候補「diff history view」）
- 関連実装:
  - `apps/web/app/(admin)/admin/schema/page.tsx`（既存 server component、history route 追加可否を本 spec §2 で判断）
  - `apps/web/src/components/admin/SchemaDiffPanel.tsx`（現状は「現在の diff」のみ描画）
  - `apps/web/src/lib/admin/api.ts`（`postSchemaAlias()` の隣に history fetch helper 追加候補）
  - `apps/api/src/routes/admin/schema.ts`（既存 endpoint surface）
  - `apps/api/src/routes/admin/audit.ts`（既存 audit log 経路、再利用判断点）
- 関連仕様:
  - `docs/00-getting-started-manual/specs/11-admin-management.md`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-05 step-03 にて `SchemaDiffPanel` は Google Form schema と D1 上の stableKey alias の差分を検出し、admin が「未確定 alias を resolve する」mutation UI を実装した。`apps/web/src/components/admin/SchemaDiffPanel.tsx` は現時点で「現在の diff（未解決状態）」のみを描画し、resolve 完了後の差分は UI から消える。

`apps/api/src/routes/admin/audit.ts` には汎用の admin 監査ログ経路（`actorId` / `actorEmail` / `createdAt` を保持し、cursor pagination 対応済み）が既に存在する。schema alias の resolve mutation もこの監査ログ経路を経由して記録される設計だが、**監査ログを横断検索する UI は存在せず、schema 領域に絞った履歴閲覧 UI は皆無**。

### 1.2 問題点・課題

- 「誰がいつどの question を どの stableKey に resolve したか」を admin が UI から確認できない
- 誤 resolve（typo な stableKey の確定など）を発見しても、過去の操作履歴に遡れず原因追跡できない
- 監査要件（個人情報保護方針および会員管理規程に基づく操作トレーサビリティ）に対して、現状の admin UI は「現在の状態」しか提供せず、claim 上の trail が UI から取れない
- followup-004（rollback / undo）を実装する際、起点となる「ロールバック対象の過去操作」を選択する UI が無い

### 1.3 放置した場合の影響

- 監査ログは API レイヤに存在するのに UI から到達できない死蔵状態が継続
- 誤 resolve の発見が D1 直接 query に依存し、admin の自力解消手段が無くなる（運用負荷が API 担当者へ偏る）
- followup-004 (rollback) の前提が欠落し、rollback タスクが先行着手できなくなる
- 運用振り返り（月次の resolve 頻度・操作者偏り）が定量化できず、process improvement の input が得られない

---

## 2. 何を達成するか（What）

### 2.1 目的

admin が schema diff resolve の過去履歴を時系列で閲覧・filter できる UI を `apps/web/app/(admin)/admin/schema/` 配下に追加し、parallel-09 で提供済みの shared FormField / Pagination primitive を再利用して構築する。既存 API endpoint surface を最大限維持し、新規 endpoint が必要な場合はその justify を本 spec §2.5 で確定させる。

### 2.2 最終ゴール

- admin が `/(admin)/admin/schema` 配下から履歴閲覧 UI へ遷移できる（route 構成は §2.5 で確定）
- 履歴一覧が pagination（cursor base、既存 audit endpoint と整合）で表示される
- filter（操作者 email / 期間 / question text 部分一致）が動作する
- 各行に `操作日時` / `操作者 email` / `before stableKey` / `after stableKey` / `question text` が表示される
- followup-004（rollback）から「履歴行 → rollback action 起動」の導線が貼れる構造になっている

### 2.3 スコープ

#### 含むもの

- 履歴一覧 UI コンポーネント（`apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` 新規）
- 履歴閲覧 page（route 構成は §2.5 で確定。新 route 追加 or 既存 schema page のタブ化）
- shared `Pagination` / `FormField` primitive (parallel-09) の再利用
- API 側: 既存 `/admin/audit` を `kind=schema_alias_resolve` で filter する経路の検証 / 不足分のみ最小追加
- `apps/web/src/lib/admin/api.ts` への history fetch helper 追加
- `*.spec.tsx`（component spec）と `apps/web/src/lib/admin/__tests__/api.spec.ts` への mutation/history fetch helper unit spec

#### 含まないもの

- rollback / undo 実装（followup-004 で別途扱う）
- bulk resolve（followup-002 候補で別途扱う）
- 履歴の CSV export（さらに後続）
- D1 schema 変更（既存 audit log table を再利用、新規 column 追加は禁止）

### 2.4 成果物

- `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`
- `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx`
- `apps/web/app/(admin)/admin/schema/` 配下の route 追加 or 既存 page 改修差分
- `apps/web/src/lib/admin/api.ts` に `fetchSchemaAliasHistory()` 追加
- `apps/web/src/lib/admin/__tests__/api.spec.ts` への unit spec 追加
- 必要に応じ `apps/api/src/routes/admin/schema.ts` または `apps/api/src/routes/admin/audit.ts` の最小拡張差分（§2.5 判断）
- `docs/00-getting-started-manual/specs/11-admin-management.md` への履歴閲覧 UI 仕様追記

### 2.5 判断点 — 既存 audit endpoint 再利用 vs 新 endpoint 追加

実装着手前に以下のいずれかを spec author が確定させ、本セクションを更新する。

| 案 | 概要 | 採用条件 | リスク |
| --- | --- | --- | --- |
| A. 既存 `/admin/audit?kind=schema_alias_resolve` 再利用 | `apps/api/src/routes/admin/audit.ts` 既存 cursor pagination をそのまま使い、UI 側で kind filter を渡す | 既存 audit log に schema resolve イベントが `kind` 識別可能な形で書かれている | audit log payload に before/after stableKey が含まれない場合は表示項目が欠落 |
| B. `/admin/schema/history` を新設 | `apps/api/src/routes/admin/schema.ts` に history endpoint を追加し、schema 領域専用 payload で before/after stableKey を返却 | 案 A で表示項目が満たせない、または kind filter の粒度が不足 | 既存 API endpoint surface 維持の不変条件に対する justify が必要（本 spec §1.2 監査要件で justify 可能） |

採用判断は実装着手時に audit log の実 payload を grep / spec で確認した上で確定。原則 **案 A を第一候補**とし、payload 不足が判明した場合のみ案 B へ昇格する。案 B 採用時は CLAUDE.md「既存 API endpoint surface 維持」不変条件に対する例外として、本 spec §1.2 の監査要件で justify する。

### 2.6 route 構成判断点

| 案 | 概要 | 採用条件 |
| --- | --- | --- |
| α. `/(admin)/admin/schema/history` 新 route | 履歴を独立 page として分離 | 履歴件数が多く、現 diff 表示と同居すると視覚的負荷が高い |
| β. 既存 `/(admin)/admin/schema` 内タブ | tab 切替で「現在の diff」「履歴」を同居 | 履歴閲覧頻度が低く、現 diff と context を共有したい |

原則 **案 α を第一候補**（独立 route）とし、parallel-09 の Breadcrumb primitive を活用して `admin > schema > history` の導線を提供する。

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 audit log schema との payload 整合

`apps/api/src/routes/admin/audit.ts` の既存 payload には `actorId` / `actorEmail` / `createdAt` / `auditId` は揃うが、schema resolve 固有の `before stableKey` / `after stableKey` / `question text` が `payload` JSON 列内にネストされているか、独立 column 化されているかは spec author が実装着手前に確認する必要がある。

対策候補:

1. `apps/api/src/routes/admin/audit.ts` の zod schema および返却型を grep し、`payload` 配下の構造を確定
2. `payload` JSON 内に before/after が無い場合は §2.5 案 B（schema 専用 history endpoint）へ昇格
3. 過去レコード（serial-05 step-03 以前の resolve）が無い場合、空状態 UI を EmptyState primitive で描画

### 3.2 admin actor 識別の cookie/session 経路

`actorId` / `actorEmail` は API 側で Auth.js session 由来で記録されているが、UI 側 filter の email 入力値が「session で記録される正規化済み email（小文字化等）」と一致する保証を取る必要がある。`apps/api/src/routes/admin/audit.ts` の 220 行目周辺で `actorEmail.toLowerCase()` 正規化が既にあり、UI 側 filter input も同様の正規化を施す。

### 3.3 表示パフォーマンス（大量履歴時の pagination 設計）

resolve 履歴は運用継続に従い単調増加するため、offset pagination ではなく既存 audit endpoint と同じ **cursor pagination** を採用する。cursor encoding は `apps/api/src/routes/admin/audit.ts` の `encodeAuditCursor({ createdAt, auditId })` を踏襲し、UI 側は cursor opaque string として扱う（内部構造に依存しない）。

1 ページあたりの表示件数は admin dashboard の既存 list 系（members / requests）と整合させ、**50 件 / page** を初期値とする。

### 3.4 shared primitive (parallel-09) の再利用

新規 primitive を生やさず、以下を再利用する（不変条件3「プロトタイプ正本順位」）:

- `Pagination`（parallel-09 提供、cursor base UI に対応）
- `FormField`（filter 入力の label / error / helpText を統一）
- `Breadcrumb`（`admin > schema > history` の階層導線）
- `EmptyState`（履歴 0 件時）
- `Icon`（操作種別 icon が必要な場合）

`useAdminMutation` は本タスクでは fetch 系のため不要（read-only）。read 系 hook が parallel-09 / parallel-10 にあれば再利用、無ければ `apps/web/src/lib/admin/api.ts` の `fetchSchemaAliasHistory()` を server component から直接呼ぶ構成とする。

### 3.5 デザイントークン整合

色は `apps/web/src/styles/tokens.css` の OKLch token のみ使用。`bg-[#xxx]` / HEX 直書きは禁止（CI gate `verify-design-tokens` で fail 判定）。before/after stableKey の差分強調も既存の `--color-warning` / `--color-info` 系 token を使用する。

---

## 4. 受入条件 (AC)

- **AC-1**: admin が `/(admin)/admin/schema` 配下から履歴閲覧 UI へ到達でき、過去 resolve 履歴が時系列降順で表示される
- **AC-2**: 履歴行に `操作日時 (ISO)` / `操作者 email` / `before stableKey` / `after stableKey` / `question text` が表示される
- **AC-3**: filter（操作者 email / 期間 (from/to) / question text 部分一致）が動作し、cursor pagination と組み合わせ可能
- **AC-4**: cursor pagination が `apps/api/src/routes/admin/audit.ts` 既存 encoding と整合し、`次の 50 件` ボタンで連続閲覧できる
- **AC-5**: 履歴 0 件時は `EmptyState` primitive で「該当する履歴がありません」を表示
- **AC-6**: shared primitive (Pagination / FormField / Breadcrumb / EmptyState) を再利用し、新規 primitive を追加しない
- **AC-7**: 色 token は OKLch のみ使用し、`verify-design-tokens` CI gate を pass する
- **AC-8**: 新 test ファイルは `*.spec.tsx` のみ（`*.test.tsx` 禁止、lefthook `block-test-suffix` pass）
- **AC-9**: `SchemaDiffHistoryPanel.component.spec.tsx` で「filter 入力」「pagination 操作」「空状態」「fetch エラー時の error boundary 連携」の 4 観点を網羅
- **AC-10**: §2.5 / §2.6 の判断点が実装着手時に確定され、本 spec に追記済み
- **AC-11**: 新 endpoint 追加（案 B）採用時は `docs/00-getting-started-manual/specs/11-admin-management.md` および `docs/00-getting-started-manual/specs/01-api-schema.md` に endpoint 追加が反映される
- **AC-12**: `outputs/phase-12/unassigned-task-detection.md` §3「diff history view（resolve 履歴の閲覧 UI）」が consumed に更新

---

## 5. 依存関係

- **followup-004 (rollback / undo) の前提タスク**: 本タスクで「履歴 → 行選択」の UI 基盤を提供することで、followup-004 が rollback 起点を選択可能になる
- **followup-002 (bulk resolve) とは独立**: bulk resolve 完了後の履歴は本 UI で個別行として表示可能（bulk 識別 flag があれば badge 表示候補、無くても可）
- **parallel-09 (UX cross-cutting primitives) 完了が前提**: Pagination / FormField / Breadcrumb / EmptyState primitive が parallel-09 で提供済みであることを利用

---

## 6. 参照資料

- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md` - 親 step の実装ガイド
- `docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3 - 後続候補「diff history view」
- `apps/web/src/components/admin/SchemaDiffPanel.tsx` - 現状の diff 表示 component（履歴 UI の隣接基盤）
- `apps/web/app/(admin)/admin/schema/page.tsx` - schema 領域 server component（route 追加 / タブ化の判断対象）
- `apps/api/src/routes/admin/schema.ts` - schema endpoint（案 B 採用時の追加対象）
- `apps/api/src/routes/admin/audit.ts` - 既存監査ログ経路（案 A 採用時の再利用対象、cursor pagination 実装参考）
- `apps/web/src/lib/admin/api.ts` - admin API helper（`fetchSchemaAliasHistory()` 追加先）
- `docs/00-getting-started-manual/specs/11-admin-management.md` - admin 管理仕様（更新対象）
- `docs/00-getting-started-manual/specs/01-api-schema.md` - API schema 仕様（案 B 採用時の更新対象）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション - 不変条件1「既存 API のみ接続」/ 不変条件2「OKLch トークン正本化」/ 不変条件3「プロトタイプ正本順位」/ 不変条件8「`*.spec.tsx` 固定」

---

## 7. 状態語彙

| 状態                    | 意味                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `pending`               | 未着手（本タスクの初期状態）                                           |
| `decision_required`     | §2.5 / §2.6 の判断点が未確定で着手不可                                |
| `in_progress`           | 実装中                                                                 |
| `implemented_local`     | 実装完了、CI 未通過                                                    |
| `completed`             | CI pass + PR merge + Phase 12 unassigned-task-detection で consumed 更新済み |
| `blocked_by_followup_004` | rollback タスクとの優先順位調整で待機（通常は本タスクが先行）         |
