# issue-1119 — member_tags 参照整合性ガード（application 層・no-FK 架構整合）

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト・コード変更を伴う）。
> 元 Issue #1119 は「DB-level FOREIGN KEY 追加の **評価レポート**」を成果物とする評価タスクだったが、
> 最新コードを確認した結果、本リポジトリには **「D1 では FK 制約を使わず application 層で整合性を保つ」** という
> 明示された設計判断が存在する（`apps/api/migrations/0022_member_photos.sql:4`）。
> よって issue を現在のコードへ最適化し、**評価で終わらせず「根本問題（member_tags.tag_id の参照整合性ギャップ）を
> application 層で実コードとして解消する実装仕様書」** として再構成した。
> DB-level FK は documented no-FK 架構に基づき **採用しない** ことを意思決定済みとして記録し（AC-1）、
> 代替として孤児行検出関数・admin 監査 endpoint・不変条件テスト・既存 fixture 健全性確認で根本解決する。
> ユーザー承認（2026-06-06）により approach = 「App 層整合性ガード強化（整合性重視・migration 追加なし）」を確定。

## メタ情報

| 項目 | 内容 |
|------|------|
| task_id | `task-issue-1119-member-tags-referential-integrity-guard` |
| GitHub Issue | [#1119](https://github.com/daishiman/UBM-Hyogo/issues/1119)（**CLOSED 維持・reopen しない**） |
| 元 task | `task-issue-1070-followup-003-member-tags-foreign-key-evaluation`（unassigned-task / 評価タスク） |
| 親 Issue / workflow | #1070 [`issue-1070-tag-reactivate-physical-delete`](../completed-tasks/issue-1070-tag-reactivate-physical-delete/) |
| 依存 | issue-1070（`countMemberTagReferences` + 409 `tag_has_references` ガード）実装済 |
| category | データ整合性 / schema governance |
| priority / scale | 低 / 中規模 |
| taskType | implementation（`implementation_mode: new`） |
| visualEvidence | NON_VISUAL（backend / repository / admin API のみ・UI 変更なし） |
| status | `implemented_local` |
| branch | `docs/issue-1119-member-tags-referential-integrity-guard-spec` |
| base | `dev` |
| 作成日 | 2026-06-06 |

## 調査結論（issue が古いか / 別タスクで解決済みか）

| 観点 | 事実（コードベース実測） | 出典 |
|------|--------------------------|------|
| DB-level FK は実装済みか | **未実装**。全 migration（0001〜0025）に `FOREIGN KEY` は 0 件。`PRAGMA foreign_keys` / `defer_foreign_keys` の扱いも 0 件 | `grep -rn "FOREIGN KEY" apps/api/migrations/` = 空 |
| 別タスクで解決済みか | **否**。issue-1117（`migrateTo` 強制移行）も未実装（spec のみ）。issue-1105 / member_status FK も未実装（LOGS の MINOR-FUT-2 として formalize のみ） | `grep -rn "migrateTo" apps/api/` = 空 |
| 唯一の参照防壁の現状 | issue-1070 の application-level guard `countMemberTagReferences`（`SELECT COUNT(*) FROM member_tags WHERE tag_id = ?`）+ 409 `tag_has_references` が**完全実装済** | `apps/api/src/repository/tagDefinitions.ts:210-216` / `routes/admin/tags.ts:267-284` |
| 架構方針 | **「member_id は論理 FK（D1 は application 層で整合、FK 制約なし）」** が明示済み。FK を後付けするとこの documented invariant を反転させる | `apps/api/migrations/0022_member_photos.sql:4` |
| 現存する孤児リスク | 実検証の結果、`members.contract.spec.ts` の `member_tags` INSERT（:109, :426）は**直前に tag_definitions へ tag_a/tag_b を定義済み**（:104, :421）で孤児を生まない。テスト fixture は健全。孤児検出の価値は本番データの drift 監査にある | `apps/api/src/routes/admin/members.contract.spec.ts:104-110, 421-428`（実測） |

**結論**: #1119 の関心事（member_tags.tag_id の参照整合性）は**未解決**。ただし issue 原文が前提とする「DB-level FK 追加の是非評価」は、現コードの documented no-FK 架構に照らすと結論が事実上確定する（FK は採用しない）。よって **評価で止めず、no-FK 架構を尊重した application 層ガードを実コードで実装する** ことで根本解決する。

## スコープ（CONST_007 — 03.実装.md の 1 サイクルで完了）

### 含む（1 サイクル完結）

1. **孤児行検出 repository 関数**（`detectOrphanMemberTags` / `countOrphanMemberTags`）を `apps/api/src/repository/memberTags.ts` に追加（read-only / 不変条件 #13 整合）
2. **admin 監査 endpoint** `GET /admin/tags/orphans`（read-only）を `apps/api/src/routes/admin/tags.ts` に追加
3. **参照整合性 不変条件テスト**（孤児 0 件 invariant）の repository spec + contract spec 追加
4. **既存 fixture 健全性確認**（`members.contract.spec.ts` の `tag_a`/`tag_b` は実測で既に `tag_definitions` 定義済み）により、テスト由来の孤児を 0 に維持する
5. **意思決定レポート**（DB-level FK を採用しない根拠・app 層ガードとの責務分離）を Phase 2 / Phase 12 に記録

### 含まない（境界・先送りではなく別関心事）

- **DB-level FK の migration 追加**（0026 等）— documented no-FK 架構を尊重し採用しない（AC-1 で意思決定として確定。先送りではなく「不採用の確定」）
- issue-1070 の `countMemberTagReferences` + 409 ガードの撤去（削除時参照防壁として維持）
- issue-1117 の `migrateTo` 強制移行（別タスク・別 Issue）
- 既存孤児行の自動クリーンアップ・修復 mutation（検出は実装するが自動削除は範囲外）
- staging / production deploy、commit、push、PR 作成（Phase 13 / user-gated）

## Phase 一覧

| Phase | 名称 | ファイル | status |
|------|------|---------|--------|
| 1 | 要件定義 | [phase-1.md](phase-1.md) | implemented_local |
| 2 | 設計（ADR: no-FK 確定 + app 層ガード設計） | [phase-2.md](phase-2.md) | implemented_local |
| 3 | 設計レビュー | [phase-3.md](phase-3.md) | implemented_local |
| 4 | テスト作成（TDD Red） | [phase-4.md](phase-4.md) | implemented_local |
| 5 | 実装 | [phase-5.md](phase-5.md) | implemented_local |
| 6 | テスト拡充 | [phase-6.md](phase-6.md) | implemented_local |
| 7 | カバレッジ確認 | [phase-7.md](phase-7.md) | implemented_local |
| 8 | リファクタリング | [phase-8.md](phase-8.md) | implemented_local |
| 9 | 品質保証 | [phase-9.md](phase-9.md) | implemented_local |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) | implemented_local |
| 11 | 手動テスト（NON_VISUAL） | [phase-11.md](phase-11.md) | implemented_local |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | implemented_local |
| 13 | PR作成（user-gated） | [phase-13.md](phase-13.md) | pending_user_approval |

