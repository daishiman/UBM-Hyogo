# Phase 8 — before-after（実 workflow 修正前後 diff / canonical 命名 / コミット分割計画 / 用語整合 grep）

## Status

spec_created

> 本書は Phase 5 で `Write` した実 workflow ファイル 2 本（`pr-target-safety-gate.yml` / `pr-build-test.yml`）の **修正前後 diff を表形式で記録**する。本タスクでは両ファイルとも main ブランチ上には存在しないため、before = "不存在"、after = "新規" の形で記述する。

---

## 1. before / after 一覧（実 workflow 2 ファイル）

| ファイル | before | after | 備考 |
| --- | --- | --- | --- |
| `.github/workflows/pr-target-safety-gate.yml` | **不存在**（main / dev ブランチに存在しない） | **新規**（triage 専用 workflow / `pull_request_target` / `permissions: {}` ＋ job `pull-requests: write`） | Phase 5 で `Write` 済み。本タスクで初出 |
| `.github/workflows/pr-build-test.yml` | **不存在**（main / dev ブランチに存在しない） | **新規**（untrusted build workflow / `pull_request` / `permissions: {}` ＋ job `contents: read` ＋ `persist-credentials: false`） | Phase 5 で `Write` 済み。本タスクで初出 |

> 既存 `.github/workflows/*.yml` のうち `pull_request_target` を使用していたものは存在しない（Phase 5 Step 2 棚卸し前提）。実走時に棚卸しで残存が検出された場合は本表に追記し、剥離 diff を記述する。

---

## 2. ファイル別 before / after diff（表形式）

### 2.1 `.github/workflows/pr-target-safety-gate.yml`（triage workflow）

| 観点 | before | after | 関連 FC / AC |
| --- | --- | --- | --- |
| ファイル存在 | なし | あり（46 行） | AC-1, AC-9 |
| trigger | — | `pull_request_target: types: [opened, synchronize, labeled, reopened]` | AC-1 |
| デフォルト `permissions:` | — | `{}` | AC-3, FC-4 |
| job `triage.permissions` | — | `pull-requests: write` のみ | AC-3, FC-4 |
| `actions/checkout` の有無 | — | **なし**（PR head を checkout しない） | AC-1, FC-1 |
| `${{ secrets.* }}` 参照 | — | 0 件 | AC-3, FC-2 |
| untrusted 文字列の扱い | — | `env:` 経由（`PR_NUMBER` / `PR_AUTHOR` / `PR_LABEL` / `PR_ACTION`）。`run:` 内のシェル展開は `${VAR}` 形式 | AC-7, FC-1 |
| `workflow_run:` 使用 | — | なし | AC-7, FC-5 |
| job `name:` | — | `triage`（branch protection contexts 同期対象） | AC-5, AC-6, FC-8 |
| workflow `name:` | — | `PR Target Safety Gate (triage)` | AC-9 |

### 2.2 `.github/workflows/pr-build-test.yml`（untrusted build workflow）

| 観点 | before | after | 関連 FC / AC |
| --- | --- | --- | --- |
| ファイル存在 | なし | あり（57 行） | AC-2, AC-9 |
| trigger | — | `pull_request: types: [opened, synchronize, reopened]` | AC-2 |
| デフォルト `permissions:` | — | `{}` | AC-3, FC-4 |
| job `build-test.permissions` | — | `contents: read` のみ | AC-2, AC-3, FC-4 |
| `actions/checkout` | — | あり（`ref: ${{ github.event.pull_request.head.sha }}` ＋ `persist-credentials: false`） | AC-3, FC-3 |
| `${{ secrets.* }}` 参照 | — | 0 件（build step の `env: {}` で明示空） | AC-3, FC-6 |
| `mise exec` 経由 | — | あり（Node 24 / pnpm 10 保証） | 運用整合 |
| step 構成 | — | Checkout → Setup mise → Install → Typecheck → Lint → Build | AC-2 |
| job `name:` | — | `build-test`（branch protection contexts 同期対象） | AC-5, AC-6, FC-8 |
| workflow `name:` | — | `PR Build Test (untrusted)` | AC-9 |
| 外部 action SHA pin | — | `actions/checkout@b4ffde65...` / `jdx/mise-action@5083fe46...`（UT-GOV-007 連携） | S-4 |

### 2.3 既存 workflow への影響（`persist-credentials: false` 補完）

