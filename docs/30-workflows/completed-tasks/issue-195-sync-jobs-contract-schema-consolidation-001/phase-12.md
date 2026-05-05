# Phase 12: 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback（strict 7 ファイル）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 11 (NON_VISUAL evidence 収集) |
| 次 Phase | 13 (PR 作成) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

task-specification-creator skill 規約 + L-004（Phase 12 strict 7 filenames）に従い、`outputs/phase-12/` 配下に固定 7 ファイルを作成する。実装結果の振り返り、未タスク検出、skill feedback、中学生レベル概念説明を含む。

## 目的

Phase 13（PR 作成）に必要な実装ガイド・仕様書同期・未タスク検出・skill feedback を生成し、Phase 12 strict filenames 規約を満たす。

## 必須生成ファイル一覧（strict 7 件 / L-004）

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | outputs/phase-12/main.md | 全体総括 / AC 達成状況 / 4 条件再評価 / 中学生レベル概念説明 |
| 2 | outputs/phase-12/implementation-guide.md | PR 作成時に Phase 13 へ供給する実装ガイド |
| 3 | outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements Step 1-A/B/C と Step 2 の同期結果 |
| 4 | outputs/phase-12/documentation-changelog.md | 触ったドキュメント全件の before/after サマリ |
| 5 | outputs/phase-12/unassigned-task-detection.md | スコープ外タスク検出（0 件でも出力必須） |
| 6 | outputs/phase-12/skill-feedback-report.md | task-specification-creator skill / aiworkflow-requirements への改善提案 |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | 既存 phase 規約への準拠確認 |

> **注**: ファイル名は固定。`system-spec-update.md` 等の旧名混入禁止（L-004）。

## ファイル別ガイド

### 1. main.md

- AC-1〜AC-8 の達成状況サマリ
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価
- 中学生レベル概念説明セクション（最低 3 項目）:
  - **「なぜ runtime SSOT の置き場所を ADR で記録するのか」**:
    > プログラムで使う「決まった値」を 1 か所に集めるとき、その「1 か所」をどこに置くかには色んな選び方がある。今回は `apps/api` 配下を選んだが、5 年後の人がこの選択を見て「なんで `packages/shared` じゃないの？」と疑問に思ったとき、答えがどこにも書かれていないと、また同じ議論を最初からやり直すことになる。ADR は「過去の自分が未来の自分に書き残すメモ」。
  - **「なぜ owner / co-owner を表で決めるのか」**:
    > 1 つのファイルを「誰でも勝手に変えていい」状態にすると、Aさんと Bさんが同時に違う方向で変えてしまい、つじつまが合わなくなる。owner = 主担当 / co-owner = サブ担当を表で決めておくと、変更前に「相談すべき相手」が一目でわかる。クラスの「学級委員 / 副委員」と同じ役割分担。
  - **「なぜ canonical 値を契約テストで縛るのか」**:
    > たとえば `SYNC_LOCK_TTL_MS = 10 * 60 * 1000`（10 分）を、誰かが「ちょっと短い気がする」と思って `5 * 60 * 1000` に書き換えてしまうと、ロック動作が想定外になる。テストで `expect(SYNC_LOCK_TTL_MS).toBe(600000)` と書いておけば、書き換えた瞬間に CI が赤くなって気づける。「鍵の暗証番号を変えたら警報が鳴る」のと同じ。

### 2. implementation-guide.md

PR 本文の元になる材料。次を含む:

- 概要（What / Why / 影響範囲）
- 変更ファイル一覧（編集 5 / 条件付き 2）
- 主要 diff サンプル（Phase 6 の ADR-001 / owner 表行）
- 動作確認手順（Phase 11 evidence コマンド再掲）
- ロールバック手順
- 関連 Issue: `Refs #435`

### 3. system-spec-update-summary.md

- aiworkflow-requirements Step 1-A（resource-map）/ Step 1-B（topic-map）/ Step 1-C（quick-reference）への影響有無
- `database-schema.md` の `sync_jobs` 節更新有無（Phase 7 結果）
- Step 2 同期: indexes 再生成結果（Phase 9）

### 4. documentation-changelog.md

