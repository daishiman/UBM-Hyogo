# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

大事なノートを学校に置きっぱなしにすると、火事や水もれで全部なくなる可能性があります。会員情報も同じで、Cloudflare D1（本番DB）が壊れたとき、復旧できる「予備ノート」が手元になければゼロからやり直しになります。だから「予備ノートを毎日作って、別の倉庫にしまう」仕組みが必要です。

### 何をするか

毎日決まった時間に D1 の中身を写し、別倉庫（R2）にしまいます。直近30日分だけ残し、月初の1日分は1年保管します。中身は鍵付きの箱に入れ、月に1回「本当に戻せるか」を試します。最初の日に中身が空でも、それは失敗ではなく「まだ何も書かれていない予備」として扱います。

### 日常の例え

教室の出席簿（本物=D1）を毎日コピーして、職員室の鍵付きキャビネット（予備倉庫=R2）にしまうイメージです。直近30日分は手前の棚（daily prefix）、月初の1日分は奥の棚（monthly prefix）に並べます。コピー機が壊れたら担任に通知（UT-08 通知基盤）が飛びます。

| 専門用語 | 日常語への言い換え |
| --- | --- |
| バックアップ | 予備ノート |
| cron triggers | 毎日決まった時間に動く係 |
| R2 | 予備ノートをしまう倉庫 |
| 30日ローリング | 新しい30日分だけを残す入れ替え |
| 月次スナップショット | 月1回の保存版 |
| 暗号化 | 鍵付きの箱 |
| 復元演習 | 戻せるかを試す練習 |
| 空 export | まだ何も書かれていない予備 |

### 今回作ったもの

本 wave は `spec_created` で閉じる docs-only タスクのため、実コード・実 cron は別 PR に委ねます。本 wave で確定したのは以下の仕様書群です。

