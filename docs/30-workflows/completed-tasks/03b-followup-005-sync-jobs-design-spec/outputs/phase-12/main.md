# Phase 12: 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback |
| 作成日 | 2026-05-02 |
| 前 Phase | 11 (NON_VISUAL evidence 収集) |
| 次 Phase | 13 (PR 作成 — Refs #198) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま仕様書整備） |

## 目的

task-specification-creator skill の Phase 12 必須仕様（`.claude/skills/task-specification-creator/references/phase-12-spec.md`）に従い、本タスクの「実装ガイド」「仕様書同期」「未タスク検出」「skill feedback」を全て成果物として残す。本タスクは implementation / NON_VISUAL として TS ランタイム正本化まで完了し、root workflow state は `verified`、Phase 13 は `pending_user_approval` で close-out する。

## 実行タスク

1. Phase 12 必須 7 ファイルを `outputs/phase-12/` 配下に作成
   - `main.md`
   - `implementation-guide.md`（Part 1 中学生レベル概念説明 + Part 2 技術者レベル）
   - `system-spec-update-summary.md`
   - `documentation-changelog.md`
   - `unassigned-task-detection.md`（残課題 0 件でも出力必須）
   - `skill-feedback-report.md`（改善点なしでも出力必須）
   - `phase12-task-spec-compliance-check.md`（NON_VISUAL evidence と root / outputs artifacts parity を含む）
2. aiworkflow-requirements skill の `database-schema.md` `sync_jobs` 節を `_design/` 参照に更新する Step 1-A/B/C を `implementation-guide.md` に明記
3. verified 状態と Phase 13 pending_user_approval 方針を `system-spec-update-summary.md` に明記
4. 残課題（あれば）を `unassigned-task-detection.md` に転記し、引き取り先を確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須 7 ファイル仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | Step 1-A/B/C 編集対象 |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | 正本仕様 |
| 必須 | outputs/phase-01/main.md 〜 outputs/phase-11/main.md | 各 Phase 成果物 |
| 推奨 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/outputs/phase-11/evidence.md | NON_VISUAL evidence |

## 実行手順（ステップ別）

### ステップ 1: implementation-guide.md（Part 1 / Part 2）

#### Part 1（中学生レベル概念説明）

- 「sync_jobs って何？」: Google Forms と D1 の橋渡しをする「やったことメモ帳」
- 「正本 1 個に集約する意味」: 同じルールが 2 箇所にあると片方だけ更新されてズレる事故を防ぐ
- 「PII を含めない理由」: メモ帳に個人情報を書くと事故時の影響が大きい
- 「lock TTL 10 分の意味」: 1 つの仕事を 10 分以内に終わらせる約束

#### Part 2（技術者レベル）

`_design/sync-jobs-spec.md` の正本性、03a / 03b spec の参照差し替え、`database-schema.md` の参照更新、indexes drift 解消、verify-indexes CI gate の通過条件を箇条書きで列挙。

#### Step 1-A/B/C（aiworkflow-requirements 同期手順）

| Step | 対象 | 操作 | 検証 |
| --- | --- | --- | --- |
| 1-A | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` 節の `metrics_json` / `job_type` / lock TTL 説明を `_design/sync-jobs-spec.md` 参照に置換 | `rg "_design/sync-jobs-spec" database-schema.md` |
| 1-B | `.claude/skills/aiworkflow-requirements/indexes/` | `mise exec -- pnpm indexes:rebuild` を実行 | index 生成が exit 0、差分は本 wave の説明可能な同期差分のみ |
| 1-C | `.github/workflows/verify-indexes.yml` | 通過確認 | PR 上で job が green |

### ステップ 2: phase12-task-spec-compliance-check.md

`.claude/skills/task-specification-creator/references/phase-12-spec.md` の必須項目チェックリストを順に評価し PASS/FAIL を記録する。

### ステップ 3: unassigned-task-detection.md

Phase 10 の残課題リストを転記。検出 0 件でもファイルを出力（必須）。形式:

| # | 残課題 | 引き取り先 | 起票要否 |
| --- | --- | --- | --- |
| 1 | (例) 03a 側 task spec の参照差し替え | 03a 取り込み後 follow-up | 起票（Issue 別途） |

検出 0 件の場合は「none」と明示。

### ステップ 4: skill-feedback-report.md

aiworkflow-requirements / task-specification-creator / github-issue-manager skill の利用結果について、改善点を以下構成で記録（改善点なしでも出力必須）:

- 1.1 aiworkflow-requirements: `_design/sync-jobs-spec.md` 配置位置の妥当性
- 1.2 task-specification-creator: implementation / NON_VISUAL タスクでの Phase 9-13 適用例
- 1.3 github-issue-manager: CLOSED Issue 上の docs spec 整備パターン
- 1.4 改善提案（なければ「none」）

### ステップ 5: documentation-changelog.md

| 日付 | 対象 | 変更 | コミット |
| --- | --- | --- | --- |
| 2026-05-02 | docs/30-workflows/_design/sync-jobs-spec.md | 新規作成 | (Phase 6 コミット) |
| 2026-05-02 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/phase-09.md..13.md | 新規作成 | 本コミット |
| 2026-05-02 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節を参照型に変更 | (Phase 8 コミット) |

### ステップ 6: system-spec-update-summary.md

- 本タスク要約（What が何で、なぜ implementation に再分類したか）
- close-out 方針: verified / implementation_complete_pending_pr
- Phase 13 が pending_user_approval である理由（commit / PR / push 禁止）

### ステップ 7: phase12-task-spec-compliance-check.md（NON_VISUAL 代替）

VISUAL test の代わりに、Phase 11 の evidence 3 種（cross-references / job_type coverage / indexes drift）を集約した代替 test result として記述する。

| 検査 | コマンド | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| cross-references | `rg -n "_design/sync-jobs-spec\.md" docs/30-workflows .claude/skills` | ≧1 件 | (実測) | PASS/FAIL |
| job_type coverage | `rg -n "forms_(response\|schema)_sync" apps/api/src/jobs` | 実装と `_design/` で一致 | (実測) | PASS/FAIL |
| indexes drift | `mise exec -- pnpm indexes:rebuild && git status --porcelain` | 出力なし | (実測) | PASS/FAIL |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 総括 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1 中学生 + Part 2 技術者 + Step 1-A/B/C |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 必須項目チェック |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 残課題（0 件でも出力必須） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill 利用フィードバック（改善点なしでも出力必須） |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | タスク要約 + close-out 方針 |
| メタ | artifacts.json | Phase 1-12 completed、Phase 13 pending_user_approval に更新 |

## 完了条件

- [ ] 必須 7 ファイルがすべて `outputs/phase-12/` 配下に存在する
- [ ] `implementation-guide.md` に Part 1 / Part 2 / Step 1-A/B/C が揃っている
- [ ] `unassigned-task-detection.md` が 0 件でも出力されている
- [ ] `skill-feedback-report.md` が改善点なしでも出力されている
- [x] `system-spec-update-summary.md` に close-out 方針（verified / Phase 13 pending_user_approval）が明記されている
- [ ] `phase12-task-spec-compliance-check.md` が NON_VISUAL 代替として 3 種検査の判定を記録している
- [ ] `phase12-task-spec-compliance-check.md` で MAJOR FAIL がない

## DoD（implementation / NON_VISUAL）

- task-specification-creator skill の Phase 12 必須仕様を満たす
- root workflow state は `verified`
- aiworkflow-requirements の `database-schema.md` 同期手順が `implementation-guide.md` に明文化されている
- 残課題があれば Issue 起票準備が完了している

## 次 Phase

- 次: 13（PR 作成 — Refs #198）
- 引き継ぎ事項: `implementation-guide.md` 主要見出し / 残課題リスト / `documentation-update-history.md`
- ブロック条件: 必須 7 ファイル不足 / Step 1-A/B/C 欠落 / `system-spec-update-summary.md` の close-out 方針未記載
