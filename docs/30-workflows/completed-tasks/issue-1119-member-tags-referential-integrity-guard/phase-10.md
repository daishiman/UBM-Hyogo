# Phase 10 — 最終レビュー

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。AC-1〜AC-7 の充足判定・blocker 有無・MINOR 指摘の未タスク化方針を確定する。

## 1. 受入条件（AC）充足判定テーブル

Phase 1 §4 で確定した最適化後 AC を、各 Phase の成果物と突合して充足判定する。

| # | 受入条件（最適化後） | 充足判定 | 根拠（Phase / 成果物） |
|---|----------------------|----------|------------------------|
| AC-1 | DB-level FK を `0022:4` no-FK 架構ゆえ採用しない意思決定を根拠付きで ADR 記録。代替として app 層ガード実装 | 充足 | Phase 2 §0 ADR-1119（比較表 6 観点）。D1 PRAGMA 挙動確認は「FK 非採用ゆえ判断に不要」として N/A 記録 |
| AC-2 | `detectOrphanMemberTags()` / `countOrphanMemberTags()` で `member_tags.tag_id NOT IN (SELECT tag_id FROM tag_definitions)` を機械検出できる | 充足 | Phase 2 §2.2/§2.3 関数設計・SQL。Phase 6 TC-R01〜R07 |
| AC-3 | member_tags INSERT 3 経路（assignTagsToMember / assignTagToMemberByAdmin / bulkApplyMemberTagsByAdmin）の tag_id 先在検証を回帰 baseline 化 | 充足 | Phase 6 §2 TC-X01〜X03 / TC-R08（route/workflow 防壁の回帰確認 + helper 誤用時の未定義 tag skip） |
| AC-4 | issue-1070 count guard（防止）と orphan detection（検出）の責務分離明記 | 充足 | Phase 2 §4 責務分離テーブル（方向・タイミング・役割）。二段防壁として共存 |
| AC-5 | `members.contract.spec.ts:109,426` の member_tags INSERT は直前に `tag_definitions` 定義済みであり、テスト由来孤児を生まないことを回帰確認 | 充足 | Phase 2 §6 / members.contract focused PASS（fixture 編集なし） |
| AC-6 | admin read-only endpoint `GET /admin/tags/orphans` 追加 + contract test 保証 | 充足 | Phase 2 §3 route 設計（登録順序含む）・Phase 4/6 TC-C01〜C03 |
| AC-7 | `countOrphanMemberTags()==0` 不変条件検証 + typecheck/lint/issue-1070 ガード spec 非破壊 | 充足 | Phase 6 TC-R08・Phase 9 §1/§2 品質ゲート（invariant #13 readonly guard 含む） |

## 2. 不変条件の最終確認

| 不変条件 | 判定 | 根拠 |
|----------|------|------|
| invariant #5（D1 直接アクセスは apps/api に閉じる） | 維持 | 変更は `apps/api` のみ。apps/web 非接触 |
| invariant #8（`*.spec.ts` のみ） | 維持 | 新規 spec は `memberTags.orphan.repository.spec.ts`。`.test-d.ts` は型ガード既存規約 |
| invariant #13（member_tags write は assign* 限定・追加は read のみ） | 維持 | 追加 export は read 2 関数（禁止 prefix 非該当）。Phase 9 §2 |
| documented no-FK 架構（0022:4） | 維持・強化 | DB-level FK を追加せず app 層で整合 |
| issue-1070 ガード非破壊 | 維持 | count guard / 409 を撤去せず共存（Phase 6 §1） |
| 新 migration / D1 schema 変更なし | 維持 | repository read 関数 + endpoint のみ |

## 3. blocker 有無

**blocker なし。** AC-1〜AC-7 を全充足し、不変条件をすべて維持する設計。コード実装は本タスク（実装仕様書作成）のスコープ外で、実装・commit・PR は user-gated。

## 4. Phase 10 MINOR 指摘と未タスク化方針

最終レビューで検出した MINOR 指摘を記録する。本タスクのスコープ（孤児行の **検出**）を超える将来の機能拡張は、`unassigned-task-guidelines` 準拠で未タスク化候補とし、本タスクで実装しない。

| MINOR-ID | 指摘内容 | 重大度 | 本タスク対応 | 未タスク化方針 |
|----------|----------|--------|--------------|----------------|
| MINOR-1 | `GET /admin/tags/orphans` は検出のみで孤児行の **修復**（削除 / 別 tag への再割当）導線が無い | MINOR | 対応しない（スコープ=検出） | unassigned-task 候補。修復は member_tags write を伴い invariant #13（assign* 限定）と要調整。検出の運用実績を見てから別タスクで起票判断 |
| MINOR-2 | 孤児検出を定期実行する admin UI / 通知（dashboard バッジ等）が無い | MINOR | 対応しない（NON_VISUAL・read API まで） | unassigned-task 候補。UI/VISUAL 別タスクとして起票判断（本タスクは API surface まで） |
| MINOR-3 | `detectOrphanMemberTags` は全孤児行を一括返却し pagination が無い | MINOR | 対応しない（孤児は本来 0 件想定・件数小） | 孤児が大量発生する事態は異常系のため当面 YAGNI。実運用で件数増が観測されたら pagination を別タスク化 |

> **方針明記**: MINOR-1〜3 はいずれも「検出ギャップを埋める」という本タスク主目的の達成を妨げない。即時起票はせず、`unassigned-task-guidelines` に従い「実装着地後に運用実績で要否を再判断」する候補として記録するに留める（早期 over-engineering 回避）。

## 完了条件（Phase 10）

- [ ] AC-1〜AC-7 の充足判定テーブルを記載した
- [ ] 不変条件（#5/#8/#13/no-FK/issue-1070 非破壊）の最終確認を記載した
- [ ] blocker 有無（なし）を明記した
- [ ] MINOR 指摘（MINOR-1〜3）と未タスク化方針を `unassigned-task-guidelines` 準拠で記録した
- [ ] 出力: [outputs/phase-10/final-review-result.md](outputs/phase-10/final-review-result.md)
