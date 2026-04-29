# Phase 2 成果物: 設計詳細

## 1. 設計サマリ

`.github/CODEOWNERS` を **ownership 文書** として再構築する。solo 運用前提（`require_code_owner_reviews=false`）を維持しつつ、最終マッチ勝ち仕様を踏まえ、global fallback を冒頭・governance 5 系列を末尾近傍に置く 6 行構成を採用する。`doc/` → `docs/` 表記揺れ棚卸しを CODEOWNERS 編集の **前** に行うことを設計上強制する。実装は Phase 5、検証実走は Phase 11。

## 2. 順序設計表（最終マッチ勝ち基準）

CODEOWNERS は最終マッチ勝ち（last-match-wins）。設計原則:

- global fallback `* @daishiman` を **冒頭** に置く（残余パスを必ず捕捉）。
- より一般的な glob を中段、**最重要 governance パスを最末尾** に置く（最末尾が最強優先度）。

### 配列順序（冒頭 → 末尾）

| # | エントリ | カテゴリ | 優先度 | 備考 |
| --- | --- | --- | --- | --- |
| 0 | ヘッダコメント | 説明 | - | solo 運用 / 文書化目的 / 最終マッチ勝ち / team 化時の権限要件 |
| 1 | `* @daishiman` | global fallback | 最低 | 冒頭固定。残余を捕捉 |
| 2 | `apps/api/** @daishiman` | API runtime | 中 | 不変条件 #5 で D1 直接アクセスが閉じる場所 |
| 3 | `apps/web/** @daishiman` | Web runtime | 中 | OpenNext.js (Cloudflare Workers) |
| 4 | `.github/workflows/** @daishiman` | CI / governance workflow | 中〜高 | UT-GOV-002 / UT-GOV-004 が依存 |
| 5 | `.claude/skills/**/references/** @daishiman` | 正本 references | 高 | 多段 `**` glob、Phase 11 で挙動確認 |
| 6 | `docs/30-workflows/** @daishiman` | タスク仕様書群 | 最高 | 最末尾 = 最優先 |

## 3. CODEOWNERS テキスト（仕様レベル、Phase 5 で実差分化）

```text
# Solo development project. Ownership documentation only.
# `require_code_owner_reviews` is intentionally NOT enabled in branch protection
# (no second reviewer in single-maintainer setup). This file exists for:
#   - GitHub UI suggested-reviewer hint
#   - Future contributor / governance audit ownership statement
#
# CODEOWNERS uses LAST-MATCH-WINS semantics.
# Place the global fallback at the TOP and more specific governance paths
# at the BOTTOM so they override the fallback.
#
# Future team-handle migration requires the team to have write access to
# this repository (otherwise the rule is silently skipped).

# Global fallback
*                                          @daishiman

# Application runtimes
apps/api/**                                @daishiman
apps/web/**                                @daishiman

# CI / governance workflows
.github/workflows/**                       @daishiman

# Skill canonical references
.claude/skills/**/references/**            @daishiman

# Task specifications (most important governance path; placed last)
docs/30-workflows/**                       @daishiman
```

## 4. `doc/` → `docs/` 棚卸しと置換対象暫定リスト

### 4.1 棚卸しコマンド（Phase 5 ステップ 0 必須前置）

```bash
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' \
   -g '!**/*.lock' -g '!pnpm-lock.yaml' \
   . > /tmp/ut-gov-003-doc-residue.txt
wc -l /tmp/ut-gov-003-doc-residue.txt
```

### 4.2 残置の分類基準

| 分類 | 例 | 対応 |
| --- | --- | --- |
| 誤記 | `doc/30-workflows/...`（旧表記） | `docs/30-workflows/...` へ置換 |
| 正規共存（不可避） | `docs/00-getting-started-manual/specs/...`（CLAUDE.md「主要ディレクトリ」表に正規記述） | **維持**。AC-9 の「外部リンク等の不可避ケース」として記録 |
| 外部リンク | URL 内の `/doc/` | 維持 |
| 自然言語 | 文中の `document` の一部マッチ等 | 偽陽性として除外 |

### 4.3 置換対象暫定リスト

| # | ファイル / glob | 推定残置 | 置換方針 |
| --- | --- | --- | --- |
| 1 | `.github/CODEOWNERS` | `doc/01a-*/` `doc/01b-*/` `doc/01c-*/` `.github/` 単純指定 | 全削除 → 順序設計表に従う 6 行へ刷新 |
| 2 | `CLAUDE.md` | `docs/00-getting-started-manual/`（正規） / `docs/30-workflows/`（正規） | 双方とも正規共存。誤記が混在する場合のみ修正 |
| 3 | `.claude/skills/**/references/**` | 内部リンクの `doc/30-workflows/` 等 | `docs/30-workflows/` へ置換 |
| 4 | `docs/30-workflows/**` 配下のリンク | 相対リンクの `../../doc/` 誤記 | `../../docs/` へ統一 |
| 5 | その他 README / ADR / PR template | 同上 | 同上 |

