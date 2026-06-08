# Phase 3 — 設計レビュー結果

> **[実装区分: 実装仕様書]** / `implementation_mode: new` / **NON_VISUAL**
> Phase 4（テスト作成 / TDD Red）へ進めるかを 4 条件で判定する。

## 1. 4 条件評価（全 PASS）

| 条件 | 判定 | 根拠 |
|------|------|------|
| **価値性** | **PASS** | admin が member_tags の参照整合性破れ（孤児行）を検出・監査できるようになる。これまで「削除時にしか参照状態が分からない」盲点（issue-1070 の count guard は逆方向）を解消し、`GET /admin/tags/orphans` という actionable surface を提供する |
| **実現性** | **PASS** | read 関数 2（`detectOrphanMemberTags` / `countOrphanMemberTags`）+ read-only endpoint 1 + テスト + fixture 健全性確認のみ。migration / schema 変更ゼロ。1 サイクルで完了可能（CONST_007）。`DbCtx` 既存型・既存 read 関数群と同パターン |
| **整合性** | **PASS** | documented no-FK 架構（`0022_member_photos.sql:4`）を反転せず維持・強化（ADR-1119）。invariant #5（D1 は apps/api に閉じる）/ #8（`*.spec.ts` のみ）/ #13（write は `assign*` 限定・追加は read のみ）すべて適合。issue-1070 ガードと責務分離して非破壊共存 |
| **運用性** | **PASS** | read-only ゆえ運用リスク低。endpoint は監査用途で副作用なし。無料枠維持（軽量 COUNT / SELECT のみ）。既存テストへの影響は fixture 局所修正のみ（`tag_a`/`tag_b` を定義へ追加するだけで既存 assertion 不変） |

## 2. 因果・依存・責務境界の確認

### 2.1 システムループ

| ループ | 経路 | 効果 |
|--------|------|------|
| 強化ループ | orphan detection が可視化 → admin が手動で孤児を解消 → 整合性向上 | 本タスクは検出まで。解消 mutation は範囲外（invariant #13 にも整合） |
| バランスループ | count guard（削除時防止）→ 新規孤児発生を抑制 → orphan detection の検出対象が増えない | 孤児累積の抑制 |

### 2.2 責務境界

- **detection = read**（member_tags / tag_definitions の状態を変更しない）。mutation 経路（`assign*` 4 関数）とは完全分離。
- count guard（tag → 被参照・削除直前・防止）と orphan detection（member_tags → 不在 tag・任意・検出）は**逆方向**で責務が異なり、撤去・代替ではなく**二段防壁**として共存（AC-4）。

### 2.3 依存

| 依存 | 状態 | レビュー判断 |
|------|------|--------------|
| issue-1070（count guard） | 実装済 | 撤去せず共存。非破壊を Phase 9 で確認 |
| `tag_definitions` seed（0004・41 行） | 常在 | `NOT IN` サブクエリの空テーブル誤検出はエッジケースで検証 |
| `memberTags.readonly.test-d.ts`（禁止 prefix） | 既存 | `detect`/`count` 非該当を確認済 |

## 3. リスクとレビュー指摘

| リスク | 影響 | 対策（引き継ぎ先 Phase） |
|--------|------|--------------------------|
| `/tags/orphans` が `/tags/:tagId` に capture される | endpoint が動作しない | Phase 5 で登録順序を実測し `:tagId` 系より前に挿入。contract test で `count` キー存在を検証（Phase 4/6） |
| `detect`/`count` prefix が readonly type guard に抵触 | typecheck 失敗 | Phase 1 で禁止 prefix（insert/update/delete/upsert/assign/bulk）非該当を確認済。Phase 4 で `memberTags.readonly.test-d.ts` の typecheck green を確認 |
| `members.contract.spec.ts` fixture 前提の誤読 | 不要な差分・回帰 | `tag_a`/`tag_b` は既に `tag_definitions` に定義済み。Phase 6 では fixture を編集せず、既存ケース green と孤児 0 を確認 |
| `NOT IN` サブクエリで tag_definitions が空の時の挙動 | 誤検出 | tag_definitions は seed（0004）で常に 41 行存在。空テーブル時の挙動も orphan spec のエッジケースで検証（Phase 4/6） |
| issue-1070 ガード spec の回帰 | 既存防壁の破壊 | count guard / 409 を撤去しない。`tags.contract.spec.ts:362-389` の pass を Phase 9 で確認 |

## 4. 設計レビュー判定

**判定: PASS（Phase 4 へ進行可）**

- DB-level FK 不採用の意思決定（ADR-1119）は documented 架構（0022:4）と整合し、根拠（D1 enforcement 不確実 / 移行リスク / 検出 vs 防止）が十分。
- 追加 surface は read-only で副作用ゼロ・低リスク。
- 1 サイクル完結スコープ（CONST_007）を満たす。
- 先送り項目なし（FK は「不採用の確定」であり先送りではない）。

## 5. Phase 4 への引き継ぎ事項

| 引き継ぎ | 内容 |
|----------|------|
| TDD Red 対象 | AC-2（孤児検出）/ AC-6（endpoint shape）のテストを先に書く |
| エッジケース | tag_definitions 空時の `NOT IN` 誤検出ガード |
| typecheck 確認 | `memberTags.readonly.test-d.ts` の禁止 prefix green |
| route 登録順 | Phase 5 で `:tagId` 系より前に `/tags/orphans` を挿入 |
| 回帰 baseline | INSERT 3 経路後の `countOrphanMemberTags() == 0`（AC-3） |

## 完了条件（Phase 3）

- [x] 4 条件（価値性 / 実現性 / 整合性 / 運用性）すべて PASS
- [x] 因果・依存・責務境界を確認
- [x] リスクと対策を Phase 4/5/6/9 へ引き継ぎ
- [x] Phase 4 進行可を判定（PASS）
