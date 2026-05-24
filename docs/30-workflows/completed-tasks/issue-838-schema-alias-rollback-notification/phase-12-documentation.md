# Phase 12: ドキュメント更新 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 12 |
| Phase名 | ドキュメント更新 |
| 前提Phase | Phase 11 |
| 後続Phase | Phase 13 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

実装完了した rollback 通知機能について、実装ガイド作成・システム仕様書更新・ドキュメント変更履歴・未タスク検出・スキルフィードバックの 5 タスクを完遂し、Phase 13（PR 作成）の前提を整える。

---

## 実行タスク

task-specification-creator Phase 12 の必須 5 タスク（全て完了必須）。詳細は各 Task セクションを参照。

| # | タスク | 必須 | 詳細セクション |
| --- | --- | --- | --- |
| 1 | 実装ガイド作成（Part 1 中学生レベル / Part 2 技術者レベル） | ✅ | 「Task 1」 |
| 2 | システム仕様書更新（Step 1-A〜1-C + 条件付き Step 2） | ✅ | 「Task 2」 |
| 3 | ドキュメント更新履歴作成 | ✅ | 「Task 3」 |
| 4 | 未タスク検出レポート（0件でも出力必須） | ✅ | 「Task 4」 |
| 5 | スキルフィードバックレポート（改善点なしでも出力必須） | ✅ | 「Task 5」 |
| 6 | Phase 12 compliance check（CI gate 必須生成物） | ✅ | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## Task 1: 実装ガイド作成

**成果物**: `outputs/phase-12/implementation-guide.md`

### Part 1: 中学生レベルの概念説明

#### rollback 通知とは何か

「rollback（ロールバック）」とは、「いったんやったことを元に戻す操作」のことです。たとえばお店の商品リストに間違った値段を登録してしまったとき、「元に戻す」ボタンを押す感じです。

このシステムでは、「schema alias（スキーマエイリアス）」という「フォーム項目の別名設定」を元に戻す機能があります。この操作は**管理者だけができる重要な操作**なので、「誰かがこの操作をやった」ことを、担当者にすぐ知らせる必要があります。

#### なぜ通知が必要か

- rollback は**データを変更する操作**なので、後から「いつ・誰が・何を戻したか」がわかるようにする必要があります
- システムは自動で audit log（操作記録）を残しますが、ログを毎日チェックするのは大変です
- そこで **rollback が起きたらすぐに Slack（チャットツール）または メール で知らせる**仕組みを作ります
- 通知が届かなかった場合でも（= ネットワークの問題で送れなかった場合でも）、**rollback 操作そのものは成功したままにする**ことが重要です

#### 比喩：郵便ポスト投函

rollback の処理（データ変更）= 大事な書類にハンコを押すこと。通知 = 押し終わったあと郵便ポストに投函すること。投函に失敗しても（ポストが見つからなくても）、書類へのハンコは有効なままです。

---

### Part 2: 技術者向け実装詳細

#### 新規ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | 通知 dispatch・payload 構築・redaction・audit 記録 |
| `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | unit / contract テスト |

#### 編集ファイル

| ファイル | 変更内容 |
| --- | --- |
| `apps/api/src/routes/admin/schema.ts` | rollback route 末尾に best-effort 通知発火 + audit 記録を追加 |
| `apps/api/src/routes/admin/_shared.ts` | `AdminRouteEnv` に `OPS_NOTIFICATION_EMAIL` 等の型追加（要 Phase 1 確認） |
| `apps/api/wrangler.toml` | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `OPS_NOTIFICATION_EMAIL` を追加 |
| `apps/api/.dev.vars.example` | `OPS_NOTIFICATION_EMAIL=op://Vault/Item/Field` 形式で追記 |

#### 型定義

