# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（Phase 12 canonical 7 ファイル close-out） |
| 作成日 | 2026-05-01 |
| 前 Phase | 11（手動検証 - NON_VISUAL 縮約） |
| 次 Phase | 13（PR 作成 - pending_user_approval） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

task-specification-creator skill が定める **Phase 12 canonical 7 ファイル（main.md + 6 補助成果物）**を漏れなく出力し、aiworkflow-requirements 側 `deployment-cloudflare.md` 判定表 / CLAUDE.md スタック表 / LOGS.md ×2 / topic-map.md / artifacts ledger 同期を **同 wave** で完了する。本 Phase は本タスクの最終文書ゲートであり、Phase 13 PR 作成に進むための close-out evidence をすべて揃える。

## Phase 12 canonical 7 ファイル

| # | 成果物 | 必須内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリー。7 ファイル実体確認と close-out 状態の入口 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念）+ Part 2（技術者レベル）+ 視覚証跡セクション（NON_VISUAL 固定文 + manual-test-result.md 参照） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 側更新差分（deployment-cloudflare.md 判定表 / CLAUDE.md 記述） |
| 4 | `outputs/phase-12/documentation-changelog.md` | Step 1-A〜1-C + Step 2 個別記述、5 ファイル同 wave 同期チェック結果 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力必須。current / baseline 分離。Phase 10 MINOR 格下げ + 関連タスク差分確認 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも必須。ADR タスクの phase 解釈について feedback |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence。7 ファイル parity / artifacts.json と outputs/artifacts.json parity / generate-index.js 実行確認 |

## Task 1: implementation-guide.md（2 パート構成）

### Part 1: 中学生レベル概念

| 要件 | 内容 |
| --- | --- |
| 日常の例え話 | 「お店の看板（CLAUDE.md）と実際のメニュー（wrangler.toml）が違うと、お客さんが混乱する。今回はその看板とメニューが一致するように決め事（ADR）を作った」 |
| 専門用語回避 | 「Cloudflare」「Pages」「Workers」は使う場合即座に「Webサイトを動かすしくみ」と説明 |
| なぜ → 何を の順 | (a) なぜ ADR が必要か → (b) 何を決めたか → (c) どう守るか |

### Part 2: 技術者レベル

- ADR 配置先 / ファイル名規約
- deployment-cloudflare.md 判定表更新差分（Markdown table 形式）
- CLAUDE.md 更新差分（base case 別）
- 不変条件 #5 維持の Consequences 明記
- `@opennextjs/cloudflare` バージョン互換確認結果
- 関連タスク責務分離表

### 視覚証跡セクション（NON_VISUAL 固定文）

```markdown
## 視覚証跡

UI/UX変更なしのため Phase 11 スクリーンショット不要。

代替証跡:
- `outputs/phase-11/manual-test-result.md`: Phase 4 検証コマンド 5 種の再実行結果 + ADR レビューチェックリスト走査結果
- `outputs/phase-11/link-checklist.md`: 同 wave 8 ファイル死活確認
- `outputs/phase-11/ui-sanity-visual-review.md`: WEEKGRD-03 NON_VISUAL 宣言
```

## Task 2: system-spec-update-summary.md

aiworkflow-requirements 側の正本仕様更新を Step 別に記録：

| Step | 必須 | 内容 |
| --- | --- | --- |
| Step 1-A | ✅ | 完了タスク記録（aiworkflow-requirements の completed ledger に本タスクを `spec_created` で追加）+ LOGS.md ×2 + topic-map.md 更新 |
| Step 1-B | ✅ | 実装状況テーブル更新: 本タスクは `spec_created`（実装完了ではないため `completed` にしない） |
| Step 1-C | ✅ | 関連タスクテーブル更新: `task-impl-opennext-workers-migration-001` / `UT-GOV-006` のステータスを current facts へ更新 |
| Step 2 | ✅ | Pages / Workers deploy target の stale contract withdrawal と正本同期。`deployment-cloudflare.md` / `deployment-cloudflare-opennext-workers.md` / `CLAUDE.md` の関係を ADR Decision へ接続し、現状 Pages 維持・Workers cutover・段階移行のいずれを採っても矛盾しない canonical 表現へ更新する |

> **`spec_created` docs-only task の close-out ルール**: Step 1-A〜1-C と Step 2 を N/A にしない。今回の Step 2 は新規 API / 型追加ではなく、stale contract withdrawal / topology drift 正本同期として発火する。

## Task 3: documentation-changelog.md

