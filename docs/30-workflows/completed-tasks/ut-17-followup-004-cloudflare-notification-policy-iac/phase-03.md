# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は Phase 2 で確定した 5 設計ドキュメント（`scripts/cf.sh alerts` コマンド仕様、JSON schema、API endpoint 対応、Token scope 分離、drift CI workflow）を多角的にレビューし、Phase 7 以降の実装フェーズへ引き渡す前に欠陥を検出する。レビュー対象が実装直結の仕様であるため、本 Phase もコード品質と運用継続性の両面で実装区分扱いとする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (ut-17-followup-004) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |

## 目的

Phase 2 で作成した 5 ドキュメント（architecture / directory-layout / cf-sh-alerts-spec / api-mapping / token-scope-design）を多角的にレビューし、Phase 4 以降の実装フェーズへ引き渡す前に以下のリスクを検出・解消する:

- 採用方式（API + cf.sh）の妥当性とTerraform棄却の正当性
- API Token scope 分離の漏れ・既存 `CLOUDFLARE_API_TOKEN` への影響
- 閾値表現（quota-base 経由）の追従性
- webhook → policy 順序保証の実装可能性
- Cloudflare API v4 alerting endpoint と alert_type の確定状況
- drift 検知 CI の実現性（GitHub Actions 経路、Secret 取り扱い）
- runbook / 親 UT-17 implementation-guide 差し替え方針の整合性
- CLAUDE.md 不変条件遵守（`scripts/cf.sh` 経由のみ、`.env` への実値書き禁止、D1 アクセス境界）

レビュー結果は GO / NO-GO 判定として `outputs/phase-03/design-review.md` に記録する。

## 真の論点（Phase 1〜2 から継承）

1. Cloudflare API v4 alerting endpoint と alert_type 4カテゴリ / 5 policyの正式名称が公式仕様で確定しているか
2. `Account.Notifications:Edit` / `Account.Notifications:Read` Permission が Cloudflare ダッシュボード上で発行可能か
3. apply / diff の冪等性と順序保証（webhook → policy）が実装可能な粒度まで設計されているか
4. drift 検知 CI が read-only token のみで成立し、apply 用 token を CI に置かない設計が貫徹されているか
5. Terraform 棄却の判断が将来の HCL 移行可能性を阻害しないか

## 依存境界

| 種別 | 対象 | 本 Phase での扱い |
| --- | --- | --- |
| 上流 | Phase 2 の 5 ドキュメント | 全てレビュー対象 |
| 上流 | 親 UT-17 phase-02 / phase-12 成果物 | 整合性レビューの照合先 |
| 上流 | Cloudflare 公式 API v4 仕様 | 実現性レビューの照合先 |
| 上流 | CLAUDE.md 不変条件 | 整合性レビューの基準 |
| 下流 | Phase 4 タスク分解 | レビュー結果と未決事項を引き継ぐ |
| 下流 | Phase 7 実装 | GO 判定後に着手 |
| 下流 | Phase 12 正本同期 | runbook / implementation-guide 差し替え方針確定 |

## 価値とコスト

- **価値**: 実装着手前に設計欠陥を検出することで Phase 7 以降の手戻りコストを最小化。特に「alert_type 名称が API で提供されない」「`Account.Notifications:Edit` Permission が UI 提供されない」「順序保証の漏れによる apply 破綻」は実装着手後では大きな手戻りとなるため、本 Phase で必ず検出する。
- **コスト**: 5 ドキュメント × 8 観点のクロスレビュー。重大度区分でフィルタし、CRITICAL/MAJOR を優先処理する。

## 4 条件評価

| 条件 | 問い | 判定基準 |
| --- | --- | --- |
| 価値性 | レビューが Phase 7 実装手戻りを実質的に減らすか | CRITICAL/MAJOR が 0 になり、MINOR は許容範囲で記録される |
| 実現性 | 各観点の判定が Phase 2 成果物 + 公式仕様で完結するか | API endpoint / Token Permission の確認結果が本 Phase 内に記録される |
| 整合性 | CLAUDE.md 不変条件と既存 `scripts/cf.sh` パターンに合致するか | observability-diff / audit-log / r2 と同じパターンに揃っているか |
| 運用性 | 月次 drift 確認 + token rotate + quota-base 更新が運用継続可能か | runbook 差し替え方針が現実的な操作粒度になっているか |

