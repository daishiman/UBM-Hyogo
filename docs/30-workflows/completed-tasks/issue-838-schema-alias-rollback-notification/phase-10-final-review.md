# Phase 10: 最終レビューゲート - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 10 |
| Phase名 | 最終レビューゲート |
| 前提Phase | Phase 9（品質保証） |
| 後続Phase | Phase 11 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 1-9 の全成果物を横断的にレビューし、受入条件 AC-1〜AC-7 が充足されているかを最終判定する。判定は `PASS` / `MINOR` / `MAJOR` のいずれかで、`MAJOR` の場合は該当 Phase に差し戻す。`PASS` / `MINOR` の場合のみ Phase 11（手動テスト / staging smoke）へ進む。`MINOR` 指摘は Phase 12（ドキュメント更新）の未タスク候補として記録する。本 Phase の最終結果は `outputs/phase-10/final-review-result.md` に記録し、NON_VISUAL タスクの Phase 12 から代替証跡として参照される。

---

## 実行タスク

### タスク1: 受入条件（AC）最終充足判定

**目的**: AC-1〜AC-7 それぞれについて、どの Phase の何の成果物で充足されているかを明示し、充足 / 未充足を判定する。

**AC 最終充足判定表**:

| AC | 内容 | 検証 Phase | 検証成果物 / 根拠 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | rollback 成功時に Slack（優先）または mail（fallback）へ運用通知が送られる | Phase 4 unit / Phase 6 integration | `schemaAliasRollbackNotification.spec.ts`（成功シナリオ） | — |
| AC-2 | 通知 payload に secret / PII（actor email 生値・stableKey・token）が含まれない | Phase 4 unit（redaction） / Phase 9 grep | `redactRollbackActor` テスト + Phase 9 PII grep 確認 | — |
| AC-3 | notification failure が rollback transaction を壊さず rollback result（200）が返る | Phase 4 unit（failure-path） / Phase 6 integration / Phase 9 型確認 | failure-path spec（両失敗シナリオ）+ Phase 9 QA-6 | — |
| AC-4 | notification status が `schema_alias.rollback_notification` audit entry に併記される | Phase 4 contract / Phase 6 integration | audit insert 検証テスト | — |
| AC-5 | 通知 channel 未設定時は status `skipped` で記録しエラーにしない | Phase 4 unit（config-gate） | config-gate spec（両 channel 未設定シナリオ） | — |
| AC-6 | runtime smoke evidence が tracked file として残る | Phase 11 | `outputs/phase-11/smoke-evidence.md`（Phase 11 実施後） | Phase 11 前は「保留」 |
| AC-7 | 既存 rollback テスト・既存通知基盤テストが回帰しない | Phase 9 | `outputs/phase-9/qa-gate-result.md`（QA-4 / QA-5） | — |

> AC-6 は Phase 11（staging smoke）で確定するため、Phase 10 時点では「保留（Phase 11 で確定）」と記録する。AC-1〜AC-5 / AC-7 が全 PASS であれば Phase 11 へ進む。

**実行手順**:
1. Phase 4-9 の `outputs/` 配下の成果物を Read し、各 AC の充足根拠を確認する
2. 充足 / 未充足 / 保留 を判定し、上記テーブルを `outputs/phase-10/final-review-result.md` に転記する

---

### タスク2: 横断的整合性レビュー

**目的**: Phase 1-9 を横断して、設計と実装の間に drift がないことを確認する。

**横断整合チェックリスト**:

| # | チェック項目 | 参照先 | 判定 |
| --- | --- | --- | --- |
| CR-1 | `schemaAliasRollbackNotification.ts` の実装関数名が Phase 2 設計の命名と一致しているか（drift なし） | Phase 2 設計書 ↔ Phase 5 実装 | — |
| CR-2 | audit `after_json` の構成が Phase 2 設計（`{ status, channel, attempts, errorClass, dispatchedAt }`）通りか | Phase 2 設計書 ↔ Phase 5 実装 | — |
| CR-3 | config gate の判定順（Slack 優先 → mail fallback → 両未設定 skipped）が Phase 2 設計と一致しているか | Phase 2 設計書 ↔ Phase 5 実装 | — |
| CR-4 | redaction が「payload 構築層 / 送信本文層 / audit 記録層」の 3 層で実施されているか | Phase 2 設計書 ↔ Phase 9 grep | — |
| CR-5 | Phase 8 リファクタリングで AC を破壊する変更がなかったか | Phase 8 RT-03 テーブル ↔ Phase 9 全テスト | — |
| CR-6 | migration が不要であることの根拠（`audit_log.action` に CHECK 制約なし）が Phase 1-2 で確認済みか | Phase 2 `env-migration-decision.md` | — |
| CR-7 | 新規 endpoint が追加されていないか（rollback route 内部処理拡張のみ） | Phase 5 実装 diff | — |

---

### タスク3: blocker 判定

**目的**: AC 充足・横断整合チェックの結果から、blocker 判定を下す。

**blocker 判定基準**:

| 判定 | 条件 | アクション |
| --- | --- | --- |
| PASS | AC-1〜AC-5 / AC-7 全充足、CR-1〜CR-7 全 PASS | Phase 11 へ進む |
| MINOR | 主要構造は健全だが軽微な記録漏れ・コメント漏れ・型注釈の詳細度不足がある | 指摘を記録して Phase 11 へ進む。指摘は Phase 12 未タスク候補として記録する |
| MAJOR | AC が設計・実装で担保できていない / 不変条件 #5 違反 / PII/secret が通知に含まれる / rollback 200 が崩れる | 以下の差し戻し先テーブルに従い対象 Phase へ差し戻す |

