# Phase 11: 手動テスト

## 目的

3層評価（Semantic / Visual / AI UX）と runtime 確証手順を記録する。本タスクは NON_VISUAL（CI/runtime gate）のため Visual 層は N/A。

## visualEvidence: NON_VISUAL

UI/UX 表示物の変更なし（CI gate / smoke runner / mint helper の追加）。Phase 11 スクリーンショットは不要。
代替証跡として本 Phase の runtime 確証手順と `manual-test-result.md` を参照する。

## 3層評価

| 層 | 適用 | 内容 |
| -- | ---- | ---- |
| Semantic | ✅ | runner の reason 分類が意味的に正しい（auth-token-invalid / auth-not-admin / server-components-render-error） |
| Visual | N/A | UI 変更なし |
| AI UX | ✅ | gate 失敗時の Slack summary / artifact が運用者に十分な復旧情報を与えるか |

## runtime 確証手順（Gate-B / user-gated）

> 以下は user 明示承認後に実行する。本プロンプトでは実行しない。

1. 実装 wave 完了後、`dev` へ push → web-cd `deploy-staging` 実行。
2. `admin-runtime-smoke` job（`needs: deploy-staging`）が発火。
3. mint step が短命 session cookie を発行（600s TTL）。
4. `runtime-admin-web.sh staging` が `cf.sh tail` を開始してから `/admin` を GET し HTTP 200 を確認。
5. `/admin` probe 中の Workers log を capture し、`error.boundary.caught`/digest=167275886 が無いことを確認。
6. `ci-evidence/summary.json` / `runtime-smoke.log` が artifact upload され、redaction grep gate を通過。

### local 手動確認（staging secret を持つ環境）

```bash
# session cookie を mint（値は表示しない）
export STAGING_AUTH_SECRET="op://..."   # scripts/with-env.sh 経由が前提
export STAGING_ADMIN_MEMBER_ID="..."
export STAGING_ADMIN_EMAIL="..."
mint_out="$(mktemp)"; GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-session-cookie.mts
export STAGING_ADMIN_SESSION_COOKIE="$(grep '^admin_session_cookie=' "$mint_out" | cut -d= -f2-)"; rm -f "$mint_out"
export STAGING_WEB_BASE="https://ubm-hyogo-web-staging.daishimanju.workers.dev"
bash scripts/smoke/runtime-admin-web.sh staging --out-dir /tmp/admin-smoke --ci-summary
cat /tmp/admin-smoke/summary.json   # status=PASS を確認（cookie 値は redact 済み）
```

## Phase 11 で発見した HIGH 問題のフィードバックループ

現時点で HIGH 問題なし（spec 段階）。実装/実走 wave で発見された scope 外問題は `unassigned-task/` へ自動生成する。

## 完了判定

- [x] runtime 確証手順を記録（実行は user-gated = Gate-B）
- [x] NON_VISUAL を明記、screenshot 不要を宣言
- [x] manual-test-result.md を evidence として配置
