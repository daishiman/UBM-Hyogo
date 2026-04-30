# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | serial（01b / UT-05 完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | implementation / visualEvidence: NON_VISUAL / scope: cloudflare_pages_projects_creation |
| 親 Issue | #48 |

## 目的

`web-cd.yml` の `dev` push / `main` push 経路が空振りせず実稼働するための Cloudflare Pages プロジェクト 2 件（production: `ubm-hyogo-web` / staging: `ubm-hyogo-web-staging`）の作成要件を確定する。要件の柱は (i) `production_branch` の正しい配線、(ii) `compatibility_date` / `compatibility_flags` の Workers 同期、(iii) OpenNext 採用環境におけるアップロード成果物ディレクトリの確定、(iv) 命名規則「production = `<base>` / staging = `<base>-staging`」と Variable `CLOUDFLARE_PAGES_PROJECT` への引き渡し、(v) Pages Git 連携 OFF 方針 の 5 点。本 Phase は **要件確定** に閉じ、実プロジェクト作成（`bash scripts/cf.sh` 経由の `wrangler pages project create` 等）は Phase 13 ユーザー承認後の別オペレーションで実施する。MVP の実装手段は **`bash scripts/cf.sh` ラッパー経由 + Cloudflare Dashboard 補助確認** に固定する。

## 真の論点 (true issue)

- 「Pages プロジェクトを作るか否か」ではなく、**「(a) `production_branch` 取り違えで preview 扱いになる事故、(b) Workers と Pages の `compatibility_date` ドリフトで共有 util が片側だけ壊れる事故、(c) OpenNext のビルド出力構造（`.open-next/`）と現行 workflow の `pages deploy .next` の不整合、(d) 命名揺れ（`<base>` vs `<base>-staging`）と Variable 値の二重訂正、(e) Pages Git 連携 ON による GitHub Actions との二重 deploy、を同時に塞ぐ仕様化」**が本タスクの本質。
- 副次的論点として、(1) staging / production を別 token / 同一 token のどちらで運用するか（UT-27 観点）、(2) OpenNext 切替が必要な場合に UT-05 にフィードバックする境界、(3) Pages プロジェクトを `wrangler` 経由で作るか Dashboard で作るか。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント / API Token / Account ID 取得済み | Phase 2 のコマンド草案で `CLOUDFLARE_API_TOKEN` / Account 認証の前提として参照 |
| 上流（必須） | UT-05（CI/CD パイプライン実装） | `web-cd.yml` のプロジェクト名参照仕様（`${{ vars.CLOUDFLARE_PAGES_PROJECT }}` + `-staging` suffix 連結）が確定していること | Phase 2 命名規則で UT-05 の連結仕様と整合させる |
| 関連 | `apps/web/wrangler.toml` | `name` / `compatibility_date` / `compatibility_flags` / `pages_build_output_dir` の現状 | Phase 2 設定一致表で参照 |
| 関連 | `apps/api/wrangler.toml` | Workers 側 `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` | Phase 2 同期表で参照 |
| 関連 | `apps/web/open-next.config.ts` | OpenNext 採用の事実 | Phase 2 アップロード判定で参照 |
| 下流 | UT-27（GitHub Secrets / Variables 配置） | 本タスクで命名確定する `CLOUDFLARE_PAGES_PROJECT` の値（`ubm-hyogo-web`） | Phase 13 完了後に UT-27 が Variable 値として受け取る |
| 下流 | UT-06（本番デプロイ実行） | プロジェクト作成済みであること | main → production deploy の前提 |
| 下流 | UT-16（カスタムドメイン） | プロジェクト存在 | カスタムドメインバインドの前提 |
| 下流 | UT-29（CD 後スモーク） | プロジェクト名 | スモーク URL `https://<project>.pages.dev` 組み立てに利用 |

## 上流タスク完了確認 inventory（carry-over 確認）

