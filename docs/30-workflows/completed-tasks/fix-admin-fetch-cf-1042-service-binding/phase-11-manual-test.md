# Phase 11: 手動テスト

## NON_VISUAL 宣言

本タスクは UI/UX 変更なし。エラーバナーが消えるだけのため Phase 11 スクリーンショットは不要。
代替証跡として `outputs/phase-11/main.md` を作成し、自動テスト件数 + user-gated staging runtime 確認計画を主ソースとする。

## 証跡の主ソース

| ソース | 内容 |
|--------|------|
| unit tests | `apps/web/src/lib/admin/__tests__/server-fetch.{binding,http-fallback,url,env}.spec.ts` local PASS |
| staging deploy log | `pending_user_gate`: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` の出力 |
| staging runtime smoke | `pending_user_gate`: `curl -i https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin -H 'Cookie: <session>'` の 200 確認、Network tab で 1042 が消えること |
| staging tail | `pending_user_gate`: `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` で `{ transport: "service-binding", scope: "admin", path: "/admin/dashboard", status: 200 }` log を確認 |

## 実施項目（user-gated）

1. staging deploy
2. ブラウザで `/admin` を開きエラーバナーが消えていることを確認
3. `/admin/members` `/admin/meetings` `/admin/schema` を spot-check（副次的に CF 1042 が解消していること）
4. tail で transport log が `service-binding` を出していること

## スクリーンショット不要理由

- 復旧前後の差分は「error banner の有無」のみで、binner UI 自体は既存スクリーンショット資産 (`admin-staging-visual` 系) と同じ
- visual baseline は親 workflow `admin-ui-prototype-alignment` で管理済み