```typescript
// RollbackNotificationStatus: 通知の最終状態
export type RollbackNotificationStatus = "sent" | "failed" | "skipped";

// RollbackNotificationChannel: 通知に成功した channel
export type RollbackNotificationChannel = "slack" | "mail" | "none";

// RollbackNotificationPayload: PII を含まない redaction 済み payload
export interface RollbackNotificationPayload {
  readonly aliasId: string;
  readonly newVersion: number;
  readonly affectedResponseCount: number;
  readonly recomputeRequired: boolean;
  readonly rolledBackAt: string;        // ISO8601
  readonly actorRef: string;            // redact 済み（生 email を含まない）
}

// RollbackNotificationResult: dispatch 関数の戻り値（audit に記録する）
export interface RollbackNotificationResult {
  readonly status: RollbackNotificationStatus;
  readonly channel: RollbackNotificationChannel;
  readonly attempts: number;
  readonly errorClass?: string;         // sanitized token only, provider detail is not stored
  readonly dispatchedAt: string;
}

// RollbackNotificationDeps: テスト差し替え可能な依存
export interface RollbackNotificationDeps {
  readonly slackWebhookUrl?: string | undefined;
  readonly mailSender?: MailSender | undefined;
  readonly opsEmail?: string | undefined;
  readonly fromEmail?: string | undefined;
  readonly sendSlack?: typeof sendSlackMessage;
  readonly now?: () => string;
}
```

#### 関数シグネチャ

```typescript
// 通知 dispatch（best-effort・throw しない）
export async function dispatchSchemaAliasRollbackNotification(
  deps: RollbackNotificationDeps,
  payload: RollbackNotificationPayload,
): Promise<RollbackNotificationResult>;

// rollback 結果から redaction 済み payload を構築
export function buildRollbackNotificationPayload(
  result: SchemaAliasRollbackResult,
  actorEmail: string | null | undefined,
): RollbackNotificationPayload;

// actor email を固定ラベルへ redaction（例: "admin@example.com" → "admin:redacted"）
export function redactRollbackActor(actorEmail: string | null | undefined): string;

// audit_log に schema_alias.rollback_notification entry を記録（best-effort・throw しない）
export async function recordRollbackNotificationAudit(
  c: DbCtx,
  input: {
    result: RollbackNotificationResult;
    aliasId: string;
    actorEmail: string;
  },
): Promise<void>;
```

#### audit_log 新規 action 値

| カラム | 値 |
| --- | --- |
| action | `schema_alias.rollback_notification`（新規） |
| target_type | `schema_alias` |
| target_id | aliasId |
| before_json | NULL |
| after_json | `{ "status": "sent"|"failed"|"skipped", "channel": "slack"|"mail"|"none", "attempts": N, "errorClass": "<sanitized>"|null, "dispatchedAt": "<ISO8601>" }` |

> `after_json` には actor の生 email・stableKey・token を含めない（AC-2 遵守）。

#### errorClass の sanitize ルール

| 元のエラー | errorClass |
| --- | --- |
| Slack 4xx/5xx レスポンス | `slack` または `slack_status_<status>` 系の sanitized token |
| Slack ネットワークエラー | Error.name 由来の sanitized token（例: `TypeError`） |
| mail provider エラー | `mail_provider_<status>` 等の sanitized token |
| mail ネットワークエラー | Error.name 由来の sanitized token |
| config 未設定（skip） | null（status=skipped） |

#### config gate の判定順序

```
1. SLACK_WEBHOOK_URL あり → Slack 送信試行
   ├─ 成功 → status='sent', channel='slack'
   └─ 失敗 → 2へ
2. MAIL_PROVIDER_KEY && opsEmail あり → mail 送信試行
   ├─ 成功 → status='sent', channel='mail'
   └─ 失敗 → status='failed', channel='mail', errorClass=<sanitized>
3. どちらも未設定 → status='skipped', channel="none"
```

#### route 改修の全体構造

```typescript
// apps/api/src/routes/admin/schema.ts（rollback route 末尾）
const result = await schemaAliasRollback(db, { aliasId, actor });

// best-effort 通知（D1 commit 完了後・rollback 200 を壊さない）
try {
  const payload = buildRollbackNotificationPayload(result, actor);
  const notifResult = await dispatchSchemaAliasRollbackNotification(deps, payload);
  await recordRollbackNotificationAudit(db, {
    aliasId: result.aliasId,
    actorEmail: actor,
    result: notifResult,
  });
} catch {
  // swallow: rollback result を壊さない（二重隔離の外側）
}

return c.json(result, 200);
```

