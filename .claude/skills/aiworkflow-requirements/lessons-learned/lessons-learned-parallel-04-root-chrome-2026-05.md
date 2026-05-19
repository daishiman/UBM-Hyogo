# Lessons Learned: parallel-04 root chrome / shared page chrome (2026-05)

> 関連: `[[workflow-parallel-04-shared-page-chrome-artifact-inventory]]`
> 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
> 同 wave changelog: `.claude/skills/aiworkflow-requirements/changelog/20260519-parallel-04-shared-page-chrome.md`

各エントリは「事象 → 原因 → 対策 → 次サイクル carry-forward」の 4 ブロックで記録する。

## L-PARA04-001: ToastProvider 単一マウント grep evidence は runtime source-only 必須

- **事象**: Phase 11 EV-08 で `rg "ToastProvider" apps/web/app` を素朴に実行すると、`apps/web/app/__tests__/*.spec.tsx` 内の `<ToastProvider>` test-double が混入し「root + test = 2 mount」と誤検出された。
- **原因**: `__tests__` 配下の test fixture は runtime mount ではないが、grep 上の表現区別が無いため static gate を誤って fail させる。
- **対策**: EV-08 取得コマンドを `find apps/web/app -path '*/__tests__/*' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' \) -print | xargs rg -n "ToastProvider" > outputs/phase-11/toast-provider-grep.txt` に固定し、Phase 11 evidence inventory に「`__tests__` 除外 runtime source-only 必須」を明記。
- **carry-forward**: 他の「単一マウント」/「単一インスタンス」系 grep gate も同等の prune を default 化する。`phase11-evidence-inventory` テンプレートに `__tests__` prune snippet を追加する余地あり。

## L-PARA04-002: Next.js 16 production build は `next build --webpack` を正本化する

- **事象**: parallel-04 実装中に Next.js 16 default の Turbopack で production build した検証物が、Cloudflare Workers deploy bundle へ `[project]/...` という仮想 module specifier を混入させ、OpenNext 変換後の Worker が起動失敗するケースが残った。
- **原因**: Next.js 16 production の Turbopack は OpenNext Workers adapter とまだ互換が無く、仮想 specifier が `import.meta.url` 解析を破壊する。
- **対策**: `apps/web` build を `next build --webpack` 固定（`package.json` scripts / CLAUDE.md `apps/web env アクセス不変条件` 末尾に SSOT 化）。Turbopack は local dev (`next dev`) 用に限定。EV-04 `build.log` は webpack mode の build を収録。
- **carry-forward**: Next.js 16 系 minor up のたびに Turbopack OpenNext 互換性 release-notes を確認し、互換が確立次第 SSOT を `--turbopack` 戻し検討。

## L-PARA04-003: Phase 12 strict 7 outputs は parent root 集約パリティを採る

- **事象**: 当初 sub-workflow 単体に `outputs/phase-12/{main,implementation-guide,...}.md` 7 ファイルを複製する案を検討したが、`verify:phase12-compliance` 視点では parent root 側と sub-workflow 側で同一 7 outputs が二重存在することになり、SSOT drift 源になる。
- **原因**: Phase 12 canonical heading SSOT は workflow ID 単位で 1 set 想定であり、parent / sub 双方に複製を認めると system-spec-update-summary や documentation-changelog の整合性 review が二重化する。
- **対策**: Phase 12 strict 7 は parent root `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/` に集約し、sub-workflow `parallel-04-shared-page-chrome/outputs/` には Phase 11 evidence と sub 固有 SCOPE のみを残す。本方針を artifact inventory `Phase 12 集約方針` に明記。
- **carry-forward**: parent + N sub-workflow 構造を採る後続 wave（serial-07 visual regression 等）も同 parity 規則を適用する。`task-specification-creator` 側の `parent-sub-workflow strict7 aggregation` trigger に整合。

## L-PARA04-004: HEX 直書き禁止と OKLch token gate

- **事象**: `apps/web/app/{layout,error,not-found,loading}.tsx` 旧実装には Tailwind `bg-[#0f172a]` / `text-[#94a3b8]` 直書きが残り、`verify:tokens` 観点でレギュレーション違反だった。
- **原因**: legacy Next.js scaffold の color が tailwind arbitrary HEX で記述されていた。
- **対策**: 4 ファイルすべてを `--ubm-color-*` OKLch token + Card / EmptyState primitive 経由に置換し、Phase 11 EV-09 `hex-direct-grep.txt` を 0 件で固定。CI gate `verify-design-tokens`（task-18）で再発 fail。
- **carry-forward**: legacy 由来 scaffold を新規追加する際は必ず token-only で実装し、PR 提出前に `pnpm verify:tokens` を local 実行する。

## L-PARA04-005: root fallback 4 ファイルは同一サイクル一括実装

- **事象**: 当初 layout / error / not-found / loading を別 sub-workflow へ分割する案があったが、共通 Card / token / metadata 設定が 4 ファイルに横断するため、分割すると review boundary が無駄に増える。
- **原因**: root chrome は技術的にも視覚的にも一体の SSOT。
- **対策**: parallel-04 単一 sub-workflow で 4 ファイル + 既存 `/smoke/loading-state` fixture（task-25 follow-up 由来）+ error.component test を同期実装。
- **carry-forward**: 「`app/` 直下 root fallback の追加・改修」は今後も単一 sub-workflow scope に固定する。

## L-PARA04-006: `error.tsx` の `logger.error` は mount 時 1 回固定

- **事象**: 旧 `error.tsx` の `logger.error` 呼出が render path 内に置かれており、React Strict Mode 下で double-invoke して同一 error を 2 件 log push する debounce 不能事故が残っていた。
- **原因**: error boundary は parent re-render のたびに本体関数が再評価され得る。logger 呼出が render path 内にあると Strict Mode 2 重 invoke で重複ログが必発。
- **対策**: `useEffect(() => { logger.error(error) }, [])` に置き換え mount 時 1 回固定。`apps/web/app/__tests__/error.component.spec.tsx` に「再 render しても logger.error は 1 回しか呼ばれない」test case を追加。
- **carry-forward**: 他の root boundary（global error / not-found）に logger を追加する場合も同パターンを徹底する。

## L-PARA04-007: metadata template + viewport / themeColor は OKLch で安全

- **事象**: `app/layout.tsx` の `metadata.themeColor` を OKLch で書くと古いブラウザは無視するが、`<meta name="theme-color">` 配下に invalid 値が落ちて parse 失敗を心配する声があった。
- **原因**: ブラウザは未知の color syntax を「無視」するだけで、document parse は失敗しない（CSS color parsing と同じ permissive 方針）。実機能影響なし。
- **対策**: `metadata` を object title template `{ template: '%s — UBM 兵庫', default: 'UBM 兵庫' }` に統一し、`themeColor` は `viewport` export で OKLch token と整合する値を指定。
- **carry-forward**: 将来 PWA manifest や Open Graph color を増やす場合も同じく OKLch を SSOT とし、HEX 派生は build-time fallback で生成する方針を検討する余地あり。
