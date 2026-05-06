# 実装ガイド — Issue #402 retention purge job / 物理削除

## Part 1: 中学生レベル

### なぜ必要か

たとえばお寺のお墓を考えてみてください。家族が「もうお墓はいりません」と申し出て、お寺の住職さん (admin) が「はい、承認しました」と言ったとします。でも、急にその日のうちに墓石を取り壊すと、もし家族の気が変わったときに困りますよね。

そこで、お寺ではこう決めます。

> 申し出から **180 日** はお墓をそのまま残しておきます。
> 180 日が過ぎたら、毎朝 1 回、住職さんがそっと見回って、期限を過ぎたお墓だけを静かに取り壊します。
> 取り壊し作業は記録帳に「いつ、どのお墓を片付けたか」だけを残します（中身の名前は書きません）。
> 取り壊した日から 7 日以内なら、お寺の地下倉庫から復元できます。
> 7 日を過ぎると、もう戻せません。

このタスクで作るのは、まさにこの「180 日後に静かにお墓を取り壊す仕組み」です。Web サイトで「会員をやめます」と言って admin が承認したあと、180 日経つと、Cloudflare の自動タイマー (Cron Trigger) が毎日深夜に動いて、期限切れのデータだけをデータベースから完全に消します。

### このタスクで何をするか

1. 「期限切れになった会員データだけを探す」プログラムを書く
2. それを毎日深夜 3 時に自動で動かす設定を追加する
3. いきなり消すと怖いので、まず **dry-run** という「もし実行したら何件消えるか教えるだけ」モードを用意する
4. 消した記録は、誰の何だったかは書かずに「何かを消した」とだけ最小限に残す
5. 会員に承認のメールを送るときに「180 日後に完全削除します。本削除日は YYYY-MM-DD です」と先に伝えておく

### 今回作ったもの

- 180 日を過ぎた退会データだけを見つけるための決まり
- 消してよいデータと、記録として残すデータを分ける表
- 実際に消す前に件数だけ確認する試運転の手順
- 作業が終わったことを後から確認できる記録の残し方

### 失敗したらどうなるか・対策

物理削除 = **取り消せない作業**です。だから:

- いきなり本番では実行せず、staging 環境で動作確認する
- まず dry-run で「何件消える？」を確認する
- 実行直前に Cloudflare の "Time Travel" 機能の bookmark を控えておく（7 日以内なら巻き戻せる）
- 7 日を過ぎたら戻せないので、メールで会員に「7 日以内なら復元できます」と先に伝える

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| retention | 保持期間（180 日） |
| purge | 完全に消すこと |
| Cron Trigger | 毎日決まった時刻に自動で動くタイマー |
| dry-run | 試運転（実際には消さない） |
| audit_log | 何をやったかの記録帳 |
| PII | 個人を特定できる情報（名前、メールなど） |
| PITR | データベースを過去の時点まで巻き戻す機能 |

---

## Part 2: 技術者レベル

### 目的

`deleted_members.deleted_at <= now() - 180 days` かつ `purged_at IS NULL` の row を対象に、`member_responses` / `member_identities` / `member_status` の対応 row を物理削除する。`deleted_members` は audit minimum の tombstone として残し、`purged_at` と `retention_policy_version` だけを更新する。Cloudflare Cron Trigger は既存 daily 03:00 JST (`0 18 * * *`) handler に分岐を追加し、cron 本数を増やさない。

### 変更対象（CONST_005）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/jobs/retention-purge.ts` | 新規 | purge job 本体（dry-run / apply 両モード） |
| `apps/api/src/index.ts` or scheduled job dispatcher | edit | 既存 daily cron branch から retention-purge を呼び出す |
| `apps/api/wrangler.toml` | edit | 既存 `0 18 * * *` を再利用。新規 cron 追加なし。`RETENTION_PURGE_MODE=dry-run` を default とする |
| `apps/api/migrations/00XX_add_deleted_members_purge_metadata.sql` | 新規 | `deleted_members.purged_at`, `retention_policy_version` 追加 |
| `apps/api/src/routes/admin/requests.ts` | edit | delete approve response / audit after_json に `retentionPurgeScheduledAt` を追加 |
| `apps/api/src/repository/status.ts` | 変更不要 | 既存 `deleted_at` を retention 起点に使うため approve path への deadline 書き込みは追加しない |
| `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | 新規 | SSOT |

### アーキテクチャ

```
[Cron Trigger (daily 03:00 JST)]
        │
        ▼
[apps/api scheduled handler]
        │
        ▼
