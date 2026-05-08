# Phase 10: セキュリティ・運用ガード

## セキュリティ考慮

- branch protection を緩和する API 呼び出しは admin token を要する。`gh` の OAuth 経由トークン or `CLOUDFLARE_API_TOKEN` 等とは無関係。
- force-push 許可は最短ウィンドウのみ（同期 push 直前 → 直後復元）。本タスクでは復元済を確認済（`allow_force_pushes:false`）。
- `.env` / 1Password シークレットには触れない（CONST_002）。

## 運用ガード

| 項目 | 仕組み |
|------|-------|
| dev への直接 push 防止 | branch protection（`required_status_checks`） |
| main への直接 push 防止 | 同上 + `required_conversation_resolution` |
| force-push 不可 | `allow_force_pushes=false`（運用時） |
| 削除不可 | `allow_deletions=false` |
| solo dev レビュー数 | `required_pull_request_reviews=null` |

## 監査ログ

- force-push 実施記録: `git push origin origin/main:refs/heads/dev --force` の output（`+ c23043fb...b91bcc35 origin/main -> dev (forced update)`）
- protection 緩和→復元の API 応答ログは GitHub audit log で参照可

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

security / operation guard を明確化する。

## 実行タスク

branch protection、secret boundary、audit log を整理する。

## 参照資料

`references/deployment-branch-strategy.md`。

## 成果物

security consideration と operation guard。

## 完了条件

force-push と secret boundary が明確である。

## 統合テスト連携

Phase 11 manual smoke log と protection check に接続する。
