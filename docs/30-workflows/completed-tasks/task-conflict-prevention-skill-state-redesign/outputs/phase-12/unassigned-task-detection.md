# Unassigned Task Detection — 派生未タスクの検出

本タスク（task-conflict-prevention-skill-state-redesign）完了後に派生する
**未起票の実装タスク**を一覧化する。Phase 3 / 10 / 11 で MINOR / 後続化と判定された項目も含む。

## 検出件数

Phase 3 / 10 / 11 で発見された未解決 issue: **0 件**

後続実装タスク候補: **4 件**（`docs/30-workflows/unassigned-task/` に正式化済み）

補助候補: **3 件**（T-5 / T-6 / T-7。T-1〜T-4 の subtask 化を推奨）

> 本書の「後続実装タスク候補」は、仕様書作成タスクのスコープ外であるため列挙する。
> レビューで新たに発見された欠陥や漏れを未タスク化したものではない。

## 派生実装タスク（A-1〜B-1）

| # | 推奨タスク名 | 推奨ディレクトリ | 内容 | 参照 runbook |
| --- | --- | --- | --- | --- |
| T-1 | `task-skill-ledger-a1-gitignore` | `docs/30-workflows/unassigned-task/task-skill-ledger-a1-gitignore.md` | 自動生成 ledger を `.gitignore` 化 + hook ガード | `outputs/phase-5/gitignore-runbook.md` |
| T-2 | `task-skill-ledger-a2-fragment` | `docs/30-workflows/unassigned-task/task-skill-ledger-a2-fragment.md` | LOGS / changelog の fragment 転換 + render script 実装 | `outputs/phase-6/fragment-runbook.md` |
| T-3 | `task-skill-ledger-a3-progressive-disclosure` | `docs/30-workflows/unassigned-task/task-skill-ledger-a3-progressive-disclosure.md` | SKILL.md を 200 行未満に分割し `references/` へ抽出 | `outputs/phase-7/skill-split-runbook.md` |
| T-4 | `task-skill-ledger-b1-gitattributes` | `docs/30-workflows/unassigned-task/task-skill-ledger-b1-gitattributes.md` | `.gitattributes` で `merge=union` 適用 | `outputs/phase-7/gitattributes-runbook.md` |

## 補助実装タスク

| # | 推奨タスク名 | 内容 | 親タスク |
| --- | --- | --- | --- |
| T-5 | `task-skill-ledger-render-script` | `pnpm skill:logs:render` の実コード実装（TS / Node script） | T-2 (A-2) の subtask 化も可 |
| T-6 | `task-skill-ledger-hooks` | post-commit / post-merge hook の実体実装（自動再生成 + ガード） | T-1 (A-1) の subtask 化も可 |

## データ移行タスク

| # | 推奨タスク名 | 内容 | 親タスク |
| --- | --- | --- | --- |
| T-7 | `task-skill-ledger-legacy-migration` | 既存 `LOGS.md` → `_legacy.md` への退避 / fragment 取り込み | T-2 (A-2) と同 PR or 直後 |

> T-5 / T-6 / T-7 は独立未タスクではなく、T-1 または T-2 の subtask として扱う。
> これにより追跡単位を A-1〜B-1 の 4 施策へ揃える。

## 推奨起票順

T-2 (A-2: 移行 + render を含む) → T-1 (A-1: hook を含む) → T-3 (A-3) → T-4 (B-1)

理由は `implementation-guide.md` §3 を参照。

## Phase 11 で発見された issue

- 本 spec_created pass では issue 0 件
- 後続実装で発生した場合は `outputs/phase-11/manual-smoke-log.md` の Issue 記録欄から本書へ昇格

## 結論

本 spec_created pass で新たに対応を先送りした未解決 issue は **0 件**。
T-1〜T-4 は本仕様書を入力にする後続実装タスク候補であり、T-5〜T-7 はその中へ含められる補助候補として扱う。
本タスクは仕様書のみで完結し、実装は別 PR にて進める。
