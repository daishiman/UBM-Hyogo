# Phase 3 Output: 設計レビュー — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

## 1. 代替案レビュー

| # | 代替案 | 概要 | Pros | Cons | spec 判定 |
| --- | --- | --- | --- | --- | --- |
| A1 | GitHub Actions による production deploy | CI 上で `bash scripts/cf.sh deploy --config <path> --env production` を実行 | 監査性が高い、approval workflow を gh で表現可能 | secret を Actions に渡す追加管理、free-tier 制約、ローカル approval ログとの二重化 | **MINOR**（将来検討。MVP は採用しない） |
| A2 | ローカル実行（`bash scripts/cf.sh` + 1Password） | 採用案。手元で 1Password 動的注入し実行 | secret がファイルに残らない、ローカル approval log と整合、Node 24 / pnpm 10 を mise で固定 | 並列実行困難、operator スキル依存 | **PASS（採用）** |
| B1 | `wrangler` 直接実行 | wrangler CLI を直接呼ぶ | コマンドが短い | 1Password 注入と esbuild 解決が手作業、CLAUDE.md 規約違反 | **MAJOR**（禁止） |
| B2 | `bash scripts/cf.sh` 経由 | wrapper 経由で 1Password / esbuild / Node を保証 | 規約準拠、再現性が高い、secret leak 防止 | wrapper 自体のメンテが必要 | **PASS（採用）** |
| C1 | D1 export を毎 deploy で取得 | apply 前に必ず backup | 復旧経路が確保される | ストレージコスト（free-tier では小規模なので許容） | **PASS（採用）** |
| C2 | D1 export を skip | backup なしで apply | 速い | rollback 不能リスク、不変条件違反時に復旧困難 | **MAJOR**（禁止） |
| C3 | 別 D1 への定期 replication | hot standby | 復旧速い | free-tier では非現実、運用コスト高 | **MINOR**（将来） |
| D1 | release tag `vYYYYMMDD-HHMM` | 完了済み 09c serial 採用 | 一意性、可読性 | semver と非互換 | **PASS（採用、09c serial と整合）** |
| D2 | semver `vMAJOR.MINOR.PATCH` | 業界標準 | release note と互換 | feature-version semantics 未定 | **MINOR**（将来移行） |
| D3 | `release-<n>` | 連番 | 単純 | chronology 不明瞭 | **MINOR**（採用しない） |
| E1 | 24h verification を Cloudflare Dashboard で手動取得 | 採用案 | 追加コストゼロ、MVP 妥当 | 自動アラートなし | **PASS（採用）** |
| E2 | Analytics API + GitHub Actions で自動取得 | スクリプト化 | 再現性高、履歴蓄積 | 追加実装、Actions の secret 管理 | **MINOR**（follow-up） |
| E3 | Sentry alerting を 24h 監視に組み込み | 通知主導 | リアルタイム検知 | 09b-A の scope。本タスクで重複実装しない | **MINOR**（09b-A 連携で達成） |
| F1 | Blue/Green deploy | preview→production 昇格 | 切り戻し速い | DNS / routing 複雑、free-tier 非対応 | **MAJOR**（採用せず） |
| F2 | Canary traffic split | 段階的 traffic 移行 | blast radius 制限 | split 設定追加コスト、MVP 範囲外 | **MAJOR**（採用せず） |
| F3 | In-place production deploy（採用） | 全 traffic を新版に切替、rollback で対応 | 単純、free-tier 親和、09c serial と整合 | 全 traffic に新版が当たる | **PASS（採用）** |

### 採用方針サマリ

- 実行は **ローカル + `bash scripts/cf.sh`**（A2 + B2）
- **D1 backup を必須**（C1）
- **release tag `vYYYYMMDD-HHMM`**（D1）
- **24h verification は手動 Dashboard + 09b-A 通知連携**（E1 + E3 連携）
- **In-place production deploy + 最小単位 rollback**（F3）

## 2. リスクと対策

| # | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| R1 | 未承認の production mutation | 監査破綻 / 不可逆操作 | Phase 1 で自走禁止操作リスト確定。`outputs/phase-11/user-approval-log.md` に approval を必ず記載してから実行 |
| R2 | Cloudflare CLI drift（wrangler 直実行） | secret leak / esbuild 不整合 | `bash scripts/cf.sh` 経由に統一。CLAUDE.md・Phase 5 ランブックに明記 |
| R3 | main 昇格前の deploy | release evidence と commit hash 不一致 | step 2 で `git rev-parse origin/main` と PR merge commit を evidence に保存。main_merge → identity_check の順序を state machine で固定 |
| R4 | D1 migration apply 中の error / 部分適用 | データ不整合 / rollback 困難 | step 4 backup + step 5/8 list 比較で検出。forward migration で修復、破壊的 SQL 禁止。incident 時は 09b incident runbook |
| R5 | api/web deploy 失敗 | service down | step 8/9 で exit 0 を確認。失敗時は `cf.sh rollback`（user approval）または Dashboard で前 deployment へ戻す |
| R6 | smoke で 5xx / authz violation | 不変条件違反 | step 15 で即停止、rollback path（worker / pages / D1 個別）に遷移。`apps/web` から D1 直接操作する rollback は **不変条件 #6 違反のため禁止** |
| R7 | release tag の重複 / push 失敗 | release evidence 欠落 | timestamp を分単位で含めるため衝突可能性低。push 失敗時は再試行、`git ls-remote --tags origin` で確認 |
| R8 | 24h metrics の取り忘れ | 不変条件 #14 検証不能 | Phase 5 ランブックに 24h 後のリマインダ手順を組み込む。`outputs/phase-11/24h-verification-summary.md` を必須 evidence に登録 |
| R9 | secret 値の evidence 転記 | 機密漏洩 | log 取得時に mask 確認、`.env` 実値は 1Password 参照のみ。`grep` / `cat .env` を Claude Code に禁止（CLAUDE.md 既定） |
| R10 | 上流（09a-A / 09b-A / 09b-B）未 green での見切り発車 | 不変条件 #5 / #6 / #14 検証不能 | step 0 upstream_check で blocker 判定、green でないと state machine が前進しない |
| R11 | esbuild バージョン不整合 | deploy ビルド失敗 | `bash scripts/cf.sh` が `ESBUILD_BINARY_PATH` で解決 |
| R12 | Node バージョン drift | typecheck / build 失敗 | `mise exec --` 経由で Node 24 / pnpm 10 を保証 |

