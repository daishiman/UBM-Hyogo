# Phase 2: design.md

日付: 2026-04-28

## 1. ADR 集約先と命名規約

| 項目 | 値 |
| --- | --- |
| 集約ディレクトリ | `doc/decisions/` （本タスクで新設） |
| 命名規約 | `NNNN-<slug>.md`（`NNNN` = 4 桁ゼロ詰め、`<slug>` = kebab-case） |
| index ファイル | `doc/decisions/README.md`（ADR 一覧の表 + 命名規約） |
| 初版 ADR | `doc/decisions/0001-git-hook-tool-selection.md` |
| Status タグ | Proposed / Accepted / Deprecated / Superseded by ADR-NNNN |

採用根拠: `doc/` は正本ドキュメント領域。ADR は仕様の「決定履歴」を担うため正本ツリーに置く。`doc/00-getting-started-manual/` は新規参加者向け運用ガイド領域で意味論が異なる。

## 2. ADR-0001 各セクション記載方針

| セクション | 内容 | 一次資料 |
| --- | --- | --- |
| Status | Accepted / 2026-04-28 / 独立化経緯 1 行 | 本タスク |
| Context | monorepo / pnpm / mise / Cloudflare Workers の hook 配布要件、worktree 30+ 件問題、post-merge 副作用 | `lefthook-operations.md` / 派生元 phase-2 design.md 第3節 |
| Decision | (1) lefthook 採用 / (2) husky 不採用 / (3) `.git/hooks/*` 直書き禁止 / (4) hook 本体は `scripts/hooks/*.sh` / (5) ローカル/CI 責務分離 + 適用境界 (lane) 表 | 派生元 phase-2 design.md 第1, 6, 8 節 / `lefthook.yml` |
| Consequences | Positive（YAML 単一正本 / 並列実行 / Go バイナリ / PR diff ノイズ削減） / Negative（バイナリ依存 / pnpm install 必須 / 一括再 install 必要 / indexes 鮮度の責務移譲） | 派生元 phase-2 design.md 第7節 / `lefthook-operations.md` |
| Alternatives Considered | 3 候補を節立て: A. husky / B. pre-commit / C. native git hooks | 派生元 phase-3 review.md 第5節 / 一般知識 |
| References | 派生元 phase-2/3/12 outputs / `lefthook.yml` / `lefthook-operations.md` / `CLAUDE.md` / 関連未タスク | 各既存ファイル |

## 3. 派生元から ADR への引用範囲

| 引用元 | 引用範囲 | ADR 内の位置 |
| --- | --- | --- |
| `phase-2/design.md` 第8節 ADR ライト表 | ADR-01 行のみブロック引用 | ADR の「派生元 outputs 抜粋」セクション |
| `phase-3/review.md` 第5節 反対意見への応答 | 表全体をブロック引用 | ADR の「派生元 outputs 抜粋」セクション |

引用は workflow outputs に依存せず ADR 単独で読めるよう、最重要部分は ADR 内にインライン転記する（AC-5）。

## 4. backlink 追加位置

| 対象ファイル | 追加位置 | 文言 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | 第8節 ADR ライト表の直後（ADR-01 行を含む表の末尾） | `> 本判断 (ADR-01) は ADR-0001 として独立化されました: [doc/decisions/0001-git-hook-tool-selection.md](../../../../../../doc/decisions/0001-git-hook-tool-selection.md)（2026-04-28, task-husky-rejection-adr）。` |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | 第5節「反対意見への応答」表の直後・「## 6. 結論」の直前 | `> 本節（husky / lefthook の採否レビュー）は ADR-0001 として独立化されました: [doc/decisions/0001-git-hook-tool-selection.md](../../../../../../doc/decisions/0001-git-hook-tool-selection.md)（2026-04-28, task-husky-rejection-adr）。` |

相対パスは `phase-2`/`phase-3` ディレクトリから 6 階層上がりリポルートに到達 → `doc/decisions/0001-git-hook-tool-selection.md` で解決する。

## 5. ADR 単独可読性の担保

- 派生元 outputs を読まなくても判断履歴が辿れるよう、ADR 内に重要な表（ADR ライト表 / 反対意見表）をインライン転記する。
- Decision 内に lane 表（pre-commit / post-merge）を ADR に転記し、`lefthook.yml` を読まなくても適用境界が分かる。
- Alternatives Considered の各節は、不採用理由を一次資料（派生元 outputs / `lefthook.yml` / `lefthook-operations.md`）から導出可能な粒度で記述する。

## 6. CLAUDE.md / lefthook.yml / lefthook-operations.md との非矛盾チェック

| 既存正本 | ADR Decision との関係 |
| --- | --- |
| `lefthook.yml` | lane 名（main-branch-guard / staged-task-dir-guard / stale-worktree-notice）が ADR 内 lane 表と一致 |
| `doc/00-getting-started-manual/lefthook-operations.md` | 「post-merge 自動再生成廃止」「`pnpm indexes:rebuild` 明示化」の記述と Consequences の記述が一致 |
| `CLAUDE.md` | 「Git hook の方針: lefthook.yml が hook の正本」「`.git/hooks/*` の手書きは禁止」と Decision (3) が一致 |

## 7. Phase 3 設計レビューへの引継ぎ事項

- AC-1〜AC-6 全てが本設計でカバーされていることを review.md に表形式で記録。
- Alternatives Considered の各節が一次資料から再現可能であることを Phase 3 で検証。
- backlink 追加位置の機械的適用可能性（既存記述を書き換えず、追記のみ）を Phase 3 で確認。
