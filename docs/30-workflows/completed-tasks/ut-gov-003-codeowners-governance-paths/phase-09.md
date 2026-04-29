# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |
| 親タスク | task-github-governance-branch-protection |
| 原典 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md |

## 目的

Phase 8 で確定した CODEOWNERS DRY 化結果（After CODEOWNERS / SSOT 宣言 / 行順序ポリシー）を入力に、CODEOWNERS 固有の 6 観点で品質保証を行い、Phase 10 最終レビューに必要な客観的根拠を揃える。

CODEOWNERS の品質保証は **GitHub API の codeowners/errors エンドポイントが事実上の唯一の正本検証**であり、ローカル `pre-commit` 等の linter は補助に過ぎない。本 Phase はこの GitHub 側検証を中核に据え、加えて表記揺れ / 被覆漏れ / branch protection 整合 / SSOT 整合を確認する。

無料枠見積・secret hygiene・a11y は本タスクのスコープ外（infrastructure governance / docs-touching のみで完結）として明記する。

## 実行タスク

1. `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` を実行し `errors: []` （構文 / 権限 / 不在ユーザーエラー 0）を確認する（完了条件: errors 配列が空）。
2. ripgrep で `doc/` 残存件数 0 を確認する（完了条件: 該当出力 0、または「外部 URL 等の不可避ケース」のみで explicit allow リストに記録）。
3. CODEOWNERS の最終行付近に **global fallback** が **冒頭の `*`** として 1 行のみ存在し、最終マッチ勝ち順序を壊していないことを確認する（完了条件: `*` が冒頭 1 行 / 末尾に余分な `*` なし）。
4. governance 重要 5 パスがすべて指定されていることを確認する（完了条件: 5 パス × `grep -F` で 1 行以上ヒット）。
5. `task-github-governance-branch-protection` (UT-GOV-001) 草案との整合確認: `require_code_owner_reviews=false` が **明文化** されており、CODEOWNERS が ownership 文書としてのみ機能することを確認する（完了条件: UT-GOV-001 仕様書に該当記述）。
6. CI 連携の有無（任意）: `.github/workflows/` に CODEOWNERS lint job を追加するかを判断（完了条件: 採否を決定し記述。MVP 段階では「不要 / 手動 `gh api` で代替」を base case とする）。
7. `outputs/phase-09/main.md` に QA チェックリスト 6 項目の結果を集約する（完了条件: 1 ファイルに記述。pending 段階ではプレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-08.md | DRY 化結果（After CODEOWNERS） |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-08/main.md | 集約方針詳細 |
| 必須 | .github/CODEOWNERS | 検証対象 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典 AC（特に AC-2 / AC-4 / AC-6） |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-09.md | QA phase の構造参照 |
| 参考 | UT-GOV-001 ワークフロー（branch protection 草案） | `require_code_owner_reviews=false` 整合先 |
| 参考 | GitHub REST API: `GET /repos/{owner}/{repo}/codeowners/errors` | 構文検証の正本 |

## QA チェック観点 6 項目

> 各項目は「検証コマンド / 期待結果 / 失敗時対応」を必須記述とする。

### 観点 1: codeowners/errors = []

- **検証コマンド**:
  ```bash
  gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
  ```
- **期待結果**: `[]` （空配列）
- **失敗時対応**:
  - `kind: "Invalid pattern"` → glob 構文を `**` 表記で書き直す
  - `kind: "Unknown owner"` → 個人ハンドル `@daishiman` のスペル確認、team 採用時は GitHub 組織側で write 権限を付与
  - `kind: "Owners without write access"` → 当該 owner にリポジトリ write 権限を付与
  - errors が解消するまで Phase 10 GO/NO-GO は **NO-GO**

### 観点 2: doc/ 残存 0 件（ripgrep 全文棚卸し）

- **検証コマンド**:
  ```bash
  rg -n "(^|[^a-zA-Z])doc/" \
    -g '!node_modules' -g '!.git' -g '!*.lock' \
    -g '!docs/30-workflows/completed-tasks/**' \
    .
  ```
- **期待結果**: 該当出力 0 行、または「外部 URL / 過去 commit 引用」のみ。
- **失敗時対応**:
  - CODEOWNERS / CLAUDE.md / 仕様書本文 → `docs/` に置換
  - 外部 URL（GitHub Wiki 等の旧 URL） → allow リストに明記し残置
  - 過去 commit message / CHANGELOG → 改変禁止のため allow リストに明記

