# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |

## 目的

Phase 1 で確定した「運用境界の確立 + 不変条件 #5 整合性 + scripts/cf.sh ルール遵守 + AC-1〜AC-9」を、(1) cron 配置（Cloudflare cron triggers vs GHA）、(2) export スクリプト構造、(3) R2 lifecycle policy / 30 日ローリング / 月次スナップショット昇格戦略、(4) 暗号化方式（SSE-S3 / SSE-C / KMS）、(5) 1Password Environments 補助保管、(6) UT-08 通知基盤統合（payload schema / 失敗 / 部分失敗）、(7) 復元 runbook 章立て、(8) 机上演習計画、(9) 空 export 許容バリデーション、(10) secret rotation 方針、の 10 設計トピックに分解し、Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力を作成する。本 Phase の成果は仕様レベルであり、cron スクリプト・YAML・runbook 実物の作成は Phase 13 ユーザー承認後の別 PR に委ねる。

## 依存タスク順序（3 上流前提必須）— 重複明記 2/3

> **UT-12（R2 storage）/ UT-08（monitoring base）/ UT-06 Phase 9（secret-hygiene-checklist）が completed であることが本 Phase の必須前提である。**
>
> UT-12 未完了で本 Phase の設計を実装に移すと、第一保管先となる R2 バケットが存在しないため cron が export 後の upload で失敗する。UT-08 未完了で実装すると失敗時アラートが届かず「サイレント失敗」する。Phase 9 secret-hygiene-checklist 未完了だと暗号化方式（SSE-S3 / SSE-C / KMS）の選定根拠が不在になる。本 Phase は 3 上流の completed を「設計の前提」として扱い、未完了の場合は Phase 3 NO-GO 条件で block される。Phase 1 §依存境界（1/3）/ 本 Phase（2/3）/ Phase 3 NO-GO（3/3）の 3 重明記。

## 実行タスク

1. cron 配置代替案 4 案（A: Cloudflare cron triggers + Worker / B: GitHub Actions schedule / C: 手動実行 / D: 外部 SaaS）を列挙する（完了条件: 4 案の利点 / 欠点が記述）。
2. base case として案 A（Cloudflare cron triggers）を選定し理由を明記する（完了条件: 採用根拠が記述）。
3. export スクリプト構造（`bash scripts/cf.sh d1 export` 呼び出し / 行数バリデーション / 初回フラグ分岐 / R2 upload / 1Password 補助保管 / 通知発行）の擬似シーケンスを固定する（完了条件: 擬似シーケンスが `outputs/phase-02/main.md` に記述）。
4. R2 lifecycle policy（30 日 rolling delete + 月次スナップショット昇格 prefix `monthly/<YYYYMM>/`）の世代管理戦略を確定する（完了条件: lifecycle rule が仕様レベルで記述）。
5. 暗号化方式 3 案（SSE-S3 / SSE-C / KMS）を比較し、機密性レベル判定（Phase 9 secret-hygiene-checklist）に応じた base case を選定する（完了条件: 3 案比較 + base case 採用根拠）。
6. 1Password Environments 補助保管方針（`op://UBM-Hyogo/d1-backup/...` reference / 月次スナップショットのみを補助保管 / 容量境界）を固定する（完了条件: 補助保管対象と頻度が記述）。
7. UT-08 通知基盤統合方針（成功 silent / 失敗 alert / 部分失敗の扱い / payload schema）を固定する（完了条件: payload schema が記述）。
8. 復元 runbook 章立て（前提確認 / D1 環境特定 / export ファイル取得 / restore SQL 実行 / 検証 SELECT / rollback 手順）を仕様化する（完了条件: 章立てが記述）。
9. 机上演習計画（頻度・実行責任者・成功基準・記録テンプレ `outputs/phase-10/restore-rehearsal-result.md`）を仕様化する（完了条件: 演習計画が記述）。
10. 空 export 許容バリデーション方針（行数 0 許容 OR 初回フラグ判定）を確定する（完了条件: バリデーション分岐が記述）。
11. secret rotation 方針（R2 access key / `CLOUDFLARE_API_TOKEN` / 1Password reference の rotation 頻度と手順）を Phase 12 ドキュメント化用に予約する（完了条件: rotation 対象一覧と頻度仮値が記述）。

