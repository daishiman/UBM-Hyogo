# Phase 4: 詳細実装計画


## 目的

Issue #626 RB-01 の Phase 4 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 4 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 変更対象ファイル（CONST_005）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `.github/workflows/pr-build-test.yml` | 編集 | `build-test` job の標準 `Build` 直後に upload-artifact step を追加 / `lighthouse-ci` job を新規追加 / `concurrency` を追加 |
| `.github/workflows/lighthouse.yml` | 削除 | 全機能を `pr-build-test.yml` の `lighthouse-ci` job に集約 |
| `docs/30-workflows/e2e-quality-uplift/backlog.md` | 編集 | RB-01 行の `Status` を `implemented-local-runtime-pending` に更新し `Notes` に統合先 workflow と runtime pending 境界を追記 |
| `docs/runbooks/ci-workflow-overview.md` (存在すれば) | 編集 | Lighthouse job 統合の追記。存在しなければ新規作成しない |

## 関数 / モジュールシグネチャ

YAML のみのため関数シグネチャは適用外。ただし key step の input は以下:

### `build-test` job 追加 step

```yaml
- name: Upload Next.js build output
  uses: actions/upload-artifact@<v4-pinned-sha>
  with:
    name: next-build-${{ github.sha }}
    path: |
      apps/web/.next
      !apps/web/.next/cache
      !apps/web/.next/standalone
    retention-days: 1
    if-no-files-found: error
```

配置不変条件: この step は標準 `Build` step 直後、`Build (Cloudflare standalone)` より前に置く。OpenNext build は `apps/web/open-next.config.ts` 経由で標準 build を再実行するため、Lighthouse 用 artifact はその前に固定する。

### `lighthouse-ci` job 新規

```yaml
lighthouse-ci:
  name: lighthouse-ci
  if: github.base_ref == 'dev'
  needs: build-test
  runs-on: ubuntu-latest
  timeout-minutes: 15
  permissions:
    contents: read
  steps:
    - name: Checkout PR head
      uses: actions/checkout@<v4-pinned-sha>
      with:
        ref: ${{ github.event.pull_request.head.sha }}
        persist-credentials: false

    - name: Setup mise (Node 24 + pnpm 10)
      uses: jdx/mise-action@<v2-pinned-sha>
      with:
        cache: true

    - name: Install dependencies
      run: mise exec -- pnpm install --frozen-lockfile

    - name: Download Next.js build output
      uses: actions/download-artifact@<v4-pinned-sha>
      with:
        name: next-build-${{ github.sha }}
        path: apps/web/.next

    - name: Start server (background)
      run: mise exec -- pnpm --filter @ubm-hyogo/web start &

    - name: Wait for server
      run: |
        for i in {1..60}; do
          curl -fsS http://localhost:3000 >/dev/null && exit 0
          sleep 1
        done
        echo "Timed out waiting for http://localhost:3000"
        exit 1

    - name: Run Lighthouse CI
      run: mise exec -- pnpm --filter @ubm-hyogo/web exec lhci autorun --config=../../lighthouserc.json

    - name: Upload Lighthouse artifact
      if: always()
      uses: actions/upload-artifact@<v4-pinned-sha>
      with:
        name: lhci-report-${{ github.sha }}
        path: .lighthouseci/
        retention-days: 7
```

`<...-pinned-sha>` は Phase 3 で確定した SHA に置換する。

## 入出力 / 副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `pull_request` event payload, repo source |
| 出力 | `next-build-${{ github.sha }}` artifact (1d), `lhci-report-${{ github.sha }}` artifact (7d), `build-test` / `lighthouse-ci` job status（current required context は `lighthouse-ci`） |
| 副作用 | GitHub Actions の artifact storage 利用増（短期間のみ） |

## テスト方針

| テスト | 種別 | 配置 | 期待結果 |
| --- | --- | --- | --- |
| actionlint | static | local + (CI に既存なら自動) | `pr-build-test.yml` で error 0 件 |
| 既存 patch script regression test | unit | `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` | 既存通り PASS |
| dry-run PR | integration | 本タスク自身の PR | `build-test` PASS → `lighthouse-ci` PASS、`lighthouse-ci` run log に `build` step が存在しない |
| `.next/` artifact secret grep | safety | `outputs/phase-11/preflight/next-secret-grep.txt` | secret 0 件 |

## ローカル実行 / 検証コマンド

```bash
# actionlint
mise exec -- actionlint .github/workflows/pr-build-test.yml

# Next.js build と start を手動再現
mise exec -- pnpm install --frozen-lockfile
mise exec -- bash -c 'NODE_ENV=production pnpm --filter @ubm-hyogo/web build'
mise exec -- pnpm --filter @ubm-hyogo/web start &
for i in {1..60}; do curl -fsS http://localhost:3000 >/dev/null && break; sleep 1; done

# Lighthouse CI 単体
mise exec -- pnpm --filter @ubm-hyogo/web exec lhci autorun --config=../../lighthouserc.json

# 既存 regression test
mise exec -- node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs

# secret grep
grep -rE "(CLOUDFLARE_API_TOKEN|AUTH_SECRET|GITHUB_TOKEN|SENTRY_AUTH_TOKEN)" apps/web/.next/ || echo "no secret found"
```

## DoD (Definition of Done)

- [ ] `.github/workflows/pr-build-test.yml` に `lighthouse-ci` job が追加されている
- [ ] `.github/workflows/lighthouse.yml` が削除されている
- [ ] `actionlint` が error 0 件
- [ ] dry-run PR で `build-test` / `lighthouse-ci` が両方 PASS
- [ ] `lighthouse-ci` run log に `pnpm ... build` step が存在しない
- [ ] branch protection `contexts` から current required context `lighthouse-ci` が外れていない。`build-test` は `needs` dependency として接続されている
- [ ] `backlog.md` の RB-01 status が更新されている
- [ ] artifact secret grep で 0 件

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 4 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- Phase 3 (`phase-03.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-04.md`
- Phase 4 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] Phase 4 の実行タスクが本文に反映されている。
- [ ] 参照資料と成果物が矛盾していない。
