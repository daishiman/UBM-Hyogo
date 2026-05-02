# 実装ガイド — Cloudflare API Token のスコープ最小化

> 本ガイドは Phase 12 の Task 12-1 として、Part 1（中学生向け）と Part 2（技術者向け）の二部構成で
> Cloudflare API Token のスコープ最小化監査の意義・手順・検証・rollback を解説する。
> Token 値・Account ID 値は一切記載しない。

---

## Part 1: 中学生向け説明 — なぜ「合鍵の権限」を狭めるのか

### 1-1. たとえ話: API Token は「合鍵」

家には玄関の鍵があるよね。Cloudflare（クラウドフレア、ホームページを動かしているサービス）にも
「ログインするための鍵」があって、これを **API Token（エーピーアイ・トークン）** と呼ぶ。

GitHub（ギットハブ、コードを置いておく場所）からこの合鍵を使って Cloudflare に毎日アクセスして、
新しいページを公開したり、データベースを更新したりしている。

### 1-2. もし合鍵が「全部の部屋に入れる鍵」だったらどうなる？

合鍵を **落としたとき** のことを考えてみよう。

- もし合鍵で家中ぜんぶの部屋に入れたら、悪い人に拾われたら **冷蔵庫も、金庫も、屋根裏も** 全部開けられてしまう。
- でも合鍵を「リビングと台所だけ開けられる」ように絞っておけば、拾われても **冷蔵庫と金庫は守れる**。

これがコンピュータの世界でいう **「必要最小権限」** という考え方。
拾われた時の被害を **「ブラスト半径（爆発の影響範囲）」** と呼ぶ。狭ければ狭いほど安全。

### 1-3. 今回やったこと

Cloudflare の合鍵に「触れる場所」を **4 種類だけ** に絞った。

| 場所 | 何をする所か | なぜ必要か |
| --- | --- | --- |
| Workers Scripts | プログラム本体を置く所 | 新しいバージョンを公開するため |
| D1 | データベース（会員情報など） | テーブルを作ったり更新するため |
| Cloudflare Pages | ホームページ（HTML/CSS） | 新しいデザインを公開するため |
| Account Settings (Read) | アカウント名を見るだけ | 「自分のアカウントですよ」と確認するため（**読むだけ**で書き換えはできない） |

「もしかしたら必要かも」という候補が 2 種類（KV / User Details）あるけれど、
**実際にやってみてダメだったときだけ追加する** ルールにした。最初から付けない。

そして staging（リハーサル用ステージ）と production（本番ステージ）で **別々の合鍵** を持つようにした。
リハーサルで失敗しても本番には影響しないため。

### 1-4. なぜ Account ID は秘密にしないのか

| 用語 | たとえ |
| --- | --- |
| Account ID | 家の **住所** |
| API Token | 家の **鍵** |

住所だけ知っていても、鍵がなければ家には入れない。
だから Account ID は GitHub の「Variable（普通の設定値）」に置いて OK。
Token だけは「Secret（暗号化された秘密）」に置く。

### 1-5. 専門用語セルフチェック表（7 用語）

| 用語 | 中学生向けの意味 |
| --- | --- |
| API Token | コンピュータ同士がログインするための鍵 |
| Secret | 暗号化されて中身が見えない設定値（パスワード等） |
| Variable | 暗号化されない普通の設定値（名前・ID 等） |
| staging | 本番の前に試す **リハーサル用ステージ** |
| production | お客さんが見る **本番ステージ** |
| rollback | 失敗したときに **前の状態に戻す** こと |
| permission scope | 鍵で **開けられる部屋の範囲** |

---

## Part 2: 技術者向け実装ガイド

### 2-1. 概要

`CLOUDFLARE_API_TOKEN`（GitHub Environment Secret、staging / production の二分割）を必要最小権限へ縮退させ、
過剰権限ゼロ・staging 検証先行・rollback 経路保持を満たす。
コード変更は本タスクのスコープ外。本ガイドは **ランブックと判断基準** を提供する。

### 2-2. 必要最小権限マトリクス（正本 4 種）

Phase 2 §3.1 を正本とする。

| # | Resource | Permission | Scope | 必要根拠（CI step） |
| --- | --- | --- | --- | --- |
| P1 | Account / Workers Scripts | Edit | Account（指定 Account ID 限定） | `.github/workflows/backend-ci.yml` の Workers deploy step |
| P2 | Account / D1 | Edit | Account（指定 Account ID 限定） | `.github/workflows/backend-ci.yml` の D1 migrations apply step（DDL 実行に Edit 必須） |
| P3 | Account / Cloudflare Pages | Edit | Account（指定 Account ID 限定） | `.github/workflows/web-cd.yml` の Pages deploy step |
| P4 | Account / Account Settings | Read | Account（指定 Account ID 限定） | `wrangler whoami` / wrangler-action の token verify |

