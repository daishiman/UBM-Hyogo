# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 2 の設計に対して、4 つ以上の代替案（A: `gh` CLI 直接実行 + 1Password 手動同期 = base case / B: GitHub UI 手動操作 / C: Terraform GitHub Provider / D: `1password/load-secrets-action` 即時導入）を比較し、9 観点（4 条件 + 5 観点）で PASS / MINOR / MAJOR を付与する。base case = 案 A を採用根拠付きで確定し、上流 3 件完了確認を NO-GO 条件として 3 重明記の最終箇所に固定する。判定結果は **PASS（with notes）** とし、notes は Phase 5 / 11 / 12 / 13 への申し送り事項として明記する。

## 実行タスク

1. 代替案を 4 案以上列挙する（A / B / C / D）。
2. 9 観点 × 案で PASS / MINOR / MAJOR を付与する（マトリクスに空セルゼロ）。
3. base case（案 A）を選定理由付きで確定する。
4. PASS / MINOR / MAJOR の判定基準を定義する。
5. 着手可否ゲートを定義し、上流 3 件（UT-05 / UT-28 / 01b）完了を NO-GO 条件として明記する（重複明記 3/3）。
6. リスクと緩和策を表化する。
7. open question を Phase 4 / 5 / 11 / 12 / 13 に振り分ける。

## 依存タスク順序（上流 3 件完了必須）— 重複明記 3/3

> **UT-05（CI/CD パイプライン実装）/ UT-28（Cloudflare Pages プロジェクト作成）/ 01b（Cloudflare base bootstrap）の 3 件すべてが completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる。**
> 親仕様 §依存関係で「上流」として明記された 3 件であり、未完了で先行配置すると (a) 値ミスマッチで CI 401 / 404、(b) `CLOUDFLARE_PAGES_PROJECT` の値が確定しないまま suffix 連結が壊れる、(c) Cloudflare API Token が未発行で 401、のいずれかが確定する。Phase 1 §依存境界・Phase 2 §依存タスク順序・本 Phase §着手可否ゲートの 3 箇所で重複明記する。
> 例外なし。1 件でも未完了なら NO-GO。

## 上流タスク完了確認チェックポイント

| # | 上流タスク | 確認項目 | 確認手段 | GO 条件 |
| --- | --- | --- | --- | --- |
| 1 | UT-05 | `.github/workflows/{backend-ci,web-cd}.yml` が main branch にマージ済み / secret/variable 参照キーが Phase 2 と一致 | `gh pr list --search "UT-05" --state merged` + `grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml` | 4 件キー（CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / DISCORD_WEBHOOK_URL / CLOUDFLARE_PAGES_PROJECT）すべて参照されている |
| 2 | UT-28 | Cloudflare Pages プロジェクト名が確定 / 命名が `ubm-hyogo-web` 系 | `bash scripts/cf.sh pages project list` | プロジェクト名が判明し、`CLOUDFLARE_PAGES_PROJECT` の値として使える |
| 3 | 01b | Cloudflare API Token 発行済み（最小スコープ）/ Account ID 取得済み / 1Password Environments エントリ存在 | `op item get "Cloudflare" --vault UBM-Hyogo` | api_token / account_id の両 field が存在 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | base case 構造 |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md §苦戦箇所・知見 | リスク源 |
| 参考 | https://registry.terraform.io/providers/integrations/github/latest/docs/resources/actions_secret | 案 C 評価 |
| 参考 | https://github.com/1Password/load-secrets-action | 案 D 評価 |

## 代替案比較

### 案 A: `gh` CLI 直接実行 + 1Password 手動同期（base case = Phase 2 採用 / MVP）

- 概要: `gh secret set` / `gh variable set` / `gh api repos/.../environments/...` で配置。値は 1Password から `op read` で一時環境変数化して `--body "$VAR"` 経由で渡し、直後に `unset`。1Password Item Notes の Last-Updated を運用メモとして更新。
- 利点: 既存 `gh` CLI 認証 + 既存 1Password 運用と完全整合 / 追加依存ゼロ / コマンド系列が監査しやすい / CLAUDE.md 「1Password 正本」「`.env` に実値を書かない」と整合。
- 欠点: state 管理は手動 / drift 検知は Last-Updated メモベース / GitHub UI 直編集を運用ルールで防ぐ必要。

### 案 B: GitHub UI 手動操作

- 概要: GitHub repository settings → Secrets and variables → Actions の UI 上で 1 件ずつ追加。
- 利点: 学習コスト最小 / GUI で確認しやすい。
- 欠点: ペースト時に履歴・クリップボード・スクショに値が残るリスク / 自動化不可 / Last-Updated 監査が手動 / コマンド再現性ゼロ。**運用性 MAJOR / 価値とコスト MINOR**。