| タスク | 期待状態 | 本タスクが受け取る成果物 | 確認手段 |
| --- | --- | --- | --- |
| 01b | completed | Cloudflare API Token（最小スコープ）/ Account ID / 1Password Environments エントリ | `op item get "Cloudflare" --vault UBM-Hyogo > /dev/null` / `bash scripts/cf.sh whoami` |
| UT-05 | completed（または該当 PR merged） | `.github/workflows/web-cd.yml` がブランチ `dev`/`main` で `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev`（または production 相当）の形で deploy するキー仕様 | `grep -nE "pages deploy|project-name" .github/workflows/web-cd.yml` |

> 上流 2 件のうち 1 件でも未完了の場合、本タスク Phase 5 への移行は NO-GO（Phase 3 で再ゲート）。

## 依存タスク順序（上流 2 件完了必須）— 重複明記 1/3

> **01b（Cloudflare base bootstrap）/ UT-05（CI/CD パイプライン実装）の 2 件すべてが completed であることが本タスクの必須前提である。**
> いずれか未完了の場合、(a) `wrangler pages project create` を呼ぶための API Token が確定しない、(b) Pages プロジェクト命名と `web-cd.yml` の参照キーが乖離する、のいずれかにより配置直後に CD が 401 / 8000017 (Project not found) / 命名ミスマッチを起こす。Phase 5 着手前に NO-GO ゲートを置く。

## 価値とコスト

