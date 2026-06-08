# Phase 8 出力 — リファクタリングノート

> 親: [phase-8.md](../../phase-8.md)。Phase 5 実装差分に対するリファクタ判断の確定記録（対象 / Before / After / 理由）。

## 1. 結論サマリ

**コード構造を変更するリファクタリングは実施しない（リファクタ対象なし）。** 唯一の重複候補（孤児判定 SQL 述語）は可読性・監査性・Rule of Three 未到達を根拠に意図的に現状維持とする。命名・型・route 構造はいずれも既存規約に整合済み。

## 2. リファクタリング判断テーブル

| 対象 | Before | After | 理由（判断） |
|------|--------|-------|--------------|
| RF-1: 孤児判定 SQL 述語の重複 `WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)` | `detectOrphanMemberTags`（`SELECT 全列 ... WHERE 述語 ORDER BY`）と `countOrphanMemberTags`（`SELECT COUNT(*) ... WHERE 述語`）に同一 WHERE 句が 2 回出現 | 抽出せず現状維持 | (1) WHERE 句 1 行のみの重複で Rule of Three（3 箇所目）未到達。(2) SELECT 句が `全列` vs `COUNT(*)` で本質的に異なり、`ORPHAN_PREDICATE_SQL` 定数連結にすると prepared SQL 文字列の静的可読性が低下。(3) 定数連結化すると grep / lint での SQL 監査追跡が弱まる。→ 可読性・監査性 > わずかな DRY。3 箇所目出現時に再評価する将来ポイントを残す |
| RF-2: read 関数の命名一貫性 | 既存 read prefix は `list`/`get`/`find`。新規は `detect`/`count` | 現状維持 | `count` は既存 `countMemberTagReferences` と prefix 一致で先例あり。`detect` は「孤児検出」を最も正確に表す read 動詞で `list`/`get`/`find` では語感が合わない。invariant #13 禁止 prefix 非該当 |
| RF-3: 型 `OrphanMemberTag` のフィールド | `memberId`/`tagId`/`source`/`assignedAt`/`assignedBy`（camelCase） | 現状維持 | 既存 TS camelCase 規約・SQL `AS` エイリアスと 1:1。冗長フィールドなし |
| RF-4: route ハンドラ構造 | `GET /tags/orphans` = `detectOrphanMemberTags(db(c))` → `c.json` の薄いハンドラ | 現状維持 | 既存 read endpoint と同一パターン。ロジックは repository に集約済みで抽出余地なし |

## 3. 将来の再評価ポイント

- **RF-1**: 孤児判定述語の 3 箇所目（例: 別 endpoint / batch job）が出現した時点で `ORPHAN_PREDICATE_SQL` 定数抽出を再評価する。それまでは prepared SQL リテラルの可読性を優先する。

## 4. 非破壊確認（リファクタを行わないため Phase 5 コードが正本）

- invariant #13: 追加 export は read 2 関数のみ（禁止 prefix 非該当）。
- issue-1070 ガード非破壊（count guard / 409 撤去なし）。
- 新規 migration / D1 schema 変更なし。
