# Documentation changelog

本サイクルで追加・更新するドキュメント全量。

## 追加 (本仕様書サイクル)

| path | 内容 |
|------|------|
| `docs/30-workflows/login-page-prototype-alignment/outputs/phase-1/phase-1.md` | スコープ・実装モード・既存実装インベントリ |
| `docs/30-workflows/login-page-prototype-alignment/outputs/phase-2/phase-2.md` | 設計詳細 (component / props / CSS / token mapping / layout contract) |
| `docs/30-workflows/login-page-prototype-alignment/outputs/phase-3/phase-3.md` | AC / 依存関係 / 変更マップ / テスト戦略 overview |
| `outputs/phase-4/phase-4.md` | 実装ガイド本体 (全ファイルの最終形コード骨格) |
| `outputs/phase-5/phase-5.md` | 実装順序・依存グラフ・マイルストーン |
| `outputs/phase-6/phase-6.md` | ローカル動作確認手順 |
| `outputs/phase-7/phase-7.md` | エラーハンドリング・エッジケース |
| `outputs/phase-8/phase-8.md` | ユニット・コンポーネントテスト仕様 |
| `outputs/phase-9/phase-9.md` | E2E + visual regression 仕様 |
| `outputs/phase-10/phase-10.md` | a11y / UX / パフォーマンス品質ゲート |
| `outputs/phase-11/phase-11.md` | Evidence 取得仕様 |
| `outputs/phase-12/main.md` | Phase 12 集約 entry |
| `outputs/phase-12/implementation-guide.md` | PR / レビュー entry |
| `outputs/phase-12/phase-12-compliance-check.md` | canonical 9 headings compliance |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 redirect |
| `outputs/phase-12/system-spec-update-summary.md` | 正本 spec への影響まとめ |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback 候補 |
| `outputs/phase-12/unassigned-task-detection.md` | follow-up 候補の妥当性確認 |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-13/phase-13.md` | PR 作成・ドキュメント更新仕様 |

## 実装サイクルで更新済み

| path | 内容 |
|------|------|
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | /login UI 構造を Magic Link 主導 + OR + Google secondary に正式化、文言一覧転記 |
| `docs/30-workflows/LOGS.md` | 本ワークフロー root 追加 1 行 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | quick-reference / resource-map / task-workflow-active / artifact inventory を同期 |
| `outputs/phase-11/screenshots/*.png` | local Playwright screenshot 8 件 |
| `apps/web/playwright/tests/login-smoke.spec.ts` | evidence path を本 workflow root へ補正し、mobile screenshot と dev overlay 非表示を追加 |

実コードの changelog は git 履歴で管理し、本ファイルには列挙しない (skill `references/phase12-skill-feedback-promotion.md`)。
