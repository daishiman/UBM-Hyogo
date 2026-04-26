# Phase 8: 文書DRY化・整合性整理

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 文書DRY化・整合性整理 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (検証項目網羅性確認) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

重複記述・不整合を排除し、設計文書を整理する。
Phase 5〜7 の作業を通じて明らかになった文書間の重複・矛盾・表記ゆれを解消し、一貫性のある設計文書一式に仕上げる。

## 実行タスク

- 設計文書間の重複記述の特定と整理
- 用語・表記の統一（例: 「同期ジョブ」vs「sync job」等）
- Phase 7 で特定された未カバー AC への設計文書補足
- フロー図と文章記述の整合性確認
- sync_audit スキーマと sequence-diagrams.md の整合性確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-trace-matrix.md | 未カバー AC と対処方針 |
| 必須 | outputs/phase-05/sync-method-comparison.md | 重複・不整合確認 |
| 必須 | outputs/phase-05/sequence-diagrams.md | 重複・不整合確認 |
| 必須 | outputs/phase-05/sync-audit-contract.md | 重複・不整合確認 |
| 必須 | outputs/phase-05/retry-policy.md | 重複・不整合確認 |
| 必須 | outputs/phase-06/error-case-verification.md | 修正箇所の参照 |

## 実行手順

### ステップ 1: 重複記述の特定

- Phase 5 の 4 文書（比較表・シーケンス図・スキーマ・リトライポリシー）を横断して重複する記述を特定する。
- 重複箇所を refactoring-report.md にリストアップする。

### ステップ 2: 用語・表記の統一

- 「Google Sheets」「Sheets」「スプレッドシート」等の表記ゆれを確認し、統一表記を決定する。
- 「D1」「Cloudflare D1」等も同様に統一する。
- 統一後の表記を refactoring-report.md に記録する。

### ステップ 3: 未カバー AC への補足

- Phase 7 の ac-trace-matrix.md で「未カバー」とされた AC に対して、対応する設計文書の補足を行う。
- 補足内容と対象ファイル名を refactoring-report.md に記録する。

### ステップ 4: 整合性の最終確認と handoff

- sync_audit スキーマのカラム定義と sequence-diagrams.md のフロー図が一致しているか確認する。
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase（品質保証）に渡す open question を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 本 Phase の整理結果を品質保証の入力として使用 |
| Phase 10 | gate 判定の根拠（整合性確認済みの文書一式） |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 整理後の設計文書が UT-09 担当者にとって読みやすくなっているか。
- 実現性: 文書補足が既存設計の範囲内で完結しているか（新たな設計追加は最小限）。
- 整合性: 用語統一・重複排除後も設計の意図が保たれているか。
- 運用性: 整理後の文書一式が Phase 9 の品質チェックに耐えられる状態か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複記述の特定 | 8 | completed | 4 文書を横断確認 |
| 2 | 用語・表記の統一 | 8 | completed | 統一表記を決定 |
| 3 | 未カバー AC への補足 | 8 | completed | ac-trace-matrix.md を参照 |
| 4 | 整合性の最終確認 | 8 | completed | outputs/phase-08/refactoring-report.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactoring-report.md | 文書DRY化・整合性整理レポート |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- `outputs/phase-08/refactoring-report.md` が作成済み
- 重複記述・表記ゆれの整理結果が記録されている
- Phase 7 で未カバーだった AC への補足内容が記録されている
- Phase 9 への handoff 事項が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 文書間の不整合が解消されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 整理後の設計文書一式（outputs/phase-05/ 配下）と refactoring-report.md を Phase 9 の品質チェックの入力として使用する。
- ブロック条件: `refactoring-report.md` が未作成なら次 Phase に進まない。

## DRY 化チェックリスト

| チェック項目 | 対象ファイル | 状態 |
| --- | --- | --- |
| 重複するフロー説明がある | sequence-diagrams.md / sync-method-comparison.md | completed |
| 用語「Sheets」の統一 | 全 Phase 5 成果物 | completed |
| 用語「D1」の統一 | 全 Phase 5 成果物 | completed |
| sync_audit カラムの不整合 | sync-audit-contract.md / sequence-diagrams.md | completed |
| リトライ回数の記述不一致 | retry-policy.md / sequence-diagrams.md | completed |