## 3. GO / NO-GO 条件

### GO 条件（すべて満たすこと）

- [ ] 09a-A staging smoke が green で `outputs/phase-11/` に evidence 揃い
- [ ] 09b-A observability runtime が production 用 binding で疎通済み
- [ ] 09b-B post-deploy smoke が staging で silent failure を検知できることが確認済み
- [ ] 09b release / incident runbook が docs-only として確定
- [ ] Phase 10 user approval が `user-approval-log.md` に記録される
- [ ] `bash scripts/cf.sh whoami` で production 操作対象 account が一致
- [ ] D1 backup が成功し size > 0
- [ ] D1 migration list（before）の出力が成功し、Applied 状態が読める
- [ ] dev → main PR が merge 済みで commit hash が citable

### NO-GO 条件（1 つでも該当したら停止）

- [ ] 上流タスクのいずれかが未 green
- [ ] Phase 10 / 11 / 13 の必要な approval が未取得
- [ ] `cf.sh whoami` が production と異なる account を返す
- [ ] D1 backup の size が 0 または取得失敗
- [ ] migration list で Applied 状態の不整合（先に手動実行された migration がある等）
- [ ] runtime smoke で 5xx / authz violation を検出
- [ ] secret 値が log / evidence に転記されている

## 4. Phase 1-2 妥当性チェック（4 条件評価更新）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値 | **PASS** | 完了済み 09c serial が「runbook 整備」までだったのに対し、本タスクは実 production execution gate を埋める。未実行 deploy が完了済みに見える状態を解消する |
| 実現可能性 | **PASS** | 既存 `scripts/cf.sh` / Web OpenNext build / `git tag` のみで実装可能。新規実装はゼロ |
| 整合性 | **PASS** | 不変条件 #5（boundary）/ #6（D1 access）/ #14（free-tier）を smoke / bundle inspection / 24h metrics で検証。CLAUDE.md の Cloudflare CLI ルールと整合 |
| 運用性 | **pending_user_approval** | 実 runtime 評価は Phase 10 / 11 / 13 の approval 後に決まる。Phase 11 evidence 取得まで保留 |

## 5. Phase 1-2 の改善点（見直し結果）

| 観点 | 改善有無 | 詳細 |
| --- | --- | --- |
| AC × evidence mapping の一意性 | 改善なし（妥当） | 5 AC × 各 evidence path が 1:1 で確定 |
| state machine の網羅性 | 改善あり | rollback 時の `apps/web` D1 直接アクセス禁止を Phase 2 §4 に明記済み |
| approval gate の粒度 | 改善あり | Phase 11 を mutation 単位（apply / api / web / tag）で 4 分割。`user-approval-log.md` に section 単位で記録 |
| evidence 命名規約 | 改善なし（妥当） | `outputs/phase-11/` 配下のフラット構造 + screenshots サブディレクトリで網羅 |
| D1 database name の整合性 | 改善あり | infrastructure-runbook の正本（`ubm-hyogo-db-prod`）に統一。完了済み 09c serial の `ubm_hyogo_production` 表記は本タスクで採用しない |

## 6. Phase 4 以降への引き渡し事項

| 渡す先 | 内容 |
| --- | --- |
| Phase 4（テスト戦略） | AC × evidence mapping、state machine、不変条件マッピング、smoke 10 ルート、authz boundary、`sync_jobs` 検証 SQL |
| Phase 5（実装ランブック） | 13 ステップ + approval gate、Cloudflare CLI 経路、D1 段階分離、rollback 手順、24h reminder |
| Phase 6（異常系検証） | リスク R1-R12、NO-GO 条件、rollback 分岐 |
| Phase 7（AC マトリクス） | 5 AC、evidence path、判定基準 |
| Phase 8（DRY 化） | 完了済み 09c serial の deploy-flow との重複を runbook の link で解消 |
| Phase 9（品質保証） | 4 条件評価、不変条件 #5 / #6 / #14 の検証手段 |
| Phase 10（最終レビュー） | GO / NO-GO 条件、user approval log の必須項目 |
| Phase 11（手動 smoke / 実測） | evidence ファイル一覧、screenshot 取得対象、24h verification template |
| Phase 12（ドキュメント更新） | infrastructure-runbook と本タスク outputs の cross-link、release tag 履歴 |
| Phase 13（PR 作成） | dev → main PR の最終 user approval、main merge commit を本 outputs に追記 |

## 7. 結論

Phase 1-2 の設計は MVP / free-tier / solo dev 制約と CLAUDE.md 規約に整合する。代替案レビューの結果、採用されたアプローチ（ローカル `cf.sh` + D1 backup 必須 + 手動 24h verification + in-place deploy + 最小単位 rollback）が最適と判断する。

GO 条件がすべて満たされる前は実 production mutation を行わない。Phase 4 以降は本 outputs を起点に、独立して仕様書化を進められる状態。
