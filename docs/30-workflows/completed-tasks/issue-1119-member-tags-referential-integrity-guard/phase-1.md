# Phase 1 — 要件定義

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト・コード変更を伴う）。
> 本 Phase は scope / 受入条件 / inventory / 命名規則 / 実装区分を固定する。

## 1. 真の論点（1文）

`member_tags.tag_id` が `tag_definitions.tag_id` を参照するが **DB-level の参照整合性保証が無い**状態で、唯一の防壁が issue-1070 の削除時 count guard のみ。**既存の孤児行（tag_definitions に存在しない tag_id を持つ member_tags 行）を検出・監査できない**ギャップを、documented no-FK 架構を反転させずに application 層で根本解決する。

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No（孤児行検出関数・endpoint ともゼロ） | 通常の実装 Phase（`implementation_mode: new`） |
| upstream（dev）にマージ済み | No（HEAD == origin/dev で 0 件差分・本機能は dev に無い） | 未実装として扱う |
| 前提タスク（#1070）完了済み | Yes（`countMemberTagReferences` + 409 ガード実装済） | 依存解消済み・共存設計として拡張 |

## 3. 現状コード inventory（実測・命名規則）

| レイヤ | ファイル | 現状 | 命名規則 |
|--------|----------|------|----------|
| migration | `apps/api/migrations/0002_admin_managed.sql:43-51` | `member_tags(member_id, tag_id, source, confidence, assigned_at, assigned_by)` / `PRIMARY KEY (member_id, tag_id)` / FK なし | snake_case 列 / `NNNN_name.sql` |
| migration | `apps/api/migrations/0002_admin_managed.sql:34-41` | `tag_definitions(tag_id PK, code UNIQUE, label, category, source_stable_keys_json, active)` | 同上 |
| 架構方針 | `apps/api/migrations/0022_member_photos.sql:4` | 「member_id は論理 FK（D1 は application 層で整合、FK 制約なし）」 documented invariant | — |
| repository (read) | `apps/api/src/repository/memberTags.ts:54,73,153,168,188,243` | `listTagsByMemberId` / `getTagDefinitionMaster` / `findTagDefinitionById` 等の read 関数群 | TS = camelCase / read prefix = `list`/`get`/`find` |
| repository (count guard) | `apps/api/src/repository/tagDefinitions.ts:210-216` | `countMemberTagReferences(c, tagId)` = `SELECT COUNT(*) FROM member_tags WHERE tag_id = ?1` | camelCase |
| repository (delete guard) | `apps/api/src/repository/tagDefinitions.ts:223-237` | `physicalDeleteTagDefinition` が referenceCount>0 で `has_references` 返却 | camelCase |
| route | `apps/api/src/routes/admin/tags.ts:267-284` | `DELETE /tags/:tagId/physical` が 409 `tag_has_references` 返却 | kebab path / `:param` |
| route | `apps/api/src/routes/admin/tags.ts:251-265` | `POST /tags/:tagId/reactivate` | 同上 |
| type guard | `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts:3,18-24,48` | `insert*`/`update*`/`delete*`/`upsert*`/`assign*` prefix の新規 export を typecheck で禁止 | — |
| test fixture | `apps/api/src/routes/admin/members.contract.spec.ts:104-110,421-428` | member_tags INSERT（:109,:426）の**直前に tag_definitions へ tag_a/tag_b を定義済み**（:104,:421）。実検証で孤児を生まないことを確認・健全 | — |
| contract spec | `apps/api/src/routes/admin/tags.contract.spec.ts:362-389` | issue-1070 参照ガード contract test（`tag_eng` で 409 検証） | — |
| repository spec | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts:170-205` | `countMemberTagReferences` repository test | — |

**命名方針（本タスクで踏襲）**:
- D1 列 = snake_case（`member_id` / `tag_id`） / TS = camelCase（`memberId` / `tagId`） / 定数 = UPPER_SNAKE
- 追加する read 関数 = `detectOrphanMemberTags` / `countOrphanMemberTags`（`detect`/`count` prefix は read であり禁止 prefix に非該当）
- 新 endpoint path = `/admin/tags/orphans`（静的セグメント・`:tagId` param より前に登録して route capture を回避）

## 4. 受入条件（issue 原文 AC を現コードへ最適化）

| # | issue 原文 AC | 現コード最適化後の受入条件 |
|---|----------------|----------------------------|
| AC-1 | FK 追加可否の意思決定 + 根拠文書化（元 AC-1）/ D1 PRAGMA 挙動確認（元 AC-4）/ FK 採用時 migration 範囲見積もり（元 AC-5） | DB-level FK は `0022:4` documented no-FK 架構ゆえ **採用しない** 意思決定を根拠付きで Phase 2 ADR に記録（D1 FK enforcement 不確実 + application-layer integrity 方針）。代替として app 層ガードを実装 |
| AC-2 | 孤児行調査（元 AC-2） | `detectOrphanMemberTags()` / `countOrphanMemberTags()` で `member_tags.tag_id NOT IN (SELECT tag_id FROM tag_definitions)` を機械検出できる |
| AC-3 | seed/ingest/migration 順序影響評価（元 AC-3） | member_tags INSERT 3 経路（`assignTagsToMember` / `assignTagToMemberByAdmin` / `bulkApplyMemberTagsByAdmin`）の tag_id 先在検証を回帰テストで baseline 化 |
| AC-4 | app-level guard との共存/代替/補強（元 AC-6） | issue-1070 count guard（削除時参照防壁）と orphan detection（既存孤児の検出・監査）の責務分離を明記 |
| AC-5 | （元 AC-2 派生・新設・回帰 guard） | 全 member_tags INSERT fixture が事前に `tag_definitions` を定義しテスト由来の孤児を生まないことを確認し孤児 0 件を保証（`members.contract.spec.ts:104-110,421-428` は健全と実測。万一孤立 INSERT が見つかれば定義へ修正） |
| AC-6 | （新設・actionable surface） | admin read-only endpoint `GET /admin/tags/orphans` を追加し contract test で保証 |
| AC-7 | （DoD） | 全 spec 実行後 `countOrphanMemberTags()` == 0 が不変条件として検証され、typecheck / lint / 既存 issue-1070 ガード spec が非破壊 |

## 5. タスク分類

- **NON_VISUAL**（backend repository + admin API のみ・UI コンポーネント変更ゼロ）。Phase 11 は自動テスト結果を主証跡とし screenshot 不要。
- **NON_VISUAL 宣言根拠**: 追加するのは D1 read 関数 2 つ・read-only JSON endpoint 1 つ・テスト・fixture 健全性確認のみ。レンダリングされる UI 画面は変更しない。

## 6. 非機能・不変条件

- **invariant #5**: D1 直接アクセスは apps/api に閉じる（apps/web 非接触）
- **invariant #13**: member_tags write 経路を `assign*` 4 関数に限定。追加は **read** 関数のみ（`detect`/`count` prefix は `memberTags.readonly.test-d.ts` の禁止 prefix に非該当）
- **documented no-FK 架構（0022:4）**: DB-level FK を追加せず application 層で整合性を保つ方針を維持・強化
- **issue-1070 ガード非破壊**: count guard + 409 を撤去せず共存
- **新 migration / D1 schema 変更なし / Google Form 仕様変更なし**
- **無料枠維持**: 追加クエリは read-only の軽量 COUNT / SELECT のみ。書き込み副作用ゼロ

## 7. carry-over 確認

直近コミット（`git log --oneline -5`）は issue-1079（bulk tag batchId 検索）/ issue-1080（bulk tag 部分失敗表示）/ issue-1078（bulk tag picker）等で、いずれも member_tags の参照整合性検出には触れていない。本タスクの新規作業（孤児行検出ガード）と重複なし。HEAD == origin/dev で同期済み（マージ不要）。

## 完了条件（Phase 1）

- [x] scope / 受入条件 / inventory / 命名規則を固定
- [x] `implementation_mode: new` / NON_VISUAL / 実装区分=実装仕様書 を確定
- [x] DB-level FK 不採用の方針を AC-1 として固定（Phase 2 ADR で根拠詳細化）
- [x] 出力: [outputs/phase-1/requirements-definition.md](outputs/phase-1/requirements-definition.md) / [outputs/phase-1/scope-definition.md](outputs/phase-1/scope-definition.md) / [outputs/phase-1/acceptance-criteria.md](outputs/phase-1/acceptance-criteria.md)
