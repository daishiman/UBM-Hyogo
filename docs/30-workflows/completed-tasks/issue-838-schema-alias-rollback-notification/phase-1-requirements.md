# Phase 1: 要件定義 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 1 |
| Phase名 | 要件定義 |
| 前提Phase | なし |
| 後続Phase | Phase 2 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

issue #838「schema alias rollback 発生時の通知」を最新コードへ最適化した上で、実装に必要な scope・受入条件・inventory・命名規則を固定する。P50 チェックで実装状態を確認し、後続 Phase の前提を確定する。

---

## Step 0: P50 チェック（必須）

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に rollback 通知の実装が存在するか | No（未実装） | 通常の新規実装 Phase とする（`implementation_mode: new`） |
| rollback 本体（issue #778）が完了済みか | Yes（`schemaAliasRollback.ts` / route `schema.ts:381`） | rollback 本体は編集せず、通知は route 層で発火 |
| 汎用 Slack / mail 送信基盤が存在するか | Yes（`sendSlackMessage` / `MailSender`） | 再利用する。新規送信ライブラリは作らない |

確認コマンド（実行して結果を `outputs/phase-1/` に記録）:

```bash
# rollback 通知発火コードの不在確認（0 件であること）
grep -rn "sendSlackMessage\|MailSender\|notify\|dispatch" apps/api/src/routes/admin/schema.ts
grep -rn "rollback" apps/api/src/workflows/schemaAliasRollback.ts | grep -i "slack\|mail\|notif"
# 既存送信基盤の存在確認
grep -rn "export async function sendSlackMessage" apps/api/src/lib/slack-sender.ts
grep -rn "export interface MailSender\|createResendSender" apps/api/src/services/mail/magic-link-mailer.ts
```

---

## タスク分類

- **タスク種別**: NON_VISUAL（`apps/api` バックエンドのみ。UI/UX 変更なし）
- **Phase 11 方針**: NON_VISUAL。screenshot 不要。primary evidence は vitest / typecheck / lint + staging smoke。
- **新規 IPC surface**: なし（Hono route の内部処理拡張のみ）

---

## 実行タスク

### タスク0: ブランチ・main 取り込み整合確認

**目的**: 作業ブランチが最新統合ブランチ（dev）と整合していることを確認する。

**実行手順**:
1. `git branch --show-current` で作業ブランチが `docs/issue-838-schema-alias-rollback-notification` であることを確認する
2. `git fetch origin dev` を実行し `git rev-list --left-right --count HEAD...origin/dev` で遅れを確認する
3. 遅れがある場合は `git merge origin/dev` で取り込み、コンフリクトを解消する

**期待される成果物**: `outputs/phase-1/branch-sync-check.md`（ブランチ名・dev との差分・取り込み結果）

---

### タスク1: 既存コード inventory と命名規則の固定

**目的**: 編集・新規対象ファイルを特定し、既存の命名規則を analyze して新規コードに反映する。

**実行手順**:
1. 下記 inventory テーブルの各ファイルを Read し、関数・型の命名規則を記録する
2. 既存通知系モジュールの命名（`sendSlackMessage` / `createResendSender` / `runNotificationDispatchTick`）の camelCase 規則を確認する
3. workflow ファイルの export 規則（`schemaAliasRollback` のような camelCase 関数 export、`SchemaAliasRollbackFailure` のような PascalCase エラークラス）を確認する
4. env 型（`AdminRouteEnv`）の定義場所と `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` の宣言箇所を特定する

**inventory テーブル**:

