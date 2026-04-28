# Phase 1: 要件定義 — main

## 1. 目的

管理者ドメイン（`admin_users` / `admin_member_notes` / `audit_log` / `sync_jobs` / `magic_tokens`）の D1 アクセス層を `apps/api/src/repository/` 配下に確定するとともに、同 Wave 全体（02a/02b/02c）の **data access 境界** を確定する。

- 不変条件 #5（`apps/web` → D1 直接アクセス禁止）を **dep-cruiser + ESLint の二重防御** で構造的に守る
- 不変条件 #12（`admin_member_notes` は public/member view model に混ざらない）を **builder 経路に呼ばれない設計** で守る
- 不変条件 #6（GAS prototype 昇格防止）を **fixture を dev scope のみに限定** することで守る
- 不変条件 #11（管理者は他人プロフィール本文を直接編集できない）を **adminNotes 専用テーブル + member_responses に触れない** ことで守る

## 2. 入力確認結果

### 上流 01a: D1 schema migration

確定済み 5 テーブル:
- `admin_users` (email PK, role, created_at, last_seen_at)
- `admin_member_notes` (note_id PK, member_id FK→members, body, created_by, updated_by, created_at, updated_at)
- `audit_log` (id PK, actor, action, target_type, target_id, metadata JSON, occurred_at)
- `sync_jobs` (id PK, kind, status, started_at, finished_at, result JSON, error_message)
- `magic_tokens` (token PK, email, purpose, expires_at, used_at, created_at)

### 上流 01b: zod / branded type

確定済み:
- `AdminEmail` / `MemberId` / `ResponseId` / `StableKey` / `MagicTokenValue` の brand
- `AdminMemberNote` / `AuditLogEntry` / `SyncJob` / `MagicToken` の zod schema

### 02a / 02b との `_shared/` 正本所在合意

- **02c が `apps/api/src/repository/_shared/` の正本管理**（合意済み）
- 02a / 02b はこの `_shared/` から **片方向 import**（02a → _shared、02b → _shared）
- 02a/02b/02c の domain 同士の相互 import は **dep-cruiser で禁止**
- `__tests__/_setup.ts` は 02c が提供し、02a/02b/02c の test が共通利用

## 3. 責務一覧

### 3.1 repository（5 ファイル / `apps/api/src/repository/`）

| # | ファイル | 責務 | 備考 |
| --- | --- | --- | --- |
| 1 | `adminUsers.ts` | `admin_users` の read（findByEmail / listAll / touchLastSeen） | write は seed/wrangler のみ |
| 2 | `adminNotes.ts` | `admin_member_notes` の CRUD | builder 経路に **呼ばれない** |
| 3 | `auditLog.ts` | `audit_log` の append + read | **UPDATE/DELETE API なし** |
| 4 | `syncJobs.ts` | `sync_jobs` lifecycle（start/succeed/fail） | ALLOWED_TRANSITIONS 一方向 |
| 5 | `magicTokens.ts` | `magic_tokens` issue/verify/consume | **single-use**（used_at set） |

### 3.2 boundary tooling（3 種）

| # | 対象 | 責務 |
| --- | --- | --- |
| 1 | `.dependency-cruiser.cjs`（リポジトリ root） | `apps/web → repository` および `02a↔02b↔02c` 域間 import を禁止 |
| 2 | `apps/web/eslint.config.js` no-restricted-imports | ローカル開発で `apps/web` から `repository/**` および `D1Database` import を即時 lint error |
| 3 | seed/fixture scope 注釈 | `__fixtures__/` 配下は dev scope only（コメントと build 設定で除外） |

### 3.3 test fixture（1 ファイル + データ）

| # | ファイル | 責務 |
| --- | --- | --- |
| 1 | `apps/api/src/repository/__tests__/_setup.ts` | in-memory D1 loader（02a/02b/02c 共通利用、`setupD1()` で `{ ctx, loadFixtures, reset }` を返す） |

## 4. 公開 interface（文章版）