### 案 C: Terraform GitHub Provider

- 概要: Terraform で `github_actions_secret` / `github_actions_variable` / `github_repository_environment` を IaC 化。state は GitHub backend / S3 / R2 等。
- 利点: 完全な宣言的管理 / drift 検知 / plan-apply。
- 欠点: Terraform 基盤・state backend の新規導入が必要。本リポジトリは Cloudflare Workers + pnpm 中心で Terraform 運用基盤が無い。state に secret 値が plain で残る課題（または `sensitive = true` でも plan diff には現れる）。MVP スコープ外。**実現性 MAJOR / 整合性 MAJOR**。

### 案 D: `1password/load-secrets-action` 即時導入

- 概要: GitHub Actions 内で `1password/load-secrets-action` を使い、GitHub Secrets を経由せず実行時に op SA から直接注入。
- 利点: GitHub 側に派生コピーが残らず、正本が 1Password に一元化される。
- 欠点: SA トークンの管理（GitHub Secret として SA トークンが結局 1 件残る）/ ランナーごとの op CLI 導入 / `wrangler-action` 等の既存 actions が `apiToken` パラメータを直接受け取る形式と整合させる必要あり。MVP には over-engineering。**実現性 MINOR / 価値とコスト MINOR**。
- 取り扱い: 将来移行候補として Phase 12 unassigned-task-detection に登録。

### 代替案 × 評価マトリクス（9 観点）

| 観点 | 案 A (base) | 案 B (UI 手動) | 案 C (Terraform) | 案 D (op SA 即時) |
| --- | --- | --- | --- | --- |
| 価値性（CD 実稼働化） | PASS | PASS | PASS | PASS |
| 実現性 | PASS | PASS | MAJOR（基盤無し） | MINOR（依存追加 + actions 改修） |
| 整合性（CLAUDE.md / 1Password / `gh`） | PASS | MINOR（コマンド再現性無し） | MAJOR（IaC 基盤無し） | PASS（正本一元化志向） |
| 運用性 | PASS（一時変数 + unset） | MAJOR（GUI ペースト履歴リスク） | MINOR（state secret 課題） | MINOR（SA トークン管理） |
| 責務境界（Secret / Variable / Environment 分離） | PASS | PASS | PASS | PASS |
| 依存タスク順序（UT-05 / UT-28 / 01b） | PASS（3 重明記） | PASS | PASS | PASS |
| 価値とコスト | PASS（コスト最小） | MINOR（再現性ゼロで再施行コスト高） | MAJOR（基盤導入） | MINOR（移行コスト） |
| ロールバック設計 | PASS（1Password から再注入 / `gh secret delete`） | MINOR（手動再操作） | PASS（state revert） | PASS（SA トークン無効化） |
| 状態所有権（1Password 正本） | PASS（明示的に派生コピー宣言） | MINOR（UI が事実上正本化する drift リスク） | PASS（Terraform state が正本化候補） | PASS（最も理想的） |

### 採用結論

- **base case = 案 A を採用**。将来移行候補として **案 D（op SA + `load-secrets-action`）** を Phase 12 unassigned-task-detection に登録。
- 理由:
  1. 9 観点中 9 件 PASS（with notes for op SA 移行）
  2. 既存 `gh` CLI + 1Password 運用と完全整合、追加依存ゼロ
  3. 一時変数 + `unset` パターンで shell history 残存を抑制可能
  4. CLAUDE.md「1Password 正本」「`.env` に実値を書かない」と完全整合
  5. ロールバック（1Password から再注入）が単純
  6. `scripts/cf.sh` ラッパー思想と同じ「op + ラッパー + 一時環境変数」パターン
- 案 B は短期的にはペースト履歴リスクが残るため不採用。
- 案 C は Terraform 基盤が無いため MVP では不採用。将来 IaC 化フェーズで再評価。
- 案 D は移行コスト > MVP の価値。将来候補として登録。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 11 / 12 / 13 で補足対応が必要だが Phase 4 移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev/main push → CD green 経路が成立し UT-06 / UT-29 の前提が確定 |
| 実現性 | PASS | `gh` CLI + 1Password は既存運用範囲、追加依存ゼロ |
| 整合性 | PASS | 不変条件 #5 を侵害せず、CLAUDE.md「1Password 正本」「`.env` 実値禁止」と完全整合 |
| 運用性 | PASS | 一時変数 + `unset` で history 抑制、Last-Updated メモで drift 監視、API Token 最小スコープで漏洩影響限定 |
| 責務境界 | PASS | Secret / Variable / Environment の 3 種を用途別に分離（Variable はマスクされず suffix 連結ログ可視） |
| 依存タスク順序 | PASS（with notes） | 上流 3 件完了必須を 3 重明記。1 件でも未完了なら NO-GO |
| 価値とコスト | PASS | 実装は `gh` コマンド数本 + runbook 数通 |
| ロールバック設計 | PASS | 1Password から再注入 / `gh secret delete` で即時復旧 / API Token は Cloudflare 側でローテーション可能 |
| 状態所有権 | PASS | 1Password 正本 / GitHub 派生 / GitHub UI 直編集禁止 を明文化 |

