# Phase 1 成果物: 要件定義詳細

## 1. 背景

### 1.1 リポジトリの現状

- UBM 兵庫支部会のメンバーサイトは solo 開発体制（メンテナーは @daishiman 一人）。
- CLAUDE.md のブランチ戦略にて「solo 運用ポリシー: 個人開発のため必須レビュアー数は 0（GitHub branch protection の `required_pull_request_reviews` は `null`）」と明記されている。
- 既に `.github/CODEOWNERS` は存在するが、対象パスが旧 `doc/01a-*/` 等の表記で書かれており、現行の正本パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）が ownership 文書として表明できていない。

### 1.2 親タスクと位置づけ

- 親: `task-github-governance-branch-protection`。branch protection 適用と並行する governance 整備の一環。
- 親タスク側で `require_code_owner_reviews` を **意図的に有効化しない** 方針が確定済（solo 運用のため第二レビュアーが不在）。
- 本タスクは「ownership の文書化」に範囲を限定し、CODEOWNERS は GitHub UI の suggested reviewer 表示・将来 contributor / 監査向けの責任分担表明・領域責務の明文化を担う。

### 1.3 表記揺れ問題

- リポジトリ全体で `doc/` と `docs/` の表記が混在しており、旧 `doc/` 表記のままで CODEOWNERS の glob を書くと、現行 `docs/` 配下のパスにマッチしない。
- 既存 `.github/CODEOWNERS` がまさにその罠に落ちている（`doc/01a-*/` で書かれており、現在の `docs/30-workflows/01a-parallel-github-and-branch-governance/` 配下にはマッチしない可能性が高い）。

## 2. 課題と論点

### 2.1 真の論点（Phase 1 確定）

> **solo 運用のため必須レビュアー化はせず、しかし最終マッチ勝ち仕様を踏まえた順序で governance パスの owner を ownership 文書として正しく表明できるか。**

これに付随して、

1. `doc/` → `docs/` 表記揺れの全文棚卸しを **CODEOWNERS を書く前に** 完了させる。
2. global fallback `* @daishiman` の配置順序を、最終マッチ勝ち仕様に基づき正しく設計する（具体パスを後段、汎用パターンを冒頭）。
3. 構文エラー / 存在しない user の silently 無視を、`gh api .../codeowners/errors` の `errors: []` で能動的に検出する。
4. team handle ではなく個人ハンドル `@daishiman` に寄せる（solo 運用フェーズでは team の repo 権限事前付与コストが過剰）。

### 2.2 課題マトリクス

| # | 課題 | 影響 | 対応 |
| --- | --- | --- | --- |
| C-1 | `.github/CODEOWNERS` が旧 `doc/` 表記で書かれており、現行 governance パスを覆っていない | 監査時の owner 表明欠落 / GitHub UI suggested reviewer 不機能 | 本タスクで `docs/30-workflows/**` 等へ刷新 |
| C-2 | `doc/` / `docs/` 混在 | 表記揺れに起因する将来の glob ミス再発 | Phase 2 で全文棚卸しコマンドを実行、Phase 5 で実置換 |
| C-3 | 最終マッチ勝ち仕様の認識不足 | global fallback `* @daishiman` を末尾に置くと governance パス指定を上書き | Phase 2 で順序設計を確定（fallback 冒頭、具体パスを末尾近傍） |
| C-4 | 構文 / 存在しない user / team の silent 無視 | エラーが UI 警告のみ。PR 作成時には silent skip | AC-8: `gh api .../codeowners/errors` の `errors: []` を gate 化 |
| C-5 | team handle の write 権限要件 | 権限不足だと CODEOWNERS が silently skip | 本タスクは個人ハンドル `@daishiman` に寄せ、team 化は別タスクで再起票 |
| C-6 | 将来 `require_code_owner_reviews` を有効化する際の事故 | CODEOWNERS 不備のまま有効化すると全 PR block | 本タスクで errors=[] を担保し、有効化判断時の前提を整える |

## 3. target paths（5 系列）

| 系列 | パス glob | 役割 | owner |
| --- | --- | --- | --- |
| docs governance | `docs/30-workflows/**` | タスク仕様書群 / Phase 成果物 | `@daishiman` |
| skill canonical | `.claude/skills/**/references/**` | 正本仕様 references | `@daishiman` |
| CI / governance workflow | `.github/workflows/**` | governance workflow / required status check | `@daishiman` |
| API runtime | `apps/api/**` | Cloudflare Workers (Hono) | `@daishiman` |
| Web runtime | `apps/web/**` | Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) | `@daishiman` |

> 上記 5 系列以外（`packages/**` / `scripts/**` / `infra/**` / `docs/00-getting-started-manual/**` 等）は global fallback `* @daishiman` で覆う。

## 4. 受入条件 (AC-1〜AC-10)

