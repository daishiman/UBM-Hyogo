# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (ut-gov-003-codeowners-governance-paths) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 0（governance） |
| 実行種別 | serial（単独 PR で適用、UT-GOV-001 と独立） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / scope: infrastructure_governance |
| 親タスク | task-github-governance-branch-protection |
| 原典スペック | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md |
| 関連 Issue | GitHub Issue #146 |

## 目的

UBM 兵庫支部会リポジトリは solo 運用（メンテナーは @daishiman 一人）であり、`require_code_owner_reviews` は **意図的に有効化しない**。一方で「どのパスを誰が責任所有しているか」の owner 表明は、将来の外部 contributor 受入・監査・GitHub UI の suggested reviewer 表示の各観点で価値が残る。本 Phase では `.github/CODEOWNERS` を **ownership 文書** として整備するための要件（target paths / AC-1〜AC-10 / `doc/` → `docs/` 表記揺れ棚卸し / `gh api .../codeowners/errors` による検証 / ロールバック方針）を確定する。実 CODEOWNERS の最終差分・棚卸し置換は Phase 2 設計と Phase 5 以降の実装ランブックで扱い、Phase 1 はあくまで仕様確定に閉じる。

## 真の論点 (true issue)

- 「CODEOWNERS に何行書くか」ではなく、「**solo 運用のため必須レビュアー化はせず、しかし最終マッチ勝ち仕様を踏まえた順序で governance パスの owner を ownership 文書として正しく表明できるか**」が本タスクの核心。
- 副次論点として:
  1. `doc/` と `docs/` の表記揺れが残ったまま CODEOWNERS を書くと、片側の glob にしかマッチせず governance パスの一部が owner 不在になる事故が発生する。
  2. CODEOWNERS は **最終マッチ勝ち** であり、global fallback `* @daishiman` を末尾に置くと governance パス指定が全部上書きされる。順序設計を Phase 2 で確定する必要がある。
  3. 構文エラー・存在しない user/team は GitHub UI 上で警告のみ（silently 無視）。`gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の `errors: []` を検証ステップとして仕様化する。
  4. 既存 `.github/CODEOWNERS` は `doc/01a-*/` 等の旧表記で書かれており、`docs/30-workflows/**` / `.claude/skills/**/references/**` / `apps/api/**` / `apps/web/**` の governance パスを ownership 文書として表明できていない。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | task-github-governance-branch-protection | branch protection 草案で `require_code_owner_reviews=false`（solo 運用方針）が確定済 | 本タスク AC-9 として「solo 運用のため必須レビュアー化しない」を明文化 |
| 上流（参考） | UT-GOV-001-github-branch-protection-apply | branch protection 本適用と CODEOWNERS の運用境界整理 | CODEOWNERS は ownership 文書として独立で先行可能（適用順序制約なし） |
| 並列 | UT-GOV-002-pr-target-safety-gate-dry-run | governance workflow パスの整備 | `.github/workflows/**` を CODEOWNERS の対象パスに含める |
| 並列 | UT-GOV-004-required-status-checks-context-sync | required status check の対象 workflow を `.github/workflows/**` 配下で管理 | 同上 |
| 並列 | UT-GOV-005-docs-only-nonvisual-template-skill-sync | `docs/30-workflows/**` の skill / template 同期 | `docs/30-workflows/**` を CODEOWNERS の対象パスに含める |
| 下流 | 将来の team handle 移行タスク（未起票） | 本タスクで個人ハンドルに寄せた運用が定着 | team が当該 repo に write 以上の権限を持つ確認手順を引き渡す |

## 価値とコスト

- 価値: governance 重要パス（タスク仕様書 / 正本 skill references / governance workflow / api / web）に対し ownership 表明が文書化され、(1) GitHub UI の suggested reviewer 表示が機能する、(2) 監査時の責任分担説明が即座にできる、(3) `doc/` → `docs/` 表記揺れも同時に解消される。
- コスト: `.github/CODEOWNERS` の更新差分（数行）+ `doc/` 残置箇所の `docs/` 置換（CLAUDE.md / skill references / docs 配下リンク等）+ `gh api .../codeowners/errors` 1 回検証。実装コストは小だが、CODEOWNERS の最終マッチ勝ち順序を誤ると governance パス指定が global fallback に上書きされる事故になるため、Phase 2 の順序設計が肝。
- 機会コスト: team handle 採用は GitHub 組織側の事前権限設定が必要で、solo 運用フェーズでは過剰投資。本タスクは個人ハンドル `@daishiman` に寄せ、将来 team 化する際は別タスクとして再起票する。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | governance パス 5 系列に owner が文書化され、GitHub UI suggested reviewer / 監査時の責任分担表明 / `doc/` 表記揺れの是正 が同時に達成される |
| 実現性 | PASS | `.github/CODEOWNERS` の編集と `gh api .../codeowners/errors` 検証は既存の GitHub / `gh` CLI 範囲。`scripts/cf.sh` 経由は不要（GitHub 認証は `gh auth` 既定） |
| 整合性 | PASS | 不変条件 #5（D1 直接アクセスは apps/api に閉じる）を侵害しない。CLAUDE.md のブランチ戦略・solo 運用ポリシー（`required_pull_request_reviews=null`）と整合する形で `require_code_owner_reviews` 不有効化を Phase 1 で固定 |
| 運用性 | PASS | ロールバックは「該当コミットの `git revert`」または「CODEOWNERS ファイル削除コミット」で 1 コミット粒度。`require_code_owner_reviews` を有効化していないため、CODEOWNERS が壊れても PR は block されず、運用詰みに至らない |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| ファイル配置 | `.github/CODEOWNERS` | リポジトリ直下の `.github/` 配下（`/CODEOWNERS` または `docs/CODEOWNERS` ではない） |
| owner ハンドル | `@daishiman` | 個人ハンドル。team handle (`@org/team`) は本タスクでは採用しない |
| パス glob | `docs/30-workflows/**` 形式 | gitignore 風だが GitHub 独自仕様。`**` は再帰、ディレクトリ末尾 `/` の有無で挙動が変わる |
| 順序 | 最終マッチ勝ち | global fallback `* @daishiman` を **末尾ではなく先頭** に置き、governance パスを後段に配置（より具体的なパスが後段で勝つ） |
| 既存 CODEOWNERS | `.github/CODEOWNERS`（現状） | 旧表記 `doc/01a-*/` 等が残存。本タスクで `docs/` ベースへ刷新 |
| 検証コマンド | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` | `errors: []` を成功条件とする |

