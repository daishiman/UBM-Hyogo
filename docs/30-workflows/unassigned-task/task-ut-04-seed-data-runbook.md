# UT-04 seed data runbook follow-up

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-UT04-SEED-DATA-RUNBOOK-001 |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 出典 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/unassigned-task-detection.md |
| 優先度 | MEDIUM |

## 目的

dev / staging で使う合成 seed data と、本番初期データ投入の境界を runbook 化する。

## スコープ

含む:

- 合成 fixture の命名・メールアドレス・response_id 規約
- `INSERT OR IGNORE` を使う seed と使わない seed の判定
- 本番で実会員データを投入しない手順境界

含まない:

- 実会員データ移行
- Sheets API sync 実装

## 苦戦箇所【記入必須】

Phase 11 smoke では合成値で DB 制約を確認するが、seed と本番データ移行を混同すると個人情報の混入や重複投入につながる。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 実会員データを fixture として commit | fixture は `example.com` / `R-TEST-*` のみ許可する |
| seed の再実行で重複 | idempotent seed は `INSERT OR IGNORE`、検証用一時データは cleanup 手順を必須化する |

## 検証方法

- secret / PII grep
- seed 再実行で差分 0 または期待どおり cleanup されること

## 受入条件

- seed runbook が dev / staging / production の境界を明示する
- Phase 11 smoke の fixture 値と整合する