**MAJOR 時の差し戻し先テーブル**:

| 問題の種類 | 差し戻し先 |
| --- | --- |
| AC-1（通知が発火しない）/ AC-3（rollback 200 が崩れる） | Phase 5（実装）へ差し戻し |
| AC-2（PII/secret が含まれる）/ AC-4（audit 記録が不正確）/ AC-5（skipped 未実装） | Phase 5（実装）または Phase 6（テスト拡充）へ差し戻し |
| AC-7（既存テスト回帰） | Phase 6（テスト拡充）へ差し戻し |
| typecheck / lint FAIL | Phase 9（品質保証）へ差し戻し |
| CR-1〜CR-7 で設計と実装の重大 drift | Phase 5（実装）へ差し戻し |

---

### タスク4: MINOR 指摘の Phase 12 未タスク候補記録

**目的**: MINOR 判定で発見された指摘を Phase 12 の未タスク候補として引き継ぐ。

**実行手順**:
1. MINOR 指摘がある場合、`outputs/phase-10/final-review-result.md` に「Phase 12 未タスク候補」セクションを設け、指摘内容と対応方針を箇条書きで記録する
2. MINOR 指摘がない場合は「MINOR 指摘なし」と明記する

**記録フォーマット（テンプレート）**:

```markdown
## Phase 12 未タスク候補

- [ ] （指摘内容）: （対応方針。例: Phase 12 でコメント補足・spec sync・lessons-learned 追記）
```

---

### タスク5: 最終レビュー結果の記録

**目的**: Phase 10 の全判定結果を `outputs/phase-10/final-review-result.md` にまとめ、Phase 12 から参照可能な証跡として残す。

**期待されるファイル構成（`outputs/phase-10/final-review-result.md`）**:

```markdown
# Phase 10 最終レビュー結果

## AC 最終充足判定

（タスク1 の AC 充足判定表を転記）

## 横断整合性レビュー

（タスク2 の CR-1〜CR-7 判定表を転記）

## blocker 判定

総合判定: PASS / MINOR / MAJOR（いずれか）

（MAJOR の場合は差し戻し先と理由を記載）

## Phase 12 未タスク候補

（タスク4 の記録を転記。なければ「MINOR 指摘なし」）

## Phase 11 への申し送り事項

- staging smoke で確認すべき事項（AC-6 の evidence 取得方針）
- smoke 手順の要点（rollback 実行 → 通知 dispatch 確認 → audit entry 確認）
```

**実行手順**:
1. タスク1〜4 の結果を上記フォーマットに従って `outputs/phase-10/final-review-result.md` に記録する
2. NON_VISUAL タスクのため、このファイルが Phase 12 でスクリーンショット代替の証跡として参照されることを確認する

**期待される成果物**: `outputs/phase-10/final-review-result.md`

---

## Phase 11 への申し送り事項

Phase 10 で PASS / MINOR と判定された場合、Phase 11（手動テスト / staging smoke）で以下を実施して AC-6 の evidence を取得する:

| 確認項目 | 方法 |
| --- | --- |
| rollback 実行 → Slack 通知 dispatch の確認 | staging 環境でロールバックを実行し、Slack チャンネルに通知が届くことを確認する |
| audit entry `schema_alias.rollback_notification` の存在確認 | D1 の `audit_log` を D1 console またはスクリプトで確認する |
| `status` / `channel` / `attempts` の値が正しいか | audit after_json を Read して設計通りの値か確認する |
| config 未設定環境での `skipped` 動作確認 | `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` を未設定にした状態で rollback し、`status=skipped` が記録されるか確認する |

> staging smoke evidence は `outputs/phase-11/smoke-evidence.md` に記録する（tracked file 必須・AC-6）。

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 1 受入条件 | `outputs/phase-1/acceptance-criteria.md` | AC-1〜AC-7 + 検証 Phase 対応 |
| Phase 2 設計 | `phase-2-design.md` | 採用案 A・関数シグネチャ・データ構造・redaction |
| Phase 3 設計レビュー | `outputs/phase-3/design-review-result.md` | 設計 PASS 判定の根拠 |
| Phase 9 品質ゲート結果 | `outputs/phase-9/qa-gate-result.md` | typecheck / lint / test / AC-7 / PII 確認 |
| Phase 8 リファクタリングログ | `outputs/phase-8/refactor-log.md` | RT-03 テーブル |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 最終レビュー結果 | `outputs/phase-10/final-review-result.md` | AC 充足判定 + 横断整合 + blocker 判定 + Phase 12 未タスク候補 + Phase 11 申し送り |

---

## 完了条件

- [ ] AC-1〜AC-5 / AC-7 の充足根拠を Phase 4-9 の成果物で確認し、判定表に記録した
- [ ] AC-6 は「保留（Phase 11 で確定）」として記録した
- [ ] 横断整合チェックリスト CR-1〜CR-7 を全項目判定した
- [ ] blocker 判定（PASS / MINOR / MAJOR）を下した
- [ ] MAJOR の場合は差し戻し先 Phase と理由を明記した
- [ ] MINOR 指摘を Phase 12 未タスク候補として記録した（なければ「なし」と明記）
- [ ] Phase 11 への申し送り事項を記録した
- [ ] `outputs/phase-10/final-review-result.md` を作成した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

判定が `PASS` または `MINOR` の場合のみ `phase-11-manual-test.md`（手動テスト・staging smoke）へ進む。`MAJOR` の場合は差し戻し先 Phase へ戻る。
