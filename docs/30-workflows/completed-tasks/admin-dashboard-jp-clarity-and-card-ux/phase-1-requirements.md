# Phase 1: 要件定義

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`

## 目的

管理ダッシュボード `/(admin)/admin` を、エンジニアでない支部会運営者が迷わず読める状態にする。英語ラベル・技術用語の日本語化と、「直近のアクション」「公開ステータス」の視覚情報設計の是正を、`apps/web` 表現層のみで完結させる。

## 実装区分判定（CONST_004）

**[実装区分: 実装仕様書]**。判定根拠:

- 目的が「ラベルを日本語化する」「カード型に再設計する」「グラフをコンパクトにする」であり、いずれも `apps/web/src/**` の `.tsx` / `.ts` ファイル変更なしには達成できない。
- ドキュメント・調査・合意形成だけでは「動作させる/見やすくする」目的を満たせない。
- よって CONST_005 必須項目（変更ファイル一覧・関数/型シグネチャ・入出力・テスト方針・実行コマンド・DoD）をすべて満たす実装仕様書として作成する。

## タスク分類（[Feedback 3] Phase 11 判定基準）

- **UI task（VISUAL）**。画面の見た目・文言・レイアウトを変更するため、Phase 11 は VISUAL（screenshot 計画あり）として扱う。
- implemented_local_runtime_pending の段階では実 PNG は未取得（`staging_visual_pending_user_gate`）。実装後に staging で取得する（Phase 11 / Phase 13 は user-gated）。

## 命名規則の分析（[FB-01] / [FB-SDK-07-4] 命名整合）

current コードベースの命名規則を確認し、新規コードを整合させる。

| 対象 | current 規則 | 本タスクの新規命名 |
| --- | --- | --- |
| glossary SSOT ファイル | `schemaHistoryGlossary.ts` / `schemaGlossary.ts`（camelCase ファイル名・`apps/web/src/lib/admin/` または `apps/web/src/components/admin/`） | `apps/web/src/lib/admin/dashboardGlossary.ts` |
| ラベル定数 | `SCHEMA_GLOSSARY`（UPPER_SNAKE） / `schemaHistoryGlossary`（camel） | 定数は `DASHBOARD_KPI_LABELS` / `MEMBER_STATUS_LABELS` 等 UPPER_SNAKE、accessor は `describeAuditAction` / `describeTargetType`（camelCase 関数） |
| accessor 関数 | `describeDiffType(type)`（schemaGlossary.ts） | `describeAuditAction(code)` / `describeTargetType(type)` で踏襲 |
| React コンポーネント | PascalCase（`KpiCard` / `StatusDistribution`） | 既存ファイル名・export 名を維持（rename しない） |
| テストファイル | `*.spec.ts(x)`（不変条件 #8） | `*.spec.ts(x)` のみ |

## 既存コード inventory（変更前の事実）

| ファイル | 行 | 現状の問題 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | 16-29 | `label="Total members"` 等の英語直書き 4 箇所 |
| `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | 27 | `uppercase` で全大文字化（英語前提の装飾） |
| `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 17, 19, 27 | 「スキーマ未解決」「alias の確定が必要」「schema 管理を開く」 |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | 41, 66 | `DISTRIBUTION` eyebrow（英語大文字） |
| `apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx` | 49-54 | `{row.action}`（生コード）/ `{row.targetType}{:targetId}` を raw 表示・truncation 無し・4 列 table |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | 5-13, 99-137 | `VIEWBOX.width=600` 固定 SVG 縦棒グラフ |

### データ契約（変更しない・正本）

`AdminDashboardView`（`packages/shared/src/types/viewmodel/index.ts:178-186`）:

```ts
recentActions: Array<{
  auditId: string;
  actorEmail: string | null;
  action: string;       // 例: "admin.member.status_updated" / "attendance.add"
  targetType: string;   // 例: "member" / "meeting" / "tag"
  targetId: string | null;
  createdAt: string;    // ISO8601（JST 表示は formatJstDateTime で行う）
}>;
```

`StatusSlice`（`apps/web/src/lib/admin/admin-dashboard-ui.ts:15-18`）: `status: "public"|"member_only"|"hidden"` / `count: number`。

> この shape は API 正本（不変条件 #1 #5）。**本タスクでは一切変更しない**。日本語化は UI 表現層の glossary 変換でのみ行う。

## audit アクションコードの実値（glossary 対象の確定）

`apps/api/src/**` の grep で確認した発行され得るコード（`describeAuditAction` のキー）:

| action code | 日本語ラベル |
| --- | --- |
| `admin.member.status_updated` / `member.status_updated` | 会員の公開状態を変更 |
| `admin.member.deleted` / `member.deleted` | 会員を削除 |
| `member.note.created` | 会員メモを追加 |
| `admin.meeting.created` | 開催回を作成 |
| `attendance.add` | 出席を記録 |
| `attendance.import.add` | 出席を一括取り込み |
| `attendance.remove` | 出席を取り消し |
| `admin.tag.created` | タグを作成 |
| `admin.tag.updated` | タグを更新 |
| `tag.queue.resolved` / `admin.tag.queue_resolved` | タグ付けキューを解決 |
| `admin.tag.queue_dlq_moved` | タグ付けキューを保留へ移動 |
| （未登録コード） | raw コードをそのまま返す（fallback・情報欠落させない） |

targetType の日本語化（`describeTargetType` のキー）:

| targetType | 日本語ラベル |
| --- | --- |
| `member` | 会員 |
| `meeting` | 開催回 |
| `tag` | タグ |
| `admin_member_note` | 会員メモ |
| `schema` | フォーム項目 |
| （未登録） | raw 値をそのまま返す |

> **設計方針（[WEEKGRD-02] 防御的 fallback）**: glossary は「正規化しても fallback は原入力を保持」する。未登録の action / targetType は raw 文字列をそのまま表示し、情報を握り潰さない（[FB-NOTION-001] 同型）。

## Acceptance Criteria

| AC | 内容 | 検証 Phase |
| --- | --- | --- |
| AC-1 | KPI 4 枚のラベルが日本語（会員総数 / サイト公開中 / タグ未設定 / 要対応のフォーム項目）になり、`uppercase` が撤廃されている | Phase 6（KpiGrid.spec / KpiCard.spec） |
| AC-2 | SchemaAlertCard の文言が平易な日本語で、「スキーマ」「alias」「schema」の技術語が排除/言い換えされている | Phase 6（SchemaAlertCard.spec） |
| AC-3 | ZoneDistribution の `DISTRIBUTION` eyebrow が日本語（会員分布）になっている | Phase 6（ZoneDistribution.spec） |
| AC-4 | 直近のアクションがカード型アクティビティリストに再設計され、アクション/targetType が日本語化、対象 ID が truncation でカード内に収まる（テーブル廃止） | Phase 6（RecentActionsTable.spec） |
| AC-5 | 公開ステータスがコンパクト横バーリストに再設計され、600px 固定 SVG が廃止されている | Phase 6（StatusDistribution.spec） |
| AC-6 | 用語 SSOT `dashboardGlossary.ts` が新設され、KPI/アクション/targetType/ステータスのラベルを一元管理し fallback を持つ | Phase 6（dashboardGlossary.spec） |
| AC-7 | 色は OKLch トークンのみ。HEX 直書き 0 件・`verify:tokens` PASS | Phase 9 |
| AC-8 | `apps/api` / D1 / Google Form 非変更。`git diff --name-only -- apps/api` が空 | Phase 9 |
| AC-9 | 既存テスト契約（aria-label「公開ステータス分布: …」/ testid `status-distribution-chart` 系 / axe violations 0）を維持しつつ新構造のテストへ更新 | Phase 6 |
| AC-10 | focused vitest（`_dashboard` + RecentActionsTable + dashboardGlossary）が PASS | Phase 7 |

## スコープ外（OOS）

| OOS | 内容 | 理由・分離先 |
| --- | --- | --- |
| RES-1 | `/admin/audit`（`AuditLogPanel.tsx`）への glossary 適用 | 初期は別サーフェスとして分離したが、automation-30 レビューで未タスク化の根拠不足を検出し同サイクルで実装済み |
| OOS-2 | API 側のアクションコード体系の再設計・i18n フレームワーク導入 | API 変更を伴い不変条件 #1 #5 に抵触。本タスクは UI 表現層のみ |
| OOS-3 | ダッシュボード以外の管理画面（members/tags/meetings/schema/requests/identity）の英語表記一斉点検 | ユーザーの明示対象はダッシュボード。各画面は固有の改善サイクルで扱う |

## 統合テスト連携

- focused vitest（`apps/web/src/features/admin/components/_dashboard` + `RecentActionsTable.spec.tsx` + `dashboardGlossary.spec.ts`）で構造・文言・トークン・glossary fallback を検証する。
- jsdom は CSS を評価しないため、レイアウトの「はみ出し/横長」是正の最終確認は Phase 11 の staging スクリーンショット（実装後・user-gated）で行う。
- `verify:tokens`（HEX 直書き検出）と `git diff --name-only -- apps/api`（API 非変更）を Phase 9 で gate とする。

## 成果物

- 本ファイル（要件定義）: AC-1..AC-10、実装区分判定、命名規則分析、既存コード inventory、glossary 対象（action/targetType）の確定、RES-1 / OOS-2..3。
- 後続 Phase の正本となる scope / 受入条件 / データ契約（不変）の固定。

## 完了条件

- [ ] AC-1..AC-10 を Phase 4-10 に trace した。
- [ ] glossary の対象 action/targetType を実 API コードに基づき列挙した。
- [ ] 変更ファイル（新規 5 / 編集 8）を確定した。
- [x] RES-1（audit 画面）を automation-30 レビューで同サイクル実装へ昇格し、`AuditLogPanel` と component spec に反映した。