[retention-purge.ts]
   ├── selectExpiredTargets(env, { limit })  ← datetime(deleted_at, '+180 days') <= now AND purged_at IS NULL
   ├── if (mode === "dry-run") return targets
   └── for each target:
         ├── DELETE FROM response_fields WHERE response_id IN (...)
         ├── DELETE FROM response_sections WHERE response_id IN (...)
         ├── DELETE FROM member_responses WHERE response_email = identity.response_email
         ├── DELETE FROM member_identities WHERE member_id = ?
         ├── DELETE FROM member_status WHERE member_id = ?
         ├── INSERT INTO audit_log ... WHERE tombstone is still unpurged
         ├── UPDATE deleted_members
         │      SET purged_at = now(), retention_policy_version = 'v1-2026-05'
         │      WHERE member_id = ? AND purged_at IS NULL
         │   (※ row 自体は audit minimum として保持)
         └── all statements run through D1 batch
```

### 主要シグネチャ / データ構造

### APIシグネチャ

```ts
// apps/api/src/jobs/retention-purge.ts
export type RetentionPurgeMode = "dry-run" | "apply";

export interface RetentionPurgeOptions {
  mode: RetentionPurgeMode;
  limit?: number;          // default: 100（cron 1 tick あたり）
  now?: Date;              // 注入可能（テスト用）
}

export interface RetentionPurgeReport {
  mode: RetentionPurgeMode;
  scannedAt: string;
  policyVersion: string;
  targets: Array<{
    memberId: string;
    deletedAt: string;
    deletedAtPlus180DaysAt: string;
    childCounts: { memberResponses: number; memberIdentities: number; memberStatus: number };
  }>;
  applied: Array<{ memberId: string; purgedAt: string }>;
  errors: Array<{ memberId: string; message: string }>;
}

export async function runRetentionPurge(
  env: Env,
  opts: RetentionPurgeOptions
): Promise<RetentionPurgeReport>;
```

### 実行経路

CLI entry は本 cycle では追加しない。実行経路は Cloudflare Workers scheduled handler で、staging / production とも default は `RETENTION_PURGE_MODE=dry-run`。`RETENTION_PURGE_MODE=apply` は staging runtime evidence 確認後、ユーザー明示承認で Cloudflare Variable を切り替えた場合のみ使う。停止時は `RETENTION_PURGE_MODE=off`。

### 設定項目と定数一覧

| 定数 / パラメータ | 値 | 変更条件 |
| --- | --- | --- |
| `RETENTION_DAYS` | `180` | 法令 / 利用規約変更時のみ |
| `CRON_SCHEDULE` | 既存 `0 18 * * *` (UTC) = daily 03:00 JST | 業務時間外帯を変える場合。cron 本数は増やさない |
| `RETENTION_PURGE_MODE` | `dry-run` | `apply` は user-gated、`off` は緊急停止 |
| `RETENTION_PURGE_LIMIT` | 未指定時 `100` | D1 1 tick の負荷上限調整時 |
| `IRREVERSIBLE_BOUNDARY_DAYS` | `7`（PITR 運用上限） | Cloudflare D1 PITR の物理上限 (30 日) 未満で運用ポリシー設定 |

### 入力 / 出力 / 副作用

| 観点 | 内容 |
| --- | --- |
| 入力 | `env` (D1 binding), `opts` (mode / limit / now) |
| 出力 | `RetentionPurgeReport` JSON |
| 副作用 (apply) | 子テーブル DELETE / `deleted_members.purged_at` 更新 / `audit_log` INSERT |
| 副作用 (dry-run) | なし（read-only） |

### エラーハンドリング

| ケース | 扱い |
| --- | --- |
| 子テーブル DELETE が一部失敗 | トランザクション全体を rollback し、`errors[]` に記録。`purged_at` は更新しない |
| `audit_log` INSERT 失敗 | rollback。purge は audit と原子的でなければならない |
| cron tick 重複起動 | `purged_at IS NULL` 条件で idempotent。重複実行しても二重削除しない |
| 1 tick あたり対象が `BATCH_LIMIT` 超 | 翌 tick に持ち越し（運用上 daily 100 件 / 数年分の積み上げに対応可） |

### エッジケース

| ケース | 扱い |
| --- | --- |
| approve 直後の時計 skew | DB が記録した `deleted_at` を retention 起点にする。クライアント時計は使わない |
| member が retention 期間中に再回答（再入会相当） | 別 admin request flow で取り消し処理。本 job は `purged_at IS NULL` のまま手を出さない |
| audit_log table 自体が将来別 retention 対象になる | 本タスクスコープ外。data-retention-policy.md に future TODO として記載 |

### テスト構成

| 種別 | 方法 |
| --- | --- |
| unit | `runRetentionPurge` を fake D1 で実行、dry-run / apply / errors 各 path |
| integration | staging D1 で seed → dry-run → apply → assertion（Phase 11 evidence） |
| invariant | `datetime(deleted_at, '+180 days') > now()` row が drift しないこと |
| audit | `audit_log` 差分行に PII が含まれないこと（unit assertion） |

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- retention-purge
bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging

# staging migration
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# cron 手動 trigger
bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging
```

