# Phase 3: 設計レビュー — 代替案検討と PASS/MINOR/MAJOR 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |

## 1. 目的

Phase 2 で確定した設計（逐次 runbook + 擬似スクリプト仕様 + ADR-01〜05）が
Phase 4 以降に進める品質に達しているかを判定する。
代替案を **最低 3 案** 検討し、PASS / MINOR / MAJOR で総合判定する。

## 2. レビュー観点

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| 真の論点との整合 | PASS | 「hook スキップ撲滅と継続保証」を満たす設計になっている。逐次 install + version 検証 + hygiene check の 3 点セットで継続保証を実装可能 |
| 依存境界 | PASS | new-worktree.sh（新規）/ 本 runbook（既存遡及）/ verify-indexes-up-to-date-ci（CI 検出）の責務分界が明確で重複・隙間なし |
| 不変条件 | PASS | `lefthook.yml` 正本主義 / `.git/hooks/*` 手書き禁止 / post-merge 廃止 と整合。CLAUDE.md「Git hook の方針」を強化する方向 |
| 失敗復帰 | PASS | continue ポリシー（ADR-02）と自動 retry（pnpm rebuild lefthook 1 回）で運用負荷が低い。最終集計で人間が判断する設計 |
| 監査可能性 | PASS | Markdown 表形式のログ（`outputs/phase-11/manual-smoke-log.md`）により後段差分検証可能 |
| 安全性 | PASS | 旧 hook 自動削除を行わない（ADR-03）ため誤削除リスクなし |
| 冪等性 | PASS | 全 worktree 部分再実行が無害。`lefthook install` の公式冪等性に依拠 |
| 実装可能性 | PASS | 擬似スクリプトが POSIX shell + awk + git + mise + pnpm の標準コマンドのみで構成され、実装担当者が一意にコード化できる粒度 |

## 3. 代替案検討（最低 3 案）

### 代替案 A: GitHub Actions による全 worktree CI 検証

- **内容**: 開発者ローカルで一括再 install するのではなく、CI 側で
  「indexes 鮮度」「hook 配置」を検出する。
- **メリット**: 開発者の手作業が不要。CI 化により忘却リスクなし。
- **デメリット**:
  - CI は CI 自身の checkout 環境しか見られず、開発者ローカル worktree の
    `.git/hooks/` を検証することは原理的に不可能。
  - 本問題（**ローカル**で hook がスキップされる構造）は解決しない。
  - CI で indexes 鮮度を見るのは別タスク（task-verify-indexes-up-to-date-ci）で
    既に切り出されており、本タスクとは責務が異なる。
- **採否**: **不採用**（解決対象が異なる。本タスクはローカル hook 配置の遡及保証）

### 代替案 B: `git worktree` を全廃して per-clone モデルへ移行

- **内容**: worktree を使わず、機能ごとに独立 clone を持つ。
  各 clone が独立した `pnpm install` ライフサイクルを持つため、
  hook も clone 単位で確実に配置される。
- **メリット**: 各 clone は完全独立。pnpm store 競合も worktree 共有 `.git` 問題もなし。
- **デメリット**:
  - ストレージ増（30+ clone は数十 GB 規模）。
  - PR ブランチ切替が遅い（fetch + checkout 全部必要）。
  - 既存ワークフロー（`scripts/new-worktree.sh` / `.worktrees/` 配下運用）を破壊する。
  - Claude Code の並列 worktree 起動運用と矛盾する（CLAUDE.md「ワークツリー作成」節）。
- **採否**: **不採用**（コスト過大・既存運用と非互換）

### 代替案 C: post-merge を復活させて auto re-install

- **内容**: post-merge 廃止を撤回し、merge のたびに自動再 install する。
- **メリット**: 自動化される。runbook の手動実行が不要。
- **デメリット**:
  - 上流タスク `task-git-hooks-lefthook-and-post-merge` で意図的に廃止した方針に逆行。
  - indexes 自動再生成と同様の「無関係 PR への diff 混入」問題が再燃する。
  - `lefthook.yml` の `post-merge` セクションコメント
    「`# ⚠ post-merge では indexes/*.json の再生成を行わない`」
    と矛盾する。
- **採否**: **不採用**（直前タスクの方針と矛盾）

### 代替案 D（追加）: pnpm workspace で worktree 横断 store を強制

- **内容**: 全 worktree が単一 pnpm store を共有する設定を強制し、
  並列 install を可能にする。
- **メリット**: 並列化により実行時間短縮。
- **デメリット**:
  - pnpm 公式は同一 store への並列書き込みを保証しない（content-addressable な
    file rename 競合が発生する）。
  - 仮に動作しても、retry 時の挙動が再現困難になりデバッグコストが増大。
  - `lefthook-operations.md` 既存記述と矛盾。
- **採否**: **不採用**（pnpm 仕様違反 + デバッグ困難化）

### 結論

