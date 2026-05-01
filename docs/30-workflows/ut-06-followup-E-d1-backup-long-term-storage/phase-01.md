# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| Wave | 2 |
| 実行種別 | serial（UT-12 R2 / UT-08 通知基盤 完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク種別 | docs-only / workflow_state: spec_created / visualEvidence: NON_VISUAL / scope: data_backup |

## 目的

UT-06 Phase 5 で D1 バックアップを `outputs/phase-05/` 一次保管に留めた状態を、R2 第一保管 + 1Password Environments 補助保管 + 暗号化適用 + 日次 cron + 復元机上演習 + UT-08 通知基盤統合の運用境界へ格上げするための Phase 1〜13 タスク仕様書を整備する。本 Phase 1 では、(1) 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）に対する cron 経路（`wrangler d1 export` を介する CLI 経路）の整合性確立、(2) `bash scripts/cf.sh d1 export` 経由運用の固定（wrangler 直接禁止 / `wrangler login` でローカル OAuth トークン保持禁止）、(3) cron 採用方針を Phase 2 で4案比較する入力（初期仮説: Cloudflare cron triggers 優先、確定方針: GHA schedule 主 + Cloudflare cron healthcheck 併用）、(4) D1 export が SQL 平文で会員情報を含む前提での暗号化必須性、を仕様として固定する。実装（cron スクリプト・GHA YAML・runbook 実物）は Phase 13 ユーザー承認後の別 PR に委ねる。

## 真の論点 (true issue)

「日次バックアップを単純に取得すること」ではなく、**「R2 一次保管・1Password Environments 補助・暗号化適用・復元実行性検証（机上演習）・通知基盤統合・無料枠運用境界」を満たした運用境界の確立**が本タスクの本質である。さらに不変条件 #5 に対し、cron からの export 経路が `wrangler d1 export`（CLI 経路 / API 経由ではない）である点を明示し、運用境界として `bash scripts/cf.sh d1 export` を許容範囲として固定する。副次的論点として、(1) 初回 migration 前の空 export を「失敗」と解釈しないバリデーション境界、(2) D1 export SQL 平文の暗号化方式（SSE-S3 / SSE-C / KMS）の意思決定、(3) cron 採用方針（GHA schedule 主 + Cloudflare cron healthcheck）の無料枠境界、(4) 復元 runbook の机上演習の定期実行（バックアップだけでは無意味）。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | ut-06-production-deploy-execution | 本番 D1 が存在し Phase 5 一次保管が成立 | UT-06 Phase 5 の export evidence をベースラインとして本タスクへ引き継ぐ |
| 上流（必須） | UT-12 R2 storage | R2 バケット / IAM / lifecycle 設定の有効化 | R2 を第一保管先として確定する設計を Phase 2 へ |
| 上流（必須） | UT-08 monitoring base | 通知経路 / webhook / channel の確立 | バックアップ失敗時アラート統合方針を Phase 2 へ |
| 関連 | UT-05-FU-003 GHA 監視 | GitHub Actions 採用時の監視対象登録ルール | GHA 採用時の AC-8 申し送り |
| 関連 | UT-06 Phase 9 secret-hygiene-checklist | 機密性レベル判定（会員情報含有有無） | 暗号化方式（SSE-S3 / SSE-C / KMS）選定根拠を Phase 2 へ |
| 下流 | （なし） | blocks 配列は空 | 運用基盤として後続タスクをブロックしない |

## 価値とコスト

- 価値: バックアップ消失リスク・復元不能リスクの解消。会員情報を含む D1 SQL 平文の暗号化保管。Cloudflare cron triggers + R2（同一アカウント無料枠内）+ 1Password Environments で追加コストゼロに近い形で運用可能。月次スナップショットによる長期保管で災害復旧 RPO/RTO の運用根拠が確立する。
- コスト: cron スクリプト 1 本 + R2 lifecycle policy 設定 + 通知統合 + 復元 runbook + 机上演習計画。実装コストは中程度だが、GHA を採用すると月 2,000 分無料枠を圧迫し UT-05-FU-003 監視対象になるためコスト増。Cloudflare cron triggers 採用ならコストはほぼ 0。
- 機会コスト: 復元自動化を MVP に含めない（runbook ベースの手動復元）ことで、机上演習の定期実行を運用 SOP として確立する設計に集中できる。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | バックアップ消失・復元不能リスクの解消。無料枠で運用可能（Cloudflare cron triggers + R2 同一アカウント） |
| 実現性 | PASS | Cloudflare cron triggers + R2（S3 互換 SSE）+ scripts/cf.sh はすべて既存基盤。新規依存ゼロ |
| 整合性 | PASS | **不変条件 #5 と矛盾しない**。cron 経路は `wrangler d1 export`（CLI 経路）であり、`apps/web` から D1 binding を直接叩く形に変質しない。`bash scripts/cf.sh d1 export` ラッパーで scripts/cf.sh ルールを遵守 |
| 運用性 | PASS | 30 日 + 月次世代管理 / SSE 暗号化 / UT-08 通知 / 復元 runbook + 机上演習で運用境界が完結 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| CLI 実行経路 | `scripts/cf.sh d1 export` | wrangler 直接呼び出し禁止。`op run --env-file=.env` 経由で API Token を動的注入 |
| D1 binding 名 | `apps/api/wrangler.toml` の `[[d1_databases]]` | `binding = "DB"`, database `ubm-hyogo-db-prod` |
| R2 バケット命名 | UT-12 で確定する命名規則 | `ubm-hyogo-backup-prod`（仮）/ Phase 2 で UT-12 と整合させる |
| export ファイル命名 | UT-06 Phase 5 既存形式 | `d1-export-<env>-<UTC YYYYMMDDTHHMMSSZ>.sql` |
| 月次スナップショット命名 | 新規 | `monthly/<YYYYMM>/d1-export-<env>-<日付>.sql` |
| 通知 payload | UT-08 通知基盤の payload schema | UT-08 と整合（Phase 2 で確定） |
| 1Password 補助保管 reference | `op://UBM-Hyogo/d1-backup/...` | CLAUDE.md §シークレット管理 準拠 |

