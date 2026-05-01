# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## spec_created 境界

本 workflow は `taskType=docs-only` / `workflow_state=spec_created` のため、この Phase では実 screenshot や axe 実結果を捏造して配置しない。ここで完了させる責務は、後続実装 task / 09a が同じ基準で実行できる smoke 手順、evidence 配置規約、pass / fail 判定欄、ブロック条件を定義することに限定する。実行時は同じ手順で `outputs/phase-11/evidence/` に実証跡を保存し、Phase 12/13 の gate を実在チェックへ切り替える。

## 目的

GO 後に人間または後続実装 task が `pnpm --filter @ubm/web exec playwright test` を local Workers + local D1 で実行し、screenshot evidence (desktop 19 枚 + mobile 15 枚 + α = 30 枚以上) / Playwright HTML report / axe-core report / CI workflow yml を `outputs/phase-11/evidence/` に永続化できるようにする。AuthGateState 5 状態 / `/no-access` 404 / editResponseUrl 遷移 / attendance 二重防御 / a11y 違反 0 を目視 + 機械両軸で確認する。

## 実行タスク

- [ ] local 実行手順記述（wrangler dev + Next.js dev + playwright test）
- [ ] 7 シナリオ smoke（公開 / login / profile / admin / search / density / attendance）
- [ ] screenshot evidence 30 枚以上の配置規約（`outputs/phase-11/evidence/desktop/` / `mobile/`）
- [ ] axe-report.json 仕様（`outputs/phase-11/evidence/axe-report.json`）
- [ ] Playwright HTML report 仕様（`outputs/phase-11/evidence/playwright-report/`）
- [ ] CI workflow yml 仕様（`outputs/phase-11/evidence/ci-workflow.yml`）
- [ ] pass / fail 判定欄

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 7 step runbook |
| 必須 | outputs/phase-04/verify-matrix.md | scenario × AC |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / CI |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |

## 7 シナリオ smoke

### シナリオ 1: 公開導線 (public.spec.ts)

```bash
# 起動
pnpm --filter @ubm/api dev &
pnpm --filter @ubm/web dev &
pnpm --filter @ubm/web exec playwright test tests/e2e/public.spec.ts \
  --project=desktop-chromium --project=mobile-webkit \
  2>&1 | tee outputs/phase-11/evidence/public-run.log

# Expected:
# - landing → 一覧 → 詳細 → 登録 が desktop / mobile で全 pass
# - outputs/phase-11/evidence/desktop/landing.png 等 4 枚
# - outputs/phase-11/evidence/mobile/landing.png 等 4 枚
```

### シナリオ 2: AuthGateState 5 状態 + /no-access 404 (login.spec.ts)

```bash
pnpm --filter @ubm/web exec playwright test tests/e2e/login.spec.ts \
  --project=desktop-chromium --project=mobile-webkit \
  2>&1 | tee outputs/phase-11/evidence/login-run.log

# Expected:
# - 5 state × 2 viewport = 10 ケース pass
# - /no-access が 404 を返す（不変条件 #9）
# - login-input/sent/unregistered/rules_declined/deleted の screenshot 各 viewport
```

### シナリオ 3: profile (#4 編集 form 不在 + #8 reload 維持 + editResponseUrl)

```bash
pnpm --filter @ubm/web exec playwright test tests/e2e/profile.spec.ts \
  --project=desktop-chromium --project=mobile-webkit \
  2>&1 | tee outputs/phase-11/evidence/profile-run.log

# Expected:
# - 編集 form `toHaveCount(0)` (不変条件 #4)
# - reload 後 / localStorage clear 後も state 維持 (不変条件 #8)
# - editResponseUrl popup → docs.google.com/forms/.../viewform 観測
```

### シナリオ 4: admin 5 画面 × 認可境界 3 軸 (admin.spec.ts)

```bash
pnpm --filter @ubm/web exec playwright test tests/e2e/admin.spec.ts \
  --project=desktop-chromium --project=mobile-webkit \
  2>&1 | tee outputs/phase-11/evidence/admin-run.log

# Expected:
# - admin cookie で 5 画面 200
# - member cookie で 5 画面 403
# - anon で 5 画面 → /login redirect
# - admin-dashboard/members/tags/schema/meetings の screenshot 各 viewport
```

### シナリオ 5: 検索 6 パラメータ (search.spec.ts)

```bash
pnpm --filter @ubm/web exec playwright test tests/e2e/search.spec.ts \
  --project=desktop-chromium 2>&1 | tee outputs/phase-11/evidence/search-run.log

# Expected:
# - 5 ケース (q/zone/status/tag/sort + 全乗せ) pass
# - URL クエリと表示件数が一致
```

### シナリオ 6: density 切替 (density.spec.ts)

```bash
pnpm --filter @ubm/web exec playwright test tests/e2e/density.spec.ts \
  --project=desktop-chromium 2>&1 | tee outputs/phase-11/evidence/density-run.log

# Expected:
# - density=comfy / dense / list の data 属性切替
# - density-comfy/dense/list.png screenshot
```

### シナリオ 7: attendance dup + 削除済み除外 (#15)

```bash
pnpm --filter @ubm/web exec playwright test tests/e2e/attendance.spec.ts \
  --project=desktop-chromium 2>&1 | tee outputs/phase-11/evidence/attendance-run.log

# Expected:
# - 同 member 2 回登録で toast 表示（不変条件 #15 二重防御）
# - 削除済み member が出席候補に出ない（不変条件 #7 + #15）
# - attendance-duplicate-toast.png
```