| 種別 | 成果物 | 役割 |
| --- | --- | --- |
| タスク仕様 | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-01.md` 〜 `phase-13.md` | Phase 1〜13 の実行可能仕様 |
| アーティファクト台帳 | `artifacts.json` / `outputs/artifacts.json` | root と outputs の parity |
| Phase 11 evidence placeholder | `outputs/phase-11/main.md` 等 | NON_VISUAL 境界の明示 |
| Phase 12 close-out | `outputs/phase-12/*.md`（required 7 種） | 仕様準拠と同期サマリ |
| 後追いタスク | `docs/30-workflows/unassigned-task/UT-06-FU-E-*.md` 3 件 | 月次復元演習 SOP・暗号化方式確定・GHA 監視拡張 |
| 仕様書反映 | aiworkflow-requirements `references/deployment-cloudflare.md` / `database-operations.md` / `task-workflow-active.md` | canonical reference 同期 |
| 索引更新 | aiworkflow-requirements `indexes/quick-reference.md` / `resource-map.md` / `topic-map.md` / `keywords.json` | 検索性の維持 |
| LOGS | `docs/30-workflows/LOGS.md` / 両 skill `LOGS/_legacy.md` | 同一 wave 同期 |

## Part 2: 技術者向け

| 項目 | 仕様 |
| --- | --- |
| 実行基盤 | GHA schedule を export 主経路、Cloudflare cron triggers を R2 latest healthcheck として併用 |
| export 経路 | `bash scripts/cf.sh d1 export` 相当の経路に限定し、Cloudflare CLI ラッパ運用を維持 |
| 保存先 | R2 を第一保管先、1Password Environments を補助保管先 |
| 世代管理 | daily prefix は直近30日、monthly prefix は12ヶ月 |
| 暗号化 | R2 SSE 標準を base case とし、機密性レベルに応じて SSE-C / KMS を再判定 |
| 復元 | R2 GET、展開、D1 import、smoke の順で15分未満を目標 |
| 通知 | UT-08 通知基盤へ失敗イベントを連携 |
| 禁止 | `apps/web` からの D1 直接アクセス、secret 値の文書化、ラッパを迂回した直接CLI手順 |

### TypeScript 型定義

実コードは別 PR で扱うが、本 wave で固定する R2 object metadata と UT-08 alert payload の契約 schema を以下に明示する。実装 PR は本契約に従って TypeScript / YAML を記述する。

```typescript
// R2 object metadata (PUT 時に付与する customMetadata)
export interface D1BackupObjectMetadata {
  env: "production" | "staging";
  createdAt: string;          // ISO 8601 (UTC)
  backupKind: "daily" | "monthly";
  encrypted: true;            // SSE 標準により常に true
  sourceDb: string;           // 例: "ubm-hyogo-db-prod"
  workflowRunId: string;      // GHA run id（または cron trigger id）
  schemaVersion: string;      // 直近適用済 migration ファイル名
}

// UT-08 通知基盤に送る失敗イベント
export type D1BackupFailureReason =
  | "export_failed"
  | "upload_failed"
  | "metadata_invalid"
  | "encryption_unverified"
  | "consecutive_failure_threshold_exceeded";

export interface D1BackupAlertPayload {
  taskId: "UT-06-FU-E";
  severity: "warning" | "critical";
  reason: D1BackupFailureReason;
  failedAt: string;           // ISO 8601 (UTC)
  attempt: number;            // 連続失敗カウント (>=1)
  workflowRunUrl?: string;    // GHA run へのリンク（あれば）
}

// 復元演習結果（outputs/phase-10/restore-rehearsal-result.md の構造化部分）
export interface RestoreRehearsalRecord {
  rehearsedAt: string;        // ISO 8601 (UTC)
  sourceObjectKey: string;    // 例: "monthly/2026-04/ubm-hyogo-db-prod.sql.gz"
  rtoSeconds: number;         // RTO 計測値（合格基準: < 900）
  smokeChecksPassed: boolean;
  notes?: string;
}
```

### CLIシグネチャ

実装 PR は本シグネチャに沿って `.github/workflows/d1-backup.yml` と Cloudflare cron handler を記述する。

```bash
# D1 export 主経路（GHA schedule 内で実行）
bash scripts/cf.sh d1 export <DB_NAME> --env production --output <TMP_FILE>

# R2 へアップロード（gzip 後）
bash scripts/cf.sh r2 object put <BUCKET>/<PREFIX>/<KEY> --file <TMP_FILE_GZ> \
  --metadata env=production,createdAt=<ISO>,backupKind=daily,encrypted=true,...

# 月初昇格（daily → monthly）
bash scripts/cf.sh r2 object copy \
  <BUCKET>/daily/<YYYY-MM-DD>/<KEY> \
  <BUCKET>/monthly/<YYYY-MM>/<KEY>

# Cloudflare cron healthcheck（apps/api/wrangler.toml 内 cron trigger）
# Workers handler が R2 latest object の age と metadata を検証する
```

### 使用例

```bash
# 日次バックアップを手動 dry-run で確認する場合
TMP=$(mktemp -t d1-backup-XXXXXX.sql)
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output "$TMP"
gzip "$TMP"
bash scripts/cf.sh r2 object put ubm-hyogo-backups/daily/$(date -u +%F)/ubm-hyogo-db-prod.sql.gz \
  --file "${TMP}.gz" \
  --metadata env=production,createdAt=$(date -u +%FT%TZ),backupKind=daily,encrypted=true,sourceDb=ubm-hyogo-db-prod,workflowRunId=manual-$(uuidgen),schemaVersion=$(ls -1 apps/api/migrations | tail -1)
rm -f "${TMP}.gz"
```

```typescript
// Cloudflare Workers cron handler（healthcheck のみ。export はしない）
export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const list = await env.BACKUP_BUCKET.list({ prefix: "daily/", limit: 1 });
    const latest = list.objects[0];
    if (!latest) {
      await notifyUt08(env, { reason: "upload_failed", severity: "critical", attempt: 1 });
      return;
    }
    const ageHours = (Date.now() - latest.uploaded.getTime()) / 36e5;
    if (ageHours > 26) {
      await notifyUt08(env, { reason: "consecutive_failure_threshold_exceeded", severity: "critical", attempt: Math.ceil(ageHours / 24) });
    }
  },
};
```

### エラーハンドリング

実装 PR が満たすべきエラー処理境界を契約として固定する。

| 障害 | 検出経路 | 対応 |
| --- | --- | --- |
| `wrangler d1 export` 失敗 | GHA step の non-zero exit | `D1BackupAlertPayload.reason = "export_failed"` で UT-08 通知 / GHA step `continue-on-error: false` |
| 初回 migration 前の空 export | export ファイル行数 0 | 初回フラグ（`schemaVersion` が空 / placeholder の場合）で「成功」扱い。それ以外は `metadata_invalid` で通知 |
| R2 PUT 失敗 | `cf.sh r2 object put` exit code | 3 回リトライ（exponential backoff: 30s/120s/300s）後 `upload_failed` 通知 |
| metadata 不備 | Cloudflare cron healthcheck の metadata 検証 | `metadata_invalid` で通知。daily 直近1件が条件を満たさない場合は warning、24h 以上満たさない場合は critical |
| 暗号化未確認 | R2 object の `encrypted` metadata 欠落 | `encryption_unverified` で warning 通知。連続 3 件で critical 昇格 |
| 3 連続失敗 | UT-08 側 attempt counter | `consecutive_failure_threshold_exceeded` で critical / runbook 起動 |

`apps/web` から D1 binding を直接叩く形で迂回することは禁止（CLAUDE.md 不変条件 #5）。`wrangler login` の OAuth トークン保持も禁止。

### エッジケース

| ケース | 期待挙動 |
| --- | --- |
| 初回 migration 適用前の export（行数 0） | 「成功」として扱う。`schemaVersion` placeholder 判定で分岐。runtime PASS と矛盾しない |
| daily と monthly が同日に走る（毎月 1 日 00:00 UTC） | daily を先に実行 → monthly は daily 成果物の `r2 object copy` で生成。export を 2 回走らせない |
| GHA schedule の遅延（GitHub 側 outage） | Cloudflare cron healthcheck が age > 26h を検出して通知。GHA 復旧後の次回成功で healthcheck も自動回復 |
| R2 容量警告（無料枠 10GB 接近） | 月次のみ保持し daily を 14 日に短縮する代替案を runbook に記載。zstd 圧縮への移行は後続タスク |
| L3 機密データが schema に追加された場合 | 暗号化方式を SSE-C / KMS に再判定（後追い `UT-06-FU-E-encryption-mode-finalization-001.md`） |
| 復元演習の RTO 超過（>15 分） | runbook 改訂タスクをエスカレーション。当該月は warning 扱いで完了とせず unassigned task を再起票 |
| GHA private 月 2,000 分枠の圧迫 | GHA を採用する場合は UT-05-FU-003 監視対象として登録（後追い `UT-06-FU-E-gha-backup-monitoring-extension-001.md`） |

### 設定項目と定数一覧

| 設定 | 値 | 出典 |
| --- | --- | --- |
| daily 保持日数 | 30 日（R2 lifecycle policy） | AC-2 / Phase 2 |
| monthly 保持月数 | 12 ヶ月 | AC-2 / Phase 2 |
| 月次昇格タイミング | 毎月 1 日 00:00 UTC（daily 成功直後に copy） | Phase 2 |
| RTO 合格基準 | < 900 秒（15 分） | AC-4 / Phase 10 |
| 連続失敗 critical 閾値 | 3 回 | Phase 2 / UT-08 統合 |
| Cloudflare cron healthcheck age 閾値 | warning > 24h、critical > 26h | Phase 2 |
| 圧縮方式 base case | gzip（zstd は無料枠圧迫時の検討事項） | Phase 2 |
| 暗号化 base case | R2 SSE 標準（SSE-C / KMS は機密性 L3 で再判定） | AC-3 / AC-9 |
| daily prefix | `daily/<YYYY-MM-DD>/` | Phase 2 |
| monthly prefix | `monthly/<YYYY-MM>/` | Phase 2 |
| export ラッパ | `bash scripts/cf.sh d1 export`（wrangler 直接禁止） | AC-7 / CLAUDE.md |
| 通知経路 | UT-08 通知基盤（webhook） | AC-5 |
| 監視対象登録（GHA 採用時） | UT-05-FU-003 | AC-8 |

### テスト構成

実装 PR で構築すべきテスト層と検証方法を契約として固定する。本 wave は `spec_created` のため実テストコードは含まない。

| 層 | 対象 | 検証方法 |
| --- | --- | --- |
| unit | `D1BackupObjectMetadata` / `D1BackupAlertPayload` の schema validator（zod 等） | Vitest（`apps/api/__tests__/backup-metadata.test.ts` 想定） |
| unit | 初回 migration 空 export 判定ロジック | Vitest（行数 0 + placeholder schemaVersion → 成功扱い） |
| integration | GHA workflow の dry-run（`act` または PR 上の workflow_dispatch） | `.github/workflows/d1-backup.yml` 単体起動で export → R2 PUT → metadata 確認まで通る |
| integration | Cloudflare cron healthcheck handler | `wrangler dev --test-scheduled` で R2 list / age 計算 / UT-08 mock 通知をシミュレート |
| evidence | Phase 11 NON_VISUAL evidence 4 層（command transcript / R2 listing / metadata / UT-08 alert trace） | Phase 11 manual smoke で取得（本 wave は placeholder） |
| operational | 月次復元演習（RTO < 15 分） | `outputs/phase-10/restore-rehearsal-result.md` に追記。後追い `UT-06-FU-E-monthly-restore-rehearsal-sop-001.md` で SOP 化 |

Runtime 実装、実 cron 有効化、実 export、実 restore rehearsal は Phase 13 のユーザー承認後に別 PR で扱う。本 implementation guide の契約と乖離する場合は本ファイルを先に改訂する。