## 設計対象の特定

### cron 配置（base case = 案 A: Cloudflare cron triggers + Worker）

- Worker（または `apps/api` への route 追加ではなく、独立した cron Worker）が Cloudflare cron triggers の `0 18 * * *`（UTC, 日本時間 03:00）等で起動。
- Worker 内で `wrangler d1 export` 相当の処理を実行 ... ただし Worker runtime からは `wrangler` CLI を直接呼び出せないため、**実運用では「ローカル / CI 環境から `bash scripts/cf.sh d1 export` を呼び出して R2 へ upload する」処理を Cloudflare cron triggers が直接担えない構造的制約**がある。本制約を Phase 3 open question として残し、base case は以下 2 段構えとする:
  - 段 1: GitHub Actions schedule で `bash scripts/cf.sh d1 export` を実行し R2 upload（実運用の主経路）
  - 段 2: Cloudflare cron triggers Worker は「R2 オブジェクト存在確認 + 失敗時 UT-08 通知」のヘルスチェック役（GHA 失敗の二重検知）
- このため base case は「**GHA schedule（主） + Cloudflare cron triggers Worker（ヘルスチェック）の併用**」に修正し、AC-8（GHA 採用時の UT-05-FU-003 監視対象登録）を満たす形で進める。Phase 3 で再評価。

### export スクリプト擬似シーケンス（GHA 主経路）

```text
1. Checkout (workflow contents only, no app code)
2. mise install → Node 24 / pnpm 10
3. op signin (1Password CLI) で OP_SERVICE_ACCOUNT_TOKEN ロード
4. bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output /tmp/d1-export-prod-${UTC}.sql
5. 行数バリデーション:
     - SELECT count from .sql header
     - 行数 0 かつ INITIAL_BACKUP_FLAG が true → 警告のみで成功扱い
     - 行数 0 かつ INITIAL_BACKUP_FLAG が false → 失敗扱い → UT-08 alert
6. R2 へ upload:
     - daily prefix:    `daily/<YYYYMMDD>/d1-export-prod-<UTC>.sql`
     - SSE 適用 (base case: SSE-C with key from 1Password)
7. 月初 (date == "01") の場合:
     - monthly snapshot 昇格: copy to `monthly/<YYYYMM>/d1-export-prod-<UTC>.sql`
     - 1Password Environments へ補助保管 (月次のみ, op write)
8. 完了通知:
     - 成功: silent (UT-08 通知なし)
     - 失敗 / 部分失敗: UT-08 webhook へ payload 送信
9. 終了
```

### R2 lifecycle policy / 世代管理戦略

| 観点 | 規則 |
| --- | --- |
| daily prefix | `daily/<YYYYMMDD>/` 配下 |
| daily 保持期間 | 30 日（lifecycle rule で 31 日経過オブジェクトを delete） |
| monthly prefix | `monthly/<YYYYMM>/` 配下 |
| monthly 保持期間 | 無期限（または 12 ヶ月以上 / Phase 3 で UT-12 と整合） |
| monthly 昇格タイミング | 毎月 1 日の cron 内で前日の daily を copy（mv ではなく copy）して daily ライフサイクルから独立させる |
| バケット ACL | private（公開禁止）。アクセスは signed URL もしくは IAM 経由のみ |

### 暗号化方式 3 案比較

| 案 | 概要 | 利点 | 欠点 |
| --- | --- | --- | --- |
| SSE-S3 (server-side, R2 管理 key) | R2 が key を管理し透過暗号化 | 実装コスト最小。R2 標準機能 | key を Cloudflare 側が保有するため「Cloudflare からの侵害リスク」を完全には排除できない |
| SSE-C (client-provided key) | クライアント（GHA）が key を提供。R2 は key を保存しない | key を 1Password 管理にできる。Cloudflare からの侵害リスク低減 | put/get のたびに key 提供が必要。key 紛失時に復号不能（運用ミス時のロックアウト） |
| KMS (envelope encryption) | KMS で DEK を暗号化、DEK で SQL を暗号化 | 鍵管理が独立。監査性最大 | R2 単体では KMS 統合がないため自前実装が必要。MVP として過剰 |

