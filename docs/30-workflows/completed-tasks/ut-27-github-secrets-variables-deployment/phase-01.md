# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | serial（UT-05 / UT-28 / 01b 完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / scope: github_secrets_variables_cd_enablement |
| 親 Issue | #47 |

## 目的

`backend-ci.yml` / `web-cd.yml` の `deploy-staging` / `deploy-production` ジョブが空振りせず実稼働するための GitHub Secrets / Variables 3+1 件（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` + `CLOUDFLARE_PAGES_PROJECT`）の配置要件を確定する。本 Phase は **要件確定** に閉じ、実 secret 配置（`gh secret set` / `gh variable set` / `gh api` の environment 作成）は Phase 13 ユーザー承認後の別オペレーションで実施する。MVP の実装手段は **`gh` CLI 直接実行 + 1Password 手動同期** に固定する。

## 真の論点 (true issue)

- 「Secrets を置くか否か」ではなく、**「(a) repository-scoped と environment-scoped の混在事故、(b) Variable と Secret の判定ミスによる CI ログマスク、(c) `if: secrets.X != ''` の評価不能で生まれる無音失敗、(d) 1Password と GitHub Secrets の二重正本 drift、(e) `CLOUDFLARE_API_TOKEN` のスコープ過剰付与による漏洩時影響拡大、を同時に塞ぐ仕様化」**が本タスクの本質。
- 副次的論点として、(1) staging / production 両 environment の整備粒度、(2) 1Password → GitHub の同期検証手段、(3) 将来の `op` サービスアカウント化への移行ポイント。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | UT-05（CI/CD パイプライン実装） | workflow 側で参照される secret/variable キー名・スコープ確定 | Phase 1 / 2 / 3 で「上流未完了 = NO-GO」を 3 重明記 |
| 上流（必須） | UT-28（Cloudflare Pages プロジェクト作成） | `CLOUDFLARE_PAGES_PROJECT` の値（プロジェクト名）確定 | Phase 2 Variables 表で値の出所として参照 |
| 上流（必須） | 01b-parallel-cloudflare-base-bootstrap | API Token 発行 / Account ID 取得 | Phase 2 Secrets 表で値の出所として参照 |
| 並列 | UT-25（Cloudflare Secrets / Service Account JSON deploy） | Cloudflare 側の secret 配置 | 本タスクは GitHub 側に閉じ責務分離 |
| 関連 | CLAUDE.md「シークレット管理」 | 1Password 正本ポリシー | 同期手順の前提 |
| 下流 | UT-06（本番デプロイ実行） | 本タスクで配置済みの Secrets / Variables | production deploy が走る前提 |
| 下流 | UT-29（CD 後スモーク） | `CLOUDFLARE_PAGES_PROJECT` の値 | スモーク URL 組み立てに再利用 |

## 上流タスク完了確認 inventory（carry-over 確認）

| タスク | 期待状態 | 本タスクが受け取る成果物 | 確認手段 |
| --- | --- | --- | --- |
| UT-05 | completed（または該当 PR merged） | `.github/workflows/backend-ci.yml` / `web-cd.yml` の secret/variable 参照キー確定 | `grep -nE "secrets\.\|vars\." .github/workflows/{backend-ci,web-cd}.yml` |
| UT-28 | completed | Cloudflare Pages プロジェクト名（例: `ubm-hyogo-web`） | Cloudflare ダッシュボード or `bash scripts/cf.sh pages project list` |
| 01b | completed | Cloudflare API Token（最小スコープ）、Cloudflare Account ID | 1Password Environments エントリの存在確認 |

> 上流 3 件のうち 1 件でも未完了の場合、本タスク Phase 5 への移行は NO-GO（Phase 3 で再ゲート）。

## 依存タスク順序（上流 3 件完了必須）— 重複明記 1/3

> **UT-05（CI/CD パイプライン実装）/ UT-28（Cloudflare Pages プロジェクト作成）/ 01b（Cloudflare base bootstrap）の 3 件すべてが completed であることが本タスクの必須前提である。**
> いずれか未完了の場合、配置すべき secret/variable のキー名・値・スコープが確定しない、または配置しても CD 側が参照しない / 値ミスマッチで 401 / 404 を起こすため、Phase 5 着手前に NO-GO ゲートを置く。

## 価値とコスト

- 価値: CD 配線（UT-05）が完成しても秘匿値が無ければ deploy ジョブ全体が空振りに終わる構造を解消し、`dev` push → staging 自動デプロイ / `main` push → production 自動デプロイ の経路を実稼働化する。後続 UT-06（本番デプロイ）/ UT-29（CD 後スモーク）の前提が成立する。
- コスト: secret/variable 配置作業は `gh` CLI で 5〜10 コマンド程度。Environments 作成は最大 2 件。1Password 同期は手動 5 分程度。実装コスト自体は小だが、スコープ判定 / 1Password 正本維持 / API Token 最小化を誤ると漏洩時の影響範囲が拡大するため、仕様の網羅度が価値を決める。
- 機会コスト: Terraform GitHub Provider 化と比較すると軽量で、既存の 1Password + `gh` CLI 運用と整合的。IaC 化は将来の別タスクで再評価可能。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev/main push → CD green の経路が成立し、UT-06 / UT-29 の前提が確定する |
| 実現性 | PASS | `gh` CLI + 1Password 手動同期は既存運用範囲。Environments 作成も `gh api` で対応可能 |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与）。CLAUDE.md「1Password Environments 正本」「実値を `.env` に書かない」と整合 |
| 運用性 | PASS | 1Password を正本として明記、Environments 既定で混在事故を回避、API Token 最小スコープで漏洩影響限定 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| Secret 名 | GitHub Actions Secrets | UPPER_SNAKE_CASE（既存 workflow 参照と完全一致） |
| Variable 名 | GitHub Actions Variables | UPPER_SNAKE_CASE（既存 workflow 参照と完全一致） |
| Environment 名 | GitHub Environments | `staging` / `production`（lowercase、既存 workflow `environment: name:` と一致） |
| 1Password 参照 | `.env` の値 | `op://Vault/Item/Field` 形式（CLAUDE.md ルール準拠） |
| CLI 経路 | `gh` CLI | `gh secret set NAME --body ...` / `gh variable set NAME --body ...` / `gh api repos/.../environments/NAME -X PUT` |
| API Token 名（Cloudflare 側） | `ubm-hyogo-cd-{env}-{yyyymmdd}` 形式（用途・環境・発行日を含む） |
| commit メッセージ（Phase 13 承認後） | `chore(cd): deploy github secrets and variables [UT-27]` |

