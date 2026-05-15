# fix-wrangler-esbuild-import-source-error

[実装区分: 実装仕様書]
[workflow_state: implemented_local_evidence_captured]
[implementation_mode: dependency-hotfix]
[task_classification: NON_VISUAL / バグ修正(CI/CD インフラ)]
[taskType: implementation]
[visualEvidence: NON_VISUAL]

## 1. 概要

`web-cd` / `backend-ci` の `deploy-staging` job が、wrangler 4.85.0 のビルドステップで以下のエラーを出して落ちている:

```
✘ [ERROR] Build failed with 1 error:
  ✘ [ERROR] "import-source" is not a valid feature name for the "supported" setting
```

両 job とも `wrangler 4.85.0` が内部で起動する esbuild に `supported: { "import-source": ... }` を渡すが、リポジトリ root の `package.json#pnpm.overrides.esbuild = "0.25.4"` が monorepo 全体の esbuild を 0.25.4 に固定していた。実測では `wrangler@4.85.0` の `dependencies.esbuild` は `0.27.3` であり、wrangler 側の要求版と override が不一致だった。

## 2. 影響範囲

| 対象 | 失敗 workflow | 失敗 step |
|------|--------------|-----------|
| `apps/web` (OpenNext Workers) | `.github/workflows/web-cd.yml` (`web-cd`) | `Deploy to Cloudflare Workers (staging)` (cf.sh 経由) |
| `apps/api` (Hono) | `.github/workflows/backend-ci.yml` (`backend-ci`) | `Apply D1 migrations` 以降の wrangler deploy（`cloudflare/wrangler-action@v3`） |

production deploy (`main` push 時) も同経路のため同様に失敗する。

## 3. 根本原因

- `wrangler 4.85.0` は `dependencies.esbuild = 0.27.3` を要求する。
- リポジトリ root `package.json` で `pnpm.overrides.esbuild = "0.25.4"` を指定しており、`pnpm-lock.yaml` でも全 esbuild parent が `@esbuild/<platform>@0.25.4` に固定されている。
- override により wrangler 実行時の esbuild も 0.25.4 へ寄せられ、wrangler が期待する feature set とずれるため `Build failed` で停止する。
- `cf.sh` のラッパーは `ESBUILD_BINARY_PATH` を `node_modules/wrangler/node_modules/@esbuild/.../esbuild` に固定しようとするが、pnpm overrides により wrangler 配下にも 0.25.4 が hoist / link されており同一バイナリ。

## 4. 不変条件

1. monorepo の esbuild バージョン整合は維持する（`@opennextjs/cloudflare` ビルド経路でも esbuild が直接呼ばれるため、wrangler / OpenNext の双方で動作する版を選ぶ）。
2. wrangler のバージョン (`4.85.0`) は本タスクで変更しない。`package.json` 3箇所（root / apps/web / apps/api）の wrangler 指定はそのまま。
3. ローカル限定エンドポイントや 1Password 参照などの既存 secret 不変条件は変更しない。
4. CI/CD workflow ファイルの構造 (`web-cd.yml` / `backend-ci.yml`) は変更しない。esbuild override の解決のみで修復する。

## 5. スコープ

含む:
- `package.json#pnpm.overrides.esbuild` の値変更（または override 削除）
- `pnpm-lock.yaml` の再生成
- ローカルでの `pnpm build` / `pnpm --filter @ubm-hyogo/web build:cloudflare` / `pnpm --filter @ubm-hyogo/api build`（または `wrangler deploy --dry-run`）による回帰確認
- `scripts/cf.sh` 内コメント（pnpm.overrides の運用方針）の追従更新（必要に応じて）

含まない:
- wrangler / `@opennextjs/cloudflare` 本体のメジャー upgrade
- D1 migration / Workers Secret の変更
- 新規 CI gate 追加

## 6. Phase 構成

| Phase | 名称 | 主成果物 |
|-------|------|---------|
| 1 | 要件定義・前提確認 | `outputs/phase-1/requirements.md` |
| 2 | esbuild バージョン選定設計 | `outputs/phase-2/design.md` |
| 3 | 設計レビュー | `outputs/phase-3/review.md` |
| 4 | 検証コマンド設計（RED） | `outputs/phase-4/test-plan.md` |
| 5 | 実装（override 更新 + lockfile 再生成） | `outputs/phase-5/implementation-log.md` |
| 6 | テスト拡充（dry-run / build / deploy 想定） | `outputs/phase-6/extra-tests.md` |
| 7 | カバレッジ確認（変更ファイル限定） | `outputs/phase-7/coverage.md` |
| 8 | リファクタリング（cf.sh コメント整合） | `outputs/phase-8/refactor.md` |
| 9 | 品質保証 | `outputs/phase-9/qa.md` |
| 10 | 最終レビュー | `outputs/phase-10/final-review.md` |
| 11 | 手動テスト (NON_VISUAL) | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` |
| 12 | ドキュメント更新 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| 13 | PR 作成 | ユーザー明示承認後のみ |

## 7. 完了条件 (DoD)

- `mise exec -- pnpm install --frozen-lockfile=false` がローカルで成功する。
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run`（または `wrangler deploy --dry-run --env staging`）が `apps/api` で成功する。
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が成功する。
- `web-cd` / `backend-ci` の `deploy-staging` job が `dev` ブランチへの push で green になる（Phase 13 のユーザー承認後、PR merge commit で確認）。
- Phase 12 strict 7 成果物が `outputs/phase-12/` に存在する。
