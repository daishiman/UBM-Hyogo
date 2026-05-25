# Phase 8: リファクタリング - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 8 |
| Phase名 | リファクタリング |
| 前提Phase | Phase 7（カバレッジ確認） |
| 後続Phase | Phase 9 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 5-7 で GREEN になった実装コードの品質を高める。重複排除・責務単一性・命名整合を確認し、Phase 9（品質保証）が通る状態に整える。リファクタリングは挙動を変えない（外部から見た入出力・型・AC 充足は維持する）。

---

## 実行タスク

### タスク1: 変更記録（RT-03 テーブル）

**目的**: リファクタリング内容を「対象 / Before / After / 理由」形式で記録し、追跡可能にする。

**実行手順**:
1. Phase 5-7 の実装を対象に、下記観点で改善候補を洗い出す（タスク2〜5 の観点と並行してよい）
2. 改善を適用した後、`outputs/phase-8/refactor-log.md` に RT-03 テーブルとして記録する

**RT-03 テーブル形式（記録テンプレート）**:

| # | 対象ファイル/関数 | Before（改善前の状態） | After（改善後の状態） | 理由 |
| --- | --- | --- | --- | --- |
| RT-01 | （記入） | （記入） | （記入） | （記入） |
| RT-02 | （記入） | （記入） | （記入） | （記入） |
| … | … | … | … | … |

> 変更が 0 件の場合は「変更なし」と明記し、理由を添える（"Phase 5 実装時点で既に整理済み" 等）。

**期待される成果物**: `outputs/phase-8/refactor-log.md`

---

### タスク2: Slack 送信・mail 送信の重複チェック

**目的**: 既存 alert-relay の Slack 送信ロジックや既存 mail 送信処理と重複するコードが生まれていないか確認し、あれば共通化または参照に切り替える。

**実行手順**:
1. `apps/api/src/lib/slack-sender.ts` の `sendSlackMessage()` 呼び出しパターンを Read し、`schemaAliasRollbackNotification.ts` の呼び出し方法が既存の alert 系モジュール（`alertRelay.ts` 等が存在する場合）と重複していないか確認する
2. `apps/api/src/services/mail/magic-link-mailer.ts` の `MailSender.send()` 呼び出しパターンを Read し、既存の outbox/notification 系と同等のコードが二重に書かれていないか確認する
3. 重複が見つかった場合: 共通 helper への切り出し、または既存関数への委譲に変更する。ただし apps/api 外への依存は増やさない

**確認コマンド（実行して判断する）**:

```bash
# 既存 Slack 送信呼び出し箇所の一覧（自分の実装と比較）
grep -rn "sendSlackMessage" apps/api/src --include="*.ts" | grep -v "__tests__"

# 既存 MailSender 呼び出し箇所の一覧
grep -rn "MailSender\|\.send(" apps/api/src --include="*.ts" | grep -v "__tests__" | grep -v "magic-link-mailer"
```

**判定基準**:

| 状態 | 対応 |
| --- | --- |
| 重複なし | RT-03 テーブルに「重複なし」と記録 |
| 軽微な重複（ブロック 3 行未満） | 共通 helper に切り出すか inline に整理する |
| 重複あり（既存関数と同等の処理を再実装） | 既存関数への委譲に変更する |

---

### タスク3: `errorClass` sanitize ロジックの共通化余地確認

**目的**: `errorClass` の縮約規則（sanitized error token）が issue #588/#401 の既存実装と同一か確認し、重複実装がある場合は共通 helper に切り出す。

**実行手順**:
1. issue #588 の best-effort 通知実装（alert-relay 系）で errorClass sanitize を行っている箇所を Read する
2. issue #401 の notification outbox で同様の sanitize を行っている箇所を Read する（`lessons-learned-issue-401-*.md` の `L-I401-003`）
3. `schemaAliasRollbackNotification.ts` の `errorClass` 縮約ロジックと同一か比較する
4. 同一ロジックが 2 箇所以上存在する場合: `apps/api/src/lib/` に `sanitize-error-class.ts` 等の共通 helper として切り出す候補を検討する

**確認コマンド（実行して判断する）**:

```bash
# errorClass / sanitize 系の既存実装
grep -rn "errorClass\\|slack_status_\\|mail_provider_" apps/api/src --include="*.ts" | grep -v "__tests__"
```

**判定基準**:

| 状態 | 対応 |
| --- | --- |
| 既存実装なし / 本タスクが初出 | RT-03 テーブルに「既存共通化なし・初出」と記録 |
| 既存と縮約規則が同一 | 共通 helper に切り出す（または既存 helper を import して再利用） |
| 既存と縮約規則が微妙に異なる | 差異の理由を記録し、どちらに揃えるか判断する（原則: 既存 #588 踏襲） |

---

### タスク4: `redactRollbackActor` の責務単一性確認

**目的**: `redactRollbackActor(actorEmail: string): string` が「actor email を表示用にマスクする」という単一責務に閉じているか確認する。副作用（DB アクセス・外部呼び出し）がないか確認する。

**実行手順**:
1. `apps/api/src/workflows/schemaAliasRollbackNotification.ts` の `redactRollbackActor` 実装を Read する
2. 下記の責務単一性チェックリストを確認する