| ファイル | before | after | 備考 |
| --- | --- | --- | --- |
| 既存 `actions/checkout` を含む workflow（実走時に棚卸し） | `persist-credentials:` 未指定 | `persist-credentials: false` を補完 | Phase 5 Step 3 (3) で本タスクの単一 commit に集約 |

> spec_created 時点では具体ファイル名は確定しない。Phase 11 実走前の棚卸しで確定し、本表 §2.3 に追記する手順とする。

---

## 3. canonical 命名統一

### 3.1 ファイル名

| canonical | 役割 | 確定状況 |
| --- | --- | --- |
| `pr-target-safety-gate.yml` | trusted triage workflow（`pull_request_target`） | 確定（Phase 5 で Write 済み） |
| `pr-build-test.yml` | untrusted build workflow（`pull_request`） | 確定（Phase 5 で Write 済み） |

### 3.2 job 名

| canonical | workflow ファイル | branch protection contexts 同期対象 |
| --- | --- | --- |
| `triage` | `pr-target-safety-gate.yml` | ✓（AC-5, AC-6） |
| `build-test` | `pr-build-test.yml` | ✓（AC-5, AC-6） |

> branch protection の `required_status_checks.contexts` に上記 2 名が含まれることを Phase 5 Step 7 で確認する。drift 時は UT-GOV-001 / UT-GOV-004 への追従起票（FC-8）。

### 3.3 用語（4 canonical 用語）

| canonical | 用途 |
| --- | --- |
| `pull_request_target safety gate` | 本タスク全体を指す機能名 |
| `triage workflow` | trusted context で動く `pull_request_target` workflow |
| `untrusted build workflow` | untrusted context で動く `pull_request` workflow |
| `pwn request pattern` | 防止すべき脆弱性パターン |

---

## 4. 重複 step / 共通設定の整理方針

| 項目 | 整理方針 |
| --- | --- |
| `actions/checkout` の `persist-credentials: false` | 全箇所で明示。triage 側はそもそも checkout を持たないため、`pr-build-test.yml` の 1 箇所のみ（line 35 で確認済み）。将来 checkout 追加時もこの不変条件を強制 |
| 外部 action の SHA pin（UT-GOV-007 連携） | yaml 末尾の `# v4` / `# v2` コメントで人間可読 tag を併記しつつ pin 値は 40 桁 SHA。新規 action 追加時も同方針 |
| `permissions:` 最小化 | workflow 冒頭に `permissions: {}` を必ず置く。job では必要最小（`pull-requests: write` / `contents: read`）のみ |
| `concurrency:` | 本タスクでは未設定（PR ごとに run を独立化することで rerun 重複を許容）。将来必要時は workflow 冒頭に集約 |
| `env:` の取り扱い | untrusted 文字列（`pull_request.head.*` / `.title` / `.body` / `label.name`）は必ず `env:` 経由。`run:` 内 `${{ }}` の直接展開禁止 |
| `mise exec --` ラッパ | build / test では必ず使用。`pnpm` / `node` の直接実行禁止（Node バージョン整合のため） |

---

## 5. 既存 workflow の段差除去（剥離リスト）

spec_created 時点では旧来の `pull_request_target` で build/test を走らせている step は存在しない（Phase 5 Step 2 棚卸し前提）。Phase 11 実走前の棚卸しで残存が検出された場合、以下の表に追記する。

| workflow ファイル | 残存 step | 移送先 / 削除 | 関連 FC |
| --- | --- | --- | --- |
| （該当なし。実走時に追記） | — | — | — |

> 残存 step が見つかった場合の運用: (a) 単一 commit に剥離差分を含める、(b) 剥離 diff を本表に追記、(c) `git revert` 単位で巻き戻せることを保証。

---

## 6. コミット分割計画（単一 PR 内 3 コミット）

単一 PR / 単一 PR description 内で、以下 3 コミットに分割する。`git revert <commit>` で各 commit を独立に巻き戻せる。

