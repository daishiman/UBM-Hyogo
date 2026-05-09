# Phase 2: 設計（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` |
| 出力 | `lighthouserc.json` schema / `.github/workflows/lighthouse.yml` job 定義 / artifact upload 仕様 |

---

## 1. `.github/workflows/lighthouse.yml` 構造

| section | 値 |
|---------|----|
| `name` | `lighthouse-ci` |
| `on` | `pull_request: { branches: [dev] }` |
| `concurrency.group` | `lighthouse-${{ github.ref }}` |
| `concurrency.cancel-in-progress` | `true` |
| `jobs.lighthouse.name` | `lighthouse-ci`（context 名と完全一致） |
| `jobs.lighthouse.runs-on` | `ubuntu-latest` |
| `jobs.lighthouse.timeout-minutes` | `15` |

### 1.1 step 順

| # | uses / run | 補足 |
|---|------------|------|
| 1 | `actions/checkout@v4` | — |
| 2 | `pnpm/action-setup@v4`（`version: 10.33.2`） | CLAUDE.md / `.mise.toml` と一致 |
| 3 | `actions/setup-node@v4`（`node-version: 24.15.0` / `cache: pnpm`） | 同上 |
| 4 | `run: pnpm install --frozen-lockfile` | — |
| 5 | `run: pnpm --filter @ubm-hyogo/web build` | production build |
| 6 | `run: pnpm --filter @ubm-hyogo/web start &` 後 `curl retry loop for http://localhost:3000` | バックグラウンド起動 + 起動完了待機 |
| 7 | `run: pnpm exec lhci autorun --config=./lighthouserc.json` | assertion 実行 |
| 8 | `actions/upload-artifact@v4`（`if: always()` / `name: lhci-report-${{ github.sha }}` / `path: .lighthouseci/` / `retention-days: 7`） | 成功・失敗両方で保存 |

### 1.2 関数シグネチャ / 入出力

本タスクは workflow YAML / JSON 設定追加のみ。新規関数定義なし。
入力: PR の HEAD（`pull_request` event）。
出力:
- check-run `lighthouse-ci`（success/failure）
- artifact `lhci-report-${{ github.sha }}`（`.lighthouseci/` 配下、HTML report ×4・assertion result JSON）

---

## 2. `lighthouserc.json` schema

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/members",
        "http://localhost:3000/profile",
        "http://localhost:3000/login"
      ],
      "numberOfRuns": 1,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance":   ["error", { "minScore": 0.80 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:best-practices":["error", { "minScore": 0.90 }],
        "categories:seo":           ["error", { "minScore": 0.80 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

> Next.js App Router の route group `(public)` はブラウザからは `/members` でアクセスする。
>
> Q-02 縮退時（`/profile` a11y < 0.90）は `ci.collect.url` 配列から `http://localhost:3000/profile` を削除し 3 routes 構成に縮退する（他フィールド変更なし）。

---

## 3. artifact upload 仕様

| name | path | retention | condition |
|------|------|-----------|-----------|
| `lhci-report-${{ github.sha }}` | `.lighthouseci/` | 7 日 | `if: always()` |

`.lighthouseci/` 配下の構造（lhci 0.14 デフォルト）:

| ファイル | 内容 |
|---------|------|
| `lhr-*.html` | 各 URL の Lighthouse HTML report |
| `lhr-*.json` | 各 URL の Lighthouse JSON report |
| `assertion-results.json` | assertion 判定の集計 |
| `manifest.json` | run メタデータ |

---

## 4. token / secret 要件

| 名前 | 用途 | 取得元 |
|------|------|--------|
| `GITHUB_TOKEN` | workflow 標準 | actions 自動付与 |
| `LHCI_GITHUB_APP_TOKEN`（任意） | GitHub Check 連携 | **採用しない**（`assert` の job 失敗で十分） |
| 追加 secret | 不要 | — |

---

## 5. リスク分析

| risk | 影響 | 緩和策 |
|------|------|--------|
| CI minute budget 超過 | 月次 GitHub Actions 無料枠の圧迫 | (a) `concurrency.cancel-in-progress=true` (b) `numberOfRuns: 1` (c) `preset: desktop` |
| Lighthouse perf スコアの環境依存ぶれ | localhost run でも CI ランナー負荷で perf 80 を割る | (a) `preset: desktop` 固定 (b) `pnpm start`（production build）で計測 (c) 連続観測で perf>=75 への緩和提案を Phase 11 で検討 |
| `/profile` 未認証 redirect で a11y 計測が `/login` に偏る | a11y スコア重複 | (a) `/profile` を Phase 7 で実測判定 (b) 必要なら lighthouserc から外し 3 routes 縮退 |
| context 名のタイポで gate が永久 pending | PR がブロックされて進行不能 | (a) workflow `name:` / job `name:` を context と完全一致 (b) 1 PR で実 run を観測してから 3c 適用 |
| `pnpm start` バックグラウンド起動失敗 | wait-on で timeout | (a) `wait-on` `--timeout 60000` (b) timeout 時は workflow が自然に fail |

---

## 6. 成果物 & テスト方針（前倒し）

| 検証 | コマンド | 期待 |
|------|---------|------|
| `lighthouserc.json` JSON 構文 | `jq . lighthouserc.json` | parse 成功 |
| `lighthouserc.json` schema | `pnpm exec lhci healthcheck --config=./lighthouserc.json` | exit 0 |
| `lighthouse.yml` 構文 | `pnpm dlx actionlint .github/workflows/lighthouse.yml` | violation 0 |
| route URL 重複なし | `jq '.ci.collect.url \| length, (. \| unique \| length)' lighthouserc.json` | 4 / 4（縮退時 3 / 3） |

---

## 7. DoD（Phase 2 完了条件）

| # | 条件 |
|---|------|
| D-01 | workflow YAML 構造（step 順 8 件・concurrency・timeout）が確定済 |
| D-02 | `lighthouserc.json` schema が JSON サンプル付きで確定済 |
| D-03 | artifact name / path / retention が確定済 |
| D-04 | リスク 5 件全てに緩和策が 1 対 1 で紐付き済 |
| D-05 | token 要件「追加 secret なし」が確定済 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3a Lighthouse CI 導入の workflow / lighthouserc / artifact 設計を JSON / YAML 構造レベルで確定する。

## 実行タスク

- workflow YAML 構造を step 順で確定する。
- lighthouserc JSON schema を確定する。
- artifact 設計を確定する。
- リスクと緩和策を 1:1 で紐付ける。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-2.md §1
- .claude/skills/task-specification-creator/references/phase-template-core.md

## 実行手順

1. 親 stage-3 phase-2 §1 を抽出。
2. step 順を本 phase に転記。
3. lighthouserc JSON サンプルを掲載。
4. リスク 5 件と緩和策を表化。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- Phase 5 で実装する `.github/workflows/lighthouse.yml` / `lighthouserc.json` の仕様確定

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスク自体は NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
