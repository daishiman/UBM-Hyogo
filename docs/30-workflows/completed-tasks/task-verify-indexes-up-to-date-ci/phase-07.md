# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 |
| 下流 | Phase 8 |
| 状態 | completed |

## 目的

AC-1〜AC-7 を **検証手段（Phase 4 / 6）× 実装ファイル（Phase 5）** の 3 軸で完全トレースし、
未カバー残課題を可視化する。Phase 7 は本タスクの **品質ゲートの根拠** となる。

## AC × 検証手段 × 実装ファイル マトリクス

| AC | AC 内容 | 検証手段（Phase 4 TC / Phase 6 F） | 実装ファイル（Phase 5） | カバー状態 |
| --- | --- | --- | --- | --- |
| AC-1 | PR / main push で auto trigger | TC-05 / TC-06 | `.github/workflows/verify-indexes.yml` の `on:` ブロック | ◎ |
| AC-2 | drift 時 fail + 差分ファイル名出力 | TC-03 / TC-04 / F-01 | `Detect drift` step（`git diff --name-only` + `git status --short`） | ◎ |
| AC-3 | drift なしで false positive にならない | TC-01 / TC-02 / F-05 / F-06 | `pnpm indexes:rebuild` の決定論性（generate-index.js） | ◎ |
| AC-4 | post-merge hook に再生成を戻していない | （静的検証） | `lefthook.yml` を変更しない | ◎ |
| AC-5 | 既存 4 workflow と非衝突 | TC-08 | 独立 file + 独立 concurrency group `verify-indexes-${{ github.ref }}` | ◎ |
| AC-6 | Node 24 / pnpm 10.33.2 で実行 | TC-01（ローカル）/ 実機 PR | `setup-node@v4 (node-version: 24)` + `pnpm/action-setup@v4 (version: 10.33.2)` | ◎ |
| AC-7 | 監視範囲が `.claude/skills/aiworkflow-requirements/indexes` に限定され、未追跡 index も検出 | TC-07 | `git add -N` + `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` の path 引数 | ◎ |

## カバレッジ集計

| AC | 検証手段数 | 実装根拠数 | 判定 |
| --- | --- | --- | --- |
| AC-1 | 2 | 1 | PASS |
| AC-2 | 3 | 1 | PASS |
| AC-3 | 4 | 1 | PASS |
| AC-4 | 1（静的） | 1（不作為） | PASS |
| AC-5 | 1 | 2 | PASS |
| AC-6 | 2 | 2 | PASS |
| AC-7 | 1 | 1 | PASS |

→ AC-1〜AC-7 すべて **少なくとも 1 つの検証手段 × 1 つの実装根拠** が紐付き、PASS。

## 逆方向トレース（実装 → AC）

| 実装要素 | 担保する AC |
| --- | --- |
| `on: pull_request` + `on: push` | AC-1 |
| `permissions: contents: read` | AC-5（write 衝突しない） |
| `concurrency.group: verify-indexes-${{ github.ref }}` | AC-5 |
| `actions/checkout@v4` | AC-1（diff 取得の前提） |
| `pnpm/action-setup@v4 version: 10.33.2` | AC-6 |
| `actions/setup-node@v4 node-version: 24 cache: pnpm` | AC-6 |
| `pnpm install --frozen-lockfile` | AC-3（lockfile 揺れの除外）|
| `pnpm indexes:rebuild` | AC-3（決定論再生成） |
| `git add -N .claude/skills/aiworkflow-requirements/indexes` → `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` | AC-2 / AC-7 |
| `git diff --name-only` + `git status --short` | AC-2 |
| `lefthook.yml` 変更なし | AC-4 |

## 逆方向トレース（検証 → AC）

| 検証 | 担保する AC |
| --- | --- |
| TC-01（クリーン smoke） | AC-3 / AC-7 |
| TC-02（連続 2 回） | AC-3 |
| TC-03（references 編集） | AC-2 |
| TC-04（indexes 直接編集） | AC-2 |
| TC-05（PR trigger） | AC-1 |
| TC-06（push trigger） | AC-1 |
| TC-07（範囲限定） | AC-7 |
| TC-08（既存 CI 共存） | AC-5 |
| F-01（再生成忘れ） | AC-2 |
| F-05 / F-06（決定論性） | AC-3 |
| F-08（concurrency） | AC-5 |