**責務単一性チェックリスト**:

| # | チェック項目 | 期待 |
| --- | --- | --- |
| RS-1 | 引数は `actorEmail: string` のみか | Yes |
| RS-2 | 返り値は `string`（マスク済み表示文字列）のみか | Yes |
| RS-3 | DB / 外部 I/O / 環境変数参照がないか | なし |
| RS-4 | `buildRollbackNotificationPayload` と重複するロジックを含まないか | 含まない |
| RS-5 | 空文字 / "unknown" に対して "unknown" を返す契約が実装されているか | Yes |
| RS-6 | 正規表現・文字列操作が 1 つの関数内に収まっているか（15 行以内が目安） | Yes |

3. チェック通過後、RT-03 テーブルに記録する

---

### タスク5: 命名 drift（Phase 1-3 命名規則との整合）確認

**目的**: Phase 1 inventory で確認した camelCase 関数 / PascalCase 型の命名規則と、実装コードの命名が drift していないか確認し、drift があれば修正する。

**確認対象命名一覧**:

| 種別 | Phase 2 設計の命名 | 実装の命名 | 整合 |
| --- | --- | --- | --- |
| 関数（dispatch） | `dispatchSchemaAliasRollbackNotification` | 実装 Read 後に記入 | 確認 |
| 関数（payload 構築） | `buildRollbackNotificationPayload` | 実装 Read 後に記入 | 確認 |
| 関数（redaction） | `redactRollbackActor` | 実装 Read 後に記入 | 確認 |
| 関数（audit 記録） | `recordRollbackNotificationAudit` | 実装 Read 後に記入 | 確認 |
| 型（status） | `RollbackNotificationStatus` | 実装 Read 後に記入 | 確認 |
| 型（channel） | `RollbackNotificationChannel` | 実装 Read 後に記入 | 確認 |
| 型（payload） | `RollbackNotificationPayload` | 実装 Read 後に記入 | 確認 |
| 型（result） | `RollbackNotificationResult` | 実装 Read 後に記入 | 確認 |
| 型（deps） | `RollbackNotificationDeps` | 実装 Read 後に記入 | 確認 |
| audit action 値 | `schema_alias.rollback_notification` | 実装 Read 後に記入 | 確認 |

**実行手順**:
1. `schemaAliasRollbackNotification.ts` を Read し、上記テーブルの「実装の命名」列を埋める
2. drift がある場合は修正し、テストのインポートも追随させる
3. 修正内容を RT-03 テーブルに記録する

---

### タスク6: リファクタリング後の品質確認

**目的**: リファクタリングで GREEN が崩れていないことを確認する。

**実行手順**:

```bash
# 1. 型チェック（リファクタリング後に型エラーがないか）
mise exec -- pnpm typecheck

# 2. リント（リファクタリング後に lint 違反がないか）
mise exec -- pnpm lint

# 3. テスト（挙動を変えていないか）
mise exec -- pnpm --filter api test run apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts
```

**判定基準**:

| コマンド | 期待 | 失敗時の対応 |
| --- | --- | --- |
| `pnpm typecheck` | 0 errors | 型エラーを修正してから再実行 |
| `pnpm lint` | 0 warnings/errors | `pnpm lint --fix` を試してから残件を手修正 |
| spec 実行 | 全テスト PASS（リファクタリング前と同一結果） | リファクタリングが挙動を変えた箇所を特定・修正 |

**期待される成果物**: `outputs/phase-8/refactor-quality-check.md`（コマンド実行結果 + 判定）

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 通知 dispatch 実装 | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | リファクタリング主対象 |
| rollback route 実装 | `apps/api/src/routes/admin/schema.ts` | wiring 箇所の重複確認 |
| best-effort パターン（#588） | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-588-fallback-alert-slack-mail-extension-2026-05.md` | errorClass 縮約規則の照合元 |
| Phase 2 設計 | `phase-2-design.md` | 命名規則・関数シグネチャの正本 |
| Phase 7 成果物 | `outputs/phase-7/` | カバレッジ確認結果（リファクタリング前後の比較元） |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| RT-03 テーブル | `outputs/phase-8/refactor-log.md` | 変更内容（対象/Before/After/理由） |
| 品質確認結果 | `outputs/phase-8/refactor-quality-check.md` | typecheck / lint / test 実行結果 |

---

## 完了条件

- [ ] 変更内容を RT-03 テーブル形式で `outputs/phase-8/refactor-log.md` に記録した（変更 0 件の場合も明記）
- [ ] Slack 送信・mail 送信の重複チェックを実施し、重複があれば解消した
- [ ] `errorClass` sanitize ロジックの共通化余地を確認し、共通化が必要な場合は対応した
- [ ] `redactRollbackActor` の責務単一性チェックリスト RS-1〜RS-6 を全項目通過した
- [ ] Phase 1-3 命名規則との命名 drift を確認し、drift があれば修正した
- [ ] リファクタリング後に `pnpm typecheck` / `pnpm lint` / テスト実行が全て GREEN であることを確認した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-9-qa.md`（品質保証）へ進む。Phase 8 完了（typecheck / lint / test GREEN）まで Phase 9 へ進まない。