- **base case 候補**: 機密性レベルが「会員氏名・メールを含む = 中〜高」と Phase 9 で判定された場合、**SSE-C** を採用。中以下なら SSE-S3 で十分。
- 最終確定は Phase 3 で Phase 9 secret-hygiene-checklist の判定値とともに行う。

### 1Password Environments 補助保管方針

- 補助保管対象: **月次スナップショットのみ**（容量と op の単価制約）。
- reference 命名: `op://UBM-Hyogo/d1-backup/<YYYYMM>/sql`（base64 攻め込みで blob 保管）。
- 頻度: 月 1 回（cron で `01` 日に発行）。
- 用途: R2 障害時の last-resort fallback。月次粒度で RPO 1 ヶ月を許容する MVP 設計。

### UT-08 通知基盤統合

- 成功: silent（noisy 通知を避ける）。
- 失敗（export 失敗 / R2 upload 失敗 / 行数 0 + INITIAL_BACKUP_FLAG=false）: UT-08 webhook へ alert 発行。
- 部分失敗（R2 OK / 1Password 失敗）: warning レベルで alert 発行（severity 区別）。
- payload schema 仮:

```json
{
  "task": "ut-06-fu-e-daily-d1-backup",
  "env": "production",
  "status": "failed | warning",
  "stage": "export | r2-upload | op-store | validation",
  "rows_count": 0,
  "initial_backup_flag": false,
  "timestamp_utc": "2026-05-01T18:00:00Z",
  "trace_url": "<GHA run URL>",
  "error": "<exception summary string>"
}
```

- 最終 schema は UT-08 本体の payload contract と Phase 3 で整合する。

### 復元 runbook 章立て

1. 前提確認（D1 環境 / 復元対象日付 / 影響範囲合意）
2. 復元対象 export ファイルの取得（R2 daily / monthly / 1Password fallback の優先順位）
3. SSE-C の場合の復号 key 取得（1Password reference）
4. staging への復元 dry run（`bash scripts/cf.sh d1 execute --file restore.sql --env staging`）
5. production への復元実行（手動承認ゲート）
6. 検証 SELECT（件数 / 最新レコード timestamp）
7. rollback 手順（復元失敗時の旧状態退避）
8. インシデント記録テンプレ

### 机上演習計画

| 観点 | 値 |
| --- | --- |
| 頻度 | 月次 1 回（年 12 回） |
| 実行責任者 | 運用担当 |
| 成功基準 | (1) 復元手順が runbook 通りに完走、(2) staging で件数差分が 0 行、(3) 所要時間が 30 分以内 |
| 記録テンプレ | `outputs/phase-10/restore-rehearsal-result.md`（演習日 / 担当 / 所要時間 / 成功基準達成有無 / 改善点） |
| 演習対象 | 直近 daily 1 件 + 直近 monthly 1 件 + 1Password fallback 1 件（年 1 回） |

### 空 export 許容バリデーション

- `INITIAL_BACKUP_FLAG`（GHA workflow 環境変数 / 初回 migration 適用前のみ true）で分岐:
  - true + 行数 0: 警告ログを残し成功扱い（UT-08 通知なし）
  - false + 行数 0: 失敗扱い → UT-08 alert
- `INITIAL_BACKUP_FLAG` の初期値は `true`、Phase 5 D1 migration 適用後の運用切替で `false` に変更する手順を Phase 12 ドキュメントに記述。

### secret rotation 方針

| 対象 | rotation 頻度（仮） | 手順 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 12 ヶ月 | 1Password で再生成 → GitHub Secrets 更新 → smoke 実行 |
| R2 access key（IAM） | 12 ヶ月 | UT-12 IAM rotation と連動 |
| SSE-C key（採用時） | 24 ヶ月 | 1Password で生成、過去キーは復号用に保持 |
| 1Password service account token | 12 ヶ月 | 1Password 管理画面で rotation |