[Feedback BEFORE-QUIT-003] 対応として workflow-local 同期と global skill sync を **別ブロック**で記録：

```markdown
## workflow-local 同期
- index.md: phase status 更新
- artifacts.json: phases[*].status 同期 + workflow_state
- outputs/artifacts.json: root parity 確認

## global skill sync
- aiworkflow-requirements/references/deployment-cloudflare.md: 判定表「現状/将来/根拠リンク」更新
- CLAUDE.md: スタック表 1 行（base case 別）
- aiworkflow-requirements/LOGS.md: close-out 記録
- task-specification-creator/LOGS.md: close-out 記録
- aiworkflow-requirements/topic-map（generate-index.js 再実行）

## 5 ファイル同 wave 同期チェック [FB-04]
- backlog ledger / completed ledger / lane index / workflow artifacts / skill artifacts の 5 点突合
- 全件同一 wave で更新確認
```

## Task 4: unassigned-task-detection.md（0 件でも必須）

current / baseline 分離 + 関連タスク差分確認 [FB-CANCEL-004-2] 対応：

```markdown
## current（即時起票推奨）
（base case が cutover の場合）
- task-impl-opennext-workers-migration-001 連動: wrangler.toml 書き換え（重複: 既存タスクで吸収可 → 起票省略）
- task-impl-opennext-workers-migration-001 連動: web-cd.yml 切替（同上）
- 別タスク: Cloudflare 側 Pages → Workers script 切替手動 runbook

（base case が保留の場合）
- 0 件（current）

## baseline（将来再評価）
- @opennextjs/cloudflare メジャーバージョン更新時の再評価タスク
- (保留採択時のみ) 将来の cutover 再検討トリガ条件達成時のタスク

## 関連タスク差分確認
- task-impl-opennext-workers-migration-001: 実 cutover の責務 → 重複なし、blocks 関係維持
- UT-GOV-006-web-deploy-target-canonical-sync: canonical sync ガバナンス → 重複なし、related で ADR を sync 対象に追加
```

## Task 5: skill-feedback-report.md（改善点なしでも必須）

| 観点 | 記録内容 |
| --- | --- |
| テンプレート改善 | docs-only ADR 起票タスクの phase 解釈（特に Phase 4 検証戦略 / Phase 11 NON_VISUAL）に specialized template 候補があると効率化 |
| ワークフロー改善 | 関連タスク 2 件との重複起票回避を Phase 1 識別段階で機械的に検出する仕組みの可能性 |
| ドキュメント改善 | base case 別の差分記述（cutover / 保留 / 段階移行）が複数 Phase に分散しているため、横断ガイドライン化候補 |

## Task 6: phase12-task-spec-compliance-check.md（root evidence）

```markdown
## Phase 12 canonical 7 ファイル parity
- [ ] main.md 存在 + Phase 12 サマリー + 7 ファイル確認結果
- [ ] implementation-guide.md 存在 + Part 1/Part 2 + 視覚証跡セクション NON_VISUAL 固定文
- [ ] system-spec-update-summary.md 存在 + Step 1-A〜1-C 記述
- [ ] documentation-changelog.md 存在 + workflow-local/global 別ブロック + [FB-04] 5 点同期
- [ ] unassigned-task-detection.md 存在 + current/baseline 分離 + 関連タスク差分確認
- [ ] skill-feedback-report.md 存在 + 3 観点記述
- [ ] phase12-task-spec-compliance-check.md 存在（本ファイル）

## artifacts parity
- [ ] artifacts.json と outputs/artifacts.json で phase status 一致
- [ ] artifacts.json valid JSON

## generate-index.js 実行
- [ ] node .claude/skills/aiworkflow-requirements/scripts/generate-index.js 実行（topic-map / keywords 更新）
- [ ] node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow ... 実行

## 不変条件 #5 最終ガード
- [ ] rg -n "^\[\[d1_databases\]\]" apps/web/wrangler.toml = 0 件
```

## 実行タスク