### 2-3. 追加候補（実測で必要と判明した場合のみ昇格）

| # | Resource | Permission | 昇格条件 |
| --- | --- | --- | --- |
| O1 | Account / Workers KV Storage | Edit | `apps/api` の `wrangler deploy --dry-run` が KV binding メタ更新権限不足で失敗した場合のみ |
| O2 | User / User Details | Read | `wrangler whoami` が Account Settings:Read だけで失敗した場合のみ |

> Phase 11 smoke で AC-3〜AC-5 が PASS すれば O1 / O2 は不要のまま確定。

### 2-4. 不要権限（除外、付与しない）

Zone / DNS:Edit、Zone / SSL:Edit、Zone / Cache Purge、Workers R2:Edit、Workers Queues:Edit、Stream:Edit、
Images:Edit、Email Routing:Edit、Memberships:Read、Logs:Read。
本プロジェクトは利用していないため除外する（Phase 2 §3.3 を正本）。

### 2-5. 適用順序図（staging → production、AC-6）

```
[T0] Cloudflare Dashboard で 2 本の新 Token を最小権限（P1〜P4）で発行
      ├─ "ubm-staging-YYYYMMDD"
      └─ "ubm-production-YYYYMMDD"
      ※ Account scope を本プロジェクトの Account ID 1 件に限定
       │
       ▼
[T1] gh secret set CLOUDFLARE_API_TOKEN --env staging  # 新 staging Token を投入
       │
       ▼
[T2] staging 三段検証
      ├─ Static  : gh secret list / gh api variables 突合
      ├─ Runtime : cf.sh whoami / d1 migrations list / api+web dry-run
      └─ Pipeline: dev へ no-op commit を push、backend-ci / web-cd の deploy-staging が green
      │   PASS → T3、FAIL → R1
       ▼
[T3] gh secret set CLOUDFLARE_API_TOKEN --env production  # 旧 production Token は失効しない
       │
       ▼
[T4] main へマージ、deploy-production の conclusion=success を観測
      │   FAIL → R2
       ▼
[T5] +24h 観測後、旧 staging / 旧 production Token を Cloudflare Dashboard で失効
       │
       ▼
完了（artifacts.json: workflow_state = verified）
```

### 2-6. Rollback 手順（AC-7）

| ID | 失敗ポイント | rollback 手順 |
| --- | --- | --- |
| R1 | T2 staging smoke 失敗 | `gh secret set CLOUDFLARE_API_TOKEN --env staging` で旧 staging Token 値を再投入。新 staging Token は Dashboard で失効可 |
| R2 | T4 production deploy 失敗 | `gh secret set CLOUDFLARE_API_TOKEN --env production` で旧 production Token 値を即時再投入。`bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env production` で deploy も巻き戻す |
| R3 | 権限不足（Authentication error） | Cloudflare Dashboard で必要権限を追記（O1 / O2 昇格判定）。値再発行は不要、CI を re-run |
| R4 | 旧 Token 値を失念 | Dashboard で旧仕様の Token を新規発行 → staging を先に切戻し → T0 から再開 |
| R5 | T5 で旧 Token を残し続けた（24h 超過） | 速やかに失効、Phase 11 evidence に逸脱ログを残す |

旧 Token は **最大 24h** 保持。それ以上は監査リスクが増えるため失効。

### 2-7. 検証コマンド（Token 値を出さない）

#### Static 検証（AC-1 / AC-12）

```bash
# Secret 存在確認（値・hash は出力されない）
gh secret list --env staging
gh secret list --env production

# workflow 参照確認
rg -n "CLOUDFLARE_API_TOKEN" .github/workflows

# Variable 化されていないこと（Token は Secret 専用）
gh api repos/daishiman/UBM-Hyogo/actions/variables | jq -r '.variables[].name' | grep -v CLOUDFLARE_API_TOKEN || true
```

#### Runtime 検証（AC-3 / AC-4 / AC-5）