#### env 設定（非機密は vars、機密は Cloudflare Secrets）

| 変数 | 種別 | 管理場所 | `.dev.vars.example` 記載形式 |
| --- | --- | --- | --- |
| `SLACK_WEBHOOK_URL` | 機密 | Cloudflare Secrets（既存） | `op://Vault/Item/Field` 参照（実値を書かない） |
| `MAIL_PROVIDER_KEY` | 機密 | Cloudflare Secrets（既存） | `op://Vault/Item/Field` 参照（実値を書かない） |
| `OPS_NOTIFICATION_EMAIL` | 非機密 | `wrangler.toml [vars]`（新規） | `ops@example.com` のみ許容（実 email 記録可） |

---

### 視覚証跡セクション

**NON_VISUAL のため、Phase 11 スクリーンショットは不要です。**

本タスクの UI/UX 変更は一切なく、変更対象は `apps/api` バックエンドのみです。代替証跡として以下を参照してください。

| 証跡 | パス | 内容 |
| --- | --- | --- |
| 最終レビュー結果 | `outputs/phase-10/final-review-result.md` | Phase 10 PASS 判定・設計整合確認 |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | staging smoke ログ・AC-1〜AC-7 達成確認 |

---

## Task 2: システム仕様書更新

### Step 1-A: 完了タスク記録・ドキュメントリンク・変更履歴

**実行手順**:

1. 以下のファイルを更新・新規追記する

**`docs/30-workflows/LOGS.md`** に以下を追記:
```
| issue-838-schema-alias-rollback-notification | schema alias rollback 発生時の best-effort 運用通知（Slack 優先 / mail fallback）| feat | 2026-05-24 | COMPLETED |
```

**`.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`** に以下を追記:
```
| issue-838-schema-alias-rollback-notification | rollback 通知 dispatch + audit 記録実装 | 2026-05-24 |
```

**`.claude/skills/aiworkflow-requirements/indexes/topic-map.md`** に `schema_alias.rollback_notification` の audit action を追記する（既存の rollback 系エントリの近傍）。

2. 変更履歴エントリを `outputs/phase-12/system-spec-update-log.md` に記録する

**期待される成果物**: `outputs/phase-12/system-spec-update-log.md`

---

### Step 1-B: 実装状況テーブル更新

**実行手順**:

1. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` または同等の実装状況ドキュメントで、issue-838 の実装状態を `COMPLETED` に更新する（ファイルが存在しない場合はスキップして理由を記録）
2. 更新内容を `outputs/phase-12/system-spec-update-log.md` に追記する

---

### Step 1-C: 関連タスクテーブル更新

**実行手順**:

1. 以下の関連タスクリファレンスに issue-838 の完了を追記する（存在するファイルのみ更新）:

   - `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/` の followup 記録（followup-007 が完了した旨を追記）
   - `docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md` に「→ issue-838 で実装完了」を追記（ファイルが存在する場合）

2. 更新内容を `outputs/phase-12/system-spec-update-log.md` に追記する

---

### Step 2: aiworkflow-requirements 仕様更新（新規インターフェース追加）

**目的**: `RollbackNotificationPayload` / `RollbackNotificationResult` / `RollbackNotificationDeps` の新規インターフェースと `schema_alias.rollback_notification` audit action を仕様正本に追記する。

**実行手順**:

1. `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` を Read し、admin schema 系 endpoint セクションに rollback route の通知対応記述を追記する

追記内容（要約）:
```
### POST /admin/schema/aliases/:aliasId/rollback
...（既存記述）...
#### 副作用（best-effort）
- rollback 成功後に `dispatchSchemaAliasRollbackNotification()` を呼び出し Slack/mail へ運用通知を発火する
- 通知結果は `audit_log` に `action = "schema_alias.rollback_notification"` として記録される
- 通知失敗は rollback の HTTP 200 応答を妨げない
```

2. `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`（または同等の audit log schema ドキュメント）を Read し、`schema_alias.rollback_notification` action の定義を追記する

追記内容（要約）:
```
| schema_alias.rollback_notification | schema_alias | aliasId | NULL | { status, channel, attempts, errorClass, dispatchedAt } |
```

3. 更新内容を `outputs/phase-12/system-spec-update-log.md` に追記する

---

## Task 3: ドキュメント更新履歴作成

**実行手順**:

1. 以下コマンドで変更履歴を自動生成する

```bash
mise exec -- node scripts/generate-documentation-changelog.js \
  --feature issue-838-schema-alias-rollback-notification \
  --output outputs/phase-12/documentation-changelog.md