### 観点 3: global fallback 行の位置と数

- **検証コマンド**:
  ```bash
  awk 'NF && !/^#/ {print NR": "$0}' .github/CODEOWNERS | grep -E '^[0-9]+: \*[[:space:]]'
  ```
- **期待結果**:
  - `*` 行が **1 行のみ**
  - 行番号が **最も早い non-comment 行**（=冒頭の global fallback）
- **失敗時対応**:
  - `*` が末尾にある → governance 行を全て上書きしているので冒頭へ移動
  - `*` が複数行ある → 1 行に統合

### 観点 4: governance 重要 5 パスの被覆

- **検証コマンド**:
  ```bash
  for p in 'docs/30-workflows/' '.claude/skills/' '.github/workflows/' 'apps/api/' 'apps/web/'; do
    if grep -F "$p" .github/CODEOWNERS >/dev/null; then
      echo "OK  $p"
    else
      echo "NG  $p"
    fi
  done
  ```
- **期待結果**: 全 5 パスが OK
- **失敗時対応**:
  - 欠落パスを After CODEOWNERS に追記し、Phase 8 集約方針に従って配置

### 観点 5: UT-GOV-001 整合（require_code_owner_reviews=false の明文化）

- **検証コマンド**:
  ```bash
  rg -n 'require_code_owner_reviews' \
    docs/30-workflows/ \
    .claude/skills/aiworkflow-requirements/references/ 2>/dev/null
  ```
- **期待結果**:
  - UT-GOV-001（branch-protection-apply）仕様書または本タスク仕様書に **`require_code_owner_reviews: false`** が明文化
  - CODEOWNERS が「ownership 文書としてのみ機能」と明記
- **失敗時対応**:
  - UT-GOV-001 側に未記載なら本タスク仕様書（原典 §備考）の引用を追加し、UT-GOV-001 着手時に同期反映する unassigned-task として残す

### 観点 6: CI 連携（任意）

- **判断基準**:
  - MVP / solo 運用では `gh api` 手動実行で十分のため **CI job 追加は不要**（base case）
  - 将来 contributor 体制になったら `.github/workflows/codeowners-lint.yml` で `gh api .../codeowners/errors` を nightly / on PR で実行する
- **失敗時対応**:
  - CI 連携を追加する判断になった場合、UT-GOV-004（required-status-checks-context-sync）に context 名を同期登録するタスクを追加

## 対象外項目（明記）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積 (Workers / D1 / Sheets) | 対象外 | CODEOWNERS は GitHub 側設定。Cloudflare resource を消費しない |
| secret hygiene | 対象外 | secret 導入なし。`@daishiman` のハンドル名は public 情報 |
| a11y (WCAG 2.1) | 対象外 | UI なし |
| free-tier-estimation.md | 不要 | 上記 3 項目が対象外 |

## 検証コマンド（一括実行用）

```bash
# 1. codeowners/errors
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'

# 2. doc/ 残存
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!*.lock' \
  -g '!docs/30-workflows/completed-tasks/**' .

# 3. global fallback 位置
awk 'NF && !/^#/ {print NR": "$0}' .github/CODEOWNERS | grep -E '^[0-9]+: \*[[:space:]]'

# 4. 重要 5 パス被覆
for p in 'docs/30-workflows/' '.claude/skills/' '.github/workflows/' 'apps/api/' 'apps/web/'; do
  grep -F "$p" .github/CODEOWNERS >/dev/null && echo "OK  $p" || echo "NG  $p"
done

# 5. UT-GOV-001 整合
rg -n 'require_code_owner_reviews' docs/30-workflows/

# 6. 重複行検出
awk 'NF && !/^#/ {print $1}' .github/CODEOWNERS | sort | uniq -d
```

## QA チェックリスト（サマリー）

> 詳細は `outputs/phase-09/main.md`。本仕様書には観点のみ記載。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | codeowners/errors | `[]` | pending（実走で確認） |
| 2 | doc/ 残存 | 0 件 / allow リスト記録 | pending |
| 3 | global fallback 位置 | 冒頭 1 行 | pending |
| 4 | 重要 5 パス被覆 | 全 OK | pending |
| 5 | UT-GOV-001 整合 | `require_code_owner_reviews=false` 明文化 | pending |
| 6 | CI 連携 | 不要（base case） | pending |
| 7 | 重複行 | 0 | pending |

## 実行手順

### ステップ 1: gh api 実走
- `gh auth status` で認証確認後、`gh api .../codeowners/errors` を実行。

