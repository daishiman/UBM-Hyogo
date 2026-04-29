# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 0（governance） |
| 実行種別 | serial（A-2 / A-1 完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | docs-only / visualEvidence: NON_VISUAL / scope: infrastructure_governance |

## 目的

A-1 で確立した「hook は canonical を書かない」境界を、現行方針（post-merge は stale 通知のみ、indexes 再生成は明示コマンド / CI gate）に合わせて Phase 1 で要件化する。`pnpm indexes:rebuild` 部分失敗時の JSON リカバリ手順と 4 worktree 並列 smoke の実走仕様を固定するが、post-merge に再生成処理を戻さない。本ワークフローは仕様書整備に閉じ、必要な実装差分は Phase 5 以降の別 PR で行う前提を本 Phase で固定する。

## 真の論点 (true issue)

- 本タスクの本質は「hook 内で `git add` 系を一切呼ばない」「派生物が存在する場合は再生成をスキップする」という 2 軸の冪等性を実装段階で破綻させないこと。A-1 が gitignore で派生物を git index から外しても、hook が無防備な `git add` を含めば untrack は直ちに無効化される。
- 副次論点: (1) `pnpm indexes:rebuild` 途中失敗時の部分書き込み JSON のリカバリ手順、(2) `wait $PID` ごとの return code 個別集約、(3) 2 worktree 事前 smoke → 4 worktree full smoke の二段構え、(4) A-2 完了 gate の 3 重明記。

## 依存境界（A-2 完了必須）— 重複明記 1/3

> **A-2（task-skill-ledger-a2-fragment / Issue #130）が completed であることが本タスクの実装フェーズの必須前提である。**
> A-2 未完了で hook 冪等ガード本体実装に着手すると、A-1 の gitignore 連鎖と組み合わさって `LOGS.md` 履歴が事故的に失われる経路が生まれる。本仕様書は spec_created までで閉じ、Phase 5 以降の実装フェーズへ進む前に A-2 completed を再確認する。

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | task-skill-ledger-a2-fragment（A-2） | fragment 化と `_legacy.md` 退避完了 | A-2 completed を 3 重明記 |
| 上流（必須） | skill-ledger-a1-gitignore（A-1） | `.gitignore` patch / untrack / state ownership 表 | hook 冪等ガード仕様の前提として継承 |
| 並列 | task-skill-ledger-b1-gitattributes（B-1） | merge driver 設定（独立タスク） | T-6 と順序自由 |

## 価値とコスト

- 価値: A-1 の untrack を hook が再 add で無効化する循環を恒久的に阻止し、4 worktree 並列再生成 smoke で `git ls-files --unmerged | wc -l = 0` を再現可能にする。merge-conflict 0 化ループの最後のピースが閉じる。
- コスト: hook script に存在チェックと `git add` 禁止を組み込む差分（数行 〜 十数行）+ 部分 JSON リカバリループ + 4 worktree smoke ログ。実装コストは小、運用コストは追加なし（lefthook 経由のため）。
- 機会コスト: アプリ側で完全静的化する案 C と比べて生成側の resilience は失わず、hook 単独冪等化（案 A）と比べて部分 JSON リカバリの安全網が追加される。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列 smoke で `git ls-files --unmerged | wc -l = 0` の証跡が再現可能になり、A-1 の効果が hook 経路で保全される |
| 実現性 | PASS | lefthook + bash で完結。`git add` 禁止 / 存在チェックは数行の bash gate で実装可能 |
| 整合性 | PASS | 不変条件 #5（D1 境界）に触れない。A-1 state ownership 表（hook = 派生物のみ）を強化 |
| 運用性 | PASS | lefthook 経由のため `.git/hooks` 直書き禁止原則と整合。ロールバックは hook 差分の `git revert` で 1 コミット |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| hook 配置 | `lefthook.yml` の `pre-commit` / `post-merge` | `.git/hooks/*` 直書き禁止。post-merge は stale 通知のみ |
| rebuild コマンド | `pnpm indexes:rebuild` | post-merge から廃止後の正規経路 |
| target glob | A-1 で確立した 4 系列（`indexes/*.json` / `*.cache.json` / `LOGS.rendered.md`） | hook が読む / 書くのはこの集合のみ |
| リカバリツール | `jq -e . <file>` | 部分 JSON 検出の正本 |
| smoke 並列起動 | `&` バックグラウンド + `pids=()` 配列 | `wait $PID` で個別 return code を集約 |

## 実行タスク