| パス | 役割 | 本タスクでの扱い |
| --- | --- | --- |
| `apps/api/src/workflows/schemaAliasRollback.ts` | rollback 本体 | 参照のみ（編集しない）。返り値 `SchemaAliasRollbackResult` を通知 input に使う |
| `apps/api/src/routes/admin/schema.ts` | rollback route | **編集**（通知発火 + audit 記録を追加） |
| `apps/api/src/routes/admin/_shared.ts` | `AdminRouteEnv` 型 | **編集の可能性**（通知 env を型に追加。要 Read 確認） |
| `apps/api/src/lib/slack-sender.ts` | Slack 送信 | 参照・再利用 |
| `apps/api/src/services/mail/magic-link-mailer.ts` | mail 送信 I/F | 参照・再利用 |
| `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | 通知 dispatch | **新規作成** |
| `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts` | unit テスト | **新規作成** |
| `apps/api/migrations/0003_auth_support.sql` | `audit_log` DDL | 参照のみ（migration 追加不要） |
| `apps/api/wrangler.toml` | env vars | **編集の可能性**（通知 var 追記。要確認） |
| `apps/api/.dev.vars.example` | env サンプル | **編集の可能性**（op 参照追記） |

**期待される成果物**: `outputs/phase-1/inventory.md`（上記テーブル + 命名規則メモ + env 宣言箇所）

---

### タスク2: 受入条件（AC）の確定

**目的**: index.md の AC-1〜AC-7 を本文に明示列挙し、検証可能な形に固定する。

**実行手順**:
1. 下記 AC を `outputs/phase-1/acceptance-criteria.md` に転記する
2. 各 AC に対応する検証 Phase（Phase 4 テスト / Phase 11 smoke）を明記する

**受入条件（明示列挙）**:

- **AC-1**: rollback 成功時に Slack（優先）または mail（fallback）へ運用通知が送られる。→ 検証: Phase 4 unit / Phase 11 smoke
- **AC-2**: 通知 payload に secret / PII（actor email 生値・stableKey 生値・token）が含まれない。→ 検証: Phase 4 redaction unit
- **AC-3**: notification failure（Slack 4xx/5xx・mail provider error・config 未設定）が rollback transaction を壊さず、rollback result（200）が返る。→ 検証: Phase 4 failure-path unit / Phase 6 integration
- **AC-4**: notification status（`sent` / `failed` / `skipped`）が `schema_alias.rollback_notification` audit entry に併記される。→ 検証: Phase 4 contract / Phase 6 integration
- **AC-5**: 通知 channel 未設定時は status `skipped` で記録しエラーにしない。→ 検証: Phase 4 config-gate unit
- **AC-6**: runtime smoke evidence が tracked file として残る。→ 検証: Phase 11
- **AC-7**: 既存 rollback テスト・既存通知基盤テストが回帰しない。→ 検証: Phase 9

**期待される成果物**: `outputs/phase-1/acceptance-criteria.md`

---

### タスク3: spec-extraction-map（システム仕様 ↔ current code anchor）

**目的**: aiworkflow-requirements 正本仕様と current code anchor の 1:1 対応を固定する。

**実行手順**:
1. 下記 anchor テーブルを `outputs/phase-1/spec-extraction-map.md` に記録する

**anchor テーブル（最低 4 系統）**:

| 系統 | system spec | current code anchor |
| --- | --- | --- |
| route owner | `api-endpoints.md` | `apps/api/src/routes/admin/schema.ts`（rollback route） |
| 通知基盤（Slack） | `lessons-learned-issue-588-*.md` | `apps/api/src/lib/slack-sender.ts` |
| 通知基盤（mail） | `lessons-learned-issue-401-*.md` | `apps/api/src/services/mail/magic-link-mailer.ts` |
| 監査記録 | `database-implementation-core.md` / `audit-correlation.md` | `audit_log` テーブル / `schemaAliasRollback.ts` の audit insert |

**期待される成果物**: `outputs/phase-1/spec-extraction-map.md`

---

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | admin route surface |
| audit log schema | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | audit_log 構造 |
| best-effort 通知 | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-588-fallback-alert-slack-mail-extension-2026-05.md` | best-effort sink / redaction |
| outbox 設計 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-401-admin-request-notification-2026-05.md` | enqueue transaction 外 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| ブランチ同期確認 | `outputs/phase-1/branch-sync-check.md` | dev 整合結果 |
| inventory | `outputs/phase-1/inventory.md` | 編集/新規ファイル + 命名規則 |
| 受入条件 | `outputs/phase-1/acceptance-criteria.md` | AC-1〜AC-7 |
| spec マップ | `outputs/phase-1/spec-extraction-map.md` | system spec ↔ code anchor |

---

## 統合テスト連携

Phase 6 で実施する integration テスト（rollback route → 通知 dispatch → audit 記録）のシナリオ骨子を Phase 1 で予告する: ① 通知成功時に rollback 200 + audit `sent`、② Slack 失敗 → mail fallback、③ 両 channel 失敗で rollback 200 + audit `failed`、④ config 未設定で audit `skipped`。

---

## 多角的チェック観点（AIが判断）

- **真の論点**: 「rollback 通知を新規通知基盤として作るか、既存基盤を再利用するか」。結論: 既存 `sendSlackMessage` / `MailSender` を再利用し、best-effort 隔離パターン（#588）で wiring する。
- **責務境界**: rollback workflow（D1 transaction 専念）と 通知 dispatch（best-effort・transaction 外）を分離する。通知は route 層から発火。
- **価値とコスト**: 価値 = 監査上重要な rollback の運用可視化。コスト最大部品 = redaction と failure isolation。新規テーブルは作らず audit_log 再利用でコスト最小化。

---

## 完了条件

- [ ] P50 チェックを実行し結果を記録した（rollback 通知が未実装であることを確認）
- [ ] inventory テーブルの全ファイルを Read し命名規則を記録した
- [ ] AC-1〜AC-7 を本文に明示列挙し検証 Phase を対応づけた
- [ ] spec-extraction-map に 4 系統の anchor を記録した
- [ ] ブランチが dev と整合していることを確認した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-2-design.md`（設計）へ進む。Phase 1 完了まで Phase 2 へ進まない。
