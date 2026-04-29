# skill-ledger-t6-hook-idempotency - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | skill-ledger-t6-hook-idempotency |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走（T-6） |
| ディレクトリ | docs/30-workflows/skill-ledger-t6-hook-idempotency |
| Wave | 0（infrastructure governance / merge-conflict 0 化） |
| 実行種別 | serial（A-2 / A-1 完了後の単独 PR） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only（本ワークフロー = タスク仕様書整備のみ。hook 実装本体は後続の implementation タスク / 別 PR） |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance |
| 既存タスク組み込み | skill-ledger-a1-gitignore Phase 12 unassigned-task-detection.md 起点の T-6 受け皿 |
| 起点 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md |
| GitHub Issue | #161 (CLOSED のまま spec_created で再起票せず仕様書のみ整備) |

## 目的

A-1（`skill-ledger-a1-gitignore`）で確立した「派生物 / 正本」境界を、現行 hook 方針（post-merge は stale 通知のみ、indexes 再生成は明示コマンド / CI gate）と矛盾しない形で固定する。T-6 は post-commit / post-merge に再生成を戻すタスクではなく、hook が canonical 書き込みや `git add` 系の副作用を持たないことを検査し、`pnpm indexes:rebuild` 部分失敗時の明示リカバリ手順と 4 worktree 並列 smoke の実走仕様を Phase 1〜13 のタスク仕様書として固定する。本ワークフロー自体は仕様書整備に閉じ、必要な実装差分は Phase 5 以降の別 PR で行う。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase 1〜3 成果物本体（`outputs/phase-0N/main.md`）の作成
- `index.md`（本ファイル）と `artifacts.json` の整合
- AC-1〜AC-11（hook が `git add` を呼ばない / 派生物存在時はスキップ / 部分 JSON リカバリ手順 / 4 worktree smoke で `git ls-files --unmerged | wc -l = 0` / A-2 未完了 NO-GO / metadata・レビュー・4 条件）の固定
- 部分 JSON リカバリ手順（明示 `pnpm indexes:rebuild` 失敗 → 部分書き込み JSON の検出 → 削除 → 再生成）の仕様レベル定義
- 2 worktree 事前 smoke + 4 worktree full smoke の実走コマンド系列定義（`wait $PID` ごとの return code 個別集約を含む）

### 含まない

- 実 hook script / lefthook.yml の編集
- A-2 fragment 化 / A-1 `.gitignore` 適用 / B-1 merge driver 設定
- UI / API / D1 / Cloudflare Secret の変更
- Issue #161 の状態変更（CLOSED のまま）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | task-skill-ledger-a2-fragment（A-2 / Issue #130） | A-2 完了前に hook 冪等化を試行すると `LOGS.md` の履歴が gitignore 連鎖で事故的に失われる。原典 T-6 §AC-5 で `gate` として明記 |
| 上流（必須） | skill-ledger-a1-gitignore（A-1 / Issue #129） | A-1 で確立した「hook は canonical を書かない / 未存在時のみ再生成」の state ownership 境界を本タスクの実装制約として継承 |
| 並列 | task-skill-ledger-b1-gitattributes（B-1 / Issue #132） | A-1 untrack 後の派生物に `merge=union` 等を付与する独立タスク。順序自由 |
| 下流 | （後続なし） | 本タスク完了で merge-conflict 0 化の実装側ループが閉じる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md | T-6 原典スペック |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/index.md | A-1 で確立した境界の参照 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | state ownership 表 / 4 worktree smoke 系列 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-12/unassigned-task-detection.md | T-6 検出根拠 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | hook 冪等化の前提となる派生物境界 |
| 必須 | CLAUDE.md | hook 方針（post-merge index 再生成廃止 / 明示 rebuild / CI gate） |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-devops-core.md | Git hook 運用正本 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 参考 | https://git-scm.com/docs/githooks | post-commit / post-merge 仕様 |

## 受入条件 (AC)

