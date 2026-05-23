# ut-17-followup-004-cloudflare-notification-policy-iac - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Cloudflare Notification Policy 4カテゴリ / 5 policyと webhook destination をリポジトリ宣言から冪等適用するために、`infra/cloudflare-alerts/` 配下の宣言ファイル群と `scripts/cf.sh alerts` サブコマンド（apply / diff / list）の実装を伴う。Dashboard 手動設定を IaC + drift 検知へ置換するため、Cloudflare API v4 を叩く apply / diff ロジックの実コード追加が必須であり、純粋なドキュメントタスクではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-17-followup-004 |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 |
| ディレクトリ | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac |
| Wave | 親 UT-17 完了後 follow-up（後続 wave） |
| 実行種別 | 改善 / 運用インフラ（IaC + drift 検知 CI） |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | implementation_complete（Phase 1-12 完了 / Phase 13 pending_user_approval） |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | LOW |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 親 workflow | docs/30-workflows/ut-17-cloudflare-analytics-alerts/ |
| 発見元 | ut-17-cloudflare-analytics-alerts (T9 / T10 外部操作残) |

## 目的

UT-17 で必要な Cloudflare Notification Policy 4カテゴリ / 5 policy（Workers Daily Requests / D1 Read Rows / D1 Write Rows / Pages Build / R2 Class A operations）および 1 件の webhook destination をリポジトリ宣言下に置き、`bash scripts/cf.sh alerts apply` で冪等再適用、`bash scripts/cf.sh alerts diff` で drift 検知できる状態を作る。
Dashboard 手動設定に依存する状態を解消し、誰がいつどの閾値で変更したかを git 履歴で追跡可能にする。再現性（Account 再構築・複製）と silent failure 防止（webhook destination 紐付け切れ検知）を IaC 経由で構造的に保証する。
本タスクは Cloudflare 公式 Terraform Provider を採用せず、Cloudflare API v4 + `scripts/cf.sh alerts` サブコマンドを正本実装方式とする（YAGNI 原則。Terraform 採用は他 IaC が Terraform 化される時点まで先送り）。

## スコープ

### 含む

- 宣言定義（リポジトリ管理下）
  - `infra/cloudflare-alerts/policies/*.json`（1 policy = 1 ファイル、合計 5 件）
  - `infra/cloudflare-alerts/webhooks/*.json`（webhook destination 1 件、UT-17 relay endpoint 向け）
  - `infra/cloudflare-alerts/quota-base.json`（無料枠 base 値の中央集約。閾値は base × 0.8 / × 0.95 で計算）
  - `infra/cloudflare-alerts/README.md`（運用手順 / token rotate 手順）
- `scripts/cf.sh` 拡張（`alerts` サブコマンド）
  - `bash scripts/cf.sh alerts apply` — 冪等適用（POST/PUT 自動判定、webhook → policy 順序保証）
  - `bash scripts/cf.sh alerts diff` — Cloudflare 上の現状と repo 定義を JSON 正規化して diff、drift 時 non-zero exit
  - `bash scripts/cf.sh alerts list` — 現状 policy / webhook 一覧表示（読み取り専用）
- API Token scope 分離設計
  - 既存 `CLOUDFLARE_API_TOKEN`（deploy 用）と分離し、`CLOUDFLARE_ALERTS_TOKEN_APPLY`（`Account.Notifications:Edit` scope）/ `CLOUDFLARE_ALERTS_TOKEN_READ`（`Account.Notifications:Read` scope）を新規発行
  - 1Password 正本パス、`.env` への `op://` 参照追加
  - CI（drift 検知）は read-only token のみ使用
- CI 統合（最小 1 job）
  - `.github/workflows/cloudflare-alerts-drift.yml` を追加し、`scripts/cf.sh alerts diff --ci` を定期実行
