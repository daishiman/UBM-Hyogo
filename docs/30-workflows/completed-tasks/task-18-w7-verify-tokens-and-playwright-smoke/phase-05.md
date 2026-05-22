# Phase 5: テスト先行実装（RED）

## 目的

Phase 6 の本実装に先んじて、RED となるテストを書き終える。`scripts/verify-design-tokens.test.ts` と `apps/web/playwright/tests/full-smoke.spec.ts` / `visual/*.spec.ts` を Phase 6 実装前にコミット候補としてローカル配置する。

## 5.1 RED 着手順序

1. `scripts/verify-design-tokens.test.ts` を Phase 4 §4.1 の C1〜C7 で実装（`verifyDesignTokens` は未実装のため import が解決できず RED）
2. 既存 `apps/web/playwright/fixtures/auth.ts` に必要 helper が不足する場合のみ stub を追加
3. `apps/web/playwright/tests/full-smoke.spec.ts` を Phase 3 §3.4 の ROUTES 19 件分書き切る
4. `apps/web/playwright/tests/visual/{login,public-top,admin-dashboard,profile}.spec.ts` を 4 本書く
5. `apps/web/playwright.config.ts` に `smoke-chromium` / `visual-chromium` projects を**先に**追加し、`pnpm e2e:smoke` の起動経路を通す（個別 test は RED でよい）

## 5.2 RED 検証コマンド

```bash
# unit RED
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts   # 全件 fail（モジュール未実装）

# e2e RED（local dev server 立てる）
pnpm --filter @ubm-hyogo/web dev &
pnpm --filter @ubm-hyogo/web e2e:smoke                              # 認証 fixture / landmark 未整備により fail
```

## 5.3 RED の合格条件

- vitest の出力に `verify-design-tokens.test.ts` が **すべて fail** で記録される（compile error でも可）
- Playwright smoke が **少なくとも auth 必要 routes（10 件）で fail** する
- visual specs が baseline 不在で fail（`__screenshots__/` 未生成）する

## 5.4 注意

- RED Phase で `.skip` を**使わない**（CONST_007 / quality-gates §7）。fail させて Phase 6 で解消する
- baseline PNG は本 Phase で生成しない（Phase 6 / Phase 8 で `e2e:visual:update` 実行時に確定）
- `--update-snapshots` を本 Phase で実行しない

## 完了条件

- [ ] scripts/verify-design-tokens.test.ts に C1〜C7 が記述
- [ ] full-smoke.spec.ts に 17 URL route が記述
- [ ] 4 visual spec が記述
- [ ] playwright.config.ts に 2 projects 追加
- [ ] vitest / playwright が想定どおり RED

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- skip / todo を使わず RED test を配置し、Phase 6 の入力にする。

| Task | 内容 |
| --- | --- |
| 5-A | verify-design-tokens unit test を RED 配置する |
| 5-B | Playwright smoke / visual spec を現行 `apps/web/playwright/tests/` に RED 配置する |
| 5-C | skip / todo を使わず失敗を Phase 6 の入力にする |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 4 | `phase-04.md` | C1〜C7 / S1〜S5 / V1〜V3 |
| Playwright fixture | `apps/web/playwright/fixtures/auth.ts` | 既存 fixture 拡張点 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 5 仕様 | `phase-05.md` | RED 実装手順 |

## 統合テスト連携

RED 実行ログは Phase 11 の PASS evidence にはしない。失敗確認は Phase 5 の開発記録に閉じ、Phase 8 で GREEN evidence を取得する。
