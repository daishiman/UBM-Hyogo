# task-01: web-cd workflow の secret 名を実 Environment に整合させる（実装仕様書）

| 項目 | 値 |
|------|----|
| workflow id | `ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment` |
| 親ワークフロー | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/`（spec / 設計の正本） |
| 実装区分 | **実装仕様書** |
| base branch | `dev` |
| feature branch（想定） | `fix/web-cd-secret-name-alignment` |
| 起票日 | 2026-05-09 |
| CONST_007 | single cycle |
| 適用 tier | NON_VISUAL（CI workflow YAML 編集のみ・UI 影響なし） |
| 正本 | 本ディレクトリ + 親 `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md` |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | n/a（YAML 編集 + 手動 grep gate のみ） |
| workflow_state | implemented_local_runtime_pending |
| evidence_state | runtime_pending（dev/main GitHub Actions は user approval 後） |
| implementation_mode | edit |

---

## 目的（task-01 スコープ）

`.github/workflows/web-cd.yml` が参照する Cloudflare API token の secret 名 (`CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION`) が GitHub Environment に存在しないため、env `CLOUDFLARE_API_TOKEN` が空となり `cf.sh` が op fallback で fail している。実 Environment に登録済みの `CLOUDFLARE_API_TOKEN` を参照する形に**workflow 側を整合**させ、CI runner 上で `op` を呼ばずに deploy を成功させる。

task-02（runtime-smoke-staging readiness gate）は本仕様書のスコープ外。

---

## スコープ境界

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/web-cd.yml` の `deploy-staging` / `deploy-production` 両 job の secret 参照名置換 | `.github/workflows/runtime-smoke-staging.yml` の編集（task-02） |
| 両 job への `Verify CF token is present` step 追加 | `scripts/cf.sh` ロジック書き換え（CONST: 不変条件 1） |
| YAML 構文・grep gate による静的検証 | secret 値そのものの登録・更新（ユーザー操作） |
| `dev` push 後の CI 観測 evidence | 既存 deploy step のロジック変更 |

---

## 受入基準

| # | 受入基準 | 検証方法 |
|---|----------|----------|
| AC-01 | `.github/workflows/web-cd.yml` から `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` 文字列が完全に消えている | `grep -n "CF_TOKEN_WORKERS" .github/workflows/web-cd.yml` が 0 件 |
| AC-02 | `secrets.CLOUDFLARE_API_TOKEN` が 2 箇所参照されている | `grep -c 'secrets.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml` == 2 |
| AC-03 | `Verify CF token is present` step が `deploy-staging` / `deploy-production` 両 job に存在する | `grep -c 'Verify CF token is present' .github/workflows/web-cd.yml` == 2 |
| AC-04 | `dev` push 後の `web-cd / deploy-staging` run で `[cf.sh] 1Password CLI (op) が見つかりません` が出ない | `gh run view --log` で当該文字列なし |
| AC-05 | `Deploy to Cloudflare Workers (staging)` step が exit 0 で完了する | `gh run view --log-failed` で fail なし |
| AC-06 | secret 実値が commit / PR 本文 / コードのいずれにも残らない | `git log` / PR diff の目視・grep |

---

## 変更対象ファイル（CONST_005 inventory）

| path | 種別 | 役割 |
|------|------|------|
| `.github/workflows/web-cd.yml` | edit | line 22 / 56 secret 名置換 + `Verify CF token is present` step を 2 箇所追加 |

他ファイル変更なし。`scripts/cf.sh` は変更禁止。

---

## 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | GitHub Environment `staging` / `production` に `CLOUDFLARE_API_TOKEN` が登録済み | 確認済（phase-1.md §A） |
| depends-on | Repo Variable `CLOUDFLARE_ACCOUNT_ID` が登録済み | 確認済 |
| 並列性 | task-02 と並列 PR 可（ファイル衝突なし） | — |
| blocks | なし | — |

---

## 不変条件（task-01 固有）

1. `scripts/cf.sh` を変更しない（ローカル op 経路を維持）
2. CI 内で 1Password CLI (`op`) を呼ばない
3. secret 値そのものを workflow / commit / PR 本文に書かない
4. `production` 側も同じ修正を行う（`dev → main` リリース時の deploy も同症状になるため、今サイクルで両方解消）
5. 既存 `mise-action@v2` / `pnpm/action-setup@v4` / `actions/checkout@v4` 等の major version 固定を維持
6. `Verify CF token is present` step は `actions/checkout@v4` の **後**、`Install dependencies` の **前**（mise-action の後）に配置する

---

## Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | spec | `phase-1.md` |
| 2 | 設計 | spec | `phase-2.md` |
| 3 | 設計レビュー | spec | `phase-3.md` |
| 4 | テスト作成 | spec | `phase-4.md` |
| 5 | 実装 | completed | `phase-5.md` |
| 6 | テスト拡充 | completed | `phase-6.md` |
| 7 | カバレッジ確認 | spec | `phase-7.md` |
| 8 | リファクタリング | spec | `phase-8.md` |
| 9 | 品質保証 | spec | `phase-9.md` |
| 10 | 最終レビュー | spec | `phase-10.md` |
| 11 | 手動テスト / Evidence | runtime_pending | `phase-11.md` |
| 12 | ドキュメント更新 | completed | `phase-12.md` |
| 13 | PR 作成 | spec | `phase-13.md` |

---

## 親ワークフローからの抽出ルール

本仕様書は親 `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md` から **task-01 関連箇所のみ** を抽出して構成する。

| 抽出元 | 抽出先 |
|--------|--------|
| 親 phase-1.md §原因 A | 本 phase-1.md |
| 親 phase-2.md §D1 / §web-cd.yml contract | 本 phase-2.md / phase-3.md |
| 親 phase-3.md §task-01 行 | 本 phase-3.md |