## ファイル変更計画（参考 / 別 PR 範囲）

| パス | 操作 | 担当 PR |
| --- | --- | --- |
| `.github/workflows/d1-daily-backup.yml` | 新規作成 | 別 PR（cron 実装 PR） |
| `scripts/d1-backup/upload-r2.sh` | 新規作成 | 別 PR |
| `scripts/d1-backup/promote-monthly.sh` | 新規作成 | 別 PR |
| `docs/runbooks/d1-restore.md` | 新規作成 | 別 PR |
| `apps/web/*` | **変更しない** | - |
| `apps/api/*` | **変更しない**（cron 経路は wrangler 経由 / API 経由ではない） | - |

> 本 PR では上記いずれも作成しない。**仕様レベルの記述に閉じる。**

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-01.md | Phase 1 AC / 依存境界 / 4 条件評価 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md | 機密性レベル判定 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 一次保管現状 |
| 必須 | scripts/cf.sh | wrangler ラッパー |
| 必須 | CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール | 1Password 経由・wrangler 直接禁止 |
| 参考 | https://developers.cloudflare.com/r2/buckets/object-lifecycles/ | R2 lifecycle |
| 参考 | https://developers.cloudflare.com/r2/api/s3/api/ | R2 SSE 互換性 |

## 実行手順

### ステップ 1: cron 配置 4 案比較と base case 選定

- A〜D を列挙し、Cloudflare cron triggers Worker 単独では wrangler CLI 実行不可の構造制約を踏まえ、GHA schedule（主）+ CF cron triggers Worker（ヘルスチェック）併用を base case とする。

### ステップ 2: export スクリプト擬似シーケンスの固定

- `bash scripts/cf.sh d1 export` 呼び出し / 行数バリデーション / R2 upload / monthly 昇格 / 1Password 補助保管 / UT-08 通知の 6 ステップを擬似コード化する。

### ステップ 3: R2 lifecycle 戦略の確定

- daily 30 日 rolling delete + monthly 12 ヶ月保持 + monthly 昇格は copy で実施する規則を明記。

### ステップ 4: 暗号化方式 3 案比較

- SSE-S3 / SSE-C / KMS を比較し、機密性レベルに応じた base case を選定（Phase 3 で Phase 9 値と整合）。

### ステップ 5: UT-08 通知 payload schema の固定

- 成功 silent / 失敗 alert / 部分失敗 warning の 3 階層と payload JSON schema を仮確定。

### ステップ 6: 復元 runbook 章立て + 机上演習計画

- 8 章立て + 月次演習計画 + `outputs/phase-10/restore-rehearsal-result.md` テンプレ要件を記述。

### ステップ 7: 空 export 許容 + secret rotation 方針

- `INITIAL_BACKUP_FLAG` 分岐ロジック / rotation 対象一覧を Phase 12 ドキュメント化用に予約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | cron 配置 4 案 / 暗号化 3 案 / base case の代替案比較を入力 |
| Phase 4 | テスト戦略へ AC-1〜AC-9 とバリデーション分岐をフィクスチャとして渡す |
| Phase 5 | 擬似シーケンスを実装ランブックの起点に渡す |
| Phase 6 | 異常系（GHA 失敗 / R2 upload 失敗 / SSE-C key 紛失 / 1Password 一時障害 / 行数 0 誤検知） |
| Phase 8 | SSE-C / IAM / signed URL / 1Password reference をセキュリティ章へ |
| Phase 10 | 復元机上演習計画 + `restore-rehearsal-result.md` テンプレ |
| Phase 12 | secret rotation / runbook ドキュメント化方針 |

## 多角的チェック観点

