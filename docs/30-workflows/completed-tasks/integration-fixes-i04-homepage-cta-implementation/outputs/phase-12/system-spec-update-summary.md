# System spec update summary

## Step 1-A: 完了タスク記録

本サイクルで canonical workflow root を作成し、実装・テスト・VISUAL evidence・台帳同期を完了した。

| 対象 | 更新内容 |
|------|----------|
| `docs/30-workflows/integration-fixes-i04-homepage-cta-implementation/` | Phase 1-12 completed / Phase 13 blocked |
| `outputs/phase-11/screenshots/` | desktop CTA / mobile CTA / full page の 3 PNG を保存 |
| `apps/web` | CTA component / form constant / HomePage mount / existing responder URL SSOT 化 / Playwright smoke 追加 |

## Step 1-B: 実装状況テーブル

| 対象 | Before | After |
|------|--------|-------|
| parent spec `parallel-i04-homepage-cta/spec.md` | `pending`, `canonical_workflow: null` | `completed`, canonical workflow root へ接続 |
| integration-fixes parent artifacts | i04 `pending` | i04 `completed` |
| integration-fixes parent index | i04 `spec_ready_implementation_pending` | i04 `completed locally` |

## Step 1-C: 関連タスクテーブル

| 対象 | Before | After |
|------|--------|-------|
| `docs/30-workflows/unassigned-task/integration-fixes-i04-homepage-cta.md` | `pending` | `resolved` |

## Step 2: spec 横展開

既存正本 `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` には FOR MEMBERS CTA / responderUrl / external link 方針が既に記載済みのため、新規の画面仕様追記は不要。代わりに実コード側の SSOT 漏れとして `/register` と `/login` の responder URL 直書きを `FORM_RESPONDER_URL` へ集約した。

## Skill feedback

`outputs/phase-12/skill-feedback-report.md` に、closed issue / in-place fix 予定が canonical workflow へ昇格する場合の状態同期ルールを記録済み。今回の実ファイル同期で未タスク化は不要。