- 既存 runbook 更新方針
  - `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の「Dashboard 目視」手順を「`pnpm cf:alerts:diff`」差し替え方針として明記（実書き換えは Phase 12）
- UT-17 implementation-guide Part 5 (T9 / T10) からの参照リンク追記方針

### 含まない

- UT-17 relay endpoint 実装変更（既に実装済み、本タスクではポリシー側のみ扱う）
- 新規 Cloudflare 無料枠 metric の追加検知（既存 4カテゴリ / 5 policy＋R2 の宣言化のみ）
- Cloudflare Terraform Provider への移行（YAGNI で Phase 2 にて棄却）
- 他 Account（個人別 Account 等）への展開
- UT-17 / UT-08 が予約済の Slack Webhook / `CF_WEBHOOK_AUTH_SECRET` などの Secret 設計変更
- D1 / R2 / Workers binding 自体の変更

## 責務境界（親 UT-17 / UT-17-followup-001..003 との分離）

| タスク | 責務 |
| --- | --- |
| 親 UT-17 | Cloudflare Notifications ネイティブ無料枠アラート設計、Slack 日本語化リレー Worker 実装、T9/T10 として Dashboard 手動設定手順を残置 |
| ut-17-followup-001..003 | 親 UT-17 由来の他 follow-up（本タスクと並列・独立） |
| **本タスク (followup-004)** | **T9 / T10 の Dashboard 手動設定を IaC 化（4 category / 5 policy + 1 webhook）し、`scripts/cf.sh alerts` と drift 検知 CI で再現性・silent failure 防止を構造化** |

親 UT-17 の Phase 12 implementation-guide Part 5 における「Dashboard 手動設定」記述は本タスク完了後に「`scripts/cf.sh alerts apply` 実行」へ置換する（実書き換えは本タスクの Phase 12 で実施）。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 親 UT-17（completed） | 4 category / 5 policy の閾値・webhook destination URL・Notification Type が確定済 |
| 上流 | `scripts/cf.sh`（既存ラッパー） | `op run` + `mise exec` + `ESBUILD_BINARY_PATH` 解決基盤を再利用 |
| 上流 | 1Password Environments | 新規 alert 用 token 2 種（apply / read）の正本配置 |
| 連携 | UT-17 monthly healthcheck runbook | 「Dashboard 目視」から「`pnpm cf:alerts:diff`」への差し替え方針 |
| 下流 | 親 UT-17 implementation-guide Part 5 | T9 / T10 記述の更新（本タスク Phase 12 で実施） |
| 関連 | ut-17-followup-001..003 | 並列・独立。互いにブロックしない |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 元タスク指示書（正本・202 行） |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md | 親 UT-17 の T9 / T10 外部操作残 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-02/alert-policy-matrix.md | 4 category / 5 policy の閾値と Notification Type |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-02/secret-management.md | UT-17 の Secret 命名と衝突確認 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 差し替え対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md | アラート一次対応の参照経路 |
| 必須 | scripts/cf.sh | `alerts` サブコマンド拡張の対象ラッパー |
| 必須 | CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」 | 不変条件 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | Cloudflare API v4 alerting/v3/policies |
| 参考 | https://developers.cloudflare.com/api/operations/notification-webhooks-create-webhook | alerting/v3/destinations/webhooks |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | webhook custom header 仕様 |

## 受入条件 (AC)

- AC-1: `infra/cloudflare-alerts/policies/*.json` に 4カテゴリ / 5 policyの policy 宣言が存在し、`quota-base.json` の値から閾値が機械的に再現できる
- AC-2: `infra/cloudflare-alerts/webhooks/*.json` に UT-17 relay endpoint 向け webhook destination 1 件の宣言が存在し、`name` を key として policy 側から参照される（ID 直書き禁止）
- AC-3: `bash scripts/cf.sh alerts apply` が冪等であり、2 回連続実行で `diff` 出力が空になる
- AC-4: `bash scripts/cf.sh alerts diff` が drift（手動 Dashboard 変更を模した状態）に対して exit code 非 0 を返し、差分 JSON を stdout に出力する
- AC-5: `bash scripts/cf.sh alerts list` が現状 policy / webhook を JSON で読み取り専用に出力する
- AC-6: API Token scope が apply（`Account.Notifications:Edit`）と read（`Account.Notifications:Read`）に分離されており、CI は read-only token のみで動作する
- AC-7: `infra/cloudflare-alerts/README.md` に運用手順（apply / diff / token rotate / 障害時切り戻し）が記載されている
- AC-8: `.github/workflows/cloudflare-alerts-drift.yml` が drift 検知 job として定義され、GitHub Secrets `CLOUDFLARE_ALERTS_TOKEN_READ` を参照する
- AC-9: 親 UT-17 implementation-guide Part 5（T9 / T10）から本タスク完了後の手順への参照リンクが追記されている（Phase 12 で実施）
- AC-10: UT-17 monthly healthcheck runbook の「Dashboard 目視」手順が「`pnpm cf:alerts:diff` 実行」差し替え方針として明記されている
- AC-11: `bash scripts/cf.sh alerts apply` 内部で webhook destination → policy の順序が保証されており、policy 内 `mechanisms.webhooks[].id` は名前解決で埋める実装になっている
- AC-12: 設計レビュー結果（GO / NO-GO 判定）が `outputs/phase-03/design-review.md` に記録されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/ |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/ |
| 5 | 実装仕様 | phase-05.md | completed | outputs/phase-05/ |
| 6 | テスト計画 | phase-06.md | completed | outputs/phase-06/ |
| 7 | 実装 | phase-07.md | completed | outputs/phase-07/ |
| 8 | 統合確認 | phase-08.md | completed | outputs/phase-08/ |
| 9 | テスト補強 | phase-09.md | completed | outputs/phase-09/ |
| 10 | リリース準備 | phase-10.md | completed | outputs/phase-10/ |
| 11 | 視覚的検証 | phase-11.md | completed（NON_VISUAL skip + command evidence） | outputs/phase-11/ |
| 12 | 正本同期 | phase-12.md | completed（strict 7 outputs 作成済） | outputs/phase-12/ |
| 13 | PR・振り返り | phase-13.md | pending | outputs/phase-13/ |

> Phase 1-12 は本サイクルで実装・正本同期済み。Phase 13（commit / push / PR）はユーザー承認待ち。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-01/requirements.md | 要件定義（論点・スコープ・AC・4 条件評価・既存資産インベントリ） |
| 設計 | outputs/phase-02/architecture.md | 採用方式（API + cf.sh）の確定根拠、Terraform 棄却 |
| 設計 | outputs/phase-02/directory-layout.md | `infra/cloudflare-alerts/` 配下構造、JSON schema |
| 設計 | outputs/phase-02/cf-sh-alerts-spec.md | `scripts/cf.sh alerts {apply\|diff\|list}` のコマンド仕様 |
| 設計 | outputs/phase-02/api-mapping.md | Cloudflare API v4 endpoint 対応表、alert_type 4カテゴリ / 5 policyの閾値表現整理 |
| 設計 | outputs/phase-02/token-scope-design.md | API Token scope 分離、1Password 配置、CI 経路 |
| 設計 | outputs/phase-03/design-review.md | 設計レビュー（観点別判定・GO/NO-GO） |
| 実装 | infra/cloudflare-alerts/policies/*.json | 4カテゴリ / 5 policyの policy 宣言 |
| 実装 | infra/cloudflare-alerts/webhooks/*.json | webhook destination 宣言 |
| 実装 | infra/cloudflare-alerts/quota-base.json | 無料枠 base 値の中央集約 |
| 実装 | infra/cloudflare-alerts/README.md | 運用手順 |
| 実装 | scripts/cf.sh（拡張） | `alerts` サブコマンドの追加 |
| 実装 | .github/workflows/cloudflare-alerts-drift.yml | drift 検知 CI |

## 不変条件

1. **Cloudflare CLI 操作は `bash scripts/cf.sh` 経由のみ**。`wrangler` / `terraform` 直接呼び出し禁止（CLAUDE.md 準拠）
2. **Secret は 1Password Environments を正本**とし、`.env` には `op://Vault/Item/Field` 参照のみ。実値のコミット禁止
3. **API Token は scope 分離**: apply 用（`Account.Notifications:Edit`）と read 用（`Account.Notifications:Read`）を別 Item で発行。既存 `CLOUDFLARE_API_TOKEN`（deploy 用）への scope 追加は禁止
4. **CI は read-only token のみ**: drift 検知 CI が compromise しても apply 権限が流出しない
5. **webhook destination の ID 直書き禁止**: policy 定義は webhook を `name` で参照し、apply 時に ID 解決
6. **閾値は `quota-base.json` × 係数で計算**: 絶対値直書き禁止（無料枠改定への追従性確保）
7. **`scripts/cf.sh alerts apply` は冪等**: 既存名なら PUT、無ければ POST。順序は webhook → policy
8. **`apps/web` / `apps/api` のコードには影響しない**: 本タスクは `infra/` と `scripts/` と `.github/` のみ変更
9. **D1 直接アクセスは `apps/api` に閉じる**: 本タスクで D1 への新規参照を生やさない
10. **今回サイクル内で完了させる**（CONST_007）: 先送り禁止。Phase 4-13 まで通しで実装完了させる

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| Cloudflare API v4 `alert_type` の名称が公式仕様で変動 | Phase 2 の `api-mapping.md` で確認時点の名称を版固定し、apply 失敗時の re-discovery 手順を README に記載 |
| alert_type 4カテゴリ / 5 policyの閾値表現が「百分率 vs 絶対値」で混在 | `quota-base.json` を中央化し、policy JSON 内では `thresholdFormula: "quotaBase * 0.8"` のような表現で正規化。apply 直前に絶対値に展開 |
| 新 token 発行で `Account.Notifications:Edit` scope が UI 提供されていないケース | Phase 1 で公式仕様確認、scope 未提供時は最小上位 scope（例: `Account.Account Settings:Edit`）にフォールバックし README で明記 |
| CI で 1Password CLI が動かず drift 検知が成立しない | `scripts/cf.sh alerts diff --ci` フラグで `op run` をスキップし、GitHub Secrets の `CLOUDFLARE_ALERTS_TOKEN_READ` を直接読む経路を提供 |
| webhook destination URL（UT-17 relay endpoint）の変更を本タスクで追従できず silent failure | `alerts diff` で webhook URL の差分も検知。runbook に「URL 変更時は repo 宣言を先に更新して apply」と明記 |
| Cloudflare 側 schema 変更で `alerts diff` の正規化が壊れる | 正規化を「Cloudflare 側で返る fields のうち、repo 宣言に存在する key のみ比較」する片側 diff にし、未知 fields の追加では fail しない設計 |
| 既存 deploy token (`CLOUDFLARE_API_TOKEN`) を誤って apply 用に流用 | `scripts/cf.sh alerts` 内で参照する env var を `CLOUDFLARE_ALERTS_TOKEN_APPLY` / `_READ` に固定。`CLOUDFLARE_API_TOKEN` 直接参照禁止 |
| Terraform 採用要求が将来発生し JSON → HCL 移行コスト懸念 | JSON schema を Cloudflare API v4 と 1:1 に保ち、HCL 生成 script 1 本で migration 可能な構造を維持 |

## 注意点

- Issue #636 は **CLOSED** 状態だが、元タスク指示書（unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md）が継続管理されており、Refs として参照する。Issue 再オープンは行わず、本仕様書配下で完結させる
- 親 UT-17 の `state: implementation_completed_external_ops_pending` は本タスク完了をもって「T9 / T10 が IaC 化済」と注記される（親側の状態書き換えは Phase 12 同期で実施）
- `infra/cloudflare-alerts/` ディレクトリは本タスクが initial commit となる。既存に Terraform / IaC ディレクトリは存在しない前提
- `scripts/cf.sh` 拡張は既存 `audit-log` / `r2` / `api-get` / `api-post` サブコマンドの拡張パターンを踏襲する（同ファイル内 case 分岐追加）
- alert_type 4カテゴリ / 5 policyの正式名称はCloudflare 公式仕様の改定を受けて Phase 2 / Phase 7 で再確認する。`api-mapping.md` に「確認日時 + 確認元 URL」を併記