## 実行タスク

1. 親タスク仕様（`docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md`）の §目的〜§完了条件・§苦戦箇所を写経し、本ワークフロー Phase 1〜13 に分解する（完了条件: AC-1〜AC-15 が `index.md` と一致）。
2. タスク種別を `implementation` / `visualEvidence: NON_VISUAL` / `scope: github_secrets_variables_cd_enablement` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. 上流タスク（UT-05 / UT-28 / 01b）完了を必須前提として 3 箇所（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件）に重複明記する設計を予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。
4. 苦戦箇所 1〜6 を Phase 1 苦戦サマリ または Phase 2 リスク表に紐付ける（完了条件: 6 件すべてに対応 Phase が指定）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. 本ワークフローのスコープが「タスク仕様書整備に閉じ、実 secret 配置は Phase 13 ユーザー承認後の別オペレーションで実施」することを Phase 1 §スコープで固定する（完了条件: 本仕様書 §スコープにその旨が記述）。
7. NON_VISUAL タスク種別を明示し、UI スクリーンショット成果物を Phase 11 / 12 で求めない方針を確定する（完了条件: 本 Phase §タスク分類で明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | 親タスク仕様（写経元） |
| 必須 | .github/workflows/backend-ci.yml | secret/variable 参照キーの確認 |
| 必須 | .github/workflows/web-cd.yml | secret/variable 参照キーの確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CI/CD 仕様（Secrets 要件）正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 配置マトリクス正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | 1Password ↔ GitHub 同期方針 |
| 必須 | CLAUDE.md（シークレット管理セクション） | 1Password 正本ポリシー |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase outputs 骨格（Phase 1〜13 の main.md と NON_VISUAL / Phase 12 必須補助成果物）の作成
- 上流 3 件（UT-05 / UT-28 / 01b）完了必須前提の 3 重明記
- repository-scoped vs environment-scoped 配置決定マトリクスの確定
- Secret 一覧（3 件）+ Variable 一覧（1 件）の固定
- 1Password Environments → GitHub Secrets / Variables 同期手順の運用ドキュメント追記方針
- API Token 最小スコープ方針（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）
- `gh` CLI コマンド草案の仕様レベル定義
- 動作確認手順（dev push → CD green / Discord 通知 / 未設定耐性）の仕様化
- secret 値転記禁止方針の AC 化

