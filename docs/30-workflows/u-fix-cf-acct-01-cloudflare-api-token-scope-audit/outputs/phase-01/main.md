# Phase 1: 要件定義 — Cloudflare API Token スコープ最小化監査

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 1（要件定義） |
| 状態 | spec_created → planned |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #330（CLOSED, 再オープン要否は Phase 12 判断） |
| 作成日 | 2026-05-01 |

## 1. 目的

`CLOUDFLARE_API_TOKEN`（GitHub Environment Secret: `staging` / `production`）が
`cloudflare/wrangler-action@v3` 経由で実行する次の 3 経路に対して、
**必要最小権限のみが付与されている**ことを根拠付きで示し、過剰権限があれば最小化する。

1. `apps/api` の D1 マイグレーション適用 — `wrangler d1 migrations apply ubm-hyogo-db-{staging|prod} --env {staging|production} --remote`
2. `apps/api` の Workers deploy — `wrangler deploy --env {staging|production}`
3. `apps/web` の Pages deploy — `wrangler pages deploy .next --project-name=… --branch=…`

`CLOUDFLARE_ACCOUNT_ID` の Variable 化は上流タスク FIX-CF-ACCT-ID-VARS-001 で完了済みのため、
本タスクは **Token 値そのもの・付与権限の二点に責務を限定** する。

## 2. 上流前提と P50 チェック

| 確認項目 | 結果 | 根拠 / 対応 |
| --- | --- | --- |
| current branch に実装が存在 | No | Phase 5 で Token 再発行・Secret 更新を行う |
| 上流 FIX-CF-ACCT-ID-VARS-001 完了済み | Yes | `.github/workflows/backend-ci.yml` / `web-cd.yml` 双方が `vars.CLOUDFLARE_ACCOUNT_ID` を参照（Secret ではない）し Account ID 経路は green |
| 並列 U-FIX-CF-ACCT-02 と整合可能 | Yes | wrangler.toml の runtime warning 修正と Token 監査は責務排他、ADR は共有 |
| GitHub Issue #330 OPEN | No（CLOSED） | seed spec が未消化のため `spec_created` として再構築。Phase 12 で Issue 再オープン or 新規起票判断 |
| `gh secret list --env {staging,production}` で値が露出しない | Yes（GitHub の仕様） | AC-12 の前提として確定 |

`implementation_mode = "new"` を採用する。

## 3. 真の論点

> wrangler-action / D1 migration / Pages deploy が必要とする Cloudflare API Token の
> **必要最小権限集合は何か**。現行 Token はそれを超える権限を保持していないか。
> staging でどう非破壊に検証し、production にどう順序立てて適用し、
> 失敗時に rollback できる構造をどう作るか。

### 根本原因（潜在）

- Cloudflare の Token テンプレート「Edit Cloudflare Workers」は Workers Scripts / Workers KV / Account Settings まで広く付与するが、**D1:Edit / Pages:Edit を含まない**。これを「便利だから」と Custom 拡張すると、漏洩時に Account 全体の Workers / KV を編集可能な広域権限となる。
- Cloudflare API Token は **発行直後の 1 度しか平文表示されない**。再発行と Secret 更新の間に旧 Token を保持する必要があり、24h 以内の切替を前提に設計する。
- Token 値はログ表示できないため、Cloudflare Dashboard の Token 詳細ページ（Permissions / Resources セクション）で直接突合するしか監査手段がない。

### 派生論点

| # | 派生論点 | 本タスクでの取り扱い |
| --- | --- | --- |
| D1 | staging / production Token の値分離 | 採用（Phase 2 で T0〜T5 の適用順序に組み込む） |
| D2 | OIDC（GitHub OIDC → Cloudflare Trust Policy）による Token 廃止 | 不採用（Option D としてレビュー、ADR で将来課題化） |
| D3 | 用途別に scope 別 Token を複数発行 | 不採用（Option C、MVP では過剰最適化） |
| D4 | ADR 化方針 | 採用（U-FIX-CF-ACCT-02 と相互参照） |

## 4. Token vs OIDC 判断（短期 / 長期戦略）

| 観点 | API Token（短期・採用） | OIDC（長期・将来課題） |
| --- | --- | --- |
| wrangler-action v3 サポート | ネイティブ | 限定的（Trust Policy 整備が前提） |
| 発行・ローテーション | 手動 + Cloudflare Dashboard | 自動（短命 STS 風 token） |
| 漏洩時影響 | Token 失効までの window が残る | 発行から短時間で自動失効 |
| 導入コスト | 小（権限編集 + Secret 更新） | 大（Cloudflare 側 Trust Policy 整備） |
| MVP 採否 | **採用** | ADR で将来課題化（Option A 完了後に再評価） |

