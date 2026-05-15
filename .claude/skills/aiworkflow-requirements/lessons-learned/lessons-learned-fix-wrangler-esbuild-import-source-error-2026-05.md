# Lessons Learned: fix-wrangler-esbuild-import-source-error (2026-05)

> 対象 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
> 同期日: 2026-05-15
> 前段の `task-10-followup-001-opennext-esbuild-mismatch` (`pnpm.overrides.esbuild = 0.25.4`) を SSOT として supersede し、`0.27.3` を新正本とした wave。

## L-FIXWRG-001: `pnpm.overrides.esbuild` の真の交点は存在しない（wrangler exact 優先で決め切る）

wrangler 4.85.0 は `esbuild@0.27.3` を host として要求し、`@opennextjs/aws` は `esbuild@0.25.4` を要求する。両者の exact 交点はなく、minor を上に取ると wrangler の host/binary 検証が即 throw する。本 wave では「wrangler exact を SSOT に採用し、OpenNext は実 build 走破で検証する」運用判断に倒した。`pnpm.overrides.esbuild` は wrangler 要求版を 1 行で固定し、OpenNext 側の build 成果は phase-11 evidence で個別に担保する。

## L-FIXWRG-002: 古い仮説（patch-version drift）は早期に撤回し、phase 全体を巻き戻す

初期は「patch version の drift だろう」と仮説していたが、wrangler の `import-source` feature が 0.27 系前提であるという constraint に気づくまで広範囲を編集してしまった（phase-2/5/6/11/12/13 まで）。仮説誤りで散らかった差分は `documentation-changelog.md` に履歴を残し、撤回そのものを後続作業者の判断材料として可視化することが、再発防止に最も効く。仮説を変えたら phase を遡って書き直す覚悟が要る。

## L-FIXWRG-003: 状態語彙は `PASS` 単独を避け、boundary 同期型に揃える

root を「completed」に倒すと runtime gate（phase-13）が消えるため、本 wave は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `implemented_local_evidence_captured` を採用した。`PASS` 単独表記は phase-13 runtime evidence を意図せず吸収してしまうので、boundary を残す状態語彙を選ぶこと。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は `code complete + local evidence captured + runtime user-gated` の三点を 1 トークンで指す。

## L-FIXWRG-004: stale な skill reference は遡及的に SSOT 同期する

`references/ui-ux-components.md` と `references/workflow-task-10-followup-001-opennext-esbuild-mismatch-artifact-inventory.md` に残っていた historical `0.25.4` 記述は、文脈ごと「superseded by current `0.27.3` SSOT (2026-05-15 / fix-wrangler-esbuild-import-source-error)」と注記して遡及修正した。historical の値そのものは削除しない（lineage が読めなくなる）。supersede 注記を 1 行差し込むだけで SSOT 一意性を保つのが正解。

## L-FIXWRG-005: `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 仮固定は SSOT としては無効

`scripts/cf.sh` の `ESBUILD_BINARY_PATH` export は、pnpm overrides で root から wrangler 配下まで hoist 済みの状況では実質的に上書きしていなかった。ラッパー側の binary path 固定はあくまで補助線で、SSOT は root の `pnpm.overrides.esbuild`。今後 esbuild の交点問題が再発したら、まず `pnpm why esbuild` で root override が効いていることを確認し、ラッパー側の env export は二次防御として扱う。

## L-FIXWRG-006: wrangler `import-source` feature は esbuild ≥ 0.27 が必須（silent breakage）

wrangler 4.85.0 の `import-source` 機能は esbuild 0.27 系で導入された API に依存しており、0.25 系では fail-fast せず silent に bundle が壊れる。pnpm overrides で 0.25.4 を pinned していると wrangler は起動するが、`build:cloudflare` の途中で診断しづらい形で破綻する。esbuild major/minor bump 時は wrangler の release note と `import-source` の対応 esbuild 範囲を必ず確認すること。

