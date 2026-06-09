# Phase 1: 要件定義 — issue-1129 単一 tag write batchId 相関キー付与

## ステータス: completed

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の新規実装 Phase（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | No | 未マージ。本タスクで新規実装する |
| 前提タスク（依存タスク）が完了済み | Yes | #1036（bulk write・batchId 生成）/ #1079（audit batchId 検索）は CLOSED・実コード反映済み。本タスクは read 側非改修で write 側 payload のみ拡張 |

## タスク分類

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| visualEvidence | **NON_VISUAL** — API audit payload の変更のみ。UI/UX 変更なし。`apps/web` 非接触 |
| implementation_mode | new |
| 規模 | 小規模（1 プロダクトファイル編集 + 2 テストファイル拡充） |

> NON_VISUAL 判定根拠: 変更は `apps/api` の audit append payload に `batchId` キーを追加するのみ。
> 画面・コンポーネント・スタイルの変更は一切ない。Phase 11 は自動テスト結果を主証跡とし screenshot は不要。

## 真の論点（要件レビュー思考法）

1. **真の論点**: 「単一 write の audit を bulk と同じ batchId フィルタ導線に乗せる」こと。
   現象（payload に batchId が無い）ではなく、主問題は「相関の単位（まとまり）を何にするか」を先に固定しないと payload 設計が振れる点。
2. **依存関係・責務境界**: batchId 生成の責務をどこに置くか（route 層 vs repository 層）。
   bulk は item を跨ぐため repository が一括生成して返すが、単一は 1 行のため route 層で生成すれば repository シグネチャ（`Promise<boolean>`）を壊さない。
   audit append の責務は既に route 層（`members.ts`）が持つため、correlation id 生成も route 層に置くのが責務一貫。
3. **価値とコストの不均衡**: セッション単位相関は運用価値が不確実な一方、request header / session token 新設という高コストを伴う。
   初回価値（単一 write が batchId フィルタに乗る）はリクエスト単位で十分に得られるため、セッション単位は将来層として分離する。
4. **改善優先順位**: (a) AC-1 まとまり定義固定 → (b) route payload に batchId 付与 → (c) contract test で filter ヒット + noop 非退化を固定。
5. **4 条件評価**:
   - 価値性: 管理者の監査追跡で「この単一付与/解除はどの操作由来か」を bulk と同じ導線で辿れる。
   - 実現性: 1 プロダクトファイルの 2 箇所編集 + テスト 2 ファイル拡充で 1 サイクル完了。
   - 整合性: bulk と同一 payload 形・JSON path・非対称配置。不変条件 #13 の第2経路のみ拡張。
   - 運用性: schema 変更なし・既存フィルタ非改修・noop 非退化を回帰固定。

## 既存コードの命名規則分析

| 対象 | 命名規則 | 採用方針 |
| --- | --- | --- |
| payload 相関キー | `batchId`（bulk 既存・`members.ts:761,770`） | **同名 `batchId` を再利用**（フィルタ非改修のため。意味論は correlation id だが命名は bulk 揃え） |
| UUID 生成 | `crypto.randomUUID()`（`memberTags.ts:304`） | 同一手段を route 層で使用 |
| audit action | `auditAction("admin.member.tag_assigned")` / `"admin.member.tag_unassigned"` | 既存のまま（action 名は変更しない） |
| JSON path | `$.batchId`（`auditLog.ts:200-205`） | assign=after_json / unassign=before_json の非対称配置を bulk と一致 |

## 受け入れ基準（再掲）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 単一 write の相関「まとまり」（= リクエスト単位）が定義され、付与方針が確定している |
| AC-2 | 単一 assign の audit payload に `batchId` が付与され、`GET /admin/audit?batchId=` でヒット |
| AC-3 | 単一 unassign の audit payload（before_json 側）に `batchId` が付与され、batchId フィルタでヒット |
| AC-4 | payload キー名・所在が bulk と揃い、`json_extract` OR 検索が改修なしで効く |
| AC-5 | 実 mutation 時のみ audit を残す既存挙動が維持され、noop は audit を残さない |
| AC-6 | bulk の batchId 意味論（request-scoped correlation）と衝突しない |

## inventory（変更対象）

| パス | 種別 | 根拠 |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.ts` | 編集 | assign/unassign の audit append payload に batchId 追加 |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | 編集 | 単一 write の batchId 付与 + noop 非退化テスト |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 編集 | 単一 write batchId の filter ヒット contract |

## targeted run ファイルリスト（FB-UI-02-2）

全件 `pnpm test` は重いため、本タスクは以下 targeted run のみで検証する:

```
apps/api/src/routes/admin/members.tags.contract.spec.ts
apps/api/src/routes/admin/audit.contract.spec.ts
```

## carry-over 確認

直前コミット（`git log --oneline -5`）は #1153/#1151/#1150 等の admin 系 UI/UX。本タスクと重複する write 経路変更は無い。
親 #1079（read 側 batchId 検索）・#1036（write 側 batchId 生成 for bulk）は既に landed。本タスクは未着手領域（単一 write payload）。

## 完了条件
- [x] タスク分類（NON_VISUAL / implementation）を記録
- [x] AC-1（相関まとまり = リクエスト単位）を確定
- [x] 既存命名規則（`batchId` / `crypto.randomUUID()` / `$.batchId`）を分析・記録
- [x] 変更対象ファイルと targeted run リストを固定