## レビュー観点と重大度区分

### 重大度区分

| 区分 | 意味 | 対応 |
| --- | --- | --- |
| CRITICAL | 設計の根本欠陥・Secret 漏洩リスク・実装不可能・CLAUDE.md 不変条件違反 | Phase 2 へ差し戻し、修正後再レビュー必須 |
| MAJOR | 重大な不整合・AC 未充足・既存 token 命名衝突 | Phase 2 で修正、再レビュー後 GO |
| MINOR | 軽微な改善点 | Phase 4 以降と並行修正可、ブロックしない |
| PASS | 問題なし | 次 Phase に進む |

### 観点 1: AC 充足レビュー

| AC | レビュー対象 | 確認内容 | 期待判定 |
| --- | --- | --- | --- |
| AC-1 | directory-layout.md / api-mapping.md | 4カテゴリ / 5 policyの policy 宣言と quota-base 経由閾値計算 | PASS |
| AC-2 | directory-layout.md / architecture.md | webhook destination の `name` key 参照と ID 直書き禁止 | PASS |
| AC-3 | architecture.md / cf-sh-alerts-spec.md | apply 冪等性（POST/PUT 自動判定） | PASS |
| AC-4 | architecture.md / cf-sh-alerts-spec.md | diff 時 drift で exit 非 0 | PASS |
| AC-5 | cf-sh-alerts-spec.md | list の読み取り専用挙動 | PASS |
| AC-6 | token-scope-design.md | apply / read scope 分離 | PASS |
| AC-7 | directory-layout.md（README 構造） | 運用手順記載 | PASS |
| AC-8 | token-scope-design.md | drift CI workflow と GitHub Secrets 参照 | PASS |
| AC-9 | phase-02.md（親 implementation-guide 追記方針） | T9 / T10 への参照リンク方針 | PASS |
| AC-10 | phase-02.md（runbook 差し替え方針） | monthly healthcheck runbook 差し替え | PASS |
| AC-11 | architecture.md / cf-sh-alerts-spec.md | webhook → policy 順序保証 | PASS |

### 観点 2: 採用方式妥当性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| Terraform 棄却根拠 | 既存リポジトリに Terraform 採用箇所がなく、本タスク単体で IaC 全体を Terraform 化する必要性がないことが明示されているか | REVIEW_REQUIRED |
| 将来の HCL 移行余地 | JSON schema が Cloudflare API v4 と 1:1 構造を保ち、HCL 生成 script 1 本で移行可能か | REVIEW_REQUIRED |
| 既存 `scripts/cf.sh` パターン踏襲 | `audit-log` / `r2` / `api-get` / `api-post` の case 分岐パターンと一致しているか | REVIEW_REQUIRED |
| 新規依存導入の最小化 | tsx / vitest / fetch ベース API client 以外に新規ランタイム導入が無いか | REVIEW_REQUIRED |
| Cloudflare Terraform Provider beta 問題 | alerting 関連 resource の beta 扱いを棄却根拠として明示しているか | REVIEW_REQUIRED |

### 観点 3: API endpoint / alert_type 実現性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| Cloudflare API v4 alerting/v3 endpoint 提供 | `policies` / `destinations/webhooks` endpoint が現行 API で利用可能か（公式ドキュメント確認） | REVIEW_REQUIRED |
| alert_type 4カテゴリ / 5 policyの正式名称 | Workers Daily Requests / D1 Read / D1 Write / Pages Build / R2 Class A の alert_type が公式仕様で提供されているか | REVIEW_REQUIRED |
| 閾値表現の絶対値 / 百分率 | 各 alert_type が `conditions.threshold` を絶対値で要求するか百分率で要求するかの確認 | REVIEW_REQUIRED |
| 未確定メトリクスのフォールバック | Pages Build / R2 Class A alert が提供されない場合の `enabled: false` 退避方針が明示されているか | REVIEW_REQUIRED |
| 公式仕様確認日時の記録 | `api-mapping.md` の `verifiedAt` 列に確認日時と公式 URL が記録されているか | REVIEW_REQUIRED |

