# Phase 11: 手動 smoke / 実測 evidence — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 11 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |
| execution_allowed | false until explicit_user_instruction |

## 目的

`apps/web` `fetchPublic` の service-binding 化を staging → production の順で実 deploy し、
`/` `/members` が 200 を返すこと、`wrangler tail` に `transport: 'service-binding'` ログが
出ること、local `pnpm dev` の HTTP fallback に regression がないことを実測 evidence で
確定する。**実行は user 明示指示後**。

## 実行タスク（実行は user 明示指示後）

1. `bash scripts/cf.sh whoami` で Cloudflare 認証状態を確認（実値は出さない）
2. `mise exec -- pnpm typecheck` と `mise exec -- pnpm --filter web build:cloudflare` を再実行
3. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` で staging deploy
4. staging curl: `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/`
   と `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/members` を実行し log 保存
5. `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` を 30 分相当
   または `transport: 'service-binding'` ログを **十分なリクエスト件数で複数回** 確認できるまで取得
6. **user 明示指示後のみ** production deploy:
   `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`
7. production curl で `/` `/members` を確認し log 保存
8. local `pnpm dev` を起動し、`PUBLIC_API_BASE_URL` 経由 HTTP fetch fallback が動作することを確認
9. evidence を `outputs/phase-11/` に集約し redaction checklist を完了
10. `artifacts.json` parity を更新し、Issue #387 (CLOSED) は CLOSED のまま維持

## 参照資料

- `docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md`
- `apps/web/src/lib/fetch/public.ts`
- `apps/web/src/lib/auth.ts`（service-binding pattern 参照）
- `apps/web/wrangler.toml`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-003`

## 統合テスト連携

- staging curl 200 / production curl 200 / wrangler tail `transport: 'service-binding'` の
  3 つを揃えて初めて AC-3 / AC-4 / AC-5 を PASS にする
- HTTP fallback regression は local `pnpm dev` log で AC-6 として独立に判定する
- PASS / FAIL 結果は Phase 7 AC matrix と Phase 12 system spec 更新に接続する

## 必須 evidence path（VISUAL_ON_EXECUTION）

| path | 内容 | 関連 AC |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 実行サマリ | 全体 |
| `outputs/phase-11/code-diff-summary.md` | `apps/web/src/lib/fetch/public.ts` と `apps/web/wrangler.toml` の差分要約 | AC-1 / AC-2 |
| `outputs/phase-11/staging-curl.log` | staging `/` `/members` の HTTP code 記録 | AC-3 |
| `outputs/phase-11/production-curl.log` | production `/` `/members` の HTTP code 記録 | AC-4 |
| `outputs/phase-11/wrangler-tail-staging.log` | redacted tail log（`transport: 'service-binding'` 行を含む） | AC-5 |
| `outputs/phase-11/local-dev-fallback.log` | local `pnpm dev` の HTTP fallback ログ | AC-6 |
| `outputs/phase-11/redaction-checklist.md` | PII / secret redaction 確認結果 | 全体 |

`redaction-checklist.md` が PASS でない場合、AC-3 / AC-4 / AC-5 は PASS にしない。

## 多角的チェック観点

- placeholder（`<staging>` など）のままで PASS にしない
- secret 値（API token / cookie / OAuth token）を artifact / log に保存しない
- 取得不能ケース（認証失敗・deploy 不可等）は「実行不能」として log 冒頭に理由を明記し、
  AC ごとに `BLOCKED` で記録する
- `transport: 'service-binding'` ログが 1 件だけだと flaky 判定にする — 複数件の確認
- production deploy は user 明示指示が無い限り絶対に行わない

## サブタスク管理

- [ ] user から実 staging 実行の明示指示を得る
- [ ] `bash scripts/cf.sh whoami` で認証確認
- [ ] staging deploy → curl → tail の順で実行
- [ ] user 明示指示後に production deploy → curl
- [ ] local `pnpm dev` で HTTP fallback 確認
- [ ] redaction checklist を完了
- [ ] `artifacts.json` を更新
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- 上記「必須 evidence path」一式

## 完了条件

- AC-1〜AC-6 がそれぞれ PASS / FAIL / BLOCKED いずれかで判定済み
- `outputs/phase-11/` に 7 ファイルが揃っている
- redaction-checklist が PASS
- `artifacts.json` parity が PASS

## タスク100%実行確認

- [ ] PII / secret 漏洩がゼロ
- [ ] AC ごとに evidence path が実在
- [ ] staging / production 両方の curl 結果が記録されている
- [ ] `transport: 'service-binding'` ログが複数件確認できている

## 次 Phase への引き渡し

Phase 12 へ、実測 evidence と system spec 更新差分の元データを渡す。