1. Task 1〜6 と `main.md` を `outputs/phase-12/` 配下に作成（Phase 12 canonical 7 ファイル）。
2. [FB-04] 5 点同期チェック実施。
3. `complete-phase.js` 相当の手順で artifacts.json `phases[11].status` を Phase 12 実行完了状態へ更新する。ただし workflow root の `workflow_state` は docs-only / `spec_created` のまま維持する。
4. aiworkflow-requirements / task-specification-creator の LOGS.md 2 ファイル同 wave 更新。
5. `generate-index.js` 2 種を実行し index 整合確認。
6. unassigned-task-detection.md の `verify-unassigned-links.js` 相当でリンク死活確認。
7. `outputs/artifacts.json` 生成 + root artifacts.json と diff 0 確認。
8. **[UT-W3]** `implementation-guide.md` を current contract で記述（推測でなく Phase 11 manual-test-result.md / Phase 9 結果から引用）。
9. **[Feedback 2]** Phase 12 着手前に `outputs/artifacts.json` と各 phase-N.md の artifact 名 1 対 1 突合。
10. **[Feedback 5]** `index.md` / `artifacts.json` / `outputs/artifacts.json` を **同一ターン** で更新（別 wave 禁止）。

## 完了条件チェックリスト

- [ ] Phase 12 canonical 7 ファイルすべて存在
- [ ] implementation-guide.md に Part 1/Part 2/視覚証跡 NON_VISUAL 固定文
- [ ] system-spec-update-summary.md に Step 1-A〜1-C + Step 2 stale contract withdrawal / 正本同期判定
- [ ] documentation-changelog.md に workflow-local / global 別ブロック + [FB-04] 5 点同期
- [ ] unassigned-task-detection.md に current/baseline 分離 + 関連タスク差分
- [ ] skill-feedback-report.md に 3 観点記述
- [ ] phase12-task-spec-compliance-check.md に 4 セクション全 PASS
- [ ] artifacts.json と outputs/artifacts.json parity
- [ ] generate-index.js 2 種実行
- [ ] LOGS.md 2 ファイル同 wave 更新
- [ ] 不変条件 #5 最終ガード PASS
- [ ] [Feedback 5] 3 ファイル同一ターン更新

## 多角的チェック観点

- **7 ファイル false-complete 回避**: 物理ファイル存在のみでなく内容の充足度を Task 6 で確認。
- **同 wave 強制**: workflow-local / global を別 wave で更新しない。
- **Step 2 発火根拠記述**: 新規 API / 型は追加しないが、Pages / Workers topology drift と stale contract withdrawal を扱うため Step 2 を実施する根拠を明記。
- **base case 別記述**: cutover / 保留 / 段階移行 の差分が implementation-guide / unassigned-task / changelog すべてに反映。
- **関連タスク重複起票防止**: unassigned-task-detection.md で migration-001 / UT-GOV-006 への重複が起きていないか差分確認セクションで明示。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1/2/視覚証跡） | 12 | pending |
| 2 | system-spec-update-summary.md（Step 1-A〜1-C + Step 2 stale contract withdrawal / 正本同期） | 12 | pending |
| 3 | documentation-changelog.md（workflow-local/global + [FB-04]） | 12 | pending |
| 4 | unassigned-task-detection.md（current/baseline + 差分確認） | 12 | pending |
| 5 | skill-feedback-report.md（3 観点） | 12 | pending |
| 6 | phase12-task-spec-compliance-check.md（root evidence） | 12 | pending |
| 7 | main.md（Phase 12 サマリー） | 12 | pending |
| 8 | LOGS.md 2 ファイル同 wave 更新 | 12 | pending |
| 9 | generate-index.js 2 種実行 | 12 | pending |
| 10 | artifacts.json / outputs/artifacts.json parity | 12 | pending |
| 11 | 不変条件 #5 最終ガード再実行 | 12 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1/2 + 視覚証跡 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜1-C + Step 2 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | workflow-local + global + 5 点同期 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | current/baseline + 差分確認 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 3 観点 feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | root evidence |
| メタ | artifacts.json | phases[11].status を Phase 12 実行完了状態へ更新。workflow root は `spec_created` 維持 |

## タスク 100% 実行確認【必須】

- 全実行タスク（11 件）が `spec_created` へ遷移
- 7 ファイルすべて存在 + 内容充足
- 不変条件 #5 最終ガード PASS
- LOGS.md 2 ファイル同 wave 更新
- generate-index.js 2 種実行済
- artifacts.json / outputs/artifacts.json parity
- artifacts.json の `phases[11].status` が Phase 12 実行完了状態

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 - pending_user_approval）
- 引き継ぎ事項:
  - Phase 12 canonical 7 ファイルすべて完了
  - close-out evidence（compliance-check.md）
  - PR 文面用要約（implementation-guide.md Part 2 から抽出可能）
- ブロック条件:
  - Phase 12 canonical 7 ファイルのいずれか欠落
  - 不変条件 #5 抵触
  - artifacts parity 不整合
  - generate-index.js 未実行

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
