# Phase 13: PR 作成（user approval gate）

> 実装区分: 実装仕様書（CONST_004 デフォルト適用）
> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md`
> Phase 種別: NON_VISUAL implementation / approval-gated
> 出力先ベース: `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-13/`

---

## 0. 大原則（厳守）

1. **本仕様書作成プロンプトの責務外**: 本 Phase 13 は仕様書のみを記述する。**コミット / push / PR 作成は実行しない**。実行は別プロンプト（`/diff-to-pr` 等）で user の明示承認 (`G4 approve` 等) を取得した後に行う。
2. **user の明示承認なしに PR を作成しない**。曖昧な合意（「いいよ」程度）では実行禁止。
3. **ローカル確認を省略しない**（§4 の 5 コマンドは全て実行ログを `local-check-result.md` に保存）。
4. **`Refs phase-3 §4.2 task-02`** を PR body / commit message に必ず含める。`Closes` は使用しない（後追い PR 化の事故防止）。

---

## 1. 必須成果物（Phase 13 quick-summary 4 点 + 本タスク固有 1 点）

| ファイル | 役割 |
|---------|------|
| `outputs/phase-13/local-check-result.md` | typecheck / lint / test / build / staging dry-run のローカル検証ログ |
| `outputs/phase-13/change-summary.md` | 変更ファイル一覧 / 影響範囲（user 提示用） |
| `outputs/phase-13/pr-info.md` | PR URL / CI 結果（PR 作成後に追記） |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |
| `outputs/phase-13/pr-template.md` | PR body テンプレ（本仕様書 §6 を実体ファイル化） |

---

## 2. user approval gate（三役ゲート相当）

NON_VISUAL implementation で **不可逆 deploy を含まない** ため、G1-G4 4 段ゲートではなく、approval-gated NON_VISUAL implementation の三役ゲートを採用する。

| # | ゲート | 通過条件 | 本仕様書作成プロンプトでの扱い |
|---|--------|----------|--------------------------------|
| 1 | user 承認ゲート | `change-summary.md` + 実行 plan + rollback 案を提示 → user の明示文言（例「PR 作成 approve」）取得 | **取得しない**（本プロンプトは仕様書作成のみ） |
| 2 | commit 実行ゲート | ゲート 1 PASS 後、コミット粒度ごとに `git add` → `git commit` | **実行しない** |
| 3 | push & PR 作成ゲート | ゲート 2 PASS 後、`git push` → `gh pr create` | **実行しない** |

> 本仕様書プロンプトの最終 gate 条件: **本ファイル `phase-13.md` を Write した時点で完了**。コミット / push / PR は別プロンプト責務。

---

## 3. コミット粒度（5 単位）

| # | 粒度 | 含むファイル |
|---|------|--------------|
| 1 | spec | `docs/30-workflows/task-02-w2-wrangler-env-injection/phase-{11,12,13}.md` / `index.md`（あれば） |
| 2 | outputs | `docs/30-workflows/task-02-w2-wrangler-env-injection/outputs/phase-{11,12,13}/**` |
| 3 | impl | `apps/web/wrangler.toml` / `apps/web/.dev.vars.example` / `apps/web/src/lib/env.ts` / `apps/web/next.config.ts` |
| 4 | test | `apps/web/src/lib/__tests__/env.test.ts` |
| 5 | docs sync | `CLAUDE.md`（「シークレット管理」配下追記） |

> revert 単位 = commit 単位 を保つ。1 コミットに impl と spec を混ぜない。

---

## 4. ローカル確認（`local-check-result.md` 必須記録）

PR 作成前に以下 5 コマンドを順に実行し、出力を `local-check-result.md` に記録する（exit code / 主要行）。

| # | コマンド | 期待 |
|---|---------|------|
| 1 | `mise exec -- pnpm install` | exit 0 |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit` | exit 0 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts --run` | 全 PASS |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |
| 6 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit 0（不可逆 PUT は発生しない） |
| 7 | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888' apps/web/src` | 0 hits |

失敗した場合は `local-check-result.md` に失敗ログを保存し、PR 作成を **blocked** にして user に報告する。

---

## 5. CI gate 列挙（PR 作成後に GitHub Actions が実行する gate）

| gate | workflow | 通過条件 |
|------|----------|----------|
| typecheck | `.github/workflows/*.yml` の web typecheck job | exit 0 |
| lint | 同 lint job | exit 0 |
| test | 同 test job | env.test.ts 含め全 PASS |
| build | 同 build job | OpenNext for Cloudflare ビルド成功 |
| verify-design-tokens（task-18 で導入予定） | 該当 workflow | 本タスクは UI 影響なし、N/A 通過 |
| verify-indexes-up-to-date | `.github/workflows/verify-indexes.yml` | drift 0 |
| coverage-guard | pre-push hook と同 logic | 既存閾値遵守 |

---

## 6. PR template（`pr-template.md` 実体）

```md
## Summary

task-02 wrangler-env-injection: Cloudflare Workers の env 注入経路を local / staging / production の 3 環境で確定する。

- `apps/web/wrangler.toml` に `[vars]` / `[env.staging.vars]` / `[env.production.vars]` を整備
- `apps/web/src/lib/env.ts` を新設（zod 検証付き `getEnv()` accessor）
- `apps/web/.dev.vars.example` を新設（実値なし、`op://` 参照のみ）
- ビルド時 fallback `127.0.0.1:8888` の焼き込みを撲滅（grep 0 件）

Refs phase-3 §4.2 task-02
Refs `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md`

## CONST_005 5 項目充足チェック

- [ ] **CONST_005-1 既存 API のみ接続**: `apps/api/src/routes/` 配下の現行 endpoint surface のみ参照（新規追加なし）
- [ ] **CONST_005-2 OKLch トークン正本化**: 本タスクは UI 影響なし。HEX 直書き / `bg-[#xxx]` 追加なし
- [ ] **CONST_005-3 プロトタイプ正本順位**: 該当なし（platform task）
- [ ] **CONST_005-4 D1 直接アクセス禁止**: `apps/web` に D1 binding 漏洩なし。env キーから D1 接続情報を排除
- [ ] **CONST_005-5 secret 不混入**: `wrangler.toml` に `SENTRY_DSN_WEB` / `AUTH_SECRET` の値が書かれていない

## 元タスク §11 DoD 再掲チェックリスト

- [ ] `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に §4 のキーが揃っている
- [ ] `apps/web/.dev.vars.example` が存在し、実値を含まない
- [ ] `apps/web/src/lib/env.ts` が存在し、`getEnv()` が zod 検証で型安全な値を返す
- [ ] `pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888'` の検出件数が 0
- [ ] `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` が通過
- [ ] `pnpm --filter @ubm-hyogo/web build` が通過
- [ ] `pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts` が全 pass
- [ ] staging deploy（dry-run）でエラーが出ない
- [ ] Cloudflare Secrets（`SENTRY_DSN_WEB` / `AUTH_SECRET`）の値が wrangler.toml に書かれていない（`rg 'oklch|sk-|whsec_'` 機械確認）

## post-merge runbook（merge 後に手動実行）

本 PR は wrangler.toml の `[vars]` のみを更新し、Cloudflare Secrets の値は触らない。merge 後、以下を手動実行して staging / production に Sentry DSN / Auth Secret を投入する。

```bash
# staging
bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env staging

# production
bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env production
bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env production
```

詳細は `outputs/phase-12/unassigned-task-detection.md` の `UT-task-02-FU-03` を参照。

## Test plan

- [ ] CI: typecheck / lint / test / build 全 pass
- [ ] CI: verify-indexes drift 0
- [ ] ローカル: `bash scripts/cf.sh dev` で env 注入確認済（evidence: `outputs/phase-11/evidence/wrangler-dev-log.txt`）
- [ ] ローカル: staging dry-run 成功（evidence: `outputs/phase-11/evidence/staging-dry-run.txt`）

## 影響範囲

- 後続 task-03 / task-04 / task-05 / task-11 / task-18 が `getEnv()` を消費
- API endpoint surface 不変
- D1 schema 不変
- UI 描画パス影響なし（NON_VISUAL）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 7. `change-summary.md`（user 提示用）

必須セクション:

- **目的**: 1 段落で本 PR の意図
- **変更ファイル一覧**: §3 コミット粒度 5 単位の表を再掲
- **影響範囲**: 後続タスク / 既存 API / D1 / UI への影響を 1 段落
- **rollback**: `git revert <merge-commit>` で全戻し可能 / Cloudflare Secrets は本 PR で触らないため別途 rollback 不要
- **local-check-result サマリ**: 7 コマンド全 PASS 行
- **承認依頼文言**: 「上記内容で PR を作成してよいか、`G4 approve` または同等の明示文言で承認をお願いします」

---

## 8. approval 後のフロー（別プロンプト責務）

approval 取得後、以下を順に実行する（**本仕様書作成プロンプトでは実行しない**）:

1. §3 コミット粒度ごとに `git add <files>` → `git commit -m "<msg>"`（HEREDOC で `Refs phase-3 §4.2 task-02` 含む）
2. `git push -u origin <branch>`
3. `gh pr create --title "..." --body "$(cat outputs/phase-13/pr-template.md)"`
4. `outputs/phase-13/pr-info.md` に PR URL / CI 結果を追記
5. `outputs/phase-13/pr-creation-result.md` に commit SHA list / push 結果 / PR API response を保存

---

## 9. 完了条件（本仕様書作成プロンプトとして）

- [x] `phase-13.md` が `docs/30-workflows/task-02-w2-wrangler-env-injection/` 配下に存在
- [ ] approval-gate 三段の責務分離が記述されている
- [ ] PR template に CONST_005 5 項目 + 元タスク §11 DoD 9 項目が再掲されている
- [ ] post-merge runbook（`scripts/cf.sh secret put SENTRY_DSN_WEB`）が PR template に含まれる
- [ ] CI gate が列挙されている
- [ ] **本仕様書を作成しただけで commit / push / PR を作成していない**ことを最終確認

> 本仕様書の Phase 13 完了 = ファイル Write 完了。実 PR 作成は user の明示承認後、別プロンプトで実行する。
