# タスク仕様書 検証レポート

> 対象: docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux
> ステータス: `implemented_local_visual_present_staging_pending`（Phase 1-12 completed・apps/web 実装・ローカル検証・6 canonical PNG 取得済み・commit/PR/authenticated staging baseline は user-gated）

## サマリー

| 項目 | 値 |
|------|-----|
| 総 Phase 数 | 13 |
| 仕様書状態 | Phase 1-12 completed・Phase 13 pending_user_approval |
| タスク種別 | implementation（VISUAL） |
| 実装区分 | 実装仕様書（CONST_004） |
| 結果 | implemented_local_visual_present_staging_pending 整合（apps/web 実装済み・Gate-A/B passed・Gate-C pending） |

## Phase 別 状態

| Phase | 名称 | 状態 | 主成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | spec_created | outputs/phase-01/{main,rename-map}.md |
| 2 | 設計 | spec_created | outputs/phase-02/{main,change-map}.md |
| 3 | 設計レビュー | spec_created | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト作成 | spec_created | outputs/phase-04/{main,test-plan}.md |
| 5 | 実装 | spec_created | outputs/phase-05/{main,runbook}.md |
| 6 | テスト拡充 | spec_created | outputs/phase-06/{main,regression-cases}.md |
| 7 | カバレッジ確認 | spec_created | outputs/phase-07/{main,ac-matrix}.md |
| 8 | リファクタリング | spec_created | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | spec_created | outputs/phase-09/{main,token-audit}.md |
| 10 | 最終レビュー | spec_created | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動テスト | spec_created | outputs/phase-11/{screenshot-plan.json,phase11-capture-metadata.json,…} |
| 12 | ドキュメント更新 | spec_created | outputs/phase-12/*（7 成果物） |
| 13 | PR 作成 | spec_created（user_approval_required=true） | outputs/phase-13/*（4 成果物） |

## gate 想定（実装サイクルで実行）

| gate | 期待 | 段階 |
| --- | --- | --- |
| `pnpm typecheck` | PASS | 実装サイクル |
| `pnpm lint` | PASS | 実装サイクル |
| focused vitest（出席 feature __tests__） | PASS（T-01〜T-06 追従 + 回帰） | 実装サイクル |
| `verify-design-tokens` / `pnpm verify:tokens` | PASS（HEX 0 件・AC-5） | 実装サイクル |
| `git diff --name-only -- apps/api packages/shared` | 空（AC-7） | 実装サイクル |
| `verify:phase12-compliance`（本 workflow root） | ok:true（canonical 9 見出し / spec_created） | spec gate |
| `gate-metadata:validate` | Gate-A passed / ERROR 0 | spec gate |

## AC トレース サマリ（AC-1〜AC-10）

| AC | 要旨 | 検証手段 | trace 先 |
| --- | --- | --- | --- |
| AC-1 | 英語表記の日本語化（grep 0 件） | grep（PRIMARY/TREND/DETAIL/TOP10/CSV 等） | R-01〜R-10 / phase-01 rename-map |
| AC-2 | 「セッション」→「開催回」（grep 0 件） | grep（セッション） | S-01〜S-10 |
| AC-3 | 専門語の平易化 | grep（トレンド/ユニーク/区画/帯/pt） | J-01〜J-12 |
| AC-4 | 見やすさ微調整・DOM 不変 | 構造テスト / 視覚証跡 | U-01〜U-03 |
| AC-5 | OKLch token・HEX 0 | `verify-design-tokens` | phase-09 token-audit |
| AC-6 | 新規 primitive/component 0 | diff 確認 | system-spec-update-summary（N/A） |
| AC-7 | API/D1/Form/shared 不変 | `git diff -- apps/api packages/shared` 空 | phase-07 ac-matrix |
| AC-8 | DOM contract 保持 | testid/href/role 不変・aria 文言のみ変更 | phase-02 change-map |
| AC-9 | テスト追従 + 回帰 | focused vitest | T-01〜T-06 / phase-04 test-plan |
| AC-10 | 機能温存 | 既存挙動不変（フィルタ/書き出し/modal/degrade） | phase-06 regression-cases |

## 4 条件判定（spec_created 時点）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 会員/管理者の読解コスト低減が AC で定義済み |
| 実現性 | PASS | 文字列置換 + 軽微 CSS + テスト追従で 1 サイクル完了（CONST_007） |
| 整合性 | PASS | 責務は web 表現層に閉じ invariant 違反なし（testid/href/DOM 構造不変・AC-7/8） |
| 運用性 | PASS | 既存 vitest + Playwright + `verify-design-tokens` で回帰保護 |

## 結論

Phase 1-12 completed / Phase 13 pending_user_approval で整合。用語リネーム正本表（R/S/J/U）・テスト追従（T-01〜T-06）・AC-1〜AC-10 が `_shared-context.md` に固定され、各 Phase / implementation-guide に trace されている。apps/web 実装・focused Vitest・token gate・typecheck・lint・workflow inventory sync は完了済み。commit・PR・staging capture は user 明示承認後にのみ実行する。
