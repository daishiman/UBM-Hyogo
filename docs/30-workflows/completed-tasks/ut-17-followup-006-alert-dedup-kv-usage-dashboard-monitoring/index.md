# ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring — タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 元 unassigned-task 仕様書（2026-05-14 起票）は「Notification policy 作成は Cloudflare Dashboard UI 必須・コード変更なし」前提だったが、後続で完了した `ut-17-followup-004-cloudflare-notification-policy-iac` により `infra/cloudflare-alerts/` IaC + `scripts/cf.sh alerts {apply,diff,list}` 経路が確立済みのため、KV 監視 policy も同 IaC で宣言・冪等適用するのが現行ベストプラクティスとなった。本タスクは以下の実コード変更を伴う:
> - `infra/cloudflare-alerts/policies/*.json` 新規追加（KV 監視 1〜2 件）
> - `infra/cloudflare-alerts/quota-base.json` の KV 関連 quota 追記
> - `infra/cloudflare-alerts/schema/policy.schema.json` の `alert_type` enum 拡張（Cloudflare 公式仕様調査結果次第）
> - `infra/cloudflare-alerts/lib/__tests__/` への policy ロード / canonicalize / diff テスト追加
> - `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への KV 監視項目追記
>
> したがって CONST_004 に従いユーザー指定（旧仕様の docs-only 寄り運用）より実態優先で「実装仕様書」として作成する。

## 1. 既存 issue 状況確認結果（2026-05-16 時点）

| 項目 | 確認結果 |
| --- | --- |
| 対象 Issue | #702 [ut-17-followup-006] ALERT_DEDUP_KV usage / latency dashboard monitoring |
| state | open（API 上は open、本タスクは Issue 状態を変更しない） |
| 元 spec | `docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md` |
| 親 task | `ut-17-followup-002-alert-relay-dedup-kv`（completed-tasks 下に存在）|
| 解決済みか | **未解決**。runbook `ut-17-alert-relay-monthly-healthcheck.md` には Step 4b として `kv:namespace list` / `kv:key list` の存在確認のみ追加済み。**Cloudflare Notification policy（writes/min・error rate・storage bytes 等）の Dashboard 監視自動化は未実装**。`infra/cloudflare-alerts/policies/` に KV 関連 policy は 0 件（`workers-requests.json` / `d1-*.json` / `pages-build.json` / `r2-class-a.json` のみ）|
| 旧 spec の陳腐化点 | 旧 spec は「Notification policy は API 作成不可・Dashboard UI 必須・user-gated」を前提としていたが、followup-004 で `infra/cloudflare-alerts/` IaC 化済み。本タスクは IaC で完結させる方針へ刷新する |
| 必要性 | 必要。runbook は人手月次 deep-dive 用であり、KV write quota 超過や error rate spike の自動検知経路が無いため、Slack への通知も飛ばない |

## 2. メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring |
| タスク名 | ALERT_DEDUP_KV namespace の usage / latency 監視を IaC 化し既存 Slack 経路へ接続する |
| ディレクトリ | docs/30-workflows/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring |
| Wave | UT-17 follow-up 後段（followup-002 完了 / followup-004 完了後の延長線上） |
| 実行種別 | 改善 / 観測整備（IaC 拡張） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation / NON_VISUAL |
| workflow state | `implemented_local_runtime_pending`（`infra/cloudflare-alerts/` の IaC 宣言・fixture・テストはローカル実装済み。Cloudflare apply / Slack runtime smoke / commit / push / PR は user-gated） |
| artifacts registry | `artifacts.json` / `outputs/artifacts.json` |
| 優先度 | LOW |
| GitHub Issue | #702 |
| 親 workflow | docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/ |
| 依存 IaC 基盤 | docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/ |
| 発見元 | ut-17-followup-002 phase-12 unassigned-task-detection |

## 3. 目的（Why）

UT-17 follow-up 002 で導入した Cloudflare KV namespace `ALERT_DEDUP_KV`（`apps/api/src/routes/internal/alert-relay.ts` の dedup 状態を isolate 跨ぎで永続化）について、以下を達成する:

1. Account 集計の Workers KV writes/day・stored bytes の上限近接を Cloudflare Notification policy として宣言する
2. user 承認後の apply と有効化後に、検知結果を UT-17 既設の Slack alert-relay 経路へ自動配信できる状態にする
3. 設定を `infra/cloudflare-alerts/` 配下の宣言ファイルに置き、`scripts/cf.sh alerts apply/diff` で冪等再適用と drift 検知を可能にする
4. latency は Phase 1 で Cloudflare native alert 可否を確認し、native alert 不可なら Workers Analytics / GraphQL evidence の review 項目として runbook に固定する
5. runbook を「自動検知＋四半期 deep-dive」へ更新する

## 4. ゴール（What）

- `infra/cloudflare-alerts/policies/` に KV 監視 policy 宣言ファイルが追加されている（命名: `workers-kv-*.json`）
- `infra/cloudflare-alerts/quota-base.json` に KV 無料枠 quota（`workers_kv_*`）が追加されている
- `bash scripts/cf.sh alerts apply --yes` が user 承認後に KV 監視 policy を作成（または既存なら更新）し、`bash scripts/cf.sh alerts diff` が 0 件に収束する
- staging で擬似負荷を用いた発火確認が成功し、UT-17 既設 `/internal/alert-relay` 経由で Slack に 1 件以上届くことが user 承認後の runtime evidence として記録される。5 営業日 baseline 後の `enabled: true` 本運用切替は Phase 13 の user-gated operation とし、本ローカル実装 wave の完了条件に混ぜない
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に KV policy 宣言済み / 初期未有効化 / 四半期 deep-dive の境界が追記されている

## 5. スコープ

### 含む

- `infra/cloudflare-alerts/policies/workers-kv-*.json`（1〜N 件、Phase 1 で最終確定）
- `infra/cloudflare-alerts/quota-base.json` への KV 関連 quota 追記
- 必要に応じて `infra/cloudflare-alerts/schema/policy.schema.json` の `alert_type` enum 拡張（Cloudflare 公式 API で KV metric が `billing_usage_alert` 外の alert_type を要求する場合）
- `infra/cloudflare-alerts/lib/__tests__/` への policy ロード / canonicalize / diff テスト追加
- `infra/cloudflare-alerts/README.md` の policy 一覧表更新
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の Step 4 / Step 4b 更新
- staging 発火確認用の擬似負荷スクリプト案（`scripts/` 配下に追加するか runbook 内 inline かは Phase 2 で確定）

### 含まない

- `alert-relay.ts` / dedup ロジックのコード変更（followup-002 / 003 のスコープ）
- 新 KV namespace の追加（`ALERT_DEDUP_KV` の運用観測に閉じる）
- KV operation error metrics の構造化ログ実装（followup-005 のスコープ）
- 親 UT-17 / followup-002 / followup-004 implementation-guide の本文書き換え（参照リンク追記のみ）
- Cloudflare Terraform Provider への migration（followup-004 と同じく YAGNI で棄却）

## 6. 不変条件

1. **Cloudflare CLI 操作は `bash scripts/cf.sh` 経由のみ**（CLAUDE.md 準拠 / `wrangler` 直接禁止）
2. **Secret 直書き禁止**。`.env` には `op://Vault/Item/Field` 参照のみ
3. **API Token scope 分離**: `CLOUDFLARE_ALERTS_TOKEN_APPLY` / `_READ` を使用。deploy 用 `CLOUDFLARE_API_TOKEN` 流用禁止（followup-004 ですでに分離済み）
4. **policy JSON 内で webhook ID 直書き禁止**: `name` のみ参照（followup-004 schema 準拠）
5. **閾値は `quota-base.json` × 係数で計算**: 絶対値直書き禁止
6. **`scripts/cf.sh alerts apply` の冪等性を破らない**: 既存名なら PUT、無ければ POST。順序は webhook → policy（既存設計準拠）
7. **`apps/web` / `apps/api` のコードを変更しない**: 本タスクは `infra/` と `docs/` のみ変更
8. **D1 直接アクセス禁止**（CLAUDE.md）
9. **CONST_007**: 本 wave は Phase 1-12 とローカル IaC 実装を完了済みとして扱う。ただし Cloudflare mutation / Slack runtime evidence は user 承認が必要なため `runtime_pending` として扱い、完了済み runtime PASS と書かない
10. **followup-005（KV operation error metrics）は別タスク**: 本タスクで observability の構造化ログを増やさない

