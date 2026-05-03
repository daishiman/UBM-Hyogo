# Phase 12: ドキュメント更新 — ut-web-cov-01-admin-components-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 12 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装完了状態を index / artifacts / aiworkflow-requirements skill / changelog に反映し、unassigned-task 検出と skill feedback を確定させ、Phase 13 PR 作成へ引き渡せる状態にする。

## 変更対象ファイルと変更種別

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/ut-web-cov-01-admin-components-coverage/index.md` | 改修 | `状態` を `implemented-local` → `phase-12 ドキュメント更新済 / phase-13 PR pending`、coverage 実測サマリ追記 |
| `docs/30-workflows/ut-web-cov-01-admin-components-coverage/artifacts.json` | 改修 | phase-05〜phase-12 の `status` を `pending` → `completed`。phase-13 は `pending` のまま |
| `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` | 改修 | 当タスクの行を `状態 = phase-12 完了 / phase-13 PR 待ち` に更新 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 改修 | 同タスクのステータス反映 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 自動再生成 | `pnpm indexes:rebuild` で更新 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 自動再生成 | 同上 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 自動再生成 | 同上 |
| `outputs/phase-12/main.md` | 新規 | 7 必須成果物の index |
| `outputs/phase-12/implementation-guide.md` | 新規 | Part 1（中学生レベル概念） + Part 2（技術者レベル：DRY 構造、AC、coverage 達成方法） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | specs / claude-design-prototype への影響有無（基本: 影響なし、テストインフラのみ） |
| `outputs/phase-12/documentation-changelog.md` | 新規 | docs と skill references の差分要約 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 未タスク検出ログ（0 件でも必須） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | aiworkflow-requirements / task-specification-creator への feedback |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | CONST_005 必須要素の自己点検 |

## 関数・型・モジュール構造

ドキュメント成果物のみ。新規モジュールなし。

## 入出力・副作用

- 入力: Phase 5〜11 の outputs、index.md、artifacts.json、aiworkflow-requirements references
- 出力: 上表 7 ファイル + 改修 4 ファイル + 自動再生成 3 indexes
- 副作用: `pnpm indexes:rebuild` 実行で indexes が書き換わる

## ドキュメント更新内容

### index.md

```diff
- 状態: implemented-local
+ 状態: implemented-local / implementation / Phase 1-12 completed / Phase 13 pending_user_approval
```

`coverage 実測` 節に Phase 11 evidence の参照リンクを追加。

### artifacts.json

phase-05〜phase-12 の各 entry の `status` を `completed` に変更し、`evidence` フィールドに `outputs/phase-NN/main.md` を明記。phase-13 は `pending` のまま。

### workflow-ut-coverage-2026-05-wave-artifact-inventory.md

該当タスク行を以下に更新:

| task | 状態 | evidence |
| --- | --- | --- |
| ut-web-cov-01-admin-components-coverage | phase-12 完了 / phase-13 PR 待ち | `docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/coverage-target-files.txt` |

### task-workflow-active.md

UT coverage wave セクション内に `ut-web-cov-01-admin-components-coverage` の最新ステータスと evidence path を集約反映する。独立セクションは作らず、wave inventory / active workflow / quick-reference / resource-map の current canonical set を同一内容にそろえる。

## unassigned-task 検出方針

以下を比較し、ut-web-cov-01 の範囲外で検出された改善点を `unassigned-task-detection.md` に列挙する:

- Phase 8 で抽出した DRY 化候補のうち本タスク外（例: public/member 配下のテスト）
- coverage 実測時に admin component 以外で 85% 未満が見つかった場合
- ロジック実装の bug を発見した場合（テストで露見した production code 不具合）

0 件の場合も「0 件確認」を明記。

## テスト方針

ドキュメント Phase のためテスト実行なし。`pnpm indexes:rebuild` 後に `verify-indexes-up-to-date` 相当の差分が CI で blocker にならないことを確認するため、ローカルで以下を実行:

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes
```

## ローカル実行コマンド

```bash
mise exec -- pnpm indexes:rebuild
```

## 完了条件 (DoD)

- [ ] index.md の `状態` が更新済み
- [ ] artifacts.json の phase-05〜phase-12 status が `completed`
- [ ] aiworkflow-requirements references 2 ファイルが更新済み
- [ ] indexes 3 ファイルが `pnpm indexes:rebuild` 後の最新状態
- [ ] outputs/phase-12 配下 7 必須成果物が揃っている
- [ ] unassigned-task-detection.md と skill-feedback-report.md は 0 件でも作成
- [ ] phase12-task-spec-compliance-check.md で CONST_005 全項目 PASS

## 参照資料

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`
- `outputs/phase-11/main.md`

## サブタスク管理

- [ ] index.md / artifacts.json 更新
- [ ] aiworkflow-requirements references 更新
- [ ] indexes:rebuild 実行
- [ ] outputs/phase-12 7 ファイル作成
- [ ] CONST_005 self-check PASS

## 成果物

上記 7 必須 + 改修 4 + 自動再生成 3。

## タスク100%実行確認

- [ ] 必須セクション充足
- [ ] 0 件成果物を省略していない
- [ ] commit / push / PR を実行していない（Phase 13 で実施）

## 次 Phase への引き渡し

Phase 13 へ PR 作成手順、ブランチ命名、PR 本文構成、CI 確認手順を引き継ぐ。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。
