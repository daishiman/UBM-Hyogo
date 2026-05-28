---
実装区分: 実装成果物
状態: implementation_reviewed
Phase: 12
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [../../phase-12-documentation.md](../../phase-12-documentation.md)
---

# System Spec Update Summary (Phase 12-2)

## Step 1-A: 既存 spec の更新要否

| spec | 更新要否 | 更新点 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | **確認済 / 追記あり** | 既に `/` の section list は `Hero / Stats / About + ThreeZones / Featured / Meetings / CTA` を正本化済み。本 wave では実装 workflow への back-reference を追記し、実装対象がこの blueprint に従うことを明示 |
| `docs/00-getting-started-manual/specs/00-overview.md` | 不要 | 全体構成変更なし |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不要 | API 不変 |
| `docs/00-getting-started-manual/specs/design-tokens.md` | 不要 | token 既存値変更なし。不足 token 追加が発生した場合のみ Phase 9 で追記 |
| その他 spec | 不要 | — |

## Step 1-B: 新規 spec 追加の要否

| 候補 | 追加要否 | 理由 |
| --- | --- | --- |
| `apps/web/src/components/public/AboutUbm` README | 任意 | 1 component のため過剰。仕様書 (`09e-screen-blueprints-public.md`) で十分 |
| `docs/00-getting-started-manual/specs/public-home-data-contract.md` | 不要 | 既存 stats/members/meetings の使用 shape を変更していない |

## Step 1-C: 削除 / 非推奨化

| 対象 | 判定 |
| --- | --- |
| `apps/web/src/components/public/ZoneIntro.tsx` | **保持** (Phase 8 RF-2)。`app/page.tsx` から call は削除するが、component file は次サイクル再評価まで残す |

## Step 2: 反映先まとめ

| 反映先 | 対応 |
| --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | 1-A 通り更新 |
| `CLAUDE.md` | 不変条件追加なし (W1-W8 は本 workflow 固有のため index.md 内で管理) |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 本 task を `spec_created / implementation / VISUAL / execution_pending` で登録済み |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Progressive Disclosure entry 追加済み |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 task を `spec_created / implementation / VISUAL` で登録済み |
| `.claude/skills/aiworkflow-requirements/references/workflow-public-dashboard-prototype-alignment-artifact-inventory.md` | 新規追加済み |
| `.claude/skills/aiworkflow-requirements/changelog/20260526-public-dashboard-prototype-alignment.md` | 新規追加済み |

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 12-2
