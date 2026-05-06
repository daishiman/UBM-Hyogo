# タスク仕様書: Issue #401 — admin resolve 後の member 通知

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-401-admin-request-notification |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/401 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/completed-tasks/task-04b-admin-request-notification-001.md` |
| 親タスク | `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/` (Issue #319) |
| 配置先 | `docs/30-workflows/issue-401-admin-request-notification/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — 通知 outbox / dispatch worker / template / audit ledger / cron retry を新規実装し、`POST /admin/requests/:noteId/resolve` の resolve 完了後に enqueue する経路を追加する。コード変更（API / repository / migration / worker / template）が必須のため、CONST_004 に従い実装仕様書として作成する。 |
| 優先度 | medium |
| 想定 PR 数 | 1（migration + repository + workflow + route 統合 + tests + docs を 1 PR に集約。CONST_007 の 1 サイクル完了原則。） |
| coverage AC | 新規 `apps/api/src/{repository/notificationOutbox.ts, services/notification/*, workflows/notificationDispatchTick.ts}` は branch 80% 以上 / line 85% 以上 |

## 目的

admin が visibility/delete request を resolve（approve / reject）した後、対象 member に approve/reject 結果を通知する経路を **resolve transaction とは疎結合な outbox + dispatch worker** で実装する。Resend 経由のメール送信を一次チャネルとし、配信失敗が resolve transaction を rollback しない構造を確定する。retry / dead-letter / audit ledger を含めて 1 サイクル内で完成させる。

## スコープ

### 含む

- D1 migration `0014_notification_outbox.sql` 追加（`notification_outbox` / `notification_ledger` テーブル）
- repository: `apps/api/src/repository/notificationOutbox.ts` 新規（enqueue / claim / markSent / markFailed / moveToDlq）
- service: `apps/api/src/services/notification/templates.ts`（approve / reject テンプレ + PII sanitize）
- service: `apps/api/src/services/notification/dispatcher.ts`（既存 `MailSender` 再利用、provider 抽象化。env 正本は `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`）
- workflow: `apps/api/src/workflows/notificationDispatchTick.ts`（cron 起動の dispatch tick + retry/backoff + DLQ）
- route 統合: `apps/api/src/routes/admin/requests.ts` の `POST /requests/:noteId/resolve` 末尾で `enqueueNotification` を呼ぶ（**resolve batch の外で実行**）
- audit ledger 書き込み（成功 / 失敗 / DLQ いずれも記録。provider/error 監査に限定し、raw `resolutionNote` は保存しない）
- contract test / repository test / workflow test / dispatcher unit test
- `wrangler.toml` の cron trigger 追加（`*/5 * * * *`）

### 含まない（理由付き）

- Magic Link page state / in-app profile status による補助通知 — 一次チャネル（メール）で AC を満たせるため。**先送りではなく、本タスクの責務範囲外として確定**（CONST_007 注: 補助チャネルが必要になった場合のみ別タスク化、現時点では不要）
- 配信ベンダ切替（Auth.js Email Provider 採用） — 既存 `magic-link-mailer.ts` の `MailSender` interface 抽象を再利用するため、本タスクで provider 切替コストを払わない
- admin 側 UI の通知ステータス表示 — audit ledger に記録するのみで UI 露出は別タスクとして判断（CONST_007 例外: UI 露出は admin の運用観察ニーズが顕在化してから着手するのが合理的）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #319 (04b-followup-004) | resolve API / `request_status` 列 / `markResolved` `markRejected` helper 完成済 |
| 上流 | 05b Magic Link mailer (`MailSender` abstraction) | dispatcher が Resend 実装を再利用 |
| 上流 | tagQueue retry/DLQ pattern | retry/backoff/DLQ の実装パターンを踏襲 |
| 上流 | auditLog repository | audit 書き込み統一 |
| 下流 | admin 通知監視 UI（別タスク） | audit ledger を読み取り対象として参照 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| resolve API 実装済 | `rg -n "POST.*requests/.+resolve" apps/api/src/routes/admin/requests.ts` |
| MailSender abstraction 存在 | `rg -n "MailSender\|createResendSender" apps/api/src/services/mail/magic-link-mailer.ts` |
| auditLog repository 存在 | `ls apps/api/src/repository/auditLog.ts` |
| `MAIL_PROVIDER_KEY` secret 配備済 | `bash scripts/cf.sh wrangler secret list --config apps/api/wrangler.toml --env production` |

## 苦戦箇所・知見（unassigned-task からの継承）