```

2. スクリプトが存在しない / エラーの場合は手動で `outputs/phase-12/documentation-changelog.md` を作成し、Task 2 で更新したファイルの一覧と変更概要を記録する

手動作成の場合のテンプレート:
```markdown
# Documentation Changelog — issue-838-schema-alias-rollback-notification

| ファイル | 変更種別 | 概要 | 日付 |
| --- | --- | --- | --- |
| docs/30-workflows/LOGS.md | 追記 | issue-838 完了エントリ追加 | 2026-05-24 |
| .claude/skills/aiworkflow-requirements/LOGS/_legacy.md | 追記 | rollback 通知実装ログ追加 | 2026-05-24 |
| .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 再生成 | schema_alias.rollback_notification action 追記 | 2026-05-24 |
| .claude/skills/aiworkflow-requirements/references/api-endpoints.md | 更新 | rollback route 通知副作用の記述追加 | 2026-05-24 |
| .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | 更新 | schema_alias.rollback_notification action 追記 | 2026-05-24 |
| apps/api/wrangler.toml | 更新 | OPS_NOTIFICATION_EMAIL vars 追加 | 2026-05-24 |
| apps/api/.dev.vars.example | 更新 | OPS_NOTIFICATION_EMAIL op 参照追記 | 2026-05-24 |
```

**期待される成果物**: `outputs/phase-12/documentation-changelog.md`

---

## Task 4: 未タスク検出レポート

> **0件でも出力必須です。**

**実行手順**:

1. 以下のソースを確認し、本タスクのスコープ外に残った作業項目を収集する:
   - `index.md` の「含まない」セクション
   - Phase 2 の不採用案 B（outbox generic 化）
   - Phase 3 のレビュー指摘（MINOR 判定項目）
   - Phase 11 の Semantic / AI UX 評価の MINOR 指摘
   - コードベース内の `TODO` / `FIXME` コメント（新規追加分のみ）
   - Phase 4/6 で確認された regression 候補

2. `outputs/phase-12/unassigned-task-report.md` を作成する

```markdown
# 未タスク検出レポート — issue-838-schema-alias-rollback-notification

作成日: 2026-05-24

## 検出件数

| カテゴリ | 件数 |
| --- | --- |
| スコープ外（別 issue 管理） | N |
| Phase 3 MINOR 指摘（フォローアップ候補） | N |
| Phase 11 MINOR 指摘 | N |
| TODO/FIXME（新規追加分） | N |
| 合計 | N |

## 検出事項一覧

### スコープ外（別 issue 管理）

| # | 内容 | 根拠 | 追跡先 |
| --- | --- | --- | --- |
| U-1 | bulk rollback 通知（複数 aliasId の一括 rollback 通知） | index.md「含まない」followup-006 | 別 issue として追跡 |
| U-2 | 集計再実行（rollback 後の response_fields reverse-backfill） | index.md「含まない」issue #836 | issue #836 で管理 |
| U-3 | notification_outbox の generic 化（admin 通知用途への拡張） | Phase 2 不採用案 B | 別 issue として追跡（scale:large・破壊的変更）|

### Phase 3 MINOR 指摘（フォローアップ候補）

> Phase 3 設計レビューで MINOR 判定となった項目を記録する。0件の場合は「なし」と明記。

### Phase 11 MINOR 指摘

> Phase 11 Semantic / AI UX 評価での MINOR 指摘を記録する。0件の場合は「なし」と明記。

### TODO/FIXME（新規追加分）

> `schemaAliasRollbackNotification.ts` および編集ファイルに追加した TODO/FIXME を記録する。0件の場合は「なし」と明記。

## 未タスクが 0件の場合の明示

