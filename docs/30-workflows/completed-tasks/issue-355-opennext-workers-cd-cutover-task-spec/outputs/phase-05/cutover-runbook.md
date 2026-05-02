# Cloudflare 配信形態 cutover runbook（Pages → OpenNext on Workers）

本 runbook は `apps/web` の配信形態を Cloudflare Pages から OpenNext on Workers へ切り替える際の手順書である。Phase 2 設計骨子・Phase 4 ST-2・Phase 5 実装テンプレートと整合する。Cloudflare CLI の実行は `bash scripts/cf.sh` 経由のみとし（CLAUDE.md 規約）、`wrangler` の直接実行は本 runbook 内に記述しない。

| 関連 ADR / タスク | 参照 |
| --- | --- |
| ADR-0001 | OpenNext on Workers 採用根拠 |
| UT-28 | apps/web 配信形態決定 / Pages project 物理 delete owner |
| UT-29 | post-deploy smoke healthcheck 自動化 owner |
| UT-06 Phase 11 | smoke S-01〜S-10 流用元 |

---

## S1. 前提

### 対象環境

| 環境 | URL / 識別子 |
| --- | --- |
| staging Workers | `https://ubm-hyogo-web-staging.<account>.workers.dev/`（custom domain なし） |
| production Workers | production custom domain（移譲後） |
| staging API | service binding `API_SERVICE` → `ubm-hyogo-api-staging` |
| production API | service binding `API_SERVICE` → current `apps/web/wrangler.toml` production target (`ubm-hyogo-api` at spec time). If implementation follow-up renames the API Worker, update wrangler and this runbook in the same wave |

### 必要権限（Cloudflare API Token scope）

| scope | 用途 |
| --- | --- |
| Workers Scripts:Edit | `wrangler deploy --env <stage>` |
| Workers Routes:Edit | custom domain attach / detach |
| Zone:Read | DNS / TLS 確認 |
| Pages:Edit（dormant 操作 token のみ） | 旧 Pages project の Pause / Resume / Delete |

> 1Password に保管された `CLOUDFLARE_API_TOKEN` を `scripts/cf.sh` が `op run --env-file=.env` 経由で揮発注入する。実値を `.env` / ログに残さない。

### 事前確認

```bash
bash scripts/cf.sh whoami
```

- 期待: 認証済 account / email が出力されること（実値はログに転記しない）
- wrangler のバージョンが `apps/web/package.json` の devDependencies と整合すること（`4.85.0`）

### 事前 prerequisite

- `apps/api-staging` / `apps/api-production` Worker が deploy 済（service binding target が存在すること、UT-29 連携）
- `apps/web/wrangler.toml` に `pages_build_output_dir` が不在（AC-5）
- `.github/workflows/web-cd.yml` が改修済 PR で merge ready

---

## S2. staging cutover 手順

### 操作 1: 改修 PR を `dev` ブランチへ merge

- `.github/workflows/web-cd.yml` の改修（F-1 pseudo-diff）を含む PR を `dev` へ merge
- `web-cd / deploy-staging` job が自動起動することを GitHub Actions 上で確認（T-12）

### 操作 2: CD 内 deploy の手動再現コマンド（事故時のみ）

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

- 通常運用では CD（`cloudflare/wrangler-action@v3` の `command: deploy --env staging`）が実行する
- 手動再現はインシデント時のみ。token は `op://` 参照経由で注入される