## 7. 受入条件 (AC)

- AC-1: `infra/cloudflare-alerts/policies/workers-kv-*.json` が 1 件以上追加され、schema に適合する
- AC-2: `infra/cloudflare-alerts/quota-base.json` に KV 関連 quota が追加され、`policies/workers-kv-*.json` の閾値計算根拠が `quotaBase * percentage` で再現できる
- AC-3: `bash scripts/cf.sh alerts diff` が新 policy 適用前は drift（`missing` 1 件以上）を、`apply --yes` 適用後は 0 件を返す（冪等性）
- AC-4: `infra/cloudflare-alerts/lib/__tests__/` に新 policy 関連テストが追加され `mise exec -- pnpm test:alerts` が PASS する
- AC-5: staging 環境で検証用 policy（極小閾値・一時 `enabled:true`）または明示承認済みの短時間負荷で擬似発火を行い、`/internal/alert-relay` 経由で Slack staging チャネルに 1 件以上着信した evidence（Slack screenshot or message URL + relay log）が `outputs/phase-11/` 配下に記録される
- AC-6: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の Step 4 / Step 4b に KV 監視自動化（policy 一覧 / diff 手順）が反映されている
- AC-7: Cloudflare 公式仕様で KV 関連 metric が `billing_usage_alert` 外の alert_type を要求する場合、`schema/policy.schema.json` の `alert_type` enum 拡張と該当 lib 側 canonicalize / api-client 更新が同 PR 内で完結する
- AC-8: 設計レビュー (Phase 3) で GO / NO-GO 判定が `outputs/phase-03/design-review.md` に記録されている
- AC-9: `bash scripts/cf.sh alerts apply` を 2 回連続実行し `diff` が空に収束する evidence が `outputs/phase-11/evidence/alerts-diff-after-apply.log` に保存される
- AC-10: GitHub PR 作成時は Issue #702 の close 紐付けを Cloudflare apply / Slack runtime smoke の扱いに合わせて判断する。runtime evidence 未取得のままなら `Refs #702` とし、close keyword は使わない

