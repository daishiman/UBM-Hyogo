# Phase 11 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | CI ガバナンス / branch protection 設定変更を伴う実装仕様書（implemented_local_runtime_pending） |
| 非視覚的理由 | UI / UX 変更を一切伴わない。成果物は CI workflow trigger 変更（1 ファイル）と GitHub branch protection の required status check 登録であり、画面描画の変化がない |
| 証跡の主ソース | 本ファイルに記録する read-only 調査再現ログ（branch protection GET / workflow paths-filter 確認 / gate 整合）。screenshot は作成しない |
| screenshot を作らない理由 | 描画対象が存在しないため。NON_VISUAL のため `screenshots/` ディレクトリは作成しない |

## 本タスク（implemented_local_runtime_pending）の検証範囲

本 cycle は Phase 1-13 タスク仕様書の更新に加え、`.github/workflows/verify-no-localhost-bake.yml` の paths-filter 除去を local 実装として実施した。branch protection mutation / commit / push / PR は user-gated であり本 cycle では実施しない。したがって本 Phase 11 では「仕様の前提が現コードと整合するか」と「local 実装後の gate が通るか」を確認する。

### 検証 1: gate 本体が landed 済みであること（調査再現）

```bash
ls -la .github/workflows/verify-no-localhost-bake.yml   # → 存在（945 bytes）
ls -la scripts/verify-no-localhost-bake.sh scripts/verify-no-localhost-bake.spec.ts  # → 存在
git log --oneline --all --grep="localhost-bake"          # → gate 実装 commit 8f7d4faca / 6aee9fcba のみ
```

結果: gate 本体は親 workflow で landed 済み・動作する。required check 登録のみが未実施であることを確認（PASS）。

### 検証 2: branch protection に context が未登録であること（read-only GET）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'
# → ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'
# → ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]
```

結果: 両 branch とも `verify-no-localhost-bake` 不在。proto-spec が前提とした context 集合（`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke`）とは不一致で、proto-spec が stale であることを確認（PASS）。

### 検証 3: paths-filter footgun の根拠（既存 required check の trigger 規約）

```bash
# 既存 required check 全 workflow の pull_request paths 行数を確認
# ci.yml / validate-build.yml / e2e-tests.yml / lighthouse.yml → いずれも paths 行 0（常時実行）
# verify-no-localhost-bake.yml → local 実装後は on.pull_request.paths 不在
```

結果: 既存 required check は全て paths フィルタなしで常時実行。`verify-no-localhost-bake.yml` も local 実装により paths フィルタなしへ整合した（PASS）。

### 検証 4: local 実装後の CI gate 回帰確認

```bash
tmpdir=$(mktemp -d); trap 'rm -rf "$tmpdir"' EXIT; curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash -o "$tmpdir/download-actionlint.bash"; (cd "$tmpdir" && bash download-actionlint.bash 1.7.7 >/dev/null); "$tmpdir/actionlint" -color .github/workflows/verify-no-localhost-bake.yml
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
bash scripts/verify-no-localhost-bake.sh --src-only
bash scripts/verify-no-localhost-bake.sh --self-test
```

結果: local 実装後に実行し、全て PASS。

## 既知の制限 / 実行不可項目

| 項目 | 理由 |
| --- | --- |
| `verify-no-localhost-bake.yml` の実 edit | local 実装済み |
| `gh api -X PUT` branch protection mutation | user-gated（不可逆 governance mutation） |
| focused vitest / grep gate の再実行による回帰確認 | local 実装後に実施済み |

## 判定

前提（gate 実在 / context 未登録 / paths-filter footgun）はすべて現コードに対する read-only 再現で確認済み。yml paths 除去は local 実装済みで、focused vitest / grep gate / actionlint も PASS。mutation・PR は user-gated として後続に委譲する。**PASS（implemented_local_runtime_pending）**。
