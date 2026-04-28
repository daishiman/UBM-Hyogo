# Phase 7 — AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 7 / 13 |
| 状態 | completed |
| 上流 | Phase 6（異常系検証） |
| 下流 | Phase 8（DRY 化） |

## 結論サマリ

AC-1〜AC-7 を **検証手段（Phase 4 TC / Phase 6 F）× 実装ファイル（Phase 5）** の
3 軸で完全トレースした結果、全 7 件で 1 つ以上の検証手段と 1 つ以上の実装根拠が紐付き、
**全 AC PASS**。残課題 R-1〜R-4 は本タスク / 将来拡張で対処する。4 条件（価値性 / 実現性 /
整合性 / 運用性）は全て PASS。

## AC × 検証手段 × 実装ファイル マトリクス

| AC | AC 内容 | 検証手段（Phase 4 TC / Phase 6 F） | 実装ファイル（Phase 5） | カバー |
| --- | --- | --- | --- | --- |
| AC-1 | PR / main / dev push で auto trigger | TC-05 / TC-06 | `.github/workflows/verify-indexes.yml` の `on:` ブロック（`pull_request` + `push`） | ◎ |
| AC-2 | drift 時 fail + 差分ファイル名出力 | TC-03 / TC-04 / F-01 / F-04 | `Detect drift` step（`::error::index drift detected` + `git diff --name-only` + `git status --short` + `exit 1`） | ◎ |
| AC-3 | drift なしで false positive にならない | TC-01 / TC-02 / F-05 / F-06 | `pnpm indexes:rebuild` の決定論性（generate-index.js の sort / no-mtime） | ◎ |
| AC-4 | post-merge hook に index 再生成を戻していない | 静的検証（`grep "indexes:rebuild" lefthook.yml` で 0 件） | `lefthook.yml` を **変更しない**（不作為） | ◎ |
| AC-5 | 既存 4 workflow と job 名 / trigger / concurrency 非衝突 | TC-08 / F-08 | 独立 file `verify-indexes.yml` + 独立 concurrency group `verify-indexes-${{ github.ref }}` + 独立 job id `verify-indexes-up-to-date` | ◎ |
| AC-6 | Node 24.15.0 / pnpm 10.33.2 環境で実行 | TC-01（ローカル）/ 実機 PR の job log で version 表示確認 | `actions/setup-node@v4 (node-version: 24.15.0)` + `pnpm/action-setup@v4 (version: 10.33.2)` | ◎ |
| AC-7 | 監視範囲が `.claude/skills/aiworkflow-requirements/indexes` に限定され、未追跡 index も検出 | TC-07 / F-11 | `git add -N .claude/skills/aiworkflow-requirements/indexes` + `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` の path 引数 | ◎ |

## カバレッジ集計

| AC | 検証手段数 | 実装根拠数 | 判定 |
| --- | --- | --- | --- |
| AC-1 | 2 | 1 | PASS |
| AC-2 | 4 | 1（複合 step） | PASS |
| AC-3 | 4 | 1 | PASS |
| AC-4 | 1（静的） | 1（不作為） | PASS |
| AC-5 | 2 | 3 | PASS |
| AC-6 | 2 | 2 | PASS |
| AC-7 | 2 | 1 | PASS |

→ AC-1〜AC-7 すべて **少なくとも 1 つの検証手段 × 1 つの実装根拠** が紐付き、PASS。

## 逆方向トレース（実装 → AC）

| 実装要素 | 担保する AC |
| --- | --- |
| `on: pull_request` (branches: [main, dev]) | AC-1 |
| `on: push` (branches: [main, dev]) | AC-1 |
| `permissions: contents: read` | AC-5（write 衝突回避） |
| `concurrency.group: verify-indexes-${{ github.ref }}` | AC-5 |
| `concurrency.cancel-in-progress: true` | AC-5（F-08 連続 push） |
| `actions/checkout@v4` | AC-1（diff 取得の前提） |
| `pnpm/action-setup@v4 version: 10.33.2` | AC-6 |
| `actions/setup-node@v4 node-version: 24.15.0 cache: pnpm` | AC-6 |
| `pnpm install --frozen-lockfile` | AC-3（lockfile drift の早期検出 / 排除） |
| `pnpm indexes:rebuild` | AC-3（決定論再生成） |
| `git add -N <indexes>` → `git diff --exit-code -- <indexes>` | AC-2 / AC-7 |
| `git diff --name-only` + `git status --short` | AC-2 |
| `lefthook.yml` 変更なし | AC-4 |

## 逆方向トレース（検証 → AC）

| 検証 | 担保する AC |
| --- | --- |
| TC-01（クリーン smoke） | AC-3 / AC-7 |
| TC-02（連続 2 回） | AC-3 |
| TC-03（references 編集後未再生成） | AC-2 |
| TC-04（indexes 直接編集） | AC-2 |
| TC-05（PR trigger） | AC-1 |
| TC-06（push trigger） | AC-1 |
| TC-07（範囲限定） | AC-7 |
| TC-08（既存 CI 共存） | AC-5 |
| F-01（再生成忘れ） | AC-2 |
| F-04（手動 indexes 改変） | AC-2 |
| F-05 / F-06（決定論性） | AC-3 |
| F-08（concurrency） | AC-5 |
| F-11（監視 path 外無視） | AC-7 |
| 静的 grep（lefthook.yml） | AC-4 |

## 未カバー残課題

| # | 残課題 | 理由 | 対処 |
| --- | --- | --- | --- |
| R-1 | `generate-index.js` の出力決定論性が破綻した場合の根本修正 | 本タスクは workflow 追加のみで script 改修はスコープ外 | 別 issue 化（F-05 / F-06 で初検出された場合のみ） |
| R-2 | aiworkflow-requirements 以外の skill index 監視 | 現状 aiworkflow-requirements のみが対象 | 同 workflow 内に並列 job 追加（拡張容易） |
| R-3 | branch protection への required status check 登録 | 本タスクは workflow 配置のみ | `task-github-governance-branch-protection-spec` の運用ループで反映 |
| R-4 | F-10（submodule / LFS 経由 references） | 現状そのような構成なし | 検出時に再評価 |

## 4 条件サマリー

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | ◎ | post-merge 廃止後の drift 流入リスクを構造的に閉じる（`--no-verify` 迂回不能） |
| 実現性 | ◎ | 既存 ci.yml と同じ setup を流用、新規依存なし |
| 整合性 | ◎ | AC-1〜AC-7 全 PASS、不変条件 #1〜#7 非接触 |
| 運用性 | ○ | workflow file +1 / install オーバーヘッドは MINOR で許容（cache: pnpm で軽減） |

## 完了条件

- [x] AC-1〜AC-7 全件で検証手段 × 実装根拠が 1 つ以上紐付く
- [x] 双方向トレースを 2 表で記載
- [x] 残課題 R-1〜R-4 の対処先を明記
- [x] 4 条件 全 PASS / ○

## 次 Phase

Phase 8（DRY 化）へ AC マトリクス全 PASS と R-1〜R-4 残課題を引き継ぐ。
