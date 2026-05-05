# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

Phase 2 の設計に対して、4 つ以上の代替案（A: `bash scripts/cf.sh pages project create` 経由 = base case / B: Cloudflare Dashboard 手動操作 / C: Terraform Cloudflare Provider / D: Pages Git 連携自動 deploy）を比較し、9 観点（4 条件 + 5 観点）で PASS / MINOR / MAJOR を付与する。base case = 案 A を採用根拠付きで確定し、上流 2 件完了確認を NO-GO 条件として 3 重明記の最終箇所に固定する。判定結果は **PASS（with notes）** とし、notes は Phase 5 / 11 / 12 / 13 への申し送り事項として明記する。

## 実行タスク

1. 代替案を 4 案以上列挙する（A / B / C / D）。
2. 9 観点 × 案で PASS / MINOR / MAJOR を付与する（マトリクスに空セルゼロ）。
3. base case（案 A）を選定理由付きで確定する。
4. PASS / MINOR / MAJOR の判定基準を定義する。
5. 着手可否ゲートを定義し、上流 2 件（01b / UT-05）完了を NO-GO 条件として明記する（重複明記 3/3）。
6. リスクと緩和策を表化する（Phase 2 R-1〜R-5 を再掲し、レビュー観点で R-6〜R-8 を補強）。
7. open question を Phase 4 / 5 / 11 / 12 / 13 に振り分ける。

## 依存タスク順序（上流 2 件完了必須）— 重複明記 3/3

> **01b（Cloudflare base bootstrap）/ UT-05（CI/CD パイプライン実装）の 2 件すべてが completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる。**
> 親仕様 §依存関係で「上流」として明記された 2 件であり、未完了で先行作成すると (a) `wrangler pages project create` 実行時に 401 / Token スコープ不足、(b) 命名と `web-cd.yml` の参照キーが乖離して `pages deploy` が 8000017、のいずれかが確定する。Phase 1 §依存境界・Phase 2 §依存タスク順序・本 Phase §着手可否ゲートの 3 箇所で重複明記する。
> 例外なし。1 件でも未完了なら NO-GO。

## 上流タスク完了確認チェックポイント

| # | 上流タスク | 確認項目 | 確認手段 | GO 条件 |
| --- | --- | --- | --- | --- |
| 1 | 01b | Cloudflare API Token 発行済み（最小スコープ）/ Account ID 取得済み / 1Password Environments エントリ存在 / `bash scripts/cf.sh whoami` が success | `bash scripts/cf.sh whoami` + `op item get "Cloudflare" --vault UBM-Hyogo` | API Token に `Account.Cloudflare Pages.Edit` / `Account.Account Settings.Read` が含まれ、whoami が成功 |
| 2 | UT-05 | `.github/workflows/web-cd.yml` が main にマージ済み / `${{ vars.CLOUDFLARE_PAGES_PROJECT }}` + suffix `-staging` の連結仕様で `pages deploy` を呼ぶことが確定 | `gh pr list --search "UT-05" --state merged` + `grep -nE "vars.CLOUDFLARE_PAGES_PROJECT|pages deploy" .github/workflows/web-cd.yml` | dev / main 両分岐で参照されており、命名規則 `<base>` / `<base>-staging` と整合する |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-02/main.md | base case 構造（本 workflow で作成済み） |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md §苦戦箇所・知見 | リスク源 |
| 必須 | scripts/cf.sh | `wrangler` ラッパーの正規経路 |
| 参考 | https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/pages_project | 案 C 評価 |
| 参考 | https://developers.cloudflare.com/pages/configuration/git-integration/ | 案 D（Git 連携自動 deploy）評価 |

## 代替案比較

### 案 A: `bash scripts/cf.sh pages project create` 経由（base case = Phase 2 採用 / MVP）

- 概要: `bash scripts/cf.sh pages project create <name> --production-branch=<branch> --compatibility-flags=nodejs_compat --compatibility-date=2025-01-01` で 2 件作成。`scripts/cf.sh` が `op run --env-file=.env` で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入し、`mise exec --` 経由で Node 24 / pnpm 10 / `wrangler` の正しいバイナリを実行する。
- 利点: CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」と完全整合 / 1Password 運用と整合 / コマンド系列が監査しやすい / Token 値が history・ログに残らない / Node バージョン揺れを `mise exec` で吸収 / 既存ラッパーで esbuild バージョン解決済み。
- 欠点: state は手動（drift 検知は `pages project list` ベース）/ Cloudflare Dashboard で誰かが手動編集すると drift。