### 含まない

- 実 `gh secret set` / `gh variable set` / `gh api` の実行（Phase 13 ユーザー承認後の別オペレーション）
- ワークフローファイル自体の編集（UT-05）
- Cloudflare 側 API Token 発行作業（01b）
- Cloudflare Pages プロジェクト命名作業（UT-28）
- Cloudflare Secrets 配置（UT-25）
- 本番デプロイ実行（UT-06）
- 1Password Vault 構造変更
- `op` サービスアカウント化（将来タスク。本タスクは方針言及のみ）
- Terraform GitHub Provider 化（将来 IaC 化フェーズ）
- 自動 commit / push / PR 発行

## タスク分類

- **NON_VISUAL**（UI 変更なし）。
- スクリーンショット / 視覚的 evidence 成果物は Phase 11 / 12 で要求しない。
- evidence は `gh secret list` / `gh variable list` / `gh api repos/.../environments/.../secrets` の出力ログ（値はマスク済み）と、CD ワークフローの run URL（緑判定）に集約する。

## 実行手順

### ステップ 1: 親タスク仕様の写経

- `UT-27-github-secrets-variables-deployment.md` §目的〜§完了条件 + §苦戦箇所を本仕様書の構造に分解し、`index.md` の AC-1〜AC-15 を確定する。

### ステップ 2: 真の論点と依存順序の固定

- 上流 3 件完了必須を Phase 1 / 2 / 3 で重複明記する設計を確定。

### ステップ 3: 4 条件評価のロック

- 4 条件すべてを PASS で確定。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `implementation` / `NON_VISUAL` / `github_secrets_variables_cd_enablement` を Phase 1 で固定し、`artifacts.json.metadata` と整合。

### ステップ 5: 苦戦箇所 1〜6 の対応 Phase 割り当て

