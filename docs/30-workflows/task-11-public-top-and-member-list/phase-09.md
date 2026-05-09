# Phase 9: 品質保証（local PASS 5 点セット）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

local 環境で typecheck / lint / unit test / build / grep gate の 5 点を pass させ、Phase 11 の runtime evidence 取得前の boundary を固める。

## 実行タスク

- [ ] local PASS 5 点を取得し evidence path に保存する
- [ ] grep gate が exit 0 を返すことを確認する

## 参照資料

- `.claude/skills/task-specification-creator/references/quality-gates.md` §local PASS 5 点

## 成果物

- `outputs/phase-09/main.md`

## 統合テスト連携

- local PASS 5 点を Phase 11 evidence の前提として実行する。
- Playwright `--list` と skip grep を runtime smoke の実行可能性 gate とする。

## local PASS 5 点

| # | gate | コマンド | evidence path |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.log` |
| 2 | lint | `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.log` |
| 3 | unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test src/components/public src/lib/url src/lib/api/public` | `outputs/phase-11/evidence/test.log` |
| 4 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | `outputs/phase-11/evidence/build.log` |
| 5 | grep gate | 下記 7 コマンド連結 | `outputs/phase-11/evidence/grep-gate.log` |

### grep gate 仕様

```bash
# (1) HEX 直書き禁止（task-18 verify-design-tokens 整合）
! rg -n '#[0-9a-fA-F]{3,8}' \
    apps/web/src/components/public \
    apps/web/app/page.tsx \
    'apps/web/app/(public)'

# (2) bg-[# / text-[# 直書き禁止
! rg -n 'bg-\[#|text-\[#' \
    apps/web/src/components/public \
    apps/web/app/page.tsx \
    'apps/web/app/(public)'

# (3) D1 直接アクセス禁止（不変条件 #5）
! rg -n 'D1Database|@cloudflare/workers-types' apps/web/src apps/web/app

# (4) Sentry SDK 直 import 禁止（task-04 logger 経由のみ）
! rg -n 'from "@sentry/' apps/web/src/components/public apps/web/app/page.tsx 'apps/web/app/(public)'

# (5) process.env 直参照禁止（test runner / playwright config を除く）
rg -n 'process\.env\.' \
    apps/web/src/components/public \
    apps/web/app/page.tsx \
    'apps/web/app/(public)' \
    apps/web/src/lib/api \
  | (! grep . )

# (6) Playwright skip 禁止
! rg -n 'test\.describe\.skip|test\.skip\(true|it\.skip' apps/web/playwright/tests/public-top-and-list.spec.ts

# (7) revalidate 明記の存在
rg -n 'revalidate\s*=\s*60' apps/web/app/page.tsx
rg -n 'revalidate\s*=\s*30' 'apps/web/app/(public)/members/page.tsx'
```

すべて exit 0 を期待。

## 単体テストカバレッジ

- `lib/url/members-search.ts` Statement / Branch ≥ 95%
- `lib/api/public.ts` Statement / Branch ≥ 90%
- `components/public/{Hero,Stats,MemberCard}.tsx` Statement ≥ 85%

`pnpm --filter @ubm-hyogo/web test --coverage` 結果を `outputs/phase-11/evidence/coverage.txt` に保存。

## E2E spec の `--list` 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-top-and-list.spec.ts --list
```

5 ケース（TC-E-01〜05）が列挙されることを確認。

## 完了条件

- [ ] local PASS 5 点（typecheck / lint / unit test / build / grep gate）が全て exit 0
- [ ] coverage 目標達成（`coverage.txt` に記録）
- [ ] Playwright spec が `--list` で 5 ケース列挙する
- [ ] `coverage/e2e/coverage-summary.json` の lines pct が 80% 以上（Phase 11 の runtime 実行で確定）
