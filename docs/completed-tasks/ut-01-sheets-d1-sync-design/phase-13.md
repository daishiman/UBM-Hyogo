# Phase 13: PR作成・完了処理

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成・完了処理 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新・正本同期) |
| 次 Phase | なし |
| 状態 | pending |

## 目的

PR 作成前の最終確認と PR 作成手順を定義する。
設計文書一式（outputs/phase-05/ 配下）と正本同期（outputs/phase-12/）が完了した状態で、feature ブランチから dev へ PR を作成し、タスクを完了させる。

> **重要**: この Phase はユーザーの明示承認がある場合のみ実行する。

## 実行タスク

- PR 作成前の最終チェックリスト確認
- 変更ファイル一覧の整理
- PR タイトル・本文の作成
- `gh pr create` コマンドによる PR 作成
- CI チェックの確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/system-spec-update-summary.md | 変更内容・変更ファイル一覧 |
| 必須 | outputs/phase-12/documentation-changelog.md | validator 結果・変更履歴 |
| 必須 | outputs/phase-10/final-review.md | AC 全 PASS 確認 |
| 必須 | artifacts.json | 全 Phase completed 確認 |

## 実行手順

### ステップ 0: ユーザー承認確認（必須）

- ユーザーが「Phase 13 を実行してください」等の明示的な承認を与えていることを確認する。
- 承認なしの場合は、この Phase を実行せず待機する。

### ステップ 1: PR 作成前の最終確認

- artifacts.json の全 Phase が `completed` になっていることを確認する。
- `outputs/phase-10/final-review.md` で GO 判定が出ていることを確認する。
- 変更ファイルが `docs/ut-01-sheets-d1-sync-design/` の範囲内に収まっていることを確認する。

### ステップ 2: 変更サマリーの整理

- `git diff --stat` で変更ファイル一覧を確認する。
- scope 外（他タスク・実装コード等）の変更が混入していないことを確認する。
- 変更サマリーを PR 本文用に整理する。

### ステップ 3: PR の作成

- ブランチが `feature/*` または `docs/*` であることを確認する。
- 以下の形式で PR を作成する:

```bash
gh pr create \
  --base dev \
  --title "docs(ut-01): Sheets→D1 同期アーキテクチャ設計文書の確定" \
  --body "$(cat <<'EOF'
## 概要

Google Sheets → Cloudflare D1 の同期アーキテクチャ設計文書を確定した。

## 変更内容

- 同期方式比較表（Push / Poll / Webhook / Trigger 比較）
- Mermaid 形式シーケンス図（正常系・異常系）
- sync_audit テーブルスキーマ定義
- リトライポリシー（quota 超過・部分失敗対応）
- 異常系エラーケース検証レポート
- AC-1〜AC-7 トレースマトリクス

## 関連タスク

- downstream: UT-09（Sheets→D1 同期実装）
- タスク種別: docs-only（コード実装なし）

## チェックリスト

- [ ] AC-1〜AC-7 全 PASS 確認済み
- [ ] artifacts.json 全 Phase completed
- [ ] scope 外変更なし
EOF
)"
```

### ステップ 4: CI チェックの確認

- PR 作成後、GitHub Actions の docs lint / link check が通ることを確認する。
- 失敗した場合は修正して再プッシュする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| なし | 本 Phase が最終 Phase |

## 多角的チェック観点（AIが判断）

- 価値性: PR によって設計文書が main / dev に取り込まれ、UT-09 が参照できる状態になるか。
- 実現性: 変更が docs-only の scope に収まっているか。
- 整合性: PR タイトル・本文が変更内容を正確に表現しているか。
- 運用性: レビュー担当者が PR だけで変更内容を理解できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認確認 | 13 | pending | 承認なしは実行しない |
| 2 | PR 作成前の最終確認 | 13 | pending | artifacts.json + final-review.md |
| 3 | 変更サマリーの整理 | 13 | pending | git diff --stat で確認 |
| 4 | PR の作成 | 13 | pending | gh pr create |
| 5 | CI チェックの確認 | 13 | pending | GitHub Actions |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR | GitHub Pull Request | タスクの成果物を dev へマージするための PR |
| メタ | artifacts.json | 全 Phase completed の最終記録 |

## 完了条件

- ユーザーの明示承認がある
- PR が作成されている
- CI チェックが通っている
- artifacts.json の全 Phase が `completed` になっている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- PR が作成済み
- CI チェック通過
- artifacts.json の该当 phase を completed に更新

## 次 Phase

- 次: なし（本 Phase が最終 Phase）
- 引き継ぎ事項: PR マージ後、UT-09 担当者に設計文書（outputs/phase-05/ 配下）の参照先を通知する。

## ユーザー承認確認文（冒頭必須）

この Phase はユーザーの明示承認がある場合のみ実行する。
承認なしの場合は以下のメッセージを出力して待機する:

> 「Phase 13（PR作成）を実行する準備が整いました。実行してよろしいですか？」

## 変更サマリー雛形

| 項目 | 内容 |
| --- | --- |
| 変更種別 | docs（設計文書追加） |
| 変更ファイル数 | （git diff --stat で確認） |
| downstream 影響 | UT-09 が参照する設計文書が確定する |
| residual risk | 実装フェーズで設計変更が必要になる可能性（低） |

## PR タイトル / 本文雛形

| 項目 | 内容 |
| --- | --- |
| title | `docs(ut-01): Sheets→D1 同期アーキテクチャ設計文書の確定` |
| base | `dev` |
| summary | 同期方式設計・シーケンス図・sync_audit スキーマ・リトライポリシー |

## close-out チェックリスト

- [ ] ユーザー承認あり
- [ ] artifacts.json 全 Phase completed
- [ ] AC-1〜AC-7 全 PASS（Phase 10 で確認済み）
- [ ] system-spec-update-summary.md が作成済み（Phase 12 で完了）
- [ ] CI チェック通過
- [ ] PR URL を記録済み
