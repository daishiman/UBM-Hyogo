# タスク仕様書: task-06-ui-ux-contract-rewrite — UI/UX 契約 (`09-ui-ux.md`) の contract-only rewrite

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-06-ui-ux-contract-rewrite |
| 親 workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| 配置先 | `docs/30-workflows/task-06-ui-ux-contract-rewrite/` |
| 作成日 | 2026-05-07 |
| 状態 | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| wave | 2 (parallel) |
| 想定 PR 数 | 1 |
| Primary spec | `docs/00-getting-started-manual/specs/09-ui-ux.md` |

## 目的

`docs/00-getting-started-manual/specs/09-ui-ux.md` を「props / state / a11y / token 参照だけの contract-only ドキュメント」へ書き直し、視覚詳細はプロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`) と委譲先 spec (`09a..09h`) に分離する。

## スコープ

### 含む

- `docs/00-getting-started-manual/specs/09-ui-ux.md` の全面 rewrite（160 → 396 行・10 章構成）
- 19+1 route / 13 primitives / a11y / token prefix の正本化
- 後続 task (07/08/09/10/18/19/20/21/22) への引き渡し点を明示
- aiworkflow-requirements / task-specification-creator skill への knowledge 反映（lessons-learned / changelog / artifact inventory）

### 含まない

- `09a-prototype-map.md` / `09b-design-tokens.md` の中身生成（task-07 / task-08 で扱う）
- D1 schema 変更・新 API endpoint 追加・Google Form 仕様変更

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | 完了 |
| 2 | 設計 | [phase-02.md](phase-02.md) | 完了 |
| 3 | 設計レビュー | [phase-03.md](phase-03.md) | 完了 |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | 完了 |
| 5 | 実装ランブック | [phase-05.md](phase-05.md) | 完了 |
| 6 | 異常系検証 | [phase-06.md](phase-06.md) | 完了 |
| 7 | テストカバレッジ | [phase-07.md](phase-07.md) | 完了 |
| 8 | リファクタリング | [phase-08.md](phase-08.md) | 完了 |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | 完了 |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) | 完了 |
| 11 | 手動テスト検証 (NON_VISUAL) | [phase-11.md](phase-11.md) | 完了 |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | 完了 |
| 13 | PR作成 | [phase-13.md](phase-13.md) | 未実施 |

## Phase 11 NON_VISUAL evidence 設計

このタスクはドキュメントのみの rewrite であり、UI 画面差分が発生しない（`visualEvidence: NON_VISUAL`）。スクリーンショット撮影は対象外で、代わりに以下 4 種の代替 evidence で品質を担保する:

1. **grep gate**: `09-ui-ux.md` 内の必須 keyword（19 routes / 13 primitives / a11y / token prefix）が grep で発見可能であること
2. **structure check**: H2 = 10 章の章構造が維持されていること
3. **markdown lint**: linkcheck / heading hierarchy
4. **trace check**: 後続 task (07/08/09/10/18/19/20/21/22) への引き渡し点が漏れなく出ていること

詳細: `outputs/phase-11/phase-11-non-visual-alternative-evidence.md`

## 同 wave 反映ファイル

- `.claude/skills/aiworkflow-requirements/SKILL.md` / changelog / lessons-learned / artifact inventory
- `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map,keywords}.{md,json}`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/task-specification-creator/SKILL.md` / SKILL-changelog.md / LOGS

## 不変条件

- 既存 API endpoint surface のみ利用（新 endpoint 禁止）
- OKLch token 正本（`apps/web/src/styles/tokens.css` / `09b-design-tokens.md`）への参照のみ
- prototype 正本順位（claude-design-prototype）を尊重
- D1 直接アクセス禁止（`apps/web` から binding しない）