## 8. Phase 一覧

| Phase | 名称 | ファイル | 主成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 / Cloudflare API 仕様確認 | phase-01.md | outputs/phase-01/requirements.md、`kv-metric-availability.md` |
| 2 | 設計（policy 構造・閾値・schema 拡張要否） | phase-02.md | outputs/phase-02/ |
| 3 | 設計レビュー | phase-03.md | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | outputs/phase-04/task-breakdown.md |
| 5 | 実装仕様（ファイル差分・関数シグネチャ） | phase-05.md | outputs/phase-05/ |
| 6 | テスト計画 | phase-06.md | outputs/phase-06/test-plan.md |
| 7 | 実装（IaC 宣言 + lib テスト + schema 拡張） | phase-07.md | コード差分（infra/ 配下） |
| 8 | 統合確認（local apply --dry-run / diff） | phase-08.md | outputs/phase-08/ |
| 9 | テスト補強 / lint / typecheck | phase-09.md | outputs/phase-09/ |
| 10 | リリース準備（staging apply + 擬似発火準備） | phase-10.md | outputs/phase-10/ |
| 11 | 視覚的検証（NON_VISUAL command evidence + Slack 着信 evidence） | phase-11.md | outputs/phase-11/ |
| 12 | 正本同期（runbook / aiworkflow / changelog 更新） | phase-12.md | outputs/phase-12/ |
| 13 | PR・振り返り | phase-13.md | outputs/phase-13/ |

