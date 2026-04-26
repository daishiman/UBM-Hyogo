# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 7 (AC マトリクス) |
| 下流 | Phase 9 (品質保証) |
| 状態 | pending |

## 目的

Phase 5 placeholder と Phase 4 verify suite の **重複 / 命名揺れ / path 揺れ** を Before / After で見える化し、リファクタする。02b / 02c との共有点も整理する。

## DRY 化対象

### 1. 命名

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| repository ファイル | `responseSection.ts` / `response_sections.ts` 等の揺れ | `responseSections.ts`（複数形 + camelCase） | テーブル名と 1:1 対応、複数形で row が複数 |
| row 型 | `Member` / `MemberRow` / `MemberRecord` の揺れ | `MemberRow`（DB row 型）/ `MemberProfile`（view model 型） | Row = DB、Profile = view |
| insert 型 | `MemberCreate` / `NewMember` の揺れ | `NewMemberRow` | DB へ投入直前の型 |
| function 名 | `findById` / `getById` / `byId` の揺れ | `findXxxById`（null 返却）/ `getXxxById`（必ず返る、無ければ throw） | null 許容を区別 |
| list 関数 | `findAll` / `list` の揺れ | `listXxxByYyy`（必ず複数形 + by 条件） | 単数 vs 複数を明示 |

### 2. path

| Before | After | 理由 |
| --- | --- | --- |
| `apps/api/repository/` | `apps/api/src/repository/` | apps/api は src/ 配下が標準 |
| `apps/api/src/db/` | `apps/api/src/repository/_shared/db.ts` | repository 専用 |
| `apps/api/src/lib/brand.ts` | `apps/api/src/repository/_shared/brand.ts` | brand は repository 内で完結 |
| `apps/api/test/` | `apps/api/src/repository/__tests__/` | colocate |
| `apps/api/fixtures/` | `apps/api/src/repository/__fixtures__/` | colocate |

### 3. shared with 02b / 02c

| 共有点 | After（場所） | 担当 task |
| --- | --- | --- |
| `_shared/db.ts` (DbCtx) | 02a が初出、02b/02c は再 import | 02a |
| `_shared/brand.ts` (MemberId/ResponseId/StableKey) | 02a が初出 | 02a |
| `_shared/builder.ts` (view assembler) | 02a 内で完結（02b/02c は使わない） | 02a |
| dependency-cruiser config | 02c がメイン管理、02a はルール案を提供 | 02c |
| in-memory D1 fixture loader | 02c が共通化、02a は member fixture を提供 | 02c |

### 4. test の重複排除

| 重複 | After |
| --- | --- |
| 各 *.test.ts で D1 setup を重複記述 | `__tests__/_setup.ts` に集約、`describe.beforeEach(setupD1)` で再利用 |
| fixture を test ごとに inline | `__fixtures__/*.fixture.ts` から import |
| zod parse の `expect.toBeDefined()` 連発 | `expectViewModel(actual, schema)` ヘルパー |

### 5. SQL の DRY 化

| Before | After | 効果 |
| --- | --- | --- |
| 各 repository が prepared SQL 文字列を重複 | `_shared/sql.ts` に共通 SELECT 句 helper（`selectMembers()` 等） | typo 防止 |
| `IN (?,?,?)` の placeholder 生成 | `_shared/sql.ts` の `placeholders(n)` helper | N 件可変対応 |

## Before / After 集約表

| カテゴリ | Before 件数 | After 件数 | 削減 |
| --- | --- | --- | --- |
| 命名揺れ | 5 種 | 0 | 100% |
| path 揺れ | 5 種 | 0 | 100% |
| 共有候補 | 5 件 | 5 件（02a/02b/02c で正本確定） | redundant 0 |
| test 重複 | 3 種 | 0 | 100% |
| SQL 重複 | 2 種 | 0 | 100% |

## 実行タスク

1. Before / After 表を `outputs/phase-08/before-after.md` に作成
2. 共有点を `outputs/phase-08/main.md` に作成（02b/02c との連携明示）
3. 命名 / path / SQL DRY ルールを main.md に箇条書き
4. test 共通化 helper の signature を貼る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 runbook.md | 対象 placeholder |
| 必須 | Phase 7 ac-matrix.md | 触れる範囲 |
| 参考 | doc/02-application-implementation/02b-... / 02c-... | 共有点合意 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後の lint / typecheck で確認 |
| Phase 10 | レビューで再確認 |
| 02b / 02c | `_shared/` 共有点の合意 |
| 03b / 04* | After 命名で実装 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| boundary | #5 | `_shared/db.ts` が `apps/api/src/repository/` 配下に閉じる |
| 型混同 | #7 | `_shared/brand.ts` が単一 source |
| view 分離 | #12 | builder の戻り値型分離が path リファクタで崩れない |
| 02b/02c 共有 | — | dependency-cruiser config の正本が 02c |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名 Before/After | 8 | pending | 5 種 |
| 2 | path Before/After | 8 | pending | 5 種 |
| 3 | shared 共有 | 8 | pending | 5 件 |
| 4 | test DRY | 8 | pending | 3 種 |
| 5 | SQL DRY | 8 | pending | 2 種 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY ルール + 共有合意 |
| ドキュメント | outputs/phase-08/before-after.md | 命名 / path / SQL Before/After |

## 完了条件

- [ ] 5 カテゴリ全てで Before/After 一致
- [ ] 02b/02c との共有点が明示
- [ ] test 共通化 helper の signature が定義

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-08/{main,before-after}.md が配置済み
- [ ] artifacts.json の Phase 8 を completed に更新

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ事項: Before/After + 共有合意
- ブロック条件: 共有点で 02b/02c と矛盾があれば Phase 8 を再実行
