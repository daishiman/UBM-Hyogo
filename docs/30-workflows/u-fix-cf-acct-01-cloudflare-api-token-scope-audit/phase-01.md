# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 1 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #330（CLOSED） |

## 実行タスク

1. seed spec と上流タスク（FIX-CF-ACCT-ID-VARS-001）の前提を確認する。
2. Token に必要な最小権限の境界と、staging で安全に検証する範囲を整理する。
3. 要件レビュー思考法（システム系 / 戦略系 / 問題解決系）を適用し、4 条件評価で確定する。

## 目的

`CLOUDFLARE_API_TOKEN` の付与権限を Cloudflare 公式の Permissions リファレンスと wrangler-action の実呼び出し API に対する最小集合で表化し、過剰権限がある場合は最小化する。staging で D1 / Workers / Pages の deploy を順に検証してから production に適用するための要件を確定する。

## 参照資料

- `index.md`
- `artifacts.json`
- 上流 seed: `../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md`
- 並列タスク: `../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `scripts/cf.sh`
- Cloudflare API Token Permissions Reference

## 入力

- `cloudflare/wrangler-action@v3` が呼び出す API（Workers Scripts upload / D1 query / Pages deploy）
- `gh secret list --env staging` / `gh secret list --env production` の出力（値は取得しない）
- 上流タスク完了後の workflow 実行ログ（Authentication error が解消されている前提）
- aiworkflow-requirements の `deployment-secrets-management.md`

## P50 チェック（Phase 1 前提確認）

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | Phase 5 で Token 再発行・Secret 更新を行う |
| upstream（FIX-CF-ACCT-ID-VARS-001）が完了済み | Yes | Account ID 経路は green。Token 単独要因として切り分け可能 |
| GitHub Issue #330 が OPEN | No（CLOSED） | seed spec が未消化のため `spec_created` として開始。Phase 12 で再 open or 新規 Issue 起票判断 |

`implementation_mode = "new"` を採用する。

## 真の論点

> wrangler-action / D1 migration / Pages deploy が必要とする Cloudflare API Token の権限集合は何で、現行 Token はそれを超える権限を持っていないか。staging でそれをどう非破壊に検証し、production にどう順序立てて適用し、失敗時に rollback できる構造をどう作るか。

**根本原因（潜在）**: Token が「Edit Cloudflare Workers」テンプレート等の広めスコープで発行されている場合、漏洩時の影響範囲（Workers / KV / D1 / Pages すべて + Account 操作）が過大になる。Token 値はログ表示できないため、Cloudflare Dashboard で Token に紐づく Permissions / Resources を直接突合するしか手段がない。

**派生論点**:

- staging Token と production Token の値分離（U-FIX-CF-ACCT-02 と整合）
- OIDC（GitHub OIDC → Cloudflare Trust Policy）による Token 廃止可否
- ADR 化方針の合意

## 要件レビュー思考法

### システム系（System Thinking）

- Token は CI/CD と Cloudflare の境界に置かれる「資格情報」。境界を最小化することで漏洩時のブラスト半径を抑える。
- D1:Edit と Workers Scripts:Edit は独立した resource 群であり、`Edit Cloudflare Workers` テンプレートには D1 が含まれていないことに注意。

### 戦略系（Strategic Thinking）

- 「広め Token を 1 本」と「scope 別 Token を複数」のトレードオフ。複数化は管理コスト増だが、漏洩時の影響範囲を区切れる。MVP では「環境分離（staging/prod）+ 用途は単一 Token」を採用し、OIDC 移行は ADR で将来課題化する。

### 問題解決系（Problem Solving）

- 「Token 値が見えない」制約に対し、Cloudflare Dashboard 上の Token 詳細ページのスクリーンショット（権限名のみ・値は写さない）を Phase 11 evidence の代替とする。

## 依存関係・責務境界

- **本タスクの責務境界**: GitHub Environment Secret `CLOUDFLARE_API_TOKEN` の値再発行と権限最小化。Cloudflare 側の Token 詳細編集。
- **触らない境界**: `CLOUDFLARE_ACCOUNT_ID`（Variable）、`CLOUDFLARE_PAGES_PROJECT`（Variable）、wrangler.toml の runtime warning（U-FIX-CF-ACCT-02）。
- **状態所有権**: Cloudflare Token は Cloudflare Dashboard が正本。GitHub Secret は値ミラー先。両者の同期手順を Phase 5 で明文化する。

## 価値とコストの均衡

| 項目 | 内容 |
| --- | --- |
| 初期価値 | 漏洩時のブラスト半径を最小化、監査可能性の向上 |
| 導入コスト | Token 1 本の権限編集 + 値再発行（staging/prod 各 1 回）+ Secret 更新 |
| 副次コスト | 旧 Token 失効までの 24h 内に切替必要。失敗時 rollback の段取り |
| トレードオフ | 権限を絞りすぎると deploy 失敗 → staging で先に確認することで吸収 |

## 不変条件 #5 の影響評価

不変条件 #5「D1 への直接アクセスは `apps/api` に閉じる」は、ランタイムのデータアクセス境界に関する規定であり、CI/CD の Token 権限監査は対象外である。Token に D1:Edit を残す/削るは「マイグレーションを CI から実行可能か」のみに影響し、`apps/web` から D1 を直接呼ぶ経路は本タスクで一切作らない。よって **不変条件 #5 は侵害しない** ことを宣言する。

## 受入条件マッピング

| AC | 確認方法 |
| --- | --- |
| AC-1 | Cloudflare Dashboard の Token 詳細で付与権限を表化し、necessary set との差分が 0 |
| AC-2 | Phase 2 の権限マトリクスに正本 4 種の権限と根拠（呼び出し API）が記載。KV / User Details は実測で必要な場合のみ追加候補 |
| AC-3〜AC-5 | `bash scripts/cf.sh` 経由の dry-run 系コマンドが exit=0 |
| AC-6, AC-7 | Phase 2 に切替・rollback 手順が図解 |
| AC-8 | Phase 11 evidence の grep で Token 値文字列が 0 件 |
| AC-9 | 本ファイルの「不変条件 #5 の影響評価」セクション |
| AC-10 | U-FIX-CF-ACCT-02 と Phase 2 ADR 方針が cross-reference |
| AC-11 | 本ファイル「4 条件評価」セクション |
| AC-12 | `gh secret list` 出力に値（暗号化済み hash 含む）が含まれていないこと |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | seed spec、上流（FIX-CF-ACCT-ID-VARS-001）、並列（U-FIX-CF-ACCT-02）の責務境界が排他 |
| 漏れなし | PASS | wrangler-action / D1 / Pages の 3 経路すべてに権限と検証コマンドを割当 |
| 整合性 | PASS | Cloudflare 公式 Permissions Reference / wrangler-action README / scripts/cf.sh の運用ルールと一致 |
| 依存関係整合 | PASS | 上流完了済み・並列タスクは ADR 共有のみで blocking なし |

## 完了条件

- [ ] 必要最小権限の集合が初期見積もりとして列挙されている
- [ ] staging 検証範囲（D1 list / api dry-run / web dry-run）が確定している
- [ ] 不変条件 #5 への影響なしが宣言されている
- [ ] 4 条件評価が PASS で記録されている

## 成果物

- `outputs/phase-01/main.md`
