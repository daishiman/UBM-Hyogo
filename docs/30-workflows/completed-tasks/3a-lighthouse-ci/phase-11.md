# Phase 11: 手動テスト / Evidence（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-10.md` GO 判定 |
| 出力 | draft PR-A 実 run 観測 / Lighthouse 4 routes 実測 / 故意 fail 再現 / Q-02 縮退判定確定 / evidence 集約 |
| 保存先 | `outputs/phase-11/` |

---

## 1. 手動テスト全体フロー

```
Step A: PR-A draft 作成（lighthouse.yml + lighthouserc.json + apps/web/package.json + pnpm-lock.yaml）
   ↓ run 観測（green）
Step B: 4 routes 実測スコア取得・スクリーンショット保存
   ↓
Step C: Q-02 縮退判定（/profile 未認証 a11y 中央値）
   ↓
Step D: 故意閾値割れ再現（assertion fail を 1 度観測 → revert）
   ↓
Step E: PR-A merge to dev
   ↓
Step F: 1 回 success run 観測 → context `lighthouse-ci` が GitHub に登録（3c 着手前提）
```

---

## 2. Step A — PR-A 観測（Lighthouse CI）

| # | 操作 | evidence 保存先 |
|---|------|----------------|
| A-01 | PR-A を `feat/lighthouse-ci` で `dev` 向け draft 作成 | `outputs/phase-11/pr-a-url.txt` |
| A-02 | `lighthouse-ci` job が起動・green | `gh run view <run-id> --log > outputs/phase-11/pr-a-lighthouse.log` |
| A-03 | 4 routes 実測スコア取得 | `outputs/phase-11/lhci-scores.json`（lhci report の score 部分を抽出） |
| A-04 | スクリーンショット（lhci report HTML を Chrome で開いた状態） | `outputs/phase-11/lhci-report-{root,members,profile,login}.png` |

### 2.1 期待実測（参考レンジ）

| route | perf | a11y | best-practices | seo |
|-------|------|------|----------------|-----|
| `/` | >= 0.80 | >= 0.90 | >= 0.90 | >= 0.80 |
| `/members` | >= 0.80 | >= 0.90 | >= 0.90 | >= 0.80 |
| `/profile` | >= 0.80 | **判定対象（Q-02）** | >= 0.90 | >= 0.80 |
| `/login` | >= 0.80 | >= 0.90 | >= 0.90 | >= 0.80 |

### 2.2 5 連続 run のばらつき観測（EXT-01）

PR-A draft 上で `gh workflow run lighthouse.yml` または empty commit push で 5 回起動し、各 route の score 中央値・最小値を記録する。

| 保存先 | 内容 |
|--------|------|
| `outputs/phase-11/lhci-runs-5x.json` | 5 連続 run の score 配列（route × category） |
| `outputs/phase-11/lhci-stability-summary.md` | 中央値・最小値・標準偏差・しきい値超え判定 |

---

## 3. Step D — 故意閾値割れ再現（fail 観測）

### 3.1 手順

| # | 操作 | 期待 |
|---|------|------|
| D-01 | 一時ブランチ `tmp/lhci-fail-test` を切る | — |
| D-02 | `lighthouserc.json` の `categories:performance.minScore` を `0.99` に書換 | local diff |
| D-03 | コミット + push、PR-A は **作らず** workflow_dispatch なら手動起動、もしくは PR を別途 draft で作る | workflow 起動 |
| D-04 | `lighthouse-ci` job が `failure` | `gh run view --log` |
| D-05 | log を保存 | `outputs/phase-11/lighthouse-fail.log` |
| D-06 | 一時ブランチを破棄 | — |

### 3.2 期待出力

| # | 内容 | 期待 |
|---|------|------|
| F-01 | exit code 1 | log 末尾に `Process completed with exit code 1.` |
| F-02 | `Failed assertion` 文字列 | log に hit 1 件以上 |
| F-03 | check-run `lighthouse-ci` が `failure` | `gh api repos/daishiman/UBM-Hyogo/commits/<sha>/check-runs` で確認 |

---

## 4. Step C — Q-02 縮退判定（`/profile` a11y）

### 4.1 判定実行

phase-7 §2 に従いローカルで `/profile` 3 連続計測を実行する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start &
for i in {1..60}; do curl -fsS http://localhost:3000 >/dev/null && break; sleep 1; done

mise exec -- pnpm exec lhci collect \
  --url=http://localhost:3000/profile \
  --numberOfRuns=3 \
  --settings.preset=desktop
