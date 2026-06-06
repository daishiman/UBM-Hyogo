# Phase 1: 要件定義 — issue-1080 BulkActionBar 部分失敗結果 summary の表示名化

## タスク分類

| 項目                  | 値                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------- |
| task_type             | implementation（UI task）                                                            |
| visual_category       | **VISUAL_ON_EXECUTION**（実行時に result summary が可視化される UI 変更。Phase 11 で screenshot を取得する） |
| implementation_mode   | **new**（RED/GREEN サイクルで新規の表示解決ロジックとテストを追加する）              |
| scope area            | `apps/web` のみ（`apps/api` 非接触）                                                 |
| github_issue          | #1080（調査時点で実 OPEN。本タスクで Issue 状態は変更しない＝user-gated）            |
| parent workflow       | issue-1036-bulk-member-tag-assign（completed）                                       |

> **[Feedback 3] / [Feedback W1-02b-1]**: 本タスクは UI コンポーネント変更タスクのため、`screenshot-plan.json` は `mode: "VISUAL"` を既定とする。Phase 11 着手時に本 Phase の分類（VISUAL_ON_EXECUTION）を再参照する。

## 真の論点（1 文）

bulk tag 一括付与/解除の「部分失敗結果 summary」が **生 ID（memberId / tagId）** を露出しており、管理者がどの会員・どのタグでスキップが起きたか即座に判別できない。これを **表示名（member fullName / tag label）** へ置き換えて運用判読性を上げる。API contract は一切変えない。

## 受け入れ基準（AC）

| ID   | 受け入れ基準                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------- |
| AC-1 | `skipped_deleted`（退会済みスキップ）行に member の表示名（`fullName`）を表示する                       |
| AC-2 | `tag_not_found`（未登録タグ）行は label を解決して表示する。解決できない場合は `{tagId}（未登録）` を表示する |
| AC-3 | API response shape `{ memberId, tagId, status }` を維持する（`apps/api` 非接触・contract 不変）        |
| AC-4 | 表示名が引けない `memberId`（`membersById` に存在しない / prop 未注入）でも `memberId` fallback で壊れない |
| AC-5 | component test が「label 表示」と「fallback 表示」の双方を検証する                                     |

## inventory（変更対象ファイル一覧）

| パス                                                                                  | 変更種別 | 内容概要                                                                                                                        |
| ------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`                    | edit     | props に optional `membersById?` を追加。`available` から `tagLabelById` を `useMemo` で構築。skipped/notFound 行を表示名解決へ変更 |
| `apps/web/src/features/admin/components/_members/MembersClientShell.tsx`               | edit     | `initial.members` から `membersById`（`memberId → { fullName }`）を `useMemo` で構築し `BulkActionBar` へ注入       |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`              | edit     | 部分失敗 label 表示 + fallback の検証ケースを追加（詳細は Phase 4/6）                                                            |

### 依存型の出典（current facts。Read 済み）

| 型 / シンボル                  | 出典ファイル:行                                                                  | 形                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `AdminTagRef`                  | `apps/web/src/features/admin/api/members.ts:6`                                   | `{ tagId: string; code: string; label: string; category: string }`                                  |
| `BulkTagResultItem`            | `apps/web/src/features/admin/api/members.ts:76`                                  | `{ memberId: string; tagId: string; status: BulkTagItemStatus }`                                     |
| `BulkTagItemStatus`            | `apps/web/src/features/admin/api/members.ts:69`                                  | `"assigned" \| "unassigned" \| "noop" \| "skipped_deleted" \| "tag_not_found"`                       |
| `BulkApplyMemberTagsResult`    | `apps/web/src/features/admin/api/members.ts:82`                                  | `{ batchId: string; results: BulkTagResultItem[] }`                                                  |
| `fetchTagMaster()`             | `apps/web/src/features/admin/api/members.ts:88`                                  | `Promise<{ available: AdminTagRef[] }>`                                                              |
| `AdminMemberListView`          | `packages/shared/src/types/viewmodel/index.ts:203`                              | `{ total: number; members: AdminMemberListItem[]; page?; pageSize? }`                                |
| `AdminMemberListItem`          | `packages/shared/src/types/viewmodel/index.ts:187`                              | `memberId: MemberId` / `responseEmail: ResponseEmail` / `fullName: string` 他                        |

> 補足: `MemberId` は branded string 型だが、`membersById` の key として `string` 互換で扱える。email は PII 最小化のため渡さない。

