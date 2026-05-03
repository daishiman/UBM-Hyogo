# Unassigned Task Detection

> 本タスク完了後に残る未タスク / 別タスクへ送るべき項目。

## 検出した未タスク

### UT-MAGIC-LINK-DRY (候補)

- 内容: Magic Link provider 統合時の secrets DRY 適用
- 起点: 本タスク `outputs/phase-02/secrets-placement-matrix.md` を Magic Link 統合時に拡張
- 推奨 wave: Magic Link provider 統合タスク内
- 優先度: MEDIUM
- 起票: GitHub Issue 起票推奨

### UT-OAUTH-VERIFICATION-MONITOR (候補)

- 内容: OAuth verification 審査ステータスの監視自動化
- 起点: 本タスク Stage B で submitted → verified の遷移が手動確認のみ
- 推奨対応: Google API での自動 polling（無料枠で実装可能か要調査）
- 優先度: LOW
- 起票: 必要時のみ

### UT-PRIVACY-TERMS-CONTENT-AUDIT (候補)

- 内容: privacy / terms / home の内容が verification 申請要件を満たすか定期監査
- 起点: 本タスク Phase 6 Case #13（コンテンツ不足での却下リスク）
- 推奨対応: PR template に privacy/terms 変更時の AC 追加
- 優先度: LOW

### UT-AUTH-LOGOUT-UI (consumed / implemented-local-runtime-evidence-blocked)

- 内容: ログイン後の web UI にログアウトボタン / sign-out 導線を追加する
- 起点: Phase 11 staging smoke M-08 実行時に、Auth.js sign-out endpoint はあるがユーザー操作可能な logout UI が無いことを確認
- 影響: M-08「sign-out で session cookie 削除」を UI evidence 付きで PASS にできない。共有端末・管理画面利用後の session 終了操作が利用者に見えない
- 対応: `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` に移管し、member/profile/admin のログアウト UI を local 実装済み。Auth.js v5 `signOut({ redirectTo: "/login" })` を共通 component に集約した
- 残状態: M-08 PASS 化には Phase 11 runtime evidence（スクリーンショット、`/api/auth/session`、cookie deletion、保護 route redirect）が必要
- 優先度: HIGH
- 起票: `docs/30-workflows/unassigned-task/task-05a-auth-ui-logout-button-001.md`（consumed pointer）

## 検出した未タスク（記録のみ・新規 issue 不要）

- 05a Phase 11 の placeholder.png 削除 → 本タスク Phase 12 で実施するため不要
- B-03 状態の `13-mvp-auth.md` 反映 → 本タスク Phase 12 で実施

## Formalize 判定

本レビューでは `UT-AUTH-LOGOUT-UI` を `docs/30-workflows/unassigned-task/` ファイルとして formalize し、2026-05-03 に `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` へ consumed / implemented-local-runtime-evidence-blocked として移管した。

理由:

- `UT-MAGIC-LINK-DRY` は Magic Link provider 統合タスク内で扱うのが自然で、このタスク単体で切ると正本が二重化する。
- `UT-OAUTH-VERIFICATION-MONITOR` と `UT-PRIVACY-TERMS-CONTENT-AUDIT` は LOW であり、Phase 11 actual evidence 後に必要性を再判定する。
- `UT-AUTH-LOGOUT-UI` は Phase 11 M-08 の PASS 条件を直接ブロックし、ユーザー操作上も必要なため独立タスク化する。
- 05a follow-up 001 / 002 は本 workflow に `merged_into` 済みで、重複タスクを増やさない。

## 起票推奨タイミング

Phase 11 完了 → Phase 12 反映 → PR merge 後に GitHub Issue で起票（github-issue-manager skill 利用推奨）。
