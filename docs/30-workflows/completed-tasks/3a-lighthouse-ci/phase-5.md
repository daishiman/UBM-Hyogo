# Phase 5: 実装（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-4.md` |
| 出力 | 新規/編集ファイル一覧 / 差分（diff 形式） / step 列挙 / 依存追加コマンド |
| implementation_mode | `new` |

---

## 0. 実装サマリ

| ID | 影響ファイル | 種別 | コミット粒度 |
|----|--------------|------|-------------|
| F-01 | `lighthouserc.json` | new | C1 |
| F-02 | `.github/workflows/lighthouse.yml` | new | C1 |
| F-03 | `apps/web/package.json` | edit（`devDependencies` に `@lhci/cli` 追加） | C1 |
| F-04 | `pnpm-lock.yaml` | regenerate | C1 |

すべて単一コミット C1 として PR-A に積む（CONST_007 single cycle）。

---

## 1. 新規ファイル: `lighthouserc.json`（プロジェクトルート）

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

> Q-02 で `/profile` 縮退判定が出た場合は `ci.collect.url` 配列から該当行のみ削除する（他フィールド変更なし・Phase 7 で確定）。

---

## 2. 新規ファイル: `.github/workflows/lighthouse.yml`

```yaml
name: lighthouse-ci

on:
  pull_request:
    branches: [dev]

concurrency:
  group: lighthouse-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lighthouse:
    name: lighthouse-ci
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - uses: actions/setup-node@v4
        with:
          node-version: 24.15.0
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build (Next.js production)
        run: pnpm --filter @ubm-hyogo/web build

      - name: Start server (background)
        run: pnpm --filter @ubm-hyogo/web start &

      - name: Wait for server
        run: |
          for i in {1..60}; do
            curl -fsS http://localhost:3000 >/dev/null && exit 0
            sleep 1
          done
          echo "Timed out waiting for http://localhost:3000"
          exit 1

      - name: Run Lighthouse CI
        run: pnpm exec lhci autorun --config=./lighthouserc.json

      - name: Upload Lighthouse artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lhci-report-${{ github.sha }}
          path: .lighthouseci/
          retention-days: 7
```

### 2.1 step 列挙 table

| # | step | run / uses | 依存 |
|---|------|-----------|------|
| 1 | checkout | `actions/checkout@v4` | — |
| 2 | pnpm setup | `pnpm/action-setup@v4` (`version: 10.33.2`) | — |
| 3 | node setup | `actions/setup-node@v4` (`node-version: 24.15.0` / `cache: pnpm`) | step 2 |
| 4 | install | `pnpm install --frozen-lockfile` | step 3 |
| 5 | build | `pnpm --filter @ubm-hyogo/web build` | step 4 |
| 6 | start | `pnpm --filter @ubm-hyogo/web start &`（background） | step 5 |
| 7 | wait | `curl retry loop for http://localhost:3000` | step 6 |
| 8 | lhci | `pnpm exec lhci autorun --config=./lighthouserc.json` | step 7 |
| 9 | upload | `actions/upload-artifact@v4` (`if: always()`) | — |

---

## 3. 編集: `apps/web/package.json`

```diff
   "devDependencies": {
+    "@lhci/cli": "^0.14.0",
     ...
   }
```

ルートに置かず `apps/web` 配下とする理由: build/start 操作と同じ workspace 内で完結させるため。`pnpm dlx` 経由でも動くが lockfile ピン化のため devDep に追加する。

---

## 4. 依存追加コマンド

```bash
# 1) 依存追加
mise exec -- pnpm --filter @ubm-hyogo/web add -D @lhci/cli@^0.14.0

# 2) lockfile を commit 対象に追加
git add apps/web/package.json pnpm-lock.yaml lighthouserc.json .github/workflows/lighthouse.yml

# 3) コミット
git commit -m "feat(ci): add Lighthouse CI gate for 4 routes (perf>=80 / a11y>=90 / bp>=90 / seo>=80)"
```

---

## 5. 関数シグネチャ / 入出力（実装）

| 区分 | 値 |
|------|----|
| 新規関数 | なし（YAML / JSON 設定追加のみ） |
| 入力 | PR の HEAD（`pull_request` event） |
| 出力 | check-run `lighthouse-ci` (`success` / `failure`) / artifact `lhci-report-${{ github.sha }}` |

---

## 6. token / secret

| 名前 | 用途 | 設定先 |
|------|------|--------|
| `GITHUB_TOKEN` | actions 標準 | auto-provided |
| 追加 secret | 不要 | — |

---

## 7. ローカル実行コマンド（実装後の自己検証）

```bash
# 構文 / schema
jq . lighthouserc.json
mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json
mise exec -- pnpm dlx actionlint .github/workflows/lighthouse.yml

# smoke（Phase 4 §2.1 と同等）
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start &
for i in {1..60}; do curl -fsS http://localhost:3000 >/dev/null && break; sleep 1; done
mise exec -- pnpm exec lhci autorun --config=./lighthouserc.json
```

---

## 8. PR 構成

| PR | 含むファイル | base | head |
|----|-------------|------|------|
| PR-A（本 Phase 13） | `lighthouserc.json` / `.github/workflows/lighthouse.yml` / `apps/web/package.json` / `pnpm-lock.yaml` | `dev` | `feat/lighthouse-ci` |

> 3b（e2e-tests hard gate）/ 3c（branch protection contexts）は別 PR / 別オペレーション。本 PR-A には混入させない。

---

## 9. DoD（Phase 5 完了条件）

| # | 条件 |
|---|------|
| D-01 | F-01..F-04 全ファイルが Phase 4 §7 の自己検証を pass |
| D-02 | `git diff --stat` が想定 4 ファイルのみ |
| D-03 | actionlint / jq / lhci healthcheck で violation 0 |

---

## 10. 引き継ぎ（Phase 6 へ）

| 項目 | 内容 |
|------|------|
| 自己テスト対象 | Phase 4 §2 / §3 のローカル run |
| CI minute 制約 | Phase 6 で 1 PR あたりの実 run 時間目安を確定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 5
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

`lighthouserc.json` / `.github/workflows/lighthouse.yml` / `apps/web/package.json` の差分を確定し、依存追加コマンドと PR 構成を確定する。

## 実行タスク

- F-01..F-04 の差分を確定。
- step 9 件を列挙。
- 依存追加コマンドを集約。
- token 要件を確定。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-5.md §1
- phase-2.md / phase-4.md（本サブタスク内）

## 実行手順

1. F-01..F-04 を新規/編集する。
2. `pnpm add -D` で依存追加し lockfile を commit する。
3. Phase 4 自己テストを通す。
4. PR-A を作成（Phase 13）。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- F-01..F-04 の差分（実装）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
