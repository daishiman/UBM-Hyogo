# Phase 6: テスト拡充（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-5.md` |
| 出力 | CI minute budget 試算（3b 寄与分）/ critical-route retry 設定 / flakiness 対策 |

---

## 1. CI minute budget 試算（3b 寄与）

### 1.1 1 PR あたりの所要時間

| job | 所要 (min) | 根拠 |
|-----|-----------|------|
| `e2e-tests-coverage-gate`（3b 新規） | 12 | playwright install + critical-route smoke + 全件 e2e + coverage 集計 |
| 内訳: install | 2 | `pnpm install --frozen-lockfile`（cache あり） |
| 内訳: playwright install | 3 | chromium / firefox / webkit |
| 内訳: critical-route smoke | 2 | `--grep @critical-route` 限定 |
| 内訳: 全件 e2e | 5 | workers=2 / Stage 2 baseline |
| 内訳: coverage gate | 1 | c8 report + jq + awk |

### 1.2 月次想定（3b 寄与分のみ）

| 想定 | 値 |
|------|----|
| PR/月 | 20 |
| 平均 push/PR | 3 |
| 月次消費（3b のみ） | 12 × 20 × 3 = 720 min |
| Free Tier 全体 2,000 min への寄与率 | 36% |

> 3a (≈8 min) + 既存 (≈12 min) と合算すると親 phase-6 §1.2 の 1,920 min/月（4% 余裕）になる。

### 1.3 緩和策（3b 寄与）

| # | 策 | 効果 |
|---|----|------|
| M-3b-01 | `concurrency.cancel-in-progress: true` | 同 PR の旧 run キャンセル → 平均 push 影響減 |
| M-3b-02 | `playwright install --with-deps chromium firefox webkit` | full e2e の 3 browser project と install 対象を一致 |
| M-3b-03 | critical-route smoke を **先行** 実行し fail-fast | 全件 e2e の起動を skip → 早期終了で 5 min 節約 |
| M-3b-04 | `actions/setup-node@v4` の `cache: pnpm` | install 短縮 ≈ 1 min |
| M-3b-05 | path filter `paths` の採否 | **不採用**（required check が pending のまま残るリスク・親 phase-6 §1.3 M-03/M-04 と同方針） |

---

## 2. coverage flakiness 対策

### 2.1 想定パターン

| # | パターン | 緩和策 |
|---|---------|--------|
| F-01 | `/profile` の `next/font` lazy load 未評価で line coverage が 1-2 pt 揺らぐ | `monocart-reporter` の `entryFilter: /_next/static/` のみ集計（phase-5 §1.2） |
| F-02 | playwright の `page.goto` race で coverage 取得失敗 | `apps/web/playwright.config.ts:retries` を `process.env.CI ? 2 : 0` に維持（既存 Stage 2 設定） |
| F-03 | サーバ起動完了前に test 開始 | `webServer.timeout: 120000` を維持（既存設定） |
| F-04 | source map 未解決で coverage path mismatch | `monocart-reporter.coverage.sourceFilter` で `apps/web/src/` 限定 |
| F-05 | 80% 直近で揺らぐ regression | しきい値割れ時の rerun を `gh run rerun --failed` で 1 回まで（運用ルール、CI 内自動化はしない） |

### 2.2 critical-route retry 設定

| 項目 | 値 | 根拠 |
|------|----|------|
| `retries`（CI） | `2` | Stage 2 設定維持。critical-route も同一適用 |
| `retries`（local） | `0` | flaky 検出を local で潰す |
| `--max-failures` | 未設定（既定） | smoke 段階で 1 件 fail でも fail-fast が機能（exit 1） |

### 2.3 拡充テスト（3b スコープ内）

| ID | 内容 | 採否 |
|----|------|------|
| EXT-3b-01 | `scripts/coverage-gate-e2e.sh` 単体 fixture テスト（phase-4 T-3b-5..7 をスクリプト化） | **採用** — `scripts/__tests__/coverage-gate-e2e.test.sh`（手動実行 / `pnpm test:scripts` 登録は Stage 4 で検討） |
| EXT-3b-02 | `monocart-reporter` の lcov 出力構造 snapshot | **不採用**（library output に依存しすぎ） |
| EXT-3b-03 | 80% 直近の 5 連続 run でのばらつき観測 | phase-11 evidence で実施 |

### 2.4 EXT-3b-01 fixture 設計（phase-4 §2.1 を再掲）

| 項目 | 値 |
|------|----|
| 場所 | `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-79,missing}/` |
| ケース | (a) `pct=85.0`（pass） (b) `pct=79.99`（fail） (c) ファイル不在（fail） |
| 実行 | `bash scripts/__tests__/coverage-gate-e2e.test.sh`（手動） |

---

## 3. 既存テスト資産との整合

| 資産 | 影響 | 対応 |
|------|------|------|
| `apps/web/playwright/tests/critical/**`（Stage 2 産物） | `@critical-route` tag 必須 | Stage 2 完了確認時に検証済（phase-1 §2 / phase-4 P-02） |
| `apps/web/coverage/` 既存ディレクトリ | `c8 report` 出力先と衝突しないか | `temp-directory=apps/web/coverage/v8` / `report-dir=apps/web/coverage/summary` でサブディレクトリ分離 |
| `EVIDENCE_DIR`（既存 `apps/web/playwright.config.ts`） | reporter 出力先 | CI は `PLAYWRIGHT_EVIDENCE_DIR=playwright/evidence` で artifact upload path と一致。env 未指定時は既存タスク別 path 互換維持 |
| 既存 `coverage.yml`（unit coverage gate） | 重複懸念 | 異なる metric（unit vs e2e）。job 名衝突なし（既存 `coverage-gate` と新規 `e2e-tests-coverage-gate`） |

---

## 4. 終了基準

| # | 条件 |
|---|------|
| EX-01 | CI minute 月次試算が 3b 寄与分で 720 min/月、全体 1,920 min（4% 余裕）に収まる見込み |
| EX-02 | flaky パターン F-01..F-05 全てに緩和策が紐付く |
| EX-03 | EXT-3b-01 fixture が phase-7 の coverage 確認で参照可能 |
| EX-04 | critical-route retry 設定が Stage 2 と矛盾なく維持 |

---

## 5. 引き継ぎ（Phase 7 へ）

| 項目 | 内容 |
|------|------|
| 実測対象 | line coverage >= 80% を **実 CI run** で観測 |
| Stage 2 連携 | Stage 2 の coverage 実績を本 Stage の baseline として参照 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 6
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented-local

## 目的

3b の CI minute 試算と flakiness 緩和策を確定し、phase-7 / phase-11 の実測手順に必要な前提を完備させる。

## 実行タスク

- 親 phase-6.md §1.1 / §2 から 3b 関連箇所を抽出。
- critical-route retry 設定の Stage 2 整合を再確認。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-6.md

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
- [x] coverage AC 適用: E2E tier-aware standard lines >=80%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
