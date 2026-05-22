# Phase 12 Main

UI prototype design system foundation の Phase 12 集約サマリー。

## Result

- `PROTOTYPE-COVERAGE.md` を追加し、prototype JSX / CSS / 09a-09h と現行 `apps/web/app` 物理配置の対応を SSOT 化した。
- `artifacts.json` と `outputs/artifacts.json` を追加し、root / outputs parity を確立した。
- `/login` / `/profile` / `/privacy` / `/terms` は root 配下の既存 app router path を編集対象とする、と明記した。
- `serial-00-design/` は Phase 1-3 の非実行 preface、実装サブワークフローは Phase 1-13 と定義した。
- `parallel-04-shared-page-chrome` の root fallback 4 ファイルを同一サイクルで実装し、`layout.tsx` の `tokens.css` import / `viewport` export、`error.tsx` / `not-found.tsx` / `loading.tsx` の Card / EmptyState 派生を反映した。

## Boundary

本サイクルは仕様書の準拠改善に加えて、CONST_004 に基づく最小 `apps/web/app/**` 実装差分（parallel-02 prototype CSS rules port、parallel-03 AppShell layout data hooks と layout specs、parallel-04 root fallback を含む）を同一 wave で補正し、typecheck / lint / build / grep evidence と parallel-02 local screenshot 9 件、parallel-04 root fallback screenshots を取得した。対象 workflow は `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING` とし、full 19-route binding / production-equivalent runtime screenshot / serial-07 visual regression evidence / commit / push / PR は user-gated として `PROTOTYPE-COVERAGE.md` および `serial-07-regression-evidence/` に従って継続する。
