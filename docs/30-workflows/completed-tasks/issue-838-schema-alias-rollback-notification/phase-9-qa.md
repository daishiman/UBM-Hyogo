# Phase 9: 品質保証 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 9 |
| Phase名 | 品質保証 |
| 前提Phase | Phase 8（リファクタリング） |
| 後続Phase | Phase 10 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

typecheck / lint / 全テストの一括実行により、Phase 5-8 の全成果物が品質ゲートを通過することを確認する。AC-7（既存回帰なし）・不変条件 #5（D1 は apps/api に閉じる）・best-effort 隔離の型レベル保証・PII/secret 非包含の grep 確認を実施し、Phase 10（最終レビューゲート）へ進める状態であることを判定する。

---

## 実行タスク

### タスク1: 品質ゲート一括実行

**目的**: 3 つの品質コマンドを実行し、結果を記録する。

**実行手順**:

```bash
# 1. 型チェック
mise exec -- pnpm typecheck

# 2. リント
mise exec -- pnpm lint

# 3. 全テスト実行（apps/api スコープ）
mise exec -- pnpm --filter api test run
```

**品質ゲート判定表**:

| コマンド | 期待値 | 実際の結果（記入） | 判定 |
| --- | --- | --- | --- |
| `pnpm typecheck` | 0 errors | — | — |
| `pnpm lint` | 0 errors / 0 warnings | — | — |
| `pnpm --filter api test run`（全テスト） | 全 PASS、新規追加テストを含む | — | — |

> **失敗時の対応**: typecheck 失敗は型注釈・import を修正してから再実行。lint 失敗は `pnpm lint --fix` を試し残件を手修正。テスト失敗は失敗テスト名を記録し、Phase 5-6 の実装・テストに立ち返って修正する。自動修復は最大 3 回まで。

**期待される成果物**: `outputs/phase-9/qa-gate-result.md`（コマンド実行結果 + PASS/FAIL 判定）

---

### タスク2: AC-7（既存回帰なし）の最終確認

**目的**: 既存 rollback テスト・既存通知基盤テストが Phase 5-8 の変更によって回帰していないことを確認する。

**実行手順**:
1. rollback 本体テスト（`schemaAliasRollback.spec.ts`）が全 PASS であることを確認する
2. Slack 送信基盤テスト（`slack-sender.spec.ts`）が存在する場合、全 PASS であることを確認する
3. mail 送信基盤テスト（`magic-link-mailer.spec.ts` 等）が存在する場合、全 PASS であることを確認する
4. 存在確認コマンド:

```bash
# rollback テストの存在確認と実行
find apps/api/src -name "schemaAliasRollback.spec.ts" -type f
mise exec -- pnpm --filter api test run apps/api/src/workflows/__tests__/schemaAliasRollback.spec.ts 2>/dev/null || echo "file not found"

# Slack 送信基盤テストの存在確認
find apps/api/src -name "slack-sender.spec.ts" -type f

# mail 送信基盤テストの存在確認
find apps/api/src -name "*.spec.ts" | xargs grep -l "MailSender\|createResendSender" 2>/dev/null
```

**AC-7 判定表**:

| テスト対象 | ファイルパス（確認後記入） | 存在 | 全 PASS |
| --- | --- | --- | --- |
| rollback 本体テスト | `apps/api/src/workflows/__tests__/schemaAliasRollback.spec.ts` | 確認 | 確認 |
| Slack 送信基盤テスト | — | 確認 | 確認または N/A |
| mail 送信基盤テスト | — | 確認 | 確認または N/A |

**期待される成果物**: `outputs/phase-9/qa-gate-result.md` 内 AC-7 セクション

---

### タスク3: best-effort 隔離の型レベル保証確認

**目的**: `dispatchSchemaAliasRollbackNotification` が型として「throw しない」契約（`Promise<RollbackNotificationResult>` を返し、例外を伝播しない）を型レベルで保証していることを確認する。

**確認内容**:

| 確認項目 | 期待 |
| --- | --- |
| `dispatchSchemaAliasRollbackNotification` の返り値型が `Promise<RollbackNotificationResult>` であるか | Yes |
| 関数内に `try/catch` が存在し、最外層の catch が必ず `RollbackNotificationResult` を返すか | Yes（throw なし） |
| route 層の wiring で `dispatch` 全体が `try/catch` に包まれているか | Yes |
| route 層の catch が `c.json(result, 200)` の後に配置されているか（= rollback 200 を壊さない） | Yes |

**確認コマンド**:

```bash
# dispatch 関数が throw しない実装か確認（throw 文が存在しないこと）
grep -n "throw " apps/api/src/workflows/schemaAliasRollbackNotification.ts

# route 層の try/catch 構造確認
grep -n "try\|catch\|dispatchSchemaAliasRollbackNotification" apps/api/src/routes/admin/schema.ts
```

> `throw` が存在する場合: 通知関連コード内の `throw` は `return { status: 'failed', ... }` への変換であることを確認する。rollback workflow 本体（`schemaAliasRollback.ts`）の `throw` は別ファイルのため対象外。

---

### タスク4: 不変条件 #5（D1 は apps/api に閉じる）の最終確認

**目的**: 通知 audit 記録が `apps/api` 内のみで完結し、`apps/web` から直接 D1 にアクセスする経路が生まれていないことを確認する。

