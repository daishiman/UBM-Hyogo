# Phase 11 Main

workflow_state は `implemented_local_runtime_pending`。staging 復旧検証（RT-A〜RT-E）の**手順定義のみ**完了し、実施はすべて user-gated。本 WF の T01〜T04 は NON_VISUAL（API ログ / CI/CD / 診断 script / web transport ログ層のみで `/profile` UI 描画不変）。

## 証跡サマリ

- **証跡の主ソース = 自動テスト + staging probe**:
  - 実装ローカル一次証跡: T01（`error-handler.spec.ts`）/ T03（`safe-fetch.spec.ts`）の focused vitest、T04（`bash -n diagnose-profile-session.sh`）、T02（api-cd.yml YAML 構文）。本 wave で実行済み。
  - staging 復旧証跡: 拡張 `diagnose-profile-session.sh` stdout（route 存在差分 + deploy parity）+ minted-cookie 認証 `GET {API}/me` 200 + api-cd smoke gate（`/me/healthz` 200）。
- **screenshot = `implemented_local_runtime_pending` のため pending**:
  - 現象 screenshot: ユーザー提供済み（2026-06-13 10:38 JST・`MEMBER_SESSION_404`「セッション情報を取得できませんでした」・文中参照・リポジトリ非配置）。
  - 復旧後 staging runtime screenshot（`profile-me-404-recovery-staging.png`）: pending（user-gated・認証必須・未取得）。
  - 理由: 本 WF はコード変更が UI 描画を変えない NON_VISUAL であり、復旧の最終証跡（VISUAL_ON_EXECUTION）は staging 認証ログイン後にのみ取得可能。`implemented_local_runtime_pending` ではlocal実装は完了済みだが deploy は未実施のため screenshot は計画のみ。
- staging deploy / diagnose probe / minted-cookie 認証 `/me` / `/profile` 正常描画確認: すべて pending（user-gated）。
- secret/cookie/JWT/memberId: 全 Phase 11 成果物に非記載（AC-9）。
