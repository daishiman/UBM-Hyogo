# Phase 11 main — 手動 smoke 実行手順 + evidence 配置規約

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 状態 | scaffolded（実 screenshot 未取得） |
| 実行予定 | 上流 wave 6/7 マージ完了後の local 起動下 |
| 作成日 | 2026-04-30 |

## 現状ステータス

> **重要**: 本 Phase の本タスク（08b spec_created）では、実ブラウザ起動・Playwright 実行・screenshot 撮影は **行わない**。
>
> 理由:
> 1. 上流 UI（公開導線 / login / profile / admin / search / density / attendance）が完全 green である前提が未充足
> 2. `wrangler dev`（apps/api）+ `next dev`（apps/web）+ local D1 seed の同時稼働が必要
> 3. evidence の捏造は不変条件違反（spec_created 境界）
>
> よって本 Phase では **実行手順 + 期待 evidence 一覧 + プレースホルダ** を整備し、後続実装 task / 09a が同手順で実行する。

## evidence 取得トリガ

| トリガ条件 | 実行者 |
| --- | --- |
| 上流 wave 6（公開 + auth + profile UI）完全 green | 後続実装 task |
| 上流 wave 7（admin + search + density + attendance UI）完全 green | 後続実装 task |
| 09a staging deploy 直前 | 後続実装 task |

## 実行手順サマリ（詳細は phase-11.md 参照）

### Step 0: 前提

```bash
mise install
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium webkit
op signin
```

### Step 1: D1 local seed

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --local \
  --file=apps/api/test/fixtures/seed-e2e.sql
```

### Step 2: Workers / Web 起動（別ターミナル）

```bash
# Terminal 1
bash scripts/cf.sh dev --config apps/api/wrangler.toml --local
# → http://localhost:8787

# Terminal 2
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000
```

### Step 3: 7 シナリオ + a11y を一括実行

```bash
# Terminal 3
EVIDENCE_DIR=docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence

mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=desktop-chromium --project=mobile-webkit \
  --reporter=html,list \
  2>&1 | tee "$EVIDENCE_DIR/run.log"
```

### Step 4: HTML report と axe report を evidence へ書き出し

```bash
# HTML report
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright show-report \
  "$EVIDENCE_DIR/playwright-report"

