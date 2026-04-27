# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | completed |

## 目的

Phase 2 の設計（KV 命名規約・wrangler.toml バインディング・TTL 方針・env 差異マトリクス）の
妥当性をレビューし、代替案を検討したうえで PASS / MINOR / MAJOR 判定を行い、
Phase 4 以降の実行可否を確定する。
特に「無料枠書き込み 1,000/日」「最終的一貫性 60 秒」という強制約に対し、
設計が実装段階で破綻しないかを重点的に検証する。

## 実行タスク

- Phase 2 の設計（命名規約・バインディング・TTL 方針・env 差異マトリクス）をレビューする
- 代替案（KV 以外のセッションキャッシュ手段）を列挙・検討する
- 各観点で PASS / MINOR / MAJOR 判定を行う
- ブロッカーがある場合は Phase 2 に差し戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-02.md | レビュー対象の設計 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-01.md | AC・4条件評価 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 仕様の確認 |

## 実行手順

### ステップ 1: 設計の妥当性確認

- Phase 2 の命名規約が AC-1 / AC-6 を満たしているか確認する
- wrangler.toml バインディング設計が AC-2 を満たし、KV ID を仕様書に書いていないことを確認する
- TTL 方針が AC-4 を満たし、無料枠制約（AC-5）と矛盾しないか確認する
- env 差異マトリクスが local / staging / production を網羅しているか確認する
- 「即時反映が必要な操作で KV を使わない」指針（AC-7）が設計分岐に組み込まれているか確認する

### ステップ 2: 代替案の検討

- KV 以外のセッションキャッシュ手段を列挙する
- 各代替案のコスト・リスク・効果を比較する
- 採用案（KV + JWT + 「即時反映用途は別ストア」）が最適であることを確認する

### ステップ 3: PASS / MINOR / MAJOR 判定

- 各観点で判定を行い、結果を記録する
- MAJOR が1件でもあれば Phase 2 に差し戻す
- MINOR は Phase 5 実行前に解消する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | MAJOR 判定時に差し戻す |
| Phase 4 | PASS 判定後に verify suite の設計に進む |
| Phase 5 | レビュー結果を実行の根拠とする |
| Phase 9 | 無料枠遵守設計のレビュー結果を品質保証で参照 |

## 多角的チェック観点（AIが判断）

- 価値性: 認証機能実装タスクが本仕様だけで KV 利用設計を始められる粒度か
- 実現性: 無料枠書き込み 1,000/日 で本番運用に耐える設計か（書き込み発生箇所の総量見積もりが整合的か）
- 整合性: local の KV エミュレーション差異を許容する設計になっているか
- 運用性: KV ID 取り違え事故防止のチェック手順が runbook 側に渡される構造か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名規約レビュー | 3 | completed | AC-1 / AC-6 との整合確認 |
| 2 | wrangler.toml バインディング設計レビュー | 3 | completed | AC-2 との整合確認 / KV ID 非掲載確認 |
| 3 | TTL 方針レビュー | 3 | completed | AC-4 / AC-5 との整合確認 |
| 4 | env 差異マトリクスレビュー | 3 | completed | local / staging / production 網羅 |
| 5 | 「KV を使わない判断」分岐レビュー | 3 | completed | AC-7 との整合確認 |
| 6 | 代替案検討 | 3 | completed | KV 以外のセッション保管手段 |
| 7 | PASS/MINOR/MAJOR 判定 | 3 | completed | 判定結果を記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/review-result.md | 設計レビュー結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 代替案の検討が完了している
- 全観点で PASS / MINOR / MAJOR 判定が完了している
- MAJOR がない（または Phase 2 差し戻しが完了している）
- 次 Phase への進行可否が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- MAJOR 判定の場合は Phase 2 差し戻し記録がある
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: 設計レビュー結果・PASS/MINOR/MAJOR 判定・採用設計を Phase 4 に渡す
- ブロック条件: MAJOR 判定が残っている場合は次 Phase に進まない

## 代替案

| 案 | 内容 | メリット | デメリット | 採否 |
| --- | --- | --- | --- | --- |
| A: KV + JWT 併用（採用案） | JWT を主とし、KV はブラックリスト・設定キャッシュ・レートリミットのみ | 書き込み回数を最小化でき無料枠内に収まる / 既存 Cloudflare スタックと整合 | 最終的一貫性 60s を許容できない用途に使えない | 採用 |
| B: KV にセッション本体を保管 | ログイン毎に KV に書き込み | 設計が単純 | 書き込み枠 1,000/日 を簡単に枯渇 / 即時無効化不可 | 不採用 |
| C: D1 にセッションテーブル | D1 で全セッション管理 | 強整合性・即時無効化可 | D1 read/write 量が増加 / レイテンシが KV より高い | 部分採用（即時反映用途のみ） |
| D: Durable Objects | DO でセッション・レートリミット管理 | 強整合性・カウンタが正確 | コスト増 / 実装複雑度高 / MVP 段階では過剰 | 不採用（将来再検討） |
| E: クライアント完結 JWT のみ | KV を一切使わない | インフラコスト最小 | ブラックリスト不可 / レートリミット不可 | 不採用（セキュリティ要件で却下） |

## PASS/MINOR/MAJOR 判定

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| 命名規約の完全性（AC-1 / AC-6） | PASS | outputs/phase-03/review-result.md に記録済み |
| wrangler.toml バインディング設計の完全性（AC-2） | PASS | outputs/phase-03/review-result.md に記録済み |
| KV ID 非掲載（CLAUDE.md / no-doc-for-secrets 準拠） | PASS | 実 Namespace ID 非掲載を確認済み |
| TTL 方針と無料枠の整合性（AC-4 / AC-5） | PASS | free-tier-policy.md で書き込み枠を確認済み |
| env 差異マトリクスの網羅性 | PASS | env-diff-matrix.md で整理済み |
| 「KV を使わない判断」分岐の存在（AC-7） | PASS | eventual-consistency-guideline.md に記録済み |
| rollback / 無料枠枯渇時退避方針の存在 | PASS | failure-cases.md と quality-report.md に記録済み |
| AC との整合（AC-1〜AC-7） | PASS | ac-matrix.md で全 AC PASS |

**判定凡例:**
- PASS: そのまま次 Phase に進める
- MINOR: 軽微な修正が必要だが Phase 5 実行前に解消可能
- MAJOR: 設計の根本的な見直しが必要（Phase 2 に差し戻し）
