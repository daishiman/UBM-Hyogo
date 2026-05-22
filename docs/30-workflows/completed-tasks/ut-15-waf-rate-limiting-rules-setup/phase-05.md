[実装区分: 実装仕様書]

# Phase 5: 実装手順 / Deployment checkpoint

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL（dry-run stdout / Cloudflare API レスポンス JSON / curl `-i` の 429 ログを Phase 11 で代替証跡に採用）|
| scope | cloudflare_edge_security |
| 依存 | phase-04.md（PASS 済み前提）|

## 目的

Phase 4 の詳細設計を、実際に commit / apply / 観測可能な「git step 単位の実装手順」に展開する。さらに Cloudflare edge 設定の Deployment checkpoint（dry-run → staging simulate → production simulate → 7 日観測 → production enforce → rollback）を `phase-5-deployment-checkpoint-standard.md` のチェックリストに準拠する形で確定する。

## 1. 段階的実装手順（git step 単位）

各 step は独立 commit。step 末尾の検証コマンドが GREEN になってから次 step に進む。

### Step 1: helper と単体テスト追加（純 TS、副作用なし）

| # | アクション |
| --- | --- |
| 1-1 | `apps/api/src/middleware/edge-rate-limit-headers.ts` を Phase 4 §2 のシグネチャで新規作成 |
| 1-2 | `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` を新規作成（Phase 6 §「unit テスト一覧」記載のケース）|
| 1-3 | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| 1-4 | `mise exec -- pnpm --filter @ubm/api test edge-rate-limit-headers` GREEN を確認 |
| 1-5 | `git add apps/api/src/middleware/edge-rate-limit-headers.ts apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts && git commit -m "feat(api): add edge-rate-limit-headers helper for unified 429 response"` |

### Step 2: 既存 middleware の helper 差し替え（signature 不変・互換維持）

| # | アクション |
| --- | --- |
| 2-1 | `apps/api/src/middleware/rate-limit-magic-link.ts` の 429 生成箇所を helper 経由に差し替え |
| 2-2 | `apps/api/src/middleware/rate-limit-self-request.ts` も同様に差し替え |
| 2-3 | `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` の retry-after / body shape 期待値を helper 由来に揃える（既存ケース数は維持） |
| 2-4 | `mise exec -- pnpm --filter @ubm/api test rate-limit` で全 GREEN を確認（baseline 回帰なし） |
| 2-5 | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| 2-6 | commit: `refactor(api): route 429 responses through edge-rate-limit-headers helper` |

> **ファイル副作用 / signature 変更なし**: middleware の export signature は変更しない（不変条件）。

### Step 3: cf-waf-apply スクリプト群の追加（IaC・dry-run まず通す）

| # | アクション |
| --- | --- |
| 3-1 | `scripts/cf-waf-apply/config.json` を Phase 2 マトリクスから生成（zones 配列は zone_id を環境変数から埋める設計）|
| 3-2 | `scripts/cf-waf-apply/lib.sh` を Phase 4 §2 の function signature で新規作成。`set -euo pipefail` |
| 3-3 | `scripts/cf-waf-apply.sh` を新規作成。`source scripts/cf-waf-apply/lib.sh` で lib を読み込み |
| 3-4 | `chmod +x scripts/cf-waf-apply.sh` |
| 3-5 | `scripts/cf-waf-apply/__fixtures__/dry-run.snapshot.json` を Phase 2 閾値マトリクスと一致するよう作成 |
| 3-6 | `scripts/cf-waf-apply/lib.test.ts` で `--dry-run` の stdout を fixture と比較（DRY_RUN=1 環境で API 呼ばない）|
| 3-7 | `mise exec -- pnpm test cf-waf-apply` GREEN |
| 3-8 | shellcheck: `mise exec -- pnpm exec shellcheck scripts/cf-waf-apply.sh scripts/cf-waf-apply/lib.sh` で 0 warning |
| 3-9 | commit: `feat(scripts): add cf-waf-apply for declarative WAF / Rate Limiting management` |

### Step 4: ローカル dry-run（API 呼ばない）

```bash
# pre-flight が op / token を要求するため、op login 済み・1Password に CLOUDFLARE_API_TOKEN 登録済みであること
bash scripts/cf-waf-apply.sh --dry-run --env staging --mode simulate
# 期待: stdout に diff JSON、exit code は 0（差分なし）または 3（初回 apply 前なので差分あり）
```

> dry-run でのみ Cloudflare API は **GET のみ**（現状 fetch）。PUT/POST は発行しない。

### Step 5: MINOR-02 の no-op 確定