**最終判定: PASS（with notes）**
notes:
- 上流 3 件完了確認は Phase 5 着手前の必須ゲート（NO-GO 条件として再明示）。1 件でも未完了なら GO 不可。
- `if: secrets.X != ''` の評価不能問題（親仕様 §3）に対する代替設計（env で受けてシェルで空文字判定）が `web-cd.yml` / `backend-ci.yml` 側に入っているか Phase 11 smoke で確認。入っていなければ Phase 12 unassigned-task に UT-05 へのフィードバックとして登録。
- 案 D（`load-secrets-action`）は将来移行候補として Phase 12 unassigned-task-detection に登録。
- secret 値の payload / runbook / Phase outputs への転記禁止を Phase 5 / 11 / 13 で繰り返し再確認。
- 実 `gh secret set` / `gh variable set` / `gh api` PUT は Phase 13 ユーザー承認後に実行（user_approval_required: true）。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12 / 13）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **上流 3 件（UT-05 / UT-28 / 01b）のいずれかが completed でない（重複明記 3/3）**
  - 例外なし
- 4 条件のいずれかに MAJOR が残る
- secret 値が payload / runbook / Phase outputs / bash 例の文字列に直書きされている
- 同名 repository-scoped と environment-scoped の併存禁止が運用ルールに無い
- API Token のスコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read を超える
- 1Password 正本 / GitHub 派生 の境界が state ownership に無い
- 動作確認手順に「Discord 未設定耐性確認」が無い

## リスクと緩和策

| # | リスク | 影響 | 緩和策 | 担当 Phase |
| --- | --- | --- | --- | --- |
| R-1 | `CLOUDFLARE_API_TOKEN` のスコープが過剰で漏洩時の影響範囲拡大 | production Cloudflare 全体への侵害 | Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read のみで token 発行 / Token 名に環境・発行日を含めローテーション履歴を保持 | Phase 2 / 5 / 11 |
| R-2 | repository-scoped と environment-scoped の同名併存で意図しない上書き | staging で production 値が誤参照される事故 | 「同名併存禁止」を運用ルール化 / `gh secret list` / `gh secret list --env X` で確認 | Phase 2 / 5 / 11 |
| R-3 | `if: secrets.X != ''` 評価不能で Discord 通知が無音失敗 | 本来 fail すべき CI が pass で見えない / 本来通知すべきが届かない | env で受けてシェルで空文字判定する代替設計を確認、なければ Phase 12 で UT-05 にフィードバック | Phase 11 / 12 |
| R-4 | 1Password 正本 vs GitHub Secrets 二重正本 drift（GitHub UI 直編集） | ローテーション時に 1Password 側が古いまま運用される | 「1Password 正本 / GitHub 派生」を state ownership に明記 / GitHub UI 直編集を禁止 / Last-Updated メモを 1Password Item Notes に記録 | Phase 2 / 12 |
| R-5 | secret 値が runbook / payload / Phase outputs / shell history に転記される | secret 漏洩 | AC-13 で全段に転記禁止を明記 / `op read` 一時環境変数 + `unset` パターン / `gh secret list` の値マスク前提 | 全 Phase |
| R-6 | `CLOUDFLARE_PAGES_PROJECT` を誤って Secret に置きログマスクでデバッグ困難 | suffix 連結結果が CI ログから追えず原因究明遅延 | Variable で固定 / Variable 化理由を仕様書に明記 | Phase 2 / 5 |
| R-7 | 上流 3 件未完了で先行配置 → 401 / 404 / 値ミスマッチ | CD 配線が連鎖的に red 化 | 上流完了確認を 3 重明記 + Phase 5 着手前ゲート | Phase 1 / 2 / 3 / 5 |
| R-8 | environment 作成漏れで environment-scoped secret が反映されない | deploy-staging が secret 未取得で 401 | lane 2 で `gh api repos/.../environments/{staging,production} -X PUT` を必須化 | Phase 2 / 5 |

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | `CLOUDFLARE_API_TOKEN` を staging / production で別 token にするか同一 token にするか | Phase 5 | MVP は同一 token も可。漏洩時の影響限定を優先するなら別 token |
| 2 | `DISCORD_WEBHOOK_URL` のチャンネル分離（staging / production 別チャンネル）は必要か | Phase 11 | 通知が混ざるなら environment-scoped に切替 |
| 3 | 案 D（`1password/load-secrets-action`）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降、CI セキュリティ強化フェーズ |
| 4 | `if: secrets.X != ''` 代替設計が UT-05 で組み込まれていない場合、本タスクで workflow に PR を出すか UT-05 にフィードバックするか | Phase 12 | フィードバックで UT-05 側別 PR が望ましい |
| 5 | 案 C（Terraform GitHub Provider）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降、IaC 化フェーズ |
| 6 | Last-Updated メモ運用を 1Password Item Notes 以外（例: 別 Vault Item）にするか | Phase 12 | MVP は Item Notes で充足 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述。

