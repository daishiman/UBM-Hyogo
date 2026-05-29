# Phase 9: リスク

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 09 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-05 / Phase 5
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


| ID | リスク | 影響 | 緩和 |
|----|--------|------|------|
| R-01 | flag=true で意図せず非公開希望の会員が公開化される | Privacy 事故 | (a) flag default false (b) admin override 尊重 (c) consent=consented 必須 (d) staging のみ flag=true で先行検証 |
| R-02 | backfill が一括 UPDATE で D1 quota / lock を圧迫 | API 一時停止 | バッチサイズ 200 行ごとに区切る・dry-run 必須・夜間実行推奨 |
| R-03 | 診断 endpoint で D1 全件 COUNT が遅い | レイテンシ | member_status に既存 index `(public_consent, publish_state, is_deleted)` (0002 migration L82) が効くので問題なし |
| R-04 | H3 ではなく H1/H2/H4 が真因だった場合、本サイクル修復で解消しない | 二次サイクル必要 | 診断 → 該当 runbook (#956/#957/#959) を本サイクル内で順次実行する方針を Task A に明記 |
| R-05 | sync ジョブ中の policy 適用で既存テストが壊れる | regression | 既存 fixture (publish_state="member_only") は flag=false default で動作変化なし → contract-spec で保証 |
| R-06 | admin override 判定を存在しない `member_status_history` に依存してしまう | backfill 失敗 / privacy 事故 | 現行 schema 正本に合わせ、`member_status.updated_by` と `publish_state='hidden'` のみを使う。history table 前提は禁止 |

## エスカレーション基準

- 診断結果が H1/H2/H4 を強く示唆する場合は既存 issue runbook を本サイクルで参照実行（再 issue 起票不要、既存 CLOSED issue を runtime-ops 再開で扱う）
- backfill apply 後も `/members` 表示が 0 件の場合: Gate-C を fail として扱い、追加診断（admin override 判定の偽陽性疑い）に進む
