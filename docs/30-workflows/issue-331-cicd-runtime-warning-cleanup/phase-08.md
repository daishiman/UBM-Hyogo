# Phase 8: DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 8 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## DRY 検討

### web-cd.yml の staging / production step 共通化

deploy-staging と deploy-production は env 名以外の構造が同一。matrix strategy でまとめる選択肢があるが:

| 案 | 評価 |
| --- | --- |
| matrix で 1 job に統合 | gate 条件（`if: github.ref_name == 'dev'` / `'main'`）が個別に必要、可読性低下 |
| 共通 composite action 化 | 本リポジトリで未採用、別タスク扱いが妥当 |
| **現状維持（2 job 並列）** | 可読性・gate 明示性・既存規約と整合 → **採用** |

→ **DRY 化は実施しない。** 既存 backend-ci.yml も同パターンで規約一致。

### apps/api/wrangler.toml の env vars 重複

`[env.production.vars]` と `[env.staging.vars]` で同名キーが多数。anchor 機能は TOML にないため重複は許容（wrangler 仕様の制約）。

## 完了条件

- [ ] DRY 化の検討と不採用根拠が記載されている

## 成果物

- `outputs/phase-08/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

## 依存Phase参照

- Phase 1: `phase-01.md` / `outputs/phase-01/main.md`
- Phase 2: `phase-02.md` / `outputs/phase-02/main.md`
- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
- Phase 6: `phase-06.md` / `outputs/phase-06/main.md`
- Phase 7: `phase-07.md` / `outputs/phase-07/main.md`