## 受入基準（issue 原文 AC を現コードへ最適化）

| # | 受入基準 | 元 AC との対応 |
|---|----------|----------------|
| AC-1 | DB-level FK は `0022_member_photos.sql:4` の documented no-FK 架構ゆえ **採用しない** 意思決定が根拠付きで文書化されている（D1 FK enforcement 不確実 + application-layer integrity 方針）。代替として app 層ガードを実装する | 元 AC-1 / AC-4 / AC-5 を統合・最適化 |
| AC-2 | `detectOrphanMemberTags()` / `countOrphanMemberTags()` で `member_tags.tag_id NOT IN (SELECT tag_id FROM tag_definitions)` の孤児行を機械検出できる | 元 AC-2 |
| AC-3 | member_tags INSERT 3 経路（`assignTagsToMember` / `assignTagToMemberByAdmin` / `bulkApplyMemberTagsByAdmin`）が tag_id 先在検証を通すことを回帰テストで baseline 化している | 元 AC-3 |
| AC-4 | issue-1070 の count guard（削除時参照防壁）と orphan detection（既存孤児の検出・監査）の責務分離が明記されている | 元 AC-6 |
| AC-5 | 全 member_tags INSERT fixture（`members.contract.spec.ts:104-110, 421-428` 等）が事前に `tag_definitions` を定義しテスト由来の孤児を生まないことを確認し、孤児 0 件を回帰テストで保証している（万一孤立 INSERT する fixture が見つかれば定義へ修正） | 元 AC-2 派生（新設・回帰 guard） |
| AC-6 | admin が孤児行を検出できる read-only endpoint `GET /admin/tags/orphans` が追加され contract test で保証されている | app 層ガードの actionable surface（新設） |
| AC-7 | 全 spec 実行後 `countOrphanMemberTags()` == 0 が不変条件として検証され、typecheck / lint / 既存 issue-1070 ガード spec が非破壊である | DoD |

## 不変条件への適合

1. **invariant #5（D1 直接アクセスは apps/api に閉じる）**: 本実装は `apps/api` の repository / route のみ。apps/web 非接触。
2. **invariant #13（member_tags write 経路を `assign*` 4 関数に限定）**: 追加するのは `detect*` / `count*` の **read** 関数のみ。`memberTags.readonly.test-d.ts` の禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`）に非該当。
3. **documented no-FK 架構（0022:4）**: DB-level FK を追加せず application 層で整合性を保つ方針を維持・強化する。
4. **issue-1070 ガード非破壊**: `countMemberTagReferences` + 409 `tag_has_references` を撤去せず、orphan detection と責務分離して共存させる。
5. **新 migration / D1 schema 変更なし / Google Form 仕様変更なし**。
