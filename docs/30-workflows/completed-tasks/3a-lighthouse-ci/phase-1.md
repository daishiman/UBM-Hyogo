# Phase 1: 要件定義（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-09 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch | `feat/lighthouse-ci` |
| tier | standard（lines >= 70%） |
| implementation_mode | `new` |

---

## 1. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| `apps/web/package.json` 内 `@lhci/cli` | 未導入 | `grep '@lhci/cli' apps/web/package.json` 該当なし |
| `lighthouserc.json` リポジトリルート | 未存在 | `ls lighthouserc.json` 該当なし |
| `.github/workflows/lighthouse.yml` | 未存在 | `ls .github/workflows/lighthouse.yml` 該当なし |
| `dev` branch protection 現 contexts | `["ci","Validate Build","coverage-gate"]`（`lighthouse-ci` 未登録） | 親 stage-3 phase-1 §1 |
| `dev` `required_pull_request_reviews` | `null`（solo policy 整合） | 同上 |
| `pnpm --filter @ubm-hyogo/web build` の CI 実績 | green（`pr-build-test.yml`） | 既存 workflow 履歴 |
| Stage 2 完了状況 | 完了想定（親 stage-3 phase-3 CONDITIONAL GO 解消） | `docs/30-workflows/e2e-quality-uplift-stage-2/` |

---

## 2. scope

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/lighthouse.yml` 新規作成 | `wrangler` deploy preview 連携 |
| `lighthouserc.json` プロジェクトルート新規作成 | mobile preset 個別調整 |
| `@lhci/cli` の devDependency 追加（`apps/web/package.json`） | カスタム plugin 開発 |
| 4 routes（`/`, `/(public)/members`, `/profile`, `/login`）への assertion | 管理画面群（認証フローが重く CI 不安定） |
| context 名 `lighthouse-ci` を GitHub に登録（実 PR run 1 回） | branch protection contexts への追加（3c の責務） |
| `/profile` 未認証時 a11y 縮退判定（Q-02） | 認証済セッションでの a11y 計測（Stage 4 以降） |

---

## 3. pre-conditions

- Stage 2 完了（critical-route smoke が green）。
- `pnpm --filter @ubm-hyogo/web build` が CI で成功する。
- `/profile` / `/login` は未認証時もレンダリング可能（loading skeleton 含む）であること。

---

## 4. acceptance criteria（再掲）

| # | 内容 |
|---|------|
| AC-3a-1 | PR to `dev` で `lighthouse-ci` job が起動する |
| AC-3a-2 | 4 routes 全てで perf>=0.80 / a11y>=0.90 / best-practices>=0.90 / seo>=0.80 を満たすときに pass |
| AC-3a-3 | いずれかが閾値割れすると job が `failure` になり、PR check が赤くなる |
| AC-3a-4 | `lhci-report-${{ github.sha }}` artifact が retention 7 日でアップロードされる |
| AC-3a-5 | workflow `name:` / `jobs.<id>.name:` が `lighthouse-ci` と完全一致 |

---

## 5. inventory（変更対象）

| path | 種別 | 行数目安 |
|------|------|---------|
| `.github/workflows/lighthouse.yml` | new | ≈ 50 行 |
| `lighthouserc.json` | new | ≈ 25 行 |
| `apps/web/package.json` | edit（`devDependencies` に `@lhci/cli` 追加） | +1 行 |
| `pnpm-lock.yaml` | regenerate | 自動 |

---

## 6. naming conventions

| 対象 | 命名 | 理由 |
|------|------|------|
| workflow `name:` | `lighthouse-ci` | branch protection context と完全一致（3c 責務との接続点） |
| `jobs.<id>` | `lighthouse` | 短縮形（context 表示と無関係） |
| `jobs.<id>.name:` | `lighthouse-ci` | check-runs API での name は jobs.\*.name を使う |
| artifact name | `lhci-report-${{ github.sha }}` | sha 単位で衝突回避 |
| concurrency group | `lighthouse-${{ github.ref }}` | branch 単位 cancel-in-progress |

---

## 7. open questions

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-01 | Lighthouse の baseURL は localhost build か preview deployment か | localhost（CI 安定優先 / token 不要 / `pnpm start` 利用） |
| Q-02 | `/profile` 未認証時 a11y >= 0.90 を満たすか | Phase 7 で実測判定。未達なら lighthouserc から `/profile` を除去し 3 routes に縮退 |
| Q-03 | `LHCI_GITHUB_APP_TOKEN` を採用するか | 不採用（`assert` の job 失敗で十分・追加 secret 不要） |

---

## 8. ローカル実行コマンド

```bash
# 依存追加（実装後）
mise exec -- pnpm --filter @ubm-hyogo/web add -D @lhci/cli@^0.14.0

# ローカル smoke
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start &
curl retry loop for http://localhost:3000
mise exec -- pnpm exec lhci autorun --config=./lighthouserc.json
```

---

## 9. DoD（Phase 1 完了条件）

| # | 条件 |
|---|------|
| D-01 | scope / pre-conditions / AC / inventory / naming convention 全項目が記載済 |
| D-02 | open questions Q-01..Q-03 の暫定方針が確定済 |
| D-03 | 親 stage-3 phase-1 § 2 との内容整合（差分なし） |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3a Lighthouse CI 導入を独立実装サイクルとして要件定義し、scope / AC / inventory / naming / open questions を 1 ファイル内に確定させる。

## 実行タスク

- 親 stage-3 から 3a 関連条項を抽出する。
- scope / pre / AC / inventory / naming を本 phase に確定する。
- Q-01..Q-03 を暫定方針付きで列挙する。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/index.md
- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-1.md
- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md

## 実行手順

1. 親 stage-3 phase-1 を読み 3a 条項を抽出する。
2. scope / inventory / AC を本 phase に転記し独立化する。
3. Q-01..Q-03 を暫定方針付きで Phase 7 / Phase 11 へ引き継ぐ。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 evidence は Phase 11 で作成

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスク自体は NON_VISUAL のため CI 既存 gate に委譲）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
