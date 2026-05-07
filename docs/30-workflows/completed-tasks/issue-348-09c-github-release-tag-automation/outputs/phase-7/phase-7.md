# Phase 7 正本: GitHub Actions workflow 仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 実装区分 | 実装仕様書 |
| 対象 | `.github/workflows/release-create.yml` |

## 目的
release tag push で `scripts/release/create-github-release.sh --apply --draft` を実行し、`workflow_dispatch` では dry-run artifact のみを生成する GitHub Actions workflow を仕様化する。`actionlint` clean と最小権限を担保する。

## Step 0: P50 チェック（必須）
- [ ] `which actionlint` が成功
- [ ] `gh auth status` が authenticated（CI 上は `GITHUB_TOKEN` で代替）
- [ ] log: `actionlint --version 2>&1 | tee outputs/phase-7/p50-precheck.log`

## 7-A. トリガ仕様

| トリガ | 条件 |
| --- | --- |
| `on.push.tags` | pattern `v*` (実検証は script 側 regex で `vYYYYMMDD-HHMM` を強制) |
| `on.workflow_dispatch.inputs.tag` | required `true`、type `string` |

`workflow_dispatch` の input は手動 fallback / 既存 tag からの dry-run に利用する。dispatch から release mutation は実行しない。

## 7-B. permissions / secrets

| 項目 | 値 |
| --- | --- |
| `permissions.contents` | `write`（release / tag 書き込み必須） |
| その他 permissions | 全て `none`（最小権限原則） |
| secrets | `GITHUB_TOKEN` のみ（自動付与）。Cloudflare 系 secret は本 workflow では使わない |

## 7-C. job steps（仕様）

1. `actions/checkout@v4` で `fetch-depth: 0` 指定（tag 解決のため履歴必要）
2. tag 解決: push トリガ時は `${{ github.ref_name }}`、dispatch 時は `${{ inputs.tag }}` を `TAG` env に格納
3. `gh auth setup` は不要（`GITHUB_TOKEN` を `env.GH_TOKEN` に渡せば `gh` が自動利用）
4. release 作成 step:
   ```yaml
   env:
     GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     TAG: ${{ ... }}
   run: bash scripts/release/create-github-release.sh --apply --draft --tag "$TAG" --target "$GITHUB_SHA" --changelog-path <path> --evidence-url <url>
   ```
5. 出力 release URL を `$GITHUB_STEP_SUMMARY` に記録（人間確認用）

## 7-D. actionlint 適合条件

| 観点 | ルール |
| --- | --- |
| YAML | tab 禁止 / 2-space indent |
| script step | `shell: bash` 明示、`run: |` の冒頭に `set -euo pipefail` |
| expression | `${{ ... }}` を `run` 直接に展開せず env 経由で渡す（injection 回避） |
| ref | action は SHA pin か major tag (`@v4`) を採用、unpin 禁止 |

## 7-E. 失敗時の挙動

- script の exit 2/3/4/5 はそのまま job 失敗となる（`continue-on-error` 設定しない）
- 失敗時は GitHub Actions の job log と `$GITHUB_STEP_SUMMARY` を runbook (Phase 8) のトラブルシュート手順から参照する
- 同名 release 既存時は script 側で exit 5 となるため、workflow 側で重複検出する手前 step は不要

## 7-F. 検証コマンド（spec 段階で実行可能なもの）

```bash
actionlint .github/workflows/release-create.yml \
  2>&1 | tee outputs/phase-7/actionlint.log
```

期待: 0 exit / no findings。

## 動作確認チェックリスト
- [ ] 2 トリガ仕様確定
- [ ] `permissions: contents: write` 最小化確定
- [ ] env 経由で `${{ ... }}` を展開する injection 対策確定
- [ ] actionlint clean 条件確定

## 次 Phase の前提条件
runbook (Phase 8) で本 workflow の失敗・rollback 経路が文書化されること。