### 観点 4: Token scope 分離レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` への影響 | 既存 deploy token に scope を後から足していないか | REVIEW_REQUIRED |
| apply / read 分離 | `CLOUDFLARE_ALERTS_TOKEN_APPLY` と `CLOUDFLARE_ALERTS_TOKEN_READ` が別 1Password Item になっているか | REVIEW_REQUIRED |
| CI に置く token | drift workflow が read-only token のみを参照し、apply token を CI Secret に置かない設計か | REVIEW_REQUIRED |
| Token rotate 手順 | 年次想定の rotate 手順が runbook / README に記載されているか | REVIEW_REQUIRED |
| Permission 提供可否 | `Account.Notifications:Edit` / `:Read` が Cloudflare ダッシュボードで発行可能か（実機確認） | REVIEW_REQUIRED |
| Permission 不在時のフォールバック | UI で発行できない場合の上位 scope フォールバック方針が記載されているか | REVIEW_REQUIRED |

### 観点 5: 冪等性 / 順序保証レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| apply 冪等性 | 同名既存判定 → PUT / POST 自動切替が `architecture.md` apply シーケンスで明示されているか | REVIEW_REQUIRED |
| webhook → policy 順序 | apply 内部で必ず webhook を先に処理する設計か | REVIEW_REQUIRED |
| name → id 解決 | policy 内 `mechanisms.webhooks[].name` が apply 時に id へ置換される実装方針が明示されているか | REVIEW_REQUIRED |
| ID 直書き lint | repo 上の policy JSON に `{ "id": "<uuid>" }` を書いた場合 apply / diff で fail する仕様か | REVIEW_REQUIRED |
| diff 2 回連続でゼロ | apply 後 diff 実行で exit 0 になることが DoD に含まれるか | REVIEW_REQUIRED |
| 正規化方針 | 配列順序 / 未知 fields / 数値 threshold の正規化方針が明示されているか | REVIEW_REQUIRED |

### 観点 6: drift 検知 CI レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| workflow trigger | `schedule` / `workflow_dispatch` / `pull_request paths` が漏れなく設定されているか | REVIEW_REQUIRED |
| Secret 取り扱い | `secrets.CLOUDFLARE_ALERTS_TOKEN_READ` のみを参照し、apply token を参照しないか | REVIEW_REQUIRED |
| `--ci` フラグ | `op run` を skip する経路が cf-sh-alerts-spec.md で明示されているか | REVIEW_REQUIRED |
| permissions 最小化 | workflow level `permissions: contents: read` が設定されているか | REVIEW_REQUIRED |
| pnpm install のキャッシュ | `pnpm/action-setup@v4` + `actions/setup-node@v4` cache: pnpm が組み合わされているか | REVIEW_REQUIRED |
| 失敗時の通知 | drift 検知 fail 時に GitHub Notification / Slack へ伝達される経路が明示されているか（または明示的に「PR 上 status check で十分」と判断されているか） | REVIEW_REQUIRED |

### 観点 7: Secret 管理 / CLAUDE.md 整合性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `.env` 実値禁止 | 設計内に Token 値 / webhook secret 値の実値が含まれていないか | REVIEW_REQUIRED |
| `op://` 参照のみ | `.env` 追加例が `op://Vault/Item/Field` 参照のみになっているか | REVIEW_REQUIRED |
| `wrangler` 直接呼び禁止 | 設計内に `wrangler` 直接コマンドが含まれていないか | REVIEW_REQUIRED |
| `bash scripts/cf.sh` 経由 | 全 Cloudflare 操作が `bash scripts/cf.sh` 経由で表現されているか | REVIEW_REQUIRED |
| D1 アクセス境界 | 本タスクが `apps/api` 外で D1 binding に触れていないか | REVIEW_REQUIRED |
| ログ出力禁止 | Token / webhook secret が console.log に出ない実装方針が明示されているか | REVIEW_REQUIRED |