`apps/api/wrangler.toml` の `[[ratelimits]]` binding は **追加しない**ことを Phase 4 §6 に従って確定。Step 5 では何も commit しないが、本仕様書 §「MINOR 追跡」に「Phase 5 で no-op を確定」と記録する。

## 2. Deployment checkpoint（standard 準拠）

`phase-5-deployment-checkpoint-standard.md` のチェックリストに沿って、staging → production の二段階適用を行う。

### 2.1 staging 適用（Simulate）

```bash
# pre-flight 確認
bash scripts/cf-waf-apply.sh --dry-run --env staging --mode simulate

# 実 apply（Simulate モード）
bash scripts/cf-waf-apply.sh --env staging --mode simulate

# 適用後の整合確認（再 dry-run で差分 0 を期待）
bash scripts/cf-waf-apply.sh --dry-run --env staging --mode simulate
# 期待: exit 0（差分なし）
```

staging checkpoint:

- [ ] Cloudflare dashboard の Security Events で Simulate ログが出ること（少数の自然リクエストで `action=log` が観測される）
- [ ] `curl -i https://staging.<zone>/api/auth/magic-link` を 11 連打して `action=log` が記録されることを runbook 手順で確認
- [ ] staging で 24 時間観測し、誤検知（whitelisted UA / 内部 IP の log）が 0 件

### 2.2 production 適用（Simulate）

```bash
bash scripts/cf-waf-apply.sh --dry-run --env production --mode simulate
bash scripts/cf-waf-apply.sh --env production --mode simulate
bash scripts/cf-waf-apply.sh --dry-run --env production --mode simulate  # diff 0
```

production Simulate checkpoint:

- [ ] `bash scripts/cf-waf-apply.sh --dry-run --env production --mode simulate` の exit code が 0（差分 0）
- [ ] Cloudflare Security Events に `action=log` が継続的に記録される（スナップショットを runbook に貼付）
- [ ] 7 日連続観測で誤検知 0 件
- [ ] Cloudflare Analytics で正常ピーク req/s を再計測し、Phase 2 閾値（AUTH 10/60s / ADMIN 30/60s / ME 60/60s / PUBLIC 50/10s）が正常ピークの 3〜5 倍に収まっていることを確認。乖離があれば Phase 2 マトリクスを更新（task spec 改版）

### 2.3 production Enforce 移行

```bash
bash scripts/cf-waf-apply.sh --dry-run --env production --mode enforce
bash scripts/cf-waf-apply.sh --env production --mode enforce
bash scripts/cf-waf-apply.sh --dry-run --env production --mode enforce   # diff 0
```

Enforce checkpoint:

- [ ] 観測 7 日 / 誤検知 0 件 / Phase 2 閾値妥当性検証済み（前段すべて済み）
- [ ] 切替後 30 分以内に Cloudflare Security Events に `action=block` または `action=managed_challenge` が記録されること（合成負荷で確認）
- [ ] 既存ユーザの 429 苦情 / Sentry エラー急増がないことを 24 時間観測

### 2.4 rollback 手順

| ケース | コマンド | 期待 |
| --- | --- | --- |
| Enforce 後の即時誤ブロック発生 | `bash scripts/cf-waf-apply.sh --env production --mode simulate` | 即時 Simulate に戻る（log のみ）|
| カスタムルール単独の誤検知 | `scripts/cf-waf-apply/config.json` の該当 rule の `mode` を `simulate` に戻す → 再 apply | 個別 rule のみ Simulate に戻る |
| 完全停止が必要 | Cloudflare dashboard で該当 ruleset を `Disabled` にする緊急手順（runbook §「インシデント時の即時停止」に手順）| edge ルール完全停止・app-layer のみで防御 |

> rollback も `wrangler` 直叩き禁止・`bash scripts/cf-waf-apply.sh` 経由に統一。

## 3. canUseTool / SDK Hook 適用範囲

本タスクは Cloudflare API 経由の宣言的設定であり、Claude Agent SDK の `canUseTool` は **適用範囲外**。Phase 5 のスクリプト実行は通常の `bash` 経由で行う。

## 4. Phase 5 事前確認（テンプレ標準）

- [ ] 既存 middleware（`rate-limit-magic-link.ts` / `rate-limit-self-request.ts`）のテストを Step 2 着手前に baseline 実行し全 GREEN を確認
- [ ] `grep -rn "wrangler " scripts/ apps/ 2>/dev/null` で `wrangler` 直叩きが新規混入していないことを確認
- [ ] `grep -rn "CLOUDFLARE_API_TOKEN" scripts/cf-waf-apply* | grep -v "op://"` が空（実値転記なし）
- [ ] `git diff main...HEAD --name-only` で変更が Phase 4 §1 のファイル一覧に収まっていること