### 案 B: Cloudflare Dashboard 手動操作

- 概要: Cloudflare Pages → Create application → Direct Upload → プロジェクト名・`production_branch`・互換性フラグを GUI で設定。
- 利点: 学習コスト最小 / ビジュアル確認しやすい。
- 欠点: 自動化不可 / 再現性ゼロ / 命名・`production_branch`・`compatibility_date` のタイポリスクが GUI 入力で検出されにくい / CLAUDE.md「`scripts/cf.sh` 経由」に違反気味（CLI ではなく Dashboard）/ 監査ログが Cloudflare 側に分散。**運用性 MAJOR / 整合性 MINOR**。

### 案 C: Terraform Cloudflare Provider

- 概要: Terraform で `cloudflare_pages_project` リソースを宣言し、`production_branch` / 互換性 / Git 連携を IaC 化。state は GitHub backend / R2 等。
- 利点: 完全な宣言的管理 / drift 検知 / plan-apply。
- 欠点: Terraform 基盤・state backend の新規導入が必要。本リポジトリは Cloudflare Workers + pnpm 中心で Terraform 運用基盤が無い。state に API Token が plain で残るリスク（または `sensitive = true` でも plan diff で漏れる懸念）。MVP スコープ外。**実現性 MAJOR / 整合性 MAJOR**。

### 案 D: Pages Git 連携自動 deploy

- 概要: Cloudflare Pages の Git 連携を ON にし、Cloudflare 側で各 push を直接 build / deploy。GitHub Actions の `pages deploy` ステップを廃止する。
- 利点: ワークフロー記述が簡素化 / Cloudflare 側で build キャッシュ / OpenNext 統合が公式サポートに近い形になる。
- 欠点: GitHub Actions と Cloudflare 側で二重 deploy が走るリスク（既存 `web-cd.yml` を全面廃止する必要あり = UT-05 全面改修）/ build 環境を Cloudflare 側 build 環境に依存（pnpm workspace の monorepo build が制約に該当）/ 苦戦箇所 §5 そのもの。MVP には大きすぎる方針転換。**実現性 MAJOR / 整合性 MAJOR**。
- 取り扱い: 将来移行候補としても優先度低。Phase 12 unassigned-task-detection には登録するが推奨度は低い。

### 代替案 × 評価マトリクス（9 観点）

| 観点 | 案 A (base) | 案 B (Dashboard) | 案 C (Terraform) | 案 D (Git 連携) |
| --- | --- | --- | --- | --- |
| 価値性（CD 実稼働化） | PASS | PASS | PASS | PASS |
| 実現性 | PASS | PASS | MAJOR（基盤無し） | MAJOR（UT-05 全面改修） |
| 整合性（CLAUDE.md / `scripts/cf.sh` / 1Password） | PASS | MINOR（Dashboard 経路） | MAJOR（IaC 基盤無し） | MAJOR（GHA 主導と矛盾） |
| 運用性 | PASS（コマンド再現性） | MAJOR（GUI ペースト履歴・タイポ） | MINOR（state secret 課題） | MINOR（二重 deploy リスク） |
| 責務境界（Pages 作成 / CD / Variable 引き渡し） | PASS | PASS | PASS | MINOR（Pages 側に build 責務移譲） |
| 依存タスク順序（01b / UT-05） | PASS（3 重明記） | PASS | PASS | PASS |
| 価値とコスト | PASS（コスト最小） | MINOR（再現性ゼロで再施行コスト高） | MAJOR（基盤導入） | MAJOR（UT-05 改修） |
| ロールバック設計 | PASS（`pages project delete` で再作成） | PASS（Dashboard で削除） | PASS（state revert） | MINOR（連携解除 + GHA 復活が必要） |
| 状態所有権（Workers 正本 / Pages 派生 / Git 連携 OFF） | PASS（明示宣言） | MINOR（GUI が事実上正本化する drift リスク） | PASS（Terraform state が正本化候補） | MINOR（Git 連携 ON で運用方針逆転） |

### 採用結論

- **base case = 案 A を採用**。将来移行候補は **案 C（Terraform Cloudflare Provider）** を Phase 12 unassigned-task-detection に登録（優先度: 低〜中）。
- 案 D（Pages Git 連携自動）は MVP / 将来含めて非推奨。`web-cd.yml` 主導という現アーキテクチャと根本的に矛盾するため。
- 理由:
  1. 9 観点中 9 件 PASS（with notes for OpenNext 切替対応）
  2. CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」と完全整合
  3. 既存 `op` + `mise exec` + `wrangler` ラッパーで Node / esbuild / API Token 解決済み、追加依存ゼロ
  4. ロールバック（`pages project delete` → 再作成）が単純
  5. コマンド系列が監査しやすく、Token 値が history・ログに残らない
  6. 苦戦箇所 §5（Git 連携 ON で二重 deploy）を Git 連携 OFF 既定方針で回避
