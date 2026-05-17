# Lessons Learned: runtime-smoke-staging-secrets 実プロビジョニング（2026-05-16）

`docs/30-workflows/runtime-smoke-staging-secrets-restore/` の Phase 13 で staging-runtime-smoke GitHub Environment へ 5 secret を実投入した際の苦戦箇所を集約する。`lessons-learned-ci-env-secret-inventory-and-preflight-gate-2026-05.md`（L-CI-ENV-001..005 / contract 層）の **runtime 投入層** 対応 lesson として補完する。

## L-PRS779-001: helper script の op:// path が二箇所に分散していた

`scripts/smoke/provision-staging-secrets.sh` は SECRETS[] 配列の op://path（5 件）と `verify_staging_marker()` 内の hardcoded ref（1 件）を持つ。vault 構造が `Cloudflare/...` から `Employee/ubm-hyogo-env/...` に変わった際、SECRETS[] 修正だけでは marker 検証が古い path を引いて `Cloudflare isn't a vault` で fail した。

**Why:** marker 検証関数が provision loop から独立しているため、path 定数が DRY 化されておらず両方を同時更新する必要がある。

**How to apply:** helper script 修正時は `grep "op://" scripts/smoke/provision-*.sh` で全 ref を列挙してから編集する。将来の根治には SECRETS[0] を marker 検証元として再利用する単一参照化を検討する。

## L-PRS779-002: `op item edit` / `op item get --format json` の stdout 出力で secret 値が leak しうる

1Password CLI で field を追加する際、`op item edit <ITEM> <FIELD>=<VALUE>` は更新後 item を JSON で stdout に echo する。コンソールスクロール経由で AI コンテキストや shell history に値が混入する。

**Why:** op CLI は machine-readable な事後状態 dump を返す設計で、value redaction オプションがない。

**How to apply:** 全ての op mutation コマンドは `>/dev/null 2>&1` で必ず suppress する。誤って出力した場合は当該 field を **必ずローテーション**する（item edit / generate password / 再投入）。CLAUDE.md §シークレット管理「API Token 値・OAuth トークン値を出力やドキュメントに転記しない」と同等の慣性事故防止規律として扱う。

## L-PRS779-003: staging D1 fixture の `member_status.rules_consent='unknown'` で member login が gate_state=rules_declined に落ちる

CI smoke fixture member (`manju.manju.03.28@gmail.com`, member_id=`3386dea2-...`) は `member_status.rules_consent='unknown'` で D1 に投入されており、Auth.js cookie 認証成功後の `resolveGateState` で `unregistered → deleted → rules_declined → ok` 順序の **rules_declined** に判定され `/login?gate=rules_declined` に redirect された。Bearer 取得経路が成立しないため STAGING_ME_BEARER の発行が阻害される。

**Why:** Google Form 再回答（本人更新の正式経路）を経ていない smoke fixture は rules_consent が初期値 `unknown` のままになる。`resolveGateState` は 'consented' 以外を全て decline 扱いする仕様。

**How to apply:** smoke fixture 投入時は D1 `member_status` に `rules_consent='consented', public_consent='consented', is_deleted=0` を明示 UPDATE する。`apps/api` 経由ではなく `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --config apps/api/wrangler.toml --remote --command "..."` で直接更新する（fixture は Google Form 経路の対象外）。

## L-PRS779-004: Auth.js JWT 24h expire と CI smoke の long-lived 認証戦略は別タスク

STAGING_ME_BEARER / STAGING_ADMIN_BEARER は DevTools Application > Cookies の `__Secure-authjs.session-token` から抽出した JWT を環境 secret に投入したが、`exp` claim が **24 時間**で expire する。CI smoke は cron / schedule 起動のため 25h 後の run で 401 になる。

**Why:** Auth.js v5 GoogleProvider の session strategy は jwt + maxAge 24h が既定で、`/api/auth/session` の refresh は browser cookie 経由でしか起きない。CI bearer を更新する自動経路がない。

**How to apply:** 短期は週次 manual rotation 運用とし `incident-2026-05-16.md` runbook に rotation 手順を明記する。長期は smoke runner 用の service-token endpoint（短命 + repository secret） or `apps/api` 専用 long-lived JWT 発行 endpoint を `docs/30-workflows/runtime-smoke-env-provisioning/` の別タスクで設計する（既に spec_created）。

## L-PRS779-005: production-runtime-smoke env は dev→main マージ前のため secret 投入を保留した

production-runtime-smoke GitHub Environment は API/Web 双方が production deploy 未済（`/admin` が 307 → `/login?gate=admin_required`、`/api/auth/error`）の状態であり、secret を投入しても workflow が runtime に通らない。Environment は作成のみ・secret 0 件で保留した。

**Why:** dev→main マージで初めて production deploy が成立する CD 設計のため、secret 先行投入は orphan secret を生む。preflight gate の `env=production-runtime-smoke;required=...` 行も追加しない（fail を誘発するため）。

**How to apply:** production 対称化は **dev→main マージ後**に別 PR で実施する。順序は (1) production deploy 完了確認 → (2) provision-production-secrets.sh 実行 → (3) `verify-env-secrets.allowlist` に `env=production-runtime-smoke;required=...` 追加 → (4) workflow rerun。Environment 名・必須 secret 名・provisioner 構造は staging と完全対称にする。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/runtime-smoke-staging-secrets-restore/`
- 同 wave changelog: `changelog/20260516-runtime-smoke-staging-secrets-restore.md`
- contract 層 lesson: `lessons-learned-ci-env-secret-inventory-and-preflight-gate-2026-05.md`
- 後続予定 spec: `docs/30-workflows/runtime-smoke-env-provisioning/`（service-token endpoint + production 対称化、spec_created）
