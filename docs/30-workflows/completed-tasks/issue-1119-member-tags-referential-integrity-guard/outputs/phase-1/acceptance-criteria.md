# Phase 1 — 受入基準詳細（AC-1〜AC-7）

> **[実装区分: 実装仕様書]** / `implementation_mode: new` / **NON_VISUAL**
> 本書を受入基準の正本とする。issue 原文 AC を現コードへ最適化した。

## 1. AC 一覧（詳細・検証方法付き）

| # | 受入基準 | 元 AC との対応 | 検証方法 | 合格判定 |
|---|----------|----------------|----------|----------|
| **AC-1** | DB-level FK は `0022_member_photos.sql:4` の documented no-FK 架構ゆえ **採用しない**意思決定が根拠付きで文書化されている（D1 FK enforcement 不確実 + application-layer integrity 方針）。代替として app 層ガードを実装する | 元 AC-1 / AC-4 / AC-5 を統合・最適化 | Phase 2 `database-schema.md` の ADR-1119 に「決定」「根拠比較表」「帰結」が記載されていること。D1 PRAGMA foreign_keys の N/A 理由が明記されていること | ADR-1119 が比較表（DB FK vs app 層ガード）を含み、不採用結論と根拠が文書化されている |
| **AC-2** | `detectOrphanMemberTags()` / `countOrphanMemberTags()` で `member_tags.tag_id NOT IN (SELECT tag_id FROM tag_definitions)` の孤児行を機械検出できる | 元 AC-2 | `memberTags.orphan.repository.spec.ts` で孤児行を seed → `detectOrphanMemberTags` が当該行を返す / `countOrphanMemberTags` が件数を返す | 孤児あり時に検出・件数が一致、孤児なし時に空配列・0 を返す |
| **AC-3** | member_tags INSERT 3 経路（`assignTagsToMember` / `assignTagToMemberByAdmin` / `bulkApplyMemberTagsByAdmin`）が tag_id 先在検証を通すことを回帰テストで baseline 化している。`assignTagsToMember` は helper 単体でも active tag master に存在しない tag_id を skip し孤児を書かない | 元 AC-3 | 3 経路を通した INSERT 後に `countOrphanMemberTags() == 0` を assert する回帰テスト。`assignTagsToMember` へ未定義 tag_id を混ぜても孤児 0 を assert | 3 経路いずれの正常 INSERT も孤児を生まない（0 件）。helper 誤用時も未定義 tag_id は member_tags に到達しない |
| **AC-4** | issue-1070 の count guard（削除時参照防壁）と orphan detection（既存孤児の検出・監査）の責務分離が明記されている | 元 AC-6 | Phase 2 `architecture-design.md` の責務分離テーブル（方向・タイミング・役割） | count guard（tag→被参照・削除直前・防止）と orphan detection（member_tags→不在 tag・任意・検出）が表で分離記述されている |
| **AC-5** | 全 member_tags INSERT fixture が事前に `tag_definitions` を定義し、テスト由来の孤児を 0 にしている。`members.contract.spec.ts:104-110,421-428` は既に `tag_a` / `tag_b` 定義済みであり編集不要 | 元 AC-2 派生（新設） | `members.contract.spec.ts` 実行 + 当該 spec 終端で `countOrphanMemberTags() == 0` | `tag_a` / `tag_b` が `tag_definitions` に定義され、孤児 0。既存 assertion 不変 |
| **AC-6** | admin が孤児行を検出できる read-only endpoint `GET /admin/tags/orphans` が追加され contract test で保証されている | app 層ガードの actionable surface（新設） | `tags.contract.spec.ts` で `GET /admin/tags/orphans` を叩き `{ok, count, orphans[]}` shape を検証 | endpoint が登録順で `:tagId` に capture されず、正しい JSON shape を返す |
| **AC-7** | 全 spec 実行後 `countOrphanMemberTags()` == 0 が不変条件として検証され、typecheck / lint / 既存 issue-1070 ガード spec が非破壊である | DoD | `pnpm typecheck` / `pnpm lint` green + `tags.contract.spec.ts:362-389`（issue-1070 ガード）が pass | 不変条件 0 件 + typecheck/lint green + issue-1070 ガード spec 非破壊 |

## 2. 元 AC → 最適化 AC の対応詳細

issue 原文（評価タスク）の AC を、現コードの documented no-FK 架構に照らして実装タスクへ再構成した対応関係。

| 元 AC（issue 原文） | 最適化後 | 最適化の理由 |
|----------------------|----------|--------------|
| 元 AC-1: FK 追加可否の意思決定 + 根拠文書化 | AC-1 へ統合 | no-FK 架構ゆえ「採用しない」結論を確定し ADR 化 |
| 元 AC-2: 孤児行調査 | AC-2 / AC-5 へ分割 | 調査を「検出関数（AC-2）」と「fixture 由来孤児 0 の確認（AC-5）」へ実装化 |
| 元 AC-3: seed/ingest/migration 順序影響評価 | AC-3 へ最適化 | INSERT 3 経路の tag_id 先在検証 回帰 baseline へ具体化 |
| 元 AC-4: D1 PRAGMA 挙動確認 | AC-1 へ統合（N/A 記録） | FK を採用しないため判断に不要 → N/A として ADR に記録 |
| 元 AC-5: FK 採用時 migration 範囲見積もり | AC-1 へ統合 | FK 不採用ゆえ見積もり不要。不採用根拠の一部として記録 |
| 元 AC-6: app-level guard との共存/代替/補強 | AC-4 へ最適化 | count guard と orphan detection の責務分離として明記 |
| （新設） | AC-6: `GET /admin/tags/orphans` | app 層ガードの actionable surface を追加 |
| （新設・DoD） | AC-7: 不変条件 0 件 + 非破壊 | Definition of Done |

## 3. 検証の実行順序（Phase 4〜9 へ引き継ぎ）

1. **Phase 4（TDD Red）**: AC-2 / AC-6 のテストを先に書く（孤児検出・endpoint shape）。Red を確認。
2. **Phase 5（実装）**: `detectOrphanMemberTags` / `countOrphanMemberTags` / endpoint を実装。route 登録順序（`/tags/orphans` を `:tagId` 系より前）を実測して確定。
3. **Phase 5（fixture 健全性確認）**: AC-5 の `tag_a` / `tag_b` が既に `tag_definitions` 定義済みであることを確認。
4. **Phase 6（テスト拡充）**: AC-3 の INSERT 3 経路回帰 + エッジケース（tag_definitions 空時）。
5. **Phase 9（品質保証）**: AC-7 の typecheck / lint / issue-1070 ガード非破壊を確認。

## 4. NON_VISUAL の証跡方針（AC と Phase 11 の関係）

全 AC は自動テスト + typecheck/lint で検証可能であり、UI screenshot を要しない。Phase 11 evidence table では screenshot 行を n-a とし、テスト結果・typecheck/lint 結果を present として記録する。

## 完了条件（Phase 1 — 受入基準）

- [x] AC-1〜AC-7 を検証方法・合格判定付きで詳細化
- [x] 元 AC → 最適化 AC の対応を明記
- [x] 検証実行順序を Phase 4〜9 へ引き継ぎ
