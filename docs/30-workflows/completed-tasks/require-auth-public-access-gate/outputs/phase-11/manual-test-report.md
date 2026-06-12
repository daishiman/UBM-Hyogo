# Phase 11 手動テストレポート（VISUAL・サマリー）

| 項目 | 値 |
|------|-----|
| taskId | require-auth-public-access-gate |
| mode | VISUAL |
| 実施状態 | local evidence captured / runtime screenshot pending（user-gated） |
| 評価対象 | C1 案内画面（`LoginRequiredNotice`）/ C2 API ゲート（401・内部認証 200） |

## 3 層評価（ローカル確認済み / runtime screenshot pending）

| 層 | 観点 | 判定 |
|----|------|------|
| Semantic | 「ログインが必要です」の意図・CTA の遷移先が明確か | PASS（component/layout spec） |
| Visual | OKLch トークン整合・既存 primitive との一貫性・レイアウト崩れ無し | local PASS / staging screenshot pending |
| AI UX | 未認証ユーザーがログイン導線に迷わず到達できるか | PASS（copy + CTA href spec） |

詳細手順と AC 紐付けは [manual-test-result.md](manual-test-result.md) を正本とする。