### 観点 8: 配置先 / 運用性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `infra/cloudflare-alerts/` 配置 | 既存ディレクトリ規約と衝突せず、IaC ディレクトリの正本候補として妥当か | REVIEW_REQUIRED |
| `infra/cloudflare-alerts/lib/` 配置 | `scripts/cf-audit-log/` パターンに揃っているか | REVIEW_REQUIRED |
| runbook 差し替え方針 | 「Dashboard 目視」→「`bash scripts/cf.sh alerts diff`」の差し替えが現実的な操作粒度か | REVIEW_REQUIRED |
| 親 UT-17 implementation-guide 追記 | T9 / T10 セクションへの参照リンク追記方針が明示されているか | REVIEW_REQUIRED |
| README 構造 | 運用手順 / token rotate / quota-base 更新 / 障害切り戻し / CI 連携が網羅されているか | REVIEW_REQUIRED |
| quota-base 更新タイミング | 「verifiedAt が 3 ヶ月以上経過時」など具体的なトリガーが明示されているか | REVIEW_REQUIRED |

## 代替案棄却の確認

| 代替案 | 棄却理由 | 確認済み |
| --- | --- | --- |
| Cloudflare Terraform Provider | provider バージョン依存の alert_type beta 問題、既存 Terraform 採用箇所がなく learning cost 過大、本タスクの規模が小さい | [ ] |
| Cloudflare Pulumi / SDK | 追加ランタイム導入、新規依存最大化で運用一元性が損なわれる | [ ] |
| Wrangler 直接呼び出し | CLAUDE.md「`bash scripts/cf.sh` 経由のみ」不変条件違反 | [ ] |
| Dashboard 手動設定継続 | silent failure 防止と reproducibility 確保ができない（本タスクの目的そのもの） | [ ] |
| API Token を deploy token に統合 | scope 過剰付与で deploy 失敗時切り分け困難、CI compromise 時の被害拡大 | [ ] |
| drift 検知 CI を read-write token で実行 | CI compromise 時に apply 権限が流出するリスク | [ ] |
| 閾値の絶対値直書き | Cloudflare 無料枠改定時に追従できず alert が fire しなくなる | [ ] |
| policy 内に webhook ID 直書き | Account 再構築時に id 不在で apply 失敗 | [ ] |

## GO / NO-GO 判定基準

| 判定 | 条件 |
| --- | --- |
| GO | CRITICAL = 0 かつ MAJOR = 0、全 AC 観点が PASS、Cloudflare API v4 alerting endpoint と `Account.Notifications:Edit/Read` Permission が発行可能と確認済み、alert_type 4カテゴリ / 5 policyの正式名称が確認できているか未確定メトリクスのフォールバック方針が明示されている |
| 条件付き GO | MAJOR = 0、MINOR ≤ 3 で Phase 4 以降と並行修正可能 |
| NO-GO | CRITICAL ≥ 1 または MAJOR ≥ 1 が解消されていない、または API endpoint / Token Permission / alert_type 正式名称のいずれかが未確定でフォールバックも未記載の場合 |

NO-GO 時は Phase 2 へ差し戻し、該当成果物を修正のうえ再レビュー。Cloudflare 側 Permission UI 提供がない場合は `Account.Account Settings:Edit` 等の上位 scope フォールバックを採用し README に経緯記録する。

## 実行タスク

- [ ] Phase 2 成果物 5 件を全て読み、AC との対応を確認する
- [ ] 観点 1〜8 の各レビュー項目を判定する
- [ ] Cloudflare API v4 alerting endpoint（policies / destinations/webhooks）の現行提供状況を公式仕様で確認する
- [ ] `Account.Notifications:Edit` / `Account.Notifications:Read` Permission の発行可否を Cloudflare ダッシュボードで確認する
- [ ] alert_type 4カテゴリ / 5 policy（Workers / D1 read / D1 write / Pages / R2）の正式名称を公式仕様で確認し、未確定メトリクスは `enabled: false` フォールバック方針を確認する
- [ ] CLAUDE.md 不変条件（`scripts/cf.sh` 経由のみ・`.env` 実値禁止・D1 アクセス境界）への準拠を確認する
- [ ] 既存 `scripts/cf.sh` の `audit-log` / `r2` パターンと `alerts` 拡張案の整合性を確認する
- [ ] 代替案棄却の確認チェックを完了させる
- [ ] CRITICAL / MAJOR / MINOR の件数を集計する
- [ ] GO / NO-GO 判定を下し、根拠を `outputs/phase-03/design-review.md` に記録する
- [ ] NO-GO 時は Phase 2 への差し戻し事項を明記する
- [ ] Phase 4（タスク分解）への引き継ぎ事項（MINOR 修正残・追加検証項目）を記録する

