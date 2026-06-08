# Phase 8 — リファクタリング

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。Phase 5 で実装した差分を対象に、重複排除 / 命名一貫性 / 構造改善の判断を **対象 / Before / After / 理由** テーブル形式で記録する（Feedback RT-03）。リファクタ対象が無い場合は「対象なし」を根拠付きで明記する。

## 1. リファクタ判断の前提（スコープ確認）

本タスクの新規実装は read 関数 2 つ（`detectOrphanMemberTags` / `countOrphanMemberTags`）+ 型 1 つ（`OrphanMemberTag`）+ read-only endpoint 1 つ（`GET /admin/tags/orphans`）に限定される（Phase 2 §6）。リファクタ検討の主対象は次の 1 点に集約される。

- **検討点 RF-1**: `detectOrphanMemberTags` と `countOrphanMemberTags` が共有する孤児判定 SQL 述語 `WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)` の重複を、共通定数（例: `ORPHAN_PREDICATE_SQL`）へ抽出するか否か。

## 2. リファクタリング判断テーブル（対象 / Before / After / 理由）

| 対象 | Before | After | 理由（判断） |
|------|--------|-------|--------------|
| RF-1: 孤児判定 SQL 述語の重複（`WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)`） | `detectOrphanMemberTags`（SELECT 全列）と `countOrphanMemberTags`（SELECT COUNT(*)）に同一述語が 2 回出現 | **抽出しない（現状維持）** | 抽出を**見送る**。理由: (1) 重複は WHERE 句 1 行のみで Rule of Three（3 箇所目）に未到達。(2) 2 関数は SELECT 句が `全列` vs `COUNT(*)` と本質的に異なり、定数化すると `SELECT ... ${ORPHAN_PREDICATE} ...` のテンプレ連結になり、SQL の静的可読性（prepared 文字列をそのまま読める性質）を損なう。(3) prepared statement リテラルを定数連結に置換すると lint/parser 上の SQL 文字列追跡が弱まり、grep での監査性が低下する。→ **可読性・監査性 > わずかな DRY** と判断し現状維持。3 箇所目が将来出現した時点で再評価する旨を docstring/本Phaseに残す。 |
| RF-2: 命名一貫性（`detect`/`count` prefix） | 既存 read prefix は `list`/`get`/`find`（Phase 1 inventory）。新規は `detect`/`count` | **現状維持（変更不要）** | `count` は既存 `countMemberTagReferences`（tagDefinitions.ts）と prefix 一致で先例あり。`detect` は「孤児検出」の意味を最も正確に表す read 動詞で、`list`/`get`/`find` のいずれも「条件不在 tag を炙り出す」語感を持たない。invariant #13 の禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`/`bulk`）に非該当。→ 命名は意味的に最適で一貫性違反なし。リファクタ不要。 |
| RF-3: 型 `OrphanMemberTag` のフィールド命名 | `memberId`/`tagId`/`source`/`assignedAt`/`assignedBy`（camelCase） | **現状維持（変更不要）** | 既存 TS 型と同じ camelCase 規約・SQL の `AS` エイリアスと 1:1 対応。冗長フィールドなし。リファクタ不要。 |
| RF-4: route ハンドラの構造 | `GET /tags/orphans` は `detectOrphanMemberTags(db(c))` → `c.json` の薄いハンドラ | **現状維持（変更不要）** | 既存 read endpoint（`tags.ts` の他 GET）と同一の薄さ・パターン一致。ビジネスロジックは repository に集約済みで、ハンドラへのロジック漏れなし。抽出すべき共通処理なし。 |

## 3. リファクタ結論

**コード構造を変更するリファクタリングは行わない（リファクタ対象なし）。** 唯一の重複候補 RF-1（孤児判定 SQL 述語）は、可読性・監査性・Rule of Three 未到達を根拠に **意図的に現状維持** とする。命名（RF-2/RF-3）・構造（RF-4）はいずれも既存規約に整合しており改善余地がない。

> **明記**: 「リファクタしないこと」自体が根拠付きの設計判断であり、惰性の放置ではない。RF-1 は 3 箇所目の孤児述語が出現した時点で `ORPHAN_PREDICATE_SQL` 抽出を再評価する（将来の判断ポイントを本Phaseに固定）。

## 4. 非破壊確認（リファクタ後の不変条件）

リファクタを行わないため、Phase 5 実装時点のコードがそのまま正本となる。以下が維持されていることを Phase 9 で再確認する。

- invariant #13: 追加 export は read 2 関数のみ（禁止 prefix 非該当）。
- issue-1070 ガード非破壊（count guard / 409 を撤去しない）。
- 新規 migration / D1 schema 変更なし。

## 完了条件（Phase 8）

- [ ] リファクタ判断を 対象 / Before / After / 理由 テーブルで記録した（Feedback RT-03）
- [ ] RF-1（SQL 述語重複の定数化）を見送る判断を根拠付きで明記した
- [ ] 命名一貫性（RF-2/RF-3）・構造（RF-4）の確認結果を記録した
- [ ] 「リファクタ対象なし」結論を惰性放置でなく設計判断として根拠付きで明記した
- [ ] 出力: [outputs/phase-8/refactoring-notes.md](outputs/phase-8/refactoring-notes.md)