## 5. 実行コマンド集約（CONST_005 §「実行コマンド」）

| 用途 | コマンド |
| --- | --- |
| 依存導入 | `mise exec -- pnpm install` |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| 単体テスト | `mise exec -- pnpm --filter @ubm/api test edge-rate-limit-headers` |
| 既存テスト回帰 | `mise exec -- pnpm --filter @ubm/api test rate-limit` |
| dry-run snapshot | `mise exec -- pnpm test cf-waf-apply` |
| shellcheck | `mise exec -- pnpm exec shellcheck scripts/cf-waf-apply.sh scripts/cf-waf-apply/lib.sh` |
| coverage gate | `bash scripts/coverage-guard.sh` |
| ローカル dry-run | `bash scripts/cf-waf-apply.sh --dry-run --env staging --mode simulate` |
| staging Simulate apply | `bash scripts/cf-waf-apply.sh --env staging --mode simulate` |
| production Simulate apply | `bash scripts/cf-waf-apply.sh --env production --mode simulate` |
| production Enforce | `bash scripts/cf-waf-apply.sh --env production --mode enforce` |
| rollback | `bash scripts/cf-waf-apply.sh --env production --mode simulate` |

> **`wrangler` 直接呼び出し禁止**（CLAUDE.md ルール・AC-10）。すべて `bash scripts/cf*.sh` 経由。

## 6. 上流ブロッカー（gate 重複明記）

| ブロッカー | 解除条件 | gate Phase |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` の `Zone.WAF` / `Zone.RateLimit` / `Zone.Read` 権限 | 1Password 側 token 更新後、`cf-waf-apply.sh` の preflight で `/user/tokens/verify` が成功 | Phase 5 Step 4 |
| 本番 Simulate 観測 7 日 | Cloudflare Security Events の log 件数と誤検知 0 を確認 | §2.3 Enforce 移行前 |
| Cloudflare zone 確定 | `config.json` の zones[].id 確定 | Phase 5 Step 3 |

## 7. 参照資料

| 資料 | パス |
| --- | --- |
| Deployment checkpoint 標準 | `.claude/skills/task-specification-creator/references/phase-5-deployment-checkpoint-standard.md` |
| `phase-04.md` | 実装計画 / 詳細設計 |
| `phase-02.md` | Rate Limiting / WAF 閾値マトリクス |
| Cloudflare CLI ルール | `CLAUDE.md` § シークレット管理 |
| 既存 cf wrapper | `scripts/cf.sh` |

## 8. 成果物

| 成果物 | パス |
| --- | --- |
| 実装手順書（本ファイル） | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-05.md` |
| Step 1〜3 の commit 群 | git history |
| dry-run 実行ログ | `outputs/phase-5/dry-run-staging.log`（Phase 5 完了時に作成）|
| staging Simulate apply ログ | `outputs/phase-5/apply-staging-simulate.log` |

## 9. 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD（Phase 6 確定）|
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD |

## 10. 完了条件（DoD）

- [ ] Step 1〜5 が独立 commit として履歴に残る
- [ ] 各 step 末尾の検証コマンドが GREEN
- [ ] `bash scripts/cf-waf-apply.sh --dry-run --env staging --mode simulate` が exit 0/3 で完走
- [ ] `bash scripts/cf-waf-apply.sh --env staging --mode simulate` 適用後、再 dry-run で差分 0
- [ ] `wrangler` 直叩きコードがリポに混入していない（`grep` で 0 ヒット）
- [ ] `CLOUDFLARE_API_TOKEN` 実値がリポに混入していない（`grep` で 0 ヒット・`op://` 参照のみ）
- [ ] middleware signature 不変（既存テストが追加変更なく GREEN）
- [ ] coverage 既定閾値（80/80/80/80）が Phase 6 で `bash scripts/coverage-guard.sh` exit 0
- [ ] §2 Deployment checkpoint の staging Simulate / production Simulate の checkpoint が runbook（Phase 7）から参照可能

## 11. 次の Phase

Phase 6: テスト戦略（unit / integration / smoke / coverage gate の確定）

## 実行タスク

1. helper / middleware / script / runbook の git step 単位実装手順を固定する。
2. staging simulate、production simulate、observation、enforce、rollback の checkpoint を固定する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-04.md` | 詳細設計 |
| `scripts/cf.sh` | Cloudflare wrapper policy |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 5 実装手順 | `phase-05.md` |

## 完了条件

- [ ] git step、checkpoint、rollback、MINOR-02 no-op が記述されている。

## 統合テスト連携

Phase 6 で実行する typecheck / lint / unit / dry-run / coverage の前提を渡す。