- §1 Environments vs repository スコープ → Phase 2 配置決定マトリクス
- §2 Variable vs Secret 判定 → Phase 2 Variables 一覧 + 理由明記
- §3 `if: secrets.X != ''` 評価不能 → Phase 2 動作確認手順 + Phase 11 smoke
- §4 1Password 二重正本 → Phase 2 同期手順 + Phase 12 運用ドキュメント
- §5 API Token スコープ最小化 → Phase 2 Secrets 表「最小スコープ」列
- §6 secret 値転記禁止 → Phase 1 / 2 / 11 / 13 で全段に AC 反映

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 / 配置マトリクス / 同期手順 / `gh` CLI 草案を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-15 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-15 を使用 |
| Phase 11 | dev push → CD green / Discord 通知 / 未設定耐性 smoke の実走基準 |
| Phase 13 | 実 secret/variable 配置を user_approval_required: true で実行する根拠として AC-1〜AC-9 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 を触らない。違反なし。
- CLAUDE.md「`.env` に実値を書かない / 1Password 経由」: secret 値の取り扱いに準拠。
- 順序事故回避: 上流 3 件未完了で実行しない設計が 3 箇所に明記されるか。
- 配置マトリクス: repository vs environment の決定根拠が Secret / Variable ごとに明記されるか。
- API Token 最小化: Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read 以外を含まないか。
- 二重正本: 1Password 正本 / GitHub Secrets 派生 の境界が明記されるか。
- secret 値転記禁止: payload / runbook / Phase outputs に値が一切載らないか。
- NON_VISUAL: スクリーンショット要件が混入していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 親タスク仕様の写経と AC-1〜AC-15 確定 | 1 | completed | index.md と一致 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | 上流 3 件完了前提の 3 重明記設計 | 1 | completed | Phase 2 / 3 で再記述 |
| 5 | 苦戦箇所 1〜6 の対応 Phase 割り当て | 1 | completed | 6 件すべて受け皿あり |
| 6 | スコープ「Phase 13 ユーザー承認後 secret 配置」固定 | 1 | completed | 含む / 含まない明記 |
| 7 | NON_VISUAL タスク分類明示 | 1 | completed | 本 Phase §タスク分類 |
| 8 | 上流 carry-over inventory の記録 | 1 | completed | 本 Phase §上流タスク完了確認 inventory |

## 苦戦箇所サマリ（親仕様 §苦戦箇所・知見 写経）

| # | 苦戦箇所 | 受け皿 |
| --- | --- | --- |
| 1 | Environments スコープと repository スコープの違い（同名上書き事故） | Phase 2 配置決定マトリクス + Environments 既定方針 |
| 2 | `CLOUDFLARE_PAGES_PROJECT` を Secret ではなく Variable にする | Phase 2 Variables 一覧 + Variable 化理由明記 |
| 3 | `if: secrets.X != ''` 評価不能 → 通知ステップ無音失敗 | Phase 2 動作確認手順 + Phase 11 smoke（env 受け取り + シェル空文字判定） |
| 4 | 1Password Environments 正本 vs GitHub Secrets 派生 の二重正本 drift | Phase 2 同期手順 + Phase 12 運用ドキュメント追記 |
| 5 | `CLOUDFLARE_API_TOKEN` のスコープ過剰付与 | Phase 2 Secrets 表「最小スコープ」列 + Token 命名規則 |
| 6 | secret 値の payload / runbook / ログへの転記事故 | AC-13 として全段に反映 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所 / NON_VISUAL 分類 / 上流 carry-over inventory） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「(a)〜(e) 5 リスクを同時に塞ぐ仕様化」に再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: github_secrets_variables_cd_enablement` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実 secret 配置は Phase 13 ユーザー承認後の別オペレーション」が明記されている
- [x] AC-1〜AC-15 が `index.md` と完全一致している
- [x] 上流 3 件（UT-05 / UT-28 / 01b）完了前提が依存境界で明記されている（3 重明記の 1 箇所目）
- [x] 苦戦箇所 1〜6 が全件 受け皿 Phase に割り当てられている
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている
- [x] NON_VISUAL タスク分類が明示されている
- [x] 上流 carry-over inventory が記録されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 1〜6 が全件 AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 5 リスク同時封じ + 上流 3 件完了前提
  - Secret 一覧（3 件）+ Variable 一覧（1 件）の最低限内訳
  - repository vs environment 配置決定マトリクスの埋めるべき軸
  - 1Password 正本 / GitHub 派生 の境界
  - API Token 最小スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）
  - `gh` CLI コマンド草案の必要セット
  - 4 条件評価 全 PASS の根拠
  - NON_VISUAL タスク分類
- ブロック条件:
  - 上流 3 件のいずれかが未完了
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-15 が index.md と乖離
  - 苦戦箇所 1〜6 のいずれかに受け皿 Phase が無い
