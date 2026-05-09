# Phase 4: テスト作成（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` / `phase-3.md` |
| 出力 | reporter swap 検証 / coverage gate dry-run / 69% 再現 fixture / critical-route smoke fail 検証 / artifact 検証 |

---

## 0. 前提確認

| # | チェック項目 | コマンド | 期待値 |
|---|-------------|----------|--------|
| P-01 | Stage 2 完了 | `cat docs/30-workflows/e2e-quality-uplift-stage-2/index.md \| grep -E 'Phase\s+13'` | `done` 表記 |
| P-02 | `pnpm e2e` deterministic green | `gh run list --workflow=e2e-tests.yml --branch=dev --limit=3` | 直近 3 run 全て `success` |
| P-03 | line coverage 70% 到達 | Stage 2 phase-11 evidence の `coverage-summary.json` | `total.lines.pct >= 70` |
| P-04 | reporter 現状 | `sed -n '15,19p' apps/web/playwright.config.ts` | `['html','json','list']` のみ |

> P-01〜P-03 NG なら本 Phase 以降を着手しない。

---

## 1. reporter swap 検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-1 | `apps/web/playwright.config.ts` reporter 配列に `monocart-reporter` 追加 | `grep -c 'monocart-reporter' apps/web/playwright.config.ts` | ≥ 1 |
| T-3b-2 | 既存 `html`/`json`/`list` 維持 | `grep -E "'(html\|json\|list)'" apps/web/playwright.config.ts` | 3 件全て存続 |
| T-3b-3 | TypeScript 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| T-3b-4 | reporter 配列順序が「既存 3 件→monocart」 | 目視 | 順序保持 |

---

## 2. coverage gate dry-run（`scripts/coverage-gate-e2e.sh`）

### 2.1 fixture 設計

| ID | 場所 | 内容 |
|----|------|------|
| FIX-A | `scripts/__tests__/coverage-gate-e2e.fixture/pass/coverage-summary.json` | `total.lines.pct = 85.0`（pass ケース） |
| FIX-B | `scripts/__tests__/coverage-gate-e2e.fixture/fail-69/coverage-summary.json` | `total.lines.pct = 69.99`（fail 再現） |
| FIX-C | `scripts/__tests__/coverage-gate-e2e.fixture/missing/`（空ディレクトリ） | ファイル不在ケース |

> fixture 内の JSON は istanbul/c8 の `coverage-summary` 互換 schema を最低限満たす（`total.lines.{total,covered,skipped,pct}`）。

### 2.2 単体テスト

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-5 | pass ケース | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass bash scripts/coverage-gate-e2e.sh` | exit 0 / `::notice::line coverage 85.0 >= 70` |
| T-3b-6 | 69.99% fail ケース | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/fail-69 bash scripts/coverage-gate-e2e.sh` | exit 1 / `::error::line coverage 69.99 < 70` |
| T-3b-7 | ファイル不在ケース | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/missing bash scripts/coverage-gate-e2e.sh` | exit 1 / `::error::coverage-summary.json not found` |

> Phase 5 の `scripts/coverage-gate-e2e.sh` 実装では、本テストを支援するため `THRESHOLD_FIXTURE` 環境変数で `summary` path を上書き可能にする（責務分解は Phase 5 で確定）。

---

## 3. critical-route smoke fail 検証（fail-fast 確認）

| # | 内容 | 期待 |
|---|------|------|
| T-3b-8 | `@critical-route` 付き test を意図的に fail させた fork branch で `pnpm --filter @ubm-hyogo/web e2e --grep @critical-route` | exit 1 |
| T-3b-9 | 同 branch で workflow を draft PR にぶつけ、step 6 で fail し step 7 (`if: success()`) が skip される | `gh run view --log` に該当 |
| T-3b-10 | revert して green に復帰 | step 6 → 7 → 8 全て pass |

---

## 4. artifact 検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-11 | coverage artifact upload | `gh run download <run-id> --name e2e-coverage-<sha>` | `coverage/lcov.info` / `coverage/summary/coverage-summary.json` 取得可 |
| T-3b-12 | monocart artifact upload | `gh run download <run-id> --name e2e-monocart-<sha>` | `index.html` 取得可 |
| T-3b-13 | 失敗時のみ HTML report upload | failure run でのみ `e2e-html-report-<sha>` が存在 | success run では不在 |

---

## 5. 静的検証コマンド

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3b-14 | workflow YAML 構文 | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` | violation 0 |
| T-3b-15 | shellscript 静的解析 | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| T-3b-16 | `set -euo pipefail` 行存在 | `head -3 scripts/coverage-gate-e2e.sh \| grep -F 'set -euo pipefail'` | hit 1 |
| T-3b-17 | しきい値根拠 path コメント存在 | `grep -F 'quality-gates.md' scripts/coverage-gate-e2e.sh` | hit 1 |

