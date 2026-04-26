# Phase 07 — 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 名称 | 検証項目網羅性 |
| タスク | UT-03 Sheets API 認証方式設定 |
| 状態 | pending |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| GitHub Issue | #5 |

---

## 目的

受入条件（AC）全項目（AC-1〜AC-7）が、どの Phase の成果物によってカバーされているかを
トレーサビリティマトリクスとして整備する。
検証漏れ・成果物漏れがないことをこの Phase で保証し、
Phase 10（最終レビュー）での確認を効率化する。

---

## 実行タスク

### 7-1. 受入条件（AC）定義の再確認

以下の AC-1〜AC-7 が `index.md` または Issue #5 に定義されていることを確認する。

| AC | 内容 |
| --- | --- |
| AC-1 | Service Account 方式と他方式の比較評価表が作成されている |
| AC-2 | `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secrets に配置されている |
| AC-3 | `packages/integrations/src/sheets-auth.ts` の実装仕様が文書化されている |
| AC-4 | Sheets API v4 への疎通確認（sanity check）が完了している |
| AC-5 | `.dev.vars` が `.gitignore` に登録されていることが確認されている |
| AC-6 | Google Sheets への Service Account 共有手順が Runbook に記録されている |
| AC-7 | ローカル開発フロー（`.dev.vars` 設定から `wrangler dev` 起動まで）が文書化されている |

---

### 7-2. トレーサビリティマトリクスの作成

以下の対応表を `outputs/phase-07/ac-traceability-matrix.md` に記録する。

| AC | カバー Phase | 主成果物 | 検証方法 | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 2 | outputs/phase-02/auth-comparison.md | 比較評価表の存在と内容確認 | pending |
| AC-2 | Phase 5 | outputs/phase-05/setup-runbook.md | `wrangler secret list` で存在確認 | pending |
| AC-3 | Phase 5 | outputs/phase-05/sheets-auth-spec.md | 仕様書の全セクション確認 | pending |
| AC-4 | Phase 5 | outputs/phase-05/setup-runbook.md（sanity check セクション） | curl コマンド実行結果 | pending |
| AC-5 | Phase 4 | outputs/phase-04/pre-verify-checklist.md | `.gitignore` の grep 確認コマンド | pending |
| AC-6 | Phase 5 | outputs/phase-05/setup-runbook.md | Runbook の共有手順セクション確認 | pending |
| AC-7 | Phase 5 | outputs/phase-05/local-dev-guide.md | ローカルガイドの全手順確認 | pending |

---

### 7-3. カバレッジギャップ分析

各 AC のカバー状況を確認し、以下の観点でギャップを検出する。

#### 7-3-1. 成果物の存在確認

```bash
# Phase 2 の比較評価表
ls docs/01-infrastructure-setup/ut-03-sheets-api-auth/outputs/phase-02/auth-comparison.md

# Phase 4 の事前検証チェックリスト
ls docs/01-infrastructure-setup/ut-03-sheets-api-auth/outputs/phase-04/pre-verify-checklist.md

# Phase 5 の成果物
ls docs/01-infrastructure-setup/ut-03-sheets-api-auth/outputs/phase-05/setup-runbook.md
ls docs/01-infrastructure-setup/ut-03-sheets-api-auth/outputs/phase-05/sheets-auth-spec.md
ls docs/01-infrastructure-setup/ut-03-sheets-api-auth/outputs/phase-05/local-dev-guide.md
```

#### 7-3-2. 内容の充足性チェック観点

| AC | 充足性確認ポイント |
| --- | --- |
| AC-1 | 比較評価表に Service Account / OAuth 2.0 User / API Key 等の選択肢が記載されているか |
| AC-2 | Runbook に `wrangler secret put` コマンドが staging / production 両環境分記載されているか |
| AC-3 | 仕様書に JWT 生成・Web Crypto API 使用・TTL キャッシュの全セクションが含まれているか |
| AC-4 | Runbook に `curl` 疎通確認コマンドと期待レスポンス例が記載されているか |
| AC-5 | チェックリストに `.gitignore` 確認のコマンド例が含まれているか |
| AC-6 | Runbook に Sheets 共有手順（UI操作手順）が具体的に記載されているか |
| AC-7 | ローカルガイドに手順 1〜4（ファイル作成→内容記述→.gitignore確認→wrangler dev起動）が揃っているか |

---

### 7-4. 未カバー AC の対応方針

Phase 7 実行時点でカバーされていない AC が発見された場合、以下の対応を行う。

| 状況 | 対応 |
| --- | --- |
| 成果物が未作成 | 対応 Phase の担当者に差し戻し、または本 Phase で補完ドキュメントを作成 |
| 成果物はあるが内容が不十分 | 対応 Phase の outputs に追記し、このマトリクスに補完箇所を記録 |
| AC の定義が曖昧 | `index.md` の AC 定義を修正し、Phase 1（要件定義）の差分として記録 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | AC 定義の正本 |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-05.md | AC-2/3/4/6/7 の成果物 |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-06.md | 異常系カバレッジ |
| 参考 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | Phase 7 実施例（参考） |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-traceability-matrix.md | AC 全項目のトレーサビリティマトリクス |

---

## 完了条件

- [ ] AC-1〜AC-7 の全項目がマトリクスに記載されている
- [ ] 各 AC に「カバー Phase」「主成果物パス」「検証方法」が記載されている
- [ ] 成果物の存在確認コマンドが全て実行され、全ファイルが存在することが確認されている
- [ ] 充足性確認ポイントが全 AC で PASS となっている
- [ ] カバレッジギャップが存在しないこと、またはギャップがある場合は対応方針が記録されている
- [ ] `outputs/phase-07/ac-traceability-matrix.md` が作成されている

---

## 次 Phase

Phase 08 — 設定 DRY 化（認証モジュールの重複排除と再利用性向上計画の策定）に進む。

AC カバレッジが確認できたら、実装レベルでの DRY 化を検討し、
`packages/integrations/sheets-auth.ts` の共通利用設計を固める。
