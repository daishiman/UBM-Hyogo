# Phase 9: 品質検証（typecheck / lint / coverage / actionlint / E2E regression）

## メタ情報

| key | value |
|-----|-------|
| Phase | 9 |
| Phase Name | 品質検証 |
| 作成日 | 2026-05-14 |
| 前 Phase | 8 |
| 次 Phase | 10 |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 関連 AC | AC-6 / AC-7 / contracts 依存境界確認 |

## 目的

Phase 2 validation matrix で列挙した 8 command すべてを実 CI 相当条件で実行し、exit code・coverage 数値・`packages/contracts` の依存境界（`zod` のみ / shared 参照 0 hit）を確定する。failure 時は最小局所修正で復旧し、復旧不能であれば Phase 6 or 7 へ戻す。

## 品質ゲート一覧

| # | gate | command | 期待 exit | 関連 AC |
|---|------|---------|-----------|---------|
| QG-1 | typecheck | `mise exec -- pnpm typecheck` | 0 | AC-7 / contracts boundary |
| QG-2 | lint | `mise exec -- pnpm lint` | 0 | AC-7 |
| QG-3 | contracts unit + coverage | `mise exec -- pnpm --filter @ubm-hyogo/contracts test --coverage` | 0 / S/B/F/L ≥80% | AC-7 |
| QG-4 | mock contract test + coverage | `mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts --coverage` | 0 / S/B/F/L ≥80% | AC-3 / AC-7 |
| QG-5 | coverage guard | `bash scripts/coverage-guard.sh` | 0 | AC-7 |
| QG-6 | actionlint | `mise exec -- pnpm exec actionlint .github/workflows/e2e-tests.yml`（actionlint 利用可なら） | 0 | AC-5 |
| QG-7 | E2E regression | `mise exec -- pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium` | 0 / green | AC-6 |
| QG-8 | CI test job self-check | `mise exec -- pnpm test`（root） | 0（contract spec が glob で拾われる） | AC-3 |

## 実行タスク

1. QG-1..QG-8 を順次実行し、各 exit code と output を記録
2. coverage 数値（QG-3 / QG-4）を抽出し ≥80% を確認
3. `packages/contracts` が `zod` のみ依存し、`@ubm-hyogo/shared` を参照していないことを確認
4. failure 時は本 Phase「失敗時 roll-back 戦略」に従い対応
5. 結果を `outputs/phase-9/quality-report.md` に集約

## 参照資料

- `phase-2.md` Validation matrix
- `phase-3.md` contracts 依存境界方針
- `phase-7.md` integration test report
- `phase-8.md` perf report
- `.claude/skills/task-specification-creator/references/coverage-standards.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 実行手順

### 1. typecheck（QG-1 / contracts 依存境界確認）

```bash
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-9/typecheck.log
echo "exit=$?"
```

**contracts 依存境界確認**:

```bash
# packages/contracts が shared に依存しないことを確認
mise exec -- pnpm --filter @ubm-hyogo/contracts typecheck
node -e "const p=require('./packages/contracts/package.json'); console.log(JSON.stringify(p.dependencies))"
rg -n '@ubm-hyogo/shared' packages/contracts
# → 0 hit を期待
```

### 2. lint（QG-2）

```bash
mise exec -- pnpm lint 2>&1 | tee outputs/phase-9/lint.log
```

失敗時はまず `pnpm lint --fix` を試し、残違反のみ手修正。

### 3. contracts unit coverage（QG-3）

```bash
mise exec -- pnpm --filter @ubm-hyogo/contracts test --coverage 2>&1 \
  | tee outputs/phase-9/contracts-coverage.log

# 数値抽出
grep -E "All files|Statements|Branches|Functions|Lines" outputs/phase-9/contracts-coverage.log
```

期待: Statements / Branches / Functions / Lines すべて **≥ 80.0%**。

### 4. mock contract test coverage（QG-4）

```bash
mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts --coverage 2>&1 \
  | tee outputs/phase-9/mock-coverage.log

grep -E "All files|Statements|Branches|Functions|Lines" outputs/phase-9/mock-coverage.log
```

期待: 同上 ≥80%。`scripts/e2e-mock-api.mjs` を計測対象に含めるため、vitest config の `coverage.include` に `scripts/e2e-mock-api.mjs` が含まれることを確認。

### 5. coverage guard（QG-5）

```bash
bash scripts/coverage-guard.sh 2>&1 | tee outputs/phase-9/coverage-guard.log
echo "exit=$?"
```

exit 0 を期待。failure 時は不足 package を特定して unit テスト追加。

### 6. actionlint（QG-6）

```bash
if command -v actionlint >/dev/null 2>&1 || mise exec -- pnpm exec actionlint --version >/dev/null 2>&1; then
  mise exec -- pnpm exec actionlint .github/workflows/e2e-tests.yml 2>&1 \
    | tee outputs/phase-9/actionlint.log
else
  echo "actionlint unavailable; skip but record" > outputs/phase-9/actionlint.log
fi
```

利用不可な場合は skip。利用可なら exit 0 を期待。

### 7. E2E regression（QG-7）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium 2>&1 \
  | tee outputs/phase-9/e2e-desktop.log
```

既存 spec（`task10-ui-primitives.spec.ts` / `admin-identity-conflicts.spec.ts` 等）が green を維持していること（AC-6）。

### 8. root pnpm test self-check（QG-8）

