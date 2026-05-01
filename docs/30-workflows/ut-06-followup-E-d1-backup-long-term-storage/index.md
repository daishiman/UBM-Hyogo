# ut-06-followup-E-d1-backup-long-term-storage - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-E |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 |
| ディレクトリ | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage |
| Wave | 2 |
| 実行種別 | serial（UT-12 R2 / UT-08 通知基盤 完了後の単独 PR） |
| 作成日 | 2026-05-01 |
| 担当 | unassigned |
| 状態 | spec_created（タスク仕様書整備に閉じる。コード実装は別 PR） |
| タスク種別 | docs-only（workflow_state: spec_created） |
| workflow_mode | docs-only |
| visualEvidence | NON_VISUAL |
| scope | data_backup |
| 由来 | UT-06 Phase 12 UNASSIGNED-E |
| 親タスク | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution |
| GitHub Issue | #118（CLOSED の状態のままタスク仕様書を整備する。再起票は本ワークフロー Phase 13 ユーザー承認時に判断する） |

## 目的

UT-06 Phase 5 では本番 D1 バックアップを `outputs/phase-05/` に一次保管した状態にとどまっており、長期保管・冗長化・暗号化・復元実行性検証が未確立である。本タスクは「日次バックアップ取得」だけでなく、**R2 を第一保管先・1Password Environments を補助保管先とし、暗号化（SSE-S3 / SSE-C / KMS のいずれか）+ 30 日 + 月次スナップショット世代管理 + UT-08 通知基盤統合 + 復元 runbook 机上演習**を満たす運用境界の確立を目指す。Phase 1 では Cloudflare cron triggers 優先を仮説として置き、Phase 2〜3 で GHA schedule 主 + Cloudflare cron healthcheck 併用を base case として確定し、Phase 4 以降で実装ランブックに展開する。本ワークフローは `spec_created` で閉じ、実コード（cron スクリプト・YAML・runbook 実物）は別 PR に委ねる。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- root / outputs `artifacts.json` parity と Phase 11 / 12 の最小 evidence 実体作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- AC-1〜AC-9 の固定
- cron 採用方針の意思決定論点の明文化（Phase 1 では Cloudflare cron triggers 優先を仮説、Phase 2〜3 で GHA schedule 主 + Cloudflare cron healthcheck 併用を base case として確定）
- 暗号化方式（SSE-S3 / SSE-C / KMS）の代替案比較と base case の選定
- R2 保管時の 30 日ローリング + 月次スナップショット世代管理戦略の設計
- 1Password Environments を補助保管先として位置付ける運用境界
- UT-08 通知基盤との統合方針（バックアップ失敗時アラート）の設計
- 復元 runbook の章立てと机上演習計画の仕様化
- 初回 migration 前の空 export 許容バリデーション方針の意思決定
- `bash scripts/cf.sh d1 export` 経由運用の固定（wrangler 直接禁止 / 1Password OAuth トークン保持禁止）
- 苦戦箇所（空 export / 暗号化 / 無料枠 / 机上演習）の Phase 1〜3 への取り込み

### 含まない

- バックアップ取得スクリプト / GitHub Actions YAML / Cloudflare cron triggers 設定の実物作成（別 PR）
- 復元 runbook 実物の作成（別 PR）
- D1 binding そのものの変更
- 復元自動化（runbook ベースの手動復元で MVP を維持）
- マルチリージョン保管（MVP スコープ外）
- UT-08 通知基盤側の閾値定義（UT-08 本体タスクで扱う）
- R2 バケット作成 / IAM 設定（UT-12 本体タスクで扱う）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | ut-06-production-deploy-execution | 本番 D1 が存在し Phase 5 一次保管が成立していることが前提 |
| 上流（必須） | UT-12 R2 storage | 第一保管先となる R2 バケット / IAM / lifecycle 設定の前提 |
| 上流（必須） | UT-08 monitoring base | バックアップ失敗時アラートの通知経路 |
| 関連 | UT-05-FU-003（GHA 監視） | GitHub Actions 採用時の監視対象登録 |
| 関連 | UT-06 Phase 6 D-2 restore-empty.sql | 初回 migration 失敗時の復元雛形 |
| 関連 | UT-06 Phase 9 secret-hygiene-checklist | 機密性レベル判定（SQL 平文に会員情報が含まれる場合の暗号化要件） |
| 下流 | （なし） | blocks 配列は空（運用基盤タスク） |