- `adminUsers.findByEmail(c, email)`: `AdminUserRow | null` を返す。05a admin gate / 04c が利用
- `adminUsers.listAll(c)`: 管理画面の admin 一覧
- `adminUsers.touchLastSeen(c, email, at)`: ログイン時刻更新
- `adminNotes.listByMemberId(c, memberId)`: 04c admin route 専用、view model builder からは呼ばない
- `adminNotes.create / update / remove`: 04c admin route 専用
- `auditLog.append(c, entry)`: 任意の admin write 操作の直後に呼ぶ。**戻り値は副作用のための ID のみ**
- `auditLog.listRecent / listByActor / listByTarget`: 監査画面（07c）用 read
- `syncJobs.start(c, kind)`: cron / 手動から forms_schema / forms_response 同期開始
- `syncJobs.succeed(c, id, result) / fail(c, id, msg)`: 完了時呼び出し。逆遷移は `IllegalStateTransition` throw
- `syncJobs.findLatest(c, kind) / listRecent(c, limit)`: 状態確認 read
- `magicTokens.issue(c, input)`: 05b 認証 OTP 発行
- `magicTokens.verify(c, token)`: 検証のみ（read、used_at NULL かつ未 expire を確認）
- `magicTokens.consume(c, token, at)`: **検証 + used_at set** を 1 トランザクションで行う single-use 強制 API。`{ ok: true, row } | { ok: false, reason }` を返す

## 5. 不変条件マッピング

| # | 不変条件 | 守る場所（file / tool） | 守り方 |
| --- | --- | --- | --- |
| 5 | `apps/web` から D1 直接アクセス禁止 | `.dependency-cruiser.cjs` + `apps/web/eslint.config.js` | 二重防御。dep-cruiser は CI gate、ESLint はローカル即時 feedback。`apps/web → apps/api/src/repository/**` および `D1Database` import を 100% 検出 |
| 6 | GAS prototype を本番に昇格させない | `apps/api/src/repository/__fixtures__/*.fixture.ts` + ファイル先頭コメント + tsconfig exclude（prod build） | fixture は dev scope のみ、prod bundle に含めない |
| 11 | 管理者は他人プロフィール本文を直接編集できない | `adminNotes.ts` / `auditLog.ts` の SQL | `member_responses` テーブルに **一切触れない**（grep で検出可能） |
| 12 | `admin_member_notes` は public/member view model に混ざらない | `adminNotes.ts` の呼び出し元制限 + 02a builder が adminNotes を import しない（dep-cruiser 監視） + type test | builder の戻り値型 (`PublicMemberProfile` / `MemberProfile`) に `adminNotes` プロパティが存在しないことを **type test** で固定。04c admin route のみが `adminNotes.*` を呼ぶ |

## 6. AC マッピング（AC-1〜AC-11 ↔ test 戦略）

| AC | 要件 | test 戦略 |
| --- | --- | --- |
| AC-1 | 5 repo ファイル存在＋unit pass | vitest unit test 5 種（adminUsers/adminNotes/auditLog/syncJobs/magicTokens.test.ts） |
| AC-2 | adminNotes が view model に混ざらない | type test（`PublicMemberProfile.adminNotes` not found）+ dep-cruiser（02a builder → adminNotes 禁止） |
| AC-3 | apps/web → repository 禁止 | `scripts/lint-boundaries.mjs` の boundary lint |
| AC-4 | apps/web → D1Database 禁止 | `scripts/lint-boundaries.mjs` の boundary lint |
| AC-5 | dep-cruiser 0 violation | CI で `pnpm depcruise` 0 違反、意図的違反 snippet で error 検出 |
| AC-6 | auditLog append-only | API 不在 type test（`auditLog.update` / `auditLog.delete` は型エラー） |
| AC-7 | magicTokens single-use | `consume` を 2 度呼んで 2 回目 `{ ok:false, reason:"already_used" }` |
| AC-8 | syncJobs status 一方向 | `succeed → fail` で `IllegalStateTransition` throw、`fail → succeed` も throw |
| AC-9 | in-memory loader 共通利用 | 02a/02b/02c が同じ `setupD1()` を import して fixture load 成功 |
| AC-10 | prototype 昇格防止 | fixture が prod bundle に含まれないことを `du` 検証 + ファイル先頭 dev only コメント |
| AC-11 | 02a/02b 相互 import 0 | dep-cruiser rule で 02a↔02b、02b↔02c、02c↔02a の domain ファイル直接 import を全 error |

## 7. handoff: 下流タスク向け interface 一覧

下流が読むべき「上流引き渡し interface」:

