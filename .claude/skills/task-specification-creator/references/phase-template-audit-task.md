---
title: Phase template — read-only audit task
applies_to: task type = audit / read-only / NON_VISUAL invariant audit
origin: task-24 ui-mvp-w8-par-invariant-audit (L-TASK24-001..004)
related:
  - phase-11-non-visual-alternative-evidence.md
  - phase-template-phase12.md
  - non-visual-irreversible-task-rules.md
---

# Phase template — read-only audit task

`apps/` / `packages/` を改変せず、現状コードの不変条件 (invariant) 準拠状況を
grep-evidence で集計する read-only audit task 用の mini-template。
通常 implementation Phase 設計と差分のある箇所のみ記述する。

## 適用条件

- コード/設定の変更なし（PR diff は docs と skill 同期のみ）
- 出力は matrix（任意 N×M）と grep-evidence、後続タスクへの mapping artifact
- visual evidence: `NON_VISUAL` 固定

## Matrix shape SSOT（L-TASK24-001）

Phase 1 acceptance criteria に下記 3 軸を確定する。後段 phase / 消費 task は
本 SSOT に従い decode logic を持たない。

| 軸 | 内容 | task-24 実例 |
| --- | --- | --- |
| rows | 監査対象集合 | 22 tasks（task-01..task-22） |
| cols | invariant 集合 | 6 invariants（INV-1..INV-6） |
| cell vocabulary | 各セルが取り得る値 | `COMPLIANT \| VIOLATION \| N/A` |

未該当セルは必ず `N/A` を使用し、`COMPLIANT` で埋めない。
Markdown table（`INVARIANT-AUDIT.md`）と TSV (`outputs/phase-5/matrix.tsv`) を
fixture でゴールデン比較する。

## Phase 役割の読み替え（L-TASK24-002）

| Phase | 役割 | 必須 output |
| --- | --- | --- |
| Phase 1 | matrix shape + acceptance criteria 確定 | `phase-1.md`（rows / cols / vocabulary を明示） |
| Phase 2 | audit-runner I/O contract 設計 | `outputs/phase-2/runner-contract.md` |
| Phase 5 | grep-evidence 収集 + 集計 TSV | `outputs/phase-5/{audit-runner.sh, matrix.tsv, grep-evidence.txt, violations.md}` |
| Phase 11 | matrix snapshot + runner stdout | `outputs/phase-11/{main.md (NON_VISUAL 宣言), matrix-snapshot.md, audit-runner.log}` |
| Phase 12 | strict 7 + canonical heading SSOT | 通常規定どおり。`visualEvidence: NON_VISUAL` を main.md に必須記載 |

## audit-runner.sh I/O contract（L-TASK24-003）

Phase 2 design output に「runner contract」節を必須化し、下記 4 点を SSOT 化する。
implementation-guide.md からは link 参照のみとし、本文重複を避ける。

1. exit code 体系（例: `0=all-compliant`、`1=violations-found`、`2=runner-error`）
2. 出力 dir の絶対 path（例: `outputs/phase-5/`）
3. 生成ファイル名 + schema（例: `matrix.tsv` の列順 / `violations.md` の見出し構造）
4. 再実行時の idempotency（同一 input → 同一出力。前回出力は削除 or 上書き）

## Acceptance criteria スニペット例

```md
## Acceptance criteria (Phase 1)
- matrix shape: rows = <N tasks>, cols = <M invariants>, cell vocabulary = `COMPLIANT | VIOLATION | N/A`
- audit-runner.sh は exit 0 のとき VIOLATION セルが 0 件であること
- outputs/phase-5/matrix.tsv と INVARIANT-AUDIT.md の matrix table が byte-equivalent
- visual evidence: NON_VISUAL（matrix snapshot で代替）
```

## task root rename チェック（L-TASK24-004）

audit task は完了後 `docs/30-workflows/completed-tasks/` へ移動されやすい。
Phase 13 close-out checklist に下記を含める。

- `outputs/**/*.md` 内の旧 root literal を `grep -RIn` し 0 件確認
- aiworkflow-requirements skill の resource-map / quick-reference / topic-map
  3 indexes と workflow artifact-inventory を同 wave で更新
- 親 SCOPE.md / EXECUTION-ORDER.md の参照 path も同時更新

## 関連

- `phase-11-non-visual-alternative-evidence.md` § Read-only audit task
- `phase-template-phase12.md` § task root rename 時の self-reference path 修正
- 実例: `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/`
