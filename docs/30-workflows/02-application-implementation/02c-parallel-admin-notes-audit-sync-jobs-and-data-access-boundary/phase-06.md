# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 5 (実装ランブック) |
| 下流 | Phase 7 (AC マトリクス) |
| 状態 | pending |

## 目的

repository 層と boundary tooling の異常系を「**D1 由来失敗 / 認可境界違反 / sync ジョブ事故 / boundary 構造違反**」の 4 軸で洗い、Phase 5 runbook の placeholder で対処済みかを確認する。`admin_member_notes` の view 漏洩、`audit_log` への UPDATE 試行、`magic_tokens` の二重 consume、`sync_jobs` の不正状態遷移、`apps/web` からの D1 import 等、不変条件 #5 / #6 / #11 / #12 を破る経路を網羅的に挙げる。

## failure cases

### 軸 1: D1 由来失敗

| ID | ケース | 期待 repository 動作 | 期待エラー shape |
| --- | --- | --- | --- |
| F-1 | `admin_users` に存在しない `email` を `findByEmail` | `null` 返却（throw しない） | 05a admin gate で 403 に変換 |
| F-2 | `admin_member_notes` に存在しない `id` を `update` | UPDATE rowcount=0、warning log、`null` ではなく明示エラー | 04c で 404 に変換 |
| F-3 | `audit_log.append` で D1 接続失敗（5xx） | repository は throw、呼び出し側（04c / 07c）で catch | `D1Error` chain 保持 |
| F-4 | `sync_jobs` の `result` カラムに巨大 JSON（> 100KB）を保存 | 保存は成功するが warning、Phase 9 でカラムサイズ監視 | 例外なし |
| F-5 | `magic_tokens` の `expires_at` が SQLite TEXT で TZ なし | ISO8601 UTC 固定、parse 失敗で throw `InvalidExpiresAt` | sync 時の偏り検知 |
| F-6 | `admin_member_notes.body` に空文字 | `create` 時に validation で reject（zod 経由）、repository 側は素通し | 04c で 422 |

### 軸 2: 認可境界違反（不変条件）

| ID | ケース | 期待動作 | 守る不変条件 |
| --- | --- | --- | --- |
| A-1 | `apps/web/page.tsx` から `import { findByEmail } from "@apps/api/src/repository/adminUsers"` | dep-cruiser で `no-web-to-d1-repository` violation、ESLint で red squiggle | #5 |
| A-2 | `apps/web/page.tsx` から `import { D1Database } from "@cloudflare/workers-types"` | ESLint `no-restricted-imports` で error | #5 |
| A-3 | `02a/responses.ts` から `02c/auditLog.ts` を import | dep-cruiser `repo-no-cross-domain-2a-to-2c`（同等 rule）で violation | 02a/02b/02c の独立性 |
| A-4 | `adminNotes` を `PublicMemberProfile` / `MemberProfile` 型に注入試行 | 02a builder の戻り値型が `Omit<..., 'adminNotes'>`、TS コンパイルエラー | #12 |
| A-5 | admin context が `member_responses` 本文を partial update 試行 | `responses.ts`（02a）に partial update API なし、構造で防ぐ | #4 / #11 |
| A-6 | viewer role が `auditLog.append` を呼ぶ | repository は素通し（route 層責務）、04c で 403 | #11 |
| A-7 | admin context が `adminNotes` を **member view への merge を builder 経路で要求** | 02a builder の signature に adminNotes 引数なし、構造で阻止 | #12 |

### 軸 3: append-only / single-use / 状態遷移 違反

| ID | ケース | 期待動作 | 守るルール |
| --- | --- | --- | --- |
| AP-1 | `audit_log` に対して `update(id, ...)` を呼ぶ | `auditLog.ts` に `update` 関数が存在しない、TS コンパイルエラー | append-only |
| AP-2 | `audit_log` に対して `remove(id)` を呼ぶ | `auditLog.ts` に `remove` 関数が存在しない、TS コンパイルエラー | append-only |
| AP-3 | 同一 `magic_tokens.token` を 2 回 `consume` | 2 回目は `{ ok: false, reason: "already_used" }` | single-use |
| AP-4 | expired 後の token を `consume` | `{ ok: false, reason: "expired" }` | single-use + TTL |
| AP-5 | 並行 2 リクエストで同一 token を `consume` | UPDATE の `WHERE used_at IS NULL` 条件で 1 件のみ成功、もう一方は `already_used` | 楽観 lock |
| AP-6 | `succeeded` 状態の `sync_jobs` に対して `succeed` を呼ぶ | `IllegalStateTransition("succeeded","succeeded")` throw | 状態一方向 |
| AP-7 | `succeeded` 状態の `sync_jobs` に対して `fail` を呼ぶ | `IllegalStateTransition("succeeded","failed")` throw | 状態一方向 |
| AP-8 | `failed` → `running` への巻き戻し | API 不在、TS コンパイルエラー | 状態一方向 |

### 軸 4: 起こりうる事故

| ID | ケース | 期待動作 |
| --- | --- | --- |
| E-1 | `adminEmail("plain string")` を `findByEmail` 引数に直接渡す | TS コンパイルエラー（`AdminEmail` brand 必須） |
| E-2 | `magicTokens.consume("raw_string", at)` で raw string | TS コンパイルエラー（`MagicTokenValue` brand 必須） |
| E-3 | seed `data.jsx` 由来の fixture が **prod build に混入** | `__fixtures__/` が `vitest` 経由でのみ読み込まれ、`apps/api/dist/` から除外 |
| E-4 | `admin_member_notes` を 02a の builder 引数経由で渡し忘れ | builder は `adminNotes?: AdminMemberNoteRow[]` を受け取る、ない場合は section に出ない（04c のみ渡す） |
| E-5 | `audit_log.metadata` に PII 本文を含める | repository は素通し、04c / 07c の append 呼び出し側で **何を載せるか** を判断 |