```

### 4.2 判定結果保存

| ファイル | 内容 |
|---------|------|
| `outputs/phase-11/lhci-profile-q02-judgement.md` | PR runtime a11y 中央値・縮退採否・判定根拠。ローカル事前判定は `outputs/phase-7/lhci-profile-q02-judgement.md` |

### 4.3 縮退時のオペレーション

| # | 内容 |
|---|------|
| R-01 | `lighthouserc.json` の `ci.collect.url` から `http://localhost:3000/profile` を削除 |
| R-02 | PR-A に fixup commit `chore(lhci): drop /profile due to unauth a11y < 0.90` を追加 |
| R-03 | PR-A 再 run で 3 routes 全 pass 観測 |
| R-04 | `outputs/phase-11/lhci-scores.json` を 3 routes 構成で再生成 |

---

## 5. evidence 一覧（保存ファイル）

| path | 内容 |
|------|------|
| `outputs/phase-11/pr-a-url.txt` | PR-A URL |
| `outputs/phase-11/pr-a-lighthouse.log` | Lighthouse run log（CI） |
| `outputs/phase-11/lhci-scores.json` | 4 routes 実測スコア（縮退時 3 routes） |
| `outputs/phase-11/lhci-report-root.png` | Lighthouse report スクリーンショット `/` |
| `outputs/phase-11/lhci-report-members.png` | 同 `/members` |
| `outputs/phase-11/lhci-report-profile.png` | 同 `/profile`（縮退時は不要） |
| `outputs/phase-11/lhci-report-login.png` | 同 `/login` |
| `outputs/phase-11/lhci-runs-5x.json` | 5 連続 run のばらつき raw |
| `outputs/phase-11/lhci-stability-summary.md` | ばらつき要約 |
| `outputs/phase-11/lighthouse-fail.log` | 故意 fail 再現の log |
| `outputs/phase-11/lhci-profile-q02-judgement.md` | Q-02 判定 |

---

## 6. context `lighthouse-ci` 登録確認

PR-A merge 後、dev で 1 回 success run を観測した直後に実行する。

```bash
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/branches/dev | jq -r '.commit.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/$HEAD_SHA/check-runs" \
  | jq -r '.check_runs[].name' \
  | sort -u \
  > outputs/phase-11/registered-contexts.txt

grep -c '^lighthouse-ci$' outputs/phase-11/registered-contexts.txt
# 期待: 1
```

> 3c branch protection 適用は本タスク責務外。本 Phase は context が登録された地点までを担保する。

---

## 7. rollback 手順

| 状況 | rollback |
|------|---------|
| PR-A merge 後に致命的な問題発覚 | `gh pr revert <PR-A>` で revert PR を作成 → dev に merge |
| Lighthouse perf スコアが連続して 0.80 を割る | Phase 11 evidence に基づき perf 閾値を 0.75 に緩和する fixup PR を別途作成（CONST_007 を逸脱しないよう本サイクル内で完結） |

---

## 8. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Step A..D 全て期待観測（A green / D fail 再現） |
| EX-02 | Step C の Q-02 判定が確定（維持 or 縮退） |
| EX-03 | Step F で context `lighthouse-ci` が GitHub に登録（registered-contexts.txt で確認） |
| EX-04 | evidence ファイル §5 が全件揃う（縮退時は `/profile` 関連除く） |

---

## 9. 引き継ぎ（Phase 12 へ）

| 項目 | 内容 |
|------|------|
| Phase 12 タスク | CLAUDE.md branch protection contexts 表追記候補（3c 適用前提）/ LOGS.md 追記 / topic-map 更新 / backlog 引き取り |

---

## DoD（Phase 11 完了条件）

| # | 条件 |
|---|------|
| D-01 | A-01..A-04 / D-01..D-06 / Q-02 判定が実行手順として記述済 |
| D-02 | evidence §5 全 path が確定 |
| D-03 | context 登録確認手順が記述済 |
| D-04 | rollback 手順が記述済 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

draft PR-A の実 run / 4 routes 実測 / 故意 fail 再現 / Q-02 縮退判定 / context 登録確認を実施し evidence を確定する。

## 実行タスク

- A-01..A-04 を実行。
- D-01..D-06 で fail 再現。
- Q-02 を実測判定。
- context 登録を確認。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-11.md
- phase-7.md / phase-9.md（本サブタスク内）

## 実行手順

1. PR-A draft 作成し実 run 観測。
2. 5 連続 run でばらつき記録。
3. 故意 fail を一時ブランチで再現。
4. Q-02 縮退判定。
5. context 登録確認。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- outputs/phase-11/* evidence 一式

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
