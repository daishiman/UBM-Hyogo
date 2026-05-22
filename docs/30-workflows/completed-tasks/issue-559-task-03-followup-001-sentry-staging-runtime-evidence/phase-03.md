# Phase 3: 設計レビュー

## 1. 真の論点

「Sentry SDK を Workers / Browser に分離する設計（親 task-03）が、staging runtime で実 DSN を解決し SSR / Browser それぞれで意図通りに event を発火するか」を、**コード/設定変更を伴わずに証明できるか** が論点。答: 不可能。env schema 反映と wrangler.toml の vars 追加と secret 投入が前提条件であり、それらを実装変更として扱う必要がある。よって本タスクは実装仕様書として扱う（CONST_004 例外不適用）。

## 2. 因果と境界

- 親 task-03（local PASS）→ env schema・wrangler vars・secret が揃う → staging deploy → curl 200 → SDK 解決 → Sentry event 受信 → grep gate 再走で混入 0 件
- 境界: 本タスクは **staging のみ**。production deploy は scope out（secret 投入のみ実施）。`apps/api` 側 Sentry 統合は親タスク非ゴール継承

## 3. 価値とコスト

| 項目 | 値 |
| --- | --- |
| 価値 | task-03 の `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` 昇格 / observability incident response readiness 確立 / production deploy gate ブロッカ解消 |
| コスト | 人手承認 G1〜G5 5 ステップ / Cloudflare Secrets 操作 / Sentry dashboard 確認 30 分以内 |
| ROI | 高（残置 runtime gate 1 つで親タスクの全成果が完了状態に進む） |

## 4. 改善優先順位

1. env schema 反映（既存実装の現状確認 → 不足分のみ追加）
2. wrangler.toml vars 追加（最小差分）
3. secret 投入（staging → production の順、production は本タスクでは deploy 実行しない）
4. staging deploy + curl + dashboard observation
5. grep gate 再走 + 状態昇格

## 5. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 必要性 | ✓ | task-03 の RUNTIME_PENDING を VERIFIED に昇格させる唯一経路 |
| 十分性 | ✓ | AC-7 / AC-4 を staging で完全カバー（production は scope out 明示） |
| 実現可能性 | ✓ | 既存 `scripts/cf.sh` / `wrangler` / Sentry dashboard で完結 |
| 検証可能性 | ✓ | curl HTTP code / grep 件数 / dashboard event 件数で機械的に PASS/FAIL 判定可能 |

## 6. レビュー指摘事項

| 指摘 | 対応 |
| --- | --- |
| `SENTRY_DSN_WEB` と `NEXT_PUBLIC_SENTRY_DSN` を分けるか同一値か曖昧 | phase-02 §4 の補足で「両キーに同一 DSN を put する運用も許容」と明記済 |
| `force_error=1` 一時 throw が残置される懸念 | phase-05 の DoD で revert 必須を明記 / Phase 6 異常系で revert 漏れ検証 |
| Sentry screenshot に DSN が映る懸念 | phase-02 §6 で「event 一覧画面のみ・settings / project details は撮らない」を明記 / Phase 11 で hash check |
| production secret 投入のみで production deploy しない判断の根拠 | scope out 明示（index.md / phase-01）。production deploy は別 follow-up で扱う |
| 親タスク状態語彙の更新を本タスク Phase 12 に置く是非 | 本タスクの Phase 11 で runtime evidence を取得し、Phase 12 で親側メタを書き換えるのが最短経路。両ワークフロー root の `workflow_state` は独立管理 |

## 7. レビュー結論

設計は phase-02 で確定。次フェーズ（テスト戦略）へ進行可。