## 9. 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md | 元タスク（陳腐化点あり・5節参照） |
| 必須 | docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/ | 親 workflow |
| 必須 | docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/ | IaC 基盤の設計と命名規約 |
| 必須 | infra/cloudflare-alerts/README.md | 運用手順（apply / diff / token rotate） |
| 必須 | infra/cloudflare-alerts/schema/policy.schema.json | policy 宣言 schema |
| 必須 | infra/cloudflare-alerts/quota-base.json | quota base 値の中央集約 |
| 必須 | infra/cloudflare-alerts/lib/canonicalize.ts | policy canonical form と diff の正規化規則 |
| 必須 | infra/cloudflare-alerts/policies/workers-requests.json | policy JSON テンプレート参考 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 更新対象 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | dedup 実装（KV write 順序の理解） |
| 必須 | apps/api/wrangler.toml | `ALERT_DEDUP_KV` binding 定義 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」「シークレット管理」 | 不変条件 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | Cloudflare API v4 alerting/v3/policies |
| 参考 | https://developers.cloudflare.com/notifications/notification-available/ | Notification available products 一覧（KV 対応確認用） |

## 10. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| Cloudflare Notifications が KV usage を `billing_usage_alert` で直接サポートしない | Phase 1 で `notifications/available-products` API を叩き、KV 関連 alert_type を実列挙する。サポート無しの場合は GraphQL Analytics + workers cron による pull 監視へフォールバック（別 follow-up へ分離検討、ユーザー承認必須） |
| 閾値設定が staging baseline 不足で過剰通知になる | 初期適用は `enabled: false` で repo に置き、Phase 11 は検証用一時 policy で Slack 経路だけ証明する。5 営業日 baseline 後の `enabled: true` 本運用切替は Phase 13 承認後の別 wave で扱う |
| latency が Cloudflare native Notification に露出しない | Phase 1 の decision table で latency native alert 可否を分離する。不可なら Phase 7 の policy scope から外し、runbook の Workers Analytics / GraphQL review 項目として `runtime_pending` evidence に固定する |
| KV operation rate 観測指標の Cloudflare Dashboard 階層が浅くない | Phase 1 で確認 URL を runbook に焼き込み、Workers Analytics → KV → namespace 階層を明文化 |
| `mechanisms.webhooks[]` への ut-17-relay webhook 再利用で発火頻度が想定外に増加 | dedup window（followup-002 で実装済）で alert-relay 内 dedup が抑止する設計。staging 発火確認で複数発火を試し挙動を観察 |
| Cloudflare API v4 が `policies/workers-kv-*` 用 `alert_type` 名称を将来改名 | Phase 2 で `kv-metric-availability.md` に確認日時 + API レスポンス サンプル を残し、apply 失敗時の re-discovery 手順を README に追記 |
| schema 拡張で既存 policy の lint が破綻 | `policy.schema.json` の `alert_type` enum 拡張は **追加のみ**、既存値削除禁止。`additionalProperties:false` も保持 |

## 11. 注意点

- Issue #702 は本仕様書作成時点で API 上 `state: open`。ユーザー指示により Issue 状態は変更しない。Cloudflare apply / Slack runtime smoke 未取得のまま PR を作る場合は `Refs #702` を使い、close は runtime 境界が解消された後に判断する
- 旧 unassigned-task spec の「Notification policy は API 作成不可・Dashboard UI 必須」記述は陳腐化。本仕様書を上位とし、旧 spec には作成 wave で `superseded` トレースを付ける
- followup-005（KV operation error metrics）が並列で進行中の場合、relay log の構造化変更と本タスクの観測自動化は責務分離する。重複導入を避けるため Phase 4 で interface 確認
- staging apply 後の擬似発火は本番 Slack を汚染しないよう **staging チャネルに限定**。production 適用は user 承認後 Phase 13 で扱う
