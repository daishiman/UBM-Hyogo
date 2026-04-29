# Turborepo / Nx 導入による coverage cache - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-turborepo-coverage-cache-001                                     |
| タスク名     | Turborepo / Nx 導入と coverage 実行の affected graph キャッシュ       |
| 分類         | ビルドシステム / テスト最適化                                          |
| 対象機能     | monorepo build orchestration（Turborepo or Nx）                       |
| 優先度       | 低                                                                    |
| 見積もり規模 | 大規模                                                                |
| ステータス   | 未実施 (proposed)                                                     |
| 親タスク     | coverage-80-enforcement                                               |
| 発見元       | coverage-80-enforcement Phase 12 unassigned-task-detection (U-1)      |
| 発見日       | 2026-04-29                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

coverage-80-enforcement では `coverage-guard.sh --changed` flag で git diff ベースの軽量化を採用した。本格的な affected graph による coverage cache（依存先まで遡って必要 package のみ実行）は Turborepo / Nx 導入が前提となる。

### 1.2 問題点・課題

- `--changed` は git diff ベースで依存波及を追えない
- 依存 package の変更で間接的な coverage regression を見逃す可能性
- 大規模化に伴い `pnpm -r test:coverage` 全件実行のコストが増える

### 1.3 放置した場合の影響

- CI 実行時間が monorepo 拡大に応じて線形に増える
- 差分実行で依存先 coverage 低下を検知できない

---

## 2. 何を達成するか（What）

### 2.1 目的

Turborepo or Nx を導入し、affected graph に基づく coverage 実行・キャッシュで CI を高速化しつつ依存波及を捕捉する。

### 2.2 最終ゴール（想定 AC）

1. ビルドシステム選定（Turborepo / Nx）が runbook で確定
2. `turbo.json` or `nx.json` に coverage タスクの dependsOn / outputs / cache が定義される
3. CI で affected only モードと full モードを切替可能
4. coverage-guard.sh が affected coverage と full coverage の両モードに対応
5. CI 実行時間が現状比 X% 削減（baseline と比較）

### 2.3 スコープ

#### 含むもの

- Turborepo / Nx 選定 ADR
- 設定ファイル設計
- coverage-guard.sh の affected モード対応
- CI workflow の affected 切替設計

#### 含まないもの

- coverage 80% 閾値の変更
- vitest workspace 移行（U-3 で別タスク）

### 2.4 成果物

- ADR（Turborepo vs Nx 選定）
- `turbo.json` or `nx.json`
- `scripts/coverage-guard.sh` 拡張差分
- `.github/workflows/ci.yml` 追記

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- coverage-80-enforcement PR③ merge 済み（hard gate 化済みで safety net がある）
- vitest workspace 移行（U-3）が先行 or 並行できる体制

### 3.2 依存タスク

- 親: coverage-80-enforcement
- 関連: U-3（vitest workspace migration）

### 3.3 推奨アプローチ

選定 ADR を先行 PR で出し、設定導入とビルドキャッシュ確認を別 PR で段階導入。CI 時間削減の効果計測を PR description に必ず添付。

---

## 4. 苦戦箇所【記入必須】

`coverage-guard.sh --changed` は git diff ベースで軽量だが、依存 package への波及や cache hit/miss の再現性までは保証しない。Turborepo / Nx 導入は build system 全体の変更を伴うため、coverage 単独での導入では over-engineering となる。pnpm workspace + lefthook + Cloudflare Workers ビルドとの相性確認、既存 `.github/workflows/ci.yml` topology との整合（UT-CICD-WORKFLOW-TOPOLOGY-DRIFT）が課題。Nx は Plugin で機能が増える反面、Turborepo は薄く扱いやすいが affected 検知の精度差がある。

---

## 5. 影響範囲

- monorepo 全体（root `turbo.json` or `nx.json`）
- 各 package の `package.json` script（task 名統一）
- `scripts/coverage-guard.sh`
- `.github/workflows/ci.yml`

---

## 6. 推奨タスクタイプ

implementation / NON_VISUAL（ビルドシステム導入）

---

## 7. 参照情報

- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-1
- 親 index: `docs/30-workflows/coverage-80-enforcement/index.md`
- Turborepo docs: https://turbo.build/repo/docs
- Nx docs: https://nx.dev
- 関連: `docs/30-workflows/unassigned-task/ut-cicd-workflow-topology-drift-001.md`

---

## 8. 備考

本タスクは規模が大きく、coverage 単独での導入は不釣り合い。実際の起動条件は「monorepo の package 数が現状の 2〜3 倍に増えた時点」または「CI 実行時間が許容上限に達した時点」を runbook で明示する。