| AC | 内容 | 検証手段 |
| --- | --- | --- |
| AC-1 | `.github/CODEOWNERS` が repository 直下の `.github/` に存在する | `ls .github/CODEOWNERS` |
| AC-2 | `docs/30-workflows/**` に owner（`@daishiman`）が明示 | CODEOWNERS 内 grep |
| AC-3 | `.claude/skills/**/references/**` に owner が明示 | 同上 |
| AC-4 | `.github/workflows/**` に owner が明示 | 同上 |
| AC-5 | `apps/api/**` に owner が明示 | 同上 |
| AC-6 | `apps/web/**` に owner が明示 | 同上 |
| AC-7 | global fallback `* @daishiman` が冒頭に 1 行配置され、governance パスは末尾近傍に配置（最終マッチ勝ちで具体的パスが勝つ順序） | CODEOWNERS の構造目視 + Phase 2 の順序設計表 |
| AC-8 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の出力で `errors: []` | 実行ログ |
| AC-9 | `doc/` 表記が `docs/` へ統一されている、または残置箇所が外部リンク等の不可避ケースに限定され明示記録 | `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` で残置一覧 |
| AC-10 | branch protection 設定で `require_code_owner_reviews=false` が維持されており、CODEOWNERS は ownership 文書として機能する旨が本仕様書および branch protection 草案で明記 | CLAUDE.md / UT-GOV-001 草案との整合確認 |

## 5. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | governance 5 系列に owner が文書化され、suggested reviewer / 監査説明 / 表記揺れ是正が同時達成 |
| 実現性 | PASS | `.github/CODEOWNERS` 編集 + `gh api .../codeowners/errors` のみ。既存技術範囲 |
| 整合性 | PASS | CLAUDE.md の solo 運用ポリシー（`required_pull_request_reviews=null`）と整合。不変条件 #5 を侵害しない |
| 運用性 | PASS | `git revert` 1 コミット粒度。`require_code_owner_reviews=false` のため CODEOWNERS が壊れても PR は block されず運用詰みに至らない |

## 6. スコープ境界

### 6.1 含む

- target paths 5 系列の確定
- AC-1〜AC-10 の確定
- `require_code_owner_reviews=false` 方針の Phase 1 固定
- 棚卸しコマンド / 検証コマンド / ロールバック方針の仕様化
- Phase 1〜13 のタスク仕様書整備全体（本ワークフロー）
- Phase 1〜3 の成果物本体作成

### 6.2 含まない

- `.github/CODEOWNERS` の実差分適用（Phase 5）
- `doc/` → `docs/` の実置換コミット（Phase 5）
- `gh api .../codeowners/errors` の実走（Phase 5 / 11）
- branch protection 本適用（UT-GOV-001）
- team handle 新設（GitHub 組織側の運用）
- 既存タスク仕様書本文のレビュー / 内容修正
- `apps/api` / `apps/web` のソースコード改変

## 7. 既存 `.github/CODEOWNERS` 差分方針（Phase 2 への入力）

現行ファイル（要約）:

```
# Global fallback
*                   @daishiman

# Infrastructure docs
doc/01a-*/          @daishiman
doc/01b-*/          @daishiman
doc/01c-*/          @daishiman

# GitHub governance files
.github/            @daishiman
```

差分方針:

1. global fallback `* @daishiman` は **冒頭に維持**（最終マッチ勝ちで具体パスが後段で勝つため）。
2. 旧 `doc/01a-*/` 等の表記揺れエントリは削除し、`docs/30-workflows/**` の単一 glob で置き換え。
3. `.github/` の単純指定を `.github/workflows/**` の具体 glob に強化（governance workflow を明示）。
4. `apps/api/**` / `apps/web/**` / `.claude/skills/**/references/**` を新規追加。
5. ヘッダコメントに「solo 運用のため `require_code_owner_reviews` は有効化しない」「ownership 文書として保持」「最終マッチ勝ち仕様」「将来 team 化時の権限要件」を追記。

具体配列順序（冒頭→末尾の優先順位）の最終確定は Phase 2 §順序設計に委ねる。

## 8. リスクと対策

| リスク | 対策 | 担当 Phase |
| --- | --- | --- |
| 順序ミスで global fallback が governance を上書き | Phase 2 で順序設計表を作成 | 2 |
| `doc/` 残置で glob 不一致 | 棚卸し → 置換 → CODEOWNERS 編集 の順を厳守 | 2 / 5 |
| 構文 / 存在しない user の silent 無視 | `gh api .../codeowners/errors` の `errors: []` を gate 化 | 5 / 11 |
| 将来 team 化時の権限不足 | 個人ハンドルに寄せ、team 化は別タスクで再起票 | 12 (unassigned) |
| 将来 `require_code_owner_reviews` 有効化で全 PR block | 有効化判断時に CODEOWNERS errors=[] を前提条件として明記 | 12 |

## 9. 次 Phase への引き渡し

- 真の論点・target paths 5 系列・AC-1〜AC-10・既存 CODEOWNERS 差分方針 をすべて Phase 2 §順序設計 / §棚卸しステップ / §ロールバック設計に渡す。
- 棚卸しコマンドおよび検証コマンドは Phase 2 で実行手順に組み込み、実走は Phase 5 / 11。
