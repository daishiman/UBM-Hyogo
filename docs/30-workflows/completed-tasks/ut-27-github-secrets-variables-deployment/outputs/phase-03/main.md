# Phase 3 成果物 — 設計レビュー

## 1. レビュー目的

Phase 2 設計に対する代替案比較・PASS/MINOR/MAJOR 判定・着手可否ゲートを確定する。base case = `gh` CLI 直接実行 + 1Password 手動同期 を採用根拠付きで承認し、上流 3 件（UT-05 / UT-28 / 01b）完了確認を NO-GO 条件として 3 重明記の最終箇所に固定する。

## 2. 代替案比較

### 案 A: `gh` CLI 直接実行 + 1Password 手動同期（base case = MVP 採用）

- 概要: `gh secret set` / `gh variable set` / `gh api repos/.../environments/...`。値は `op read` で一時環境変数化 → `--body "$VAR"` → `unset`。1Password Item Notes に Last-Updated メモ。
- 利点: 既存 `gh` CLI + 1Password と完全整合 / 追加依存ゼロ / コマンド系列が監査しやすい / CLAUDE.md「1Password 正本」「`.env` に実値を書かない」整合 / `scripts/cf.sh` ラッパー思想と同じ「op + 一時環境変数」パターン
- 欠点: state は手動 / drift 検知は Last-Updated メモ / GitHub UI 直編集を運用ルールで防ぐ必要

### 案 B: GitHub UI 手動操作

- 概要: GitHub repository settings → Secrets and variables → Actions の UI 上で 1 件ずつ追加
- 利点: 学習コスト最小 / GUI で確認しやすい
- 欠点: ペースト時に履歴・クリップボード・スクショに値が残るリスク / 自動化不可 / 再現性ゼロ
- 判定: **運用性 MAJOR / 価値とコスト MINOR**（不採用）

### 案 C: Terraform GitHub Provider

- 概要: `github_actions_secret` / `github_actions_variable` / `github_repository_environment` で IaC 化
- 利点: 完全な宣言的管理 / drift 検知 / plan-apply
- 欠点: Terraform 基盤・state backend の新規導入が必要（本リポジトリは Cloudflare Workers + pnpm 中心で Terraform 運用基盤が無い）/ state に secret 値が plain で残る課題
- 判定: **実現性 MAJOR / 整合性 MAJOR**（MVP では不採用、将来 IaC 化フェーズで再評価）

### 案 D: `1password/load-secrets-action` 即時導入

- 概要: GitHub Actions 内で op SA から直接注入し GitHub Secrets を経由しない
- 利点: GitHub 側に派生コピーが残らず正本一元化
- 欠点: SA トークン管理（結局 GitHub Secret として 1 件残る）/ ランナー op CLI 導入 / `wrangler-action` の `apiToken:` パラメータ整合
- 判定: **実現性 MINOR / 価値とコスト MINOR**（MVP では不採用、将来候補）

## 3. 評価マトリクス（9 観点 × 4 案）

| 観点 | 案 A (base) | 案 B (UI 手動) | 案 C (Terraform) | 案 D (op SA 即時) |
| --- | --- | --- | --- | --- |
| 価値性（CD 実稼働化） | PASS | PASS | PASS | PASS |
| 実現性 | PASS | PASS | MAJOR | MINOR |
| 整合性（CLAUDE.md / 1Password / `gh`） | PASS | MINOR | MAJOR | PASS |
| 運用性 | PASS | MAJOR | MINOR | MINOR |
| 責務境界（Secret / Variable / Environment 分離） | PASS | PASS | PASS | PASS |
| 依存タスク順序（UT-05 / UT-28 / 01b） | PASS | PASS | PASS | PASS |
| 価値とコスト | PASS | MINOR | MAJOR | MINOR |
| ロールバック設計 | PASS | MINOR | PASS | PASS |
| 状態所有権（1Password 正本） | PASS | MINOR | PASS | PASS |

## 4. base case 採用結論

**採用 = 案 A**

