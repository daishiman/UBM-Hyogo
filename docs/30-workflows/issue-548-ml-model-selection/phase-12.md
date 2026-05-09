# Phase 12: 実装ガイド・未タスク・SSOT 同期・skill feedback

## 目的

Phase 12 必須 6 タスク + Sys を実行し、`outputs/phase-12/` 配下に **7 ファイル** を実体作成する。本 wave は synthetic implementation evidence + SSOT 同期として完了させ、production winner selection は FU-03-B / FU-03-D へ分離する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 必須タスク

### Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md`

- Part 1（中学生レベル）: 「複数の AI モデルから一番良いものを選ぶとは何か」「precision / recall / fallback rate を学校のテスト採点に例える」「Workers AI とローカル実行の違い」
- Part 2（技術者レベル）: 親 #515 Classifier interface の継承 / 3 ML classifier の差別化（IF=tree depth, XGB=boosted decision path, Workers AI=remote inference）/ comparison harness のループ / selection-criteria の tie-breaker / fallback rate と latency p95 の運用上意味 / model artifact serialization と secret leakage 防止

### Task 12-2: SSOT 更新（aiworkflow-requirements）

| 対象 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 選定モデル候補 3 種 / 選定基準 4 指標 / tie-breaker / synthetic vs production dataset 境界 / production switch 別タスク化 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 選定モデル promotion runbook（artifact 配置、env 切替、rollback 3 段階）。winner は未確定として扱う |

合わせて `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` と `.claude/skills/task-specification-creator/LOGS/_legacy.md` に本タスク entry を canonical absolute path で 1 行ずつ追加。

### Task 12-3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md`

- 上記 SSOT 2 ファイル + LOGS 2 ファイル + `artifacts.json` / `index.md` / `phase-01.md`〜`phase-13.md` + outputs を canonical absolute path で列挙

### Task 12-4: 未タスク検出レポート作成（**0 件でも作成必須**）

`outputs/phase-12/unassigned-task-detection.md`

本サイクル外として以下を未タスク化:

- **U-FIX-CF-ACCT-01-DERIV-04-FU-03-D**: production env での classifier 切替（migration apply prod は不要・親 #515 で完了済み、`CF_AUDIT_CLASSIFIER` の production var を選定 winner に切替 + post-switch 7 日観測）。完了条件: Phase 11 comparison report の winner が `threshold` 以外の場合に着手、production rollback 訓練済みであること

エントリは `docs/30-workflows/unassigned-task/` 配下に新規 md として起票（テンプレ必須 4 セクション: 苦戦箇所 / リスクと対策 / 検証方法 / スコープ）。

### Task 12-5: スキルフィードバックレポート作成

`outputs/phase-12/skill-feedback-report.md`

3 観点固定:

- **テンプレ改善**: 「複数候補の比較 + 自動選定」型タスクのテンプレ（candidates / criteria / tie-breaker の 3 セクション固定化）
- **ワークフロー改善**: comparison report を CI artifact として PR に添付させる仕組み（GitHub Actions upload-artifact）
- **ドキュメント改善**: 親タスクからの follow-up 連鎖（FU-03-A → B → C → D）の依存図を `task-specification-creator` references に追加

### Task 12-6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`

CONST_004（実装区分判定）/ CONST_005（変更ファイル / 関数シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD）/ CONST_007（今サイクルスコープ + 先送り理由）の各項目を本タスクが満たしていることを check 列で記録。

### Task 12-Sys: システム仕様書更新サマリ

`outputs/phase-12/system-spec-update-summary.md`

Task 12-2 の 2 ファイルへの差分要約。

## 完了条件

- [ ] `outputs/phase-12/` に 7 ファイル実体存在: `main.md` / `implementation-guide.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `system-spec-update-summary.md` / `phase12-task-spec-compliance-check.md`
- [ ] SSOT 2 ファイルが更新されている
- [ ] LOGS.md 2 ファイルに entry 追加
- [ ] FU-03-D 未タスクが `unassigned-task/` 配下に新規 md 起票

## 出力

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`
- 親 #515 phase-12

## 統合テスト連携

- Phase 11 evidence が本 Phase の test 証跡として参照される

## 実行タスク

| Task | 内容 |
| --- | --- |
| 12-1 | implementation-guide 作成 |
| 12-2 | SSOT 2 ファイル更新 |
| 12-3 | documentation-changelog 作成 |
| 12-4 | FU-03-D unassigned-task 起票 |
| 12-5 | skill-feedback-report 作成 |
| 12-6 | コンプライアンスチェック |
| 12-Sys | system-spec-update-summary 作成 |

## 依存Phase参照

Phase 1〜11 の成果物を上流契約として参照する。
