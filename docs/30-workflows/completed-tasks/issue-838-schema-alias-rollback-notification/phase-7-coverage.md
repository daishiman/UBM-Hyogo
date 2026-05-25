# Phase 7: カバレッジ確認 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 7 |
| Phase名 | カバレッジ確認 |
| 前提Phase | Phase 6（テスト拡充 PASS 確認済み） |
| 後続Phase | Phase 8 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 4〜6 のテストが `schemaAliasRollbackNotification.ts` の実装行・分岐を十分にカバーしているかを定量確認する。新規モジュールの責務境界（dispatch / redaction / config gate / audit）ごとに line/branch coverage を可視化し、担保できていない分岐があれば Phase 6 への差し戻しまたは Phase 8 での補完候補を明記する。

> **NON_VISUAL + 新規モジュール中心タスク（EMB-005-FB）**
> 本タスクは UI/UX 変更を伴わない。Phase 6 で errorClass 分岐・config gate・integration の 4 variant を網羅したため、Phase 6 と Phase 7 の責務が重複する場合は Phase 7 の証拠記録を Phase 6 の test-additions-result.md に統合してよい（ただし本ファイルの完了チェックリストは維持する）。

---

## 実行タスク

| # | タスク | 詳細セクション |
| --- | --- | --- |
| 1 | カバレッジ取得コマンドの実行 | 「カバレッジ取得コマンド」 |
| 2 | concern 別（dispatch / redaction / payload / audit / route）の line/branch 実測 | 「計測対象と目標カバレッジ」 |
| 3 | 分岐ごとの担保状況マップ作成 | 「分岐ごとの担保状況マップ」 |
| 4 | 未カバー行の特定と Phase 6/8 への差し戻し/補完判定 | 「カバレッジ不足時の対応方針」「判定」 |
| 5 | 計測結果の証拠記録 | 「証拠記録方針」「結果サマリ」 |

---

## カバレッジ取得コマンド

```bash
# 1. 新規モジュールのみカバレッジ（推奨・高速）
mise exec -- pnpm --filter @ubm-hyogo/api test \
  -- apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts \
     apps/api/src/routes/admin/__tests__/schema-rollback-notification-integration.spec.ts \
  --coverage \
  --coverage.include="apps/api/src/workflows/schemaAliasRollbackNotification.ts"

# 2. apps/api 全体カバレッジ（回帰 guard + 新規モジュールを一括確認）
mise exec -- pnpm --filter @ubm-hyogo/api test \
  --coverage \
  --coverage.include="apps/api/src/**"

# 3. カバレッジレポートを HTML で出力（任意・詳細確認時）
mise exec -- pnpm --filter @ubm-hyogo/api test \
  --coverage \
  --coverage.reporter=html \
  --coverage.include="apps/api/src/workflows/schemaAliasRollbackNotification.ts"
# → apps/api/coverage/index.html で分岐別の UNCOVERED 行を確認する
```

> `vitest.config.ts` の `coverage.provider` が `"v8"` または `"istanbul"` であることを事前確認する。
> 設定がない場合は `--coverage.provider=v8` を追記するか `vitest.config.ts` に追加する。

---

## 計測対象と目標カバレッジ

| concern | 対象コード領域 | 担保テスト | 目標 line | 目標 branch |
| --- | --- | --- | --- | --- |
| dispatch 本体（config gate 含む） | `dispatchSchemaAliasRollbackNotification` | Suite 1, 5, 6 | ≥ 90% | ≥ 85% |
| redaction | `redactRollbackActor` | Suite 3 | 100% | 100% |
| payload 構築 | `buildRollbackNotificationPayload` | Suite 2 | 100% | 100% |
| audit 記録 | `recordRollbackNotificationAudit` | Suite 4, 7 | ≥ 90% | ≥ 85% |
| route wiring | `schema.ts`（rollback route 追加部分） | Suite 8 | ≥ 80% | ≥ 80% |

> **目標値の根拠**: `redactRollbackActor` / `buildRollbackNotificationPayload` は純粋関数で全入出力パターンをテストしているため 100% 要求。`dispatch` は Slack/mail の async 呼び出しに伴う環境依存分岐があり、integration モック限界を考慮して 85%〜90% を許容下限とする。

---

## 分岐ごとの担保状況マップ

Phase 4〜6 のテストと dispatch の分岐の対応を確認する。

| dispatch 分岐 | 担保テスト | 確認状態 |
| --- | --- | --- |
| ① 両 channel 未設定 → skipped | Suite 1 シナリオ 1-4, Suite 6 シナリオ 6-2 | 確認（Phase 6 後） |
| ② Slack 成功 → sent/slack | Suite 1 シナリオ 1-1, Suite 8 シナリオ 8-1 | 確認（Phase 6 後） |
| ③ Slack 失敗（4xx/5xx/network）→ mail fallback | Suite 1 シナリオ 1-2, Suite 5 シナリオ 5-1〜5-3, Suite 8 シナリオ 8-2 | 確認（Phase 6 後） |
| ④ Slack 失敗 + mail 失敗 → failed | Suite 1 シナリオ 1-3, Suite 5, Suite 8 シナリオ 8-3 | 確認（Phase 6 後） |
| ⑤ Slack 未設定 + mail のみ → sent/mail | Suite 6 シナリオ 6-1 | 確認（Phase 6 後） |
| ⑥ opsEmail 未設定 → mail config gate skip | Suite 6 シナリオ 6-2 | 確認（Phase 6 後） |

