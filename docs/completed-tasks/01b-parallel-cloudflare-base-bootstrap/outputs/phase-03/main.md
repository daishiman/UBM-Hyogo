# Phase 3 成果物: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 名称 | 設計レビュー |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. 入力確認

Phase 2 成果物:
- `outputs/phase-02/main.md`: 設計ドキュメント（サービス名・環境対応・wrangler.toml）
- `outputs/phase-02/cloudflare-topology.md`: トポロジー詳細

## 2. レビューチェックリスト（4条件）

| 観点 | レビュー問い | 評価根拠 | 判定 |
| --- | --- | --- | --- |
| 価値性 | インフラ担当者の手動セットアップミスを防ぎ、dev/main 環境混乱を解消するか | `dev`→staging、`main`→production を一意に定義。下流3タスク（02/03/04）が参照できる source-of-truth を確立 | PASS |
| 実現性 | Pages 500ビルド/月・Workers 100k req/day・D1 5GB の無料枠で成立するか | ubm-hyogo 初期トラフィックは無料枠の1/10以下の見込み | PASS |
| 整合性 | branch/env/runtime/data/secret が一致するか | branch-strategy.md と deployment-cloudflare.md が同一の dev/main 対応を記述。APIトークン（3スコープ）を GitHub Secrets に配置、runtime secrets は Cloudflare Workers Secrets に分離 | PASS |
| 運用性 | rollback/handoff/same-wave sync が可能か | Pages は Dashboard 1クリック、Workers は `wrangler rollback` で独立ロールバック可能。同 Wave の 01a/01c とデータ共有なし | PASS |

## 3. PASS / MINOR / MAJOR 判定

| 判定 | 条件 | 今回の実例 |
| --- | --- | --- |
| PASS | 下流 blocker を残さない | 4条件すべて PASS。Phase 4 へ進める |
| MINOR | 同 wave で吸収できる | M-01: `deployment-cloudflare.md` の `develop` 表記を `dev` に統一（Phase 12 で対応） |
| MAJOR | task 分割または前提再定義が必要 | 該当なし |

## 4. MINOR 追跡表

| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | `deployment-cloudflare.md` に残る `develop` 表記を `dev` に統一 | Phase 12 |
| M-02 | `ubm-hyogo-web.pages.dev` URL の最終確定（DNS 設定後） | Phase 11 smoke test |

## 5. より単純な代替案（不採用理由）

| 代替案 | 概要 | 不採用理由 |
| --- | --- | --- |
| 代替案A: Google Sheets を正本DB | Sheets をカノニカルとして直接参照 | 同時編集・スキーマ管理・履歴追跡に難があるため D1 を正本とした |
| 代替案B: OpenNext 単一構成 | Pages + Workers を一体化 | web と api のデプロイサイクルが異なるため経路を分離した |
| 代替案C: 通知基盤まで同時導入 | Discord/Slack 通知を初回から導入 | 無料枠スコープ外のため未タスク行きとした |

## 6. Phase 4 進行 GO/NO-GO

- **GO**: 4条件すべて PASS、MAJOR 該当なし → Phase 4 即時着手可能
- MINOR M-01（`develop`→`dev` 表記統一）は Phase 4 の scope 外として Phase 12 行き確定

## 7. 正本仕様参照

| パス | 確認内容 |
| --- | --- |
| deployment-cloudflare.md | プロジェクト名・コマンド（`develop` 表記残存確認済み） |
| deployment-core.md | Pages/Workers/D1 役割と無料枠 |
| deployment-secrets-management.md | GitHub Secrets vs Cloudflare Secrets の判断フロー |
| architecture-overview-core.md | web/api デプロイ経路分離 |
| deployment-branch-strategy.md | dev→staging, main→production |

## 8. downstream handoff

Phase 4 では `wrangler login` が済んでいること、および Account ID が取得済みであることを前提に事前検証手順を組む。

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
- [x] PASS/MINOR/MAJOR 判定完了
- [x] MINOR 追跡表が記録済み