## Phase ナビゲーション

| Phase | ファイル | 状態 | 成果物 |
| --- | --- | --- | --- |
| Phase 1 | [phase-01.md](phase-01.md) | spec_created | outputs/phase-01/main.md |
| Phase 2 | [phase-02.md](phase-02.md) | spec_created | outputs/phase-02/main.md |
| Phase 3 | [phase-03.md](phase-03.md) | spec_created | outputs/phase-03/main.md |
| Phase 4 | [phase-04.md](phase-04.md) | spec_created | outputs/phase-04/main.md |
| Phase 5 | [phase-05.md](phase-05.md) | spec_created | outputs/phase-05/main.md |
| Phase 6 | [phase-06.md](phase-06.md) | spec_created | outputs/phase-06/main.md |
| Phase 7 | [phase-07.md](phase-07.md) | spec_created | outputs/phase-07/main.md |
| Phase 8 | [phase-08.md](phase-08.md) | spec_created | outputs/phase-08/main.md |
| Phase 9 | [phase-09.md](phase-09.md) | spec_created | outputs/phase-09/main.md |
| Phase 10 | [phase-10.md](phase-10.md) | spec_created | outputs/phase-10/main.md, restore-rehearsal-result.md |
| Phase 11 | [phase-11.md](phase-11.md) | spec_created | outputs/phase-11/main.md, manual-smoke-log.md, link-checklist.md |
| Phase 12 | [phase-12.md](phase-12.md) | spec_created | outputs/phase-12/ required seven artifacts |
| Phase 13 | [phase-13.md](phase-13.md) | spec_created | outputs/phase-13/ placeholder artifacts（commit / PR は未実行） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | 原典 76 行スペック |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-E 検出根拠 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 一次保管の現状 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md | 機密性レベル判定（暗号化方式選定の根拠） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md | 復元演習の参考フォーマット |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成と無料構成 |
| 必須 | scripts/cf.sh | wrangler ラッパー（d1 export 経路の正本） |
| 必須 | CLAUDE.md §重要な不変条件 #5 / §シークレット管理 / §Cloudflare 系 CLI 実行ルール | 不変条件 / scripts/cf.sh 強制 / wrangler login 禁止 |
| 必須 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 1〜13 共通セクション順 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cloudflare cron triggers |
| 参考 | https://developers.cloudflare.com/r2/buckets/object-lifecycles/ | R2 lifecycle policy |
| 参考 | https://developers.cloudflare.com/r2/api/s3/api/ | R2 SSE 仕様（S3 互換） |

## 受入条件 (AC)

- AC-1: 日次バックアップ cron（GHA schedule 主 + Cloudflare cron healthcheck 併用）が稼働し成功 log が確認できる仕様が Phase 1〜3 / Phase 5 に固定されている。
- AC-2: R2 バケットに直近 30 日 + 月次スナップショットの世代管理（lifecycle policy + 月次昇格戦略）が保持される仕様が Phase 2 で確定している。
- AC-3: export ファイルに対する暗号化（R2 SSE / KMS）または ACL（bucket private + signed URL）が設定される仕様が Phase 2 で確定している。
- AC-4: 復元 runbook が整備され机上演習結果が `outputs/phase-10/restore-rehearsal-result.md` に記録される計画が Phase 1〜3 / Phase 10 に固定されている。
- AC-5: バックアップ失敗時に UT-08 通知基盤経由でアラートが届く統合方針が Phase 2 で固定されている。
- AC-6: 初回 migration 前の空 export を許容するバリデーション（行数 0 を許容するか初回フラグで分岐）が実装方針として確定している。
- AC-7: `bash scripts/cf.sh d1 export` 経由（wrangler 直接呼び出し禁止 / 1Password OAuth トークン保持禁止）の運用が Phase 1〜3 で固定されている。
- AC-8: GitHub Actions を採用する場合は UT-05-FU-003 監視対象として明記、Cloudflare cron を採用する場合は GHA 月 2,000 分枠を圧迫しない方針が記録されている。
- AC-9: 機密性レベル判定（`outputs/phase-09/secret-hygiene-checklist.md` 参照）に応じた暗号化方式（SSE-S3 / SSE-C / KMS）が記録されている。

