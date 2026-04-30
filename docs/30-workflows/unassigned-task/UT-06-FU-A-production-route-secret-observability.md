# UT-06-FU-A-PROD-ROUTE-SECRET: apps/web production Worker route / secret / observability 移行確認

> **検出 ID**: UNASSIGNED-FU-A-002
> **発生元**: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | UNASSIGNED-FU-A-002 (内部識別: UT-06-FU-A-PROD-ROUTE-SECRET-001)              |
| タスク名     | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 |
| 分類         | followup / infrastructure-verification                                        |
| 対象機能     | apps/web Cloudflare Workers production 配信 (`ubm-hyogo-web-production`)      |
| 優先度       | High                                                                          |
| 見積もり規模 | 小〜中規模                                                                    |
| ステータス   | spec_pending                                                                  |
| visualEvidence | NON_VISUAL                                                                  |
| 親タスク     | UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`) / 上位 UT-06 |
| 発見元       | UT-06-FU-A Phase 12 unassigned-task-detection (UNASSIGNED-FU-A-002)           |
| 発見日       | 2026-04-29                                                                    |

---

## 苦戦箇所【記入必須】

`apps/web/wrangler.toml` で `[env.production].name = "ubm-hyogo-web-production"` に Worker 名を分離したことにより、旧 Worker 名で設定されていた production の **route / custom domain / secrets / observability (Logs / Tail / Workers Analytics)** が新 Worker (`ubm-hyogo-web-production`) を指していない可能性がある。具体的には:

- 旧 Worker に紐付いた route（例: `members.example.com/*`）が残存し、新 Worker の deploy 後も旧 Worker が応答する
- `wrangler secret put` で投入済みの secrets が旧 Worker スコープのみに存在し、新 Worker からは未定義として参照失敗する
- Logpush / Tail / Workers Analytics Engine の dataset 設定が旧 Worker 名に固定されており、production deploy 後の障害観測ができない

production deploy 前に **「対象 Worker 名を確実に特定し、route・secret・observability の現況を新旧両方で snapshot し、差分を検証可能な順序で適用する」** チェックリストを正本化することが、将来の同種課題（Worker rename / 環境分離 / OpenNext 移行など）を簡潔に解決するための要点である。手探りでの個別確認はオペレーションミス（旧 Worker の secrets を消したまま production deploy 等）の温床になるため、固定手順として残す。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-A（OpenNext Workers 移行）で `apps/web/wrangler.toml` を Pages → Workers 形式へ書き換える際、env 分離（`[env.staging]` / `[env.production]`）の徹底のため `[env.production].name` を明示的に `ubm-hyogo-web-production` に設定した。これにより従来の Worker（旧 name 設定）と production deploy 先 Worker が別 entity になる可能性がある。

### 1.2 問題点・課題

- route / custom domain は Cloudflare ダッシュボード or `wrangler` 設定の **Worker 名指定** で紐付くため、Worker 名変更で「route は旧 Worker、deploy は新 Worker」の split brain が起きる
- secrets は Worker 単位の secret store に入るため、新 Worker には自動コピーされない
- observability（Tail / Logs / Analytics）は Worker 名で fetch するため、誤った Worker を tail すると障害時にゼロログに見える
- これらは production deploy の **直前に確認する手順が runbook 化されていない**

### 1.3 放置した場合の影響

- production deploy 後にユーザートラフィックが旧 Worker に流れ続け、新コードが本番に反映されない
- 認証 secret 不在で 5xx が発生し、observability が旧 Worker を見ているため検知が遅れる
- rollback 判断のための一次情報（log / analytics）が取れない

---

## 2. 何を達成するか（What）

### 2.1 目的

production deploy 承認直前に実行する **Worker 名差分検証チェックリスト** を確立し、route / secret / observability の対象を新 Worker (`ubm-hyogo-web-production`) に正しく揃えた状態で deploy できるようにする。

### 2.2 想定 AC

1. production deploy 前チェックリスト（route / custom domain / secrets / observability）が `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` 配下 runbook に追記される
2. `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` の出力スナップショットが取得され、想定 secret 一覧と差分が 0 であることが確認される
3. route / custom domain が新 Worker (`ubm-hyogo-web-production`) を指していることがダッシュボード or API で確認される
4. `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` が新 Worker を tail できることが deploy 直後に確認される
5. 旧 Worker が残っている場合、無効化 / 削除 / route 切り戻しのいずれかの判断が記録される

### 2.3 スコープ

#### 含むもの

- production deploy 承認前の Worker 名 / route / secret / observability 突合チェックリストの作成
- `bash scripts/cf.sh secret list|put` を用いた production secret の snapshot と再注入手順整備
- `bash scripts/cf.sh tail` / Workers Analytics による deploy 直後の観測手順整備
- 旧 Worker（rename 前 entity）の扱い（残置 / 削除 / route 移譲）の判断記録

#### 含まないもの

- **ユーザー承認なしの production deploy 実行**
- **DNS 切替（custom domain 新規追加 / レコード変更）の実施**（DNS 切替自体は別タスク・別承認）
- staging 環境の同等確認（staging は別タスクで担保済み）
- secret の値そのものの新規発行（既存値の再注入のみ対象）

---

## 3. How（実施手順）

> **前提**: CLAUDE.md ルールにより `wrangler` 直接実行は禁止。すべて `bash scripts/cf.sh` ラッパー経由で実行する（`op run` による 1Password シークレット注入と Node 24 / pnpm 10 を保証）。

### 3.1 認証と Worker 一覧の確認

```bash
bash scripts/cf.sh whoami
# 期待: production 用 API Token のアカウントが表示される
```

### 3.2 route / custom domain 突合

- Cloudflare ダッシュボード → Workers & Pages → Routes で `ubm-hyogo-web-production` を指す route の一覧を取得
- 旧 Worker 名がある場合は当該 route が残っていないか確認
- API で確認する場合は `bash scripts/cf.sh` 経由のスクリプト化を検討（直接 `wrangler` 不可）

### 3.3 secret snapshot と再注入

```bash
# 想定 secret 一覧 (.dev.vars / 1Password 側) と突合
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production

# 不足分は op 参照経由で再注入（値はログに残らない）
bash scripts/cf.sh secret put <KEY> --config apps/web/wrangler.toml --env production
```

### 3.4 deploy 直後の observability 確認

```bash
# deploy はユーザー承認後に実行（本タスクスコープ外）
# bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# deploy 後 tail で新 Worker のログが流れることを確認
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production
```

### 3.5 旧 Worker の扱い記録

- 旧 Worker が存在する場合の処遇（残置・無効化・削除）を runbook に明記
- route 移譲が完了するまで旧 Worker は削除しない（rollback 余地確保）

---

## 4. リスクと対策

| リスク                                                       | 対策                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| production route が旧 Worker を指したまま deploy される      | deploy 前チェックリストで route の対象 Worker 名を確認。新 Worker 不在の route は deploy 前に新 Worker へ付け替える              |
| secrets が新 Worker に未注入で 5xx が発生                    | `bash scripts/cf.sh secret list --env production` で想定一覧と突合し、不足分を `secret put` で再注入                            |
| tail / observability が旧 Worker を観測しており障害検知が漏れる | deploy 直後に `bash scripts/cf.sh tail --env production` で新 Worker (`ubm-hyogo-web-production`) のログが流れることを確認     |
| 旧 Worker を早期削除して rollback 不能になる                  | 新 Worker 安定確認まで旧 Worker は残置。削除判断は本タスク runbook に記録                                                       |
| `wrangler` 直接実行で `.env` 実値が漏洩 / Node バージョン不整合 | CLAUDE.md ルールに従い `bash scripts/cf.sh` ラッパー一本化。直接 `wrangler login` も禁止                                       |

---

## 5. 検証方法

- staging deploy 成功後、production deploy 承認前チェックリストを runbook（`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`）に追記し、レビュー可能な状態にする
- `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` 実行ログ（key 名のみ・値は含めない）を runbook 添付として保存
- route / custom domain の対象 Worker 名スナップショットを runbook に貼付（旧 Worker 名が残っていないこと）
- production deploy 直後に `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` で 1 リクエスト分のログが取得できることを確認
- 参照ドキュメント:
  - `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
  - CLAUDE.md「Cloudflare 系 CLI 実行ルール」

---

## 6. 影響範囲

- `apps/web/wrangler.toml`（`[env.production].name`）
- production Worker `ubm-hyogo-web-production` の route / secret / observability 設定
- 旧 Worker（rename 前）の扱い
- UT-06 production deploy 承認手順 / runbook

---

## 7. 依存・関連タスク

- 親: UT-06 (production deploy execution)
- 関連: `task-impl-opennext-workers-migration-001`（本タスクの直接の発生原因）
- 関連: UT-06-FU-A-OPEN-NEXT-CONFIG-REGRESSION-TESTS（設定 drift 検出）
- 関連: UT-16（DNS / custom domain 切替 — 本タスクの含まないものを担当）

---

## 8. 推奨タスクタイプ

infrastructure-verification

---

## 8.5 Phase 計画 / 着手順序

| Phase | 内容 | 完了条件 |
|-------|------|----------|
| P1: 事前確認 | `bash scripts/cf.sh whoami` で production Token を確認 / 旧 Worker 名・新 Worker 名 (`ubm-hyogo-web-production`) を一覧化 | 認証 OK + Worker 名 inventory |
| P2: route / custom domain 突合 | ダッシュボード or API で route の対象 Worker 名を取得し、新 Worker を指していることを確認 | route スナップショット添付 |
| P3: secret snapshot | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production` 実行 → 想定一覧と差分検証 | 不足 secret の `secret put` 計画 |
| P4: secret 再注入 | 不足 secret を `bash scripts/cf.sh secret put` で再注入（値は op 経由・ログに残さない） | 全想定 secret が新 Worker に存在 |
| P5: observability 設定確認 | Logpush / Tail / head-based sampling / Workers Analytics の binding が `ubm-hyogo-web-production` を指すか確認。設定書き換えが必要なら runbook 化 | observability target が新 Worker |
| P6: deploy 直後検証 | （ユーザー承認後 deploy 実行 → ） `bash scripts/cf.sh tail --env production` で新 Worker のログが流れることを確認 | tail で 1 リクエスト分のログ取得 |
| P7: 旧 Worker 処遇記録 | 残置 / 無効化 / 削除 / route 移譲のいずれかを runbook に記録（rollback 余地確保のため安定確認まで残置） | 判断記録が runbook に追記 |

---

## 9. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-FU-A-002
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- CLAUDE.md「Cloudflare 系 CLI 実行ルール（Claude Code 必読）」セクション
- `apps/web/wrangler.toml`（`[env.production]` セクション）

---

## 10. 備考

本タスクは **production deploy を実行しない**。あくまで deploy 承認の前提となる Worker 名差分検証チェックリストの整備と、deploy 直後の observability 確認手順の固定化が目的。DNS 切替や旧 Worker の物理削除などの破壊的変更は別タスク・別承認で扱う。
