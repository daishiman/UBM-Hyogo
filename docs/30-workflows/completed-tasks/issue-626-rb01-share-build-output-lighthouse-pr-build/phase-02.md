# Phase 2: 設計


## 目的

Issue #626 RB-01 の Phase 2 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 2 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 採用アーキテクチャ

`pr-build-test.yml` を 2 job 構成へ拡張する。`lighthouse.yml` は削除する。

```
pr-build-test.yml
├── job: build-test (既存 / 拡張)
│   - checkout, mise, install, typecheck, lint, build, build:cloudflare, verify
│   - NEW: upload-artifact (name: next-build-${{ github.sha }}, path: apps/web/.next)
└── job: lighthouse-ci (新規・needs: build-test)
    - checkout (same SHA)
    - mise, install (--frozen-lockfile, --offline 不要)
    - download-artifact → apps/web/.next を復元
    - pnpm --filter @ubm-hyogo/web start &
    - wait for localhost:3000
    - lhci autorun
    - upload-artifact (name: lhci-report-${{ github.sha }})
```

## job 名 / status check 名

| job key | job name (status check context) | required |
| --- | --- | --- |
| `build-test` | `build-test` | ✅ |
| `lighthouse-ci` | `lighthouse-ci` | ✅ |

branch protection `contexts` を変更しない不変条件のため、`name:` 値は厳密にこの 2 つを維持する。

## artifact 仕様

| name | path | retention | upload job | download job |
| --- | --- | --- | --- | --- |
| `next-build-${{ github.sha }}` | `apps/web/.next` | 1 day | `build-test` | `lighthouse-ci` |
| `lhci-report-${{ github.sha }}` | `.lighthouseci/` | 7 days | `lighthouse-ci` | — |

除外パターン:
- `apps/web/.next/cache/**`（Next.js build cache。Lighthouse 起動には不要）
- `apps/web/.next/standalone/**`（Cloudflare build 用。本 artifact からは除く）

## permissions

```yaml
permissions: {}

jobs:
  build-test:
    permissions:
      contents: read
  lighthouse-ci:
    permissions:
      contents: read
```

artifact 共有は同一 workflow / 同一 run 内で完結するため `actions` 権限の昇格は不要。

## トリガ

`pull_request:` をそのまま使用し、Lighthouse の実行対象は **dev base PR のみ**に固定する。現行 `.github/workflows/lighthouse.yml` は `pull_request.branches: [dev]` で運用されており、RB-01 の目的は build output 共有であって required check の適用 branch 拡大ではないため、統合後の `lighthouse-ci` job に `if: github.base_ref == 'dev'` を付与する。`build-test` job は現行 `pr-build-test.yml` と同じく全 PR で継続する。

## concurrency

統合後、`pr-build-test.yml` 既存の `concurrency` が無ければ新規に追加する:

```yaml
concurrency:
  group: pr-build-test-${{ github.ref }}
  cancel-in-progress: true
```

旧 `lighthouse-${{ github.ref }}` group は削除される。

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 2 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-02.md`
- Phase 2 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] job DAG / artifact 仕様 / permissions / トリガ / concurrency が本ファイルに表で固定されている
- branch protection contexts と整合する job name が明示されている