検出された未タスクのうち実施保留・先送りとなったものは 0件です（上記はすべて「本質的なスコープ外」または「MINOR 改善候補」として記録）。
```

**期待される成果物**: `outputs/phase-12/unassigned-task-report.md`

---

## Task 5: スキルフィードバックレポート

> **改善点なしでも出力必須です。**

**実行手順**:

1. 本タスク実行を通じて発見した `task-specification-creator` スキルおよびプロジェクトワークフローへのフィードバックを収集する
2. `outputs/phase-12/skill-feedback-report.md` を作成する

```markdown
# スキルフィードバックレポート — issue-838-schema-alias-rollback-notification

作成日: 2026-05-24

## 対象スキル

- task-specification-creator（Phase 1-13 仕様書生成）
- aiworkflow-requirements（仕様参照・更新）

## フィードバック事項

### task-specification-creator

| # | 観点 | 内容 | 改善提案 |
| --- | --- | --- | --- |
| F-1 | NON_VISUAL 宣言の伝播 | Phase 11 / 12 の視覚証跡セクション記述が NON_VISUAL プロジェクトでは不要な記述を含む可能性がある | NON_VISUAL 宣言時に Phase 11 / 12 の screenshot 関連項目を自動スキップするテンプレート分岐を追加する |
| F-2 | best-effort 通知パターンの再利用 | issue #588 / #401 のパターンが複数タスクで再利用されており、テンプレート化できる | `best-effort-notification-pattern.md` をスキル参照資料として追加する |

> 改善点が見当たらない場合は「なし（良好）」と記載する。

### aiworkflow-requirements

| # | 観点 | 内容 | 改善提案 |
| --- | --- | --- | --- |
| — | — | 今回の作業では仕様ドキュメントの参照・更新は円滑に行えた | 特になし |

## 総評

> 本タスクで気づいた仕様書作成ワークフロー全体への改善提案・よかった点・困難だった点を自由記述する。
```

**期待される成果物**: `outputs/phase-12/skill-feedback-report.md`

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 11 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | smoke evidence（実装ガイド視覚証跡代替） |
| Phase 10 最終レビュー | `outputs/phase-10/final-review-result.md` | PASS 確認（実装ガイド視覚証跡代替） |
| Phase 2 設計 | `phase-2-design.md` | 型・関数シグネチャの正本 |
| Phase 3 設計レビュー | `phase-3-design-review.md` | MINOR 指摘（未タスク候補） |
| index.md | `index.md` | スコープ「含まない」一覧 |
| best-effort パターン | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-588-fallback-alert-slack-mail-extension-2026-05.md` | 設計判断の背景 |
| generate-documentation-changelog | `scripts/generate-documentation-changelog.js` | 変更履歴自動生成 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | Part 1 中学生説明 + Part 2 技術者向け詳細 + 視覚証跡代替 |
| システム仕様書更新ログ | `outputs/phase-12/system-spec-update-log.md` | 更新ファイル一覧・変更概要 |
| ドキュメント変更履歴 | `outputs/phase-12/documentation-changelog.md` | 自動または手動生成の変更履歴 |
| 未タスク検出レポート | `outputs/phase-12/unassigned-task-report.md` | 0件でも出力必須 |
| スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力必須 |

---

## 完了条件

- [ ] `outputs/phase-12/implementation-guide.md` を作成した（Part 1 中学生説明 + Part 2 技術者向け詳細 + 視覚証跡セクション）
- [ ] システム仕様書更新（Step 1-A〜C + Step 2）を実施した
- [ ] `outputs/phase-12/documentation-changelog.md` を作成した
- [ ] `outputs/phase-12/unassigned-task-report.md` を作成した（0件でも出力）
- [ ] `outputs/phase-12/skill-feedback-report.md` を作成した（改善点なしでも出力）
- [ ] 実装ガイドの視覚証跡セクションに「NON_VISUAL のためスクリーンショット不要」と明記した
- [ ] `after_json` の PII 非包含が技術者向け説明に明記されている

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-13-pr.md`（PR 作成）へ進む。Phase 12 完了まで Phase 13 へ進まない。