## a11y smoke

```bash
pnpm --filter @ubm/web exec playwright test --grep '@a11y' \
  --project=desktop-chromium --project=mobile-webkit \
  --reporter=list 2>&1 | tee outputs/phase-11/evidence/a11y-run.log

# Expected: 5 path × 2 viewport = 10 ケースで violations = []
# axe-report.json に { url, violations: [] } が path 数分記録
```

## CI workflow yml validate

```bash
yamllint .github/workflows/e2e-tests.yml
cp .github/workflows/e2e-tests.yml outputs/phase-11/evidence/ci-workflow.yml

# Expected: yml syntax OK
```

## evidence 配置

```
outputs/phase-11/evidence/
├── desktop/                              # 19 枚以上の PNG
│   ├── landing.png
│   ├── members-list.png
│   ├── members-detail.png
│   ├── register.png
│   ├── login-input.png
│   ├── login-sent.png
│   ├── login-unregistered.png
│   ├── login-rules_declined.png
│   ├── login-deleted.png
│   ├── profile.png
│   ├── admin-dashboard.png
│   ├── admin-members.png
│   ├── admin-tags.png
│   ├── admin-schema.png
│   ├── admin-meetings.png
│   ├── density-comfy.png
│   ├── density-dense.png
│   ├── density-list.png
│   └── attendance-duplicate-toast.png
├── mobile/                               # 15 枚以上の PNG
│   ├── landing.png
│   ├── members-list.png
│   ├── ... (同等 15 枚)
├── playwright-report/                    # HTML report
│   ├── index.html
│   └── data/
├── axe-report.json                       # a11y 違反集約
├── ci-workflow.yml                       # GitHub Actions yml
├── public-run.log
├── login-run.log
├── profile-run.log
├── admin-run.log
├── search-run.log
├── density-run.log
├── attendance-run.log
└── a11y-run.log
```

## pass / fail 判定欄

| シナリオ | 期待 | desktop 結果 | mobile 結果 | 備考 |
| --- | --- | --- | --- | --- |
| 1 公開導線 | 4 ステップ pass | TBD | TBD | screenshot 4 枚 / viewport |
| 2 login 5 状態 + /no-access 404 | 10 + 1 pass | TBD | TBD | 不変条件 #9 |
| 3 profile (#4 + #8 + editResponseUrl) | 3 ケース pass | TBD | TBD | popup 観測 |
| 4 admin 5 × 認可 3 | 30 ケース pass | TBD | TBD | adminPage / memberPage / anon |
| 5 search 6 パラメータ | 5 ケース pass | TBD | — | desktop only |
| 6 density 3 値 | 3 mode pass | TBD | — | desktop only |
| 7 attendance dup + 削除済み | 2 ケース pass | TBD | — | 不変条件 #15 |
| 8 a11y violations = [] | 10 ケース 0 件 | TBD | TBD | 5 path × 2 viewport |
| 9 yml validate | OK | TBD | — | — |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果と evidence path を implementation-guide に反映 |
| 下流 09a | staging deploy 前に local pass 必須 |
| 下流 09b | CI workflow yml を release runbook に組込 |

## 多角的チェック観点

- 不変条件 **#4**: profile に編集 form 不在の screenshot を desktop / mobile で証拠保全
- 不変条件 **#8**: profile 表示 → reload → localStorage clear → reload で同じ画面が出る screenshot を保存
- 不変条件 **#9**: `/no-access` 404 の HTTP response code を log に残す
- 不変条件 **#15**: attendance dup toast の screenshot と削除済み member 不在の DOM 差分
- 無料枠: CI 8 min 以内、artifact 10 MB 以内
- secret hygiene: log / screenshot / axe-report に email / token / cookie 値が含まれないことを目視

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 7 シナリオ smoke 手順 | 11 | pending | 各 spec |
| 2 | a11y smoke | 11 | pending | 5 path × 2 viewport |
| 3 | screenshot 30 枚以上配置規約 | 11 | pending | desktop + mobile |
| 4 | axe-report.json | 11 | pending | violations = [] |
| 5 | Playwright HTML report | 11 | pending | playwright-report/ |
| 6 | CI workflow yml validate | 11 | pending | yamllint |
| 7 | pass / fail 判定 | 11 | pending | 各シナリオ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリ |
| evidence 仕様 | outputs/phase-11/evidence/desktop/ | desktop 19 枚以上 |
| evidence 仕様 | outputs/phase-11/evidence/mobile/ | mobile 15 枚以上 |
| evidence 仕様 | outputs/phase-11/evidence/axe-report.json | a11y |
| evidence 仕様 | outputs/phase-11/evidence/playwright-report/ | HTML report |
| evidence 仕様 | outputs/phase-11/evidence/ci-workflow.yml | GitHub Actions |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] 7 シナリオ + a11y + yml validate の実行手順が定義済み
- [ ] screenshot ≥ 30 枚（desktop 19 + mobile 15 = 34 を目安）の配置規約が定義済み
- [ ] axe-report.json で critical / serious 0 件を gate にすることを定義済み
- [ ] Playwright HTML report の配置規約が定義済み
- [ ] CI workflow yml validate 手順が定義済み

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物仕様定義済み（screenshot / report / axe / yml）
- [ ] artifacts.json の phase 11 を completed

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ: smoke 手順と evidence path 一覧
- ブロック条件: 後続実行時に 1 シナリオでも fail / a11y violation あり / screenshot 30 枚未達なら Phase 5 戻し
