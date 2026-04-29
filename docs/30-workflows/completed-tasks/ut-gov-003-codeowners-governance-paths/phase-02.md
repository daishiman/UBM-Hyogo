# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (ut-gov-003-codeowners-governance-paths) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-29 |
| Wave | 0（governance） |
| 実行種別 | serial |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |

## 目的

Phase 1 で確定した「target paths 5 系列」「AC-1〜AC-10」「solo 運用 + `require_code_owner_reviews=false`」を入力に、`.github/CODEOWNERS` の **最終マッチ勝ち順序設計**・**`doc/` → `docs/` 棚卸し / 置換対象暫定リスト**・**`gh api .../codeowners/errors` 検証ステップ**・**ロールバック手順** を仕様レベルで確定する。Phase 3 の代替案比較が PASS / MINOR / MAJOR で結論を出せる粒度の設計入力を提供する。本 Phase の成果は仕様レベルであり、実 CODEOWNERS 差分・実置換・実検証は Phase 5 以降の実装ランブックに委ねる。

## 実行タスク

1. CODEOWNERS の最終マッチ勝ち仕様に基づき、global fallback を冒頭、具体 governance path を後段に置く順序設計表を確定する。
2. `doc/` / `docs/` の棚卸しコマンドと正規共存の扱いを Phase 5 へ引き渡す。
3. `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の検証手順と期待値 `errors: []` を固定する。
4. branch protection は読み取り境界に閉じ、`require_code_owner_reviews=false` を維持する設計を明文化する。
5. ロールバック手順と SubAgent lane の責務境界を定義する。

## 真の論点 (true issue)

- 「最終マッチ勝ち」を踏まえ、**global fallback を冒頭に置き、governance パスを末尾近傍に置く**順序を確定する。
- **`doc/` → `docs/` 棚卸しを CODEOWNERS 編集より先**に行うことを Phase 2 で予約する（順序事故防止）。

## 真の論点（重複明記 1/2）

> **CODEOWNERS の編集前に `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` での `doc/` 残置棚卸しを完了させ、置換対象が確定していなければ Phase 5 着手を許可しない。** これは AC-9 と最終マッチ勝ち順序設計の前提条件である。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | Phase 1 | target paths 5 系列・AC-1〜AC-10・既存 CODEOWNERS 差分方針 | Phase 3 の base case 構造として案 D（個人ハンドル全パス具体的指定） |
| 並列 | UT-GOV-001 / UT-GOV-002 / UT-GOV-004 / UT-GOV-005 | 各タスクの governance パス整備状況 | 各タスクの対象パスが本タスクの 5 系列に包含されることを確認 |
| 下流 | Phase 5 (実装ランブック) | 順序設計 / 棚卸しコマンド / 置換対象暫定リスト / 検証コマンド / ロールバック手順 | 実 PR で適用 |
| 下流 | Phase 11 (smoke) | `gh api .../codeowners/errors` 実走 | `errors: []` を AC-8 の実証として保存 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-01.md | 真の論点・target paths・AC・4 条件 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-01/main.md | 既存 CODEOWNERS 差分方針 / 課題マトリクス |
| 必須 | .github/CODEOWNERS（現状） | 旧表記の差分起点 |
| 必須 | CLAUDE.md | 主要ディレクトリ表（`docs/00-getting-started-manual/` と `docs/30-workflows/` の混在実例） |
| 参考 | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners | 最終マッチ勝ち / glob 仕様 |
| 参考 | https://docs.github.com/en/rest/repos/repos#list-codeowners-errors | errors API |

## 順序設計（最終マッチ勝ち）

CODEOWNERS は「**ファイル末尾から先頭へ向かって最初にマッチする行が勝つ**」（= 最終マッチ勝ち）。したがって設計原則は次のとおり:

1. **global fallback `* @daishiman` を最冒頭** に 1 行配置（残余パス全部を捕まえる）。
2. **より一般的な glob を中段** に配置（例: `.github/` 全体）。
3. **より具体的・governance 重要な glob を末尾近傍** に配置（具体パスが汎用パターンを上書きする）。
4. **最末尾は最重要 governance パス**（`docs/30-workflows/**` / `.claude/skills/**/references/**` 等）を置き、後段の追記で意図せず上書きされない位置に保つ。

### 順序設計表（冒頭 → 末尾）

| # | エントリ | 役割 | 備考 |
| --- | --- | --- | --- |
| H | ヘッダコメント | solo 運用 / 文書化目的 / 最終マッチ勝ち注意 / team 化時の権限要件 | 5 行程度 |
| 1 | `* @daishiman` | global fallback（冒頭） | 残余を捕捉。後段で具体パスが上書き |
| 2 | `apps/api/** @daishiman` | API runtime | より具体パスを後段へ |
| 3 | `apps/web/** @daishiman` | Web runtime | 同上 |
| 4 | `.github/workflows/** @daishiman` | CI / governance workflow | governance パス |
| 5 | `.claude/skills/**/references/** @daishiman` | 正本 references | 多段 `**` glob のため Phase 11 で挙動確認 |
| 6 | `docs/30-workflows/** @daishiman` | タスク仕様書群（最末尾 = 最優先） | 最重要 governance |

> 上記 6 行構成は Phase 3 §代替案比較の案 A（base case = 全パス具体的指定 + global fallback）に相当。

### CODEOWNERS 構造（仕様レベルテキスト、Phase 5 で実差分化）

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

## `doc/` → `docs/` 棚卸し設計

### 棚卸しコマンド

```bash
# Phase 5 ステップ 0（CODEOWNERS 編集前）の必須前置
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' \
   -g '!**/*.lock' -g '!pnpm-lock.yaml' \
   /Users/dm/dev/dev/個人開発/UBM-Hyogo > /tmp/ut-gov-003-doc-residue.txt