採用案（Phase 2 設計の逐次 runbook + 擬似スクリプト仕様 + ADR-01〜05）が
代替 4 案いずれよりも整合性・安全性・運用性で優位。

## 4. レビュー結果

### MAJOR（Phase 4 進行を止める指摘）

なし。

### MINOR（Phase 4-11 で吸収する指摘）

| ID | 指摘 | 対応先 Phase | 対応方針 |
| --- | --- | --- | --- |
| M-01 | `outputs/phase-11/manual-smoke-log.md` に "実行日時" カラムを ISO8601 で書く運用が習慣化していない | Phase 11 | 仕様書に書式例（`2026-04-28T10:00Z` 形式）を必ず含める。Phase 2 §4.5 に既に反映済み |
| M-02 | `pnpm rebuild lefthook` 後の二度目失敗時、警告メッセージの文面が未定 | Phase 5 | runbook 末尾の集計セクションに `version=FAIL` worktree 一覧を表示し、ユーザー向け固定文面を Phase 5 で確定 |
| M-03 | detached HEAD worktree は対象に含めるが（ADR-04）、コミット行為が runbook 実行者に発生しないことを補足する一文がない | Phase 5 | runbook 冒頭に「本 runbook は read + install のみ。コミット / push を発生させない」明記 |
| M-04 | hook hygiene `STALE` 検出時のユーザー削除手順が runbook 末尾に集約されていない | Phase 5 | 「STALE 一覧 + 削除手順例（`rm .git/hooks/post-merge && pnpm install`）」を runbook 末尾に追加 |
| M-05 | `lefthook-operations.md` 差分追記内容（Phase 2 §10）の挿入位置・文面が確定していない | Phase 12 | implementation-guide / system-spec-update-summary で確定 |

### NICE-TO-HAVE

| ID | 内容 |
| --- | --- |
| N-01 | 将来的に `scripts/reinstall-lefthook-all-worktrees.sh` を実装する Wave で、本 runbook を smoke する CI（local act / nektos）を追加できる |
| N-02 | hook hygiene `OK` の sentinel 文字列を `lefthook.yml` の min_version とセットで記録できると、lefthook 大型バージョンアップ時の再 install 必要性検出に転用可能 |

## 5. 総合判定

**PASS**（MAJOR 0 件 / MINOR 5 件は Phase 4-5-11-12 で吸収）

Phase 4 以降への進行を承認する。

## 6. 4 条件再評価

| 観点 | 判定 | 備考（Phase 1 からの差分） |
| --- | --- | --- |
| 価値性 | PASS | 変更なし。代替 A〜D を退け、ローカル hook 配置の遡及保証という固有価値を確認 |
| 実現性 | PASS | 変更なし。擬似スクリプトが標準コマンドのみで構成されることを再確認 |
| 整合性 | PASS | 代替 3 案（A/B/C）を退け、上流タスク（lefthook 採用 + post-merge 廃止）と完全整合。CLAUDE.md「Git hook の方針」とも整合 |
| 運用性 | PASS | M-01〜M-05 を Phase 5 / 11 / 12 で吸収すれば運用品質確保。逐次実行による所要時間（数分〜十数分）も許容範囲 |

## 7. 設計トレーサビリティ

| Phase 2 セクション | Phase 1 入力 | AC マッピング |
| --- | --- | --- |
| §4.1 worktree 抽出 | 既存規約「worktree 抽出」 | AC-1 |
| §4.2 逐次 install | 既存規約「並列性」「pnpm モード」 | AC-2 |
| §4.3 検証フェーズ | 苦戦-3「Apple Silicon」 | AC-3 |
| §4.4 hook hygiene | 苦戦-4「旧 hook 残存」 | AC-4 |
| §4.5 ログ書式 | 既存規約「ログ出力先」 | AC-5 |
| §10 ドキュメント差分 | 依存「lefthook-operations.md」 | AC-6 |
| §6 責務境界 | 依存「scripts/new-worktree.sh」 | AC-7 |
| §7 ADR-01〜05 | 4 条件評価 | AC-8 |
| 苦戦事前棚卸し（Phase 1 §9） | 苦戦 5 件 | AC-9 |

## 8. Phase 4 への引き渡し事項

- MAJOR 指摘なし → Phase 4 進行可
- MINOR 5 件（M-01〜M-05）の Phase 別吸収先を Phase 4 テスト戦略 / Phase 5 runbook /
  Phase 11 smoke / Phase 12 ドキュメント更新で確実に取り込む
- 代替案 A/B/C/D は Phase 12 unassigned-task-detection で
  「保留判断の説明責任」として記録する
- 4 条件全 PASS のまま Phase 4 へ
- 採用設計の中核（逐次 / continue / 自動 retry / 自動削除なし / detached HEAD 含む）
  は Phase 4 以降で変更しない（変更時は Phase 3 へ差し戻し）