### 操作 3: HTTP 応答確認（T-13）

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://ubm-hyogo-web-staging.<account>.workers.dev/
```

- 期待: 200 もしくは 3xx（home redirect）
- 結果を `outputs/phase-11/staging-smoke-results.md` に記録

### 操作 4: smoke S-01〜S-10 を staging URL に対し再実行

- UT-06 Phase 11 で確定済の S-01〜S-10 手順を staging URL に対し実行（T-20〜T-29）
- service binding 経由の Web→API 連携を T-14 で確認
- 結果を `outputs/phase-11/staging-smoke-results.md` に PASS/FAIL 表で記録（10/10 PASS が AC-3 gate 条件）

### 操作 5: 旧 staging Pages project の Pause Deployments

- Cloudflare Dashboard → Pages → `<project>-staging` → Settings → 「Pause Deployments」ボタン押下
- 旧 staging Pages の active deploy を停止（dormant 状態への移行）
- 本操作は旧配信が新規 traffic を受けないことを担保するための念押し（staging は `*.workers.dev` 完結のため traffic 影響は実質ゼロ）

### S2 完了条件

- T-12 / T-13 / T-14 / T-20〜T-30 全 PASS
- NG-1 / NG-3 / NG-4 のいずれにも該当しない
- 旧 staging Pages project が Pause Deployments 状態

---

## S3. production cutover 手順

### 操作 1: AC-3 gate 通過確認（前提）

- S2 操作 4 の smoke 結果が 10/10 PASS であることを `outputs/phase-11/staging-smoke-results.md` で確認
- AC-3 gate を満たさない場合は本セクションを実施しない

### 操作 2: `main` ブランチへの merge

- `dev` から `main` への PR を作成
- `web-cd / deploy-production` job が自動起動することを確認
- production environment に Required reviewers が設定されている場合、reviewer 承認を経てから deploy 実行

### 操作 3: deploy 完了確認 / VERSION_ID 記録

- CD 完了後、`wrangler deploy --env production` の出力に含まれる `Current Version ID` を記録
- 記録先: `outputs/phase-11/wrangler-deploy-output.md`（API Token / OAuth 値が混入していないこと、grep `(?i)(authorization|bearer|api[_-]?token)` で 0 件）
- 1 つ前の VERSION_ID も rollback 用に併記

### 操作 4: production custom domain 移譲

- 詳細は S4 を参照。Add → SSL 待機 → Remove → 検証の 4 手順で原子的に切り替える

### 操作 5: production smoke 再実行

- 同 S-01〜S-10 を production custom domain に対し実行
- 結果を `outputs/phase-11/staging-smoke-results.md` の production 列、または別ファイルに追記
- 1 件でも FAIL した場合は S5（rollback）へ即時移行

### S3 完了条件

- production deploy success / VERSION_ID 記録済
- production smoke 全 PASS
- custom domain TLS 証明書が Workers 経由で発行されていること（S4 操作 4 確認）

---

## S4. custom domain 移譲

> staging は `*.workers.dev` 完結のため本セクション対象外。production cutover 時に一回だけ実施する。

### 前提

- production custom domain は Cloudflare Dashboard 上で旧 Pages project に紐付いている
- DNS TTL は事前に短縮しておく（5 分以内）ことが望ましい

### 手順 1: Workers script へ Custom Domain を Add

- Cloudflare Dashboard → Workers & Pages → `ubm-hyogo-web-production` → Settings → Domains & Routes → 「Add」 → 該当 custom domain を入力
- Cloudflare が自動的に DNS / route attach を実行

### 手順 2: SSL 証明書発行待ち

- 目安 5 分。Dashboard 上の状態が `Active` になるまで待機
- 並行して `dig <domain>` で DNS 反映を確認可能

### 手順 3: 旧 Pages project から Custom Domain を Remove

- Cloudflare Dashboard → Pages → `<project>` → Custom domains → 該当 domain → Remove
- 本手順により Pages 側の TLS 紐付けが解除され、Workers 配信に traffic が集約される

### 手順 4: 検証

```bash
dig +short <domain>
curl -sS -I https://<domain>/
```

- 期待: `dig` で Cloudflare anycast IP に解決、`curl -I` で TLS 証明書が Workers 経由で発行されたものに切替
- TLS 証明書の発行者 / SAN を `outputs/phase-11/route-mapping-snapshot.md` に記録（実 cert PEM はログに残さない）

### S4 完了条件

- TLS 証明書が Workers 経由
- 旧 Pages project に custom domain 紐付けが残っていない
- traffic split（Pages 側残存）が発生していないことを `curl` 複数回サンプリングで確認

---

## S5. rollback 手順

### 判断基準

- production smoke S-01〜S-10 のうち 1 件でも本番で FAIL → 即座に一次手段
- staging で NG-4（5xx 1 件以上 / 5 分 window）→ 一次手段
- 一次手段が失敗（exit 非 0、復旧後も 200 取得不可）→ NG-5 適用、二次手段へ

### 一次手段（推奨）: wrangler rollback

```bash
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env <stage>
```

- `<PREV_VERSION_ID>` は S3 操作 3 で記録した 1 つ前の VERSION_ID
- 実行後、`curl -sS -o /dev/null -w '%{http_code}\n' <URL>` で 200 を確認
- 結果を `outputs/phase-11/rollback-readiness.md` に記録（token mask 済）

### 二次手段（cutover 直後 dormant 期間内のみ）: 旧 Pages project resume

- Cloudflare Dashboard → Pages → `<project>` → Settings → 「Resume Deployments」
- 旧 Pages 側の最終 deploy URL を確認し、custom domain を再 attach（S4 と逆操作）
- Workers 側の custom domain を一旦 Remove し、Pages 側に再付替

### 通知テンプレ

```text
[INCIDENT] apps/web cutover rollback executed
- env: <staging|production>
- from VERSION_ID: <NEW>
- to VERSION_ID: <PREV>  (or Pages resume)
- trigger: <S-XX FAIL / 5xx burst / etc.>
- evidence: outputs/phase-11/rollback-readiness.md
- next: 原因切分 / 再 deploy 計画 / RISK-X 起票
```

- 通知先: GitHub Issue（本タスク fork issue）/ 必要に応じて Slack
- 実 token / OAuth 値を通知に含めない

### S5 完了条件

- 一次もしくは二次手段で公開 URL が 200 を返す
- VERSION_ID 遷移と原因が `rollback-readiness.md` に記録
- production cutover を保留する場合は AC-3 gate を再評価

---

## S6. Pages dormant 期間運用

### 期間

- cutover 完了後 **2 週間**（1 sprint）

### 期間中の状態

- 旧 Pages project は **Pause Deployments** 状態で残置
- custom domain は Pages 側から外し、Workers 側にのみ attach
- Pages 側の `Resume Deployments` ボタンが活性であることを定期確認（T-41 / S5 二次手段の前提）

### 期間後の delete

- Cloudflare Dashboard → Pages → `<project>` → Settings → Delete Project
- **本タスクでは delete を実行しない**。dormant 期間終了後、UT-28 owner（後続タスク）が delete を実施
- delete 実行時の手順:
  - Pages project の bindings が空であること、custom domain が外れていることを確認
  - delete ボタン押下 → 確認ダイアログで project 名入力 → 完了
  - Cloudflare API Token から `Pages:Edit` scope を削減（dormant 期間終了後の cleanup）

### S6 完了条件（implementation follow-up 完了時点）

- 2 週間 dormant の合意が UT-28 owner と取れている
- Pages project が Pause Deployments / custom domain 解除済
- delete は別タスクで実行する旨が本 runbook と PR description に明記

### 本 spec close-out 完了条件

- S1〜S6 の手順とNO-GO境界が文書化されている
- Pages project physical delete は本specでもimplementation follow-upでも自動実行しないと明記されている
- Phase 11の5 evidence contractが `PENDING_IMPLEMENTATION_FOLLOW_UP` として保存されている

---

## 改訂履歴

| 日付 | 改訂内容 |
| --- | --- |
| 2026-05-02 | 初版（Phase 5 close-out にて確定） |