**判断**: 本タスクは「API Token の最小権限 + 値分離」で実装する。OIDC は Option D としてレビュー対象に残し、Phase 12 の `unassigned-task-detection.md` で起票候補として記録する。

## 5. 入力

- `cloudflare/wrangler-action@v3` が呼び出す API（Workers Scripts upload / D1 query / Pages deploy）
- `gh secret list --env {staging,production}` 出力（値は取得しない、存在のみ）
- 上流タスク完了後の workflow 実行ログ（Authentication error が解消されている前提）
- aiworkflow-requirements の `deployment-secrets-management.md`
- `.github/workflows/backend-ci.yml`（D1 migration / Workers deploy step）
- `.github/workflows/web-cd.yml`（Pages deploy step）
- `scripts/cf.sh`（直 wrangler 禁止ルールの正本ラッパ）

## 6. 必要最小権限の初期見積もり（Phase 2 へ引き継ぎ）

`backend-ci.yml` / `web-cd.yml` が触る resource を起点に、初期見積もりとして以下を列挙する。
正式な根拠付きマトリクスは Phase 2 で確定する。

| Resource | Permission | Scope | 初期根拠 |
| --- | --- | --- | --- |
| Account / Workers Scripts | Edit | Account | `wrangler deploy --env {staging|production}`（apps/api） |
| Account / D1 | Edit | Account | `wrangler d1 migrations apply ubm-hyogo-db-{staging|prod}`（DDL 実行） |
| Account / Cloudflare Pages | Edit | Account | `wrangler pages deploy .next --project-name=…`（apps/web） |
| Account / Account Settings | Read | Account | `wrangler whoami` 等の認証確認・Account 列挙 |

追加候補（**実測で必要と判明した場合のみ** Phase 2 でマトリクスに昇格）:

- `Account / Workers KV Storage:Edit` — `wrangler deploy` が KV binding メタ更新で要求した場合
- `User / User Details:Read` — `wrangler whoami` が Account Settings:Read だけでは失敗した場合

不要候補（**付与しない**、Phase 2 で根拠付きで除外）:

- `Zone / *`（DNS / SSL / Cache）— 本プロジェクトは Cloudflare DNS を直接編集しない
- `Account / Workers R2 Storage` — R2 未使用
- `Account / Workers Queues` — Queues 未使用
- `Account / Stream` / `Account / Images` — 未使用
- `Memberships`（広めテンプレート由来）— Account Settings:Read で代替可能

## 7. 要件レビュー思考法

### システム系（System Thinking）

- Token は **GitHub Actions と Cloudflare の境界に置かれる single point of compromise**。境界に置く資格情報の権限を最小化することは「境界の薄壁化」に相当し、システム全体の脆弱性密度を下げる。
- D1:Edit と Workers Scripts:Edit は独立した resource 群であり、`Edit Cloudflare Workers` テンプレートに D1 が含まれないことに注意。Pages:Edit は Workers Scripts:Edit を内包しない。
- staging / production は GitHub Environment で名前空間分離されており、Token 値も分離することで「環境境界」を二重化する。

### 戦略系（Strategic Thinking）

- 「広め Token を 1 本」と「scope 別 Token を複数」のトレードオフ。複数化は管理コスト増だが漏洩時の影響範囲を区切れる。MVP では「**環境分離（staging/prod）+ 用途は単一 Token**」を採用し、scope 別分割（Option C）と OIDC 移行（Option D）は ADR で将来課題化する。
- Token 値は人間が記憶せず、Cloudflare Dashboard を正本として **発行直後 1 回だけ Secret に投入** する運用にする。

### 問題解決系（Problem Solving）

- 「Token 値が見えない」制約に対し、Cloudflare Dashboard の Token 詳細ページの権限名一覧（値は写さない）を Phase 11 evidence の正本にする。
- 「権限を削りすぎて deploy 失敗」リスクは、staging で `--dry-run` 系の非破壊検証を T2 として明示することで吸収する。
- 「Token を失念」リスクには、旧 Token を最大 24h 並行保持する fail-safe 設計で対処する。

## 8. 依存関係・責務境界