1. 原典スペック（`docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md`）の §背景〜§参照を写経し、本ワークフロー Phase 1〜13 へ分解する（完了条件: AC-1〜AC-11 が `index.md` と一致）。
2. タスク種別を `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. A-2 完了を必須前提として 3 箇所（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件）に明記する設計を本 Phase で予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。
4. hook target glob と「hook が呼んではならないコマンド集合」（`git add` / `git stage` / `git update-index --add`）を Phase 1 で列挙する（完了条件: AC-1 として固定）。
5. 部分 JSON リカバリ条件（`jq -e . <file>` 失敗 → `rm <file>` → 再 rebuild）を Phase 1 で要件化する（完了条件: AC-3 として固定）。
6. 2 worktree 事前 smoke + 4 worktree full smoke の二段構え（AC-7）と `wait $PID` 個別集約（AC-6）を Phase 1 で要件化する。
7. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
8. 本ワークフローのスコープが「タスク仕様書整備に閉じ、実 hook 実装は別 PR で行う」ことを Phase 1 §スコープで固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | 原典スペック |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | state ownership / smoke 系列の継承元 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/unassigned-task-detection.md | T-6 検出根拠 |
| 必須 | CLAUDE.md | hook 方針（明示 rebuild / CI gate） |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-devops-core.md | Git hook 運用正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |
| 参考 | https://git-scm.com/docs/githooks | hook 仕様 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- A-2 完了必須前提の 3 重明記
- hook target glob と禁止コマンド集合の固定（AC-1 / AC-2）
- 部分 JSON リカバリ手順の要件化（AC-3）
- 2 worktree 事前 / 4 worktree full smoke の二段構え（AC-6 / AC-7）の要件化
- AC-1〜AC-11 の `index.md` との同期

### 含まない

- 実 `lefthook.yml` / hook script の編集
- A-2 / A-1 / B-1 の実施
- UI / API / D1 / Cloudflare Secret の変更
- Issue #161 の状態変更（CLOSED のまま）

## 実行手順

### ステップ 1: 原典スペック写経

- `task-skill-ledger-hooks.md` の §背景〜§参照を本仕様書の構造に分解し、AC-1〜AC-5 を AC-6〜AC-11 に拡張して `index.md` と一致させる。

### ステップ 2: 真の論点と依存順序の固定

- A-2 完了が必須である旨を Phase 1 / 2 / 3 で重複明記する設計を確定する。

### ステップ 3: hook 禁止コマンド集合の確定

- `git add` / `git stage` / `git update-index --add` の 3 系列を AC-1 として固定し、hook 内で grep 等の静的検査を後続 Phase（4 / 9）で行う前提を渡す。

### ステップ 4: 部分 JSON リカバリ要件化

- `jq -e . <file>` 失敗 → `rm <file>` → `pnpm indexes:rebuild` 再実行のループを AC-3 として固定する。

### ステップ 5: 2-worktree → 4-worktree 二段 smoke

- AC-6 / AC-7 を Phase 1 で固定し、Phase 2 で具体コマンド系列に落とす。

### ステップ 6: 4 条件評価のロック

- 4 条件すべてを PASS で確定する。MAJOR があれば Phase 2 へ進めない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・hook target glob・禁止コマンド・smoke 系列・依存順序を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 5 | 実装ランブックの起点（A-2 completed の再確認 gate を含む） |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 11 | 2 worktree → 4 worktree 二段 smoke の実走基準として AC-4 / AC-6 / AC-7 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 境界に触れない（本タスクは hook / smoke のみ）。
- A-1 で確立した state ownership（hook = 派生物のみ）が本タスクで実装段階に固定されるか。
- 順序事故回避: A-2 完了前に T-6 実装フェーズに着手しない設計が 3 箇所で重複明記されるか。
- ロールバック設計: hook 差分の `git revert` で 1 コミット粒度復元が可能か。
- `wait $PID` 個別集約: 並列再生成の途中失敗を検出可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペック写経と AC-1〜AC-11 確定 | 1 | completed | index.md と一致 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | A-2 完了前提の 3 重明記設計 | 1 | completed | Phase 2 / 3 で再記述 |
| 5 | hook 禁止コマンド集合の確定 | 1 | completed | 3 系列 |
| 6 | 部分 JSON リカバリ要件化 | 1 | completed | jq + rm ループ |
| 7 | 2-worktree / 4-worktree 二段 smoke 要件化 | 1 | completed | wait $PID 個別集約 |
| 8 | スコープ「タスク仕様書整備に閉じる」固定 | 1 | completed | 含む / 含まない明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / hook target glob / 禁止コマンド / リカバリ手順 / smoke 二段構え / AC / 4 条件評価） |
| メタ | artifacts.json | Phase 1 状態の更新（completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「hook が `git add` 系を呼ばない / 派生物存在時はスキップ」の 2 軸として再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] hook target glob（4 系列）と禁止コマンド集合（3 系列）が Phase 1 で固定されている
- [x] 部分 JSON リカバリ要件（AC-3）が固定されている
- [x] 2-worktree / 4-worktree 二段 smoke（AC-6 / AC-7）が固定されている
- [x] タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書整備に閉じる」が明記されている
- [x] A-2 完了 gate が本 Phase で重複明記されている（3 重明記の 1 箇所目）
- [x] AC-1〜AC-11 が `index.md` と完全一致している

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（hook 再 add 循環 / 部分 JSON / wait 戻り値喪失 / 並列負荷 / A-2 未完了）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = hook の `git add` 禁止 / 存在スキップ
  - hook target glob 4 系列 + 禁止コマンド 3 系列
  - 部分 JSON リカバリループ（jq + rm + 再 rebuild）
  - 2-worktree → 4-worktree 二段 smoke + `wait $PID` 個別集約
  - 4 条件評価（全 PASS）の根拠
  - スコープ境界（仕様書整備に閉じる）
- ブロック条件:
  - A-2 仕様書の completed 状態が確認できない
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-11 が index.md と乖離
