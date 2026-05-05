# U-FIX-CF-ACCT-01-DERIV-02: Workers / D1 / Pages 別 Token 分割によるブラスト半径削減

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-02 |
| タスク名 | Cloudflare API Token を Workers / D1 / Pages 別に分割し、deploy 経路ごとに最小 scope を更に縮小 |
| 優先度 | MEDIUM |
| 推奨Wave | U-FIX-CF-ACCT-01 完了後（最小 4 scope 単一 Token の運用安定化後） |
| 状態 | unassigned |
| 作成日 | 2026-05-02 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/unassigned-task-detection.md（MEDIUM 行）/ phase-03 Option C |

## 目的

U-FIX-CF-ACCT-01 で確立した「単一 Token に最小 4 scope」運用を、deploy 経路（Workers / D1 / Pages）ごとに分割した複数 Token 構成に進化させる。各 deploy step が必要とする scope のみを保持する Token を持たせ、漏洩時のブラスト半径を更に縮小する。

> **着手判断基準**: U-FIX-CF-ACCT-01 の単一 Token 運用が staging / production の両方で 30 日以上 green、かつ secret 数増加によるオペレーションコストを許容できる体制が整った段階。

## スコープ

### 含む

- Workers Scripts deploy 専用 Token（scope: `Workers Scripts:Edit` + `Account Settings:Read`）
- D1 migration 専用 Token（scope: `D1:Edit` + `Account Settings:Read`）
- Pages deploy 専用 Token（scope: `Cloudflare Pages:Edit` + `Account Settings:Read`）
- 各 Token の staging / production 個別発行（合計 6 Token）
- GitHub Secrets / GitHub Variables の命名規約整備（例: `CF_TOKEN_WORKERS_STAGING` など）
- workflow job の分割（deploy step ごとに `secrets:` を最小化）
- runbook 化（Token 数増加に伴う rotation オペレーション、failure mode の切り分け）

### 含まない

- short-lived credential 化（U-FIX-CF-ACCT-01-DERIV-01 で扱う）
- rotation 自動化（U-FIX-CF-ACCT-01-DERIV-03 で扱う）
- Audit Logs 監視（U-FIX-CF-ACCT-01-DERIV-04 で扱う）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | U-FIX-CF-ACCT-01 | 最小 4 scope 単一 Token 運用が安定し、各 deploy step の必要 scope が実測で判明していること |
| 上流 | UT-25 系 secret 配置運用 | secret 数増加に伴い `bash scripts/cf.sh secret put` の運用が複雑化するため |
| 関連 | U-FIX-CF-ACCT-01-DERIV-01（OIDC 化） | OIDC 後の credential も同じ分割方針を継承する |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| 単一 Token 運用が 30 日以上 green | 現行最小 scope の妥当性を実測で証明してから分割しないと「壊れたものを分割する」ことになる |
| secret 管理オペレーションの成熟 | 6 Token の rotation を取り違えなく運用できる体制が必要 |
| failure mode の切り分け要求が顕在化 | 単一 Token では「どの scope の問題か」を切り分けにくくなった時点が損益分岐点 |

## 苦戦箇所・知見

**1. Token 数増加によるオペレーションコスト**
6 Token（Workers / D1 / Pages × staging / production）の rotation は単一 Token の 6 倍のオペレーションが必要。rotation 自動化（DERIV-03）と併走しないと運用が破綻するリスクがある。

**2. workflow job 分割の複雑化**
`pnpm deploy` のような統合スクリプトでは、内部で Workers / D1 / Pages を逐次叩くため、job 分割すると順序保証が複雑化する。job 間で `needs:` を厳密に組み、deploy 順序（D1 migration → Workers → Pages）を workflow に移管する必要がある。

**3. 「`Account Settings:Read` を全 Token に付与すべきか」のトレードオフ**
wrangler は account 検証で `Account Settings:Read` を要求するケースがある。各 Token に付与すれば動作確実だが、attack surface が広がる。最小化案としては「deploy 前段の verification step だけ別 Token を使い、各 deploy Token からは `Account Settings:Read` を外す」ことも可能だが workflow 設計コストが大きい。MVP は全 Token に `Account Settings:Read` 付与で開始。

**4. failure mode の切り分けは利点だが scope 設計のミスが致命的**
分割により「D1 migration が失敗した時、Workers Token は無関係」と切り分けやすくなる利点がある一方、scope 設計を誤ると「production deploy 中に Token A は通ったが Token B で失敗」という中途半端な状態を引き起こす。各 Token の scope は実測で十分性を確認してから本番投入する。

**5. rollback は Token 単位**
Token A の rollback が Token B / C に波及しないよう、rollback runbook は Token 単位で独立に書く。

## 実行概要

1. 単一 Token 運用での 30 日 green 達成を確認
2. 各 deploy step の API call を `wrangler --verbose` で取得し、必要 scope を実測
3. Token を 6 種発行（Workers / D1 / Pages × staging / production）
4. GitHub Secrets に命名規約に従って投入（`CF_TOKEN_<SCOPE>_<ENV>`）
5. workflow を job 分割し、各 job の `secrets:` を該当 Token のみに限定
6. staging で 7 日連続 green を確認後、production 展開
7. 旧単一 Token を 24h 並行保持後に失効
8. runbook（Token 単位の rotation / rollback）を整備

## 完了条件

- [ ] Workers / D1 / Pages 別の Token が staging / production 各 1 種ずつ発行済み
- [ ] 各 workflow job が該当 Token のみを参照する（`secrets:` 最小化）
- [ ] 各 Token の scope が deploy step に必要な最小限に限定されている
- [ ] 旧単一 Token が失効済み
- [ ] Token 単位の rotation / rollback runbook が整備済み
- [ ] failure mode の切り分け手順が runbook に記載されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-03.md | Option C の Token 分割案詳細 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 正本仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | deploy workflow 構成 |
| 関連 | docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md | OIDC 化との設計整合 |
| 参考 | https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ | Cloudflare API Token scope |
