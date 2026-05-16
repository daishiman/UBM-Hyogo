[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新

## 目的

正本ドキュメントを task-709 完了状態に同期し、未来の保守者・AI agent が現状を誤解しないようにする。

---

## Part 1: 中学生レベル概念説明

### このタスクで何をしたの？

「ホームページのスクリーンショット（画面の写真）を、いつもと違う形に変わっていないか自動で見張る仕組み」を、これまで **4 画面** だけで動かしていたところを、**17 画面 × 3 種類の画面サイズ（パソコン・タブレット・スマホ）= 51 枚** に増やしました。

### なんでそれが必要なの？

たとえば誰かが CSS（色や大きさのルール）を直したとき、自分が触ったページ以外の **関係なさそうなページがこっそり崩れてしまう** ことがあります。51 枚の「正解の写真」を CI（自動チェック）に持たせておくと、変更後のページが正解の写真と違う見た目になったら、PR をマージする前に自動で「ここが変わってるよ」と教えてくれます。

### どうやって 51 枚を作ったの？

ローカル PC で作ると、人によって OS のフォントや描画エンジンが少しずつ違うので、CI のサーバー（Ubuntu）と見た目がズレてしまいます。そこで **GitHub Actions の workflow** を使い、CI の中で「写真を撮るモード」（`--update-snapshots`）を 1 回だけ走らせ、撮れた 51 枚をそのまま PR にコミットしました。

### 関連用語

| 用語 | 意味 |
|------|------|
| baseline | 「これが正解」とされる比較用の画像 |
| visual regression | 見た目が知らないうちに変わってしまうこと |
| viewport | 画面サイズ（パソコン用・タブレット用・スマホ用） |
| CI gate | PR が問題なくマージできるかを自動で判定する関門 |
| mask | 「ここは比較しなくていい」と指定する部分（時計表示など毎回変わるところ） |

---

## Part 2: 技術者向け実装ガイド (implementation-guide)

### 2.1 変更スコープ

- `.github/workflows/playwright-visual-full.yml`: `pull_request:` trigger 復活 + MVP-PAUSE コメント削除
- `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/`: 51 PNG 新規
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`: 数値更新
- 本タスク outputs 一式

### 2.2 baseline 取得の正本フロー

1. `gh workflow run playwright-visual-baseline-update.yml --ref <branch>`
2. workflow_dispatch + `environment: visual-baseline-approval` で gate
3. `peter-evans/create-pull-request` action が baseline-update PR を生成
4. 本タスクブランチに merge 取り込み

ローカル `--update-snapshots` は **禁止**（OS drift）。

### 2.3 CI workflow 構成

| workflow | trigger | 役割 |
|----------|---------|------|
| `playwright-visual-full.yml` | PR (path-filter 6 件) + nightly (`0 18 * * *` JST 03:00) + workflow_dispatch | regression detection |
| `playwright-visual-baseline-update.yml` | workflow_dispatch + approval gate | baseline 更新 |

### 2.4 矛盾しない設計判断

- baseline 存在チェック step は **残す**: 万一 PNG が紛失しても PR が unblock されるため
- `--update-snapshots` を CI 限定にする: 開発者ローカルでの環境差を排除

### 2.5 後続タスクへの申し送り

- `playwright-visual-full / visual-full (chromium, desktop|tablet|mobile)` を dev / main の required status check に追加する governance タスク
  - 実施前提: `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` で現状 read-only 取得 → user 明示承認 → `gh api -X PUT`
  - 本タスクには含まれない（CLAUDE.md governance 規定）
  - formalized: `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md`

### 2.6 不変条件レビュー

| 不変条件 | 状態 |
|---------|------|
| task-18-fu 資産破壊なし | ✓ |
| W7 4 baseline 維持 | ✓ |
| maxDiffPixelRatio 0.02 | ✓ |
| screenshot drift 抑止設定 | ✓ |
| D1 直接アクセス禁止 | ✓ (本タスクは UI / CI のみ) |

---

## Part 3: 監査整合

### 3.1 system spec 同期

| 対象 | 更新 |
|------|------|
| `docs/00-getting-started-manual/specs/` | 直接編集なし（visual regression は spec 配下に明示記載なし） |
| `SMOKE-COVERAGE-MATRIX.md` | `Visual baseline 4/19 → 17/19`、Drift Notes / Future Candidates 整理 |
| CLAUDE.md の "UI prototype alignment / MVP recovery" 章 | 追加編集なし（不変条件・required check 候補表現は task-18 で記載済み） |

### 3.2 未タスク検出 (unassigned-task)

| 検出 | 申し送り先 |
|------|-----------|
| dev/main branch protection required check 統合 | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |
| `error.tsx` / `loading.tsx` deterministic fixture | task-25-followup-error-boundary-smoke-fixture / task-25-followup-loading-state-observation-fixture（既存） |

### 3.3 documentation changelog

| Step | 判定 |
|------|------|
| 1-A (system spec) | 編集不要 |
| 1-B (CLAUDE.md) | 編集不要 |
| 1-C (matrix / workflow doc) | `SMOKE-COVERAGE-MATRIX.md` 編集 |
| 2 (workflow outputs) | phase-1..13 仕様書 + phase-7/9/11 evidence |

---

## 4. 成果物

- 本ファイル `phase-12-documentation.md`
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`（実装時に Part 1 + Part 2 を抜粋して生成）
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
