# Phase 7 成果物: AC トレーサビリティマトリクス (ac-traceability-matrix.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-08 モニタリング/アラート設計 |
| Phase | 7 / 13（検証項目網羅性） |
| 作成日 | 2026-04-27 |
| 状態 | completed（AC-10 のみ Phase 11 待ち） |

---

## 1. 受入条件 (AC) の再確認

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

## 2. AC トレーサビリティマトリクス

| AC | カバー Phase | 主成果物（達成根拠） | 補助成果物 | 関連 Test ID（Phase 4） | 関連 FC-ID（Phase 6） | 検証方法 | 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | Phase 2 | outputs/phase-02/metric-catalog.md | phase-04/test-plan.md / phase-05/implementation-plan.md §3 | MON-WAE-02 / MON-WAE-04 | FC-02 / FC-10 | 成果物存在 + 6 イベント網羅性レビュー | completed |
| AC-2 | Phase 2 / Phase 6 | outputs/phase-02/alert-threshold-matrix.md | phase-06/failure-case-matrix.md（FC-06/07/10） | MON-EXT-02 / MON-EXT-03 / MON-NTF-04 | FC-06 / FC-07 / FC-10 | 閾値テーブル存在 + 根拠（無料枠 / SLA / 疲労抑止）記載確認 | completed |
| AC-3 | Phase 2 / Phase 5 / Phase 6 | outputs/phase-02/notification-design.md | phase-05/implementation-plan.md §6 / phase-06 FC-03/04/08/12 | MON-NTF-01〜04 | FC-03 / FC-04 / FC-08 / FC-12 | 通知経路 + Secret 取扱 + 投入手順 + 漏洩対策の確認 | completed |
| AC-4 | Phase 2 / Phase 5 | outputs/phase-02/external-monitor-evaluation.md | phase-05/implementation-plan.md §5 | MON-EXT-01〜04 | FC-05 | 評価表存在（UptimeRobot 一次 / Cronitor サブ）+ 設定 Runbook | completed |
| AC-5 | Phase 2 / Phase 5 | outputs/phase-02/wae-instrumentation-plan.md | phase-05/implementation-plan.md §3 / §4 | MON-WAE-01〜04 | FC-01 / FC-02 | 計装ポイント定義 + INST-API-01〜07 / INST-WEB-01〜02 識別 | completed |
| AC-6 | Phase 2 / Phase 5 | outputs/phase-02/runbook-diff-plan.md | phase-05/implementation-plan.md §7 / phase-06 FC-11 | - | FC-11 | 差分追記計画 + 不変条件 1（上書きしない）順守 | completed |
| AC-7 | Phase 2 / Phase 4 / Phase 6 | outputs/phase-02/failure-detection-rules.md | phase-05/implementation-plan.md §3-1（INST-API-05/06） | MON-WAE-04 | FC-09 | 検知ルール定義 + UT-09 連携検知の網羅 | completed（UT-09 完了後に Wave 2 で再検証） |
| AC-8 | Phase 2 | outputs/phase-02/monitoring-design.md | （AC-1〜AC-7 への内部リンク） | （全 Test ID 経由） | （全 FC 経由） | 内部リンク存在確認 | completed |
| AC-9 | Phase 3 | outputs/phase-03/design-review.md | - | - | - | GO 判定明記、MINOR 3 件記録、対応方針 Phase 4/5 へ反映 | completed |
| AC-10 | Phase 11 | outputs/phase-11/manual-smoke-log.md / outputs/phase-11/link-checklist.md | - | - | FC-11 | 05a 実成果物（observability-matrix / cost-guardrail-runbook）リンク疎通確認 | pending（Phase 11 待ち） |
| AC-11 | Phase 2 / Phase 4 / Phase 5 / Phase 6 | outputs/phase-02/secret-additions.md | phase-05/implementation-plan.md §6 / phase-04/pre-verify-checklist.md C3 | MON-NTF-01 | FC-08 / FC-12 | 追加 Secret 一覧 + 1Password 格納 + Cloudflare 投入手順 + 漏洩対策 | completed |

---

## 3. 成果物存在確認コマンド

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

# Phase 4（テスト計画・事前確認）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-04/test-plan.md
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-04/pre-verify-checklist.md

# Phase 5（実装計画書）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-05/implementation-plan.md

# Phase 6（異常系マトリクス）
ls docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-06/failure-case-matrix.md

