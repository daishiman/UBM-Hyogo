# admin-sidebar-public-return-link

`AdminSidebar` に「公開サイトに戻る」導線を整備する単独タスクワークフロー。
親ワークフロー `public-header-logged-in-nav-cleanup` の Task F (`tasks/task-f-admin-sidebar-public-return.md`) を、独立して Phase 1〜13 仕様書として展開したもの。

## メタ情報

- workflow_id: `admin-sidebar-public-return-link`
- parent_workflow: `public-header-logged-in-nav-cleanup` (Task F)
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`
- workflow_state: `implemented_local_evidence_captured`
- implementation_mode: `existing-component-alignment`
- implementation区分: **[実装区分: 実装仕様書]**

## 目的

`AdminSidebar` は既に session 配線済（`userDisplayName` / `userEmail` を受領、`SignOutButton` 配置）。
現状の「Public」グループ先頭にある `{ href: "/", label: "ホーム" }` を、**意味的に「管理画面 → 公開サイトへ戻る」動線**として正しく表現するため:

1. ラベルを「公開サイトに戻る」へ変更
2. `data-role="public-return"` 属性を付与（regression test の anchor になる）
3. `aria-label="公開サイトに戻る"` を明示
4. sidebar 最下段（`SignOutButton` 直上）へ移動して視覚的に区別

## スコープ

| 含む | 含まない |
|------|----------|
| `AdminSidebar.tsx` 構造変更（GROUPS 再編 / 最下段に専用エントリ） | 新 endpoint 追加 |
| `AdminSidebar` footer 直前の専用 anchor 追加（`AdminSidebarNavItem` は変更しない） | D1 schema 変更 |
| `AdminSidebar.spec.tsx` の regression test 追加 | デザイントークン定義の追加 |
| `data-role` regression grep gate 検討 | 他 sidebar / public header 動線 |

## 不変条件

1. **既存 API のみ接続**: `AdminSidebar` の props (`schemaDiffCount` / `userDisplayName` / `userEmail`) を変更しない
2. **OKLch トークン正本化**: HEX 直書き禁止。既存 `var(--ubm-color-*)` クラスを再利用
3. **既存命名規約**: テストは `*.spec.tsx`（`*.test.*` 禁止）
4. **既存 nav 全項目の regression なし**: ダッシュボード / 出席分析 / 会員管理 / タグキュー / schema / 開催日 / 依頼キュー / Identity重複 / 監査ログ / 会員ディレクトリ / 登録 / マイページ
5. **SignOutButton 不変**: `data-testid="sign-out-button"` と挙動を保持
6. **PII 非露出**: `data-role` / `aria-label` に email / memberId を埋め込まない

## Phase 構成

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | phase-1-requirements.md | 要件定義 / AC 表 / 参照資料 |
| 2 | phase-2-design.md | コンポーネント構造設計 / GROUPS 変更案 |
| 3 | phase-3-design-review.md | 設計レビュー / 差分判定の正当化 |
| 4 | phase-4-test-plan.md | spec 設計 / 追加ケース定義 |
| 5 | phase-5-implementation.md | 実装手順（変更ファイル・関数シグネチャ・差分方針） |
| 6 | phase-6-test-additions.md | spec 追加実装手順 |
| 7 | phase-7-coverage.md | カバレッジ目標と確認手順 |
| 8 | phase-8-refactor.md | リファクタリング判断（拡張は最小） |
| 9 | phase-9-qa.md | QA 観点 / 手動確認 |
| 10 | phase-10-final-review.md | 最終レビュー観点 |
| 11 | phase-11-manual-test.md | Manual test / Phase 11 evidence inventory |
| 12 | phase-12-documentation.md | ドキュメント更新 / strict 7 outputs |
| 13 | phase-13-pr.md | commit / push / PR（user-gated） |

## 完了条件（DoD 集約）

- [x] `data-role="public-return"` を持つ `<a href="/">` が sidebar 内に 1 つ存在
- [x] その anchor の `aria-label === "公開サイトに戻る"`
- [x] 既存 admin nav 全項目が regression なく描画される
- [x] `SignOutButton` (`data-testid="sign-out-button"`) が存在し、`data-role="public-return"` リンクの直下（または直前）に配置
- [x] `userDisplayName` / `userEmail` props が反映される（既存挙動）
- [x] `mise exec -- pnpm typecheck` green（`outputs/phase-11/evidence/typecheck.log`）
- [x] `mise exec -- pnpm lint` green（`outputs/phase-11/evidence/lint.log`）
- [x] `mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` green
- [x] HEX 直書き 0 件（`outputs/phase-11/evidence/grep-gate.log`）
- [x] Phase 11 screenshots captured（`outputs/phase-11/screenshots/{admin-sidebar-overview,public-return-hover,public-return-focus}.png`）

## 依存

- 親ワークフローの他タスク (A-E, G) と並列実装可
- 既存 `AdminSidebar.tsx` の現行 GROUPS 構造に依存
