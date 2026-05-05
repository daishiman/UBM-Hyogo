# Phase 3 成果物: 設計レビューゲート

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: `outputs/phase-02/canonical-retry-offset-decision.md`、`outputs/phase-02/migration-impact-evaluation.md`、`outputs/phase-01/main.md`
> 判定種別: PASS / MINOR / MAJOR

---

## 1. 判定基準

| 区分 | 定義 | 動作 |
| --- | --- | --- |
| PASS | AC を満たし、根拠記載・申し送り完備 | 次 Phase 進行可 |
| MINOR | 表記揺れ・参照欠落のみ。実体的判断は妥当 | Phase 2 で軽微修正後 PASS 扱い |
| MAJOR | 採択値・根拠・整合性のいずれかが破綻 | Phase 2 へ差し戻し |

---

## 2. AC1-AC6 個別判定

| AC | 内容 | 採択 | 判定 | 根拠（Phase 2 セクション）|
| --- | --- | --- | --- | --- |
| AC1 | retry 最大回数 | 3（既定）+ `SYNC_MAX_RETRIES` 上書き可 | PASS | canonical-retry-offset-decision §1 |
| AC2 | Backoff curve | base 1s / factor 2 / cap 32s / jitter ±20% / 1 tick 収まり証明 | PASS | 同 §2 |
| AC3 | `processed_offset` 採否 | 採用、chunk index 単位 | PASS | 同 §3 |
| AC4 | migration 影響 | 列追加 / DEFAULT 0 / NOT NULL / backfill 不要 / rollback 2 案 | PASS | migration-impact-evaluation §2-§4 |
| AC5 | quota worst case | Sheets API 2 req/100s（0.4% 消費）< 500 req/100s | PASS | canonical-retry-offset-decision §4 |
| AC6 | `SYNC_MAX_RETRIES` 存続 | 存続、既定 3、過渡期 7 日再校正 | PASS | 同 §5 |

---

## 3. 横断観点 4 項目

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| quota 整合 | PASS | Sheets API worst case 0.4% / 500 req/100s 内に余裕 99.6% |
| migration 整合 | PASS | DEFAULT 0 で既存行 backwards-compatible、本タスクは机上評価のみで物理発行は UT-09 / U-UT01-07 へ移譲 |
| 申し送り完備 | PASS | UT-09（実装値・コード変更点）、U-UT01-07（DDL 発行責務）、U-UT01-08（直交確認）すべて記載 |
| 不変条件遵守 | PASS | #1（schema 過固定回避）/ #5（D1 直接アクセスは apps/api 限定）に違反なし |

---

## 4. GO ゲート（Phase 4 進行可否）

- [x] AC1-AC6 すべて PASS
- [x] 横断観点 4 項目すべて PASS
- [x] open question 件数 0 件（`SYNC_MAX_RETRIES` の staging 再校正手順は Phase 5 ランブックで具体化）
- [x] 申し送り先（UT-09 / U-UT01-07 / U-UT01-08）明記
- [x] 不変条件 #1 / #5 違反なし

**判定: GO（Phase 4 進行）**

---

## 5. NO-GO 時の差し戻し対象（参考、本ゲートでは発動しない）

| 想定 MAJOR 項目 | 差し戻し先 |
| --- | --- |
| AC1: 値選定の根拠不足 | Phase 2 §1 |
| AC2: 1 tick 内収まり証明欠落 | Phase 2 §2 |
| AC3: chunk index 単位の行削除耐性根拠不足 | Phase 2 §3 |
| AC4: DDL / rollback 案欠落 | Phase 2 migration-impact-evaluation §2-§4 |
| AC5: quota 算定の前提値違反 | Phase 2 §4 |
| AC6: `SYNC_MAX_RETRIES` 既定値 / 過渡期方針欠落 | Phase 2 §5 |

---

## 6. 申し送りパッケージ（GO 時、確定値）

### UT-09 への canonical 確定値
- retry max: 3
- backoff: base 1s, factor 2, cap 32s, jitter ±20%
- offset: `processed_offset INTEGER NOT NULL DEFAULT 0`、chunk index 単位
- env: `SYNC_MAX_RETRIES` 存続、既定 3
- コード変更点: `apps/api/src/jobs/sync-sheets-to-d1.ts:49`、chunk loop 内 UPDATE、再開ロジック追加

### U-UT01-07 への申し送り
- 物理 migration（`0003_processed_offset.sql` 等）の発行責務は U-UT01-07 または UT-09
- `sync_log` 論理 ↔ `sync_job_logs` 物理マッピング表に `processed_offset` 行を追加

### U-UT01-08 への申し送り
- 本タスクは数値・タイミング・再開ロジックに閉じる。enum 名前空間は影響範囲外

---

## 7. 完了条件チェック

- [x] AC1-AC6 個別判定記載
- [x] 横断観点 4 項目判定記載
- [x] PASS / MINOR / MAJOR 基準明文化
- [x] GO / NO-GO ゲートのチェックリスト両方記述
- [x] GO 時の申し送りパッケージ確定値付きで分離
- [x] NO-GO 時の差し戻し対象（参考）列挙
- [x] open question 0 件
- [x] コード変更 / migration / PR なし