- **03a / 03b（forms 同期）**: `syncJobs.start(c, "forms_schema" | "forms_response") → SyncJobRow` / `syncJobs.succeed(c, id, result)` / `syncJobs.fail(c, id, msg)` / `syncJobs.findLatest(c, kind)`
- **04c（admin backoffice API）**: `adminUsers.findByEmail` / `adminNotes.listByMemberId/create/update/remove` / `auditLog.append/listRecent/listByActor/listByTarget`
- **05a（Auth.js Google OAuth + admin gate）**: `adminUsers.findByEmail(c, email) → AdminUserRow | null`（null なら admin ではない、role による gate を呼出側で実装）
- **05b（Magic Link）**: `magicTokens.issue` / `magicTokens.verify` / `magicTokens.consume`（single-use）
- **07c（admin workflow）**: `auditLog.append` / `adminNotes.*`
- **08a（repository contract test）**: 公開 interface 全て + `__tests__/_setup.ts` の `setupD1()`

handoff の **形式約束**:
- 全 repository 関数は第一引数 `DbCtx`（`{ db: D1Database }`）を受け取る
- すべて `Promise<...>` を返す async function
- IO error は throw、business error は `{ ok, reason }` discriminated union（magicTokens.consume）または専用 Error class（syncJobs.IllegalStateTransition）

## 8. `_shared/` 正本所在の合意（02a / 02b と書面化）

| path | 正本 | 02a 利用 | 02b 利用 | 02c 利用 |
| --- | --- | --- | --- | --- |
| `apps/api/src/repository/_shared/db.ts` | **02c** | import のみ | import のみ | 編集権 |
| `apps/api/src/repository/_shared/brand.ts` | **02c** | import のみ | import のみ | 編集権 |
| `apps/api/src/repository/_shared/sql.ts`（必要なら追加） | **02c** | import のみ | import のみ | 編集権 |
| `apps/api/src/repository/__tests__/_setup.ts` | **02c** | import のみ | import のみ | 編集権 |
| `apps/api/src/repository/__fixtures__/*.fixture.ts` | 各タスクが自分の domain fixture を追加 | 02a domain | 02b domain | 02c domain |

合意根拠:
- 02a/02b の Phase 1 / Phase 2 で「`_shared/` は 02c 正本」と記載される予定（並列タスク間の境界仕様）
- 02c が DDL 5 テーブルに加え boundary tooling まで持つため、`_shared/` 配置の中心責務として最も適している

## 9. 4 条件評価（Phase 1 確認）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03a/b / 04c / 05a/b / 07c / 08a の 6 タスクが共通 repository と境界で並列着手可能 |
| 実現性 | PASS | adminNotes / auditLog の write は admin 操作のみ（〜数十/day）、無料枠 100k writes/day 内 |
| 整合性 | PASS | dep-cruiser + ESLint の二重防御、append-only / single-use を API 不在で守る |
| 運用性 | PASS | repository は idempotent、boundary tooling は 02a/02b が即 import 可能、`_shared/` 正本所在が合意済み |

## 10. サブタスク完了確認

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 01a DDL 読込（5 テーブル確認） | completed |
| 2 | 01b zod 読込（4 型確認） | completed |
| 3 | 責務一覧文書化（5 repo + 3 tooling + 1 loader） | completed |
| 4 | 不変条件マッピング表（#5/#6/#11/#12） | completed |
| 5 | AC test 戦略 mapping（AC-1〜AC-11） | completed |
| 6 | handoff interface 抽出（下流 6 タスク向け） | completed |
| 7 | 02a/02b との `_shared` 正本合意 | completed |

## 11. 完了条件チェック

- [x] 主成果物 `outputs/phase-01/main.md` が作成済み
- [x] 不変条件 #5 / #6 / #11 / #12 が「どの tool / file で守るか」表で記述
- [x] AC-1〜AC-11 が test 戦略にマップ済み
- [x] 03a/b / 04c / 05a/b / 07c / 08a 向け handoff interface 一覧が完成
- [x] 02a / 02b との `_shared/` 正本所在が合意済み（書面化）

## 12. 次 Phase 引き継ぎ事項

- 責務一覧 / 公開 interface 文章版 / 不変条件マッピング表 / `_shared` 正本合意
- Phase 2 で module 構造（Mermaid）+ 型 signature + dependency matrix + boundary tooling config 案に変換する