- `_design/sync-jobs-spec.md`: ADR-001 セクション追加 + §2 / §3 / §5 への owner 表参照リンク追記（before / after を 2-4 行）
- `_design/sync-shared-modules-owner.md`: 冒頭注釈拡張 + owner 表行追加（before / after）
- `database-schema.md`: `sync_jobs` 節 no-op or 更新（before / after）
- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`: 契約テスト追加件数（条件付き）
- `unassigned-task/task-issue195-...`: status 更新（before / after）

### 5. unassigned-task-detection.md

0 件でも出力する。Phase 8 で発見した「03a / 03b active spec で `_design/sync-jobs-spec.md` 未参照のもの」があれば、ここに分割タスク候補として記述する。本タスクスコープ外で別 PR 化が必要な場合は、起票候補 issue タイトルと粒度を記述（先送り文言は使わず、起票推奨という形で記述）。

### 6. skill-feedback-report.md

- 良かった点: 例「ADR-001 構成（Status / Context / Decision / Rationale / Alternatives / Links）が再利用しやすい」
- 改善提案: 例「runtime SSOT 配置 ADR と owner 表登録が同タスク内で必要になるケースが多いため、task-specification-creator に「runtime spec governance」テンプレを追加してほしい」
- aiworkflow-requirements への提案: 例「`_design/` 配下の ADR-### 番号採番の運用ルールを reference に明文化してほしい」

### 7. phase12-task-spec-compliance-check.md

- Phase 1〜13 全 phase ファイルが規約（メタ情報 / 第 0 セクション / 目的 / 実行タスク / 参照資料 / 実行手順 / 成果物 / 完了条件 / 次 Phase）を満たしているか自己点検
- L-001〜L-005 の適用結果確認
- strict 7 ファイル名の検証

## ローカル実行コマンド

```bash
WORKFLOW="docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001"
ls "$WORKFLOW/outputs/phase-12/"        # 7 件あること
ls "$WORKFLOW/outputs/phase-12/" | wc -l   # 7 と出ること

# strict filenames 検証
test -f "$WORKFLOW/outputs/phase-12/main.md"
test -f "$WORKFLOW/outputs/phase-12/implementation-guide.md"
test -f "$WORKFLOW/outputs/phase-12/system-spec-update-summary.md"
test -f "$WORKFLOW/outputs/phase-12/documentation-changelog.md"
test -f "$WORKFLOW/outputs/phase-12/unassigned-task-detection.md"
test -f "$WORKFLOW/outputs/phase-12/skill-feedback-report.md"
test -f "$WORKFLOW/outputs/phase-12/phase12-task-spec-compliance-check.md"
```

## DoD

- [ ] strict 7 ファイル全件が存在
- [ ] main.md に中学生レベル概念説明 3 項目以上
- [ ] implementation-guide.md が PR 本文として流用可能
- [ ] unassigned-task-detection.md が存在し、未タスク 0 件の場合も理由を記載
- [ ] skill-feedback-report.md に改善提案 2 項目以上
- [ ] phase12-task-spec-compliance-check.md で全 phase 規約準拠を自己点検

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | 全体総括 / 中学生レベル説明 |
| ドキュメント | outputs/phase-12/implementation-guide.md | PR 用実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 同期結果 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill 改善提案 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 規約準拠自己点検 |
| メタ | artifacts.json | Phase 12 を completed に更新（実行時） |

## 統合テスト連携

- ドキュメント生成のみ
- Phase 13 で PR 作成に流用

## 完了条件

- [ ] strict 7 ファイル全件存在
- [ ] 中学生レベル説明 3 項目以上
- [ ] implementation-guide.md が Phase 13 へ供給可能
- [ ] L-004 ファイル名 drift なし

## 次 Phase

- 次: 13（PR 作成）
- 引き継ぎ事項: implementation-guide.md
- ブロック条件: 必須ファイル不足 / strict filenames 違反

## 実行タスク

- strict 7 files を生成する
- aiworkflow-requirements の Step 1-A/B/C と Step 2 を同期する
- skill feedback を今回サイクル内で昇格する

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`
- Phase 11: `outputs/phase-11/main.md`
