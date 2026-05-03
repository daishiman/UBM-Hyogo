# Phase 12: ドキュメント更新 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 12 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

Phase 11 で得る予定の実測結果（staging / production curl 200 / wrangler tail
`transport: 'service-binding'` / local fallback regression なし）をシステム仕様書・
skill index・後続タスクへ反映し、task-specification-creator skill が要求する
Phase 12 必須 7 成果物を作成する。

## 実行タスク

1. Phase 12 strict 7 files を `outputs/phase-12/` に作成する。
2. root / outputs `artifacts.json` parity を確認する。
3. aiworkflow-requirements の discoverability を更新する（または no-op 理由を記録する）。
4. unassigned-task-detection と skill-feedback-report を 0 件でも作成する。
5. compliance check で runtime evidence pending と spec completeness PASS を分離する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 必須 5 タスク + Task 6 compliance

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（aiworkflow-requirements / `task-workflow-active.md` 等）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（**0 件でも出力必須**）
5. スキルフィードバックレポート作成（**改善点なしでも出力必須**）
6. compliance check（最低 7 成果物の実体確認 + spec/runtime 状態の分離）

## 必須成果物 7 ファイル

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実装ガイドの構成（Part 1 中学生レベル）

- 「Cloudflare Workers の service-binding とはなにか」を「同じ建物内の内線電話 vs
  外線電話」に例える
- 「loopback subrequest」を「自分の家の電話を、家の外まで出てから自分の家にかけ直す」
  に例える
- 専門用語セルフチェック表（5 用語以上：service-binding / loopback / subrequest /
  fallback / wrangler tail / transport label など）
- なぜを先行して説明し、どうを後に説明する

## 実装ガイドの構成（Part 2 技術者レベル）

- 変更ファイル一覧（`apps/web/src/lib/fetch/public.ts` / `apps/web/wrangler.toml`）
- 関数シグネチャと service-binding 分岐ロジック（`env.API_SERVICE` 優先、undefined 時 HTTP fallback）
- `wrangler.toml` の `[[env.staging.services]]` / `[[env.production.services]]` 差分
- deploy & verification 手順（`bash scripts/cf.sh deploy` → curl → tail）
- AC ↔ evidence path 対応表
- DoD（AC-1〜AC-6 全 PASS、redaction PASS、artifacts parity PASS）

## システム仕様書更新先

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  （本タスクの完了状態 / `apps/web` fetchPublic service-binding 採用の決定記録）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  （`apps/web` → `apps/api` の経路が service-binding が正本になることを必要時に追記）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  （本 workflow root の canonical 行を追加）
- `apps/web/wrangler.toml` の services 設定が正本になる旨を quick-reference 等に
  反映するか判定（spec_created 段階では初期 system spec sync と runtime completion pending を分離して記録）

## skill feedback 観点

- service-binding を「ranching の正本ルート」として extract できるテンプレが必要か
- VISUAL_ON_EXECUTION × deploy verification の運用パターンを skill 側に追加すべきか
- HTTP fallback と service-binding の二経路を持つ実装の Phase 11 evidence 取得方法を
  skill 側にプロモートするか

## docs-only / spec_created の境界

- 本タスクは `taskType=implementation` だが Phase 11 を user 明示指示で実行する gate 設計
- `workflow_state` は実 staging / production 両 deploy PASS まで `spec_created` のまま据え置く
- Phase 12 close-out で `workflow_state` を勝手に `completed` に書き換えない
- spec_created 段階では `system-spec-update-summary.md` の決定記録は
  初期同期済み箇所と Phase 11 PASS 後に完了昇格する箇所を分離して明示する

## サブタスク管理

- [ ] 7 成果物を全て作成
- [ ] Part 1 / Part 2 の二段構成で implementation-guide を書く
- [ ] system-spec-update-summary に変更先と影響範囲を明記
- [ ] unassigned-task-detection を 0 件でも出力
- [ ] skill-feedback-report を改善なしでも出力
- [ ] compliance-check で 7 成果物の実体を確認

## 成果物

- 上記「必須成果物 7 ファイル」一式

## 完了条件

- 7 成果物が全て実体として存在
- artifacts parity が PASS
- system spec 更新（または no-op 理由）が記録済み
- workflow_state が境界ルールに従って更新（または据え置き）されている

## タスク100%実行確認

- [ ] 7 成果物が揃っている
- [ ] Part 1 が中学生レベルになっている
- [ ] unassigned-task / skill-feedback が 0 件でも出力されている
- [ ] runtime evidence pending と spec completeness PASS が compliance-check で分離されている

## 次 Phase への引き渡し

Phase 13 へ、commit / push / PR 作成のための前提整理を渡す。実行は user 明示指示後。