- 案 B は Dashboard 経由でタイポリスク・再現性ゼロのため不採用。ただし lane 5 で Git 連携 OFF を確認する目的では Dashboard を補助的に使う。
- 案 C は Terraform 基盤が無いため MVP では不採用。将来 IaC 化フェーズで再評価。
- 案 D は CD アーキテクチャ転換のため非推奨。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 11 / 12 / 13 で補足対応が必要だが Phase 4 移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev/main push → Pages deploy green の経路が成立し UT-06 / UT-16 / UT-27 / UT-29 の前提が確定 |
| 実現性 | PASS | `bash scripts/cf.sh pages project create ...` は既存ラッパーで実行可能、追加依存ゼロ |
| 整合性 | PASS | 不変条件 #5 を侵害せず、CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」「1Password 正本」と完全整合 |
| 運用性 | PASS | 命名規則「`<base>` / `<base>-staging`」固定、`production_branch` 環境別配線、`compatibility_date` Workers 同期、Pages Git 連携 OFF 既定 で 5 リスクを同時封じ |
| 責務境界 | PASS | Pages 作成 (UT-28) / CD (UT-05) / Variable 配置 (UT-27) / Workers 作成 (既存 wrangler.toml) を分離。OpenNext 切替が必要なら UT-05 にフィードバックして本タスク内では workflow を編集しない |
| 依存タスク順序 | PASS（with notes） | 上流 2 件完了必須を 3 重明記。1 件でも未完了なら NO-GO |
| 価値とコスト | PASS | 実装は `bash scripts/cf.sh pages project create` 2 回 + 確認 1〜2 回。所要 5〜10 分 |
| ロールバック設計 | PASS | `bash scripts/cf.sh pages project delete <name>` で削除 → 再作成可能。`production_branch` / 互換性は再 create 時に修正可能 |
| 状態所有権 | PASS | Workers 正本（`apps/api/wrangler.toml` の `compatibility_date` / `compatibility_flags`） / Pages 派生（同一値で揃える） / Git 連携 OFF 既定 を明文化 |

**最終判定: PASS（with notes）**
notes:
- 上流 2 件完了確認は Phase 5 着手前の必須ゲート（NO-GO 条件として再明示）。1 件でも未完了なら GO 不可。
- OpenNext アップロード成果物（`.next` vs `.open-next/...`）の判定が dev push smoke で red なら、本タスクではプロジェクト作成のみ実施し、`apps/web/wrangler.toml` / `web-cd.yml` の修正は **UT-05 にフィードバック**して別 PR で対応（Phase 12 unassigned-task-detection に登録）。
- 案 C（Terraform Cloudflare Provider）は将来移行候補として Phase 12 unassigned-task-detection に登録。優先度は低〜中。
- 案 D（Pages Git 連携自動 deploy）は MVP / 将来とも非推奨（CD アーキテクチャ転換のため）。
- API Token / Account ID / 実プロジェクト URL（公開 URL は記録可、秘匿 ID は不可）の payload / runbook / Phase outputs への転記禁止を Phase 5 / 11 / 13 で繰り返し再確認。
- 実 `wrangler pages project create` PUT は Phase 13 ユーザー承認後に実行（user_approval_required: true）。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない（採用 base case ベース）
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12 / 13）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **上流 2 件（01b / UT-05）のいずれかが completed でない（重複明記 3/3）**
  - 例外なし
- 4 条件のいずれかに MAJOR が残る
- API Token / Account ID 値が payload / runbook / Phase outputs / bash 例の文字列に直書きされている
- コマンド系列に `wrangler` 直接実行が混入している（CLAUDE.md 違反）
- 命名規則「`<base>` / `<base>-staging`」が固定されていない、または Variable 引き渡し値が production 名以外で誤設定
- `compatibility_date` が Workers 側 (`2025-01-01`) と乖離した値で確定している
- Pages Git 連携 OFF 既定方針が明記されていない
- `production_branch` の環境別配線（production=main / staging=dev）が表化されていない

## リスクと緩和策（Phase 2 R-1〜R-5 を再掲 + R-6〜R-8 補強）