> **重要**: `docs/00-getting-started-manual/` と `docs/30-workflows/` は **両方とも正規ディレクトリ** として共存している。一律置換は禁止。

## 5. `gh api .../codeowners/errors` 検証

### 5.1 コマンド

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
# 期待出力: []
```

### 5.2 errors != [] の場合の対処マトリクス

| エラー種別 | 例 | 対処 |
| --- | --- | --- |
| Unknown owner | `Unknown owner @daishimann` | typo を訂正、`gh auth status` で認証確認 |
| Path does not exist | `Path .claude/skill/**/references/** does not match any files` | glob 修正（`skills/`、`**` 多段） |
| Invalid pattern | `Pattern apps/api// is invalid` | 末尾 `/` の重複を修正 |

### 5.3 ログ保存

- 実走ログを `outputs/phase-11/codeowners-errors.json` に保存（Phase 11 で実施）。

## 6. SubAgent lane 詳細

| lane | コマンド / 操作 | 検証 | 失敗時 |
| --- | --- | --- | --- |
| 1. doc 棚卸し | §4.1 `rg` コマンド | `wc -l` で件数記録 | `rg` が見つからない → ripgrep をインストール |
| 2. 置換 | §4.3 暫定リストに従い `sed` / Edit ツール | `git diff` レビュー | 正規 `docs/00-getting-started-manual/` を誤置換 → revert |
| 3. CODEOWNERS 編集 | §3 のテキストを `.github/CODEOWNERS` へ書き出し | `cat .github/CODEOWNERS` で目視 | 順序逸脱 → revert |
| 4. errors 検証 | §5.1 `gh api` | `.errors == []` | errors != [] → §5.2 対処マトリクス |

## 7. ロールバック手順

### 7.1 Case A: CODEOWNERS のみ revert（推奨）

```bash
git log --oneline -- .github/CODEOWNERS | head -5
git revert <UT-GOV-003 CODEOWNERS rewrite commit>
git push origin <branch>
```

### 7.2 Case B: doc/ → docs/ 置換も含めて revert

```bash
git revert <replacement commit> <CODEOWNERS rewrite commit>
git push origin <branch>
```

### 7.3 Case C: 緊急停止（CODEOWNERS を削除）

```bash
git rm .github/CODEOWNERS
git commit -m "revert(governance): remove CODEOWNERS to disable ownership routing"
git push origin <branch>
```

`require_code_owner_reviews=false` のため CODEOWNERS が壊れても PR は block されず、Case A で十分。Case C は team 化検討中など特殊事情のみ。

## 8. ファイル変更計画

| パス | 操作 | 担当 lane | リスク | 緩和策 |
| --- | --- | --- | --- | --- |
| `.github/CODEOWNERS` | 全面書き換え | 3 | 順序逸脱 | 順序設計表（§2）を Phase 5 PR レビューで突合 |
| `CLAUDE.md` | 棚卸しで誤記と判定した箇所のみ置換 | 2 | 正規 `doc/` の誤置換 | §4.2 分類基準を Phase 5 で適用 |
| `.claude/skills/**/references/**` | 同上 | 2 | 同上 | 同上 |
| `docs/30-workflows/**` 配下リンク | 同上 | 2 | 同上 | 同上 |
| `apps/api/**` / `apps/web/**` | 変更しない | - | 不変条件 #5 侵害 | 本タスクのスコープ外と明文化 |

## 9. 状態所有権（state ownership）

| state | owner | writer | reader | TTL |
| --- | --- | --- | --- | --- |
| `.github/CODEOWNERS` | UT-GOV-003 PR | lane 3 | GitHub / `gh` CLI | 永続 |
| `doc/` 表記（誤記）の置換差分 | UT-GOV-003 PR | lane 2 | 開発者 | 永続 |
| `gh api .../codeowners/errors` 結果 | GitHub server | GitHub | lane 4 / Phase 11 | リアルタイム |
| branch protection (`require_code_owner_reviews`) | **UT-GOV-001 PR**（本タスクは書かない） | UT-GOV-001 | GitHub | 永続 |

## 10. 検証チェックリスト（Phase 5 / 11 用）

- [ ] `rg` で `doc/` 残置を全件分類済（誤記 vs 正規）
- [ ] CODEOWNERS テキストが §3 の構造と一致
- [ ] 6 行構成（global fallback 冒頭、`docs/30-workflows/**` 末尾）
- [ ] `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の出力が `errors: []`
- [ ] branch protection 設定で `require_code_owner_reviews=false` が維持されている（UT-GOV-001 と整合）
- [ ] ロールバック手順（Case A）が 1 コミット粒度で実行可能

## 11. 次 Phase への引き渡し

- base case 設計（順序設計表 + 6 行構成 + 棚卸し → 置換 → 編集 → errors 検証）を Phase 3 へ。
- 代替案 4 案（A〜D）の比較入力を Phase 3 §代替案比較で扱う。
- NO-GO 条件候補: `doc/` 棚卸し未実施 / `errors: []` 未検証 / 順序設計表逸脱 / 正規 `docs/00-getting-started-manual/` 誤置換。
