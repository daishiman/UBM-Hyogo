# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 12 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

5 必須タスク（実装ガイド / システム仕様更新 / ドキュメント更新履歴 / 未タスク検出 / スキルフィードバック）をすべて完了させ、`implementation-ready` ステータスとして close-out する。skill ledger の正本 fragment 化を skill 自身のドキュメントへ反映する **ドッグフーディング** が肝。

## 実行タスク

- Task 12-1 〜 12-5 を順番に実行し、各タスクの結果を `outputs/phase-12/main.md` に PASS / FAIL で記録する。
- Phase 2 `outputs/phase-2/fragment-schema.md` / `outputs/phase-2/render-api.md` と Phase 5 `outputs/phase-5/runbook.md` を入力にして、仕様更新対象が future implementation contract として閉じていることを確認する。
- Phase 6 `outputs/phase-6/fragment-runbook.md`、Phase 7 `outputs/phase-7/coverage.md`、Phase 8 `outputs/phase-8/before-after.md`、Phase 9 `outputs/phase-9/quality-gate.md`、Phase 10 `outputs/phase-10/go-no-go.md` を横断参照し、Phase 12 成果物へ反映漏れがないことを確認する。

## 5 必須タスク

### Task 12-1: 実装ガイド作成（2 パート構成）

`outputs/phase-12/implementation-guide.md`

#### Part 1: 中学生レベル（日常の例え話・専門用語なし）

- skill ledger は「クラス全員が 1 冊のノートに順番に書き込む日記帳」だった。同じ行に同時に書こうとすると、ぶつかってしまう。
- A-2 では「日記帳をやめて、1 件ごとに小さなふせん（fragment）を別々に貼る」方式に変える。
- ふせんは時刻と名前と通し番号（nonce = 大きなさいころみたいなもの）で必ず別の場所に貼られる。
- 後から読むときは `pnpm skill:logs:render` という「ふせんを時間順に並べて 1 枚の紙に印刷する道具」を使う。
- 古い日記帳は捨てずに `_legacy.md`（れがしー＝過去の記録）として残しておく。

専門用語セルフチェック表:

| 専門用語 | 日常語の言い換え |
| -------- | ---------------- |
| fragment | 小さなふせん |
| Changesets パターン | ふせん方式 |
| append-only | 新しい行を後ろに足し続けるルール |
| nonce | ぶつからないようにする乱数の通し番号 |
| front matter | ふせんの上に書くタイトル欄 |
| render | ふせんを時間順に並べて印刷する作業 |
| legacy include window | 古い日記帳をいつまで一緒に印刷するかの期間（30 日） |

#### Part 2: 開発者レベル（型定義・API・コード例）

- TypeScript 型: `RenderSkillLogsOptions`（`skill` / `since` / `out` / `includeLegacy`）
- CLI: `pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]`
- 終了コード: `0` 正常 / `1` front matter 不正 / `2` `--out` tracked canonical 拒否
- fragment 命名 regex: `^(LOGS|changelog|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$`
- nonce: 8 hex（4 byte）／衝突期待値（秒間 1000）≈ `1.16×10⁻⁴`
- front matter 必須: `timestamp` / `branch` / `author` / `type`
- legacy include window: 30 日
- エラーハンドリング: front matter 欠損 / parse 不能 → 対象 path を stderr 出力 + `process.exit(1)`
- 設定可能パラメータ一覧: 上記すべて

### Task 12-2: システム仕様更新（Step 1-A 〜 1-G + 条件付き Step 2）

`outputs/phase-12/system-spec-update-summary.md`

| Step | 内容 |
| ---- | ---- |
| 1-A | 完了タスク記録：`docs/30-workflows/completed-tasks/` 移動候補登録、関連ドキュメントリンク、変更履歴、topic-map.md 更新 |
| 1-B | 実装状況テーブルを `implementation-ready` に更新（commit / PR は未実施） |
| 1-C | 関連タスクテーブル更新（A-1 / A-3 / B-1 のステータスを current facts へ） |
| 1-D | 上流 runbook 差分追記タイミング判定（same-wave / Wave N+1 / baseline 留置）を `runbook-diff-plan.md` に記録 |
| 1-E | documentation changelog と task workflow 台帳の同期結果を記録 |
| 1-F | aiworkflow-requirements / task-specification-creator の LOGS 相当を fragment 経由で更新 |
| 1-G | validation matrix の 4 系統 validator を実行し、baseline warning と current warning を分離 |
| 2 | 新規インターフェース追加あり（`renderSkillLogs` / `RenderSkillLogsOptions`）→ aiworkflow-requirements 仕様の `interfaces-*.md` に追記 |

### Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md`

- Step 1-A 〜 1-G / Step 2 の結果を **個別に明記**（「該当なし」も記録）
- workflow-local 同期と global skill sync を別ブロックで記録（FB-BEFORE-QUIT-003 対応）
- 生成: `node scripts/generate-documentation-changelog.js` 経由

### Task 12-4: 未タスク検出（**0 件でも出力必須**）

`outputs/phase-12/unassigned-task-detection.md`

検出ソース:
- 元仕様書スコープ外項目: A-1 / A-3 / B-1（後続タスクとして既登録）
- Phase 3 / 10 MINOR 指摘
- Phase 11 smoke で発見した改善余地
- コードコメント TODO / FIXME / HACK / XXX
- `describe.skip` の旧参照残存

未タスクテンプレ必須セクション 4 種:
1. 苦戦箇所【記入必須】
2. リスクと対策
3. 検証方法
4. スコープ（含む / 含まない）

```bash
node scripts/detect-unassigned-tasks.js --scan scripts --output .tmp/unassigned-candidates.json
```

### Task 12-5: スキルフィードバック（**改善点なしでも出力必須**）

`outputs/phase-12/skill-feedback-report.md`

- テンプレート改善: Phase テンプレートで漏れた点（例: NON_VISUAL タスクで 4 worktree smoke を Phase 11 に置く運用が SKILL.md 既定にない）
- ワークフロー改善: 機械検証や手順分岐の改善余地
- ドキュメント改善: `Anchors:` に「変更履歴は fragment で書け」を A-3 で追記する候補

`outputs/phase-12/phase12-task-spec-compliance-check.md` を root evidence として残す。

## ドッグフーディング（最重要）

- task-specification-creator の SKILL changelog を fragment 化対象として最優先で扱う。
- aiworkflow-requirements の LOGS を fragment 化対象として最優先で扱う。
- skill 自身の changelog / LOGS への直接 append が writer 経路に残っていないことを CI guard でチェック:
  ```bash
  git grep -n 'SKILL-changelog\.md' .claude/skills/   # => 0 件
  git grep -n 'LOGS\.md'           .claude/skills/   # => 0 件（writer 経路）
  ```

## 実行前チェック（FB-Feedback 2）

Phase 12 着手の **最初の作業** として、`outputs/artifacts.json` と各 `phase-*.md` の artifact 名を 1 対 1 で突合し、不一致があれば着手前に修正する。

## 参照資料

- Phase 1〜11 全成果物
- Issue #130 主要技術仕様
- task-specification-creator skill SKILL.md §Phase 12 重要仕様
- task-specification-creator `references/spec-update-workflow.md` / `spec-update-validation-matrix.md`
- aiworkflow-requirements skill SKILL.md

## 成果物（5 必須 + root evidence）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`（Part 1 / Part 2 + 専門用語セルフチェック）
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力）
- `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力）
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/runbook-diff-plan.md`（Step 1-D）

## 完了条件

- [ ] 5 必須タスクすべて完了。
- [ ] Part 1 が中学生レベル（日常の例え話含む）で書かれている。
- [ ] Part 2 が型定義・CLI・終了コード・エラーハンドリングを網羅。
- [ ] LOGS / SKILL 更新が aiworkflow-requirements と task-specification-creator の両 skill に対して fragment 経由で実施されている。
- [ ] topic-map.md が再生成されている。
- [ ] 未タスク検出レポートが 0 件でも出力されている。
- [ ] スキルフィードバックが改善点なしでも出力されている。
- [ ] CI guard（writer 残存 grep 0 件）の expected が記録されている。
- [ ] Step 1-A 〜 1-G / Step 2 の実施有無と根拠が system-spec-update-summary.md に記録されている。
- [ ] artifacts.json と outputs 実体の 1 対 1 突合完了。
- [ ] artifacts.json の Phase 12 status と整合。