## 統合テスト連携

本 Phase はレビューのみで実コード・Cloudflare API 呼び出し・Secret 投入を行わない。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 4 タスク分解 | GO 判定後の T-番号タスク列挙 | レビュー結果と未決事項を引き継ぐ |
| Phase 7 実装 | `infra/cloudflare-alerts/lib/cli/*.ts` 生成、JSON 宣言、CI workflow | GO 判定後に着手 |
| Phase 8 統合確認 | 実 Cloudflare アカウントでの apply / diff / list 実行 | 動作確認手順の妥当性をレビュー |
| Phase 12 正本同期 | 親 UT-17 implementation-guide / runbook 差し替え | 差し替え方針の妥当性をレビュー |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-02.md | Phase 2 設計仕様 |
| 必須 | outputs/phase-02/architecture.md | レビュー対象 |
| 必須 | outputs/phase-02/directory-layout.md | レビュー対象 |
| 必須 | outputs/phase-02/cf-sh-alerts-spec.md | レビュー対象 |
| 必須 | outputs/phase-02/api-mapping.md | レビュー対象 |
| 必須 | outputs/phase-02/token-scope-design.md | レビュー対象 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md | 親 UT-17 T9 / T10 |
| 必須 | CLAUDE.md | シークレット管理 / Cloudflare CLI ルール / D1 アクセス境界 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | API v4 policies 公式 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-webhooks-create-webhook | API v4 webhooks 公式 |
| 参考 | https://developers.cloudflare.com/fundamentals/api/reference/permissions/ | Token Permission 一覧 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | レビュー結果（観点 1〜8 判定・重大度集計・GO/NO-GO 判定・根拠・代替案棄却確認・未決事項一覧） |

## 完了条件

- [ ] 全レビュー項目（観点 1〜8）が PASS / MINOR / MAJOR / CRITICAL のいずれかで判定されている
- [ ] CRITICAL = 0 かつ MAJOR = 0 が達成されている（または差し戻し記録）
- [ ] Cloudflare API v4 alerting endpoint が現行提供されていることが確認されている
- [ ] `Account.Notifications:Edit` / `:Read` Permission の発行可否が確認されている（不可なら上位 scope フォールバック決定）
- [ ] alert_type 4カテゴリ / 5 policyの正式名称が確認されている（未確定メトリクスは `enabled: false` フォールバック決定）
- [ ] CLAUDE.md 不変条件（`scripts/cf.sh` 経由のみ・`.env` 実値禁止・D1 アクセス境界）への準拠が確認されている
- [ ] 代替案棄却の確認が全てチェック済み
- [ ] GO / NO-GO 判定が根拠付きで記録されている
- [ ] MINOR 残がある場合は Phase 4 への引き継ぎ事項に明記されている
- [ ] `outputs/phase-03/design-review.md` が作成されている

## タスク 100% 実行確認【必須】

- 全レビュー項目が判定済み
- 全成果物が指定パスに配置済み
- CRITICAL / MAJOR が残存する場合は Phase 2 へ差し戻し記録
- API endpoint / Permission / alert_type 未確定時のフォールバック判断結果を記録

## 次 Phase

- 次: 4 (タスク分解)
- 引き継ぎ事項: GO 判定根拠、Cloudflare API endpoint / Permission / alert_type 確認結果、MINOR 修正残、未決事項、Phase 7 実装で追加確認すべき項目を Phase 4 入力として渡す
- ブロック条件: GO 判定が下りていない（CRITICAL/MAJOR 残）場合、または API endpoint / Permission / alert_type 正式名称のいずれかが未確定でフォールバックも未記載の場合は Phase 4 に進まない
