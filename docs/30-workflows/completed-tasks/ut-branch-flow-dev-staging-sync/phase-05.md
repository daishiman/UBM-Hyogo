# Phase 5: データモデル

本タスクは永続データを変更しないが、運用上の「状態」を以下に定義する。

## 同期状態

| エンティティ | 確認方法 | 期待値 |
|-------------|---------|-------|
| `origin/main` HEAD | `git rev-parse origin/main` | (任意の最新 SHA) |
| `origin/dev` HEAD | `git rev-parse origin/dev` | `origin/main` HEAD と一致 |
| ahead/behind | `git rev-list --left-right --count origin/main...origin/dev` | `0\t0` |

## Branch Protection 状態

| ブランチ | `allow_force_pushes` | `required_status_checks.contexts` | `required_pull_request_reviews` | `required_conversation_resolution` |
|---------|---------------------|------------------------------------|----------------------------------|------------------------------------|
| `dev` | false（運用時） | `[ci, Validate Build]` | null | true |
| `main` | false | `[ci, Validate Build]` (strict=true) | null | true |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

branch state と protection state を仕様化する。

## 実行タスク

同期状態と保護状態を表に固定する。

## 参照資料

`references/deployment-branch-strategy.md`。

## 成果物

状態テーブル。

## 完了条件

dev/main の current state 判定方法が明記されている。

## 統合テスト連携

Phase 11 の remote sync check に接続する。
