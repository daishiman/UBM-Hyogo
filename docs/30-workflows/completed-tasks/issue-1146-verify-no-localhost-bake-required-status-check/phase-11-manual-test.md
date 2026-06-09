# Phase 11: 手動テスト

本タスクは CI ガバナンス / branch protection 設定変更を伴う **実装仕様書（implemented_local_runtime_pending）** であり、UI/UX 変更を一切伴わない。
本 Phase では手動テスト計画（検証観点・実行手順・証跡配置）を規定する。
**実証跡は `outputs/phase-11/manual-test-result.md`（既存）に記録済み**であり、本ファイルはその計画書として扱う。

---

## 1. NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | CI workflow trigger 変更（1 ファイル）+ GitHub branch protection の required status check 登録 |
| 非視覚的理由 | 画面描画の変化が存在しない。成果物は `.github/workflows/verify-no-localhost-bake.yml` の paths 除去と branch protection の `required_status_checks.contexts` 追加であり、UI レンダリングに影響しない |
| 代替証跡 | read-only 調査の再現ログ（branch protection GET / workflow paths-filter 確認 / gate 整合）。`outputs/phase-11/manual-test-result.md` に記録 |
| screenshot を作らない理由 | 描画対象が存在しないため。NON_VISUAL のため `screenshots/` ディレクトリは作成しない |

---

## 2. 証跡の主ソース

主ソースは **read-only 調査再現**であり、以下 3 点を検証する。

| # | 検証観点 | 手段 | 実行区分 |
| --- | --- | --- | --- |
| 検証 1 | gate 本体（yml / .sh / .spec.ts）が landed 済みで動作する | `ls` + `git log --grep=localhost-bake` | pre-gate 可（read-only） |
| 検証 2 | `dev` / `main` の `required_status_checks.contexts` に `verify-no-localhost-bake` が不在 | `gh api .../branches/{dev,main}/protection --jq '.required_status_checks.contexts'` | pre-gate 可（read-only GET） |
| 検証 3 | 既存 required check 全 workflow が paths フィルタなし（常時実行）で、`verify-no-localhost-bake.yml` のみ paths 付き | 各 workflow yml の `on.pull_request.paths` 行確認 | pre-gate 可（read-only） |

---

## 3. 実行手順

### 3-1. pre-gate（read-only・本 prompt で実行可能）

```bash
# 検証 1: gate 本体の存在と landed commit
ls -la .github/workflows/verify-no-localhost-bake.yml
ls -la scripts/verify-no-localhost-bake.sh scripts/verify-no-localhost-bake.spec.ts
git log --oneline --all --grep="localhost-bake"

# 検証 2: branch protection の現 contexts（before evidence の素材）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  --jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'

# 検証 3: 既存 required check の trigger 規約（paths なし）
grep -nA2 "pull_request" .github/workflows/ci.yml .github/workflows/validate-build.yml \
  .github/workflows/e2e-tests.yml .github/workflows/lighthouse.yml
```

期待結果:
- 検証 1: 3 ファイルとも存在。`git log` は gate 実装 commit（8f7d4faca / 6aee9fcba）のみ。
- 検証 2: 両 branch とも `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]`（`verify-no-localhost-bake` 不在）。
- 検証 3: 既存 4 workflow は paths フィルタなし。`verify-no-localhost-bake.yml` のみ paths 付き。

### 3-2. local 実装後検証（本 cycle で実行済み）

| # | 検証 | 手段 | 期待 |
| --- | --- | --- | --- |
| M-1 | paths 除去後の yml が常時実行になる | edit 後の `.github/workflows/verify-no-localhost-bake.yml` に `paths:` ブロックが存在しないこと | grep `paths:` でヒット 0 |
| M-2 | grep LOGIC 不変 | `scripts/verify-no-localhost-bake.sh` / `.spec.ts` の diff が空 | 無変更 |

### 3-3. mutation 後検証（user-gated 後にのみ実行可能）

| # | 検証 | 手段 | 期待 |
| --- | --- | --- | --- |
| M-3 | dev/main の after contexts | after GET evidence に既存 5 + `verify-no-localhost-bake` が並ぶ | 6 件 |
| M-4 | governance drift なし | after GET の `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / linear_history / conversation_resolution が before と一致 | drift 0 |

---

## 4. 証跡ファイル

| 種別 | パス | 取得タイミング |
| --- | --- | --- |
| 手動テスト結果（NON_VISUAL 証跡メタ） | `outputs/phase-11/manual-test-result.md`（**既存・本タスクで参照**） | 本 prompt（read-only 再現済） |
| before evidence | `outputs/phase-13/branch-protection-current-{dev,main}.json` | pre-gate 可 |
| after evidence | `outputs/phase-13/branch-protection-after-{dev,main}.json` | **user-gated** 後 |

実証跡（read-only 再現の結果）は **`outputs/phase-11/manual-test-result.md` を正本**とする。本ファイルはその計画と検証観点の整理に留める。

---

## 5. 判定

read-only 検証 1〜3 と local 実装後検証 M-1〜M-2 は `outputs/phase-11/manual-test-result.md` で **PASS（implemented_local_runtime_pending）** として確認済み。
mutation 後検証（M-3〜M-4）は user-gated 後に実行する。本 Phase の計画としての判定は **PASS**。