## 苦戦箇所・知見（原典より）

1. **初回 migration 前の空 export 許容バリデーション**: Phase 12 skill-feedback F-1 で確認した通り、初回 migration 適用前は `wrangler d1 export` が空 export を返す。これを「失敗」と解釈しない（行数 0 許容 or 初回フラグ分岐）バリデーション方針が必要。
2. **R2 保管時の暗号化**: D1 export は SQL 平文。会員情報を含む場合は SSE-C / KMS 等の暗号化が必須。`outputs/phase-09/secret-hygiene-checklist.md` を参照して機密性レベルを判定する。
3. **cron 実行の monthly 無料枠**: GitHub Actions private 無料枠（月 2,000 分）を圧迫しないよう、Cloudflare cron triggers を優先候補にする。GitHub Actions を使う場合は UT-05-FU-003 監視対象になる。
4. **復元 runbook の机上演習**: バックアップだけでは無意味。「復元できる」ことを定期的に検証する必要がある。UT-06 Phase 6 で rollback-rehearsal を作成済みのため、その拡張として机上演習計画を含める。

## 多角的チェック観点

- **不変条件 #5 整合性**: cron からの export 経路が `wrangler d1 export`（CLI 経路）で、`apps/web` から D1 binding を直接叩く形に変質していないか。`apps/api` を介在させない理由が明示されているか。
- **scripts/cf.sh ルール**: wrangler 直接呼び出しが混入していないか。`wrangler login` でローカル OAuth トークンを保持していないか。
- **暗号化必須性**: D1 export は SQL 平文で会員情報を含む。R2 SSE / KMS / signed URL のいずれかが必ず適用されているか。
- **無料枠運用境界**: Cloudflare cron triggers 採用時に GHA を併用しない方針が明記されているか。GHA 採用時に UT-05-FU-003 監視対象として明記されているか。
- **空 export 許容**: 初回 migration 前のフラグ分岐 / 行数 0 許容ロジックが Phase 2 設計に含まれているか。
- **復元実行性**: 机上演習計画が Phase 10 に固定されており、`outputs/phase-10/restore-rehearsal-result.md` のテンプレが定義されているか。
- **通知基盤統合**: UT-08 通知経路（webhook / 通知 channel）が決定されているか。失敗時のペイロード schema が UT-08 の閾値と整合しているか。
- **secret rotation**: R2 アクセス key / 1Password reference の rotation 手順が Phase 12 ドキュメント化方針に含まれているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペック写経と AC-1〜AC-9 確定 | 1 | spec_created | 原典 76 行 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | spec_created | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | cron 採用方針（Phase 1 仮説 → Phase 2〜3 確定）意思決定 | 1〜3 | spec_created | base case は GHA schedule 主 + CF cron healthcheck |
| 5 | 暗号化方式 3 案比較（SSE-S3 / SSE-C / KMS） | 2〜3 | spec_created | 機密性レベル判定根拠付き |
| 6 | R2 lifecycle 30 日 + 月次スナップショット昇格戦略 | 2 | spec_created | AC-2 |
| 7 | UT-08 通知統合方針 | 2 | spec_created | AC-5 |
| 8 | 復元 runbook 章立て + 机上演習計画 | 2, 10 | spec_created | AC-4 |
| 9 | 空 export 許容バリデーション方針 | 2 | spec_created | AC-6 |
| 10 | scripts/cf.sh 経路の固定 | 1〜3 | spec_created | AC-7 |
| 11 | 苦戦箇所 4 件の取り込み | 1〜3 | spec_created | 多角的チェック |
