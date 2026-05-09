# Phase 6: テスト拡充（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-5.md` |
| 出力 | CI minute budget 試算 / coverage flakiness 緩和策 / 拡充テスト計画 |

---

## 1. CI minute budget 試算

GitHub Actions Free Tier（private repo は 2,000 min/月）を前提に、Stage 3 導入後の月次消費を算定する。

### 1.1 1 PR あたりの所要時間（試算）

| job | 所要 (min) | 根拠 |
|-----|-----------|------|
| 既存 `ci` | 3 | typecheck + lint |
| 既存 `Validate Build` | 5 | `pnpm build` |
| 既存 `coverage-gate` | 4 | unit coverage |
| 新規 `lighthouse-ci` | 8 | build + start + 4 routes × 1 run |
| 新規 `e2e-tests-coverage-gate` | 12 | playwright install + 全件 e2e + coverage 集計 |
| **合計** | **32** | 1 PR / 1 push |

### 1.2 月次想定

| 想定 | 値 |
|------|----|
| PR/月 | 20 |
| 平均 push/PR | 3 |
| 月次消費 | 32 × 20 × 3 = 1,920 min |
| Free Tier | 2,000 min |
| 余裕 | 4%（**ぎりぎり**） |

### 1.3 緩和策

| # | 策 | 効果 |
|---|----|------|
| M-01 | `concurrency.cancel-in-progress: true`（phase-2.md §1.1 / §2.3 適用済） | 同 PR の旧 run キャンセル → 平均 push 影響減 |
| M-02 | Lighthouse `numberOfRuns: 1`（phase-2.md §1.2 適用済） | 3 → 1 run で約 16 min/PR 削減 |
| M-03 | path filter `paths: ['apps/web/**', 'lighthouserc.json']` を `lighthouse.yml` `on.pull_request` に追加 | docs-only PR で skip |
| M-04 | path filter `paths: ['apps/web/**', '.github/workflows/e2e-tests.yml', 'scripts/coverage-gate-e2e.sh']` を `e2e-tests.yml` に追加 | 同上 |
| M-05 | `actions/setup-node@v4` の `cache: pnpm` で install 短縮 | ≈ 1 min/job |

> M-03 / M-04 は **branch protection を満たすために `paths-ignore` で skip させると required check が pending のまま** になるリスクがある。GitHub の仕様上「実行されなかった required check は pending 扱い」なので、代わりに **`if:` で early-exit する dummy job** を置くか、**docs-only の場合は手動 override**（admin merge）で運用する。本 Stage では simplicity 優先で path filter を **採用しない**。`enforce_admins=false` 維持により admin override は可能。

---

## 2. coverage flakiness 対策

### 2.1 想定される flaky パターン

| # | パターン | 緩和策 |
|---|---------|--------|
| F-01 | `/profile` の `next/font` lazy load 未評価で line coverage が 1-2 pt 揺らぐ | `monocart-reporter` の `entryFilter` で `_next/static` のみ集計（phase-2.md §2.1） |
| F-02 | playwright の page.goto race で coverage 取得失敗 | retry: `apps/web/playwright.config.ts:retries` を `process.env.CI ? 2 : 0` に維持 |
| F-03 | サーバ起動完了前に test 開始 | `webServer.timeout: 120000` を維持（既存設定） |
| F-04 | source map 未解決で coverage path mismatch | `monocart-reporter.coverage.sourceFilter` で `apps/web/src/` 限定 |
| F-05 | 70% 直近で揺らぐ regression | しきい値割れ時の rerun を `gh run rerun --failed` で 1 回まで自動化（運用ルール、CI 内自動化はしない） |

### 2.2 拡充テスト

| # | 内容 | 採否 |
|---|------|------|
| EXT-01 | `/profile` 認証済セッションでの a11y 別計測 | **採用しない**（Stage 3 スコープ外。Stage 4 以降で扱う） |
| EXT-02 | `lighthouse-ci` の 5 連続 run でのスコアばらつき観測 | phase-11 evidence で実施 |
| EXT-03 | coverage gate dry-run の fixture テスト（`scripts/coverage-gate-e2e.sh` 単体） | **採用** — phase-4 T-3b-4..T-3b-6 をスクリプト化 |
| EXT-04 | `monocart-reporter` の lcov 出力構造 snapshot | **不採用**（library output に依存しすぎ） |

### 2.3 EXT-03 fixture 設計

| 項目 | 値 |
|------|----|
| 場所 | `scripts/__tests__/coverage-gate-e2e.fixture/` |
| ケース | (a) `pct=85`（pass） (b) `pct=69.99`（fail） (c) ファイル不在（fail） |
| 実行 | `bash scripts/__tests__/coverage-gate-e2e.test.sh`（手動 / `pnpm test:scripts` 等の登録は Stage 4 で検討） |

---

## 3. 既存テスト資産との整合

| 資産 | 影響 | 対応 |
|------|------|------|
| `apps/web/playwright/tests/critical/**` (Stage 2 産物) | `@critical-route` tag 必須 | Stage 2 完了確認時に検証済（phase-4 P-02） |
| `apps/web/coverage/` 既存ディレクトリ | `c8 report` 出力先と衝突しないか | `temp-directory=apps/web/coverage/v8`、`report-dir=apps/web/coverage/summary` でサブディレクトリ分離 |
| `EVIDENCE_DIR`（既存 `apps/web/playwright.config.ts`） | reporter 出力先 | `monocart-reporter.outputFile = ${EVIDENCE_DIR}/monocart/index.html` で互換維持 |

---

## 4. 終了基準

| # | 条件 |
|---|------|
| EX-01 | CI minute 月次試算が free tier 内に収まる見込みであること（§1.2） |
| EX-02 | flaky パターン F-01..F-05 全てに緩和策が紐付くこと（§2.1） |
| EX-03 | EXT-03 fixture が phase-7 の coverage 確認で参照可能であること |

---

## 5. 引き継ぎ（Phase 7 へ）

| 項目 | 内容 |
|------|------|
| 実測対象 | line coverage >= 70% を **実 CI run** で観測 |
| Stage 2 連携 | Stage 2 の coverage 実績を本 Stage の baseline として参照 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 6
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 3 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

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
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

