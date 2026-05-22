# Phase 8: 品質ゲート（local PASS 5-set + smoke + visual）

## 目的

ローカルでの 7 evidence をすべて green にし、CI へ push する直前の状態を確定する。

## 8.1 実行コマンド（順序固定）

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck                                          2>&1 | tee outputs/phase-11/evidence/typecheck.txt
mise exec -- pnpm lint                                               2>&1 | tee outputs/phase-11/evidence/lint.txt
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts    2>&1 | tee outputs/phase-11/evidence/test.txt
mise exec -- pnpm --filter @ubm-hyogo/web build                      2>&1 | tee outputs/phase-11/evidence/build.txt
mise exec -- pnpm verify:tokens                                      2>&1 | tee outputs/phase-11/evidence/verify-tokens.txt
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke                  2>&1 | tee outputs/phase-11/evidence/e2e-smoke.txt
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual                 2>&1 | tee outputs/phase-11/evidence/e2e-visual.txt
```

## 8.2 各 gate の PASS 条件

| Gate | PASS 条件 |
| --- | --- |
| typecheck | exit 0 / `Found 0 errors` |
| lint | exit 0 |
| unit test | C1〜C7 すべて PASS、`Tests  7 passed` |
| build | exit 0 / `.open-next/` または equivalent 出力 |
| verify:tokens | `✓ design tokens in sync (N tracked)`、N > 0 |
| e2e:smoke | 17 PASS / 0 skipped / 0 failed |
| e2e:visual | 4 PASS（baseline 一致）/ 0 failed |

## 8.3 失敗時の対処

| 症状 | 対処 |
| --- | --- |
| verify:tokens で drift 検出 | parser バグなら `verify-design-tokens.ts` を修正。SSOT 転記漏れなら同 PR で `tokens.css` / `globals.css` bridge を同期。意図的な token 値変更は別 workflow |
| e2e:smoke a11y serious | 該当画面の primitive（task-10 / task-11..17）に差し戻し |
| e2e:smoke landmark timeout | `data-testid` 規約と実装の drift。実装 task に差し戻し |
| e2e:visual flaky | `maxDiffPixelRatio` を超える前に `addStyleTag` の animation 停止が効いているか確認。閾値変更は**しない** |

## 8.4 grep gate（NON_VISUAL）

```bash
# E2E session token の実値漏れ検知（cookie 名自体は仕様上許可）
git diff --cached | grep -E 'E2E_(ADMIN|MEMBER)_SESSION_TOKEN=.+' && echo "FAIL: token env literal" || echo "PASS"
git diff --cached | grep -E 'authjs\.session-token.*[A-Za-z0-9_-]{40,}' && echo "FAIL: token-like cookie value" || echo "PASS"

# placeholder token grep（quality-gates §placeholder rule）
git diff --cached | grep -E 'token-sized|09b-token-value|token-mix|TODO_TOKEN' && echo "FAIL: placeholder" || echo "PASS"
```

すべて PASS であることを `outputs/phase-11/evidence/grep-gate.txt` に記録。

## 完了条件

- [ ] 7 evidence ファイルが `outputs/phase-11/evidence/` に存在し exit 0
- [ ] grep-gate.txt で token literal / token-like cookie / placeholder が PASS
- [ ] failed なし

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- local gate を順序固定で実行し、tracked evidence と grep gate を保存する。

| Task | 内容 |
| --- | --- |
| 8-A | local PASS 5-set と smoke / visual を順序固定で実行する |
| 8-B | ignored `.log` を避け、tracked `.txt` evidence を保存する |
| 8-C | false fail しない secret / placeholder grep gate を記録する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 4 | `phase-04.md` | evidence path / DoD |
| `.gitignore` | `.gitignore` | `*.log` ignored rule |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 8 仕様 | `phase-08.md` | 品質ゲート手順 |
| evidence | `outputs/phase-11/evidence/*.txt` | Phase 11 で取得する tracked evidence |

## 統合テスト連携

Phase 8 が統合テストの主実行地点。smoke / visual は `apps/web/playwright.config.ts` の webServer と Chromium install step を使い、結果を Phase 11 の canonical evidence に渡す。