## 未カバー残課題

| # | 残課題 | 理由 | 対処 |
| --- | --- | --- | --- |
| R-1 | false positive の根本原因解析（generate-index.js 内部） | 本タスクは workflow 追加のみで、script 改修はスコープ外 | 別 issue 化（決定論性が破綻した場合のみ） |
| R-2 | 他 skill（aiworkflow-requirements 以外）の indexes 監視 | 現状 aiworkflow-requirements のみが対象 | 将来同 file 内に job 追加（拡張性は確保済み） |
| R-3 | branch protection への required status check 登録 | 本タスクは workflow 配置のみ | task-github-governance-branch-protection-spec の運用ループで反映 |
| R-4 | F-10（submodule / LFS 経由 references） | 現状そのような構成なし | 検出時に再評価 |

## 4 条件サマリー

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | ◎ | post-merge 廃止後の drift リスクを構造的に防ぐ |
| 実現性 | ◎ | 既存 ci.yml と同じ setup を流用 |
| 整合性 | ◎ | AC-1〜AC-7 全 PASS、不変条件 #1〜#7 非接触 |
| 運用性 | ○ | workflow file +1 / install オーバーヘッドは MINOR で許容 |

## 実行タスク

1. AC × 検証 × 実装 のマトリクスを `outputs/phase-07/main.md` に記載
2. 順方向 / 逆方向トレースを 2 表で記載
3. カバレッジ集計を AC 別に算出
4. 未カバー残課題（R-1〜R-4）を別表で明記
5. 4 条件サマリーで GO 判定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | AC-1〜AC-7 の正本 |
| 必須 | Phase 4 outputs | TC 表 |
| 必須 | Phase 5 outputs | 実装ファイル |
| 必須 | Phase 6 outputs | failure case |

## 実行手順

1. AC-1〜AC-7 を順に列挙し、各 AC に対し検証 / 実装の紐付けを記入
2. 紐付けが 0 の AC が出た時点でフェーズ後退（戻し）
3. 残課題の対処先（issue / 本タスク）を明記
4. 4 条件 PASS で Phase 8 へ

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化の対象（既存 ci.yml の setup と重複の正当化） |
| Phase 10 | 最終 GO/NO-GO 判定の根拠 |
| Phase 13 | PR description に AC マトリクスを転記 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 不変条件 | #1〜#7 | 全 AC で非接触を確認 |
| AC 完全性 | — | AC-1〜AC-7 が verify と実装の両方に紐付く |
| 残課題明示 | — | R-1〜R-4 |
| docs + CI | — | 仕様書のみ |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | AC × 検証 × 実装 マトリクス | completed | 7 行 × 5 列 |
| 2 | 順方向トレース | completed | 11 実装要素 |
| 3 | 逆方向トレース（検証→AC） | completed | 11 検証 |
| 4 | カバレッジ集計 | completed | 7 行 |
| 5 | 残課題表 | completed | R-1〜R-4 |
| 6 | 4 条件サマリー | completed | 価値/実現/整合/運用 |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-07/main.md | AC マトリクス + 双方向トレース + 残課題 + 4 条件 |

## 完了条件

- [ ] AC-1〜AC-7 が 1 つ以上の検証 × 1 つ以上の実装に紐付く
- [ ] 双方向トレースが両方記載
- [ ] 残課題 R-1〜R-4 の対処先が明記
- [ ] 4 条件 全 PASS / ○

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 completed
- [ ] outputs/phase-07/main.md 配置済み
- [ ] artifacts.json の Phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ事項: 全 AC PASS マトリクス + R-1〜R-4 残課題
- ブロック条件: いずれかの AC で検証 0 / 実装 0 が残っていれば Phase 7 やり直し
