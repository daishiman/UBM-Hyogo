# Phase 7: カバレッジ確認（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md` |
| 出力 | NON_VISUAL 置換テスト結果 / Q-02 縮退判定 |
| visualEvidence | NON_VISUAL |

---

## 0. 本タスクの coverage 取扱

3a Lighthouse CI 導入は **コード coverage（line / branch / function / statement）の対象外**（YAML / JSON 設定追加のみ・`apps/web/src` のコード変更なし）。

そのため本 Phase の「カバレッジ確認」は以下に置換する:

| 置換項目 | 内容 |
|---------|------|
| list smoke | `lhci autorun` 4 routes 全 pass |
| grep gate | workflow `name:` / `jobs.<id>.name:` の context 一致確認 |
| Q-02 縮退判定 | `/profile` a11y 中央値による 4→3 routes 縮退判定 |

> coverage tier=standard（lines >=70%）は workspace 全体の既存 gate（`coverage-gate` workflow）が担保。本 PR-A はその gate に乗ること以上の責務を持たない。

---

## 1. list smoke 検証

### 1.1 ローカル run（Phase 4 §2 の再実行）

| # | 操作 | 期待 |
|---|------|------|
| L-01 | `mise exec -- pnpm install --frozen-lockfile` | exit 0 |
| L-02 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |
| L-03 | `mise exec -- pnpm --filter @ubm-hyogo/web start &` + `curl` retry loop | server up |
| L-04 | `mise exec -- pnpm exec lhci autorun --config=./lighthouserc.json` | exit 0（4 routes 全 pass） |
| L-05 | `.lighthouseci/lhr-*.html` 件数 | 4（縮退時 3） |

### 1.2 grep gate

| # | 検査 | コマンド | 期待 |
|---|------|---------|------|
| G-01 | workflow `name:` | `grep -E '^name:\s*lighthouse-ci$' .github/workflows/lighthouse.yml` | hit 1 |
| G-02 | jobs name | `grep -cE '^\s*name:\s*lighthouse-ci$' .github/workflows/lighthouse.yml` | >= 2 |
| G-03 | trigger | `grep -E 'pull_request:' .github/workflows/lighthouse.yml -A2 \| grep 'branches: \[dev\]'` | hit 1 |
| G-04 | timeout | `grep 'timeout-minutes: 15' .github/workflows/lighthouse.yml` | hit 1 |
| G-05 | artifact name | `grep 'lhci-report-' .github/workflows/lighthouse.yml` | hit 1 |
| G-06 | URL 4 件 | `jq '.ci.collect.url \| length' lighthouserc.json` | 4（縮退時 3） |

---

## 2. Q-02 縮退判定（`/profile` a11y）

### 2.1 判定手順

| # | 操作 | 判定 |
|---|------|------|
| Q-A | `mise exec -- pnpm --filter @ubm-hyogo/web build && mise exec -- pnpm --filter @ubm-hyogo/web start &` | server up |
| Q-B | `mise exec -- pnpm exec lhci collect --url=http://localhost:3000/profile --numberOfRuns=3 --settings.preset=desktop` | 3 run のスコア取得 |
| Q-C | a11y score 中央値 | **>= 0.90** なら 4 routes 維持 / **< 0.90** なら縮退 |

### 2.2 縮退時の手当て

| # | 内容 |
|---|------|
| R-01 | `lighthouserc.json` の `ci.collect.url` から `http://localhost:3000/profile` を削除（残 3 routes） |
| R-02 | `outputs/phase-11/lhci-profile-q02-judgement.md` に縮退理由・観測スコア・判定 evidence を保存 |
| R-03 | Phase 12 LOGS.md 更新時に「Q-02 縮退」項目を明記 |
| R-04 | Stage 4 backlog として「`/profile` 認証 fixture を導入し再 enroll」を記録 |

### 2.3 縮退しないケース（`/profile` 維持）

| # | 内容 |
|---|------|
| K-01 | `lighthouserc.json` 4 routes をそのまま採用 |
| K-02 | `outputs/phase-11/lhci-scores.json` に 4 routes の実測スコアを記録 |

---

## 3. 実測の保存先

| ファイル | 内容 |
|---------|------|
| `outputs/phase-7/lhci-profile-q02-judgement.md` | Q-02 縮退判定結果（採否 + 数値） |
| `outputs/phase-7/grep-gate-evidence.log` | G-01..G-06 の実行ログ |
| `outputs/phase-7/local-smoke-evidence.log` | L-01..L-05 の実行ログ |

---

## 4. 終了基準

| # | 条件 |
|---|------|
| EX-01 | L-01..L-05 全て pass |
| EX-02 | G-01..G-06 全て期待値で hit |
| EX-03 | Q-02 判定が「維持」または「縮退」のいずれかで確定し、対応する成果物が保存されている |

---

## 5. 引き継ぎ（Phase 8 へ）

| 項目 | 内容 |
|------|------|
| Phase 8 入力 | 確定 lighthouserc（4 or 3 routes） / workflow YAML |
| 検討課題 | URL 配列の YAML 化判断 / route group 表記の統一 |

---

## DoD（Phase 7 完了条件）

| # | 条件 |
|---|------|
| D-01 | NON_VISUAL 置換が list smoke + grep gate + Q-02 判定の 3 系統で確定 |
| D-02 | L-01..L-05 / G-01..G-06 / Q-A..Q-C が実行可能なコマンドで記述済 |
| D-03 | Q-02 判定後の成果物保存先が確定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 7
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

NON_VISUAL タスクとしての coverage 確認を list smoke / grep gate / Q-02 縮退判定の 3 系統に置換し、Phase 11 evidence の準備を整える。

## 実行タスク

- list smoke L-01..L-05 を確定。
- grep gate G-01..G-06 を確定。
- Q-02 判定 Q-A..Q-C を確定。
- 保存先 path を確定。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-7.md
- phase-1.md / phase-4.md（本サブタスク内）

## 実行手順

1. NON_VISUAL 置換ポリシーを宣言。
2. list smoke / grep gate / Q-02 を確定。
3. 縮退時の R-01..R-04 を確定。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- outputs/phase-7/* 評価ログ群（Phase 11 で実観測）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL のため list smoke + grep gate に置換）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