| # | リスク | 影響 | 緩和策 | 担当 Phase |
| --- | --- | --- | --- | --- |
| R-1 | OpenNext 採用環境のアップロード対象不整合（`.next` vs `.open-next/...`） | deploy success でも `_worker.js` 不在で SSR/API ルート 500/404 | lane 2 静的判定 + lane 5 smoke 実走確認、red なら Phase 12 で UT-05 にフィードバック登録 | Phase 2 / 11 / 12 |
| R-2 | `production_branch` 取り違え（main/dev 逆配線） | preview 扱い・URL がプレビューエイリアス化・カスタムドメイン未反映 | create 時に `--production-branch=main` / `--production-branch=dev` を必須引数化、`pages project list` で確認 | Phase 2 / 5 / 11 |
| R-3 | `compatibility_date` / `compatibility_flags` Workers 同期ずれ | Workers / Pages で `process` / `node:*` 可用性が片側だけ異なり挙動分岐 | create 時に `--compatibility-date=2025-01-01` / `--compatibility-flags=nodejs_compat` 必須化、Workers 側更新時の同期運用を Phase 12 ドキュメント化 | Phase 2 / 5 / 12 |
| R-4 | プロジェクト命名揺れ（`<base>` vs `<base>-staging` 二重訂正） | UT-27 Variable 値と `web-cd.yml` suffix 連結結果のミスマッチで `pages deploy` 8000017 | 命名「`<base>` / `<base>-staging`」と Variable 値「production 名 suffix なし」を AC-6 で固定 | Phase 2 / 5 / 11 |
| R-5 | Pages Git 連携 ON による二重 deploy | 同一ブランチに対し Cloudflare 側 build と GitHub Actions deploy が並走、ログ分散・古い commit の build 採用レース | Pages Git 連携 OFF 既定、create 直後の連携なし状態を維持、Dashboard で OFF 確認 | Phase 2 / 5 / 11 |
| R-6 | Cloudflare API Token のスコープ過剰付与 | 漏洩時の影響範囲拡大 | 01b で `Account.Cloudflare Pages.Edit` / `Account.Account Settings.Read` のみ付与（必要なら Workers Scripts.Edit / D1.Edit を別 token として分離）。Token 値は payload に転記しない | Phase 5 / 12 |
| R-7 | プロジェクト命名衝突（既存アカウントに同名がある） | `wrangler pages project create` が 409 系で失敗 | create 前に `bash scripts/cf.sh pages project list` で同名がないか確認、衝突時は命名再検討 + UT-27 Variable 値も同期更新 | Phase 5 / 6 |
| R-8 | Cloudflare Dashboard で誰かが手動編集して drift（`production_branch` / 互換性 / Git 連携 ON） | 想定と異なる挙動 / 二重 deploy 復活 | 「Pages プロジェクト設定の編集は本仕様書の Phase 13 runbook 経由のみ」を運用ルール化、Phase 12 で Phase 11 smoke の再走頻度を運用ドキュメントに明記 | Phase 12 |

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | OpenNext のアップロード対象を `.next` のまま継続するか、`.open-next/assets` に切り替えるか | Phase 11 / 12 | dev push smoke の結果で確定。red なら UT-05 にフィードバック |
| 2 | staging / production で API Token を別発行するか同一 token を使うか | Phase 5 / UT-27 連携 | 漏洩影響限定の観点では別 token 推奨。MVP は UT-27 側の判断に委ねる |
| 3 | カスタムドメインバインドのタイミング（UT-16 が独立タスクで進める想定） | Phase 12 unassigned | 本タスクではプロジェクト作成のみ。カスタムドメインは UT-16 |
| 4 | 案 C（Terraform Cloudflare Provider）の将来導入時期 | Phase 12 unassigned | IaC 化フェーズで再評価 |
| 5 | `pages project list` 出力を verification-log にどこまで残すか（Account ID マスク粒度） | Phase 13 | 公開 URL は記録可、秘匿 ID はマスク |
| 6 | 命名変更が将来必要になった場合の delete → create 手順を runbook に残すか | Phase 12 | 残す。Variable 値の同時更新も必要 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述。

### ステップ 2: 評価マトリクスの作成

- 9 観点 × 4 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 全 PASS（with notes）であることを確認。MINOR の対応 Phase を明示。

### ステップ 4: 着手可否ゲートの判定

- 上流 2 件 completed を NO-GO 条件として再明示。GO の場合のみ artifacts.json の Phase 3 を `completed` にする（Phase 4 以降で同期）。

### ステップ 5: リスクと緩和策の表化

- R-1〜R-8 を担当 Phase 付きで明記（Phase 2 R-1〜R-5 を再掲 + レビュー観点で R-6〜R-8 補強）。

