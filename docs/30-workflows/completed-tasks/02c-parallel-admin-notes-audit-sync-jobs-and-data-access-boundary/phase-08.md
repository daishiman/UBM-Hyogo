# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 7 (AC マトリクス) |
| 下流 | Phase 9 (品質保証) |
| 状態 | pending |

## 目的

Phase 5 placeholder と Phase 4 verify suite の **重複 / 命名揺れ / path 揺れ** を Before / After で見える化し、リファクタする。02c は `_shared/` の正本管理者として、02a / 02b と共有する型・util の単一 source を確定する。dep-cruiser config / ESLint config / in-memory D1 loader の DRY 化が中核。

## DRY 化対象

### 1. 命名

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| repository ファイル | `adminNote.ts` / `admin_notes.ts` 等の揺れ | `adminNotes.ts`（複数形 + camelCase） | テーブル名 `admin_member_notes` と 1:1（接頭 `admin_member_` は 02c 内で省略可） |
| row 型 | `AdminNote` / `AdminNoteRow` / `AdminMemberNote` の揺れ | `AdminMemberNoteRow`（DB row 型） | row = DB |
| append 型 | `AuditLogCreate` / `NewAuditLog` の揺れ | `NewAuditLogEntry` | DB へ投入直前の型 |
| function 名 | `findByEmail` / `getByEmail` / `byEmail` の揺れ | `findByEmail`（null 返却）/ `getByEmail`（必ず返る、無ければ throw） | null 許容を区別 |
| consume 戻り値 | bool / Error throw の揺れ | discriminated union `{ ok: true; row } \| { ok: false; reason }` | TS で網羅性確保 |
| 状態遷移 | `transition()` / `setStatus()` の揺れ | `start` / `succeed` / `fail` の意味語 | 副作用 + 状態名で意図明示 |

### 2. path

| Before | After | 理由 |
| --- | --- | --- |
| `apps/api/repository/` | `apps/api/src/repository/` | apps/api は src/ 配下が標準 |
| `apps/api/src/db/` | `apps/api/src/repository/_shared/db.ts` | repository 専用 |
| `apps/api/src/lib/brand.ts` | `apps/api/src/repository/_shared/brand.ts` | brand は repository 内で完結 |
| `apps/api/src/audit.ts` | `apps/api/src/repository/auditLog.ts` | repository 階層内 |
| `apps/api/src/jobs/sync.ts` | `apps/api/src/repository/syncJobs.ts` | repository 階層内（ジョブ実行は 03a/03b） |
| `apps/api/src/auth/magic.ts` | `apps/api/src/repository/magicTokens.ts` | repository 階層内（issue/verify/consume API） |
| `apps/api/test/` | `apps/api/src/repository/__tests__/` | colocate |
| `apps/api/fixtures/` | `apps/api/src/repository/__fixtures__/` | colocate |

### 3. shared with 02a / 02b（02c が正本管理）

| 共有点 | After（場所） | 担当 task | 利用側 |
| --- | --- | --- | --- |
| `_shared/db.ts` (DbCtx) | apps/api/src/repository/_shared/db.ts | **02c 正本** | 02a, 02b, 02c |
| `_shared/brand.ts` (MemberId / ResponseId / StableKey / AdminEmail / MagicTokenValue) | apps/api/src/repository/_shared/brand.ts | **02c 正本** | 02a, 02b, 02c |
| `_shared/sql.ts` (placeholders helper / SELECT 句 helper) | apps/api/src/repository/_shared/sql.ts | **02c 正本** | 02a, 02b, 02c |
| `__tests__/_setup.ts` (in-memory D1 loader) | apps/api/src/repository/__tests__/_setup.ts | **02c 正本** | 02a, 02b, 02c |
| `.dependency-cruiser.cjs` (boundary config) | リポジトリルート | **02c 正本** | リポジトリ全体 |
| `apps/web/eslint.config.js` の no-restricted-imports rule | apps/web 配下 | **02c 正本** | apps/web |

### 4. test の重複排除

| 重複 | After |
| --- | --- |
| 各 *.test.ts で D1 setup を重複記述 | `__tests__/_setup.ts` の `setupD1()` に集約、`describe.beforeEach(setupD1)` |
| fixture を test ごとに inline | `__fixtures__/admin.fixture.ts` から import（`fixtureAdminUsers` / `fixtureAdminNotes` / `fixtureAuditLog`） |
| `expect(result).toBeDefined()` 連発 | `expectMagicTokenRow(actual)` ヘルパー |
| append-only test の boilerplate | `expectAppendOnly(repository, methodNames)` ヘルパー（UPDATE/DELETE 関数不在を type で検証） |

