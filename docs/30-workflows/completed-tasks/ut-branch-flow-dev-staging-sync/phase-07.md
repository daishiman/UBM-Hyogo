# Phase 7: エラーハンドリング・リスク

## 主要リスク

| ID | リスク | 影響 | 対策 |
|----|--------|------|------|
| R-01 | dev force-push 中に他 push が割り込む | dev 内容上書き | solo dev・短時間ウィンドウ・force-push 直前に最新 fetch |
| R-02 | branch protection 緩和したまま忘れる | 任意 force-push が通る | force-push 直後に必ず restore PUT を実行（本タスクで実施済） |
| R-03 | dev の独自 4 commit に本来必要な内容が残っている | 機能損失 | 4 commits は `#37`, `UT-23/UT-24`, 古い CI 設定で全て main で上書き済と確認 |
| R-04 | `scripts/new-worktree.sh` 利用者がメイン CLI 起動するとファイル混入 | PR汚染 | CLAUDE.md / スクリプト末尾に既に警告あり |
| R-05 | dev → staging deploy 失敗（secrets 不備等） | staging不稼働 | 既存 CD は維持。失敗時は `gh run view` で原因確認 |
| R-06 | 既存の open PR が `--base main` のまま残る | 旧フローが温存 | open PR は別タスクで base 切替（本タスク非該当） |

## ロールバック手順

dev 同期に問題が起きた場合:

```bash
# 旧 dev HEAD を復元（force-push 履歴から）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input - <<< '{"required_status_checks":{"strict":false,"contexts":["ci","Validate Build"]},"enforce_admins":false,"required_pull_request_reviews":null,"restrictions":null,"required_linear_history":false,"allow_force_pushes":true,"allow_deletions":false,"required_conversation_resolution":true}' -X PUT
git push origin c23043fb:refs/heads/dev --force  # 旧 dev HEAD
# その後 protection を allow_force_pushes=false に戻す
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

branch flow 切替のリスクと rollback を定義する。

## 実行タスク

リスク、対策、rollback command を記録する。

## 参照資料

GitHub branch protection current applied evidence。

## 成果物

risk table と rollback 手順。

## 完了条件

force-push window と restore 境界が明確である。

## 統合テスト連携

Phase 11 の manual smoke log に接続する。
