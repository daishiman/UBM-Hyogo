# Phase 12: 仕様反映（ドキュメント更新）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 仕様反映 |
| 視覚証跡区分 | NON_VISUAL |
| ワークフロー | spec_created |
| 作成日 | 2026-04-28 |
| 上流 | Phase 11 (手動テスト) |
| 下流 | Phase 13 (完了確認) |
| 状態 | pending |

## 目的

`docs/00-getting-started-manual/specs/` 配下に **skill ledger 仕様**を追記するための更新手順を固定し、
documentation-changelog で本タスクの位置づけを記録する。
spec_created workflow に従い、status は `spec_created` のままで `completed` に置き換えない。

## Phase 12 記録分離方針

- 「実行タスク」は plan、`Phase実行記録` と `outputs/phase-12/*.md` は current fact として扱う
- `outputs/phase-12/phase12-task-spec-compliance-check.md` を root evidence として必ず作成
- docs-only / spec_created workflow では Step 1-B の status を `spec_created` とし、
  `completed` へ置き換えない
- 仕様更新の有無は `documentation-changelog.md` と `system-spec-update-summary.md` で
  同じ結論にする
- spec 変更がある場合は `topic-map.md` を同 wave で再生成する

## 中学生レベル概念説明

### Q: なぜ「ファイルを分ける」だけで衝突が消えるの？

- 1 つのノートに 4 人が同時に書き込もうとすると、同じページの同じ行に書こうとして
  ぶつかります。
- でも、4 人がそれぞれ別のページに書けば、後で全員のページを集めるだけで済みます。
- これが fragment 化の発想です。
- 本タスクでは「ノート 1 冊」だった `LOGS.md` を「ページ 1 枚 = 1 ファイル」に分け、
  それぞれの worktree が**自分のページだけを作る**ようにします。

### Q: gitignore って何？

- Git が「この変更は記録しなくていい」と判定する目印です。
- 機械が自動で作り直すファイル（カウンタとか）は、人間が変更を追跡しても意味がないので
  ignore します。

### Q: merge=union はなに？

- Git に「このファイルは両方の追記をくっつけて保存していいよ」と教える設定です。
- 行ごとに独立したログだけに使えます。

## 実行タスク

### タスク 1: implementation-guide.md 作成

**実行手順**:
1. A-1 / A-2 / A-3 / B-1 の各実装タスクへ向けたガイド
2. 各タスクの担当者が「どのファイルを読むべきか」「どの順で作業するか」を一覧化
3. `outputs/phase-12/implementation-guide.md` に集約

### タスク 2: system-spec-update-summary.md 作成

**実行手順**:
1. `docs/00-getting-started-manual/specs/` への追記方針
   - 新規 section: 「skill ledger 設計（fragment / gitignore / merge=union）」
   - 配置案: `docs/00-getting-started-manual/specs/skill-ledger.md`（新規）
   または既存 specs に append
2. spec 変更が「あり」となる場合の topic-map 再生成手順
3. `outputs/phase-12/system-spec-update-summary.md` に記録

### タスク 3: documentation-changelog.md 作成

**実行手順**:
1. 本タスクで追加した 13 phase 仕様書をエントリ化
2. spec 変更があれば spec エントリも追加
3. `outputs/phase-12/documentation-changelog.md` に記録

### タスク 4: phase12-task-spec-compliance-check 作成

**実行手順**:
1. Task / Step / validator / artifacts.json / current-baseline の同値性を集約
2. spec_created workflow status の保持を確認
3. `outputs/phase-12/phase12-task-spec-compliance-check.md` に記録

## Task 4: 未タスク検出（0 件でも出力必須）

1. Phase 3 / 10 / 11 で MINOR または後続化と判定した項目を棚卸しする。
2. 未タスクが 0 件の場合も「0件」と明記する。
3. `outputs/phase-12/unassigned-task-detection.md` に記録する。

## Task 5: スキルフィードバックレポート

1. task-specification-creator / aiworkflow-requirements に反映すべき改善点を確認する。
2. 改善点がない場合も「改善点なし」と明記する。
3. `outputs/phase-12/skill-feedback-report.md` に記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-2/file-layout.md | specs 追記対象と施策対象の確認 |
| 必須 | outputs/phase-2/fragment-schema.md | skill-ledger 仕様の fragment 契約 |
| 必須 | outputs/phase-5/gitignore-runbook.md | A-1 後続タスクの参照元 |
| 必須 | outputs/phase-6/fragment-runbook.md | A-2 後続タスクの参照元 |
| 必須 | outputs/phase-7/main.md | AC マトリクス |
| 必須 | outputs/phase-8/before-after.md | 用語統一結果 |
| 必須 | outputs/phase-9/quality-checklist.md | Phase 12 前提の品質ゲート |
| 必須 | outputs/phase-10/go-no-go.md | Go 判定と実装順序 |
| 必須 | outputs/phase-11/manual-smoke-log.md | 検証結果（実行時に参照） |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | spec 追記候補 |
| 必須 | .claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md | テンプレ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | A-1〜B-1 実装担当者向け guide |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | specs 追記方針 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | docs 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出（0件でも出力） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback（改善点なしでも出力） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | root evidence |

## 完了条件

- [ ] 7 ファイル作成
- [ ] AC-7 が満たされる（specs に skill ledger 仕様を追記する手順が changelog と整合）
- [ ] spec_created status が `completed` に置き換わっていない
- [ ] artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: Phase 13 (完了確認)
- 引き継ぎ事項: implementation-guide.md / changelog
