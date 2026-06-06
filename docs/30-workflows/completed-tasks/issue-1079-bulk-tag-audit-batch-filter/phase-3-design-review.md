# Phase 3: 設計レビュー（Gate-A）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| gate | Gate-A（spec authoring gate / Phase 4 着手可否判定） |
| reviewer | daishiman |
| date | 2026-06-03 |

> 本ファイルは設計レビュー（Gate-A）であり、artifacts.json の Gate-A `evidence_path` として参照される。
> 判定 "PASS" は **spec authoring gate**（仕様書として Phase 4 へ進められる）の意味であり、runtime 完了の意味ではない。

---

## レビュー観点と判定（4 条件評価）

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| **価値性** | PASS | batchId 検索性の欠如（手作業 JSON inspection）を解消し、bulk tag 操作の追跡コストを下げる。AC-1（検索）/ AC-2（表示・copy）/ AC-3（action 併用）/ AC-4（cursor 保持）が運用者の実需に対応する。 |
| **実現性** | PASS | 既存 `listFiltered`・`AuditLogPanel`・`buildAuditApiPath` の最小拡張で実現可能。json_extract は SQLite/D1 組み込み。新 endpoint・schema 変更・write 側変更が不要で、依存（#1036）は landed 済み。 |
| **整合性** | PASS | 既存命名規則（camelCase 関数 / `*Z` schema / PascalCase component）・不変条件（#5 D1 閉域 / #9 FormField / OKLch token / 既存 API surface）に整合。`appliedFilters` への 1 フィールド追加で contract を破壊しない。 |
| **運用性** | PASS | full scan リスクを keyset cursor + LIMIT + UUID sparse 性 + from/to·action 併用推奨で緩和し、AC-5 を「制限の明記」で充足。schema 化は別タスクに切り離し運用判断を将来に委ねる。 |

---

## 命名規則 vs 実装名 照合（FB-01）

本タスクは既存ファイル拡張が中心で、新規クラス／component は最小。

| 仕様上の名前 | 種別 | 実コード慣習との整合 |
| --- | --- | --- |
| `batchId`（query / filter / 型フィールド） | フィールド | camelCase。既存 `actorEmail` / `targetType` と同列。整合。 |
| `extractBatchId` | pure helper | camelCase。既存 `buildAuditHref` / `summarizeAuditJson` と同列。整合。 |
| `BatchIdCopyButton` | 新規 client component | PascalCase・`*Button` 慣習（既存 `Button` / `buttonVariants`）に整合。ファイル名も同名。 |
| `AuditLogListFilters.batchId` / `AdminAuditFilters.batchId` | 型フィールド | 既存 interface への optional フィールド追加。整合。 |

→ 命名規則の逸脱なし。新規 class 名と実コード名の乖離（FB-01 典型問題）は `BatchIdCopyButton` のみで、既存慣習に整合済み。

---

## 残リスクと対策（issue #1079 リスク表 4 件を反映）

| # | リスク | 対策 | 反映先 |
| --- | --- | --- | --- |
| R-1 | JSON body filter が D1 full scan になり性能劣化 | keyset cursor + LIMIT で取得行を bound / batchId は UUID で sparse / from·to·action 併用推奨（UI helper text 誘導）。schema index 化は別タスク。 | Phase 2 §3 A-3（AC-5 方針） |
| R-2 | batchId 位置が assign（after_json）/ unassign（before_json）で異なり検索漏れ | `json_valid(after_json) AND json_extract(...)` / `json_valid(before_json) AND json_extract(...)` の両列 OR 検索。contract test で assign / unassign 双方の row と破損 JSON 混在時の非500を固定。 | Phase 2 §3 A-2 / §9 |
| R-3 | audit UI の filter 過多で複雑化 | batchId は既存 advanced filter 群（action free text 等）と同じ grid に追加し、helper text で併用推奨を示すのみ。既存 filter の order / 型は非変更。将来必要なら advanced 折り畳みを別タスク化。 | Phase 2 §4 B-1 |
| R-4 | schema 変更（correlation_id 列 / index）への誘惑 | AC-5 は「制限または index 方針の明記」のみ要求。親 #1036 の軽量方針を踏襲し schema 変更を回避。別タスク化方針を Phase 12 未タスク候補に記録。 | Phase 1 スコープ / Phase 2 §3 A-3 |

### binding 番号の落とし穴（実装注意点）

`add()` helper は単一 `?` を 1 つの `?N` に置換するため、batchId の両列 OR 検索には使えない。
値を **1 回だけ** `bindings.push` し、同じ `?${bindings.length}` を両 `json_extract` で参照する設計を Phase 2 で固定済み。
repository test で「binding 配列長が batchId 指定時に 1 だけ増える」「両 json_extract が同一プレースホルダを参照する」ことを assert する方針。

---

## 判定

**Gate-A = PASS（spec authoring 完了・Phase 4 着手可）**

- 価値性 / 実現性 / 整合性 / 運用性の 4 条件すべて PASS。
- AC-1..5 が Task A/B/C にマップされ、1 実装サイクル・1 PR で完了可能（CONST_007）。
- 新 endpoint 追加・schema 変更・write 側変更が無く、既存 API surface・不変条件に整合。
- 命名規則照合（FB-01）でブロッカーなし。
- リスク 4 件すべてに対策が設計へ反映済み。

→ Phase 4（テスト作成）以降の実装 wave に進められる。実装・テスト実行・commit・PR・deploy・screenshot は user-gated。

---

## 完了条件 (DoD)

- 4 条件評価が記録され、すべて PASS。
- 命名規則照合（FB-01）が記録され、逸脱なし。
- issue リスク表 4 件が対策付きで反映されている。
- Gate-A 判定 = PASS（spec authoring gate）が明記され、本ファイルが Gate-A evidence として実在する。
