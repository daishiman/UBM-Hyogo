# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (設計文書作成実行) |
| 状態 | completed |

## 目的

Phase 2-3 の設計文書の内容を事前検証し、設計の妥当性を確認する。
上流依存タスクの完了確認・設計文書のレビュー・フロー図の整合性検証を行い、Phase 5 以降の設計文書作成が迷いなく着手できる状態にする。

## 実行タスク

- 上流依存タスク（Phase 1〜3）の完了確認
- Phase 2 設計文書の内容レビュー
- sync-flow.md のフロー整合性検証
- source-of-truth 定義の明確性確認
- sync_audit スキーマ草案の前提確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | 要件定義の正本 |
| 必須 | outputs/phase-02/design.md | 同期方式設計 |
| 必須 | outputs/phase-02/sync-flow.md | 同期フロー定義 |
| 必須 | outputs/phase-03/review.md | 設計レビュー結果 |
| 参考 | docs/ut-01-sheets-d1-sync-design/index.md | タスク概要 |

## 実行手順

### ステップ 1: 上流 Phase の完了確認

- Phase 1〜3 の成果物が outputs/ に存在することを確認する。
- index.md の受入条件（AC-1〜AC-7）を読み、設計文書でカバーされているか俯瞰する。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: 設計文書の内容レビュー

- `outputs/phase-02/design.md` の同期方式（Push/Poll/Webhook 等）の比較が論理的か確認する。
- `outputs/phase-02/sync-flow.md` のフロー図（Mermaid 形式）が実際の Google Sheets → D1 の流れを正確に表現しているか確認する。
- source-of-truth（通常運用は D1 canonical、復旧/backfill 入力は Sheets）の役割分離が明示されているか確認する。

### ステップ 3: 整合性の検証と handoff の確認

- sync_audit 運用草案の前提（trigger / status / 件数 / error_reason / diff_summary_json、冪等キー response_id）が Phase 5 で具体化できる粒度か確認する。
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の検証結果を入力として設計文書を具体化 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 同期アーキテクチャ設計が UT-09 実装担当者の手戻りを減らすか明確か。
- 実現性: Cloudflare D1 無料枠・Google Sheets API quota の範囲で設計が成立するか。
- 整合性: source-of-truth / sync_audit / エラーハンドリング方針が矛盾なく連携しているか。
- 運用性: リトライ・冪等性・ロールバックが設計文書から読み取れるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 Phase 完了確認 | 4 | completed | Phase 1〜3 の outputs を読む |
| 2 | 設計文書内容レビュー | 4 | completed | design.md / sync-flow.md |
| 3 | 整合性検証と handoff 確認 | 4 | completed | outputs/phase-04/pre-verification.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/pre-verification.md | 事前検証結果レポート |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- `outputs/phase-04/pre-verification.md` が作成済み
- Phase 1〜3 の成果物の存在確認が記録されている
- フロー図の整合性検証結果が記録されている
- Phase 5 への handoff 事項が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 設計上の矛盾・曖昧表現が洗い出されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (設計文書作成実行)
- 引き継ぎ事項: 事前検証で確認した設計の妥当性と残 open question を Phase 5 で反映する。
- ブロック条件: 本 Phase の主成果物（pre-verification.md）が未作成なら次 Phase に進まない。

## 検証コマンド一覧

| コマンド | 目的 | 期待 |
| --- | --- | --- |
| `ls outputs/phase-01/ outputs/phase-02/ outputs/phase-03/` | 上流成果物の存在確認 | 各 md ファイルが存在する |
| `rg -n "source-of-truth\|sync_audit\|冪等" outputs/phase-02/` | 設計文書の主要語確認 | 必要箇所が見つかる |
| `rg -n "AC-[0-9]" outputs/phase-01/requirements.md` | 受入条件の確認 | AC-1〜AC-7 が列挙される |

## 期待出力表

| 検証 | PASS 条件 |
| --- | --- |
| 上流成果物確認 | Phase 1〜3 の outputs が揃っている |
| フロー整合性 | sync-flow.md の Mermaid 図が矛盾なく読める |
| AC カバレッジ | 設計文書が AC-1〜AC-7 を俯瞰でカバーしている |

## verify suite (手動)

- 手動: index.md と phase-04 の完了条件が整合しているか確認
- 手動: source-of-truth（Google Sheets）の定義が設計文書で一貫しているか確認
- 手動: sync_audit スキーマ草案が Phase 5 で詳細化できる粒度かを確認