# 05a 上流（AC-6 / AC-10 の参照先 — Wave 2 着手前に生成完了が前提）
ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md
ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md
```

---

## 4. 内容充足性の確認観点

| AC | 充足性確認ポイント | 結果 |
| --- | --- | --- |
| AC-1 | Workers / Pages / D1 / Cron それぞれのメトリクスが網羅され、6 イベント（api.request, api.error, cron.sync.start, cron.sync.end, d1.query.fail, auth.fail）と整合 | OK |
| AC-2 | WARNING / CRITICAL の二段階。根拠が無料枠 / SLA / 疲労抑止の 3 観点で明記。主要閾値（5xx 1%/5%、CPU p99 8ms/9.5ms、subrequests 40/48、無料枠 70%/90%、外形連続 2/4 回） | OK |
| AC-3 | Slack（prod/staging/deploy 3 チャネル）+ メール双方の経路。Secret は 1Password Environments 管理が明示 | OK |
| AC-4 | UptimeRobot（一次）+ Cronitor（サブ）+ Better Uptime / Hyperping（予備）の比較。無料プラン範囲（不変条件 2）順守 | OK |
| AC-5 | イベント名 / フィールド / sampling（初期 100% → 運用後調整）が定義。INST-API-01〜07 / INST-WEB-01〜02 と対応 | OK |
| AC-6 | 不変条件 1（05a 上書き禁止）に整合。追記方針として記述、FC-11 で違反検知 | OK |
| AC-7 | D1 クエリ失敗ルールと Sheets→D1 同期失敗ルール（UT-09 連携）の両方を定義 | OK（UT-09 後に Wave 2 で再検証） |
| AC-8 | AC-1〜AC-7 への内部リンクが切れていない | OK（Phase 9 で再点検） |
| AC-9 | GO 判定 + MINOR 3 件（05a 実ファイル / WAE 無料枠 / .gitignore）+ 対応 Phase 明記 | OK |
| AC-10 | Phase 11 実施待ち。smoke 観点を pre-verify-checklist.md に事前列挙 | pending |
| AC-11 | 追加 Secret（5 種）の命名規則 / 格納先 / 用途が表形式で完備 | OK |

---

## 5. カバレッジギャップ分析

| AC | 想定ギャップ | 補完計画 | 補完先 Phase |
| --- | --- | --- | --- |
| AC-2 | CRITICAL 閾値が初期は WARNING のみで段階導入のため、実績ベース改訂サイクル未確定 | 「閾値改訂サイクル（月次）」を Phase 8 で monitoring-design.md に追記、FC-06/07 と連携 | Phase 8 |
| AC-3 | メール bounce ハンドリングが notification-design.md に明記不足の可能性 | Phase 6 FC-04 で補完済。Phase 8 で notification-design.md に「月次到達確認」を追記 | Phase 8 |
| AC-5 | sampling 率の具体値が phase-02 で「初期 100%」のみで運用後切替値未確定 | Phase 5 implementation-plan.md §4 に暫定値（10〜25%）を提示、Phase 8 で metrics.ts 定数として確定 | Phase 8 |
| AC-7 | UT-09 が未実装段階のためルール記述に留まる | Phase 6 FC-09 で計装漏れ検出計画。UT-09 完了後 Wave 2 実装で本実装、Phase 12 で再リンク | Phase 12 |
| AC-10 | Phase 11 実施待ちで GO 判定保留 | Phase 11 で smoke 実施し AC-10 達成。本マトリクスは Phase 11 完了後に状態更新 | Phase 11 |
| AC-6 | 05a outputs 未生成のため差分追記の宛先が暫定 | Wave 2 W2-T10 着手前に 05a outputs 生成完了を確認（PRE-1） | Wave 2 / Phase 12 |

---

## 6. Phase 8 以降での補完計画

| Phase | 補完事項 |
| --- | --- |
| Phase 8（設定 DRY 化） | sampling 率 / dataset 名 / Secret 名 / 閾値定数の重複を統一定義へ集約。閾値改訂サイクル（月次）を monitoring-design.md に追記 |
| Phase 9（品質保証） | AC-1〜AC-11 の全リンク疎通テスト、誤字脱字、書式統一、本マトリクスの参照整合再確認 |
| Phase 10（最終レビュー） | 本マトリクスを根拠に GO/NO-GO 判定（AC-10 は Phase 11 後に再判定） |
| Phase 11（手動 smoke） | AC-10 達成（05a 実成果物リンク確認、参照整合 smoke）+ link-checklist.md 出力 |
| Phase 12（ドキュメント更新） | UT-09 完了後の AC-7 再リンク、Wave 2 実装結果の反映、unassigned-task 整理 |
| Phase 13（PR 作成） | 全成果物の最終 PR 化、本マトリクスを PR 説明に転記 |

---

## 7. AC × Phase × FC × Test ID クロスチェック

| AC | 関連 Phase | 関連 FC | 関連 Test ID | カバレッジ |
| --- | --- | --- | --- | --- |
| AC-1 | 2 / 5 | FC-02 / FC-10 | MON-WAE-02 / 04 | フル |
| AC-2 | 2 / 6 | FC-06 / 07 / 10 | MON-EXT-02 / 03 / MON-NTF-04 | フル（CRITICAL 段階導入） |
| AC-3 | 2 / 5 / 6 | FC-03 / 04 / 08 / 12 | MON-NTF-01〜04 | フル |
| AC-4 | 2 / 5 | FC-05 | MON-EXT-01〜04 | フル |
| AC-5 | 2 / 5 | FC-01 / 02 | MON-WAE-01〜04 | フル |
| AC-6 | 2 / 5 | FC-11 | - | フル（PR レビュー必須） |
| AC-7 | 2 / 4 / 6 | FC-09 | MON-WAE-04 | 部分（UT-09 完了後に Wave 2 で完全化） |
| AC-8 | 2 | （横断） | （横断） | フル |
| AC-9 | 3 | - | - | フル |
| AC-10 | 11 | FC-11 | - | pending |
| AC-11 | 2 / 4 / 5 / 6 | FC-08 / 12 | MON-NTF-01 | フル |

---

## 8. 完了確認

- [x] AC-1〜AC-11 全項目をマトリクスに記載
- [x] 各 AC に「カバー Phase」「主成果物」「関連 Test ID」「関連 FC-ID」「検証方法」記載
- [x] 成果物の存在確認コマンド網羅
- [x] 内容充足性確認ポイントを全 AC で記載
- [x] カバレッジギャップを洗い出し補完計画を記録
- [x] Phase 8 以降の補完計画を整理
- [x] AC-10 が Phase 11 待ちであることを明記

---

## 9. 参照

- docs/30-workflows/ut-08-monitoring-alert-design/index.md
- docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json
- outputs/phase-02/*（9 ファイル）
- outputs/phase-03/design-review.md
- outputs/phase-04/test-plan.md
- outputs/phase-04/pre-verify-checklist.md
- outputs/phase-05/implementation-plan.md
- outputs/phase-06/failure-case-matrix.md