### DoD

- `datetime(deleted_at, '+180 days') <= now() AND purged_at IS NULL` の row のみが対象
- dry-run mode で副作用 0
- apply mode で `member_responses` / `member_identities` / `member_status` row 0 件化 + `purged_at` 更新 + `audit_log` 1 件追加
- audit_log 差分行に PII 含まず
- cron trigger 経由で自動実行可能
- approve 時通知に retention deadline / purge scheduled date / 7 日復旧境界が含まれる

### Rollback

Phase 10 の 3 段経路（pre-purge / 7 日以内 PITR / 7 日超過は不可逆）に従う。

---

## 実装結果（2026-05-06）

仕様書に従って以下を実装した。

| 種別 | パス |
| --- | --- |
| migration（新規） | `apps/api/migrations/0014_add_deleted_members_purge_metadata.sql` |
| policy SSOT 定数（新規） | `apps/api/src/services/retention-policy.ts` |
| purge job 本体（新規） | `apps/api/src/jobs/retention-purge.ts` |
| ユニットテスト（新規・7 観点 / 11 ケース実装） | `apps/api/src/jobs/retention-purge.test.ts` |
| scheduled handler 配線（編集） | `apps/api/src/index.ts`（既存 `0 18 * * *` daily branch に分岐追加。cron 本数増加なし） |
| runbook（新規） | `docs/runbooks/retention-physical-delete.md` |
| SSOT（既存） | `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` |

### scheduled handler 分岐方針

既存 `0 18 * * *` (daily 03:00 JST) cron 内に retention purge を追加。
`RETENTION_PURGE_MODE` が `dry-run` のときは副作用なし、`apply` のときだけ物理削除する。
production でも default は `dry-run` で、`apply` は user approval 後の明示切替に限る。
`off` の場合は daily branch 内で retention purge を skip する。`purged_at IS NULL` 条件で
idempotent なため、cron 重複起動でも二重削除しない。

### テスト実行結果

```
mise exec -- pnpm vitest run apps/api/src/jobs/retention-purge.test.ts
✓ apps/api/src/jobs/retention-purge.test.ts (11 tests)
```

カバーケース:
1. dry-run mode は副作用ゼロで対象のみ返す
2. apply mode は対象 row を物理削除し tombstone を更新する
3. 期限未到来 row は対象外で残る
4. audit_log 行に PII（email / reason 本文）を含めない
5. 既に `purged_at` が入っている row は重複処理しない（idempotent）
6. limit で対象 row の処理上限を制御できる
7. `deletedAtPlus180DaysAt` は `deleted_at` + 180 日に等しい
8. `RETENTION_PURGE_MODE` 未設定時は dry-run に倒す
9. `RETENTION_PURGE_MODE=apply` は明示設定時のみ返す
10. `RETENTION_PURGE_MODE=off` は job を起動しない
11. 不正な mode / limit は fail-closed

### 確認済みコマンド

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS
- `mise exec -- pnpm vitest run apps/api/src/jobs/retention-purge.test.ts` PASS（11/11）

### 仕様との差分・補足

- 仕様 phase-5 では purge 対象を 3 テーブル（`member_responses` / `member_identities` /
  `member_status`）と明記。実装ではこれに加え、`member_responses` の子テーブルである
  `response_fields` / `response_sections` も同 transaction 順で削除する。子テーブルに
  PII（フォーム回答の生値）が残ったままだと「PII の物理削除」という目的を達成しない
  ため。仕様の意図と矛盾しないと判断し、runbook にも明記した。
- approve 時の API response は `retentionPurgeScheduledAt` を返す。email / マイページの実文言は
  notification 系でこの値を表示する。
- `pnpm run job:retention-purge` の CLI entry は本実装には含めない。cron 経由の
  自動実行を主経路とし、manual 実行は `RETENTION_PURGE_MODE` を user-gated に切り替えて
  wrangler `triggers cron` 経由で行う（runbook 参照）。