1. **トランザクション境界**: resolve は D1 batch 内で完結（L-04B-RQ-001）。**通知を batch に含めない。** resolve 完了後に独立 outbox row として enqueue する。enqueue 失敗は warning log のみで resolve は成功として返す（best-effort enqueue + 監視で再投入）。
2. **PII 取り扱い**: rejection reason は admin 自由記述。template に流す前に `sanitizeRejectionNote()` で 200 文字 truncate + 制御文字除去を必須化する。`resolutionNote` 全文は既存 admin note / audit 境界に閉じ、`notification_ledger.detail_json` と email 本文には載せない（要約のみ）。
3. **配信ベンダ未決**: `MailSender` interface を再利用し、dispatcher を provider 非依存に保つ。Resend / Auth.js Email Provider 切替は dispatcher 実装で隠蔽。
4. **二重送信防止**: outbox row を `claim`（status: `pending` → `dispatching`）して取得する CAS パターン。同一 `noteId + outcome` の重複 enqueue は unique 制約で防ぐ。
5. **retry/backoff/DLQ**: tagQueue retry tick のパターン（exponential backoff、retry_count, next_attempt_at, max_retries=5）を踏襲。終端は `dlq` で人手対応。

## DoD（完了条件）

- [ ] `notification_outbox` / `notification_ledger` migration が staging で apply 成功
- [ ] resolve API 成功時に outbox row が enqueue される（contract test PASS）
- [ ] dispatch worker が pending row を取得し、Resend モック経由で送信成功を ledger に記録（workflow test PASS）
- [ ] 送信失敗時 retry_count++ / next_attempt_at が exponential backoff で更新される
- [ ] retry_count >= 5 で `dlq` 遷移し ledger に記録される
- [ ] resolve transaction が enqueue 失敗で rollback されない（負荷試験 / mock failure test PASS）
- [ ] approve / reject template に PII（`resolutionNote` 生文字列）が含まれない（template snapshot test PASS）
- [ ] audit ledger に sent / failed / dlq の全結果が記録される
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` 全 PASS
- [ ] coverage 新規ファイルが branch 80% / line 85% を満たす
- [ ] cron trigger が `wrangler.toml` で `*/5 * * * *` に設定されている
- [ ] `docs/00-getting-started-manual/specs/07-edit-delete.md` に通知経路が追記される

## 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/401（CLOSED 維持。PR 文言は `Refs #401` を使い、自動 close を狙う `Closes #401` は使わない）
- 起票元: `docs/30-workflows/completed-tasks/task-04b-admin-request-notification-001.md`
- 親タスク仕様: `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/`
- resolve API 実装: `apps/api/src/routes/admin/requests.ts`
- MailSender abstraction: `apps/api/src/services/mail/magic-link-mailer.ts`
- retry pattern reference: `apps/api/src/workflows/tagQueueRetryTick.ts`
- audit pattern: `apps/api/src/repository/auditLog.ts`
- API 正本: `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- DB 正本: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- 編集削除仕様: `docs/00-getting-started-manual/specs/07-edit-delete.md`

## Phase 一覧

| Phase | ファイル | 目的 | 状態 |
| --- | --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義・AC 番号化 | completed |
| 2 | [phase-02.md](phase-02.md) | 設計（schema / interface / 配信契約） | completed |
| 3 | [phase-03.md](phase-03.md) | アーキ確認（resolve 疎結合 / 不変条件） | completed |
| 4 | [phase-04.md](phase-04.md) | テスト戦略（contract/repo/workflow/dispatcher） | completed |
| 5 | [phase-05.md](phase-05.md) | 実装: migration / repository / route enqueue | completed |
| 6 | [phase-06.md](phase-06.md) | 実装: dispatcher / templates / workflow tick | completed |
| 7 | [phase-07.md](phase-07.md) | AC マトリクス | completed |
| 8 | [phase-08.md](phase-08.md) | リファクタリング / DRY 化 | completed |
| 9 | [phase-09.md](phase-09.md) | 品質保証（coverage / lint / type） | completed |
| 10 | [phase-10.md](phase-10.md) | 最終レビュー / rollback 経路 | completed |
| 11 | [phase-11.md](phase-11.md) | runtime evidence（NON_VISUAL） | pending_runtime_evidence |
| 12 | [phase-12.md](phase-12.md) | ドキュメント整備（必須7成果物） | completed |
| 13 | [phase-13.md](phase-13.md) | コミット・PR 作成（承認 gate） | blocked_until_user_approval |

## 不変条件

- 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる（dispatcher も `apps/api` 配下）
- resolve transaction と通知 enqueue は疎結合（enqueue 失敗で resolve は rollback しない）
- email 本文、`notification_outbox.reason_summary`、`notification_ledger.detail_json` に PII 生文字列を含めない（`resolutionNote` 全文は既存 admin note / audit 境界のみ）
- 同一 `(noteId, outcome)` の outbox row は unique 制約で重複防止
- DLQ 遷移は audit ledger に必ず記録する（人手対応の起点）
