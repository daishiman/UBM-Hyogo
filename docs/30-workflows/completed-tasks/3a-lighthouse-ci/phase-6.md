# Phase 6: テスト拡充（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-5.md` |
| 出力 | CI 実行時間目安 / retry / timeout 設定 / 拡充テスト計画 |

---

## 1. CI 実行時間目安

3a workflow 単独の所要時間（GitHub Actions `ubuntu-latest`）。

| step | 所要 (sec) | 備考 |
|------|-----------|------|
| 1 checkout | 5 | — |
| 2 pnpm setup | 10 | — |
| 3 node setup（cache hit 時） | 10 | `cache: pnpm` |
| 4 install (`--frozen-lockfile`) | 30 | cache hit 時 |
| 5 build (`pnpm --filter @ubm-hyogo/web build`) | 90 | Next.js production build |
| 6 start（background） | 5 | — |
| 7 wait-on（起動完了） | 15 | timeout 60s 内 |
| 8 lhci autorun（4 routes × 1 run） | 180 | desktop preset |
| 9 upload artifact | 10 | retention 7 |
| **合計（おおよそ）** | **355 sec ≈ 6 min** | |

`timeout-minutes: 15` は 6 min × 2.5 倍の余裕として確定。

---

## 2. retry / timeout 設定

| 対象 | 値 | 根拠 |
|------|----|------|
| `jobs.lighthouse.timeout-minutes` | `15` | §1 試算の 2.5 倍 |
| `wait-on --timeout` | `60000` (60 sec) | Next.js production start の typical 起動時間（5-15 sec）の 4 倍以上 |
| `lhci autorun` retry | なし | `numberOfRuns: 1` 採用（CI minute 節約） |
| step retry | なし | step 失敗時は workflow 全体が fail → 再実行は GitHub UI から手動 rerun |
| `concurrency.cancel-in-progress` | `true` | 同 PR の旧 run を cancel し budget 圧迫回避 |

---

## 3. CI minute budget 影響

| 想定 | 値 |
|------|----|
| PR/月 | 20 |
| 平均 push/PR | 3 |
| 月次消費（3a 単独） | 6 × 20 × 3 = **360 min** |
| Free Tier | 2,000 min |
| 占有率 | 18%（許容） |

> 3b / 3c は別 workflow / 別オペレーション。本タスクは 3a の minute 影響のみ計算。

---

## 4. 拡充テスト

### 4.1 観測テスト（Phase 11 evidence）

| # | 内容 | 採否 |
|---|------|------|
| EXT-01 | `lighthouse-ci` の 5 連続 run でのスコアばらつき観測 | **採用** — Phase 11 §2.2 で 5 PR 連続実行 |
| EXT-02 | route 別 scoring の中央値・最小値記録 | **採用** — `outputs/phase-11/lhci-scores.json` |
| EXT-03 | Q-02 縮退判定（`/profile` a11y 中央値） | **採用** — Phase 7 §3 |

### 4.2 不採用

| # | 内容 | 理由 |
|---|------|------|
| EXT-X1 | 認証済セッションでの a11y 計測 | Stage 4 以降スコープ |
| EXT-X2 | mobile preset 計測 | 本タスクは desktop 固定（Q-01 確定） |
| EXT-X3 | 履歴的スコアの長期 dashboard | LHCI Server 不採用のため対象外 |

---

## 5. flaky パターン緩和

| # | パターン | 緩和策 |
|---|---------|--------|
| F-01 | CI ランナー負荷で perf 揺らぎ | `preset: desktop` 固定 / `numberOfRuns: 1` / Phase 11 で 5 連続観測し perf>=75 への緩和提案を保留オプションとして記録 |
| F-02 | `pnpm start` 起動遅延 | `wait-on --timeout 60000`（60 sec） |
| F-03 | `/profile` redirect で a11y 偏り | Q-02 縮退（Phase 7 で判定） |
| F-04 | `_next/static` キャッシュ未温で初回 perf 低下 | `numberOfRuns: 1` で 1 回観測（warm-up なし）。許容差として閾値 0.80 設定 |

---

## 6. 終了基準

| # | 条件 |
|---|------|
| EX-01 | CI 月次消費が free tier 内（< 2,000 min）に収まる試算（§3） |
| EX-02 | flaky F-01..F-04 全てに緩和策が紐付く |
| EX-03 | EXT-01..EXT-03 が Phase 11 / Phase 7 で実行可能 |

---

## 7. 引き継ぎ（Phase 7 へ）

| 項目 | 内容 |
|------|------|
| Phase 7 タスク | NON_VISUAL のため list smoke + grep gate に置換した coverage 確認 / Q-02 縮退判定 |
| 実測対象 | Lighthouse スコアばらつき（5 連続 run） |

---

## DoD（Phase 6 完了条件）

| # | 条件 |
|---|------|
| D-01 | §1 所要時間試算が confirm |
| D-02 | §2 retry / timeout 値が確定 |
| D-03 | §3 月次 minute 試算が free tier 内 |
| D-04 | §4 / §5 拡充テストと flaky 緩和策が確定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 6
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3a workflow の所要時間 / retry / timeout / CI minute budget / flaky 緩和策を確定する。

## 実行タスク

- step 別所要時間を試算。
- retry / timeout を確定。
- 月次 minute 消費を試算。
- flaky パターンと緩和策を 1:1 で紐付け。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-6.md
- phase-5.md（本サブタスク内）

## 実行手順

1. step 別所要を試算。
2. timeout / retry を確定。
3. flaky と EXT を分類。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- Phase 11 拡充テスト計画

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
