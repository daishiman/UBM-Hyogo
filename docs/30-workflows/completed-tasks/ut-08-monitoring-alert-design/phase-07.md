# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | 6 (異常系検証計画) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |

---

## 目的

UT-08 の受入条件 AC-1〜AC-11 が、Phase 1〜6 のどの成果物および
Phase 4〜6 のどの検証項目（Test ID / FC-ID）でカバーされているかを
1 対 1 で対応させた **AC トレーサビリティマトリクス** を整備する。
カバレッジに欠落があれば後続 Phase（8〜11）での補完計画を明記し、
Phase 10 最終レビューでの GO/NO-GO 判定を効率化する。

UT-08 は設計タスクのため、ここでの「検証」は実機テスト結果ではなく
**設計成果物の存在・内容充足性・参照整合性** を対象とする。

---

## 実行タスク

- [ ] AC-1〜AC-11 を index.md から再確認する
- [ ] 各 AC をカバーする Phase / 成果物 / Test ID / FC-ID を一覧化する
- [ ] カバレッジマトリクスを `outputs/phase-07/ac-traceability-matrix.md` に記録する
- [ ] 成果物の存在確認コマンドを記述する
- [ ] 内容充足性の確認観点を AC ごとに列挙する
- [ ] カバレッジギャップ（未カバー / 部分カバー）があれば補完計画を立てる
- [ ] Phase 8 以降での補完が必要な事項を引き継ぎ事項として整理する

---

## 7-1. AC 定義の再確認

| AC | 内容 | 主担当 Phase |
| --- | --- | --- |
| AC-1 | 自動化対象メトリクス一覧が `outputs/phase-02/metric-catalog.md` に存在 | Phase 2 |
| AC-2 | WARNING / CRITICAL 閾値が `outputs/phase-02/alert-threshold-matrix.md` に定義され根拠明記 | Phase 2 |
| AC-3 | 通知チャネル設計と Secret 取り扱い方針が `outputs/phase-02/notification-design.md` に存在 | Phase 2 |
| AC-4 | 外部監視ツール選定評価が `outputs/phase-02/external-monitor-evaluation.md` に記載 | Phase 2 |
| AC-5 | WAE 計装ポイントが `outputs/phase-02/wae-instrumentation-plan.md` に定義 | Phase 2 |
| AC-6 | 05a runbook 差分計画が `outputs/phase-02/runbook-diff-plan.md` に整理 | Phase 2 |
| AC-7 | D1 失敗・Sheets→D1 同期失敗の検知ルールが `outputs/phase-02/failure-detection-rules.md` に定義 | Phase 2 |
| AC-8 | 監視設計総合まとめ `outputs/phase-02/monitoring-design.md` が AC-1〜AC-7 をリンク | Phase 2 |
| AC-9 | 設計レビュー結果（GO/NO-GO）が `outputs/phase-03/design-review.md` に記録 | Phase 3 |
| AC-10 | Phase 11 で 05a 実成果物との整合性 smoke が PASS | Phase 11 |
| AC-11 | 1Password Environments で管理する Secret 一覧（追加分）が `outputs/phase-02/secret-additions.md` に明記 | Phase 2 |

---

## 7-2. AC トレーサビリティマトリクス