## 実行タスク

1. 原典スペック（`docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md` 76 行）を写経し、AC-1〜AC-9 として `index.md` と一致させる（完了条件: AC-1〜AC-9 が `index.md` §受入条件と同一）。
2. タスク種別を `docs-only` / `workflow_mode: docs-only` / `visualEvidence: NON_VISUAL` / `scope: data_backup` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. 真の論点を「運用境界の確立 + cron 経路の不変条件 #5 整合性」に再定義する（完了条件: 本仕様 §真の論点 にその記述）。
4. cron 採用方針（初期仮説は Cloudflare cron triggers 優先、Phase 2 以降の確定方針は GHA schedule 主 + Cloudflare cron healthcheck 併用）を意思決定対象として Phase 2 に渡す（完了条件: 本仕様で base case 候補を明示し、Phase 2 で 4 案以上比較に展開する申し送りを記述）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. 本ワークフローのスコープを「タスク仕様書整備に閉じ、cron スクリプト・YAML・runbook 実物の作成は別 PR」と固定する（完了条件: 本仕様 §スコープ にその旨）。
7. 苦戦箇所（空 export / 暗号化 / 無料枠 / 机上演習）を多角的チェックに取り込む（完了条件: 4 件すべて記載）。
8. UT-12 R2 / UT-08 通知基盤 / UT-06 Phase 9 secret-hygiene-checklist の 3 上流前提を Phase 1 / 2 / 3 で重複明記する設計を予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | 原典 76 行スペック |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 一次保管の現状 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md | 機密性レベル判定 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md | 机上演習フォーマット参考 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成と無料構成 |
| 必須 | scripts/cf.sh | wrangler ラッパー（d1 export 経路の正本） |
| 必須 | CLAUDE.md §重要な不変条件 #5 / §シークレット管理 / §Cloudflare 系 CLI 実行ルール | 不変条件 / scripts/cf.sh 強制 / wrangler login 禁止 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cloudflare cron triggers |
| 参考 | https://developers.cloudflare.com/r2/buckets/object-lifecycles/ | R2 lifecycle policy |
| 参考 | https://developers.cloudflare.com/r2/api/s3/api/ | R2 SSE 仕様 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（本 PR は Phase 1〜3 を成果物として作成）
- AC-1〜AC-9 の Phase 1 固定
- cron 採用方針の意思決定論点の明文化（Phase 1 初期仮説 → Phase 2〜3 base case）
- 暗号化方式（SSE-S3 / SSE-C / KMS）代替案比較を Phase 2 へ申し送り
- R2 30 日 + 月次スナップショット世代管理戦略を Phase 2 へ申し送り
- UT-08 通知統合方針を Phase 2 へ申し送り
- 復元 runbook 章立てと机上演習計画を Phase 2 / Phase 10 へ申し送り
- 初回 migration 前の空 export 許容バリデーション方針を Phase 2 へ申し送り
- `bash scripts/cf.sh d1 export` 経路の固定
- 苦戦箇所 4 件の多角的チェック取り込み

### 含まない

- cron スクリプト / GHA YAML / Cloudflare cron triggers 設定の実物作成
- 復元 runbook 実物の作成
- D1 binding そのものの変更
- 復元自動化（runbook ベースの手動復元で MVP）
- マルチリージョン保管
- UT-08 通知基盤側の閾値定義
- R2 バケット作成 / IAM 設定（UT-12 本体タスク）

## 実行手順

### ステップ 1: 原典スペックの写経

