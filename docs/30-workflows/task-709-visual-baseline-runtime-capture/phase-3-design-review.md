[実装区分: 実装仕様書]

# Phase 3: 設計レビュー

## 目的

Phase 2 の設計が CONST_005 / CONST_007 / task-18-fu との整合性を満たすか確認する。

## 1. CONST_005 適合性チェック

| 項目 | 充足 | 根拠 |
|------|------|------|
| 変更対象ファイル一覧 | ✓ | Phase 1 §5 / index.md 変更対象ファイル一覧 |
| 関数・型・モジュールのシグネチャ | ✓ | 既存 `VISUAL_ROUTES` を流用、新規追加なし（Phase 2 §4） |
| 入出力・副作用定義 | ✓ | Phase 2 §5 |
| テスト方針 | ✓ | Phase 4 で記載 |
| ローカル実行コマンド | ✓ | Phase 2 §7 |
| DoD | ✓ | Phase 1 §6 |

## 2. CONST_007（single-cycle scope）チェック

| 含まれる | 03.実装サイクル内完了 |
|---------|----------------------|
| baseline runtime capture (CI 経由) | runtime_pending（user approval marker 後に同一タスク内で再開） |
| `playwright-visual-full.yml` PR trigger 復活 | runtime_pending（baseline PR 取り込みと同 wave） |
| matrix 更新 | runtime_pending（baseline 実体確認後） |
| typecheck / lint / playwright PASS | runtime_pending（runtime capture 後） |

**スコープから分離した項目とその理由**:

| 項目 | 分離理由 | 実施時期・場所 |
|------|---------|---------------|
| dev/main branch protection への required check 統合 (`gh api -X PUT`) | governance 変更は CLAUDE.md 規定により別承認サイクルが必要 (`grep` で drift 確認 + 事前 read-only evidence → user 明示承認 → `gh api PUT`)。本タスクと混ぜると承認境界が曖昧になる | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |
| `error.tsx` / `loading.tsx` の deterministic fixture | issue #709 本体スコープ外（task-25-followup-error-boundary-smoke-fixture / task-25-followup-loading-state-observation-fixture が別に存在） | 既存 follow-up タスクで実施 |

「分量が多い」「念のため」等の先送りには該当しない（CONST_007 例外条件 1 を満たす）。baseline capture は後続タスク化せず、本タスク内の user-gated runtime checkpoint として扱う。

## 3. task-18-fu 構築済み資産との整合

| 資産 | 本タスクでの扱い |
|------|----------------|
| `playwright.config.ts` の 3 project | 編集なし（流用） |
| `full-visual.spec.ts` | 編集なし（流用） |
| `visual-routes.ts` | 編集なし（流用） |
| `playwright-visual-baseline-update.yml` | 編集なし、workflow_dispatch で実行のみ |
| `playwright-visual-full.yml` | `pull_request:` ブロックのみ編集 |

## 4. リスク評価

| Risk | Severity | Mitigation |
|------|----------|-----------|
| baseline 取得後に flaky で 2 連続 PASS が取れない | Medium | mask 追加 / waitForLoadState 強化 / retry=1 で許容（既存 spec の `networkidle` + font ready で大半は吸収済み） |
| PR trigger 復活で他 PR の wall-clock が伸びる | Low | concurrency group + path-filter で他 path 変更時は発火しない |
| 51 件の PNG commit でリポジトリサイズが急増 | Low | 各 PNG は <200KB 想定、合計 ~10MB 程度。`git-lfs` 化は不要 |
| MVP-PAUSE 復活後に visual diff で頻繁ブロック | Medium | mask runtime fixture を Phase 6 で強化、Phase 8 refactor で動的要素列挙 |

## 5. レビュー結果

- 設計は task-18-fu の正本に従い破壊的変更なし。
- user gate 後に同一タスク内で完了可能。承認前は `CONTRACT_READY_IMPLEMENTATION_PENDING` として閉じない。
- next: Phase 4 へ。

## 6. 成果物

- 本ファイル `phase-3-design-review.md`