**確認コマンド**:

```bash
# apps/web 側に audit / rollback notification の参照がないか確認
grep -rn "rollback_notification\|schemaAliasRollbackNotification\|recordRollbackNotificationAudit" apps/web/src --include="*.ts" --include="*.tsx" 2>/dev/null
```

**期待値**: 0 件（apps/web に D1 アクセスや notification モジュール参照がない）

---

### タスク5: PII / secret 非包含の grep 確認（AC-2 最終検証）

**目的**: 通知 payload・送信本文・audit after_json に actor email 生値・stableKey・token が出ていないことを grep で確認する。

**実行手順**:

1. `schemaAliasRollbackNotification.ts` の実装を Read し、以下の確認コマンドを実行する:

```bash
# actor email 生値が Slack / mail 本文に渡る経路がないか
# （actorRef は redactRollbackActor 済みの値なので OK。actorEmail 変数が payload に代入されていないことを確認）
grep -n "actorEmail" apps/api/src/workflows/schemaAliasRollbackNotification.ts

# stableKey が payload / after_json に含まれていないか
grep -n "stableKey" apps/api/src/workflows/schemaAliasRollbackNotification.ts

# after_json の構築箇所に email/token が含まれていないか
grep -n "after_json\|afterJson" apps/api/src/workflows/schemaAliasRollbackNotification.ts
grep -n "after_json\|afterJson" apps/api/src/routes/admin/schema.ts
```

**PII/secret 確認表**:

| 確認項目 | 期待 | 結果（記入） |
| --- | --- | --- |
| `actorEmail` 変数が payload フィールドに直接代入されていない | Yes（`redactRollbackActor(actorEmail)` 経由のみ） | — |
| `stableKey` が payload / after_json に含まれない | Yes（0 件） | — |
| `after_json` の構成値が `{ status, channel, attempts, errorClass, dispatchedAt }` のみか | Yes | — |
| Slack 送信本文が `RollbackNotificationPayload` のフィールドのみを参照しているか | Yes（生 email / token を直接参照しない） | — |

---

### タスク6: 品質ゲート最終判定

**目的**: タスク1〜5 の結果を集約し、Phase 10 へ進める品質に達しているかを一元判定する。

**品質ゲート最終判定表**:

| # | 確認項目 | 参照タスク | 判定（PASS/FAIL） |
| --- | --- | --- | --- |
| QA-1 | `pnpm typecheck` 0 errors | タスク1 | — |
| QA-2 | `pnpm lint` 0 errors/warnings | タスク1 | — |
| QA-3 | 全テスト PASS（新規テスト含む） | タスク1 | — |
| QA-4 | 既存 rollback テスト回帰なし（AC-7） | タスク2 | — |
| QA-5 | 既存通知基盤テスト回帰なし（AC-7） | タスク2 | — |
| QA-6 | dispatch が型レベルで throw しない契約を持つ（AC-3） | タスク3 | — |
| QA-7 | D1 アクセスが apps/api に閉じている（不変条件 #5） | タスク4 | — |
| QA-8 | PII/secret が payload/audit に非包含（AC-2） | タスク5 | — |

**総合判定**:

| 判定 | 条件 | アクション |
| --- | --- | --- |
| PASS | QA-1〜QA-8 全 PASS | Phase 10 へ進む |
| CONDITIONAL | QA-7 / QA-8 が PASS かつ QA-1〜QA-6 のいずれかが FAIL（自動修復で解消可能） | 修復後に再判定。解消後 PASS として Phase 10 へ進む |
| BLOCKED | QA-7 または QA-8 が FAIL（構造的問題） | Phase 5-6 に差し戻し、不変条件 / AC-2 を修正してから Phase 9 を再実施 |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 通知 dispatch 実装 | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` | QA 主対象 |
| rollback route 実装 | `apps/api/src/routes/admin/schema.ts` | wiring / failure isolation 確認 |
| Phase 1 受入条件 | `outputs/phase-1/acceptance-criteria.md` | AC-1〜AC-7 の検証 Phase 対応 |
| Phase 8 リファクタリング結果 | `outputs/phase-8/refactor-log.md` | リファクタ変更内容の確認 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 品質ゲート結果 | `outputs/phase-9/qa-gate-result.md` | typecheck / lint / test 結果、AC-7 確認、PII 確認、総合判定 |

---

## 完了条件

- [ ] `pnpm typecheck` が 0 errors で完了した
- [ ] `pnpm lint` が 0 errors/warnings で完了した
- [ ] `pnpm --filter api test run` の全テストが PASS した（新規テストを含む）
- [ ] AC-7（既存 rollback テスト・通知基盤テストの回帰なし）を確認した
- [ ] `dispatchSchemaAliasRollbackNotification` が型レベルで throw しない契約を持つことを確認した
- [ ] 不変条件 #5（D1 は apps/api に閉じる）に違反がないことを確認した
- [ ] PII/secret（actor email 生値・stableKey・token）が payload / audit after_json に非包含であることを grep で確認した
- [ ] 品質ゲート最終判定表を `outputs/phase-9/qa-gate-result.md` に記録した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

総合判定が `PASS` または `CONDITIONAL`（修復後）の場合のみ `phase-10-final-review.md`（最終レビューゲート）へ進む。`BLOCKED` の場合は Phase 5-6 へ差し戻す。