### ステップ 2: 評価マトリクスの作成

- 9 観点 × 4 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 全 PASS（with notes）であることを確認。MINOR の対応 Phase を明示。

### ステップ 4: 着手可否ゲートの判定

- 上流 3 件 completed を NO-GO 条件として再明示。GO の場合のみ artifacts.json の Phase 3 を `completed` にする。

### ステップ 5: リスクと緩和策の表化

- R-1〜R-8 を担当 Phase 付きで明記。

### ステップ 6: open question の Phase 振り分け

- 6 件すべてに受け皿 Phase を割り当てる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力にテスト戦略を組む |
| Phase 5 | open question #1（token 別 / 同一）/ #4（UT-05 へのフィードバック有無）を確定 |
| Phase 10 | base case の PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #2（チャンネル分離）/ R-3（Discord 無音失敗）を smoke 実走で確定 |
| Phase 12 | open question #3 / #5 / #6 を unassigned-task-detection.md に登録 |
| Phase 13 | open question #1 を user_approval ゲートに反映 |

## 多角的チェック観点

- 責務境界: Secret / Variable / Environment の 3 種分離が代替案で破綻しないか。
- 依存タスク順序: 上流 3 件完了必須が 3 重明記されたか（本 Phase が 3 重目）。
- 価値とコスト: 案 A が最小コストで CD 実稼働化を達成するか。
- ロールバック設計: 1Password から再注入 / `gh secret delete` で逆操作可能か。
- 状態所有権: 1Password 正本 / GitHub 派生 が代替案で混線しないか。
- 同名併存禁止: repository / environment スコープ重複が代替案で破られないか。
- secret 値転記禁止: 全代替案で payload / runbook / log への値転記を防げるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | completed | 案 A〜D |
| 2 | 評価マトリクスの作成 | 3 | completed | 9 観点 × 4 案 |
| 3 | base case 最終 PASS（with notes）判定 | 3 | completed | notes 5 件 |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | completed | 3 レベル |
| 5 | 着手可否ゲート定義 + 上流 3 件 NO-GO 明記 | 3 | completed | 重複明記 3/3 |
| 6 | リスクと緩和策の表化 | 3 | completed | R-1〜R-8 |
| 7 | 上流タスク完了確認チェックポイント | 3 | completed | UT-05 / UT-28 / 01b |
| 8 | open question の Phase 振り分け | 3 | completed | 6 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート・上流チェックポイント・リスク表 |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [x] 代替案が 4 案以上比較されている（A / B / C / D）
- [x] 9 観点 × 案のマトリクスに空セルが無い
- [x] base case の最終判定が PASS（with notes）
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] 着手可否ゲートで上流 3 件完了が NO-GO 条件として明記されている（重複明記 3/3）
- [x] 上流タスク完了確認チェックポイント（UT-05 / UT-28 / 01b）が表化されている
- [x] リスクと緩和策が R-1〜R-8 で表化されている
- [x] open question 6 件すべてに受け皿 Phase が割り当てられている
- [x] 4 条件 + 5 観点すべてが PASS（with notes）
- [x] MAJOR ゼロ（案 B / C は MAJOR / MINOR を含むが採用していない）

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 成果物が `outputs/phase-03/main.md` に配置済み
- base case の 9 観点すべてが PASS（with notes）
- MAJOR ゼロ（base case ベース）
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A（`gh` CLI 直接実行 + 1Password 手動同期）
  - 将来候補 = 案 D（`load-secrets-action`）/ 案 C（Terraform GitHub Provider）
  - lane 1〜5 を Phase 4 のテスト戦略の対象に渡す
  - notes 5 件（上流ゲート / Discord 評価不能代替 / op SA 移行候補 / secret 値転記禁止 / Phase 13 user_approval）
  - リスク R-1〜R-8 を Phase 4 / 5 / 11 / 12 のテスト・実装・smoke・運用ドキュメントに分散
  - open question 6 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - 上流 3 件のいずれかが completed でない
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
