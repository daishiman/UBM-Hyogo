# Phase 12: ドキュメント / unassigned 検出 / コンプライアンス

## 目的

Phase 12 必須 7 outputs を作成し、未タスク・skill feedback・コンプライアンスチェックを完遂する。

## 12.1 必須 7 outputs（pre-check で全 path 存在を確認）

```
outputs/phase-12/
├── main.md
├── implementation-guide.md
├── system-spec-update-summary.md
├── documentation-changelog.md
├── unassigned-task-detection.md
├── skill-feedback-report.md
└── phase12-task-spec-compliance-check.md
```

7 path が**すべて実在**してから Phase 12 close-out（欠落 1 件で FAIL 固定）。

## 12.2 main.md（Phase 12 summary）

- 状態語彙: `pass_boundary_synced_runtime_pending`
- Phase 1〜11 の主要成果サマリ（5 行以内）
- 7 outputs の path 一覧と PASS 判定
- Phase 13（commit / PR / branch protection PUT）を待つ unresolved 項目を 1 セクションに集約

## 12.3 implementation-guide.md（Part 1 中学生レベル + Part 2 技術者レベル）

**Part 1 — 中学生レベル概念説明（必須）**
- 「デザインのルール（色や形）が決められたとおりかをコンピュータが見張る」
- 「サイトの 17 個のページが全部ちゃんと開けるかをロボットが毎晩確認する」
- 「ロボットがおかしいと言ったら、人がマージできない仕組み」

**Part 2 — 技術者レベル**
- token diff parser の 3 source（09b JSON / tokens.css / globals.css `@theme inline`）
- Playwright projects の `testMatch` 完全分離
- ubuntu-latest で baseline 採取の理由（font hinting）
- branch protection 3 contexts 追加と solo dev policy 維持
- PR description 雛形

## 12.4 system-spec-update-summary.md（Step 1-A/B/C）

| Step | 対象 |
| --- | --- |
| 1-A | `docs/00-getting-started-manual/specs/09b-design-tokens.md` に「verify-design-tokens script が tokens.css と @theme inline bridge を検証する」旨 1 段落追記 |
| 1-B | `docs/00-getting-started-manual/specs/00-overview.md` の CI ゲート節に 3 contexts 追記 |
| 1-C | `CLAUDE.md` の Required Status Check 例の節に 3 contexts 追記の予告（実投入は Phase 13） |
| 2 (条件付き) | 適用なし（D1 / API schema 変更なし） |

aiworkflow-requirements 同期:

| 対象 | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | task-18 active workflow と evidence boundary を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | task-18 regression gate の即時導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow root / implementation targets / evidence boundary を登録 |
| `.claude/skills/aiworkflow-requirements/changelog/20260512-task-18-w7-verify-tokens-and-playwright-smoke.md` | 正本同期履歴を追加 |

## 12.5 documentation-changelog.md

必須エントリ最小セット:
- 各更新 specs の absolute path
- `.claude/skills/task-specification-creator/SKILL.md`（変更あれば LOGS.md と SKILL-changelog.md も）
- `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` 配下の新規 phase ファイル一覧
- validator 実行記録セクション: 各 command + exit code + 件数の 3 値

## 12.6 unassigned-task-detection.md（0 件でも必須）

候補:
- **完全 Visual Regression Suite（17 URL routes × 3 viewport）**: 起票必須。本タスクのスコープ外と判定（CONST_007 例外条件 1）。配置先 `docs/30-workflows/unassigned-task/`。必須 4 セクション（苦戦箇所 / リスクと対策 / 検証方法 / スコープ）を埋める
- **自動 rotation スケジューラ的な smoke 周期延長**: 観測後判断
- **Lighthouse CI gate 化**: 既存 healthcheck の延長として別タスク

0 件でも本 file は出力する。

## 12.7 skill-feedback-report.md（3 観点固定）

- テンプレ改善: `phase-11-non-visual-alternative-evidence.md` への `e2e-smoke.txt` / `e2e-visual.txt` / `playwright-version.txt` の追加提案
- ワークフロー改善: `pass_boundary_synced_runtime_pending` を NON_VISUAL E2E 主体タスクの canonical state として明文化
- ドキュメント改善: branch protection 3 contexts 追加 PR の参照例として本タスクを appendix 登録

改善点なしでも出力必須。

## 12.8 phase12-task-spec-compliance-check.md

観点（references/phase12-compliance-check-template.md 準拠）:

- [ ] 7 outputs 存在
- [ ] `apps/` / `packages/` dirty diff 0（spec_created PASS 禁止 / runtime_pending 表現は OK）
- [ ] `tokens.css` / `globals.css` の意図的な設計値変更 0。SSOT 同期漏れ補正がある場合は system-spec-update-summary に理由を記録
- [ ] placeholder token 0
- [ ] §99 必須項目 content check（本仕様書 §確定要件 / 不変条件 / Validation Matrix がキーワード `rg -n` で出現）
- [ ] command drift 0（Validation Matrix の commands が実在 package.json scripts と一致）
- [ ] state 語彙: `pass_boundary_synced_runtime_pending`（`PASS` 単独禁止）
- [ ] Server Component E2E 該当なし（本タスクは page level smoke）
- [ ] Governance mutation 承認 gate: branch protection PUT は Phase 13 user approval 必須

## 完了条件

- [ ] 7 outputs 実在
- [ ] §12.8 すべて check
- [ ] artifacts.json phase 12 status を `completed` に更新（runtime evidence boundary は `pass_boundary_synced_runtime_pending` を維持）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- strict 7 outputs、system spec、aiworkflow indexes を同一 wave で同期する。

| Task | 内容 |
| --- | --- |
| 12-A | strict 7 outputs を作成する |
| 12-B | system spec / aiworkflow indexes / changelog を同一 wave で同期する |
| 12-C | unassigned-task-detection と skill-feedback-report を 0 件でも出力する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 outputs |
| aiworkflow skill | `.claude/skills/aiworkflow-requirements/SKILL.md` | 正本同期手順 |
| active workflow | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 登録先 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| main | `outputs/phase-12/main.md` | Phase 12 summary |
| guide | `outputs/phase-12/implementation-guide.md` | 中学生/技術者向け guide |
| system sync | `outputs/phase-12/system-spec-update-summary.md` | 正本同期 summary |
| changelog | `outputs/phase-12/documentation-changelog.md` | 更新履歴 |
| unassigned | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` | skill feedback |
| compliance | `outputs/phase-12/phase12-task-spec-compliance-check.md` | compliance check |
