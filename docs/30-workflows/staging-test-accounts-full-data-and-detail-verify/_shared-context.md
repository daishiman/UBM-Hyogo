# _shared-context.md — SubAgent 共有 SSOT

> Phase 4-13 を執筆する全 SubAgent はこのファイルを最初に読むこと。本ファイルと `index.md` / `outputs/phase-1..3/*.md`（設計確定済）に矛盾する記述をしてはならない。

## タスク要約

- **Task ID**: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001
- **実装区分**: 実装仕様書（local code / seed / focused tests 実装済み）
- **canonical_root**: `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify`
- **visualEvidence**: VISUAL_ON_EXECUTION（staging apply / screenshot は user-gated。PNG 0）
- **真因**: TEST-MEM-06 等の seed `profile` が空で、seed が `member_field_visibility` を投入していなかったため publicSections が空になり得た。公開詳細 adapter は既存構造で全 public 項目を扱える。

## ユーザー判断（不可侵）

1. **公開詳細ページは visibility=public 項目のみ表示（現状維持）**。member/admin 項目（birthDate/ubmJoinDate/challenges/publicConsent/rulesConsent）は公開ページ非表示。データは投入する。
2. **全テストアカウント TEST-MEM-01..10 を全 31 stable_key で埋める**。

## 3 レーン

| レーン | 対象 | 内容 |
|--------|------|------|
| Lane A（主） | apps/api | 完了: `catalog.ts` の per-member `profile` 拡充 + 全31 `response_fields` / `member_field_visibility` 生成 + seed 生成物再生成 + focused tests |
| Lane B | apps/web | 完了: 公開詳細ページadapterの全 public 項目描画を fixture/spec で検証。production adapter/components は変更不要 |
| Lane C | scripts | staging 適用手順 + 目視確認（user-gated 実行） |

## 表示バリエーション・マトリクス（Lane A 正本）

| key | 充填 | 公開掲載 |
|-----|------|:---:|
| TEST-MEM-01 | フル | ✅ |
| TEST-MEM-02 | フル | ✗(member_only) |
| TEST-MEM-03 | フル | ✗(hidden) |
| TEST-MEM-04 | 中 | ✗(member_only/login不可) |
| TEST-MEM-05 | 中 | ✗(deleted) |
| TEST-MEM-06 | **フル**（ユーザー目視対象） | ✅ |
| TEST-MEM-07 | フル+タグ多数 | ✅ |
| TEST-MEM-08 | 中 | ✗(member_only/login不可) |
| TEST-MEM-09 | **全項目入力 + 本人写真** | ✅ |
| TEST-MEM-10 | **エッジ**（長文/絵文字/全URL） | ✅ |

## 不変条件（必ず全 Phase で遵守記述）

1. D1 直接アクセスは apps/api に閉じる。
2. 新規 test は `*.spec.{ts,tsx}` のみ。
3. 新規 D1 schema / migration / API endpoint / Form schema 変更なし（既存 surface のみ）。
4. consent キー `publicConsent`/`rulesConsent`。`responseEmail` は system field。
5. OKLch トークンのみ・HEX 直書き禁止・新規 primitive 禁止（Lane B）。
6. visibility=public 二重防御維持。member/admin 項目を公開ページに漏らさない。
7. stableKey は `STABLE_KEY` 定数経由。
8. production seed apply は CLI で禁止。

## 主要ファイル（実コードベース実在）

- `apps/api/src/testing/test-accounts/catalog.ts`（SSOT・TEST-MEM-01..10 定義 L89-274）
- `apps/api/src/testing/test-accounts/build-seed-sql.ts`（生成 L103-256）
- `apps/api/migrations/seed/test-accounts-seed.sql`（生成物）
- `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` / `build-seed-sql.spec.ts`
- `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts`
- `apps/web/src/lib/adapters/member-detail.ts`（公開詳細 adapter L1-300）
- `apps/web/src/components/public/{ProfileHero,BusinessOverviewSection,PersonalSection,MessageCard,MemberDetail,MemberLinks,MemberTags,MemberActivity,MemberDetailSections}.tsx`
- `apps/web/src/fixtures/public-member-profile.ts`
- `packages/shared/src/zod/field.ts`（`STABLE_KEY` 31 種）
- `scripts/seed-test-accounts.sh` / `scripts/gen-test-accounts-seed.mjs`

## 検証コマンド（DoD）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
node --import tsx scripts/gen-test-accounts-seed.mjs   # 生成物再生成（drift guard）
pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts
pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
pnpm exec vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts --config=vitest.config.ts
bash scripts/verify-pr-ready.sh
# user-gated:
scripts/seed-test-accounts.sh --env staging --action apply
```

## Phase ファイル規約

- 各 Phase は `outputs/phase-N/phase-N.md`。
- Phase 12 strict 7: `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`。
- Phase 11: `phase-11.md` + `manual-test-result.md`（VISUAL。staging screenshot は user-gated pending）。
- 各 Phase に「変更ファイル・関数/データ構造・入出力・テスト・実行コマンド・DoD」を記録する（CONST_005）。