- `completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md` 76 行を本仕様書の構造に分解し、`index.md` の AC-1〜AC-9 を確定する。

### ステップ 2: 真の論点と上流依存の固定

- 真の論点を「運用境界の確立 + 不変条件 #5 整合性 + scripts/cf.sh ルール」に再定義する。
- UT-12 R2 / UT-08 通知基盤 / Phase 9 secret-hygiene-checklist の 3 上流前提を 3 重明記する設計を予約する。

### ステップ 3: 4 条件評価のロック

- 4 条件すべて PASS で確定する。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: cron 採用方針の意思決定論点化

- 初期仮説を Phase 2 へ渡し、4 案以上の比較から GHA schedule 主 + Cloudflare cron healthcheck 併用へ収束させる申し送りを記述する。

### ステップ 5: 苦戦箇所の取り込み

- 原典 §苦戦箇所 4 件（空 export / 暗号化 / 無料枠 / 机上演習）を多角的チェック観点に集約する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・AC-1〜AC-9・依存順序・4 条件評価・cron 採用方針候補 を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-9 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-9 を使用 |
| Phase 10 | 復元机上演習計画を `outputs/phase-10/restore-rehearsal-result.md` テンプレに渡す |
| Phase 12 | secret rotation / runbook ドキュメント化方針を渡す |

## 多角的チェック観点

- **不変条件 #5 整合性**: cron 経路が `wrangler d1 export`（CLI）で完結し、`apps/web` から D1 binding を直接叩く形に変質していないか。
- **scripts/cf.sh ルール**: wrangler 直接呼び出しが混入していないか。`wrangler login` でローカル OAuth トークンを保持していないか。
- **空 export 許容**: 初回 migration 前のフラグ分岐 / 行数 0 許容ロジックが Phase 2 設計対象として残せているか。
- **暗号化必須性**: SQL 平文で会員情報を含む前提が Phase 2 暗号化方式選定の入力として残っているか。
- **無料枠運用境界**: GHA 月 2,000 分枠を圧迫しない方針 / 採用時の UT-05-FU-003 監視対象登録が AC-8 と整合しているか。
- **復元実行性**: 机上演習計画を Phase 10 に渡す申し送りが残っているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペックの写経と AC-1〜AC-9 確定 | 1 | spec_created | 原典 76 行 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | spec_created | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 真の論点の再定義 | 1 | spec_created | 運用境界 + 不変条件 #5 整合性 |
| 5 | cron 採用方針候補の Phase 2 申し送り | 1 | spec_created | 4案比較へ渡す初期仮説 |
| 6 | スコープ「仕様書整備に閉じる」固定 | 1 | spec_created | 含む / 含まない明記 |
| 7 | 苦戦箇所 4 件の取り込み | 1 | spec_created | 多角的チェック |
| 8 | 3 上流前提の 3 重明記設計 | 1〜3 | spec_created | UT-12 / UT-08 / Phase 9 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / AC / 4 条件 / 苦戦箇所 / 命名規則） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「運用境界の確立 + 不変条件 #5 整合性 + scripts/cf.sh ルール遵守」として再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] AC-1〜AC-9 が `index.md` と完全一致している
- [x] タスク種別 `docs-only` / `workflow_mode: docs-only` / `visualEvidence: NON_VISUAL` / `scope: data_backup` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書整備に閉じ、cron 実物 / runbook 実物は別 PR」が明記されている
- [x] cron 採用方針候補が Phase 2 の4案比較へ申し送られている
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている（cron 経路は CLI 経由で `apps/web` 不在）
- [x] scripts/cf.sh 経路の固定が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 苦戦箇所（空 export / 暗号化 / 無料枠 / 机上演習）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 運用境界の確立 + 不変条件 #5 整合性 + scripts/cf.sh ルール遵守
  - AC-1〜AC-9
  - 4 条件評価（全 PASS）の根拠
  - スコープ境界（仕様書整備に閉じる）
  - cron 採用方針候補 → Phase 2 で 4 案比較し、GHA schedule 主 + Cloudflare cron healthcheck 併用へ収束
  - 暗号化方式 3 案（SSE-S3 / SSE-C / KMS）→ Phase 2 で機密性レベル判定根拠付きで比較
  - R2 lifecycle 30 日 + 月次スナップショット → Phase 2 で世代管理戦略確定
  - UT-08 通知統合方針 → Phase 2 で payload schema 確定
  - 復元 runbook 章立て + 机上演習計画 → Phase 2 / Phase 10 で展開
  - 空 export 許容バリデーション方針 → Phase 2 で実装方針確定
  - 3 上流前提の 2 重目明記要請（UT-12 / UT-08 / Phase 9）
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-9 が index.md と乖離
  - 不変条件 #5 を侵害する形（apps/web から D1 直接アクセス / wrangler 直接呼び出し）の要件が混入
  - cron 採用方針候補が決定されていない
