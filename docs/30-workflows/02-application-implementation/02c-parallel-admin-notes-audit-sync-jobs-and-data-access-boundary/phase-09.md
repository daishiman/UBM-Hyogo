# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 8 (DRY 化) |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | pending |

## 目的

実装が **型安全 / lint クリア / test 100% / 無料枠内 / secret 露出ゼロ / a11y N/A 確認 / boundary tooling 0 violation** を満たすかを quantitative に確認する。02c は dep-cruiser / ESLint config の正本管理者として、boundary 検証の自動化が中核。

## 品質チェック一覧

### 1. 型安全 / lint / test / boundary

| # | 項目 | コマンド | 期待 | 失敗時の対応 |
| --- | --- | --- | --- | --- |
| Q-1 | TypeScript | `pnpm --filter apps/api typecheck` | 0 error | brand.ts / row 型を再確認 |
| Q-2 | ESLint (apps/api) | `pnpm --filter apps/api lint` | 0 error / 0 warning | rule 違反を修正 |
| Q-3 | ESLint (apps/web) | `pnpm --filter apps/web lint` | 0 error（意図的 violation snippet で error 確認） | rule path を修正 |
| Q-4 | unit test | `pnpm --filter apps/api test repository` | 全 pass、coverage 95%+ | 失敗 test を修正 |
| Q-5 | dep-cruiser | `pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web` | 0 violation | import 構造を修正 |
| Q-6 | bundle size | `pnpm --filter apps/api build && du -sh dist/index.js` | < 1MB | 不要 import を削除 |
| Q-7 | fixture build 除外 | `pnpm --filter apps/api build && ls apps/api/dist/ \| grep -c fixture` | 0 | tsconfig / vitest config を再確認 |

### 2. 無料枠見積もり（Cloudflare D1）

| 操作 | 想定頻度 | reads/day | writes/day |
| --- | --- | --- | --- |
| `adminUsers.findByEmail`（admin gate 経由） | 各 admin リクエスト、約 100/day | 100 | 0 |
| `adminUsers.touchLastSeen` | admin リクエスト後、約 100/day | 0 | 100 |
| `adminNotes.listByMemberId`（admin 詳細） | 約 30/day | 30 | 0 |
| `adminNotes.create / update / remove` | admin 操作、約 10/day | 0 | 10 |
| `auditLog.append`（admin 全操作で記録） | 約 50/day | 0 | 50 |
| `auditLog.listRecent`（admin dashboard） | 約 20/day | 20 | 0 |
| `syncJobs.start / succeed / fail`（cron 経由） | schema 1/day + response 24/day = 25 jobs * 2 (start+end) | 25 | 50 |
| `syncJobs.findLatest / listRecent`（admin dashboard） | 約 20/day | 20 | 0 |
| `magicTokens.issue` | login 試行、約 30/day | 0 | 30 |
| `magicTokens.verify` | login click 時、約 30/day | 30 | 0 |
| `magicTokens.consume` | login click 成功時、約 25/day | 25 | 25 |
| **合計（read）** | | **250 reads/day** | |
| **合計（write）** | | | **265 writes/day** |
| **無料枠** | | 500,000 reads/day | 100,000 writes/day |
| **使用率** | | **0.05%** | **0.27%** |

無料枠内（< 1%）に十分な余裕あり。

### 3. Secret hygiene

| # | 項目 | 確認 |
| --- | --- | --- |
| S-1 | このタスクで secret 新規導入なし | artifacts.json の `secrets_introduced: []` |
| S-2 | placeholder にも実 secret を書いていない | `git diff` で `KEY=` `BEGIN PRIVATE KEY` を grep |
| S-3 | repository が `process.env.MAGIC_LINK_HMAC_KEY` 等を直接読まない | env access は 05b の `apps/api/src/auth/env.ts` 経由（このタスクでは未着手で申し送り） |
| S-4 | test fixture に実会員データ無し | `owner@example.com` 等、明示的にダミー |
| S-5 | wrangler binding 名 `DB` のみ参照、URL / token を含まない | repository code で `https://`, `Bearer` を grep |
| S-6 | `audit_log.metadata` に secret を書く呼び出しが Phase 6 E-5 で警告済み | 04c / 07c の append 呼び出し側責務を申し送り |
| S-7 | `magic_tokens.token` 値を log に出さない | repository code で `console.log` / `logger.info` 直近に `token` を含めない |

### 4. a11y