採用理由:
1. 9 観点中 9 件 PASS（with notes for op SA 移行）
2. 既存 `gh` CLI + 1Password 運用と完全整合、追加依存ゼロ
3. 一時環境変数 + `unset` パターンで shell history 残存を抑制可能
4. CLAUDE.md「1Password 正本」「`.env` に実値を書かない」と完全整合
5. ロールバック（1Password から再注入）が単純
6. `scripts/cf.sh` ラッパー思想と同じ「op + 一時環境変数」パターン

## 5. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 / 11 / 12 / 13 で補足対応が必要だが Phase 4 移行は許可 |
| MAJOR | block。Phase 4 へ進めない |

## 6. base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev/main push → CD green 経路成立、UT-06 / UT-29 の前提確定 |
| 実現性 | PASS | `gh` CLI + 1Password は既存運用範囲、追加依存ゼロ |
| 整合性 | PASS | 不変条件 #5 を侵害せず、CLAUDE.md「1Password 正本」「`.env` 実値禁止」と完全整合 |
| 運用性 | PASS | 一時変数 + `unset` で history 抑制、Last-Updated メモで drift 監視、API Token 最小スコープで漏洩影響限定 |
| 責務境界 | PASS | Secret / Variable / Environment の 3 種を用途別に分離 |
| 依存タスク順序 | PASS（with notes） | 上流 3 件完了必須を 3 重明記、1 件でも未完了なら NO-GO |
| 価値とコスト | PASS | 実装は `gh` コマンド数本 + runbook 数通 |
| ロールバック設計 | PASS | 1Password から再注入 / `gh secret delete` / Cloudflare 側 Token ローテーション |
| 状態所有権 | PASS | 1Password 正本 / GitHub 派生 / GitHub UI 直編集禁止 を明文化 |

**最終判定: PASS（with notes）**

notes:
- 上流 3 件完了確認は Phase 5 着手前の必須ゲート（NO-GO として再明示）
- `if: secrets.X != ''` 評価不能の代替設計（env で受けてシェルで空文字判定）が `web-cd.yml` / `backend-ci.yml` に入っているか Phase 11 smoke で確認、入っていなければ Phase 12 で UT-05 へのフィードバック登録
- 案 D（`load-secrets-action`）を将来移行候補として Phase 12 unassigned-task-detection に登録
- secret 値の payload / runbook / Phase outputs への転記禁止を Phase 5 / 11 / 13 で繰り返し再確認
- 実 `gh secret set` / `gh variable set` / `gh api` PUT は Phase 13 ユーザー承認後に実行（user_approval_required: true）

## 7. 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない（base case ベース）
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12 / 13）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **上流 3 件（UT-05 / UT-28 / 01b）のいずれかが completed でない（重複明記 3/3）** — 例外なし
- 4 条件のいずれかに MAJOR が残る
- secret 値が payload / runbook / Phase outputs / bash 例の文字列に直書きされている
- 同名 repository-scoped と environment-scoped の併存禁止が運用ルールに無い
- API Token のスコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read を超える
- 1Password 正本 / GitHub 派生 の境界が state ownership に無い
- 動作確認手順に「Discord 未設定耐性確認」が無い

## 8. 上流タスク完了確認チェックポイント

| # | 上流タスク | 確認項目 | 確認手段 | GO 条件 |
| --- | --- | --- | --- | --- |
| 1 | UT-05 | `.github/workflows/{backend-ci,web-cd}.yml` が main branch にマージ済み / secret/variable 参照キーが Phase 2 と一致 | `gh pr list --search "UT-05" --state merged` + `grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml` | 4 件キーすべて参照 |
| 2 | UT-28 | Cloudflare Pages プロジェクト名確定 | `bash scripts/cf.sh pages project list` | プロジェクト名が判明 |
| 3 | 01b | Cloudflare API Token 発行済み（最小スコープ）/ Account ID 取得済み / 1Password エントリ存在 | `op item get "Cloudflare" --vault UBM-Hyogo` | api_token / account_id 両 field 存在 |