---

## 6. context 登録確認（3c 連携用、3b スコープ内では参考）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| T-3c-4 | 3b merge 後、直近 dev HEAD の check-runs に `e2e-tests-coverage-gate` 登場 | `gh api repos/daishiman/UBM-Hyogo/commits/<head-sha>/check-runs \| jq -r '.check_runs[].name' \| sort -u` | `e2e-tests-coverage-gate` を含む |

> T-3c-4 が NG のまま 3c を実行すると PR 永久 pending（BLK-3b-03）。3b 単独完了後、3c spec 側で再検証する。

---

## 7. ローカル実行コマンド集（CONST_005）

| 用途 | コマンド |
|------|----------|
| 依存追加 | `mise exec -- pnpm --filter @ubm-hyogo/web add -D monocart-reporter@^2.9.0 c8@^10.1.0` |
| smoke 単独 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e --grep @critical-route` |
| 全件 + coverage | `mise exec -- pnpm --filter @ubm-hyogo/web e2e && bash scripts/coverage-gate-e2e.sh` |
| coverage gate 単体（fixture） | `THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass bash scripts/coverage-gate-e2e.sh` |
| YAML lint | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` |
| shell lint | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` |

---

## 8. テスト実行順序

```
P-01..P-04（前提）
   ↓
T-3b-1..T-3b-4（reporter swap 静的検証）
   ↓
T-3b-5..T-3b-7（coverage gate fixture 単体）
   ↓
T-3b-8..T-3b-10（critical-route smoke fail 検証）
   ↓ 3b draft PR を dev 向けに ぶつける
T-3b-11..T-3b-13（artifact 検証）
   ↓
T-3b-14..T-3b-17（静的検証）
```

---

## 9. exit criteria（Phase 4 完了条件）

| # | 条件 |
|---|------|
| E-01 | T-3b-1..T-3b-4 が phase-5 実装後に再現可能 |
| E-02 | T-3b-5..T-3b-7 が phase-5 実装後にローカルで再現可能 |
| E-03 | T-3b-8..T-3b-13 が phase-5 実装後に CI 実 run で再現可能 |
| E-04 | T-3b-14..T-3b-17 が actionlint / shellcheck で violation 0 |

---

## 10. 引き継ぎ（Phase 5 へ）

| 項目 | 内容 |
|------|------|
| 新規ファイル | `scripts/coverage-gate-e2e.sh` / `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-69,missing}/` |
| 編集ファイル | `apps/web/playwright.config.ts` / `apps/web/package.json` / `.github/workflows/e2e-tests.yml` |
| 依存追加 | `monocart-reporter@^2.9.0` / `c8@^10.1.0` |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 4
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b の reporter swap / coverage gate / critical-route smoke / artifact / 静的解析の検証手順を確定し、Phase 5 実装後に再現可能なテスト集合を確立する。

## 実行タスク

- 親 phase-4.md §2 / §3.2 から 3b 関連箇所を抽出。
- 69% 再現用 fixture を新規定義（FIX-B）。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-4.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / scripts / .github 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