| 区分 | 内容 |
| --- | --- |
| 本タスクの責務境界 | GitHub Environment Secret `CLOUDFLARE_API_TOKEN` の値再発行・権限最小化、Cloudflare 側 Token 詳細編集 |
| 触らない境界 | `CLOUDFLARE_ACCOUNT_ID`（Variable）、`CLOUDFLARE_PAGES_PROJECT`（Variable）、wrangler.toml の runtime warning（U-FIX-CF-ACCT-02 担当） |
| 状態所有権 | Cloudflare Token は Cloudflare Dashboard が正本、GitHub Secret は値ミラー先。両者の同期手順は Phase 5 ランブックで明文化 |
| 上流 | FIX-CF-ACCT-ID-VARS-001（完了）、UT-27（GitHub Secrets/Variables 配備） |
| 並列 | U-FIX-CF-ACCT-02（wrangler.toml runtime warning cleanup）— ADR 共有のみで blocking なし |
| 下流 | main ブランチの本番デプロイパイプライン全般（Token 最小化後も deploy が green であること） |

## 9. 価値とコストの均衡

| 項目 | 内容 |
| --- | --- |
| 初期価値 | 漏洩時のブラスト半径を最小化、監査可能性の向上、ADR による意思決定の文書化 |
| 導入コスト | Token 1 本の権限編集 + 値再発行（staging/prod 各 1 回）+ GitHub Environment Secret 更新 |
| 副次コスト | 旧 Token 失効までの 24h 内に切替必要、失敗時 rollback の段取り（Phase 2 で設計） |
| トレードオフ | 権限を絞りすぎると deploy 失敗 → staging dry-run 検証で吸収 |
| 結論 | priority HIGH に対して期待効果が支配的。採用 |

## 10. 不変条件 #5 の影響評価

不変条件 #5「D1 への直接アクセスは `apps/api` に閉じる」は **ランタイムのデータアクセス境界に関する規定** であり、CI/CD の Token 権限監査は対象外である。

- Token に `D1:Edit` を残すか削るかは「マイグレーションを CI（`apps/api` の wrangler.toml に紐づく）から実行できるか」のみに影響する。
- 本タスクは `apps/web` から D1 を直接呼ぶ経路を一切作らない。
- D1:Edit 権限は `apps/api` のマイグレーション目的でのみ Token に付与される。

よって **不変条件 #5 は侵害しない** ことを宣言する。

## 11. 受入条件（AC）マッピング

| AC | 確認方法 | Phase |
| --- | --- | --- |
| AC-1 | Cloudflare Dashboard の Token 詳細で付与権限を表化、必要集合との差分が 0 | Phase 2 / 11 |
| AC-2 | Phase 2 の権限マトリクスに正本 4 種（Workers Scripts:Edit / D1:Edit / Pages:Edit / Account Settings:Read）を根拠付きで記載。KV / User Details は実測時のみ追加候補 | Phase 2 |
| AC-3 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` が exit=0 | Phase 11 |
| AC-4 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` が exit=0 | Phase 11 |
| AC-5 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` が exit=0 | Phase 11 |
| AC-6 | production Token 適用順序（旧保持 → 切替 → 失効）が図解 | Phase 2 |
| AC-7 | rollback 手順が失敗ポイント別に記載 | Phase 2 |
| AC-8 | Phase 11 evidence の grep で Token 値文字列が 0 件、権限名・検証結果・日時のみ | Phase 11 |
| AC-9 | 本ファイル §10 で不変条件 #5 への影響なしを宣言 | Phase 1 |
| AC-10 | U-FIX-CF-ACCT-02 と Phase 2 ADR 方針が cross-reference | Phase 2 / 12 |
| AC-11 | 本ファイル §12 で 4 条件評価 PASS | Phase 1 |
| AC-12 | `gh secret list --env {staging,production}` で `CLOUDFLARE_API_TOKEN` の存在のみ確認、値（暗号化済み hash 含む）は出力されない | Phase 11 |

## 12. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | seed spec、上流（FIX-CF-ACCT-ID-VARS-001）、並列（U-FIX-CF-ACCT-02）の責務境界が排他に整理されている |
| 漏れなし | PASS | wrangler-action / D1 migration / Pages deploy の 3 経路すべてに権限と検証コマンドを割当済み（§6, §11） |
| 整合性 | PASS | Cloudflare 公式 Permissions Reference / wrangler-action README / `scripts/cf.sh` 運用ルールと一致 |
| 依存関係整合 | PASS | 上流完了済み・並列タスクは ADR 共有のみで blocking なし |

## 13. 完了条件

- [x] 必要最小権限の集合が初期見積もりとして列挙されている（§6）
- [x] staging 検証範囲（D1 list / api dry-run / web dry-run）が確定している（§11 AC-3〜5）
- [x] 不変条件 #5 への影響なしが宣言されている（§10）
- [x] 4 条件評価が PASS で記録されている（§12）
- [x] Token vs OIDC の短期/長期判断が明示されている（§4）

## 14. 成果物

- 本ファイル: `outputs/phase-01/main.md`
- 引き継ぎ先: Phase 2（権限マトリクス確定 / 適用順序 / rollback 設計）
