# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-d1-sync-design |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | completed |

## 目的

Phase 2 で確定した Sheets → D1 同期設計を、4条件（価値性 / 実現性 / 整合性 / 運用性）でレビューし、下流 Phase（事前検証・実装）に引き渡せる品質水準かを判定する。MAJOR 判定があれば Phase 2 に差し戻す。

## 実行タスク

- Phase 2 の design.md / sync-flow.md を読み込む
- AC-1〜AC-7 が設計に反映されているかをトレースする
- 4条件（価値性 / 実現性 / 整合性 / 運用性）でレビューゲートを通す
- PASS / MINOR / MAJOR を判定し、MINOR は追跡表に記録する
- レビュー結果を outputs/phase-03/review.md に出力する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/design.md | レビュー対象: 同期方式採択・スキーマ・エラーハンドリング |
| 必須 | outputs/phase-02/sync-flow.md | レビュー対象: 手動/定期/バックフィル フロー図 |
| 必須 | outputs/phase-01/requirements.md | 要件・AC との整合確認 |
| 必須 | docs/completed-tasks/03-serial-data-source-and-storage-contract/index.md | ストレージ契約との整合確認 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: 設計成果物の読み込みと AC トレース

- outputs/phase-02/design.md と sync-flow.md を読み込む。
- AC-1〜AC-7 の各条件が設計に反映されているかをチェックする。

| AC | 確認内容 | 設計箇所 | 判定 |
| --- | --- | --- | --- |
| AC-1 | 同期方式比較表と Cron Triggers 採択根拠 | design.md § 同期方式比較 | TBD |
| AC-2 | 手動/定期/バックフィルの3種フロー図 | sync-flow.md | TBD |
| AC-3 | エラーハンドリング（リトライ/冪等性/部分失敗） | design.md § エラーハンドリング | TBD |
| AC-4 | sync_audit テーブル論理スキーマ | design.md § sync_audit スキーマ | TBD |
| AC-5 | source-of-truth 優先順位（D1 canonical） | design.md § source-of-truth | TBD |
| AC-6 | Sheets API quota 対処方針（バッチ/Backoff） | design.md § quota 対処 | TBD |
| AC-7 | UT-09 が実装着手できる状態か | design.md 全体の読解可能性 | TBD |

### ステップ 2: 4条件レビューゲート

| 条件 | レビュー問い | 判定 |
| --- | --- | --- |
| 価値性 | Cron Triggers 採択により管理者の手動作業コストが定量的に下がる設計か | TBD |
| 実現性 | Cloudflare 無料枠・Sheets API 無料枠の範囲で設計が完結しているか | TBD |
| 整合性 | D1 canonical / Sheets input の source-of-truth が CLAUDE.md 不変条件と矛盾しないか | TBD |
| 運用性 | sync_audit によって部分失敗リカバリ・バックフィル・監査証跡が手順化されているか | TBD |

### ステップ 3: PASS / MINOR / MAJOR 判定と差し戻し

- PASS: 全 AC が充足され、4条件すべて問題なし → Phase 4 に進む。
- MINOR: 表現の揺れ・軽微な記述漏れ → 追跡表に記録し Phase 8 / 12 で吸収。
- MAJOR: 設計の根幹に問題あり（例: 冪等性未設計・AC 未充足）→ Phase 2 に差し戻す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 本 Phase の PASS 判定を事前検証手順の前提として使用 |
| Phase 7 | AC トレース結果を網羅性検証に使用 |
| Phase 10 | gate 判定の設計レビュー根拠として使用 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 同期設計が管理者・開発者・UT-09 実装者の誰のコストを下げるか明確か。
- 実現性: 設計に無料枠を超える前提が紛れ込んでいないか。
- 整合性: D1 canonical の原則が設計全体を貫いているか。sync_audit が source-of-truth を侵食していないか。
- 運用性: 同期失敗時のリカバリ手順が設計から読み取れるか。バックフィルが冪等に再実行できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 2 成果物の読み込み | 3 | completed | design.md / sync-flow.md |
| 2 | AC-1〜AC-7 トレース | 3 | completed | 全条件チェック |
| 3 | 4条件レビューゲート | 3 | completed | PASS / MINOR / MAJOR 判定 |
| 4 | MINOR 追跡表の記録 | 3 | completed | MINOR がある場合のみ |
| 5 | review.md の作成 | 3 | completed | outputs/phase-03/review.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/review.md | 4条件レビュー結果・AC トレース・PASS/MINOR/MAJOR 判定 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- outputs/phase-03/review.md が作成済みである
- AC-1〜AC-7 の全条件がトレースされている
- 4条件の判定（PASS / MINOR / MAJOR）が記録されている
- MAJOR がない（または Phase 2 差し戻しが完了している）
- MINOR は追跡表に記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（MAJOR 判定による差し戻し）の手順が明確
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: outputs/phase-03/review.md の判定結果と MINOR 追跡表を Phase 4 以降に引き継ぐ。
- ブロック条件: MAJOR 判定が未解消の場合は Phase 4 に進まない。

## レビューチェックリスト（4条件詳細）

| 観点 | レビュー問い | 判定 |
| --- | --- | --- |
| 価値性 | Cron Triggers 採択により管理者の手動同期コストが削減されるか | TBD |
| 価値性 | sync_audit により障害対応コストが削減されるか | TBD |
| 実現性 | Cloudflare Workers 無料枠で Cron Triggers が利用可能か | TBD |
| 実現性 | Sheets API 500req/100s 内でバッチ設計が収まるか | TBD |
| 整合性 | D1 canonical の原則が sync_audit 設計に反映されているか | TBD |
| 整合性 | 冪等性（行ハッシュ）が UPSERT 設計と整合しているか | TBD |
| 運用性 | sync_audit の last_offset から部分失敗後の再開が可能か | TBD |
| 運用性 | バックフィルが冪等に再実行できるか | TBD |

## より単純な代替案（却下理由の確認）

| 代替案 | 内容 | 却下理由 |
| --- | --- | --- |
| 代替案A | Sheets を canonical store のまま使い続ける | D1 へのアクセス制御・クエリ性能が担保できない |
| 代替案B | webhook（Sheets 変更通知）で即時同期 | Workspace 設定依存・実装コスト高・冪等性設計が複雑 |
| 代替案C | GAS で push 同期 | GAS 依存・無料枠制約・デプロイ管理が別系統になる |

## PASS / MINOR / MAJOR 判定基準

| 判定 | ルール |
| --- | --- |
| PASS | 全 AC が充足され、下流 blocker を残さない |
| MINOR | wording / naming の揺れ、軽微な記述漏れ（同 wave 内で吸収可能） |
| MAJOR | AC 未充足・冪等性未設計・source-of-truth 矛盾 → Phase 2 差し戻し |

## MINOR 追跡表

| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | （記録なし） | — |
