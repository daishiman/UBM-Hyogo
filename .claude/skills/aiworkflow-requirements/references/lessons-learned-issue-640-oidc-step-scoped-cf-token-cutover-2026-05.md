# Lessons Learned: Issue #640 OIDC Step-Scoped Cloudflare Token Cutover

Issue #640 は GitHub Actions の Cloudflare deploy 経路で `CLOUDFLARE_API_TOKEN` を job-level / global env から **step-scoped env** に降格し、token 露出面を最小化する CI / governance task。完全 OIDC 移行は cycle 内で再検証できないため follow-up #640-001 に分離し、step-scoped token を当面の rollback path として温存する。

| ID | symptom | cause | recurrence condition | 5-minute resolution | evidence path |
| --- | --- | --- | --- | --- | --- |
| L-ISSUE640-001 | `Verify CF token is present` separate step が token を別 step に漏らす | token presence 検査を deploy 以外の step で行うと step-scope の意味が崩れる | check step を独立させ `env: CLOUDFLARE_API_TOKEN` を付与する | presence 検査は廃止し、deploy step 内の wrangler 失敗で early-exit させる | `.github/workflows/web-cd.yml`, `.github/workflows/ci.yml` |
| L-ISSUE640-002 | runtime log を grep して "漏洩なし" と誤断定する | GitHub Actions の secret masking で `***` 化されるので runtime log だけでは判定不能 | runtime log の `***` 確認のみで PASS する | `scripts/redaction-check.sh` を CI ローカル補助検査として走らせ source-level grep で確定させる | `scripts/redaction-check.sh`, `scripts/__tests__/redaction-check.test.sh` |
| L-ISSUE640-003 | Account ID を Variable / Secret のどちらに置くか論争で停滞する | `scripts/cf.sh` ローカル経路と GHA 経路で値ソースが二重化する | Account ID を `vars.` に移して 1Password と齟齬を起こす | `--account-id` 明示 flag で deploy step に直接渡し、ローカルと同じ flag 経路に揃える | `.github/workflows/web-cd.yml` |
| L-ISSUE640-004 | OIDC 完全移行を本 Issue に詰め込み scope 膨張する | Cloudflare 公式 OIDC support の再検証が cycle 内で閉じない | step-scoped と OIDC を同一 PR に混ぜる | follow-up `#640-001` に OIDC 移行を分離し、step-scoped token を rollback path として温存する | `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md` |
| L-ISSUE640-005 | workflow YAML 全体 grep だと job-level env を見逃す | `CLOUDFLARE_API_TOKEN` が `jobs.<job>.env` / global `env:` に逃げても全体 grep では PASS する | grep boundary を file 全体に広げる | `scripts/__tests__/workflow-env-scope.test.sh` で `jobs.<job>.steps[*].env` 単位の出現に限定して assert する | `scripts/__tests__/workflow-env-scope.test.sh` |
| L-ISSUE640-006 | env var 名を変更してローカル deploy が破綻する | `scripts/cf.sh` は 1Password `op://` から `CLOUDFLARE_API_TOKEN` を注入する前提 | GHA 側で `CF_API_TOKEN` などに rename する | env var 名は `CLOUDFLARE_API_TOKEN` で固定し、scope だけ step-level に絞る | `scripts/cf.sh`, `.env.example` |
| L-ISSUE640-007 | legacy token revocation を本 Issue で実施しそうになる | step-scoped cutover 直後は rollback 余地が必要 | 旧 token を即時 revoke する | `#640-002` に分離し、staging / production 両系列が 7 day green になってから revoke する | `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` |

## 5-minute Checklist

1. `CLOUDFLARE_API_TOKEN` は deploy step の `env:` にのみ存在し、job-level / global env に無いことを `workflow-env-scope.test.sh` で確認する。
2. `scripts/redaction-check.sh` を CI で走らせ、source-level に token 値リテラルが無いことを assert する。
3. Account ID は `--account-id` flag で渡し、Variable 化しない。
4. env var 名は `CLOUDFLARE_API_TOKEN` のまま保ち、`scripts/cf.sh` のローカル経路と整合を取る。
5. OIDC 完全移行 (#640-001) と legacy token revocation (#640-002) は本 Issue に含めず follow-up に分離する。