## 命名規則分析（既存コードの観察）

| 種別                | 既存規則                                                                                       | 本タスクで踏襲する命名                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 変数 / props        | camelCase（`selectedIds` / `onComplete` / `groupedTags` / `selectedTagIds` / `bulkResult`）     | `membersById` / `tagLabelById`                                          |
| ファイル名          | PascalCase コンポーネント（`BulkActionBar.tsx` / `MembersClientShell.tsx`）。spec は `*.spec.tsx` | 既存ファイルを edit。新規ファイルなし                                   |
| testid              | kebab-case の `bulk-tag-result` 系（`bulk-tag-result` / `-counts` / `-skipped` / `-not-found`） | testid は**変更しない**（既存維持）                                     |
| list item key       | `skip-${memberId}-${tagId}` / `nf-${memberId}-${tagId}`                                          | **維持**（key 変更は React reconciliation に影響するため変えない）       |
| 派生 map の useMemo  | `groupedTags = useMemo(..., [available])`（既存に Map 構築の前例あり）                          | `tagLabelById = useMemo(..., [available])` を同じ流儀で追加             |

> **[FB-SDK-07-4]**: 既存の `groupedTags`（`available` 由来の `useMemo`）と同一命名・同一依存配列パターンに揃えることで命名ドリフトを防止する。

## P50 前提確認チェック

| 確認項目                                | 判定 | 根拠                                                                                                         |
| --------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| current branch に実装が存在する         | Yes  | 本改善サイクルで `BulkActionBar.tsx` に `membersById?` / `tagLabelById` / fallback 表示を実装し、`MembersClientShell.tsx` から `membersById` を注入済み |
| upstream（dev/main）にマージ済み        | No   | 本表示名化はどのブランチにも未着手                                                                          |
| 前提タスク（依存タスク）が完了済み      | Yes  | 親 issue-1036（bulk tag assign 本体）は completed。`BulkActionBar` の bulk tag section / `bulkResult` summary / testid 群は既に landed |

→ `implementation_mode = "new"`。Phase 4 = TDD RED テスト設計、Phase 5 = 新規実装、Phase 11 = focused component test green。

## carry-over 確認（親 issue-1036 からの棚卸し）

| 親 issue-1036 で既に landed 済み（再利用・非変更）                                          | 本タスクの新規差分                                                                          |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `BulkActionBar` の tag 一括付与/解除 section、`bulkMut`（useAdminMutation 経由）、`summarize()` | 表示は**変えない**（mutation / API 経路は不変）                                            |
| `bulkResult` summary 描画と testid 群（`bulk-tag-result*`）                                | summary の **行内テキスト（表示値）のみ** を生 ID → 表示名へ置換。構造・testid・key は維持 |
| `MembersClientShell` の `republishCandidates`（`{memberId, displayName: m.fullName,...}` 注入前例） | 同じ `useMemo` 流儀で `membersById` を構築し `BulkActionBar` へ optional 注入              |

> 本タスクは「結果 summary の表示値の判読性改善」のみ。API・mutation・selection・drawer の挙動には差分を出さない。

## スコープ

### 含む

- `BulkActionBar` の `skipped_deleted` 行に fullName 表示（AC-1）
- `tag_not_found` 行に label 解決表示 + 未解決時 fallback（AC-2）
- `MembersClientShell` から `membersById` を派生・注入
- 後方互換の optional prop 設計（AC-4）
- component test の label / fallback 検証（AC-5）

### 含まない（スコープ外）

| 項目                                            | 除外理由                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| API に label を追加（contract 変更）            | AC-3 維持。`apps/api` 非接触                                                               |
| audit payload の変更                            | 表示のみの改善。監査記録は不変                                                             |
| email を主表示化                                | PII 表示拡大の回避（issue リスク表「個人情報表示が増えすぎる＝中」）。`fullName` を主表示  |
| #1078 large catalog UX（tag picker の大量表示）  | 別 issue の関心                                                                            |
| #1079 audit filter                              | 別 issue の関心                                                                            |
| commit / PR / deploy / staging visual baseline  | user-gated（Phase 13）                                                                     |
| Issue #1080 の状態変更（CLOSED 化含む）         | user-gated                                                                                 |

> **将来の補助表示候補（未タスク化候補）**: email 副表示（`maskEmail` 経由）は PII 表示拡大を伴うため今回起票しない。必要性が確認された場合のみ別途検討する。