### 5. SQL の DRY 化

| Before | After | 効果 |
| --- | --- | --- |
| 各 repository が prepared SQL 文字列を重複（SELECT 句） | `_shared/sql.ts` の `selectAdminUsers()` / `selectAdminNotes()` 等 helper | typo 防止 |
| `IN (?,?,?)` の placeholder 生成 | `_shared/sql.ts` の `placeholders(n)` helper | N 件可変対応 |
| ISO8601 now 生成 | `_shared/sql.ts` の `nowIso()` helper | TZ 統一（UTC） |

### 6. boundary tooling の DRY 化

| Before | After |
| --- | --- |
| dep-cruiser の cross-domain rule を 02a / 02b / 02c で重複記述 | rule 配列を 1 か所（`.dependency-cruiser.cjs`）に集約、`from`/`to` regex を 02c で正本管理 |
| ESLint の no-restricted-imports を web 各 page で個別設定 | `apps/web/eslint.config.js` で 1 か所定義、全 web ファイル適用 |

## Before / After 集約表

| カテゴリ | Before 件数 | After 件数 | 削減 |
| --- | --- | --- | --- |
| 命名揺れ | 6 種 | 0 | 100% |
| path 揺れ | 8 種 | 0 | 100% |
| 共有候補 | 6 件 | 6 件（02c 正本） | redundant 0 |
| test 重複 | 4 種 | 0 | 100% |
| SQL 重複 | 3 種 | 0 | 100% |
| boundary tooling 重複 | 2 種 | 0 | 100% |

## 実行タスク

1. Before / After 表 6 カテゴリを `outputs/phase-08/before-after.md` に作成
2. 共有点を `outputs/phase-08/main.md` に作成（02a/02b との連携明示）
3. 命名 / path / SQL DRY ルールを main.md に箇条書き
4. test 共通化 helper の signature を貼る
5. boundary tooling の正本管理者が 02c であることを 02a / 02b の Phase 8 と整合させる申し送り

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 outputs/phase-05/runbook.md | 対象 placeholder |
| 必須 | Phase 7 outputs/phase-07/ac-matrix.md | 触れる範囲 |
| 参考 | doc/02-application-implementation/02a-... / 02b-... | 共有点合意 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後の lint / typecheck で確認 |
| Phase 10 | レビューで再確認 |
| 02a / 02b | `_shared/` 共有点の合意（02c が正本） |
| 03a / 03b / 04c / 05a / 05b / 07c | After 命名で実装 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| boundary | #5 | `_shared/db.ts` が `apps/api/src/repository/` 配下に閉じる |
| 型混同 | — | `_shared/brand.ts` が単一 source（02c 正本） |
| view 分離 | #12 | adminNotes 命名が builder の戻り値型に紛れ込まない |
| GAS 昇格防止 | #6 | `__fixtures__/` の path が dev 専用と分かる命名 |
| 02a/02b 共有 | — | dependency-cruiser config / ESLint config の正本が 02c |
| append-only | — | `expectAppendOnly` helper で UPDATE/DELETE 不在を type 検証 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名 Before/After | 8 | pending | 6 種 |
| 2 | path Before/After | 8 | pending | 8 種 |
| 3 | shared 共有 | 8 | pending | 6 件 |
| 4 | test DRY | 8 | pending | 4 種 |
| 5 | SQL DRY | 8 | pending | 3 種 |
| 6 | boundary tooling DRY | 8 | pending | 2 種 |
| 7 | 02a/02b との合意確認 | 8 | pending | _shared 正本 02c |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY ルール + 共有合意 |
| ドキュメント | outputs/phase-08/before-after.md | 命名 / path / SQL / tooling Before/After |

## 完了条件

- [ ] 6 カテゴリ全てで Before/After 一致
- [ ] 02a/02b との共有点が明示（02c 正本）
- [ ] test 共通化 helper の signature が定義
- [ ] boundary tooling の正本が 02c で合意

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が completed
- [ ] outputs/phase-08/{main,before-after}.md が配置済み
- [ ] artifacts.json の Phase 8 を completed に更新

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ事項: Before/After + 共有合意（02c 正本）
- ブロック条件: 共有点で 02a/02b と矛盾があれば Phase 8 を再実行
