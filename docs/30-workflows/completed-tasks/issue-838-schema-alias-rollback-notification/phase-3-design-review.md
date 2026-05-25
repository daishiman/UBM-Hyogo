# Phase 3: 設計レビュー - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 3 |
| Phase名 | 設計レビュー（ゲート） |
| 前提Phase | Phase 2 |
| 後続Phase | Phase 4 |
| ステータス | completed |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 目的

Phase 1-2 で確定した要件・設計が Phase 4（テスト RED）へ進める品質に達しているかをゲート判定する。判定結果は `PASS` / `MINOR` / `MAJOR` のいずれかで、`MAJOR` の場合は Phase 2 へ差し戻す。

---

## レビュー観点と判定

### 1. 4条件評価（task-specification-creator 要件レビュー思考法）

| 条件 | 評価基準 | 判定 |
| --- | --- | --- |
| 価値性 | rollback の運用可視化という価値が、誰の何のコストを下げるか定義されているか（運用者が rollback 発生を即時検知できる） | レビューで確認 |
| 実現性 | 既存 `sendSlackMessage` / `MailSender` 再利用 + 新規 1 モジュール + route 改修で 1 サイクル完了する厚みか | レビューで確認 |
| 整合性 | 責務境界（rollback workflow=D1 / dispatch=best-effort / audit=記録）・状態所有権が矛盾なく閉じているか | レビューで確認 |
| 運用性 | 通知失敗時も audit `failed` で検知でき、手動再送に繋がるか。導入後の監査運用が破綻しないか | レビューで確認 |

### 2. 設計整合チェックリスト

| # | チェック項目 | 期待 | 判定 |
| --- | --- | --- | --- |
| C-1 | AC-1〜AC-7 がすべて設計上の構造で担保されているか | 全 AC に対応する設計要素が phase-2 にある | レビューで確認 |
| C-2 | 不変条件 #5（D1 は apps/api に閉じる）に違反しないか | audit 記録は apps/api 内のみ | レビューで確認 |
| C-3 | 新規 endpoint を追加していないか（既存 surface のみ） | rollback route 内部処理拡張のみ | レビューで確認 |
| C-4 | failure isolation が二重隔離で AC-3 を構造保証しているか | dispatch 内 catch + route 層 try/catch | レビューで確認 |
| C-5 | redaction が二重防御（payload 構築層 / 送信本文層 / audit 記録層）で AC-2 を満たすか | 3 層すべてで PII 非包含 | レビューで確認 |
| C-6 | config gate（AC-5）が dispatch 冒頭判定で `skipped` を返すか | 両 channel 未設定で skipped | レビューで確認 |
| C-7 | migration 要否判定が phase-2 で確定しているか | `audit_log.action` に CHECK 制約なし → migration 不要（Phase 1/2 で DDL Read 確認） | レビューで確認 |
| C-8 | 関数シグネチャが Phase 4 で RED を書ける具体度か（型・引数・返り値が確定） | `dispatch*` / `build*Payload` / `redactRollbackActor` / `record*Audit` のシグネチャ確定 | レビューで確認 |
| C-9 | 命名規則が既存コードと整合（camelCase 関数 / PascalCase 型）しているか | Phase 1 inventory の命名規則に準拠 | レビューで確認 |
| C-10 | スコープ（CONST_007）が 1 サイクルで閉じ、先送りタスクが無いか | 「含まない」はすべて完了済み/別 issue 領域 | レビューで確認 |

### 3. 不採用案の妥当性確認

| 観点 | 確認 |
| --- | --- |
| 案 B（outbox generic 化）の不採用理由が妥当か | member 限定スキーマへの破壊的変更回避という理由が、整合性条件と一致しているか確認する |
| 将来 admin 通知増加時の拡張余地が記録されているか | 「将来 outbox 化は別 issue」と明記されているか確認する |

---

## 実行タスク

### タスク1: ゲート判定の実施

**実行手順**:
1. 上記「4条件評価」「設計整合チェックリスト C-1〜C-10」「不採用案の妥当性」を Phase 1-2 仕様書と照合して判定する
2. 各項目を `PASS` / `要修正` で埋める
3. 総合判定を下す:
   - **PASS**: 全項目 PASS → Phase 4 へ進む
   - **MINOR**: 軽微な指摘あり（記録のみ、Phase 4 進行可。指摘は Phase 12 未タスク候補へ）
   - **MAJOR**: AC 担保不能・責務境界破綻・migration 判定誤り等 → Phase 2 へ差し戻し

**期待される成果物**: `outputs/phase-3/design-review-result.md`（判定表 + 総合判定 + 差し戻し有無）

### タスク2: Phase 4 への申し送り事項の整理

**実行手順**:
1. Phase 4（テスト RED）で特に注意すべき設計上のポイントを箇条書きで整理する
   - dispatch の deps モック差し替え方法（`sendSlack` を `vi.fn()`、`mailSender` をスタブ）
   - 4 シナリオ（成功 / fallback / 両失敗 / skip）の境界
   - redaction unit（`redactRollbackActor` の入出力例）
2. `outputs/phase-3/handoff-to-phase-4.md` に記録する

**期待される成果物**: `outputs/phase-3/handoff-to-phase-4.md`

---

## 判定基準（ゲート）

| 判定 | 条件 | アクション |
| --- | --- | --- |
| PASS | C-1〜C-10 全 PASS かつ 4条件すべて充足 | Phase 4 へ進む |
| MINOR | 主要構造は健全だが軽微な記録漏れ・命名未確定がある | 指摘を記録して Phase 4 へ進む。指摘は Phase 12 で formalize |
| MAJOR | AC が設計で担保できない / 責務境界が破綻 / migration 判定が誤り | Phase 2 へ差し戻し、再設計後に再レビュー |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 1 要件 | `phase-1-requirements.md` | AC・inventory・命名規則 |
| Phase 2 設計 | `phase-2-design.md` | 採用案 A・シグネチャ・redaction |
| best-effort パターン | `lessons-learned-issue-588-fallback-alert-slack-mail-extension-2026-05.md` | 設計妥当性の照合元 |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 設計レビュー結果 | `outputs/phase-3/design-review-result.md` | 4条件評価表 + チェックリスト C-1〜C-10 + 不採用案妥当性 + 総合判定（PASS/MINOR/MAJOR） |
| Phase 4 申し送り | `outputs/phase-3/handoff-to-phase-4.md` | dispatch deps モック方針・4 シナリオ境界・redaction unit 入出力例 |

---

## 完了条件

- [ ] 4条件評価を実施し記録した
- [ ] 設計整合チェックリスト C-1〜C-10 を判定した
- [ ] 不採用案 B の妥当性を確認した
- [ ] 総合判定（PASS/MINOR/MAJOR）を下した
- [ ] Phase 4 への申し送り事項を整理した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

判定が `PASS` または `MINOR` の場合のみ `phase-4-test-plan.md`（テスト作成）へ進む。`MAJOR` の場合は Phase 2 へ差し戻す。