| AC | カバー Phase | 主成果物 | 関連 Test ID（Phase 4） | 関連 FC-ID（Phase 6） | 検証方法 | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | Phase 2 | outputs/phase-02/metric-catalog.md | MON-WAE-02 / MON-WAE-04 | FC-02 | 成果物存在 + メトリクス網羅性レビュー | pending |
| AC-2 | Phase 2 / Phase 6 | outputs/phase-02/alert-threshold-matrix.md | MON-EXT-02 / MON-EXT-03 | FC-06 / FC-07 / FC-10 | 閾値テーブル存在 + 根拠（無料枠/SLA/疲労抑止）記載確認 | pending |
| AC-3 | Phase 2 / Phase 5 | outputs/phase-02/notification-design.md / outputs/phase-05/implementation-plan.md | MON-NTF-01〜04 | FC-03 / FC-04 / FC-08 | 通知経路 + Secret 取り扱い + 投入手順の確認 | pending |
| AC-4 | Phase 2 / Phase 5 | outputs/phase-02/external-monitor-evaluation.md / outputs/phase-05/implementation-plan.md | MON-EXT-01〜04 | FC-05 | 評価表存在 + UptimeRobot 設定手順の確認 | pending |
| AC-5 | Phase 2 / Phase 5 | outputs/phase-02/wae-instrumentation-plan.md / outputs/phase-05/implementation-plan.md | MON-WAE-01〜04 | FC-01 / FC-02 | 計装ポイント定義 + apps/api 識別子対応の確認 | pending |
| AC-6 | Phase 2 / Phase 5 | outputs/phase-02/runbook-diff-plan.md / outputs/phase-05/implementation-plan.md | - | - | 差分追記計画 + 不変条件 1（上書きしない）順守確認 | pending |
| AC-7 | Phase 2 / Phase 6 | outputs/phase-02/failure-detection-rules.md | MON-WAE-04 | FC-09 | 検知ルール定義 + UT-09 連携検知の網羅 | pending |
| AC-8 | Phase 2 | outputs/phase-02/monitoring-design.md | （全 Test ID 経由） | （全 FC 経由） | AC-1〜AC-7 へのリンク存在確認 | pending |
| AC-9 | Phase 3 | outputs/phase-03/design-review.md | - | - | GO/NO-GO 判定が明記されていること | pending |
| AC-10 | Phase 11 | outputs/phase-11/manual-smoke-log.md / outputs/phase-11/link-checklist.md | - | - | 05a 実成果物（observability-matrix / cost-guardrail-runbook）リンク疎通確認 | pending（Phase 11 待ち） |
| AC-11 | Phase 2 / Phase 4 / Phase 5 | outputs/phase-02/secret-additions.md | MON-NTF-01 | FC-08 | 追加 Secret 一覧 + 1Password 格納 + Cloudflare 投入手順 | pending |

---

## 7-3. 成果物存在確認コマンド

`outputs/phase-07/ac-traceability-matrix.md` に以下のコマンドリストを収録する。

```bash
# Phase 2 成果物（AC-1〜AC-8 / AC-11）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/metric-catalog.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/alert-threshold-matrix.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/external-monitor-evaluation.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/wae-instrumentation-plan.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/runbook-diff-plan.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/failure-detection-rules.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/monitoring-design.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/secret-additions.md

# Phase 3（AC-9）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-03/design-review.md

# Phase 4（テスト計画）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-04/test-plan.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-04/pre-verify-checklist.md

# Phase 5（実装計画書）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-05/implementation-plan.md

# Phase 6（異常系マトリクス）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-06/failure-case-matrix.md

# 05a の上流成果物（AC-6 / AC-10 の参照先）
ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md
```

---

## 7-4. 内容充足性の確認観点

| AC | 充足性確認ポイント |
| --- | --- |
| AC-1 | Workers / Pages / D1 / Cron それぞれのメトリクスが網羅されているか |
| AC-2 | WARNING と CRITICAL の二段階が定義され、根拠が無料枠 / SLA / アラート疲れ抑止の3観点で明記されているか |
| AC-3 | Slack / メール双方の経路が記載され、Secret は 1Password Environments 管理が明示されているか |
| AC-4 | UptimeRobot を含む 2 つ以上の選択肢が比較され、無料プラン範囲（不変条件 2）順守が明記されているか |
| AC-5 | イベント名 / フィールド / sampling が定義されているか。Phase 5 計装ポイント INST-API-01〜05 と対応がとれているか |
| AC-6 | 不変条件 1（05a 成果物を上書きしない）に整合し、追記方針として記述されているか |
| AC-7 | D1 クエリ失敗ルールと Sheets→D1 同期失敗ルール（UT-09 連携）の両方が定義されているか |
| AC-8 | AC-1〜AC-7 への内部リンクが切れていないか |
| AC-9 | GO / NO-GO 判定とレビュー記録（参加者・指摘事項・対応）が明記されているか |
| AC-10 | Phase 11 実施待ちであることが明記され、smoke 観点が事前に列挙されているか |
| AC-11 | 追加 Secret の一覧（命名規則 / 格納先 / 用途）が表形式で完備しているか |

---

## 7-5. カバレッジギャップ分析

