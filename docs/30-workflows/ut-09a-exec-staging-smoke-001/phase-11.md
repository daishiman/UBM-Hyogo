# Phase 11: 手動 smoke / 実測 evidence — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 11 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| execution_allowed | false until explicit_user_instruction |

## 目的

実 staging 環境で 09a placeholder evidence を実測値に置換する。本仕様書では
「実 staging 実行を user 承認後に行う」前提でランブックを最終確認するに留め、
スクリプト実行は ut-09a-exec-staging-smoke-001 開始タスク（user 明示指示）から行う。

## 実行タスク（実行は user 明示指示後）

1. 必要 secret の存在確認（値は出さない、`bash scripts/cf.sh whoami` 等で確認）
2. UI smoke（Playwright staging profile or 手動）を実行
3. Forms sync（schema → responses）を実行し audit dump を取得
4. `bash scripts/cf.sh` 経由 tail 30 分相当を取得（取得不能時は理由を log 冒頭に記録）
5. evidence を `outputs/phase-11/` に集約し、09a placeholder を実測 path に置換
6. 09a / 本タスク `artifacts.json` parity を更新
7. 09c blocker を `task-workflow-active.md` で更新

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/phase-05.md

## 統合テスト連携

- UI smoke は 08b scaffold / manual fallback のどちらかで evidence を保存する
- Forms sync は U-04 sync endpoint / audit ledger の実測結果を保存する
- PASS / FAIL 結果は Phase 7 AC matrix と 09c blocker 更新に接続する

## 必須 evidence path（VISUAL_ON_EXECUTION）

| path | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | 実行サマリ |
| `outputs/phase-11/playwright-staging/` | screenshots / report / trace |
| `outputs/phase-11/manual-smoke-log.md` | 手動 smoke 結果 |
| `outputs/phase-11/sync-jobs-staging.json` | Forms sync job dump |
| `outputs/phase-11/wrangler-tail.log` | staging tail log（または取得不能理由） |
| `outputs/phase-11/redaction-checklist.md` | PII / secret redaction 確認結果 |

`redaction-checklist.md` が PASS でない場合、AC-2 と AC-4 は PASS にしない。

## 09a 側 placeholder 置換ルール

- 09a `outputs/phase-11/*` の `NOT_EXECUTED` を本タスク evidence への参照リンクに置換
- 09a `artifacts.json` / `outputs/artifacts.json` の Phase 11 status を `completed` に更新（実測 PASS 時）
- 失敗時は `partial` または `failed` に更新し、理由を併記

## 多角的チェック観点

- placeholder のままで PASS にしない
- secret 値や個人情報を artifact / log に保存しない
- 取得不能ケースは「実行不能」として実測 evidence に該当する記録を残す

## サブタスク管理

- [ ] user から実 staging 実行の明示指示を得る
- [ ] secret 存在確認 → UI smoke → Forms sync → tail の順で実行
- [ ] redaction checklist を完了
- [ ] 09a / 本タスク artifacts.json を更新
- [ ] 09c blocker を更新
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- 上記「必須 evidence path」一式

## 完了条件

- AC-1〜AC-6 がそれぞれ PASS / FAIL いずれかで判定済み
- 09a placeholder が実測 evidence に置換済み（または FAIL 理由が明記）
- 09c blocker が更新済み

## タスク100%実行確認

- [ ] PII / secret 漏洩がゼロ
- [ ] AC ごとに evidence path が実在
- [ ] artifacts parity が PASS

## 次 Phase への引き渡し

Phase 12 へ、実測 evidence と 09c blocker 更新結果を渡す。