## 受入条件 (Acceptance Criteria)

| AC | 内容 |
| --- | --- |
| AC-1 | `.github/CODEOWNERS` が repository 直下の `.github/` に存在する（無ければ新設、あれば更新） |
| AC-2 | `docs/30-workflows/**` に owner（`@daishiman`）が明示されている |
| AC-3 | `.claude/skills/**/references/**` に owner が明示されている |
| AC-4 | `.github/workflows/**` に owner が明示されている |
| AC-5 | `apps/api/**` に owner が明示されている |
| AC-6 | `apps/web/**` に owner が明示されている |
| AC-7 | global fallback `* @daishiman` が **冒頭** に 1 行配置され、governance パスは末尾近傍に配置されている（最終マッチ勝ちで具体的パスが勝つ順序） |
| AC-8 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の出力で `errors: []` が確認できる |
| AC-9 | リポジトリ内の `doc/` 表記が `docs/` へ統一されている、または残置箇所が「外部リンク等の不可避ケース」に限定され `outputs/phase-02/main.md` に明示記録されている |
| AC-10 | branch protection 草案 / 適用設定で `require_code_owner_reviews=false`（solo 運用）が維持されており、CODEOWNERS は ownership 文書として機能することが本仕様書で明記されている |

## 実行タスク

1. 原典スペック（`docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md`）§1〜§3 を写経し、本 Phase の「目的」「真の論点」「依存境界」「価値とコスト」へ展開する（完了条件: 原典 §1.1〜§1.3・§2.1〜§2.4・§3 が本仕様に対応箇所をもつ）。
2. AC-1〜AC-10 を確定し、target paths を `docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**` の 5 系列で固定する（完了条件: AC 表が 10 行で完結）。
3. solo 運用のため `require_code_owner_reviews` を有効化しない方針を Phase 1 で固定し、AC-10 として明文化する（完了条件: AC-10 と「価値とコスト」「4 条件評価 / 整合性」が同方針で整合）。
4. 4 条件評価をすべて PASS で確定する（完了条件: 4 観点すべてに PASS + 根拠）。
5. `doc/` → `docs/` 表記揺れ棚卸しを Phase 2 のステップ 1 に繰り上げ予約し、棚卸しコマンド `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` を Phase 2 へ引き渡す（完了条件: Phase 2 ステップ 1 に該当コマンドが記述される予約となっている）。
6. ロールバック方針を「`git revert` 1 コミット粒度 もしくは CODEOWNERS ファイル削除」で固定し、`require_code_owner_reviews=false` のため運用詰みに至らない旨を Phase 2 へ引き渡す（完了条件: Phase 2 §ロールバック設計で再記述される予約）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック（160 行） |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/codeowners.md | 既存 governance 設計の参照元 |
| 必須 | .github/CODEOWNERS（現状） | 旧表記 `doc/01a-*/` を含む既存ファイル |
| 必須 | CLAUDE.md（プロジェクトルート） | solo 運用ポリシー / `doc/` `docs/` 表記揺れの実例 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ（存在時） |
| 参考 | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners | CODEOWNERS の最終マッチ勝ち仕様 / glob 仕様 / team 権限要件 |
| 参考 | https://docs.github.com/en/rest/repos/repos#list-codeowners-errors | `gh api .../codeowners/errors` 仕様 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備（本ワークフロー）
- Phase 1〜3 の成果物本体作成（要件定義 / 設計 / 設計レビュー）
- target paths 5 系列（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）の Phase 1 固定
- AC-1〜AC-10 の確定
- solo 運用ポリシーに基づく `require_code_owner_reviews=false` 方針の Phase 1 固定
- `doc/` → `docs/` 表記揺れ棚卸しのコマンド仕様化（実置換は Phase 5）
- ロールバック方針（`git revert` 1 コミット粒度）の方針固定