- **不変条件 #5**: cron 経路に `apps/web` から D1 binding を直接叩く構造が混入していないか。`apps/api` も介在せず CLI 経由で完結しているか。
- **scripts/cf.sh ルール**: 擬似シーケンスで `wrangler` 直接呼び出しが混入していないか。`op run` 経由で Token を動的注入しているか。
- **暗号化必須性**: Phase 9 機密性レベル判定が「中以上」の場合に base case が SSE-S3 のままになっていないか。
- **空 export 許容**: `INITIAL_BACKUP_FLAG` 分岐が Phase 5 切替手順を含めて Phase 12 に渡されているか。
- **無料枠**: GHA schedule 採用で月 30 日 × 平均 5 分 = 月 150 分以内に収まる試算が記述されているか（GHA private 月 2,000 分の 7.5%）。
- **3 上流前提**: UT-12 / UT-08 / Phase 9 の 3 上流前提が本 Phase で 2 重目明記されているか（3 重明記の 2/3）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | cron 配置 4 案比較 + base case 選定 | 2 | spec_created | GHA + CF cron triggers 併用 |
| 2 | export スクリプト擬似シーケンス | 2 | spec_created | 6 ステップ |
| 3 | R2 lifecycle 戦略 | 2 | spec_created | AC-2 |
| 4 | 暗号化方式 3 案比較 + base case | 2 | spec_created | AC-3 / AC-9 |
| 5 | 1Password 補助保管方針 | 2 | spec_created | 月次のみ |
| 6 | UT-08 通知 payload schema | 2 | spec_created | AC-5 |
| 7 | 復元 runbook 章立て | 2 | spec_created | AC-4 |
| 8 | 机上演習計画 | 2 | spec_created | 月次 / Phase 10 連携 |
| 9 | 空 export 許容バリデーション | 2 | spec_created | AC-6 |
| 10 | secret rotation 方針 | 2 | spec_created | Phase 12 へ申し送り |
| 11 | 3 上流前提 2 重目明記 | 2 | spec_created | 重複明記 2/3 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/main.md | cron 配置 / 擬似シーケンス / lifecycle / 暗号化 / 通知 / runbook 章立て / 演習計画 |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [x] cron 配置 4 案が比較され base case が選定されている（GHA + CF cron triggers 併用）
- [x] export スクリプトの 6 ステップ擬似シーケンスが固定されている
- [x] R2 lifecycle（daily 30 日 / monthly 12 ヶ月 / 月次昇格 copy）が記述されている
- [x] 暗号化方式 3 案が比較され、Phase 9 機密性レベル判定に応じた base case 候補が記述されている
- [x] 1Password Environments 補助保管対象（月次のみ）が記述されている
- [x] UT-08 通知 payload schema が記述されている
- [x] 復元 runbook 8 章立てが記述されている
- [x] 机上演習計画（月次 / `restore-rehearsal-result.md` テンプレ要件）が記述されている
- [x] 空 export 許容バリデーション分岐（`INITIAL_BACKUP_FLAG`）が記述されている
- [x] secret rotation 対象一覧 + 頻度仮値が記述されている
- [x] 3 上流前提が本 Phase で重複明記されている（3 重明記の 2/3）

## タスク100%実行確認【必須】

- 全実行タスク（11 件）が `spec_created`
- 異常系（GHA 失敗 / R2 upload 失敗 / SSE-C key 紛失 / 1Password 障害 / 行数 0 誤検知 / 上流未完了）の対応観点が設計に含まれる
- artifacts.json の `phases[1].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - cron 配置 base case = GHA schedule（主） + Cloudflare cron triggers Worker（ヘルスチェック）併用
  - 暗号化 base case 候補（Phase 9 値次第で SSE-S3 or SSE-C）
  - R2 lifecycle 戦略（daily 30 日 / monthly 12 ヶ月 / 月初 copy 昇格）
  - UT-08 通知 payload schema 仮
  - 復元 runbook 8 章立て + 月次机上演習計画
  - 空 export 許容バリデーション分岐
  - secret rotation 対象 4 件
  - 3 上流前提（UT-12 / UT-08 / Phase 9）を NO-GO 条件として Phase 3 へ
- ブロック条件:
  - cron 配置 base case が決定されていない
  - 暗号化 base case 候補が機密性レベル判定と整合していない
  - R2 lifecycle が daily / monthly 両方を網羅していない
  - UT-08 payload schema が未記述
  - 復元 runbook 章立てに机上演習計画が含まれていない
  - 空 export 許容バリデーションが記述されていない
  - 3 上流前提が重複明記されていない
