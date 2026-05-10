# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 1 |
| 状態 | spec_created |
| taskType | implementation |
| subtype | ci-config-cleanup |
| visualEvidence | NON_VISUAL |

## 目的

issue #331 残存 2 項目（apps/api wrangler vars 継承 warning / web-cd.yml の Pages → Workers 移行）の修正要件を確定する。

## 入力

- `apps/api/wrangler.toml`（修正対象、top-level `[vars]` と env vars の重複あり）
- `.github/workflows/web-cd.yml`（修正対象、`pages deploy` を実行中）
- `apps/web/wrangler.toml`（OpenNext Workers 構成済み、参照のみ）
- `scripts/cf.sh`（CI / ローカルの統一エントリ）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」
- 派生元: `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`

## P50 チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | Phase 5 で 2 サブタスク実装 |
| upstream にマージ済み | No | 未マージ |
| 前提タスク完了 | Yes（FIX-CF-ACCT-ID-VARS-001 / OpenNext Workers 移行） | 追加依存解消なし |

`implementation_mode = "new"`。

## 真の論点

> wrangler が emit する 2 種の runtime warning が CI ログを汚し、本物の問題を隠蔽する。発生箇所は (a) `apps/api/wrangler.toml` の vars 二重定義による継承無効化通知、(b) `apps/web` が Workers 構成へ移行済みなのに workflow が `pages deploy` を実行する不整合。

**根本原因**:
1. wrangler は top-level `[vars]` を `[env.X.vars]` 配下に**継承しない**。両方に同名キーがあると warning を出し、env 配下が prevail する。production / staging の vars は env-scoped のみで充足するため top-level 重複は冗長。
2. `apps/web/wrangler.toml` には `main = ".open-next/worker.js"` と `[assets]` が定義済みで Workers 構成だが、workflow は `cloudflare/wrangler-action@v3` で `command: pages deploy .next ...` を実行。Pages と Workers は別プロダクトのため警告/失敗の温床。CLAUDE.md 不変条件「`wrangler` を直接呼ばない」「`scripts/cf.sh` ラッパーのみ」にも違反。

## 入出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | apps/api/wrangler.toml, .github/workflows/web-cd.yml, apps/web/wrangler.toml |
| 出力 | warning ゼロの wrangler dry-run、green な web-cd staging run |
| 副作用 | 既存 staging Pages project が Workers にスイッチする可能性（Phase 2 で評価） |

## vars 整理方針（S1）

- top-level `[vars]` は **local-dev デフォルトとして最小集合**に絞る、または完全削除する。決定は Phase 2。
- `[env.production.vars]` と `[env.staging.vars]` を env-specific の正本とする。
- `[triggers]`, `[[d1_databases]]`, `[[analytics_engine_datasets]]`, `[[r2_buckets]]` 関連項目の bindings は既に env-scoped で重複定義されており、env 継承挙動の差はないことを確認する。

## Pages → Workers 移行方針（S2）

- workflow を `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>` に切り替える。
- `wrangler-action@v3` 経由で Workers deploy する代替案も検討（ただし CLAUDE.md 不変条件で `scripts/cf.sh` を優先）。
- Token 命名は現行 `CLOUDFLARE_API_TOKEN` を維持する。OIDC / step-scoped `CF_TOKEN_*` への cutover は別タスクの target contract であり、本タスクでは `web-cd.yml` から Pages 固有 variable を外すことに集中する。

## 受入条件マッピング

| AC | 確認方法 |
| --- | --- |
| AC-1 | grep で apps/api/wrangler.toml の top-level [vars] が env-specific キーを持たないこと |
| AC-2 | scripts/cf.sh deploy --dry-run の stderr に "vars" 関連 warning なし |
| AC-3 | web-cd.yml が `bash scripts/cf.sh deploy` または `wrangler deploy` 経路であること |
| AC-4 | grep -rn 'pages deploy' .github/workflows/ が 0 件 |
| AC-5 | gh workflow run web-cd.yml --ref dev が green |
| AC-6 | production CI ログに wrangler warning ゼロ |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | CI ログ品質改善・本番 Pages/Workers の不整合解消 |
| 実現性 | PASS | toml 編集 + yaml 編集の限定範囲 |
| 整合性 | PASS | CLAUDE.md 不変条件・OpenNext 移行と一致 |
| 運用性 | PASS | `scripts/cf.sh` 経路に統一、運用認知負荷を低減 |

## 完了条件

- [ ] 修正対象 2 ファイルの修正前 / 修正後の構造が表化されている
- [ ] vars 整理の判断軸（local-dev 最小 or 削除）が記載されている
- [ ] Pages → Workers 移行の代替案（`scripts/cf.sh` vs `wrangler-action`）が比較されている
- [ ] scope out 項目（Token renaming 等）が列挙されている

## 成果物

- `outputs/phase-01/main.md`

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