```bash
mise exec -- pnpm test 2>&1 | tee outputs/phase-9/root-test.log
grep -E "scripts/__tests__/e2e-mock-api.contract.spec" outputs/phase-9/root-test.log
```

contract spec が glob で拾われていることを確認（AC-3）。

## 失敗時 roll-back 戦略

| 失敗 gate | 一次対応 | 二次対応（最大 3 回） | それでも失敗 |
|-----------|---------|---------------------|-------------|
| QG-1 typecheck | 型不整合 / null許容 / unused import 修正 | re-export 経路の type alias 追加 | Phase 6 に戻す |
| QG-2 lint | `pnpm lint --fix` → 残違反手修正 | rule 単位で根本修正 | Phase 6 に戻す |
| QG-3 / QG-4 coverage | uncovered line を spec で補完 | fixture 数追加 / branch 追加 | Phase 4 (テスト作成) に戻す |
| QG-5 coverage-guard | 不足 package 特定→unit テスト追加 | guard 設定の閾値変更は禁止 | Phase 4 に戻す |
| QG-6 actionlint | YAML 構文 / step name 重複修正 | workflow patch を minimum diff 化 | Phase 6 に戻す |
| QG-7 E2E regression | failure spec を `--debug` で局所実行 | mock dispatcher / fixture を比較し最小差分修正。`git revert` は最終手段 | Phase 6 に戻す |
| QG-8 root test glob | vitest config の `include` 修正 | `ci.yml` test job への明示 step 追加 | Phase 6 に戻す |

> `git revert` を選ぶ場合、revert commit + 局所修正 commit を 2 段で push し、PR body に経緯を残す。

## contracts 依存境界確認

```bash
# 循環なしを最終確認
mise exec -- pnpm typecheck
# packages/contracts は zod のみ
node -e "const p=require('./packages/contracts/package.json'); console.log(JSON.stringify(p.dependencies))"
# contracts 側に shared 参照がない
rg -n '@ubm-hyogo/shared' packages/contracts
```

期待:
- `pnpm typecheck` exit 0
- `packages/contracts/package.json#dependencies` は `zod` のみ
- `packages/contracts/` 配下に `@ubm-hyogo/shared` 参照が 0 hit
- `apps/api` / `apps/web` 側で必要な箇所だけ参照されている

## 統合テスト連携

- Phase 7 / 8 の成果物（integration-test-report.md / perf-report.md）を本 Phase の入力とし、`outputs/phase-9/quality-report.md` で **整合性チェック表** に集約
- failure 時の Phase 戻し戦略は本 Phase 内で完結（外部 Phase に飛ばない）

## 多角的チェック観点（AI が判断）

- [ ] QG-1..QG-8 すべて exit 0
- [ ] coverage 4 指標すべて ≥80%（QG-3 / QG-4）
- [ ] contracts 依存境界が解決確認済み（循環なし / contracts 側に shared 参照なし）
- [ ] E2E regression が既存 spec すべて green（AC-6）
- [ ] actionlint 利用可否を明示し、利用可なら exit 0
- [ ] coverage-guard 設定閾値を本 Phase で勝手に下げていない
- [ ] failure 時の roll-back 戦略が**最小差分・semantics 維持**になっている
- [ ] PII redact: mock log に email / responseId 等の生値が出ていないか sample 確認

## サブタスク管理

| ID | サブタスク | 状態 |
|----|-----------|------|
| ST-9-1 | QG-1..QG-8 実行 | 未着手 |
| ST-9-2 | contracts 依存境界確認 | 未着手 |
| ST-9-3 | failure 時 roll-back | 未着手（必要時のみ） |
| ST-9-4 | quality-report.md 作成 | 未着手 |

## 成果物

- `outputs/phase-9/quality-report.md`（QG-1..QG-8 結果集約 / contracts 依存境界確認 / failure 履歴）
- `outputs/phase-9/typecheck.log`
- `outputs/phase-9/lint.log`
- `outputs/phase-9/contracts-coverage.log`
- `outputs/phase-9/mock-coverage.log`
- `outputs/phase-9/coverage-guard.log`
- `outputs/phase-9/actionlint.log`
- `outputs/phase-9/e2e-desktop.log`
- `outputs/phase-9/root-test.log`

## 完了条件（coverage AC 必須）

- [ ] QG-1 typecheck exit 0
- [ ] QG-2 lint exit 0
- [ ] QG-3 contracts coverage **S/B/F/L ≥80%**
- [ ] QG-4 mock contract coverage **S/B/F/L ≥80%**
- [ ] QG-5 coverage-guard exit 0
- [ ] QG-6 actionlint exit 0（利用可な場合）または skip 記録
- [ ] QG-7 E2E desktop-chromium green（既存 spec すべて）
- [ ] QG-8 root `pnpm test` で contract spec が拾われ exit 0
- [ ] contracts 依存境界確認済み
- [ ] AC-6 / AC-7 充足

## タスク100%実行確認【必須】

- [ ] 実行手順 1-8 全完了
- [ ] サブタスク ST-9-1..ST-9-4 全完了
- [ ] 成果物 9 ファイル作成済み
- [ ] failure 発生時は roll-back 完了で再度 PASS

## 次 Phase

Phase 10: 最終レビュー（AC-1..AC-7 機械検証 / MINOR 解決 / simpler alternative 整合 / 未解決事項書き出し）
