# aiworkflow-reference-500-line-split-001

## メタ情報

| Field | Value |
| --- | --- |
| status | unassigned |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| created_at | 2026-05-21 |
| source | `task-alert-relay-global-scope-fix-001` Phase 12 validation |

## 目的

`aiworkflow-requirements/scripts/validate-structure.js` が検出する500行超過
referenceを、classification-firstで責務分離し、構造検証の警告を0件にする。

## スコープ

対象は2026-05-21時点で警告が出ている次の正本仕様:

- `arch-state-management-skill-creator.md`
- `database-schema.md`
- `deployment-cloudflare.md`
- `deployment-secrets-management.md`
- `environment-variables.md`

## 依存関係

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`

## 苦戦箇所・知見

本タスク中に `deployment-secrets-management.md` はlocal deploy token bridgeを
追記したため、500行超過警告の対象として再確認された。ただし警告対象は5本の
大型正本にまたがり、単一alert-relay修正の同一waveで機械的に分割すると
参照先・topic-map・quick-referenceの意味的整合を崩すリスクが高い。

## 受け入れ基準

- `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` が500行超過警告0件で終了する。
- 分割後の親/子referenceが500行以内。
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行後、topic-map / keywords が更新済み。
- `.claude/skills/aiworkflow-requirements` と `/Users/dm/.agents/skills/aiworkflow-requirements` の `diff -qr` が出力なし。

## 参照

- `docs/30-workflows/task-alert-relay-global-scope-fix-001/outputs/phase-12/system-spec-update-summary.md`
- `.claude/skills/aiworkflow-requirements/scripts/validate-structure.js`
