# 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| ディレクトリ | doc/02-application-implementation/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | data / api / platform |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

管理者ドメインの D1 repository（`admin_users` / `admin_member_notes` / `audit_log` / `sync_jobs` / `magic_tokens`）を `apps/api/src/repository/` 配下に実装し、**同 Wave 全体（02a/02b/02c）の data access 境界**（`apps/web` → D1 直接禁止 ESLint rule、dependency-cruiser 全体 config、in-memory D1 fixture loader、`_shared/db.ts` 共有 source）を確定する。`admin_member_notes` は **public/member view model に絶対に混ざらない** ことを構造で守る。

## スコープ

### 含む

- `apps/api/src/repository/adminUsers.ts` — `admin_users` の read（role / email lookup）
- `apps/api/src/repository/adminNotes.ts` — `admin_member_notes` の CRUD（admin context 専用、member view model に **混ぜない**）
- `apps/api/src/repository/auditLog.ts` — `audit_log` の append-only insert / list（読み取りは admin のみ）
- `apps/api/src/repository/syncJobs.ts` — `sync_jobs` の lifecycle（running/succeeded/failed）、cron / 手動から呼ばれる
- `apps/api/src/repository/magicTokens.ts` — `magic_tokens` の発行 / 検証 / consume（OTP / Magic Link 用、05b と接続）
- `apps/api/src/repository/_shared/db.ts` — DbCtx 型 + binding wrap（02a/02b と共有 source の **正本**）
- `apps/api/src/repository/_shared/brand.ts` — `MemberId` / `ResponseId` / `StableKey` / `AdminEmail` 等の branded type
- `apps/api/src/repository/__tests__/_setup.ts` — in-memory D1 fixture loader（02a/02b が import）
- `.dependency-cruiser.cjs` — `apps/web` → `apps/api/src/repository/` 直接 import を禁止する rule
- ESLint plugin/config — `apps/web` 側で D1 binding 直接 import を禁止
- prototype data.jsx 相当の最小 fixture seeder（admin_users 1 件、admin_notes 2 件、audit_log 5 件）

### 含まない

- members / identities / status / responses / tags（02a）
- meetings / attendance / tag_queue / schema_diff_queue（02b）
- HTTP endpoint 実装（04c）
- Auth.js provider（05a / 05b）
- Cron trigger 実装（09b）
- audit_log を取得する admin UI（06c）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-d1-database-schema-migrations-and-tag-seed | D1 schema / migration |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | view model / branded type |
| 下流 | 03a / 03b | sync_jobs を呼ぶ |
| 下流 | 04c | adminNotes / auditLog / adminUsers を呼ぶ |
| 下流 | 05a / 05b | adminUsers (gate) / magicTokens を呼ぶ |
| 下流 | 07c | adminNotes / auditLog を呼ぶ |
| 下流 | 08a | repository contract test |
| 並列 | 02a / 02b | 同 Wave、`_shared/` 共有点を本タスクが正本管理 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | 認証 / admin gate |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | DDL / index / 整合 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 機能仕様 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 / Magic Link |
| 参考 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2c 詳細 |
| 参考 | doc/02-application-implementation/02a-... | builder の `adminNotes` 引数 |
| 参考 | doc/02-application-implementation/02b-... | sync_jobs を呼ぶ schema sync |

## 受入条件 (AC)

- AC-1: `apps/api/src/repository/{adminUsers,adminNotes,auditLog,syncJobs,magicTokens}.ts` 5 ファイルが存在し unit test pass
- AC-2: `adminNotes` は `PublicMemberProfile` / `MemberProfile` view model に **絶対に混ざらない**（builder 経路に存在しない unit test、不変条件 #12）
- AC-3: `apps/web/**` から `apps/api/src/repository/**` を import すると **ESLint error** になる test pass（不変条件 #5）
- AC-4: `apps/web/**` から `@cloudflare/workers-types` の D1Database を直接 import すると ESLint error（不変条件 #5）
- AC-5: dependency-cruiser が 02a / 02b / 02c の境界を強制し、`apps/web` → repository 経路を 0 violation で検出
- AC-6: `auditLog.append()` が **append-only**（UPDATE / DELETE API 不在）で、admin email / action / target / timestamp / metadata を記録
- AC-7: `magicTokens.consume()` が **single use**（一度 consume したら再利用不可、`used_at` 設定で阻止）
- AC-8: `syncJobs.start/succeed/fail()` が status transition 一方向（`running → succeeded/failed`、逆禁止）
- AC-9: in-memory D1 fixture loader が 02a / 02b / 02c の test から共通利用可能（`__tests__/_setup.ts` の signature 統一）
- AC-10: prototype data.jsx 相当の seed が **本番 admin 仕様への昇格を引き起こさない**（不変条件 #6、コメントと scope 明記）
- AC-11: 02a / 02b と相互 import がゼロ（`_shared/` の export のみ片方向）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/{main,module-map,dependency-matrix}.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/{main,verify-suite}.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/{main,runbook}.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/{main,failure-cases}.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/{main,ac-matrix}.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/{main,free-tier,secret-hygiene}.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/{main,manual-evidence}.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/* 6 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/* 4 種 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | phase-01.md 〜 phase-13.md | 13 phase 別仕様 |
| メタ | artifacts.json | 機械可読サマリー |
| ドキュメント | outputs/phase-02/module-map.md | 5 repo + boundary tooling の関係 |
| ドキュメント | outputs/phase-04/verify-suite.md | unit + boundary test |
| ドキュメント | outputs/phase-05/runbook.md | 実装 step + dep-cruiser config + ESLint rule placeholder |
| ドキュメント | outputs/phase-12/implementation-guide.md | 03a/b / 04c / 05a/b / 07c / 08a 向け guide |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | repository アクセス先 | 5GB / 500k reads/day |
| vitest | unit test runner | OSS |
| miniflare D1 | in-memory test | OSS |
| dependency-cruiser | apps/web ↔ apps/api boundary 検出 | OSS |
| ESLint (no-restricted-imports) | apps/web の D1 import 禁止 | OSS |

## Secrets 一覧（このタスクで導入）

なし（このタスクでは secret を新規導入しない。Magic Link の HMAC key 等は 05b で別途導入予定）。

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | dependency-cruiser config + ESLint no-restricted-imports rule で構造で守る |
| 6 | GAS prototype を本番バックエンド仕様に昇格させない | seed/fixture は最小限、data.jsx 相当はあくまで dev fixture と明記 |
| 11 | 管理者は他人プロフィール本文を直接編集できない | adminNotes は別テーブル、本文 `member_responses` には触れない |
| 12 | admin_member_notes は public/member view model に混ざらない | builder 経路に adminNotes を入れない、04a/04b の view 組み立てで参照不能 |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-11 が Phase 7 / 10 で完全トレースされる
- 4 条件 PASS
- Phase 12 implementation-guide が 03a/b / 04c / 05a/b / 07c / 08a の入り口になっている
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- 並列タスク: ../02a-... , ../02b-...