| AC | 想定ギャップ | 補完計画 |
| --- | --- | --- |
| AC-2 | CRITICAL 閾値が初期は WARNING のみで段階導入のため、実績ベース改訂サイクルが未確定の可能性 | Phase 2 に「閾値改訂サイクル」節を追加 / Phase 6 FC-06・FC-07 と連携 |
| AC-3 | メール bounce ハンドリングが Phase 2 通知設計に含まれない可能性 | Phase 6 FC-04 で補完 / Phase 2 に month-end 到達確認を追記 |
| AC-5 | sampling 率の具体値が Phase 2 で未確定の可能性 | Phase 5 implementation-plan.md の擬似コードで暫定値を提示し Phase 8（DRY 化）で確定 |
| AC-7 | UT-09 が未実装段階でルール記述に留まる | Phase 6 FC-09 で計装漏れ検出計画を持ち、UT-09 完了後に Wave 2 実装で本実装 |
| AC-10 | Phase 11 まで GO 判定保留 | Phase 11 で smoke を実施し、リンク・参照整合を確認する |

---

## 7-6. Phase 8 以降での補完計画

| Phase | 補完事項 |
| --- | --- |
| Phase 8（設定 DRY 化） | sampling 率 / dataset 名 / Secret 名の重複を統一定義へ集約 |
| Phase 9（品質保証） | AC-1〜AC-11 の全リンク疎通テスト、誤字脱字、書式統一 |
| Phase 10（最終レビュー） | 本マトリクスを根拠に GO/NO-GO 判定 |
| Phase 11（手動 smoke） | AC-10 の 05a 実成果物リンク確認、参照整合 smoke |
| Phase 12（ドキュメント更新） | Phase 8〜11 で生じた変更を反映 |

---

## 統合テスト連携

本タスクは spec_created / non_visual の設計タスクであり、この Phase では実装コード・外部監視設定・Secret 投入を実行しない。統合テスト連携は、後段 Wave 2 実装タスクが本 Phase の成果物を入力として実行する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 後段 Wave 2 実装タスク | WAE 計装、外形監視設定、通知疎通、D1 / Sheets 失敗検知テスト | 設計・検証観点を定義し、実行は委譲 |
| UT-09 | Sheets→D1 同期失敗検知ルール | UT-09 完了後に閾値とイベント名を再確認 |
| UT-07 | 通知基盤との接続 | 通知チャネル候補として参照し、実装は UT-07 / 後段タスクで確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC 定義の正本 |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json | Phase 成果物定義 |
| 必須 | outputs/phase-04/test-plan.md | Test ID 一覧 |
| 必須 | outputs/phase-05/implementation-plan.md | 計装ポイント識別子 |
| 必須 | outputs/phase-06/failure-case-matrix.md | FC-ID 一覧 |
| 参考 | docs/completed-tasks/ut-03-sheets-api-auth/phase-07.md | トレーサビリティマトリクスの様式参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-traceability-matrix.md | AC-1〜AC-11 のトレーサビリティマトリクス |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 完了条件

- [ ] AC-1〜AC-11 の全項目がマトリクスに記載されている
- [ ] 各 AC に「カバー Phase」「主成果物」「関連 Test ID」「関連 FC-ID」「検証方法」が記載されている
- [ ] 成果物の存在確認コマンドが網羅されている
- [ ] 内容充足性確認ポイントが全 AC で記載されている
- [ ] カバレッジギャップが洗い出され、補完計画が記録されている
- [ ] Phase 8 以降の補完計画が整理されている
- [ ] AC-10 が Phase 11 待ちであることが明記されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-07 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（設定 DRY 化）
- 引き継ぎ事項:
  - 7-5 のギャップ分析で抽出された sampling 率 / Secret 名 / dataset 名の重複を Phase 8 で統一定義に集約する
  - AC-7（UT-09 連携検知）は UT-09 完了後の Wave 2 実装で実機検証となるため、Phase 12 ドキュメント更新で再リンクが必要
  - AC-10 は Phase 11 で smoke 実施するため、本マトリクスの状態欄を「pending（Phase 11 待ち）」のまま Phase 8 に引き継ぐ
- ブロック条件: AC のいずれかが完全未カバーで補完計画もない場合は、該当 Phase に差し戻す
