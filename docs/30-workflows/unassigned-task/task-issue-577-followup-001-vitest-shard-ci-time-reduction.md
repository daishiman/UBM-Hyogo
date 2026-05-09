# Issue #577 followup 001 / API coverage CI 時間短縮（Vitest --shard 採用検討）- タスク指示書

## メタ情報

```yaml
issue_number: 616
status: 未着手
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-issue-577-followup-001-vitest-shard-ci-time-reduction |
| タスク名     | API coverage CI 時間短縮 / Vitest --shard 採用検討 |
| 分類         | 改善 |
| 対象機能     | `@ubm-hyogo/api` Vitest coverage / GitHub Actions CI |
| 優先度       | 中 |
| 見積もり規模 | 中規模 |
| ステータス   | 未着手 |
| GitHub Issue | #616 |
| 発見元       | Issue #577 Phase 12 implementation-guide.md L62-69 「別 Issue 候補」 |
| 発見日       | 2026-05-09 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #577 では Miniflare D1 test の port exhaustion を解消するため、軸 B（`--maxWorkers=1 --minWorkers=1`）を `apps/api/package.json#test:coverage` に採用した。これにより 133/133 tests / 0 EADDRNOTAVAIL を達成したが、wall-clock 時間は parallel 時の約 200s から 506s に延びている（serialization の trade-off）。

### 1.2 問題点・課題

ローカルでは許容範囲だが、CI で `pnpm --filter @ubm-hyogo/api test:coverage` が PR ごとに 506s 消費する状態は、PR feedback loop の劣化要因となる。テストファイル数が増えるほど線形に悪化する。

### 1.3 放置した場合の影響

- PR ごとの CI 待ち時間が累積し、開発リズムが鈍化する
- 将来テストが増えた時点で CI timeout や workflow 課金枠を圧迫する
- 軸 B の serialization が「恒久解」のまま固定化され、port exhaustion 真因の上流改善追跡から目が逸れる

---

## 2. 何を達成するか（What）

### 2.1 目的

軸 D（GitHub Actions matrix で Vitest `--shard=N/M` 分割並列）を採用し、各 shard 内では `--maxWorkers=1` を維持しつつ wall-clock 時間を短縮するか判断する。

### 2.2 最終ゴール

- `--shard=1/3` `2/3` `3/3` の matrix で CI が PASS する
- shard 間で port exhaustion が再発しない
- before/after の CI 所要時間 evidence が取得され、軸 D 採用 / 不採用が記録される
- coverage merge が機能し、閾値判定が単一 shard 実行と同等になっている

### 2.3 スコープ

#### 含むもの

- `.github/workflows/*.yml` の matrix 化（shard 数を 2〜4 で実験）
- 各 shard で `--maxWorkers=1 --minWorkers=1` 維持
- coverage reporter を `json` 等 merge 可能な形式に変更し、`nyc merge` または `vitest --merge-reports` 等で集約
- before/after の wall-clock evidence
- 軸 D 採用判断記録（adopt / reject / partial の三択）

#### 含まないもの

- `apps/api` 実装ロジックの変更
- D1 schema 変更
- coverage 閾値の変更
- 軸 B（`--maxWorkers=1`）設定の撤去（shard 内では維持）
- commit / push / PR 作成
- 他タスクへの侵食（UI prototype alignment 等）

### 2.4 成果物

- `.github/workflows/*.yml` の shard matrix 修正差分
- CI before/after 所要時間 evidence（job log 抜粋）
- 軸 D 採用判断記録 markdown
- 必要に応じ `apps/api/package.json` の coverage script 微調整差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #577 の軸 B 設定が main / dev に取り込まれている
- ローカルで `pnpm --filter @ubm-hyogo/api test:coverage` が PASS する
- GitHub Actions に sufficient concurrency が確保されている

### 3.2 依存タスク

- 親: `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`
- 関連: followup-002 (Miniflare/undici 上流改善追跡), followup-003 (D1 grouping)

### 3.3 必要な知識

- Vitest `--shard=N/M` の挙動とテストファイル分割アルゴリズム
- GitHub Actions matrix と `needs:` による fan-in pattern
- coverage merge 戦略（vitest v1+ の merge-reports / nyc / istanbul）