| redactRollbackActor 分岐 | 担保テスト |
| --- | --- |
| 空文字 → unknown | Suite 3（`""` ケース） |
| "unknown" → unknown | Suite 3（`"unknown"` ケース） |
| @ を含まない → unknown | （Suite 3 に存在しない場合は Phase 8 補完候補） |
| ローカル1文字 → 1文字 + *** | Suite 3（`"a@b.com"` ケース） |
| ローカル2文字以上 → 先頭2文字 + *** | Suite 3（`"admin@example.com"` ケース） |

---

## カバレッジ不足時の対応方針

| 不足パターン | 対応 |
| --- | --- |
| `redactRollbackActor` の @ 非包含パターンが未カバー | Phase 6 差し戻し or Phase 8 でテスト追加 |
| `dispatch` の mail network error (`TypeError`) が未カバー | Phase 6 の Suite 5 シナリオ 5-5 で補完（実装の sanitize 関数に合わせて expect 確定） |
| `recordRollbackNotificationAudit` の DB エラー時のスワロー（best-effort）が未カバー | Phase 8 でテスト追加候補（minor, AC-3 は route 層カバー済みのため許容） |
| route wiring の try/catch swallow 分岐 | Suite 8 シナリオ 8-3 で担保。不足なら Phase 8 で追加 |

---

## 証拠記録方針

カバレッジ実測結果を以下の形式で記録する:

```markdown
# outputs/phase-7/coverage-result.md

## 実測日時
2026-05-XX

## コマンド
mise exec -- pnpm --filter @ubm-hyogo/api test \
  -- apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts \
     apps/api/src/routes/admin/__tests__/schema-rollback-notification-integration.spec.ts \
  --coverage \
  --coverage.include="apps/api/src/workflows/schemaAliasRollbackNotification.ts"

## 結果サマリ
| ファイル | Lines | Branches |
| --- | --- | --- |
| schemaAliasRollbackNotification.ts | XX% | XX% |

## 未カバー行（UNCOVERED）
- L.XX: ...（あれば列挙）

## 判定
PASS / 要補完（Phase 8 候補: ...）
```

> **EMB-005-FB 適用判断**: Phase 6 の `test-additions-result.md` にカバレッジ数値が既に含まれている場合、Phase 7 の `coverage-result.md` はそれを参照する形でよい。重複取得は不要。

---

## ローカル実行コマンド（CONST_005）

| コマンド | 目的 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api test --coverage --coverage.include="apps/api/src/workflows/schemaAliasRollbackNotification.ts"` | 新規モジュールのカバレッジのみ取得 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test --coverage` | apps/api 全体カバレッジ（回帰含む） |
| `mise exec -- pnpm typecheck` | 型チェック（カバレッジ前後の再確認） |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 4 テスト計画 | `phase-4-test-plan.md` | Suite 1〜4 の期待シナリオ |
| Phase 6 テスト拡充 | `phase-6-test-additions.md` | Suite 5〜9 の拡充シナリオ |
| Phase 6 実行結果 | `outputs/phase-6/test-additions-result.md` | 拡充後の全件 PASS ログ |
| vitest 設定 | `apps/api/vitest.config.ts` | coverage.provider 確認 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| カバレッジ実測結果 | `outputs/phase-7/coverage-result.md` | concern 別 line/branch 実測値・未カバー行・判定 |
| 担保状況マップ | 同上 | 全分岐の担保テスト対応表 |

> EMB-005-FB により、Phase 6 の `test-additions-result.md` に coverage 証拠を統合する場合も本ファイルの完了チェックリストは維持する。

---

## 完了条件

- [ ] カバレッジ取得コマンドを実行し `coverage-result.md` を作成した
- [ ] `schemaAliasRollbackNotification.ts` の line/branch coverage を実測し目標値と照合した
- [ ] 分岐ごとの担保状況マップを埋めた（全分岐の担保テストを確認）
- [ ] 未カバー行が存在する場合、Phase 8 補完候補として記録した
- [ ] `redactRollbackActor` の全ケースが 100% カバーされていることを確認した
- [ ] `buildRollbackNotificationPayload` が 100% カバーされていることを確認した
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` が全件 PASS のままであることを確認した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

`phase-8-refactor.md`（リファクタリング）へ進む。カバレッジ確認 PASS（目標値達成または未達箇所を Phase 8 候補として記録済み）を確認してから Phase 8 へ進む。