wc -l /tmp/ut-gov-003-doc-residue.txt
```

### 置換対象ファイルの暫定リスト（Phase 5 で確定する候補）

| ファイル | 推定残置箇所 | 置換方針 |
| --- | --- | --- |
| `.github/CODEOWNERS` | `doc/01a-*/` `doc/01b-*/` `doc/01c-*/` | **削除して `docs/30-workflows/**` 単一 glob へ統合** |
| `CLAUDE.md` | 「主要ディレクトリ」表に `docs/00-getting-started-manual/` を `doc/` で書いている可能性 | 実際の正本パス（`docs/00-getting-started-manual/` がそのまま正、`docs/30-workflows/` も別系統で正）を確認した上で、誤記のみ `docs/` に統一。**正規パスとして `docs/00-getting-started-manual/` を運用しているなら維持する**（外部リンク等の不可避ケースとして AC-9 に記録） |
| `.claude/skills/**/references/**` | 旧 `doc/30-workflows/` 表記の参照リンク | `docs/30-workflows/` へ置換 |
| `docs/30-workflows/**` 配下のリンク | 内部相対リンクで `../../doc/...` 形式の誤記 | `../../docs/...` へ統一 |
| その他 README / ADR | 同上 | 同上 |

> **重要**: リポジトリには `docs/00-getting-started-manual/`（正規 / 単数形ディレクトリ）と `docs/30-workflows/`（正規 / 複数形ディレクトリ）が **両方正として** 共存している可能性がある（CLAUDE.md 「主要ディレクトリ」表で `docs/00-getting-started-manual/` が正規記述）。Phase 5 の棚卸し結果に基づき、「`doc/` を一律 `docs/` に変えてはいけない」ことを `outputs/phase-02/main.md` に明示する。AC-9 の「外部リンク等の不可避ケース」にはこの 2 ディレクトリの正規共存を含める。

### 棚卸し → 置換 → CODEOWNERS 編集 の順序

```mermaid
flowchart TD
  Start["Phase 5 着手"] --> Inv["Step 0: rg で doc/ 残置棚卸し"]
  Inv --> Classify["Step 0.5: 残置分類\n(誤記 vs 正規 docs/00-getting-started-manual/)"]
  Classify --> Replace["Step 1: 誤記を docs/ に置換"]
  Replace --> Edit["Step 2: .github/CODEOWNERS 編集\n(順序設計表に従う)"]
  Edit --> Verify["Step 3: gh api .../codeowners/errors\nerrors: [] 確認"]
  Verify --> Done["AC-1〜AC-10 充足"]
  Verify -.->|errors != []| Rollback["ロールバック: git revert"]
  Edit -.->|失敗時| Rollback
```

## `gh api .../codeowners/errors` 検証ステップ

### コマンド

```bash
# Phase 5 / 11 で実走
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
# 期待出力: []
```

### 検証チェックリスト

- [ ] `errors` 配列が空である（`[]`）
- [ ] 出力に `Unknown owner` / `Path does not exist` / `Invalid pattern` が含まれない
- [ ] 出力ログを `outputs/phase-11/codeowners-errors.json` に保存（Phase 11 実走時）

### errors != [] の場合の対処

| エラー種別 | 対処 |
| --- | --- |
| Unknown owner @daishiman | GitHub 認証 / アカウント存在確認。`gh auth status` |
| Path does not exist | 該当 glob を Phase 1 の target paths と照合し、glob 表記を修正 |
| Invalid pattern | `**` の多段使用 / `/` 末尾 を修正 |

## SubAgent lane 設計

| lane | 役割 | 入力 | 出力 / 副作用 | 成果物 |
| --- | --- | --- | --- | --- |
| 1. doc 棚卸し | `rg` で `doc/` 残置を全文棚卸し | 棚卸しコマンド | `outputs/phase-02/main.md` の置換対象暫定リスト | doc-residue.txt |
| 2. 置換 | 誤記 `doc/` を `docs/` に置換（正規 `docs/00-getting-started-manual/` は維持） | lane 1 結果 | replacement-commit.diff | `chore(docs): unify doc/ to docs/ where applicable` |
| 3. CODEOWNERS 編集 | 順序設計表に従い `.github/CODEOWNERS` を再構築 | lane 2 完了、Phase 2 順序設計表 | `chore(governance): rewrite CODEOWNERS for governance paths` | codeowners.diff |
| 4. errors 検証 | `gh api .../codeowners/errors` 実走 | lane 3 完了 | `outputs/phase-11/codeowners-errors.json`（NOT EXECUTED in Phase 2） | errors.json |

## ファイル変更計画

| パス | 操作 | 編集者 | 注意 |
| --- | --- | --- | --- |
| `.github/CODEOWNERS` | 全面書き換え | lane 3 | 旧 `doc/01a-*/` 等を削除、5 系列を新規追加、ヘッダコメント刷新 |
| `CLAUDE.md` | 誤記 `doc/` → `docs/` 置換、正規 `docs/00-getting-started-manual/` は維持 | lane 2 | 正規 `docs/00-getting-started-manual/` は維持 |
| `.claude/skills/**/references/**` | 同上 | lane 2 | 内部リンクのみ |
| `docs/30-workflows/**` 配下リンク | 同上 | lane 2 | 相対リンクの誤記 |
| その他 | 棚卸し結果で誤記と判定した箇所のみ置換 | lane 2 | 不可避ケースは AC-9 に記録 |
| `apps/api/**` / `apps/web/**` | 変更しない | - | 不変条件 #5 を侵害しない |

## 環境変数 / Secret

本タスクは Secret / 環境変数を導入・参照しない。`gh` CLI は既存の `gh auth` 認証を使用する。

## state ownership 表

| state | 物理位置 | owner | writer | reader | TTL / lifecycle |
| --- | --- | --- | --- | --- | --- |
| `.github/CODEOWNERS` | repository root | lane 3 | 本タスクの PR | GitHub / `gh` CLI / 全 contributor | 永続。team 化時に再編集 |
| `doc/` → `docs/` 表記 | リポジトリ全体 | lane 2 | 本タスクの PR | 開発者 / Claude Code | 永続。`docs/00-getting-started-manual/` 系列は正規共存 |
| `gh api .../codeowners/errors` 結果 | GitHub server side | GitHub | GitHub（自動算出） | lane 4 / Phase 11 | リアルタイム |
| branch protection 設定 | GitHub server side | UT-GOV-001 | UT-GOV-001 PR | GitHub | 永続。`require_code_owner_reviews=false` を維持 |

> **重要**: 本タスクは branch protection 設定を **書かない**。`require_code_owner_reviews=false` を **読み取り側として前提化** するのみ。書き換えは UT-GOV-001 のスコープ。

## ロールバック設計

```bash
# Case A: CODEOWNERS のみ revert（推奨）
git revert <CODEOWNERS rewrite commit>
# Case B: doc/ → docs/ 置換も含めて revert
git revert <replacement commit> <CODEOWNERS rewrite commit>
# Case C: 緊急停止（CODEOWNERS を削除）
git rm .github/CODEOWNERS
git commit -m "revert(governance): remove CODEOWNERS to disable ownership routing"
```

ロールバックは 1 コミット粒度（Case A）で完結する。`require_code_owner_reviews=false` のため CODEOWNERS が壊れても PR は block されず、緊急性は低い。

## 真の論点（重複明記 2/2）

> **CODEOWNERS の最終マッチ勝ち順序設計（global fallback 冒頭、governance パス末尾近傍）と、`doc/` → `docs/` 棚卸し → 置換 → 編集 → errors=[] 検証 の順序を Phase 5 で厳守させる。** どちらか片方でも順序が崩れると、AC-7 / AC-8 / AC-9 のいずれかが充足できない。

## 実行手順

### ステップ 1: 棚卸しコマンドの仕様化

- `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` を Phase 5 ステップ 0 として固定。
- 棚卸し結果の分類（誤記 / 正規 `docs/00-getting-started-manual/`）の判定基準を本仕様に記述。

### ステップ 2: 順序設計表の確定

- 6 行構成（fallback → apps/api → apps/web → workflows → skills/references → docs/30-workflows）を `outputs/phase-02/main.md` に固定。

### ステップ 3: 置換対象暫定リストの確定

- `.github/CODEOWNERS` / `CLAUDE.md` / `.claude/skills/**/references/**` / `docs/30-workflows/**` 配下リンク / その他 を暫定リスト化（実残置は Phase 5 で確定）。

### ステップ 4: errors 検証ステップの仕様化

- `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` を Phase 5 / 11 のステップとして固定。

### ステップ 5: ロールバック手順の固定

- Case A（CODEOWNERS のみ revert）を推奨手順として明記。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計の代替案比較（案 A〜D）の入力 |
| Phase 4 | lane 1〜4 ごとのテスト計画ベースライン |
| Phase 5 | 実装ランブックの擬似コード起点（順序設計表 / 棚卸しコマンド / errors 検証） |
| Phase 6 | 異常系（順序ミス / 棚卸し漏れ / errors != [] / 正規 `doc/` 誤置換） |
| Phase 11 | `gh api .../codeowners/errors` の実走 |

## 多角的チェック観点

- 最終マッチ勝ち順序が順序設計表で正しく表現されているか。
- `docs/00-getting-started-manual/`（正規）を誤って `docs/` に置換しない仕組みが lane 2 に組み込まれているか。
- 不変条件 #5（D1 直接アクセスは apps/api 内部に閉じる）を侵害していないか（本タスクは CODEOWNERS と doc 表記の整理のみ）。
- ロールバックが 1 コミット粒度で完結するか。
- branch protection 設定を書かないこと（読み取り前提化のみ）が state ownership 表で明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 順序設計表（6 行）の確定 | 2 | completed | base case 構造 |
| 2 | 棚卸しコマンドの仕様化 | 2 | completed | rg コマンド |
| 3 | 置換対象暫定リスト | 2 | completed | 5 カテゴリ |
| 4 | errors 検証ステップの仕様化 | 2 | completed | gh api コマンド |
| 5 | ロールバック手順 (Case A/B/C) | 2 | completed | Case A 推奨 |
| 6 | state ownership 表（branch protection 不書き境界） | 2 | completed | 4 state |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/main.md | 順序設計表 / 棚卸しコマンド / 置換対象暫定リスト / errors 検証 / ロールバック手順 |

## 完了条件

- [x] 順序設計表が 6 行で確定し、global fallback が冒頭・governance パスが末尾近傍に配置されている
- [x] 棚卸しコマンドが Phase 5 ステップ 0 として固定されている
- [x] 置換対象暫定リストが 5 カテゴリで列挙されている
- [x] `gh api .../codeowners/errors` が Phase 5 / 11 で実走される設計となっている
- [x] ロールバック手順が 1 コミット粒度（Case A）で記述されている
- [x] `docs/00-getting-started-manual/`（正規）を誤置換しない方針が明示されている
- [x] 真の論点が重複明記されている（2/2）

## タスク100%実行確認【必須】

- 全実行タスク（5 ステップ）が `completed`
- 全成果物が `outputs/phase-02/` 配下に配置済み
- 異常系（順序ミス / 棚卸し漏れ / errors != [] / 正規 `doc/` 誤置換）の対応 lane が設計に含まれる
- Phase 2 の状態が `completed`

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - base case = 案 A（全パス具体的指定 + global fallback、6 行構成）
  - 代替案候補: 案 B（global fallback のみ）/ 案 C（team handle 採用）/ 案 D（個人ハンドル維持 = base case を案 D とする再分類も Phase 3 で検討可）
  - NO-GO 条件候補: `doc/` 棚卸し未実施 / `errors: []` 未検証 / 順序設計表逸脱
- ブロック条件:
  - 順序設計表に逸脱がある
  - 棚卸しコマンドが仕様化されていない
  - errors 検証ステップが仕様化されていない
  - ロールバックが 2 コミット以上を要求している