### 3.4 推奨アプローチ

shard 数を 2 から始めて effective かを確認し、3, 4 と漸増させる。各 shard 内では `--maxWorkers=1` を維持し port exhaustion 非再発を確認する。coverage は per-shard で json artifact に保存し、最終 job で merge して閾値判定する。

---

## 4. 実行手順

### Phase 1: shard 局所実験

#### 目的

ローカルで `vitest --shard=1/2` 等が想定どおりテストを分割するか確認する。

#### 手順

1. `pnpm --filter @ubm-hyogo/api exec vitest run --shard=1/2 --maxWorkers=1` を実行
2. shard=2/2 も実行し、合計 133 tests が網羅されているか確認
3. 各 shard の所要時間を記録

#### 完了条件

- shard 分割で全 test が 1 回ずつ実行されている

### Phase 2: CI matrix 化

#### 目的

GitHub Actions で shard を並列実行する。

#### 手順

1. `.github/workflows/*.yml` に `strategy.matrix.shard: [1, 2, 3]` 等を追加
2. `--shard=${{ matrix.shard }}/3` を渡す
3. coverage reporter を json に変更し artifact upload
4. merge job で artifact を集約し閾値判定

#### 完了条件

- 全 shard が PASS する
- merge 後の coverage が閾値を満たす

### Phase 3: 採用判断

#### 目的

before/after evidence を比較し、軸 D 採用可否を決める。

#### 手順

1. wall-clock 時間（before: 506s, after: 各 shard + merge 合算）を記録
2. CI 課金（job-minutes）の増減を確認
3. 採用 / 不採用 / 条件付き採用を判断記録に残す

#### 完了条件

- 採用判断が evidence 付きで記録されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] shard matrix で全 test が PASS する
- [ ] coverage merge 後の閾値判定が PASS する
- [ ] port exhaustion が再発していない

### 品質要件

- [ ] coverage 閾値を下げていない
- [ ] `apps/api` 実装ロジックを変更していない
- [ ] 軸 B の `--maxWorkers=1` を shard 内で維持している

### ドキュメント要件

- [ ] before/after の CI 時間 evidence が記録されている
- [ ] 採用判断記録が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --shard=1/3 --maxWorkers=1 --minWorkers=1
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --shard=2/3 --maxWorkers=1 --minWorkers=1
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --shard=3/3 --maxWorkers=1 --minWorkers=1
```

期待: 各 shard exit 0。合計 test 数 = single-run と一致。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| coverage merge が想定どおり動かず閾値判定が崩れる | 高 | 中 | reporter を json で統一し、merge job で istanbul / nyc 系を使う。failsafe として single-shard fallback を残す |
| shard 間で D1 状態が共有されてテストが flaky になる | 中 | 中 | shard ごとに Miniflare instance を独立させ、setup/teardown を確認する |
| matrix 並列で GitHub Actions concurrency 上限に達する | 低 | 低 | shard 数を 2 から始めて漸増する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-12/implementation-guide.md`
- `apps/api/package.json`
- `.github/workflows/`

### 参考資料

- Vitest `--shard` ドキュメント
- aiworkflow-requirements: `D1 直接アクセスは apps/api 経由のみ`（不変条件 5）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 軸 B serial 化により CI 時間が 200s → 506s に増加 |
| 原因 | Miniflare port exhaustion を回避するため worker 並列を 1 に絞った trade-off |
| 対応 | shard で wall-clock を分割並列化する案を検討 |
| 再発防止（future-self への観点） | (1) shard 間 D1 isolate の検証手順を残す (2) coverage merge ツール選定の比較表を残す (3) shard 数 2/3/4 の sweet spot を A/B evidence で固定する (4) 単一 job fallback を維持して flaky 時に即時切り戻せる構成にする |

### 補足事項

本タスクは Issue #577 の trade-off を解消するための「次の選択肢」であり、軸 B 設定自体は維持する。commit / push / PR 作成はスコープ外。実行時は本タスク以外への侵食を避け、`apps/api` 実装ロジックや D1 schema は触らない。
