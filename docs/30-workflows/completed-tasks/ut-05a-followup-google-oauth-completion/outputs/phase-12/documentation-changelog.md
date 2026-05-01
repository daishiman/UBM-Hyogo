# Documentation Changelog — UT-05A-FOLLOWUP-OAUTH

## 新規ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `docs/30-workflows/ut-05a-followup-google-oauth-completion/index.md` | 既存 | タスク仕様書 root |
| `docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-01.md`〜`phase-13.md` | 既存 | Phase 仕様書 |
| `outputs/phase-01/main.md` | 新規 | 要件定義成果物 |
| `outputs/phase-02/oauth-redirect-uri-matrix.md` | 新規 | redirect URI 設計 |
| `outputs/phase-02/secrets-placement-matrix.md` | 新規 | Secrets 配置設計 |
| `outputs/phase-02/consent-screen-spec.md` | 新規 | consent screen 設計 |
| `outputs/phase-02/staging-vs-production-runbook.md` | 新規 | 段階適用設計 |
| `outputs/phase-03/main.md` | 新規 | 設計レビュー判定 |
| `outputs/phase-04/test-strategy.md` | 新規 | テスト戦略 |
| `outputs/phase-05/implementation-runbook.md` | 新規 | 実装 runbook（コマンド版） |
| `outputs/phase-06/failure-cases.md` | 新規 | 異常系 18 件 |
| `outputs/phase-07/ac-matrix.md` | 新規 | AC × evidence マトリクス |
| `outputs/phase-08/main.md` | 新規 | DRY 化方針 |
| `outputs/phase-09/main.md` / `free-tier-estimation.md` | 新規 | 品質保証 / 無料枠試算 |
| `outputs/phase-10/go-no-go.md` | 新規 | 最終ゲート判定 |
| `outputs/phase-11/manual-runbook.md` | 新規 | **手動実行最詳細 runbook** |
| `outputs/phase-11/manual-smoke-log.md` | 新規 | 実行ログテンプレート |
| `outputs/phase-12/implementation-guide.md` | 新規 | PR 本文用ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | 仕様書更新計画 |
| `outputs/phase-12/documentation-changelog.md` | 新規 | **本ファイル** |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 未タスク検出 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | スキルフィードバック |

## 更新（Phase 11 完了後に実施）

| パス | 修正内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | secrets-placement-matrix / oauth-redirect-uri-matrix への参照追加 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | B-03 制約状態を verified / submitted / testing-user-only で更新 |
| `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md` | OAuth visible evidence セクションを本タスク outputs link で上書き |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | secrets 配置の正本リンク追加（任意） |

## 削除

| パス | 理由 |
| --- | --- |
| `docs/30-workflows/05a-parallel-.../outputs/phase-11/screenshots/spec-created-placeholder.png` | 本タスクで実 evidence に上書き |

## 影響範囲

- コード（apps/, packages/）への影響: **なし**
- 仕様書: `02-auth.md` / `13-mvp-auth.md` / 05a placeholder の 3 箇所
- skill indexes: `pnpm indexes:rebuild` で再生成
