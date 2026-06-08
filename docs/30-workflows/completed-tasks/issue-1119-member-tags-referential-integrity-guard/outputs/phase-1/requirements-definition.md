# Phase 1 — 要件定義詳細

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト・コード変更を伴う） / `implementation_mode: new` / **NON_VISUAL**
> task_id: `task-issue-1119-member-tags-referential-integrity-guard`
> GitHub Issue [#1119](https://github.com/daishiman/UBM-Hyogo/issues/1119)（**CLOSED 維持・reopen しない**） / 親 #1070 / 元 unassigned spec = `task-issue-1070-followup-003-member-tags-foreign-key-evaluation`

## 1. 真の論点（1 文）

`member_tags.tag_id` が `tag_definitions.tag_id` を参照するが **DB-level の参照整合性保証が無い**状態で、唯一の防壁が issue-1070 の削除時 count guard のみであるため、**既に存在する孤児行（`tag_definitions` に対応 `tag_id` が無い `member_tags` 行）を検出・監査できないギャップ**を、documented no-FK 架構（`apps/api/migrations/0022_member_photos.sql:4`）を反転させずに application 層で根本解決する。

### 根本問題の構造

| 層 | 現状 | ギャップ |
|----|------|----------|
| DB schema | `member_tags(member_id, tag_id, ...)` / `PRIMARY KEY (member_id, tag_id)` / **FK なし** | DB が孤児 INSERT を拒否しない |
| 削除時防壁（issue-1070） | `countMemberTagReferences(c, tagId)` + 409 `tag_has_references` | tag 削除「直前」に被参照を防ぐのみ。**逆方向（孤児）** は見えない |
| 検出・監査 | **存在しない** | 既存孤児行を機械検出する手段がゼロ |

issue-1070 の count guard は「参照されている tag を消そうとしたら止める」（= 孤児の**発生防止**の一部）であって、「既にできてしまった孤児を見つける」（= **検出・可視化**）ではない。本タスクはこの後者の盲点を埋める。

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | **No**（孤児行検出関数・endpoint ともゼロ） | 通常の実装 Phase（`implementation_mode: new`） |
| upstream（`origin/dev`）にマージ済み | **No**（`HEAD == origin/dev` で 0 件差分・本機能は dev に無い） | 未実装として扱う・マージ不要 |
| 前提タスク（#1070）完了済み | **Yes**（`countMemberTagReferences` + 409 ガード実装済） | 依存解消済み・共存（責務分離）設計として拡張 |
| 別タスクで解決済みか | **No**（issue-1117 `migrateTo` / issue-1105 member_status FK も spec のみで未実装） | 重複なし・本タスクで根本解決 |

### 実測コマンドと結果（裏取り）

| コマンド | 結果 | 含意 |
|----------|------|------|
| `grep -rn "FOREIGN KEY" apps/api/migrations/` | 空（0 件） | 全 migration 0001〜0025 に DB FK なし |
| `grep -rn "PRAGMA foreign_keys\|defer_foreign_keys" apps/api/` | 空（0 件） | FK enforcement 制御も不在 |
| `grep -rn "migrateTo" apps/api/` | 空（0 件） | issue-1117 強制移行は未実装 |
| `grep -rn "detectOrphan\|countOrphan" apps/api/` | 空（0 件） | 本機能は未着手 |

## 3. 現状コード inventory（実測・命名規則）

| レイヤ | ファイル | 現状 | 命名規則 |
|--------|----------|------|----------|
| migration | `apps/api/migrations/0002_admin_managed.sql:43-51` | `member_tags(member_id, tag_id, source, confidence, assigned_at, assigned_by)` / `PRIMARY KEY (member_id, tag_id)` / FK なし | snake_case 列 / `NNNN_name.sql` |
| migration | `apps/api/migrations/0002_admin_managed.sql:34-41` | `tag_definitions(tag_id PK, code UNIQUE, label, category, source_stable_keys_json, active)` | 同上 |
| 架構方針 | `apps/api/migrations/0022_member_photos.sql:4` | 「member_id は論理 FK（D1 は application 層で整合、FK 制約なし）」documented invariant | — |
| repository (read) | `apps/api/src/repository/memberTags.ts:54,73,153,168,188,243` | `listTagsByMemberId` / `getTagDefinitionMaster` / `findTagDefinitionById` 等の read 関数群 | TS=camelCase / read prefix=`list`/`get`/`find` |
| repository (count guard) | `apps/api/src/repository/tagDefinitions.ts:210-216` | `countMemberTagReferences(c, tagId)` = `SELECT COUNT(*) FROM member_tags WHERE tag_id = ?1` | camelCase |
| repository (delete guard) | `apps/api/src/repository/tagDefinitions.ts:223-237` | `physicalDeleteTagDefinition` が referenceCount>0 で `has_references` 返却 | camelCase |
| route | `apps/api/src/routes/admin/tags.ts:267-284` | `DELETE /tags/:tagId/physical` が 409 `tag_has_references` 返却 | kebab path / `:param` |
| route | `apps/api/src/routes/admin/tags.ts:251-265` | `POST /tags/:tagId/reactivate` | 同上 |
| type guard | `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts:3,18-24,48` | `insert*`/`update*`/`delete*`/`upsert*`/`assign*` prefix の新規 export を typecheck で禁止 | — |
| test fixture | `apps/api/src/routes/admin/members.contract.spec.ts:104-110,421-428` | `member_tags` INSERT（:109,:426）の直前に `tag_definitions` へ `tag_a`/`tag_b` を定義済み。実検証で孤児を生まないことを確認・健全 | — |
| contract spec | `apps/api/src/routes/admin/tags.contract.spec.ts:362-389` | issue-1070 参照ガード contract test（`tag_eng` で 409 検証） | — |
| repository spec | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts:170-205` | `countMemberTagReferences` repository test | — |

### 命名方針（本タスクで踏襲）

- D1 列 = snake_case（`member_id` / `tag_id`） / TS = camelCase（`memberId` / `tagId`） / 定数 = UPPER_SNAKE
- 追加する read 関数 = `detectOrphanMemberTags` / `countOrphanMemberTags`（`detect` / `count` prefix は read であり禁止 prefix に**非該当**）
- 新 endpoint path = `/admin/tags/orphans`（静的セグメント・`:tagId` param より**前**に登録して route capture を回避）
- 新 type = `OrphanMemberTag`

## 4. 受入条件（サマリ）

詳細は [acceptance-criteria.md](acceptance-criteria.md) を正本とする。本節は要約のみ。

| # | 受入条件（要約） |
|---|------------------|
| AC-1 | DB-level FK は no-FK 架構ゆえ **採用しない**意思決定を根拠付きで Phase 2 ADR に記録 |
| AC-2 | `detectOrphanMemberTags()` / `countOrphanMemberTags()` で孤児行を機械検出 |
| AC-3 | INSERT 3 経路の tag_id 先在検証を回帰テストで baseline 化（`assignTagsToMember` helper 単体でも active tag master に存在しない tag_id を skip し孤児を作らない） |
| AC-4 | count guard（防止）と orphan detection（検出）の責務分離を明記 |
| AC-5 | 全 member_tags INSERT fixture が事前に `tag_definitions` を定義しテスト由来孤児を 0 にしていることを確認（`tag_a`/`tag_b` は既に定義済みのため fixture 差分なし） |
| AC-6 | `GET /admin/tags/orphans` read-only endpoint を contract test で保証 |
| AC-7 | `countOrphanMemberTags() == 0` 不変条件 + typecheck/lint/issue-1070 ガード非破壊 |

## 5. タスク分類（NON_VISUAL）

- **NON_VISUAL**（backend repository + admin API のみ・UI コンポーネント変更ゼロ）。
- **宣言根拠**: 追加するのは D1 read 関数 2 つ・read-only JSON endpoint 1 つ・テスト・fixture 健全性確認のみ。レンダリングされる UI 画面は変更しない。
- **Phase 11 証跡方針**: 自動テスト（repository spec / contract spec）の実行結果と typecheck/lint の結果を主証跡とし、screenshot は不要（present/pending/n-a の status 列で n-a を明示）。

## 6. 非機能・不変条件

- **invariant #5**: D1 直接アクセスは `apps/api` に閉じる（`apps/web` 非接触）。
- **invariant #8**: 新規 test は `*.spec.ts` のみ（`*.test.{ts,tsx}` 禁止）。`memberTags.readonly.test-d.ts` は型 typecheck 用の `.test-d.ts` で既存規約踏襲・本タスクで編集しない（typecheck green 確認のみ）。
- **invariant #13**: member_tags write 経路を `assign*` 4 関数に限定。追加は **read** 関数のみ（`detect` / `count` prefix は禁止 prefix に非該当）。
- **documented no-FK 架構（0022:4）**: DB-level FK を追加せず application 層で整合性を保つ方針を維持・強化。
- **issue-1070 ガード非破壊**: count guard + 409 を撤去せず共存。
- **新 migration / D1 schema 変更なし / Google Form 仕様変更なし**。
- **無料枠維持**: 追加クエリは read-only の軽量 `COUNT` / `SELECT` のみ。書き込み副作用ゼロ。

## 7. 依存関係

| 依存 | 種別 | 状態 | 影響 |
|------|------|------|------|
| issue-1070（`countMemberTagReferences` + 409 ガード） | 上流（完了済） | 実装済 | 責務分離して共存（撤去しない） |
| `tag_definitions` seed（0004） | データ前提 | 41 行常在 | `NOT IN` サブクエリが空テーブルで誤検出しない前提（エッジケースは Phase 4 で検証） |
| `DbCtx` 型（既存 read 関数と同型） | 型前提 | 既存 | 新規 read 関数のシグネチャ整合 |
| `memberTags.readonly.test-d.ts`（禁止 prefix typecheck） | gate | 既存 | `detect`/`count` 非該当を確認 |

## 8. carry-over 確認

直近コミット（`git log --oneline -5`）は issue-1079（bulk tag batchId 検索）/ issue-1080（bulk tag 部分失敗表示）/ issue-1078（bulk tag picker）等で、いずれも member_tags の参照整合性検出には触れていない。本タスクの新規作業（孤児行検出ガード）と重複なし。`HEAD == origin/dev` で同期済み（マージ不要）。

## 完了条件（Phase 1）

- [x] scope / 受入条件 / inventory / 命名規則を固定
- [x] `implementation_mode: new` / NON_VISUAL / 実装区分=実装仕様書 を確定
- [x] DB-level FK 不採用の方針を AC-1 として固定（Phase 2 ADR で根拠詳細化）
- [x] 依存関係（issue-1070 / seed / 型 / typecheck gate）を整理
