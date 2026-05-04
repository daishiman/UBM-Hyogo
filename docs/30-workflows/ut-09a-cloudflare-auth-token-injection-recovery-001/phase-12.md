# Phase 12: ドキュメント更新 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 12 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

Phase 11 で得る予定の実測結果（`bash scripts/cf.sh whoami` exit 0 / account identity / 三段ラップ切り分け / redaction PASS / 親タスク handoff）をシステム仕様書・skill index・後続タスクへ反映し、task-specification-creator skill が要求する Phase 12 必須 7 成果物を作成する。

## 実行タスク

1. Phase 12 strict 7 files を `outputs/phase-12/` に作成する
2. root / outputs `artifacts.json` parity を確認する
3. aiworkflow-requirements の discoverability を更新する（または no-op 理由を記録する）
4. unassigned-task-detection と skill-feedback-report を 0 件でも作成する
5. compliance check で runtime evidence pending と spec completeness PASS を分離する

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

- 「Cloudflare API Token」を「家の鍵」に例える
- 「1Password」を「鍵預かり所」に例える
- 「`.env` の op 参照」を「鍵預かり所のロッカー番号メモ」に例える
- 「op run → mise exec → wrangler の三段ラップ」を「鍵預かり所から鍵を出す → 正しい部屋に持って行く → 玄関を開ける」のフローに例える
- 「`wrangler login` 残置」を「予備の鍵を勝手に作って鍵預かり所と別管理してしまう状態」に例える
- 専門用語セルフチェック表（5 用語以上：API Token / 1Password / op run / mise exec / wrangler whoami / OAuth login など）
- なぜを先行して説明し、どうを後に説明する

## 実装ガイドの構成（Part 2 技術者レベル）

- 三段ラップの図解（op run → mise exec → wrangler）
- `scripts/cf.sh` / `scripts/with-env.sh` の役割と drift 確認手順
- `.env` op 参照存在確認の SOP（値を読まないキー名抽出のみ）
- 1Password item 存在確認 / token scope 点検 SOP
- 復旧手順（Stage 1〜3 切り分け → 復旧後 `whoami` → 親タスク handoff）
- AC ↔ evidence path 対応表
- DoD（AC-1〜AC-7 全 PASS、redaction PASS、artifacts parity PASS、親タスク handoff 完了）
- 失敗時の切り分け（op signin 未済 / token 失効 / `wrangler login` 残置）

## システム仕様書更新先

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  （本タスクの完了状態 / Cloudflare 認証復旧 SOP の正本化記録）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  （`bash scripts/cf.sh whoami` 失敗時の三段ラップ切り分け SOP 参照を必要時に追記）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  （本 workflow root の canonical 行を追加）
- runtime close-out 段階では Phase 11 executed evidence と system spec sync を同一状態へ揃えて記録

## skill feedback 観点

- 「op → mise → wrangler の三段ラップ切り分け SOP」を `.claude/skills/aiworkflow-requirements/references/cloudflare-cli-auth-recovery-sop.md` に promote 済み
- 「`.env` の値を読まないキー名抽出のみで存在確認する SOP」を同 SOP に promote 済み
- 「`wrangler login` 残置検知 SOP」を同 SOP に promote 済み
- 「NON_VISUAL × 認証復旧」の Phase 11 evidence 取得方法を `.claude/skills/task-specification-creator/references/phase-11-cloudflare-cli-non-visual-evidence.md` に追加済み

## runtime close-out の境界

- 本タスクは `taskType=implementation` かつ `visualEvidence=NON_VISUAL`
- `workflow_state` は実 `whoami` 復旧 PASS を受けて `runtime_evidence_captured` に同期済み
- Phase 12 close-out では `completed` ではなく `runtime_evidence_captured` として、Phase 13 user gate を維持する
- `system-spec-update-summary.md` は初期同期済み箇所と Phase 11 PASS 後の完了昇格箇所を同一 runtime state へ更新済み

## サブタスク管理

- [x] 7 成果物を全て作成
- [x] Part 1 / Part 2 の二段構成で implementation-guide を書く
- [x] system-spec-update-summary に変更先と影響範囲を明記
- [x] unassigned-task-detection を 0 件でも出力
- [x] skill-feedback-report を改善なしでも出力
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
- [ ] Part 1 が中学生レベルになっている（家の鍵 / 鍵預かり所 / ロッカー番号 の比喩）
- [ ] unassigned-task / skill-feedback が 0 件でも出力されている
- [ ] runtime evidence pending と spec completeness PASS が compliance-check で分離されている

## 次 Phase への引き渡し

Phase 13 へ、commit / push / PR 作成のための前提整理を渡す。実行は user 明示指示後。