| # | コミット主旨 | 含まれる差分 | 巻き戻しの効果 | 関連 AC |
| --- | --- | --- | --- | --- |
| **(1)** | `feat(ci): add pull_request_target safety gate workflows` | `.github/workflows/pr-target-safety-gate.yml` 新規追加 / `.github/workflows/pr-build-test.yml` 新規追加 | safety gate 導入前へ完全に戻る（旧来の CI 構成に復帰） | AC-1, AC-2, AC-3, AC-7 |
| **(2)** | `chore(ci): remove untrusted steps from pull_request_target workflows` | 旧 trigger 上で残存していた untrusted build / install / test step の剥離（実走時棚卸し結果に基づく差分。spec_created 時点では空コミット相当） | 旧 step のみを復活させる（safety gate 自体は維持） | AC-1 |
| **(3)** | `chore(governance): sync required status checks contexts to canonical job names` | branch protection の `contexts` を新 job 名（`triage` / `build-test`）に同期する UT-GOV-001 連携 PR との同期記録 / `outputs/phase-5/static-check-log.md` への `gh api` 出力追加 | required status checks 名のみを旧名に戻す | AC-5, AC-6 |

### 6.1 各コミットの独立巻き戻し検証

| コミット | revert コマンド | 検証 |
| --- | --- | --- |
| (1) | `git revert <sha-1>` | safety gate workflow が削除され、旧 CI 構成に戻ることを `gh workflow list` で確認 |
| (2) | `git revert <sha-2>` | 剥離した step が復活する（spec_created 時点では空コミット想定で no-op） |
| (3) | `git revert <sha-3>` | branch protection contexts のみ旧名へ戻る（実 workflow ファイルは変化なし） |

### 6.2 squash 運用との関係

3 コミット粒度を維持するため、PR の merge 戦略は **`Rebase and merge` または `Create a merge commit`** とする（`Squash and merge` は採用しない）。AC-6 のロールバック粒度を担保する。

---

## 7. 用語整合チェック（4 用語の grep 手順）

`grep -RnE` で 4 canonical 用語の出現箇所を機械的に確認する。揺れ表記を検出した場合は本タスクの diff 内で修正する。

```bash
# canonical 用語 4 種の出現箇所列挙
grep -RnE 'pull_request_target safety gate' \
  docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/ \
  .github/workflows/pr-target-safety-gate.yml \
  .github/workflows/pr-build-test.yml

grep -RnE 'triage workflow' \
  docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/

grep -RnE 'untrusted build workflow' \
  docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/

grep -RnE 'pwn request' \
  docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/
```

### 7.1 揺れ表記検出 grep（NG ワード列挙）

```bash
# 不採用な表記が混入していないか検出（hit 0 件を期待）
grep -RnE 'PR target gate|safety-gate workflow|untrusted job|pr untrusted build' \
  docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/ \
  .github/workflows/
```

> Phase 3 review.md §6 で揺れ不検出を確認済み。本 Phase で再点検し、Phase 9 quality-gate G-8 で再検証する。

### 7.2 yaml コメント内の用語整合

```bash
# yaml コメントでの用語使用確認
grep -nE '^\s*#.*(triage|untrusted|pwn|pull_request_target)' \
  .github/workflows/pr-target-safety-gate.yml \
  .github/workflows/pr-build-test.yml
```

期待: `pr-target-safety-gate.yml` line 1〜7 / `pr-build-test.yml` line 1〜8 のコメントブロックで canonical 用語が使用されていること。

---

## 8. リファクタ後の振る舞い不変確認

リファクタで以下の不変条件が保たれていることを Phase 9 quality-gate で再検証する:

| 不変条件 | 確認コマンド |
| --- | --- |
| `pr-target-safety-gate.yml` に `actions/checkout` が無い | `grep -nE 'actions/checkout' .github/workflows/pr-target-safety-gate.yml` → 0 件 |
| 全 `actions/checkout` で `persist-credentials: false` | `grep -RnE 'persist-credentials:\s*false' .github/workflows/` の hit 数 ≥ checkout 利用箇所数 |
| デフォルト `permissions: {}` | `yq '.permissions' .github/workflows/*.yml` が `{}` または `null` |
| `secrets.*` 参照 0 件（両 workflow） | `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml` → 0 件 |
| `workflow_run:` 不使用 | `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` → 0 件 |
| job 名 `triage` / `build-test` | `yq '.jobs \| keys' .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml` |

---

## 9. 次 Phase への引き継ぎ

- Phase 9 quality-gate G-2 / G-3 / G-8 は本書 §8 の不変条件確認コマンドを再走する。
- Phase 11 manual smoke は §6 の 3 コミット分割計画に従って commit を切る（Phase 13 ユーザー承認後）。
- Phase 12 documentation-changelog は本書を主要根拠として "実 workflow 新規追加 + branch protection 同期" の変更履歴を起こす。
