# Phase 11 — 手動テスト（local evidence index）

**[実装区分: 実装仕様書 / implementation_mode: new / VISUAL_ON_EXECUTION]**

本 workflow は local 実装済み。durationMs の backend 返却・frontend schema/UI 表示は実コードに反映済みで、
focused tests / typecheck / lint を local evidence として扱う。authenticated runtime screenshot は
admin 認証・`SYNC_ADMIN_TOKEN` 構成・実 resync 実行を伴うため user-gated のまま分離する。

## 証跡一覧

| 種別 | パス | 状態 |
|---|---|---|
| 手動テスト結果 | [manual-test-result.md](manual-test-result.md) | present |
| screenshot 計画 | [screenshot-plan.json](screenshot-plan.json) | present |
| capture metadata | [phase11-capture-metadata.json](phase11-capture-metadata.json) | present |
| focused vitest | API job/route contract + web schema/panel specs | present（local command evidence） |
| typecheck | `pnpm --filter @ubm-hyogo/{api,web} typecheck` | present（local command evidence） |
| lint | `pnpm lint` | present（local command evidence） |
| runtime screenshot | runtime/manual-form-resync-panel-result-with-duration.png | pending（user-gated） |

詳細は [phase-11.md](../../phase-11.md) を参照。