### 含まない

- `.github/CODEOWNERS` への実差分適用（Phase 5 実装ランブックで実行）
- `doc/` → `docs/` の実置換コミット（Phase 5）
- `gh api .../codeowners/errors` の実走（Phase 5 / Phase 11）
- branch protection 本適用（UT-GOV-001 で実施）
- team handle (`@daishiman/...`) の新設（GitHub 組織側の運用作業）
- 既存タスク仕様書本文のレビュー / 内容修正
- `apps/api` / `apps/web` のソースコード改変（不変条件 #5 を侵害しない）

## 実行手順

### ステップ 1: 原典スペックの写経

- `UT-GOV-003-codeowners-governance-paths.md` §1〜§3 を本仕様の「目的」「真の論点」「依存境界」「価値とコスト」「AC」へ写経・拡張する。

### ステップ 2: AC-1〜AC-10 の確定

- target paths 5 系列を AC-2〜AC-6 に対応付け、AC-7（順序）/ AC-8（errors=[]）/ AC-9（doc→docs）/ AC-10（require_code_owner_reviews=false）の運用 AC を追加する。

### ステップ 3: solo 運用ポリシーの固定

- CLAUDE.md ブランチ戦略の「solo 運用ポリシー」と整合し、`require_code_owner_reviews=false` を AC-10 として固定する。

### ステップ 4: 4 条件評価のロック

- 価値性 / 実現性 / 整合性 / 運用性 をすべて PASS で確定。MAJOR があれば Phase 2 に進めない。

### ステップ 5: Phase 2 への引き渡し予約

- 棚卸しコマンド `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` / 検証コマンド `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` / ロールバック方針を Phase 2 入力として明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・target paths 5 系列・最終マッチ勝ち順序設計入力・棚卸しコマンド・検証コマンド |
| Phase 3 | 4 条件評価を base case PASS 判定の根拠に再利用 / NO-GO 条件として `errors: []` 未確認 / `doc/` 棚卸し未実施を引き渡す |
| Phase 4 | AC-1〜AC-10 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-10 |
| Phase 11 | `gh api .../codeowners/errors` の実走基準として AC-8 |

## 多角的チェック観点

- 不変条件 #5（D1 直接アクセスは apps/api に閉じる）: 本タスクは `.github/CODEOWNERS` と doc 表記の整理のみ。
- solo 運用ポリシー: CLAUDE.md の `required_pull_request_reviews=null` と整合し、`require_code_owner_reviews=false` を Phase 1 で固定。
- 最終マッチ勝ち仕様: AC-7 で global fallback を冒頭、governance パスを末尾近傍に置く順序を AC として固定（具体設計は Phase 2）。
- 表記揺れ事故防止: `doc/` 残置を Phase 2 で全文棚卸ししてから CODEOWNERS を書くフローを Phase 1 で予約。
- silent 失敗回避: `gh api .../codeowners/errors` を AC-8 として明示的に gate 化。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペック §1〜§3 の写経 | 1 | completed | 原典 160 行から本仕様へ展開 |
| 2 | AC-1〜AC-10 の確定 | 1 | completed | target paths 5 系列を含む |
| 3 | solo 運用 `require_code_owner_reviews=false` 方針固定 | 1 | completed | AC-10 |
| 4 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 5 | 棚卸し / 検証コマンドの Phase 2 引き渡し予約 | 1 | completed | rg / gh api コマンド |
| 6 | ロールバック方針の固定 | 1 | completed | git revert 1 コミット粒度 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / target paths / AC / 4 条件評価 / 既存 CODEOWNERS 差分方針） |
| メタ | （後続 Phase で artifacts.json を整備する場合の placeholder） | Phase 1 状態 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「solo 運用 + 最終マッチ勝ち順序での ownership 文書化」に再定義されている
- [x] target paths 5 系列が AC-2〜AC-6 に対応付けされている
- [x] `require_code_owner_reviews=false`（solo 運用）が AC-10 で明文化されている
- [x] 4 条件評価が全 PASS で確定している
- [x] AC-1〜AC-10 が原典スペック §2.2 と整合している
- [x] スコープ「タスク仕様書整備に閉じ、実適用は Phase 5 以降」が明記されている
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（最終マッチ勝ち順序 / `doc/` 表記揺れ / silent 失敗 / team handle 権限要件 / glob クセ / 将来の `require_code_owner_reviews` 有効化時の注意）が AC または多角的チェックに対応
- Phase 1 の状態が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 最終マッチ勝ち順序での ownership 文書化（solo 運用、`require_code_owner_reviews=false`）
  - target paths 5 系列
  - 4 条件評価（全 PASS）の根拠
  - 棚卸しコマンド `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'`
  - 検証コマンド `gh api repos/daishiman/UBM-Hyogo/codeowners/errors`
  - ロールバック方針（`git revert` 1 コミット粒度 / CODEOWNERS 削除）
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-10 が原典スペック §2.2 と乖離
  - solo 運用ポリシー（CLAUDE.md）と矛盾する方針が混入
