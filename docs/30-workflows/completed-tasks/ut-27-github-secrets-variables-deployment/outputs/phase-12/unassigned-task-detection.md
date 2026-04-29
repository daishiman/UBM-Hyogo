# Phase 12 outputs / unassigned-task-detection — 未タスク検出レポート

> **0 件でも出力必須** / **current（本タスク発見）と baseline（既起票済）を分離形式で記述**

## 設計タスクパターン 4 種の確認

| パターン | 確認結果 |
| --- | --- |
| 型 → 実装 | 該当なし（NON_VISUAL / docs-only） |
| 契約 → テスト | Phase 4 / 7 で AC-1〜AC-15 トレース対応済 |
| UI 仕様 → コンポーネント | 該当なし（NON_VISUAL） |
| 仕様書間差異 | Phase 11 spec walkthrough / link-checklist で確認 |

## baseline（既起票済 / 本タスクの未タスク検出ではカウントしない）

| タスク ID | 内容 | 関係性 |
| --- | --- | --- |
| UT-05 | CI/CD パイプライン実装 | 上流（必須） |
| UT-28 | Cloudflare Pages プロジェクト作成 | 上流（必須） |
| 01b | Cloudflare base bootstrap | 上流（必須） |
| UT-06 | 本番デプロイ実行 | 下流 |
| UT-29 | CD 後スモーク | 下流 |
| UT-25 | Cloudflare Secrets / SA JSON deploy | 関連（責務境界） |

## current（本タスク Phase 1〜11 で発見した派生課題）

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| 1 | `if: secrets.X != ''` の workflow 側代替設計（env 受け + シェル空文字判定） | **UT-05 blocker フィードバック** | 既存 `web-cd.yml` / `backend-ci.yml` に旧条件が残る場合、Phase 13 実 PUT 前に UT-05 側で解消必須 | 独立未タスクは作らず UT-05 へ吸収。Phase 13 gate B-07 として扱う |
| 2 | `1password/load-secrets-action`（案 D）導入 | 将来移行（CI セキュリティ強化） | 次 Wave 以降。SA トークン管理 / actions 改修コストとの比較 | 現時点では未タスク化しない。再判定トリガ: op SA 採用 / secrets 同期頻度増 / 手動同期 drift 発生 |
| 3 | Terraform GitHub Provider（案 C）化 | 将来 IaC 化 | 次 Wave 以降。state backend（R2 等）の選定が前提 | 現時点では未タスク化しない。再判定トリガ: GitHub environments が複数 repo 化 / R2 state backend 方針確定 |
| 4 | 1Password Last-Updated メモ運用の自動化 | 運用効率化 | 1Password CLI / op SA で同期日時を自動更新 | Phase 13 op-sync-runbook §運用注記 / current 内処理 |
| 5 | Discord チャンネル分離（staging / production 別） | 運用判断 | 通知混線が気になれば environment-scoped に切替 | Phase 13 内処理 / open question #2 |
| 6 | `CLOUDFLARE_API_TOKEN` の staging / production 別 token 化 | 運用判断 | 漏洩時影響限定を優先するなら別 token | Phase 13 内処理 / open question #1 |

## サマリ判定

- formalize 候補（独立 unassigned-task として起票推奨）: **0 件**（大きな課題のみ未タスク化する方針のため）
- 既存タスクへの blocker フィードバック: **1 件**（#1 → UT-05 / Phase 13 gate B-07）
- 再判定トリガ付きの将来候補: **2 件**（#2 / #3）
- Phase 13 内処理 / open question 解消: **3 件**（#4 / #5 / #6）
- baseline カウント: **6 件**（既起票済のため未タスク化不要）

## 該当なし区分

> 設計タスクパターン 4 種をすべて確認した結果、上記以外の派生課題は検出されなかった。
