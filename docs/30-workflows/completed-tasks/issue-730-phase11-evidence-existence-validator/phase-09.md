# Phase 9 — レビュー

## 1. セルフレビュー観点

| 観点 | チェック内容 |
| --- | --- |
| 責務 | parse / verify-existence / verify-compliance-file の 3 層分離が保たれているか |
| 後方互換 | 既存 `pass` / `fail-missing-file` / `fail-missing-heading` fixture の振る舞いが変化していないか |
| エラー詳細 | `details` が運用者に missing path を提示できているか（debug 容易性） |
| パフォーマンス | parser の正規表現 / loop が O(N)（行数）で完結しているか |
| セキュリティ | absolute path 拒否ロジックが path traversal を意図せず許さないか |
| lint / typecheck | 全ファイル green |
| skill 整合 | `references/phase-11-non-visual-alternative-evidence.md` の追記が canonical heading 構造と矛盾しないか |
| CI gate | `pull_request` トリガー復活など意図外の変更が含まれていないか |

## 2. 既存仕様との衝突確認

- `phase12-compliance-check-template.md` の `## Required Sections` 中の `4. Phase 11 evidence file inventory` heading 名と parser regex が一致
- `phase-template-phase12.md` / `phase-12-guide.md` が parser 期待 schema (3 列 + status 列) を案内している場合、表記との差異が無いことを Phase 12 で再確認

## 3. レビュー後の修正余地

- `status` 表記揺れを許可するか（例: `OK` / `Present`）→ 現状は `unknown` 扱い。運用要望が出たら別 PR で対応
- 表 4 列以上の場合の status 列位置を可変にするか → 現状は左から 3 列目固定。要望次第

## 4. レビュアー

solo 開発のため自己レビュー + CODEOWNERS (`@daishiman`) の最終承認。
