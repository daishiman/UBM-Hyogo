# system-spec-update-summary.md

## サマリ

`docs/00-getting-started-manual/specs/` 配下の primary 更新スコープは **M:1 / A:0 / D:0**。同一 wave で `.claude/skills/` の正本スキル・索引・LOGS も同期した。

## 更新一覧

| 種別 | path | 内容 |
| --- | --- | --- |
| M（Modified） | `docs/00-getting-started-manual/specs/09-ui-ux.md` | 旧 160 行 → 新 396 行・契約のみ版へ全面書き換え |

## 追加・削除なし

- A（Added）: なし（task-07 が 09a-prototype-map.md / task-08 が 09b-design-tokens.md を別タスクで新設）
- D（Deleted）: なし

## same-wave skill / index sync

| 種別 | path | 内容 |
| --- | --- | --- |
| M | `.claude/skills/aiworkflow-requirements/SKILL.md` | task-06 を `implemented-local / implementation / NON_VISUAL` として履歴同期 |
| M | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | task-06 同期ログ |
| M | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UI/UX Contract Rewrite 早見を追加 |
| M | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | task-06 resource map 行を追加 |
| M | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | UI/UX contract grep 導線を追加 |
| M | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `09-ui-ux contract grep` 等の検索 trigger を追加 |
| M | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow と diff scope を同期 |
| A | `.claude/skills/aiworkflow-requirements/changelog/20260507-task-06-ui-ux-contract-rewrite.md` | changelog fragment |
| A | `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-06-ui-ux-contract-rewrite-2026-05.md` | 状態語彙 / AC drift / diff scope / path drift / 無関係 D diff の教訓 |
| M | `.claude/skills/task-specification-creator/SKILL.md` | implementation / NON_VISUAL 分類 feedback を反映 |
| M | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | skill feedback log |

## 09-ui-ux.md 変更詳細

| 観点 | 旧 | 新 |
| --- | --- | --- |
| 行数 | 160 | 396 |
| H2 数 | 8 | 10 |
| `### 2.` 数 | 部分（レイヤ別） | 20（19 routes + global-error fallback） |
| 視覚詳細記述 | 散在 | 0 件（grep gate で実証） |
| primitives 列挙 | 部分 | 13 種統一 |
| a11y 章 | 散在 | §5 独立章（5.1〜5.4） |
| token 値 | 一部 HEX 直書き | 0 件（prefix 8 種のみ参照） |

## 不変条件確認

- #2 consent キー統一: §2.1.4 register / §2.2.2 profile に明記
- #3 responseEmail = system field: §2.2.2 / §2.3.2 に注記
- #5 apps/web → D1 禁止: §2 全 routes の API 列で `apps/api` 経由のみ
- #6 GAS prototype 非昇格: §8（不採用項目）に明記

## workflow_state

- 開始時: `spec_created`
- 終了時: `implemented-local`
- UI 実装コードは別 task（task-09 以降）が引き受けるが、primary spec rewrite は本 task で完了済み
