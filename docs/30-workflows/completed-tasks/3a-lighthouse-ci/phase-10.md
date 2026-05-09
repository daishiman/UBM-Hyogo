# Phase 10: 最終レビュー（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` ～ `phase-9.md` |
| 出力 | self-review checklist / 不変条件 drift チェック / GO/NO-GO |
| 運用 | solo（レビュアー必須化なし。self-review のみ） |

---

## 1. self-review checklist

### 1.1 仕様整合

| # | 項目 | 確認 |
|---|------|------|
| R-01 | AC-3a-1..5（index.md / phase-1）が phase-5 実装で全件カバー | ✅ |
| R-02 | phase-2 の workflow 構造と phase-5 実装が 1:1 対応 | ✅ |
| R-03 | phase-3 BLK-01..BLK-03 解消手順が phase-4..phase-13 のどこかに登場 | BLK-01: phase-9 §2 Y-02 / BLK-02: phase-5 §4 / BLK-03: phase-7 §2 |
| R-04 | Q-01..Q-03 の判定が固定 | Q-01 localhost / Q-02 phase-7 §2 / Q-03 不採用確定 |
| R-05 | Stage 2 完了が前提として明示 | phase-1 §3 / phase-4 §0 / phase-7 §0 |
| R-06 | 3b / 3c の責務が本タスク責務外であることが明記 | index.md / phase-1 §2 |

### 1.2 不変条件 drift チェック

| # | 不変条件 | drift 判定 |
|---|---------|-----------|
| INV-01 | `required_pull_request_reviews=null`（solo policy） | drift なし（本 PR は branch protection を変更しない） |
| INV-02 | Lighthouse CI は PR to `dev` のみ | drift なし（`on.pull_request.branches: [dev]`） |
| INV-03 | `wrangler` 直叩き禁止 | drift なし（CI 内で `wrangler` 不使用） |
| INV-04 | `process.env.*` の `apps/web/src` 直接参照 | 影響なし（本 PR は `apps/web/src` 変更なし） |
| INV-05 | CONST_007 single cycle | drift なし（先送りなし・3a 単独完結） |
| INV-06 | context 名 `lighthouse-ci` 完全一致 | drift なし（YAML `name:` / `jobs.<id>.name:` 両方一致） |

### 1.3 CONST_007 single cycle

| # | 項目 | 確認 |
|---|------|------|
| C-01 | Phase 1→2→3→...→13 が一直線 | ✅ |
| C-02 | 戻りループ・条件分岐ループなし | ✅（Q-02 縮退判定は phase-7 内で完結） |
| C-03 | 「将来 PR」「Stage 4 で扱う」と明記された項目は backlog 引き渡し済 | ✅（OBS-01 / RB-01..RB-04） |

### 1.4 ファイル責務分離

| 成果物 | 責務 | 重複なし確認 |
|--------|------|-------------|
| `lighthouserc.json` | Lighthouse assertion 値 / URL リスト | ✅ |
| `.github/workflows/lighthouse.yml` | lhci CI 実行 / artifact upload | ✅ |
| `apps/web/package.json` | `@lhci/cli` devDep ピン化 | ✅ |
| `pnpm-lock.yaml` | lockfile 整合 | ✅（自動再生成） |

---

## 2. 受入基準 trace（index.md AC-3a-1..5）

| AC | 担保 phase | 担保内容 |
|----|-----------|---------|
| AC-3a-1 | phase-2 §1 / phase-5 §2 | `on.pull_request.branches: [dev]` |
| AC-3a-2 | phase-2 §2 / phase-5 §1 | `lighthouserc.json` assertion 値 4 件 |
| AC-3a-3 | phase-4 §3 / phase-11 §3 | 故意閾値割れ再現で fail 観測 |
| AC-3a-4 | phase-2 §3 / phase-5 §2 | `actions/upload-artifact@v4` step 9 |
| AC-3a-5 | phase-9 Y-02 / phase-5 §2.1 | `name:` / `jobs.<id>.name:` 完全一致 |

---

## 3. リスク再点検

| risk（phase-2 §5） | 緩和反映 phase | 状態 |
|-------------------|---------------|------|
| CI minute budget 超過 | phase-6 §3 | 試算済（占有 18%） |
| Lighthouse perf 揺らぎ | phase-7 §2 / phase-11 | 5 連続 run 観測手順あり |
| `/profile` a11y 偏り | phase-7 §2 | Q-02 判定手順確定 |
| context タイポで永久 pending | phase-9 Y-02 / phase-3 BLK-01 | 名称完全一致 + 1 PR 観測必須化 |
| `pnpm start` 起動失敗 | phase-2 §5 / phase-5 §2 | `wait-on --timeout 60000` |

---

## 4. 残課題（3a 終了後に残るもの）

| ID | 内容 | 引き取り先 |
|----|------|-----------|
| OBS-01 | `enforce_admins=false` drift（CLAUDE.md 期待 `true`） | 別 governance drift workflow |
| RB-01..RB-04 | build 共有 / composite action / paths filter / LHCI Server | Stage 4 backlog（phase-12 で記録） |
| EXT-X1 | `/profile` 認証済 a11y 計測 | Stage 4 以降 |
| 3c 適用 | `lighthouse-ci` を branch protection contexts に追加 | 別オペレーション（3b と合わせて手動 `gh api`） |

---

## 5. GO / NO-GO

| 観点 | 判定 |
|------|------|
| 全 AC trace 完備 | GO |
| 全 INV drift なし | GO |
| CONST_007 遵守 | GO |
| 残課題が引き取り先に明示 | GO |
| Stage 2 完了前提が明示 | GO |
| solo policy 整合 | GO |

### 結論

**GO**（Stage 2 完了済みを前提として無条件 GO）。

---

## 6. 引き継ぎ（Phase 11 へ）

| 項目 | 内容 |
|------|------|
| Phase 11 タスク | draft PR-A で実 CI run 観測 / Lighthouse 4 routes 実測 / 故意閾値割れで fail 観測 / Q-02 縮退判定確定 |
| evidence 保存先 | `outputs/phase-11/` |

---

## DoD（Phase 10 完了条件）

| # | 条件 |
|---|------|
| D-01 | R-01..R-06 / INV-01..INV-06 / C-01..C-03 全 ✅ |
| D-02 | AC-3a-1..5 trace が phase 名で記載済 |
| D-03 | 残課題が引き取り先付きで列挙 |
| D-04 | GO 結論に至る根拠が明示 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 10
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3a Lighthouse CI 導入の最終レビューを solo self-review で実施し、AC trace / INV drift / CONST_007 / 残課題引き取りを確定する。

## 実行タスク

- self-review checklist を実施。
- AC trace を作成。
- INV drift を確認。
- 残課題を引き取り先付きで列挙。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-10.md
- phase-1.md..phase-9.md（本サブタスク内）

## 実行手順

1. R-01..R-06 を確認。
2. INV-01..INV-06 を確認。
3. AC-3a trace を完成。
4. GO/NO-GO 結論を提示。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- GO 判定（Phase 11 着手の gate）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