### ステップ 6: open question の Phase 振り分け

- 6 件すべてに受け皿 Phase を割り当てる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力にテスト戦略を組む |
| Phase 5 | open question #2（token 別 / 同一）を確定（UT-27 と協調） |
| Phase 10 | base case の PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #1（OpenNext 切替）/ R-1（アップロード不整合）/ R-5（Git 連携二重起動）を smoke 実走で確定 |
| Phase 12 | open question #3（カスタムドメイン）/ #4（Terraform）/ #6（命名変更手順）を unassigned-task-detection.md に登録 |
| Phase 13 | open question #5（マスク粒度）を verification-log の運用ルールに反映 |

## 多角的チェック観点

- 責務境界: Pages 作成 / CD / Variable 配置 / Workers 作成 の責務分離が代替案で破綻しないか。
- 依存タスク順序: 上流 2 件完了必須が 3 重明記されたか（本 Phase が 3 重目）。
- 価値とコスト: 案 A が最小コストで CD 実稼働化を達成するか。
- ロールバック設計: `pages project delete` → 再作成で逆操作可能か。
- 状態所有権: Workers 正本 / Pages 派生 が代替案で混線しないか。
- Pages Git 連携 OFF: 全代替案で二重 deploy を防げるか（案 D は不採用）。
- `compatibility_date` 同期: Workers 側 `2025-01-01` と一致しているか。
- 命名規則: `<base>` / `<base>-staging` の suffix 方式が崩れないか。
- API Token / Account ID 転記禁止: 全代替案で payload / runbook / log への値転記を防げるか。
- `wrangler` 直接実行禁止: コマンド系列が `bash scripts/cf.sh` 経由になっているか（案 A）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | completed | 案 A〜D |
| 2 | 評価マトリクスの作成 | 3 | completed | 9 観点 × 4 案 |
| 3 | base case 最終 PASS（with notes）判定 | 3 | completed | notes 6 件 |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | completed | 3 レベル |
| 5 | 着手可否ゲート定義 + 上流 2 件 NO-GO 明記 | 3 | completed | 重複明記 3/3 |
| 6 | リスクと緩和策の表化 | 3 | completed | R-1〜R-8 |
| 7 | 上流タスク完了確認チェックポイント | 3 | completed | 01b / UT-05 |
| 8 | open question の Phase 振り分け | 3 | completed | 6 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート・上流チェックポイント・リスク表（Phase 4 以降で本体生成） |
| メタ | artifacts.json | Phase 3 状態の更新（本 workflow で作成済み） |

## 完了条件

- [x] 代替案が 4 案以上比較されている（A / B / C / D）
- [x] 9 観点 × 案のマトリクスに空セルが無い
- [x] base case の最終判定が PASS（with notes）
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] 着手可否ゲートで上流 2 件完了が NO-GO 条件として明記されている（重複明記 3/3）
- [x] 上流タスク完了確認チェックポイント（01b / UT-05）が表化されている
- [x] リスクと緩和策が R-1〜R-8 で表化されている（苦戦箇所 1〜5 と一対一に対応 + レビュー観点 R-6〜R-8）
- [x] open question 6 件すべてに受け皿 Phase が割り当てられている
- [x] 4 条件 + 5 観点すべてが PASS（with notes）
- [x] MAJOR ゼロ（案 B / C / D は MAJOR / MINOR を含むが採用していない）
- [x] コマンド系列が `bash scripts/cf.sh` 経由で固定（`wrangler` 直接実行なし）

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 成果物が `outputs/phase-03/main.md` に配置予定（Phase 4 以降で本体生成）
- base case の 9 観点すべてが PASS（with notes）
- MAJOR ゼロ（base case ベース）
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `completed`（Phase 4 以降で同期）

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A（`bash scripts/cf.sh pages project create` 経由）
  - 将来候補 = 案 C（Terraform Cloudflare Provider）。案 D（Git 連携自動）は非推奨
  - lane 1〜5 を Phase 4 のテスト戦略の対象に渡す
  - notes 6 件（上流ゲート / OpenNext 切替 UT-05 フィードバック / Terraform 移行候補 / Git 連携 OFF 既定 / 値転記禁止 / Phase 13 user_approval）
  - リスク R-1〜R-8 を Phase 4 / 5 / 11 / 12 のテスト・実装・smoke・運用ドキュメントに分散
  - open question 6 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - 上流 2 件のいずれかが completed でない
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
  - コマンド系列に `wrangler` 直接実行が混入している
  - `compatibility_date` が Workers 側と乖離