```bash
# 認証（Account 情報のみ表示、Token 値は出ない）
bash scripts/cf.sh whoami

# D1 list（Read 権限ではなく Edit を間接検証）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# API/Web deploy dry-run
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

`wrangler` を直接呼ばず `scripts/cf.sh` 経由で実行する（CLAUDE.md 規約）。
`set -x` を使わない（エラー時にスタックトレース経由で Token が露出するリスクがあるため、Phase 6 異常系の方針）。

### 2-8. AC マトリクス（AC-1〜AC-12）

| AC | 検証経路 | 成果物 |
| --- | --- | --- |
| AC-1 | Cloudflare Dashboard 目視 + §2-2 / §2-4 突合 | Phase 11 evidence |
| AC-2 | §2-2（正本 4）+ §2-3（追加候補） | 本ガイド |
| AC-3 | `cf.sh d1 migrations list ubm-hyogo-db-staging` の exit=0 | Phase 11 manual-smoke-log.md |
| AC-4 | `cf.sh deploy apps/api --env staging --dry-run` の exit=0 | Phase 11 manual-smoke-log.md |
| AC-5 | `cf.sh deploy apps/web --env staging --dry-run` の exit=0 | Phase 11 manual-smoke-log.md |
| AC-6 | §2-5 適用順序図 T0〜T5 | 本ガイド |
| AC-7 | §2-6 rollback R1〜R5 | 本ガイド |
| AC-8 | Phase 11 evidence の自己確認（Token 値非露出） | Phase 11 evidence |
| AC-9 | §2-10（不変条件 #5 影響なし） | 本ガイド |
| AC-10 | §2-11（U-FIX-CF-ACCT-02 との ADR 整合） | 本ガイド + ADR |
| AC-11 | skill 検証 4 条件 | skill-feedback-report.md |
| AC-12 | `gh secret list` の値非出力確認 | Phase 11 manual-smoke-log.md |

### 2-9. ADR

| 項目 | 値 |
| --- | --- |
| 配置 | `outputs/phase-12/adr-cloudflare-token-scope.md`（Phase 2 §9 の方針に従う） |
| 対象 | (a) 必要最小権限集合（§2-2）、(b) staging / production の値分離方針、(c) scope 別 Token（Option C）と OIDC 連携（Option D）を将来課題化する判断 |
| 命名規約 | `ubm-{staging\|production}-YYYYMMDD` |
| 相互参照 | U-FIX-CF-ACCT-02 の ADR と相互参照（Token 権限 ↔ wrangler.toml 警告の責務分離） |

### 2-10. 不変条件 #5 への影響（AC-9）

不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）は **侵害しない**。
本タスクで追加する `D1:Edit` 権限は CI 上の `apps/api` ディレクトリ起点のマイグレーション (`wrangler d1 migrations apply`) のみが利用する。
`apps/web` から D1 を直接呼ぶ経路は新設しない。

### 2-11. U-FIX-CF-ACCT-02（並列タスク）との関係

| 観点 | U-FIX-CF-ACCT-01（本タスク） | U-FIX-CF-ACCT-02（並列） |
| --- | --- | --- |
| 責務 | API Token の権限スコープ最小化 | wrangler runtime warning（vars 継承 / pages_build_output_dir 等）の cleanup |
| 対象 | Cloudflare Dashboard / GitHub Environment Secret | `apps/api/wrangler.toml` / `apps/web/wrangler.toml` |
| 共有成果物 | ADR（Token 分離 / 命名規約） | ADR を相互参照 |
| 着手順序 | parallel（独立着手可能） | parallel |

両タスクの ADR は本タスク配下の `outputs/phase-12/adr-cloudflare-token-scope.md` に統合し、
02 側からは参照のみとする（重複定義を避ける）。

### 2-12. 後続課題（unassigned-task-detection に登録）

1. GitHub OIDC → Cloudflare Trust Policy 連携への移行（Phase 3 Option D、HIGH、長命 Token 廃止の本命）
2. scope 別 Token 分割（Workers / D1 / Pages 専用、Phase 3 Option C、MEDIUM）
3. Token rotation 自動化（90 日サイクル、HIGH）
4. Cloudflare Audit Logs の常時監視・alerting（MEDIUM）

これらは本タスクのスコープ外として `outputs/phase-12/unassigned-task-detection.md` に
`状態: candidate` で登録する（最低 2 件、Phase 3 MINOR 由来）。

### 2-13. Token 値・Account ID 非露出の運用ルール

- 本ガイド・Phase 11 evidence・ADR・LOGS のいずれにも **Token 値、Account ID 値、Token ID** を記載しない。
- `gh secret get` は使わない（仕様上値は出ないが慣性事故防止）。
- `wrangler login` で OAuth トークンをローカル保持しない（CLAUDE.md 規約）。`.env` は `op://` 参照のみ。
- ローカル実行は `bash scripts/cf.sh ...` でラップする（`op run --env-file=.env` で揮発的に注入）。

### 2-14. 完了判定（本ガイド観点）

- [ ] §2-2 〜 §2-7 の手順が Phase 5 ランブックと §11 と矛盾しない
- [ ] AC-1〜AC-12 すべてに検証経路が割り当てられている（§2-8）
- [ ] ADR 配置先と U-FIX-CF-ACCT-02 への相互参照が記録されている（§2-9 / §2-11）
- [ ] 本ガイドに Token 値・Account ID 値が含まれていない
- [ ] 後続課題が最低 2 件登録されている（§2-12）
