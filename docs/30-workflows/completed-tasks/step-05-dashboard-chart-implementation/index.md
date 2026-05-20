# step-05-dashboard-chart-implementation

**[実装区分: 実装仕様書]**
**[正本: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-05-dashboard-chart/spec.md`]**

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 概要

admin ダッシュボードの `StatusDistribution` component に **SVG bar chart 描画ロジック** を追加し、`GET /admin/dashboard` が `byStatus` producer を返すようにする。`toAdminDashboardUi()` から `byStatus` field が得られた場合は chart で描画し、`undefined / null / empty` の場合は既存 placeholder を fallback として描画する（後方互換維持）。

API 側 (`apps/api/src/routes/admin/dashboard.ts`) の `byStatus` 拡張も本レビューサイクル内で同時実装し、未タスク化しない。

## ワークフロー成果物

| Phase | 内容 | パス |
| --- | --- | --- |
| Phase 1 | 要件定義 / SSOT 確定 | [phase-01.md](phase-01.md) |
| Phase 2 | アーキテクチャ設計 | [phase-02.md](phase-02.md) |
| Phase 3 | 詳細設計（型 / SVG 構造 / token 仕様） | [phase-03.md](phase-03.md) |
| Phase 4 | テスト設計（vitest + a11y） | [phase-04.md](phase-04.md) |
| Phase 5 | コア実装 | [phase-05.md](phase-05.md) |
| Phase 6 | 検証コマンド / 手動確認手順 | [phase-06.md](phase-06.md) |
| Phase 7 | CI/CD 統合（既存 gate 整合） | [phase-07.md](phase-07.md) |
| Phase 8 | governance / branch protection | [phase-08.md](phase-08.md) |
| Phase 9 | 移行 / rollout 戦略 | [phase-09.md](phase-09.md) |
| Phase 10 | 監視 / 運用観点 | [phase-10.md](phase-10.md) |
| Phase 11 | evidence 収集 | [phase-11.md](phase-11.md) |
| Phase 12 | ドキュメント・コンプライアンス | [phase-12.md](phase-12.md) |
| Phase 13 | PR 作成 / 承認ゲート | [phase-13.md](phase-13.md) |

## 不変条件

1. **既存 API endpoint surface のみ利用**: `GET /api/admin/dashboard` の既存 endpoint に `byStatus` を追加する。新 endpoint 追加禁止。
2. **後方互換**: `slices === undefined || slices.length === 0` のとき既存 placeholder を維持。
3. **OKLch token 正本化**: HEX 直書き禁止。`var(--ubm-color-ok|info|warn)` を介す。
4. **依存追加禁止**: `recharts` / `visx` 等は本ワークフローでは追加せず、SVG 直書きで実装。
5. **`apps/web` → D1 直接アクセス禁止**: API 経由のみ。