## 9. リスクと緩和策

| # | リスク | 影響 | 緩和策 | 担当 Phase |
| --- | --- | --- | --- | --- |
| R-1 | `CLOUDFLARE_API_TOKEN` 過剰スコープで漏洩時の影響範囲拡大 | production Cloudflare 全体への侵害 | 4 スコープのみで token 発行 / Token 名に環境・発行日 | 2 / 5 / 11 |
| R-2 | repository / environment スコープ同名併存で意図しない上書き | staging で production 値が誤参照 | 「同名併存禁止」を運用ルール化 / `gh secret list --env X` 確認 | 2 / 5 / 11 |
| R-3 | `if: secrets.X != ''` 評価不能で Discord 通知無音失敗 | 通知が届かず事故察知遅延 | env で受けてシェルで空文字判定する代替設計を確認、なければ Phase 12 で UT-05 にフィードバック | 11 / 12 |
| R-4 | 1Password vs GitHub Secrets 二重正本 drift（GitHub UI 直編集） | ローテーション時に 1Password 側が古いまま | 「1Password 正本 / GitHub 派生」を state ownership に明記 / GitHub UI 直編集禁止 / Last-Updated メモ | 2 / 12 |
| R-5 | secret 値が runbook / payload / Phase outputs / shell history に転記される | secret 漏洩 | AC-13 全段反映 / `op read` 一時環境変数 + `unset` / `gh secret list` 値マスク前提 | 全 Phase |
| R-6 | `CLOUDFLARE_PAGES_PROJECT` を誤って Secret に置きログマスクでデバッグ困難 | suffix 連結結果が CI ログから追えず | Variable で固定 / 理由を仕様書に明記 | 2 / 5 |
| R-7 | 上流 3 件未完了で先行配置 → 401 / 404 / 値ミスマッチ | CD 配線が連鎖的に red 化 | 上流完了確認を 3 重明記 + Phase 5 着手前ゲート | 1 / 2 / 3 / 5 |
| R-8 | environment 作成漏れで environment-scoped secret が反映されない | deploy-staging が secret 未取得で 401 | lane 2 で `gh api repos/.../environments/{staging,production} -X PUT` 必須化 | 2 / 5 |

## 10. open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | `CLOUDFLARE_API_TOKEN` を staging / production で別 token にするか同一 token にするか | Phase 5 | MVP は同一 token も可。漏洩影響限定優先なら別 token |
| 2 | `DISCORD_WEBHOOK_URL` のチャンネル分離（staging / production 別チャンネル）は必要か | Phase 11 | 通知が混ざるなら environment-scoped に切替 |
| 3 | 案 D（`load-secrets-action`）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降、CI セキュリティ強化フェーズ |
| 4 | `if: secrets.X != ''` 代替設計が UT-05 で組み込まれていない場合、本タスクで workflow に PR を出すか UT-05 にフィードバックするか | Phase 12 | フィードバックで UT-05 側別 PR が望ましい |
| 5 | 案 C（Terraform GitHub Provider）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降、IaC 化フェーズ |
| 6 | Last-Updated メモを 1Password Item Notes 以外（別 Vault Item）にするか | Phase 12 | MVP は Item Notes で充足 |

## 11. 引き渡し

Phase 4（テスト戦略）へ：
- 採用 base case = 案 A（`gh` CLI 直接実行 + 1Password 手動同期）
- 将来候補 = 案 D（`load-secrets-action`）/ 案 C（Terraform GitHub Provider）
- lane 1〜5 を Phase 4 のテスト戦略の対象に渡す
- notes 5 件（上流ゲート / Discord 評価不能代替 / op SA 移行候補 / secret 値転記禁止 / Phase 13 user_approval）
- リスク R-1〜R-8 を Phase 4 / 5 / 11 / 12 のテスト・実装・smoke・運用ドキュメントに分散
- open question 6 件を該当 Phase に register
- 上流 3 件完了が NO-GO 条件であることを Phase 5 着手前に再ゲート