- AC-1: post-commit / post-merge hook は `git add` / `git stage` / `git update-index --add` を呼ばない（仕様レベルで禁止）。
- AC-2: 派生物（`indexes/*.json` / `*.cache.json` / `LOGS.rendered.md`）が存在する場合、hook は再生成をスキップし tracked canonical を上書きしない。
- AC-3: `pnpm indexes:rebuild` 失敗時、部分書き込み JSON を検出して削除または再生成する手順（`jq -e .` パース失敗 → `rm` → 再 rebuild）が確立されている。
- AC-4: 4 worktree 並列再生成 smoke で `git ls-files --unmerged | wc -l` が `0` になる証跡が取得可能（実走は Phase 11）。
- AC-5: A-2 (#130) 完了前は本タスクの実装フェーズを実行しない gate が Phase 1（前提）/ Phase 2（依存タスク順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記されている。
- AC-6: `wait $PID` ごとの return code 個別集約（`for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done`）が 4 worktree smoke 系列に組み込まれている。
- AC-7: 2 worktree 事前 smoke（小規模再現）→ 4 worktree full smoke（本番再現）の二段構えが Phase 2 で固定されている。
- AC-8: ロールバック設計（hook ガード差分の `git revert` / `lefthook install` 再配置）が Phase 2 / 3 で 1〜2 コミット粒度として固定されている。
- AC-9: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` が `artifacts.json.metadata` と一致している。
- AC-10: Phase 3 で代替案 4 案以上（A: hook 単独冪等化 / B: pre-commit でのみガード / C: アプリ側で完全静的化 / D: A + 部分 JSON リカバリ = base case）が PASS/MINOR/MAJOR で評価され、base case D が PASS（with notes）で確定している。
- AC-11: 4 条件（価値性 / 実現性 / 整合性 / 運用性）すべてが Phase 1 / Phase 3 で PASS 確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | template_created | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | template_created | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | template_created | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | template_created | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | template_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | template_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | template_created | outputs/phase-10/main.md |
| 11 | 手動 smoke test (4 worktree 検証) | phase-11.md | template_created_not_executed | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md ほか |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md ほか 6 件 |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / hook target glob / スコープ / AC-1〜AC-11 / 4 条件評価） |
| 設計 | outputs/phase-02/main.md | トポロジ・SubAgent lane 4 本（hook ガード設計 / 部分 JSON リカバリ / 2-worktree smoke / 4-worktree smoke）・state ownership・ロールバック・smoke 系列 |
| レビュー | outputs/phase-03/main.md | 代替案 4 案以上比較・PASS/MINOR/MAJOR・着手可否ゲート（PASS with notes） |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Git | hook 副作用検査 / `ls-files --unmerged` | 無料 |
| GitHub | Issue #161 連携（CLOSED のまま参照のみ） | 無料枠 |
| lefthook | hook の正本配置（`.git/hooks/*` 直編集禁止） | 無料 |
| pnpm | `pnpm indexes:rebuild` 経由の派生物再生成 | 無料 |
| jq | 部分 JSON リカバリ時のパース検証 | 無料 |

## Secrets 一覧

本タスクは Secret を導入しない。hook 冪等ガードと smoke 検証のみで完結する。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない（hook / smoke のみ）。違反なし |
| - | skill ledger 派生物 / 正本の境界（A-1 で確立） | 本タスクは hook 冪等ガードでこの境界を実装段階に固定する |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜3 = `completed` / Phase 4〜10 = `template_created` / Phase 11 = `template_created_not_executed` / Phase 12 = `completed` / Phase 13 = `pending_user_approval`）
- AC-1〜AC-11 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- A-2 完了 gate が Phase 1 / 2 / 3 の 3 箇所で重複明記されている
- 本ワークフローはタスク仕様書整備までで完了し、実 hook 実装は Phase 5 以降の別 PR で実施する旨が明文化されている

## 苦戦箇所・知見

**1. hook ガード未追加で `git rm --cached` 直後に hook が再 add する循環**
A-1 で untrack した派生物に対し、hook が無防備な `git add` を含むと untrack が直ちに無効化される。Phase 1 / 2 で `git add` 系コマンド全面禁止を AC-1 として固定する。

**2. `pnpm indexes:rebuild` の部分失敗で破損 JSON が残留**
複数 skill を直列再生成する途中で 1 つ失敗すると、後続 skill は未生成・先行 skill は半端 JSON という状態が残る。Phase 2 で「`jq -e . <file> || rm <file>` → `pnpm indexes:rebuild`」のリカバリループを仕様化する。

**3. 4 worktree smoke の `wait` 戻り値喪失**
`wait` を引数なしで呼ぶと最後のジョブの戻り値しか取れない。Phase 2 で `pids=("$!" ...); for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done` を AC-6 として固定する。

**4. 4 worktree 一括起動のシステム負荷**
Mac mini クラスでは 4 並列の `pnpm indexes:rebuild` が I/O 飽和を起こすことがある。Phase 2 で 2 worktree 事前 smoke → 4 worktree full smoke の二段構え（AC-7）を採用しリスク逓減する。

**5. A-2 未完了状態での T-6 着手による履歴喪失**
A-1 と同様、A-2 が未完了のまま hook を gitignore 連動で編集すると `LOGS.md` を誤って ignore 化する経路が生まれる。Phase 1 / 2 / 3 の 3 箇所で gate 明記する。

## 関連リンク

- 上位 README: ../README.md
- 原典スペック: ../unassigned-task/task-skill-ledger-hooks.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/161
- A-1 ワークフロー: ../skill-ledger-a1-gitignore/index.md
- A-2 仕様: ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md
- B-1 仕様: ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md
- hook 運用正本: ../../../CLAUDE.md / ../../../.claude/skills/aiworkflow-requirements/references/technology-devops-core.md