このタスクは repository + boundary tooling 層であり UI を持たないため **N/A**。
ただし `auditLog.listRecent` の戻り値が admin dashboard（06c）で表示されるため、`metadata` の表示に screen reader 対応が必要となる。06c で a11y を満たせるよう **`metadata.summary` 文字列フィールドを追加可能な構造**（`Record<string, unknown>`）に保つことを Phase 12 で申し送る。

### 5. 認可境界（再確認）

| # | 項目 | 確認 |
| --- | --- | --- |
| Z-1 | adminNotes は member view に絶対に混ざらない | 02a builder の戻り値型に `adminNotes` プロパティ不在、04c のみが渡す |
| Z-2 | apps/web から repository への import 経路がゼロ | dep-cruiser + ESLint で構造防御、Q-3 / Q-5 で確認 |
| Z-3 | auditLog UPDATE/DELETE API 不在 | `auditLog.ts` に該当関数不在、type test で確認 |
| Z-4 | magicTokens の二重 consume が起こらない | 楽観 lock UPDATE で防御、test で確認 |
| Z-5 | syncJobs の不正状態遷移が起こらない | ALLOWED_TRANSITIONS + assertTransition で防御、test で確認 |

### 6. boundary tooling 自己検証

| # | 項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| B-1 | 意図的 violation snippet で dep-cruiser が error を出す | `pnpm depcruise tests/boundary-fixtures/web-import-repo.ts` | error 出力 |
| B-2 | 意図的 violation snippet で ESLint が error を出す | `pnpm --filter apps/web lint tests/boundary-fixtures/web-import-d1.tsx` | error 出力 |
| B-3 | 意図的 cross-domain snippet で dep-cruiser が error を出す | `pnpm depcruise tests/boundary-fixtures/2a-import-2c.ts` | error 出力 |

## 実行タスク

1. Q-1〜Q-7 を `outputs/phase-09/main.md` に表で記録
2. 無料枠見積もりを `outputs/phase-09/free-tier.md` に作成
3. Secret hygiene を `outputs/phase-09/secret-hygiene.md` に作成
4. a11y N/A 理由 + 申し送りを main.md に書く
5. 認可境界 Z-1〜Z-5 を main.md に書く
6. boundary tooling 自己検証 B-1〜B-3 を main.md に書く

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 runbook.md | sanity check 流用 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 5GB / 500k reads / 100k writes |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | Magic Link 仕様 |
| 参考 | CLAUDE.md | secret 管理ルール |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 08a | repository contract test の覗き口 |
| 09a (staging deploy) | 無料枠見積もりの reality check |
| 09b (cron / monitoring) | sync_jobs の実頻度と本見積もりの照合 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 型安全 | — | brand.ts による nominal typing が typecheck で確認 |
| 無料枠 | — | reads 0.05% / writes 0.27% で十分余裕 |
| secret hygiene | — | このタスクでは導入なし、placeholder 確認、metadata 警告は申し送り |
| 認可境界 | #5 #11 #12 | Z-1〜Z-5 が builder / boundary tooling / API 不在で守られる |
| boundary tooling | #5 | B-1〜B-3 で意図的 violation が確実に検出 |
| GAS 昇格防止 | #6 | Q-7 で fixture が build から除外 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Q-1〜Q-7 表 | 9 | pending | type/lint/test/dep/bundle/fixture |
| 2 | 無料枠見積もり | 9 | pending | reads/writes |
| 3 | secret hygiene | 9 | pending | S-1〜S-7 |
| 4 | a11y N/A | 9 | pending | metadata 申し送り |
| 5 | 認可境界 | 9 | pending | Z-1〜Z-5 |
| 6 | boundary tooling 自己検証 | 9 | pending | B-1〜B-3 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質チェック総括 + 認可境界 + boundary 自己検証 |
| ドキュメント | outputs/phase-09/free-tier.md | D1 無料枠見積もり |
| ドキュメント | outputs/phase-09/secret-hygiene.md | secret hygiene チェックリスト |

## 完了条件

- [ ] Q-1〜Q-7 全て pass
- [ ] D1 無料枠使用率 < 1%
- [ ] Secret hygiene 7 項目全て OK
- [ ] a11y N/A 理由が明示
- [ ] boundary tooling 自己検証 3 項目 OK

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が completed
- [ ] outputs/phase-09/{main,free-tier,secret-hygiene}.md が配置済み
- [ ] artifacts.json の Phase 9 を completed に更新

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ事項: 品質チェック結果 + 無料枠余裕 + boundary tooling 自己検証
- ブロック条件: Q-1〜Q-7 のいずれかが fail なら Phase 5 / 8 に戻る
