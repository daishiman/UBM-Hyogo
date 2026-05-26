# Phase 12 — ドキュメント / システム仕様反映

| 項目 | 値 |
| --- | --- |
| 状態 | completed |
| 実施日 | 2026-05-25 |

## 7 canonical 成果物

| # | path | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | 本タスクの実施結果サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装手順・対象ファイル・差分要点・運用注意 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/05-pages.md` への反映（SEO metadata / env fallback 契約） |
| 4 | `outputs/phase-12/documentation-changelog.md` | CLAUDE.md「`apps/web` env アクセス不変条件」セクションへの追記提案 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | CONST_002 二回確認の結果（残存 follow-up 0 件 / 既存 `home-page-prototype-alignment-followup-001` は本タスクで吸収 → completed-tasks 側へ closeout 候補） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill / aiworkflow-requirements への feedback |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict 7 outputs compliance check（canonical 7 outputs / workflow root parity gate） |

## 関連メンテ

- `home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md` を本タスクが吸収するため、unassigned-task からの remove と stale 参照補修を Phase 12 closeout で実施する（CONST_002 二回確認後）。
- `aiworkflow-requirements` の env / metadata 章と `docs/00-getting-started-manual/specs/05-pages.md` に `getPublicEnvSafe` を追記する。
- `indexes:rebuild` を最後に走らせ、drift 0 件を確認。

## 完了条件

- 7 canonical outputs が揃う。
- Phase 11 runtime smoke / Vitest / typecheck / lint が green。
- commit / push / PR / staging deploy は Phase 13 user-gated のまま。
