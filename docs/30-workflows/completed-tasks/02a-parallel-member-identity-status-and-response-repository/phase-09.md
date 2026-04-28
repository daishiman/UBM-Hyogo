# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 8 (DRY 化) |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | completed |

## 目的

実装が **型安全 / lint クリア / test 100% / 無料枠内 / secret 露出ゼロ / a11y N/A 確認** を満たすかを quantitative に確認する。

## 品質チェック一覧

### 1. 型安全 / lint / test

| # | 項目 | コマンド | 期待 | 失敗時の対応 |
| --- | --- | --- | --- | --- |
| Q-1 | TypeScript | `pnpm --filter apps/api typecheck` | 0 error | brand.ts / row 型を再確認 |
| Q-2 | ESLint | `pnpm --filter apps/api lint` | 0 error / 0 warning | rule 違反を修正 |
| Q-3 | unit test | `pnpm --filter apps/api test repository` | 全 pass、coverage 95%+ | 失敗 test を修正 |
| Q-4 | dep-cruiser | `pnpm depcruise apps/api` | 0 violation | import 構造を修正 |
| Q-5 | bundle size | `pnpm --filter apps/api build && du -sh dist/index.js` | < 1MB | 不要 import を削除 |

### 2. 無料枠見積もり（Cloudflare D1）

| 操作 | 想定頻度 | reads/day | writes/day |
| --- | --- | --- | --- |
| `findMemberById` | 公開詳細 + 管理詳細、約 200/day | 200 | 0 |
| `listMembersByIds` | 一覧 + tag join、約 50 page * 30 ids = 1500/day | 1500 | 0 |
| `findIdentityByEmail` | ログイン時、約 50/day | 50 | 0 |
| `findCurrentResponse` | profile 取得時、約 100/day | 100 | 0 |
| `getStatus` | 全 view 経由、約 500/day | 500 | 0 |
| `setConsentSnapshot`（03b sync 経由） | sync ジョブ 1 回 / hour、50 row 想定 | 0 | 1200 |
| `setPublishState` / `setDeleted` | admin 操作、約 5/day | 0 | 5 |
| **合計（read）** | | **2350 reads/day** | |
| **合計（write）** | | | **1205 writes/day** |
| **無料枠** | | 500,000 reads/day | 100,000 writes/day |
| **使用率** | | **0.47%** | **1.21%** |

無料枠内（< 5%）に余裕あり。

### 3. Secret hygiene

| # | 項目 | 確認 |
| --- | --- | --- |
| S-1 | このタスクで secret 新規導入なし | artifacts.json の `secrets_introduced: []` |
| S-2 | placeholder にも実 secret を書いていない | `git diff` で `KEY=` `BEGIN PRIVATE KEY` を grep |
| S-3 | repository が `process.env.GOOGLE_PRIVATE_KEY` 等を直接読まない | env access は `apps/api/src/env.ts` 経由（未着手なら申し送り） |
| S-4 | test fixture に実会員データ無し | `alice@example.com` 等、明示的にダミー |
| S-5 | wrangler binding 名 `DB` のみ参照、URL / token を含まない | repository code で `https://`, `Bearer` を grep |

### 4. a11y

このタスクは repository 層であり UI を持たないため **N/A**。
ただし view model の型に `ariaLabel` 等を持つフィールドがあれば、04* / 06* で a11y を満たせるよう **mutable に保つ**ことを Phase 12 で申し送る。

### 5. 認可境界（再確認）

| # | 項目 | 確認 |
| --- | --- | --- |
| Z-1 | builder が public / member / admin で異なる戻り値型 | `PublicMemberProfile` / `MemberProfile` / `AdminMemberDetailView` |
| Z-2 | `is_deleted` / `consent != consented` / `publishState != public` の漏れ | builder.test.ts で全 case 検証 |
| Z-3 | `member_field_visibility` の漏れ | builder の sections 組み立てで filter |
| Z-4 | admin 専用 setter（`setPublishState` / `setDeleted`）が public / member context にも露出していない | route 層責務だが、function 名で意図を明示 |

## 実行タスク

1. Q-1〜Q-5 を `outputs/phase-09/main.md` に表で記録
2. 無料枠見積もりを `outputs/phase-09/free-tier.md` に作成
3. Secret hygiene を `outputs/phase-09/secret-hygiene.md` に作成
4. a11y N/A 理由 + 申し送りを main.md に書く
5. 認可境界 Z-1〜Z-4 を main.md に書く

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 runbook.md | sanity check 流用 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 5GB / 500k reads / 100k writes |
| 参考 | CLAUDE.md | secret 管理ルール |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 08a | contract test の覗き口 |
| 09a (staging deploy) | 無料枠見積もりの reality check |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 型安全 | #7 | brand.ts による nominal typing が typecheck で確認 |
| 無料枠 | #10 | reads 0.47% / writes 1.21% で十分余裕 |
| secret hygiene | — | このタスクでは導入なし、placeholder 確認 |
| 認可境界 | #4 #11 #12 | builder の戻り値型と filter |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Q-1〜Q-5 表 | 9 | completed | type/lint/test/dep/bundle |
| 2 | 無料枠見積もり | 9 | completed | reads/writes |
| 3 | secret hygiene | 9 | completed | S-1〜S-5 |
| 4 | a11y N/A | 9 | completed | 申し送り |
| 5 | 認可境界 | 9 | completed | Z-1〜Z-4 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質チェック総括 |
| ドキュメント | outputs/phase-09/free-tier.md | D1 無料枠見積もり |
| ドキュメント | outputs/phase-09/secret-hygiene.md | secret hygiene チェックリスト |

## 完了条件

- [ ] Q-1〜Q-5 全て pass
- [ ] D1 無料枠使用率 < 5%
- [ ] Secret hygiene 5 項目全て OK
- [ ] a11y N/A 理由が明示

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-09/{main,free-tier,secret-hygiene}.md が配置済み
- [ ] artifacts.json の Phase 9 を completed に更新

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ事項: 品質チェック結果 + 無料枠余裕
- ブロック条件: Q-1〜Q-5 のいずれかが fail なら Phase 5/8 に戻る