- 価値: `web-cd.yml` の dev/main push 経路を実稼働化し、UT-06（本番デプロイ）/ UT-16（カスタムドメイン）/ UT-29（CD 後スモーク）の前提を確定させる。Workers 側 (`apps/api/wrangler.toml`) は staging/production が定義済みなのに対し、Pages 側のプロジェクト分離が未整備で deploy が空振りする現状を解消する。
- コスト: Pages プロジェクト作成は `wrangler pages project create` 2 回 + 互換性フラグ確認 + Git 連携 OFF 確認 程度で、所要 5〜10 分。OpenNext 整合性判定（`.next` のままでよいか / `.open-next/...` への切替が必要か）が論点になり、切替が必要なら UT-05 への別 PR フィードバックコストが追加で発生する。
- 機会コスト: Terraform Cloudflare Provider 化と比較すると軽量で、既存の `scripts/cf.sh` + 1Password 運用と整合的。IaC 化は将来の別タスクで再評価可能。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev/main push → Pages deploy green の経路が成立し、UT-06 / UT-16 / UT-27 / UT-29 の前提が確定する |
| 実現性 | PASS | `bash scripts/cf.sh` 経由の `wrangler pages project create` は 1Password + esbuild 解決 + Node 24 を保証済み。追加依存ゼロ |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与）。CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」と整合。`apps/api/wrangler.toml` の `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` を Pages 側に同期 |
| 運用性 | PASS | Pages Git 連携 OFF で GitHub Actions と二重起動回避、命名規則「production = `<base>` / staging = `<base>-staging`」固定で UT-27 への引き渡しが明快、`production_branch` を環境ごとに別配線して preview 事故を防止 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| Pages プロジェクト名（production） | Cloudflare アカウント | `ubm-hyogo-web`（`apps/web/wrangler.toml` の `name` と一致） |
| Pages プロジェクト名（staging） | Cloudflare アカウント | `ubm-hyogo-web-staging`（`apps/web/wrangler.toml` の `[env.staging] name` と一致） |
| `production_branch`（production プロジェクト） | Cloudflare 側 | `main` |
| `production_branch`（staging プロジェクト） | Cloudflare 側 | `dev` |
| `compatibility_date` | Pages / Workers 共通 | `2025-01-01`（Workers 側と完全一致） |
| `compatibility_flags` | Pages / Workers 共通 | `["nodejs_compat"]` |
| Variable `CLOUDFLARE_PAGES_PROJECT` の値 | UT-27 へ引き渡す | `ubm-hyogo-web`（suffix なし。`web-cd.yml` 側で `-staging` を連結） |
| Pages の Git 連携 | Cloudflare Pages 設定 | OFF（GitHub Actions 主導 deploy と二重起動しないため） |
| CLI 経路 | コマンド系列 | `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行禁止） |
| commit メッセージ（Phase 13 承認後 / 仕様書側） | git | `chore(infra): create cloudflare pages projects spec [UT-28]` |

## 実行タスク

1. 親タスク仕様（`docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md`）の §目的〜§完了条件・§苦戦箇所を写経し、本ワークフロー Phase 1〜13 に分解する（完了条件: AC-1〜AC-15 が `index.md` と一致）。
2. タスク種別を `implementation` / `visualEvidence: NON_VISUAL` / `scope: cloudflare_pages_projects_creation` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. 上流タスク（01b / UT-05）完了を必須前提として 3 箇所（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件）に重複明記する設計を予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。
4. 苦戦箇所 1〜5 を Phase 2 のリスク表 R-1〜R-5 に紐付ける（完了条件: 5 件すべてに対応 Phase が指定）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. 本ワークフローのスコープが「タスク仕様書整備に閉じ、実プロジェクト作成は Phase 13 ユーザー承認後の別オペレーションで実施」することを Phase 1 §スコープで固定する（完了条件: 本仕様書 §スコープにその旨が記述）。
7. NON_VISUAL タスク種別を明示し、UI スクリーンショット成果物を Phase 11 / 12 で求めない方針を確定する（完了条件: 本 Phase §タスク分類で明記）。
8. OpenNext アップロード成果物の判定基準（`.next` のまま継続するか `.open-next/...` 切替を UT-05 にフィードバックするか）を Phase 2 で決め切る前提を本 Phase で予約する（完了条件: AC-5 / 苦戦箇所 §1 が Phase 2 のリスクと判定基準にマップ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | 親タスク仕様（写経元） |
| 必須 | .github/workflows/web-cd.yml | プロジェクト名参照仕様の確認 |
| 必須 | apps/web/wrangler.toml | Pages 側互換性設定の整合確認 |
| 必須 | apps/web/open-next.config.ts | OpenNext 採用時のビルド出力構造確認 |
| 必須 | apps/api/wrangler.toml | Workers 側 `compatibility_date` / `compatibility_flags` の参照 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | デプロイ設計の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CD ワークフロー仕様の正本 |
| 必須 | CLAUDE.md（Cloudflare 系 CLI 実行ルール） | `bash scripts/cf.sh` 経由運用 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase outputs 骨格（Phase 1〜13 の main.md と NON_VISUAL / Phase 12 必須補助成果物）の作成方針
- 上流 2 件（01b / UT-05）完了必須前提の 3 重明記
- Pages プロジェクト 2 件の命名・`production_branch` 設計
- `nodejs_compat` フラグ ON 化と `compatibility_date` Workers (`2025-01-01`) 同期
- OpenNext アップロード成果物（`.next` vs `.open-next/...`）の判定基準と UT-05 へのフィードバック条件
- Pages Git 連携 OFF 方針の明文化
- Variable `CLOUDFLARE_PAGES_PROJECT` 値（`ubm-hyogo-web` = production 名 suffix なし）の UT-27 への引き渡しルール
- `bash scripts/cf.sh` 経由の `wrangler pages project create` コマンド草案の仕様レベル定義
- 動作確認手順（dev push → staging deploy success / main push → production deploy success / project list 確認）の仕様化
- 不変条件「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」の AC 化
- secret / token 値・実プロジェクト URL を payload / runbook / Phase outputs に転記しない方針

### 含まない

- 実 `wrangler pages project create` の実行（Phase 13 ユーザー承認後の別オペレーション）
- ワークフローファイル自体の編集（UT-05）。OpenNext 切替が必要なら UT-05 へフィードバック
- Cloudflare 側 API Token 発行作業（01b）
- GitHub Secrets / Variables の配置（UT-27）
- Cloudflare Secrets 配置（UT-25）
- 本番デプロイ実行（UT-06）
- カスタムドメイン本登録（UT-16）
- Workers プロジェクト（`apps/api`）の作成（既存 `wrangler.toml` 経由で `wrangler deploy` 時に自動登録）
- Terraform Cloudflare Provider 化（将来 IaC 化フェーズ）
- 自動 commit / push / PR 発行

## タスク分類

- **NON_VISUAL**（UI 変更なし。Cloudflare Dashboard 操作はあり得るが本 PR 側の UI 変更ではない）。
- スクリーンショット / 視覚的 evidence 成果物は Phase 11 / 12 で要求しない。
- evidence は `bash scripts/cf.sh pages project list`（プロジェクト 2 件存在の確認）/ `web-cd.yml` の run URL（緑判定）/ `gh run view` の deploy step ログに集約する。

## 実行手順

### ステップ 1: 親タスク仕様の写経

- `UT-28-cloudflare-pages-projects-creation.md` §目的〜§完了条件 + §苦戦箇所を本仕様書の構造に分解し、`index.md` の AC-1〜AC-15 を確定する。

### ステップ 2: 真の論点と依存順序の固定

- 上流 2 件完了必須を Phase 1 / 2 / 3 で重複明記する設計を確定。

### ステップ 3: 4 条件評価のロック

- 4 条件すべてを PASS で確定。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `implementation` / `NON_VISUAL` / `cloudflare_pages_projects_creation` を Phase 1 で固定し、`artifacts.json.metadata` と整合（artifacts.json は Phase 4 以降の整備時に作成）。

### ステップ 5: 苦戦箇所 1〜5 の対応 Phase 割り当て

- §1 OpenNext アップロード先のぶれ → Phase 2 リスク R-1 + アップロード判定基準 + Phase 12 で UT-05 フィードバック登録条件
- §2 `production_branch` 落とし穴 → Phase 2 リスク R-2 + 設定一致表に環境別 `production_branch` 明記
- §3 `compatibility_date` Workers 同期 → Phase 2 リスク R-3 + 設定一致表に同一値固定
- §4 命名揺れ → Phase 2 リスク R-4 + 命名規則表 + UT-27 へ渡す Variable 値固定
- §5 Pages 自動 Git 連携二重起動 → Phase 2 リスク R-5 + Git 連携 OFF 既定方針

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 / 設定一致表 / 命名規則 / コマンド草案 / OpenNext 判定基準を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-15 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-15 を使用 |
| Phase 11 | dev push → staging deploy green / main push → production deploy green / `pages project list` 確認 smoke の実走基準 |
| Phase 12 | OpenNext 切替が必要な場合の UT-05 フィードバックを unassigned-task-detection に登録 |
| Phase 13 | 実 `wrangler pages project create` を user_approval_required: true で実行する根拠として AC-1〜AC-9 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 を触らない。違反なし。
- CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」: コマンド草案がラッパー経由になっているか。
- 順序事故回避: 上流 2 件未完了で実行しない設計が 3 箇所に明記されるか。
- `production_branch` の環境別配線: production=main / staging=dev が表化されているか。
- `compatibility_date` Workers 同期: `2025-01-01` で一致しているか。
- OpenNext 整合性: `.next` のまま継続するか切替するかの判定基準が Phase 2 にあるか。
- 命名規則: `<base>` / `<base>-staging` の suffix 方式と Variable 値の整合がとれているか。
- Pages Git 連携 OFF: 二重 deploy 防止が運用ルールに明記されるか。
- NON_VISUAL: スクリーンショット要件が混入していないか。
- 値転記禁止: API Token / Account ID 等の値が Phase 成果物に直書きされていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 親タスク仕様の写経と AC-1〜AC-15 確定 | 1 | completed | index.md と一致 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致（本 workflow で作成済み） |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | 上流 2 件完了前提の 3 重明記設計 | 1 | completed | Phase 2 / 3 で再記述 |
| 5 | 苦戦箇所 1〜5 の対応 Phase 割り当て | 1 | completed | 5 件すべて受け皿あり（Phase 2 R-1〜R-5） |
| 6 | スコープ「Phase 13 ユーザー承認後 プロジェクト作成」固定 | 1 | completed | 含む / 含まない明記 |
| 7 | NON_VISUAL タスク分類明示 | 1 | completed | 本 Phase §タスク分類 |
| 8 | 上流 carry-over inventory の記録 | 1 | completed | 本 Phase §上流タスク完了確認 inventory |

## 苦戦箇所サマリ（親仕様 §苦戦箇所・知見 写経）

| # | 苦戦箇所 | 受け皿 |
| --- | --- | --- |
| 1 | `@opennextjs/cloudflare` 採用時のアップロード先のぶれ（`.next` vs `.open-next/...`） | Phase 2 リスク R-1 + アップロード判定基準 + Phase 12 UT-05 フィードバック登録条件 |
| 2 | `production_branch` の取り違えで preview 扱いになる事故 | Phase 2 リスク R-2 + 設定一致表（環境別配線） |
| 3 | `compatibility_date` の Workers との同期ずれ | Phase 2 リスク R-3 + 設定一致表（同一値固定） |
| 4 | プロジェクト命名揺れ（`<base>` vs `<base>-staging` 二重訂正） | Phase 2 リスク R-4 + 命名規則表 + UT-27 引き渡し Variable 値固定 |
| 5 | Pages 自動 Git 連携と GitHub Actions の二重 deploy | Phase 2 リスク R-5 + Git 連携 OFF 既定方針 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所 / NON_VISUAL 分類 / 上流 carry-over inventory）。Phase 4 以降で本格整備 |
| メタ | artifacts.json | Phase 1 状態の更新（本 workflow で作成済み） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「(a)〜(e) 5 リスクを同時に塞ぐ仕様化」に再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: cloudflare_pages_projects_creation` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実プロジェクト作成は Phase 13 ユーザー承認後の別オペレーション」が明記されている
- [x] AC-1〜AC-15 が `index.md` と完全一致している
- [x] 上流 2 件（01b / UT-05）完了前提が依存境界で明記されている（3 重明記の 1 箇所目）
- [x] 苦戦箇所 1〜5 が全件 受け皿 Phase に割り当てられている
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている
- [x] CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」が運用ルールとして AC-14 に反映されている
- [x] NON_VISUAL タスク分類が明示されている
- [x] 上流 carry-over inventory が記録されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置予定（Phase 4 以降で本体生成）
- 苦戦箇所 1〜5 が全件 AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`（Phase 4 以降で同期）

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 5 リスク同時封じ + 上流 2 件完了前提
  - Pages プロジェクト 2 件（production: `ubm-hyogo-web` / staging: `ubm-hyogo-web-staging`）の命名と `production_branch`（main / dev）配線
  - `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` の Workers 同期
  - OpenNext 採用環境のアップロード成果物判定基準（`.next` 継続 / `.open-next/...` 切替の境界）
  - Pages Git 連携 OFF 既定方針
  - Variable `CLOUDFLARE_PAGES_PROJECT` 値（`ubm-hyogo-web` = production 名 suffix なし）の UT-27 引き渡しルール
  - `bash scripts/cf.sh` 経由の `wrangler pages project create` コマンド草案
  - 4 条件評価 全 PASS の根拠
  - NON_VISUAL タスク分類
- ブロック条件:
  - 上流 2 件のいずれかが未完了
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-15 が index.md と乖離
  - 苦戦箇所 1〜5 のいずれかに受け皿 Phase が無い