## 異常系 → runbook 対処マッピング

| ID | runbook での対処 step | 実装 placeholder の該当箇所 |
| --- | --- | --- |
| F-1 | Step 3 `findByEmail` の `null` 返却 | adminUsers.ts |
| F-2 | Step 3 `update` 後の `loadById` で確認 | adminNotes.ts |
| F-3 | Step 4 append は throw、route 層 catch | auditLog.ts |
| F-4 | Step 5 `result` の JSON.stringify に上限なし、Phase 9 監視 | syncJobs.ts |
| F-5 | Step 6 `expiresAt` を ISO8601 UTC 固定 | magicTokens.ts |
| F-6 | 04c の zod validation 任せ、repository 素通し | 04c へ申し送り |
| A-1, A-2 | Step 9 ESLint config | apps/web/eslint.config.js |
| A-3 | Step 8 dep-cruiser cross-domain rule | .dependency-cruiser.cjs |
| A-4 | 02a builder の戻り値型に `adminNotes` 不在 | 02a Phase 2 と整合 |
| A-5 | `responses.ts`（02a）に partial update API なし | 02a 構造で守る |
| A-6 | route 層責務、04c で role check | 04c へ申し送り |
| A-7 | 02a builder signature 確定 | 02a Phase 2 と整合 |
| AP-1, AP-2 | Step 4 `auditLog.ts` に UPDATE/DELETE 関数を作らない | auditLog.ts |
| AP-3, AP-4, AP-5 | Step 6 `consume` の楽観 lock UPDATE | magicTokens.ts |
| AP-6, AP-7, AP-8 | Step 5 ALLOWED_TRANSITIONS + assertTransition | syncJobs.ts |
| E-1, E-2 | Step 2 brand.ts | _shared/brand.ts |
| E-3 | Step 1 `__fixtures__/` を vitest 専用、build 除外 | tsconfig / vitest config |
| E-4 | 02a builder で `adminNotes` 引数を optional 化、04c でのみ渡す | 02a + 04c 整合 |
| E-5 | `metadata` の中身選定は append 呼び出し側責務 | 04c / 07c へ申し送り |

## 実行タスク

1. failure case 表 4 軸を `outputs/phase-06/failure-cases.md` に作成
2. runbook 対処マッピング表を `outputs/phase-06/main.md` に作成
3. AP 系（append-only / single-use / 状態遷移）の構造防御を再確認
4. 04c / 07c へ申し送る項目（F-6 / A-6 / E-5）を抽出

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 outputs/phase-05/runbook.md | 対処 step 参照 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | OTP / Magic Link 異常系 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 操作の認可 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証の TTL / 再発行 |
| 参考 | 02a / 02b の同 phase | 並列タスクの異常系整合 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC matrix の検証列に追加 |
| Phase 8 | 共通エラー shape を DRY 化候補に |
| 04c / 05a / 05b / 07c / 08a | API 層 validation の入力 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | A-1 / A-2 / A-3 が dep-cruiser + ESLint で構造防御 |
| GAS prototype 昇格防止 | #6 | E-3 が build 除外で防御 |
| admin 本文編集禁止 | #11 | A-5 / A-6 が API 不在 + role check で防御 |
| view model 分離 | #12 | A-4 / A-7 が builder signature と TS 型で防御 |
| append-only | — | AP-1 / AP-2 が API 不在で防御 |
| single-use | — | AP-3 / AP-4 / AP-5 が 楽観 lock で防御 |
| 状態遷移 | — | AP-6 / AP-7 / AP-8 が ALLOWED_TRANSITIONS + assertTransition |
| 型混同 | — | E-1 / E-2 が brand.ts で防御 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-1〜F-6 文書化 | 6 | pending | D1 由来 |
| 2 | A-1〜A-7 文書化 | 6 | pending | 認可境界 |
| 3 | AP-1〜AP-8 文書化 | 6 | pending | append-only / single-use / 状態遷移 |
| 4 | E-1〜E-5 文書化 | 6 | pending | 起こりうる事故 |
| 5 | runbook 対処マップ | 6 | pending | 26 ケース |
| 6 | 下流タスク 申し送り | 6 | pending | 04c / 05a / 05b / 07c |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | runbook 対処マップ + 申し送り |
| ドキュメント | outputs/phase-06/failure-cases.md | F/A/AP/E ケース全 26 |

## 完了条件

- [ ] F/A/AP/E 計 26 ケースが文書化
- [ ] 各ケースに対処 step or 「構造で防ぐ」が明記
- [ ] 04c / 05a / 05b / 07c へ申し送り抽出
- [ ] 不変条件 #5 / #6 / #11 / #12 すべてに対応 case あり

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-06/{main,failure-cases}.md が配置済み
- [ ] 不変条件 #5 / #6 / #11 / #12 全てに対応 case
- [ ] artifacts.json の Phase 6 を completed に更新

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ事項: failure case 26 件 + runbook 対処マップ + 下流申し送り
- ブロック条件: 不変条件 4 件のいずれかに対応 case が無い場合 Phase 7 に進めない