### ステップ 2: ripgrep 表記揺れ確認
- `doc/` 残存 0 を確認、allow リストを `outputs/phase-09/main.md` に記載。

### ステップ 3: 行順序検証
- awk + grep で `*` 位置確認。

### ステップ 4: 重要 5 パス被覆検証
- for loop で 5 件全 OK を確認。

### ステップ 5: UT-GOV-001 整合確認
- `require_code_owner_reviews=false` が UT-GOV-001 または本タスク仕様書に明記されているか rg で確認。

### ステップ 6: CI 連携採否確定
- MVP / solo では「不要」を base case として記録。

### ステップ 7: outputs/phase-09/main.md 集約
- 7 項目チェックリスト結果を 1 ファイルに集約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | QA 7 項目結果を 4 条件 / 11 AC 評価の客観根拠に使用 |
| Phase 11 | 仕様レビュー時に `gh api` 出力を再現確認 |
| Phase 12 | implementation-guide.md に検証コマンドを転記 |
| Phase 13 | PR description に QA サマリー転記 |
| UT-GOV-001 | `require_code_owner_reviews=false` 整合確認結果を共有 |
| UT-GOV-004 | CI 連携採否（不要）を共有し、required_status_checks へ context 追加なし |

## 多角的チェック観点

- 価値性: `codeowners/errors=[]` を実走確認することで silently skip 事故を未然防止。
- 実現性: GitHub REST API + ripgrep + grep のみで完結。追加依存ゼロ。
- 整合性: UT-GOV-001 の `require_code_owner_reviews=false` と矛盾しない / SSOT 宣言を維持 / 表記揺れ 0。
- 運用性: 検証コマンド 6 行を 1 スクリプトで再現可能。
- 認可境界: secret 導入なし、対象外明記。
- 無料枠: GitHub API 無料枠内で完結（codeowners/errors は read-only）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `gh api codeowners/errors` 実走 | 9 | pending | errors=[] |
| 2 | doc/ 残存 0 確認 | 9 | pending | allow リスト含む |
| 3 | global fallback 位置確認 | 9 | pending | 冒頭 1 行 |
| 4 | 重要 5 パス被覆確認 | 9 | pending | 5/5 OK |
| 5 | UT-GOV-001 整合確認 | 9 | pending | `require_code_owner_reviews=false` |
| 6 | CI 連携採否決定 | 9 | pending | base case 不要 |
| 7 | outputs/phase-09/main.md 集約 | 9 | pending | 7 項目チェック |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA チェック 7 項目結果 + allow リスト |
| ログ | outputs/phase-09/codeowners-errors.json | `gh api` 実走出力（pending では空） |

## 完了条件

- [ ] `gh api codeowners/errors` が `[]`
- [ ] `doc/` 残存 0 件、または allow リストに明記
- [ ] global fallback `*` が冒頭 1 行
- [ ] governance 重要 5 パスがすべて被覆
- [ ] UT-GOV-001 で `require_code_owner_reviews=false` が明文化されている
- [ ] CI 連携採否が決定（base case: 不要）
- [ ] 重複行 0
- [ ] outputs/phase-09/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `pending`
- 成果物が `outputs/phase-09/main.md` に配置予定
- 対象外 3 項目（無料枠 / secret / a11y）が明記
- 7 観点すべてに「検証コマンド / 期待結果 / 失敗時対応」が記述

## 苦戦防止メモ

- `gh api codeowners/errors` は CODEOWNERS が **デフォルトブランチに存在しない**と 404 を返す。実装 PR は dev ブランチで先に検証する場合、`?ref=<branch>` クエリを付ける（`gh api 'repos/daishiman/UBM-Hyogo/codeowners/errors?ref=<branch>'`）。
- `Owners without write access` エラーは team 採用時のみ発生。個人ハンドル `@daishiman` の場合は通常起きないが、ハンドル変更時にハマる。
- ripgrep の glob 除外順序を間違えると `node_modules` を舐めて時間が溶ける。`-g '!node_modules'` を最初に置く。

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 7 項目 QA 結果（pending プレースホルダ）
  - codeowners/errors 出力（実走時に保存）
  - UT-GOV-001 整合確認結果
  - CI 連携採否（base case: 不要）
- ブロック条件:
  - codeowners/errors が空でない
  - doc/ 残存が説明されないまま残っている
  - 重要 5 パスのいずれかが未被覆
  - UT-GOV-001 整合が未確認
