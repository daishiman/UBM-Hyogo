# Lessons Learned: Issue #668 RB-3b-03 / RB-3b-04 paths filter + shell prelude (2026-05)

> task: `issue-668-stage3b-rb03-rb04-paths-filter-shell-helper`
> workflow root: `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/`
> 関連 spec: `references/deployment-gha.md`, `references/branch-protection.md`

## 概要

Issue #668 stage 3b の残務 (RB-3b-03 / RB-3b-04) を消化する CI 整備。docs-only PR で必須 context 名 `e2e-tests-coverage-gate` が出ない問題と、scripts/ 配下の bash 共通化欠落・shellcheck 違反の同時解消。

## 苦戦箇所

### L-668-001: skip ワークフロー方式の二重 required context

- 症状: docs-only PR で `e2e-tests-coverage-gate` を埋めるために `e2e-tests-skip.yml` を別ワークフローで作る初期案では、mixed PR (code + docs 同時変更) において e2e-tests と e2e-tests-skip の両方が同名 context を name させる衝突が起こる。
- 原因: required context 名の一意性を、ワークフロー側でなく必須チェック側で担保する前提が抜けていた。
- 解決: `e2e-tests.yml` 内に `precheck` job を置き、`run_e2e=true|false` で e2e matrix を gating。docs-only PR は no-op success job が同 context 名を埋める単一ワークフロー設計に変更。
- 再発防止: required context を埋める no-op success は、必ず本体ワークフロー内の job として実装する。complement 用の skip 専用 workflow は禁止。

### L-668-002: shell prelude の source 専用化

- 症状: `ci-shell-prelude.sh` を `bash scripts/lib/ci-shell-prelude.sh` で誤実行されると set -e / umask / annotation 関数が呼び出し元に伝播せず、silent failure になりやすい。
- 原因: source 専用 helper を直接実行可能にしてしまうと、CI 上で意味の無い 0 exit を吐く。
- 解決: `if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then exit 2; fi` で直接実行を拒否し、呼び出し側に `# shellcheck source=lib/ci-shell-prelude.sh` を明示。
- 再発防止: source 専用 bash library は必ず direct-exec guard + shellcheck source directive をセットで導入する。

### L-668-003: prelude 採用時の既存挙動保持

- 症状: `coverage-gate-e2e.sh` を prelude 化する際に `THRESHOLD_FIXTURE` / `SUMMARY` の参照経路と error 出力 wording が変わると、79/80/81 regression fixture テストが破綻する。
- 原因: prelude が `set -euo pipefail` を強制するため、既存スクリプトで unset 変数を意図的に許容していた箇所が exit 1 に変わる。
- 解決: 既存定数・出力 wording・exit code を Phase 7 evidence で逐語固定し、prelude 採用 PR では行差分を最小化 (関数呼び出しの置換のみ)。fixture-driven dry-run を Phase 11 evidence として残す。
- 再発防止: 共通化リファクタは「動作不変条件」を fixture / wording / exit code 単位で先に列挙し、差分はその範囲のみに留める。

### L-668-004: precheck allowlist の drift 検知

- 症状: paths-filter の allowlist が `.github/workflows/e2e-tests.yml` 内で sync 漏れすると、code PR で e2e が走らない silent skip が発生する。
- 原因: precheck 条件と実際の e2e gating 条件が別 location に散ると drift が検出できない。
- 解決: precheck 出力 `run_e2e` を 1 箇所で計算し、`paths-symmetry.log` / inventory に登録。Phase 7 / 11 で precheck 8 エントリの存在を gate する。
- 再発防止: paths-filter は単一 source of truth 化し、allowlist エントリ数を constant として spec に固定する。

### L-668-005: shellcheck severity=warning と既存違反

- 症状: `lint-shell.yml` を strict (error) で導入すると、3 スクリプト (`cf-waf-apply/lib.sh`, `observability-target-diff.sh`, `verify-09c-no-visual-values.sh`) の既存 SC2086 / SC2155 で gate が落ちる。
- 原因: 新規 gate と既存違反の cleanup を同時化していなかった。
- 解決: severity=warning + `--external-sources` で導入しつつ、同 PR 内で 3 スクリプトの違反を minimal 修正。新規 prelude 採用箇所には shellcheck source directive を貼る。
- 再発防止: shellcheck gate を CI に追加する際は、必ず同 PR で既存違反を inventory 化し、severity を妥協せず minimal-diff 修正をセットにする。

## 後続タスクへの適用

- 新規 CI required context は本体ワークフロー内の job として埋める。complement 専用 skip workflow は採用しない。
- bash 共通化は source-only prelude + direct-exec guard + shellcheck source directive を雛形として扱う。
- prelude 採用リファクタは「定数 / 出力 wording / exit code」を不変条件として Phase 7 で固定する。
- 残務 (Phase 13 PR / runtime evidence) は user-gated 外部操作として分離。
