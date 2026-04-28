# documentation-changelog

## 2026-04-27: 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary（Phase 11 / 12 完了）

### 追加

- `apps/api/src/repository/{adminUsers,adminNotes,auditLog,syncJobs,magicTokens}.ts` — 5 repository、29 unit test PASS
- `apps/api/src/repository/_shared/{db,brand}.ts` — 02a / 02b と共有する正本（DbCtx / branded type）
- `apps/api/src/repository/__tests__/_setup.ts` — in-memory D1 fixture loader（AC-9）
- `apps/api/src/repository/__fixtures__/admin.fixture.ts` — dev fixture（admin_users 1 / notes 2 / audit 5）
- `.dependency-cruiser.cjs` — 5 boundary rule（web→D1 / web→repo / 02a↔02b↔02c cross-domain）
- `scripts/lint-boundaries.mjs` — `pnpm lint` 前段の暫定 boundary 検出（dep-cruiser バイナリ導入までの代替）
- `docs/30-workflows/02c-.../outputs/phase-01〜12/` — 13 phase 仕様の outputs 群

### 影響

- 03a / 03b / 04c / 05a / 05b / 07c / 08a が並列着手可能になった
- 02a / 02b は `apps/api/src/repository/_shared/` と `__tests__/_setup.ts` を 02c から import する（逆方向 import は dep-cruiser cross-domain rule で阻止）

### 不変条件

- **#5**（apps/web から D1 直接アクセス禁止）: `scripts/lint-boundaries.mjs` + `.dependency-cruiser.cjs`（バイナリ導入は 09a 待ち）
- **#6**（GAS prototype を本番昇格させない）: `__fixtures__/` は dev fixture コメント明記、production import path に登場しない
- **#11**（admin は member 本文を直接編集しない）: adminNotes は別テーブル、`member_responses` を repository 層から触らない
- **#12**（adminNotes が public/member view に混ざらない）: adminNotes.ts は `PublicMemberProfile`/`MemberProfile` を import せず、test で確認済

### 共有正本

02c は `apps/api/src/repository/_shared/` および `__tests__/_setup.ts` の **正本管理者**。02a / 02b はここから import 専用。

### 申し送り（次工程で対応）

- dep-cruiser バイナリ導入 + CI gate（09a / Wave 2 統合 PR）
- staging D1 上の S-1〜S-3 / S-8 実環境 smoke（09a）
- `__fixtures__/` の prod build 除外設定（00 foundation / Wave 2 統合）