# axe-report.json は test 内で writeFileSync('outputs/phase-11/evidence/axe-report.json', ...)
```

### Step 5: CI workflow yml の copy

```bash
yamllint .github/workflows/e2e-tests.yml
cp .github/workflows/e2e-tests.yml "$EVIDENCE_DIR/ci-workflow.yml"
```

## 取得予定 screenshot 全リスト（44 枚）

> 命名規約: `{viewport}/{screen}-{state}.png`（state 省略可）
> AC 紐付け詳細は `outputs/phase-07/ac-matrix.md` を正本とする。

### desktop（29 枚）

| # | filename | spec | AC | invariant |
| --- | --- | --- | --- | --- |
| D-01 | `landing.png` | public | AC-1, AC-2 | — |
| D-02 | `members-list.png` | public | AC-1, AC-2 | — |
| D-03 | `members-detail.png` | public | AC-1, AC-2 | — |
| D-04 | `register.png` | public | AC-1, AC-2 | — |
| D-05 | `login-input.png` | login | AC-3 | #9 |
| D-06 | `login-sent.png` | login | AC-3 | #9 |
| D-07 | `login-unregistered.png` | login | AC-3 | #9 |
| D-08 | `login-rules-declined.png` | login | AC-3 | #9 |
| D-09 | `login-deleted.png` | login | AC-3 | #7, #9 |
| D-10 | `profile.png` | profile | AC-1, AC-4 | #4 |
| D-11 | `profile-after-reload.png` | profile | AC-4 | #8 |
| D-12 | `profile-edit-response-url.png` | profile | AC-4 | #4 |
| D-13 | `admin-dashboard.png` | admin | AC-1, AC-5 | #5 |
| D-14 | `admin-members.png` | admin | AC-1, AC-5 | #5 |
| D-15 | `admin-tags.png` | admin | AC-5 | #5 |
| D-16 | `admin-schema.png` | admin | AC-5 | #5 |
| D-17 | `admin-meetings.png` | admin | AC-5 | #5 |
| D-18 | `admin-forbidden-member.png` | admin | AC-5 | #5 |
| D-19 | `admin-redirect-login.png` | admin | AC-5 | #5 |
| D-20 | `search-q.png` | search | AC-6 | — |
| D-21 | `search-zone-status.png` | search | AC-6 | — |
| D-22 | `search-tag.png` | search | AC-6 | — |
| D-23 | `search-sort.png` | search | AC-6 | — |
| D-24 | `search-combo.png` | search | AC-6 | — |
| D-25 | `density-comfy.png` | density | AC-6, AC-7 | — |
| D-26 | `density-dense.png` | density | AC-6, AC-7 | — |
| D-27 | `density-list.png` | density | AC-6, AC-7 | — |
| D-28 | `attendance-dup-toast.png` | attendance | AC-5 | #15 |
| D-29 | `attendance-deleted-excluded.png` | attendance | AC-5 | #15, #7 |

### mobile（15 枚）

| # | filename | spec | AC | invariant |
| --- | --- | --- | --- | --- |
| M-01 | `landing.png` | public | AC-2, AC-7 | — |
| M-02 | `members-list.png` | public | AC-2, AC-7 | — |
| M-03 | `members-detail.png` | public | AC-2, AC-7 | — |
| M-04 | `register.png` | public | AC-2, AC-7 | — |
| M-05 | `login-input.png` | login | AC-3, AC-7 | #9 |
| M-06 | `login-sent.png` | login | AC-3, AC-7 | #9 |
| M-07 | `login-unregistered.png` | login | AC-3, AC-7 | #9 |
| M-08 | `login-rules-declined.png` | login | AC-3, AC-7 | #9 |
| M-09 | `login-deleted.png` | login | AC-3, AC-7 | #7, #9 |
| M-10 | `profile.png` | profile | AC-4, AC-7 | #4 |
| M-11 | `admin-dashboard.png` | admin | AC-5, AC-7 | #5 |
| M-12 | `admin-members.png` | admin | AC-5, AC-7 | #5 |
| M-13 | `admin-tags.png` | admin | AC-5, AC-7 | #5 |
| M-14 | `admin-schema.png` | admin | AC-5, AC-7 | #5 |
| M-15 | `admin-meetings.png` | admin | AC-5, AC-7 | #5 |

→ 合計 **44 枚**（AC-7「30 枚以上」充足）

## axe-report.json 取得手順

`@axe-core/playwright` の `AxeBuilder` を 14 path（desktop 8 + mobile 6）で実行し、各 path の `violations` を集約する。

```ts
// tests/e2e/helpers/runAxe.ts（実装は wave 7 で生成）
const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();
expect(accessibilityScanResults.violations).toEqual([]);
```

集約 JSON は `outputs/phase-11/evidence/axe-report.json` へ。期待: `violations` 全 path で `[]`、`status: "ok"`、`expected_violations: 0`。

## playwright-report HTML 出力先

```
outputs/phase-11/evidence/playwright-report/
├── index.html
├── data/
│   └── *.json
└── trace/
    └── *.zip
```

artifact upload 規約: GitHub Actions で `actions/upload-artifact@v4` を使用、retention 14 日、サイズ上限 10MB（無料枠）。

## pass / fail 判定欄（実行時記入）

| シナリオ | 期待 | desktop | mobile | 備考 |
| --- | --- | --- | --- | --- |
| 1 公開導線 | 4 ステップ pass | TBD | TBD | screenshot 4 枚 / viewport |
| 2 login 5 状態 + /no-access 404 | 10 + 1 pass | TBD | TBD | 不変条件 #9 |
| 3 profile (#4 + #8 + editResponseUrl) | 3 ケース pass | TBD | TBD | popup 観測 |
| 4 admin 5 × 認可 3 | 30 ケース pass | TBD | TBD | adminPage / memberPage / anon |
| 5 search 6 パラメータ | 5 ケース pass | TBD | — | desktop only |
| 6 density 3 値 | 3 mode pass | TBD | — | desktop only |
| 7 attendance dup + 削除済み | 2 ケース pass | TBD | — | 不変条件 #15 |
| 8 a11y violations = [] | 14 path 0 件 | TBD | TBD | WCAG 2.1 AA |
| 9 yml validate | OK | TBD | — | yamllint |

## ブロック条件（後続実行時）

- 1 シナリオでも fail → Phase 5 戻し
- a11y violation 1 件以上（critical/serious） → Phase 5 戻し
- screenshot 30 枚未達 → Phase 4 verify-matrix 再見直し

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/phase-11.md`（正本）
- `outputs/phase-04/verify-matrix.md`（45 verify row）
- `outputs/phase-05/runbook.md`（local 起動 7 step）
- `outputs/phase-07/ac-matrix.md`（AC 1:1 トレース）
