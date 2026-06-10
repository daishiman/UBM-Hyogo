# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 3 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 1（要件定義）・Phase 2（設計）完了 |
| gate 判定 | **PASS**（Phase 4 へ進行可） |

## 目的

Phase 2 設計が AC を満たし、Phase 4（テスト作成）へ進めるかを判定する。

## 実行タスク

### 1. 設計レビュー結果

| 観点 | 判定 | 根拠 |
|------|------|------|
| 真因と修正の整合 | PASS | RC-3（schema_questions 空）に対し Lane A の raw fallback が直接対処。staging 実データで真因確定済み |
| AC カバレッジ | PASS | AC-A1〜A4 / B1〜B3 / C1〜C4 が Lane A/B/C に 1:1 対応 |
| 不変条件遵守 | PASS | apps/web 非接触（#1）・migration 不変（AC-G2）・cf.sh 経由（#3）を validation matrix で gate |
| 既存挙動の非回帰 | PASS | Lane A はマージ `{...fromRaw, ...fromSchema}` で schema sync 済み環境の従来挙動を保持。Lane B は sync 中断せず可視化のみ（AC-B3） |
| スコープ 1 サイクル完了 | PASS | 3 lane とも先送り無し（CONST_007）。runbook も同サイクル内 |

### 2. simpler alternative の検討

| 代替案 | 採否 | 理由 |
|--------|------|------|
| (案1) 復旧手順のみ（コード修正なし、schema sync を先に回す運用だけ） | 却下 | 順序依存（cron schema 1日1回 vs response */15）が残り再発する。fail-silent も解消しない |
| (案2) schema_questions に依存せず常に raw form から qidMap 生成（schema lookup 廃止） | 却下 | schema sync で管理者が調整した stableKey（alias 等）を無視する恐れ。schema 優先のマージ（採用案）が安全 |
| (案3) response sync を schema_questions 空のとき中断 | 部分採用せず | cursor 進行を阻害し復旧が複雑化。中断ではなく warning + alert（Lane B 採用案）に留める |
| **採用案** | ✅ | Lane A（schema 優先 + raw fallback マージ）+ Lane B（非中断 alert）+ Lane C（復旧 runbook）。再発防止・可視化・復旧の 3 点を最小差分で達成 |

### 3. MINOR 追跡

| MINOR ID | 指摘内容 | 解決予定 | 解決確認 |
|----------|---------|---------|---------|
| TECH-M-01 | `rawFormToStableKeyMap` の配置先（`mapper.ts` か `client.ts`）が未確定 | Phase 5 | Phase 9 |
| TECH-M-02 | 旧 `__extra__:` 行クリーンアップを別タスク化するか runbook 注記で済ますか | Phase 11/12 | Phase 12（未タスク判定） |

### 4. Phase 4 開始条件 / Phase 13 blocked 条件

- **Phase 4 開始条件**: 本 gate が PASS（達成済み）。
- **Phase 13 blocked 条件**: commit / PR / deploy / staging mutation は user 明示承認まで blocked。

## 参照資料

- `outputs/phase-1/requirements.md`, `outputs/phase-2/design.md`

## 統合テスト連携

- Phase 4 で Lane A/B の RED test を設計する。validation matrix（Phase 2 §5）を test command の base にする。

## 多角的チェック観点（AIが判断）

- **戦略**: 最小差分で「再発防止 + 可視化 + 復旧」の 3 価値を同時達成。高コスト項目（既存データ復旧）は runbook に隔離し初回スコープを軽量化。
- **整合性**: stableKey 解決の責務を `deriveStableKey` に一元化し二重化を解消。
- **運用性**: SYNC_ALERTS により今後の schema_questions 空が監視で検知可能になる。

## サブタスク管理

| ID | 内容 |
|----|------|
| P3-1 | レビュー判定 |
| P3-2 | simpler alternative 記録 |
| P3-3 | MINOR 追跡テーブル |

## 成果物

- `outputs/phase-3/gate-decision.md`

## 完了条件

- [x] PASS/MINOR/MAJOR 判定が記録されている
- [x] simpler alternative の検討結果が記録されている
- [x] MINOR 追跡テーブルが作成されている
- [x] Phase 4 開始条件・Phase 13 blocked 条件が明記されている

## タスク100%実行確認【必須】

- [x] 1〜4 を完遂した
- [x] gate 判定 = PASS
- [x] `outputs/phase-3/gate-decision.md` が存在する

## 次Phase

Phase 4（テスト作成）— Lane A/B の RED test を設計する。
