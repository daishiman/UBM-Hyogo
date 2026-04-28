# Phase 1: 要件定義 — outputs main

日付: 2026-04-28

## サマリ

`task-git-hooks-lefthook-and-post-merge` Phase 2 design ADR-01 / Phase 3 review 第5節 / Phase 12 unassigned-task-detection B-2 に分散している「Git hook ツールに lefthook を採用、husky を不採用」判断を独立 ADR として切り出すための要件を確定した。docs-only / NON_VISUAL タスクとして AC-1〜AC-6 と整合する形で集約先・命名規約・必須セクション・比較対象を要件化した。

## 実行結果

- サブタスク「派生元判断テキストの抽出」: 完了。Phase 2 design.md「8. 設計上の決定」の ADR-01 行と Phase 3 review.md「5. 反対意見への応答」を一次資料として確定。
- サブタスク「ADR 集約先候補の整理」: 完了。`doc/decisions/`（新設）を採用候補とし、CLAUDE.md / 既存 `doc/` 構造との非干渉を確認。
- サブタスク「ADR 必須セクション・比較対象の確定」: 完了。Status / Context / Decision / Consequences / Alternatives Considered / References。比較対象は husky / pre-commit / native git hooks。
- サブタスク「受入条件 AC-1〜AC-6 の整合性確認」: 完了。index.md / artifacts.json と齟齬なし。
- サブタスク「承認前禁止事項確認」: Phase 13 で再点検（commit / push / PR 作成は行わない）。

## 派生元と抽出した判断テキスト

| 派生元 | 抽出範囲 | ADR への反映先 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | 第8節 ADR-01 行 / 第7節リスク表 / 第6節 CI と lefthook の責務分離 | Decision / Consequences / Context |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | 第5節 反対意見への応答 全行 | Alternatives Considered |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md` | B-2「`husky` 不採用判断の ADR 化」 | Status の経緯記述 |

## ADR 集約先候補と判断材料

| 候補 | 採用 | 理由 |
| --- | --- | --- |
| `doc/decisions/`（新設） | 採用 | `doc/` 配下は正本ドキュメント。ADR は正本扱いが妥当。新設で命名規約 `NNNN-<slug>.md` を初版から固定可能 |
| `doc/00-getting-started-manual/decisions/`（既存配下） | 不採用 | `00-getting-started-manual/` は新規参加者向けマニュアル領域で、ADR の長期履歴格納には semantics が合わない |

## ADR-0001 必須セクション要件

| セクション | 必須記載 |
| --- | --- |
| Status | Accepted, 2026-04-28、独立化の経緯（task-husky-rejection-adr 由来）を 1 行 |
| Context | monorepo / pnpm / mise / Cloudflare Workers 環境下での hook 配布要件、worktree 30+ 件問題、post-merge 副作用 |
| Decision | lefthook 採用 / husky 不採用 / `.git/hooks/*` 直書き禁止 / `lefthook.yml` 単一正本 / shell 別ファイル化 |
| Consequences | Positive / Negative / Trade-off を分けて列挙 |
| Alternatives Considered | husky / pre-commit / native git hooks 各々を節立てし表で評価 + 不採用理由 |
| References | 派生元 outputs / `lefthook.yml` / `lefthook-operations.md` / `CLAUDE.md` / 関連未タスク |

## 受入条件マッピング

| AC | 充足方針 |
| --- | --- |
| AC-1 | `doc/decisions/` 新設 + 命名規約 `NNNN-<slug>.md` を README に明記 |
| AC-2 | ADR-0001 全 5 セクション + Status を本文に必ず含める |
| AC-3 | Alternatives Considered に 3 候補（husky / pre-commit / native）を節立て |
| AC-4 | Phase 2 design ADR-01 末尾と Phase 3 review 第5節末尾にバックリンク追加 |
| AC-5 | 派生元 outputs を読まなくても判断履歴が辿れるよう、重要表を ADR にインライン転記 |
| AC-6 | `lefthook.yml` 現状（main-branch-guard / staged-task-dir-guard / stale-worktree-notice）と Decision が衝突しないよう lane 表を ADR に記載 |

## 成果物

- `docs/30-workflows/completed-tasks/task-husky-rejection-adr/outputs/phase-1/main.md`

## 完了条件チェック

- [x] 要件定義の成果物が artifacts.json と一致
- [x] docs-only / NON_VISUAL の分類が崩れていない
- [x] ADR 必須セクション・比較対象・派生元参照を明記
- [x] commit / push / PR を行っていない

## 次 Phase への引き継ぎ

- ADR 集約先 `doc/decisions/` と命名規約 `NNNN-<slug>.md` を Phase 2 設計の前提として確定
- ADR-0001 のファイル名は `0001-git-hook-tool-selection.md`
- Alternatives Considered の 3 候補（husky / pre-commit / native git hooks）を Phase 2 でセクション分割
