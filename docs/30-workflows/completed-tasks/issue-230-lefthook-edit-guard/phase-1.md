# Phase 1: 要件定義 — issue-230-lefthook-edit-guard

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> taskType=implementation, visualEvidence=NON_VISUAL, workflow_state=implemented_local_runtime_pending。

## 1.1 タスクタイプ判定（必須）

| 入力 | 値 | 根拠 |
|------|----|------|
| `taskType` | `implementation` | shell guard / CI workflow / lefthook.yml の実コード変更を伴う |
| `visualEvidence` | `NON_VISUAL` | UI 非接触。証跡は focused vitest（child_process）+ shell exit code + grep gate |
| `implementation_mode` | `new` | current branch 未実装。`grep -rn "lefthook-edit-guard\|verify-hook-integrity"` = 0 件 |
| `workflow_state` | `implemented_local_runtime_pending` | コード実装とローカル検証は完了。CI run / commit / push / PR / issue mutation は user-gated |

## 1.2 path topology 実測（Phase 1 path topology verification gate）

実在を `rg --files` / `ls` で実測した（stale path 引用を防ぐ）。

| 参照 path | 実在 | 用途 |
|-----------|------|------|
| `lefthook.yml` | あり（94 行） | hook 正本。pre-commit に guard を追加 |
| `scripts/hooks/` | あり（8 本） | guard script 配置先。`block-test-suffix.sh` を実装テンプレに採用 |
| `scripts/coverage-guard.spec.ts` | あり | shell guard の vitest テストパターン |
| `.github/workflows/verify-test-suffix.yml` | あり | CI gate workflow テンプレ |
| `docs/00-getting-started-manual/lefthook-operations.md` | あり | hook 運用ドキュメント（AC-3 リンク先） |
| `.github/CODEOWNERS` | あり | `lefthook.yml` は未登録（AC-2 代替不成立を確認） |

## 1.3 要件（issue #230 AC を最新コードへ最適化）

| ID | 元 AC | 最適化後の要件 | 受け入れ可能な証跡 |
|----|-------|---------------|------------------|
| R-1 | AC-1 | **pre-commit guard** が、lefthook 非管理の手書き `.git/hooks/*` ファイルを検知し exit 1。CI 側は `lefthook.yml` が参照する `scripts/hooks/*.sh` の実在 + tracked stray hook 不在を検証 | guard fixture spec（fake hook 追加→fail）/ integrity spec（参照欠落→fail）/ CI workflow run |
| R-2 | AC-2 | pre-commit guard が staged `lefthook.yml` を検知し、`LEFTHOOK_EDIT_ACK=1` が無ければ exit 1 + 確認メッセージ | guard fixture spec（lefthook.yml stage→ack無で fail / ack有で pass） |
| R-3 | AC-3 | 拒否メッセージに CLAUDE.md「Git hook の方針」+ `docs/00-getting-started-manual/lefthook-operations.md` への導線を含む | メッセージ文字列の grep assertion |
| R-4 | AC-4 | false positive 最小化: `.git/hooks/*.sample` 除外 / lefthook 署名（`LEFTHOOK`）を含む managed hook 除外 / merge・rebase・cherry-pick 中は skip | guard fixture spec（.sample / managed hook / MERGE_HEAD 存在時 pass） |

## 1.4 根本問題（1文）

Git hook は `lefthook.yml` を唯一の正本とする運用だが、手書き `.git/hooks/*` と `lefthook.yml` 偶発直編集を機械検知する手段が無く、正本逸脱 drift が静かに混入し得る。

## 1.5 前提・制約

- solo 運用ポリシー: 必須レビュアー数 0（`required_pull_request_reviews=null`）。AC-2 の「review 必須化」は branch protection を変えずに **ack ゲート**で代替する。
- `.git/` は git 管理外 → CI checkout に local hook は現れない（AC-1 の CI literal 解釈は実行不可能）。
- 新規 test は `*.spec.{ts,tsx}` のみ（invariant #8）。

## 1.6 完了条件（Phase 1）

- taskType / visualEvidence / implementation_mode / workflow_state を artifacts.json metadata に確定（完了）
- AC → 観測可能な enforcement 面への最適化マッピングを R-1..R-4 として定義（完了）
- path topology 実測で stale path 0（完了）
