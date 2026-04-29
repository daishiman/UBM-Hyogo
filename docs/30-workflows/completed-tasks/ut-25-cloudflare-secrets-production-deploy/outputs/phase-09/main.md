# Phase 9 成果物 — 品質保証

> 状態: **NOT EXECUTED — spec_created**
> 仕様書整備に閉じる本ワークフローでは、QA は仕様レベルで観点を固定し、実走チェックは Phase 11 / 13 にずれ込む。

## 1. QA チェックリスト 13 項目

| # | 観点 | 判定基準 | 結果 |
| --- | --- | --- | --- |
| 1 | AC-1〜AC-11 引用整合 | 全 AC が phase-NN.md のいずれかで hit ≥ 2 | spec_created（Phase 4〜13 完了後実走） |
| 2 | artifacts.json × phase / outputs path 整合 | drift 0 | 実走可（Phase 4〜13 完了時） |
| 3 | 不変条件 #5 不抵触 | D1 / drizzle / apps/web への secret 配置記述 0 件 | 実走可 |
| 4 | CLAUDE.md ルール 4 項目 | cf.sh / op / 平文禁止 / wrangler login 禁止 hit | 実走可 |
| 5 | secret 名一貫性 | `GOOGLE_SERVICE_ACCOUNT_JSON` 表記揺れ 0 / `--env` 対称性 / wrangler.toml 参照網羅 | 実走可 |
| 6 | MINOR UT25-M-01 解決 | `apps/api/.dev.vars` gitignore 除外手順が Phase 5 / 11 で記述 | spec_created |
| 7 | MINOR UT25-M-02 解決 | `--env` 必須化が Phase 5 / 8 / 11 / 13 のいずれかで記述 | spec_created |
| 8 | Phase 11 staging 限定 | `phase-11.md` 内で `--env production` の実 secret put 記述 0 件 | spec_created（Phase 11 作成後再確認） |
| 9 | line budget | phase-NN.md 100〜500 / index.md ≤ 250 / outputs ≤ 400 | 実走可 |
| 10 | link 切れ | 0 | 実走可 |
| 11 | navigation drift | 0 | 実走可 |
| 12 | 無料枠 | 対象外（resource 消費なし） | 確定 |
| 13 | 新規 secret hygiene 経路 / a11y | 対象外（既存 op 経路 / UI なし） | 確定 |

## 2. AC × 引用先マトリクス

| AC | 期待引用先 | spec_created hit 想定 |
| --- | --- | --- |
| AC-1（cf.sh 経由） | phase-02 / 05 / 08 / 11 / 13 / index | 6+ |
| AC-2（staging-first） | phase-02 / 05 / 08 / 11 / 13 | 5+ |
| AC-3（`private_key` 改行保全） | phase-02 / 05 / 06 | 3+ |
| AC-4（履歴汚染防止） | phase-02 / 05 / 06 | 3+ |
| AC-5（`secret list` name 確認） | phase-02 / 08 / 11 / 13 | 4+ |
| AC-6（`.dev.vars` gitignore） | phase-02 / 05 / 11 | 3+ |
| AC-7（rollback delete + 再 put） | phase-02 / 06 / 08 / 13 | 4+ |
| AC-8（UT-03 runbook 反映） | phase-12 / index | 2+ |
| AC-9（Phase 13 ユーザー承認後） | index / phase-01 / 10 / 13 | 4+ |
| AC-10（4 条件 PASS） | phase-01 / 03 / 10 | 3+ |
| AC-11（artifacts.json 一致） | index / 全 phase メタ | 13+ |

## 3. 不変条件 #5 grep 結果（プレースホルダ）

```bash
$ grep -rnE '\b(D1|drizzle|apps/web)\b.*GOOGLE_SERVICE_ACCOUNT_JSON' \
    docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/
# 期待: 0 hit
```

## 4. CLAUDE.md ルール grep 結果（プレースホルダ）

| ルール | grep 想定 hit |
| --- | --- |
| `bash scripts/cf.sh` 経由 | phase-02 / 05 / 08 / 11 / 13 |
| `op://` 参照 | phase-02 / 05 / 08 |
| 平文 .env 禁止 | phase-01 / 02 / 05 |
| wrangler login 禁止 | （hit 0 期待 = 言及なし、間接的に CLAUDE.md 参照のみ） |

## 5. MINOR 解決確認

| MINOR | 解決手順 | 確認 grep |
| --- | --- | --- |
| UT25-M-01 | Phase 5 で `git check-ignore apps/api/.dev.vars` / Phase 11 smoke で再確認 | `grep -rn '\.dev\.vars.*gitignore\|gitignore.*\.dev\.vars'` で hit ≥ 1 |
| UT25-M-02 | Phase 8 SSOT で `--env "${ENV}"` 必須テンプレ / Phase 5 / 11 / 13 で参照 | `grep -rn '\-\-env.*必須\|env 漏れ\|env 欠落'` で hit ≥ 1 |

## 6. Phase 11 staging 限定 確認（Phase 11 作成後実走）

```bash
# Phase 11 内で --env production を取る secret put / delete 系コマンドが無いこと
$ grep -nE 'secret (put|delete).*\-\-env production' \
    docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-11.md
# 期待: 0 hit（参考引用や rollback 説明での mention は別観点で許容）
```

## 7. 対象外項目

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積 | 対象外 | secret 配置のみで Cloudflare resource 消費なし |
| 新規 secret hygiene 経路 | 対象外 | 既存 1Password / scripts/cf.sh / op CLI 流用 |
| a11y (WCAG 2.1) | 対象外 | UI なし。`apps/web` を触らない |

## 8. 残課題

- 実走 grep / jq / find は Phase 4〜13 の作成完了後に Phase 10 GO/NO-GO 判定の入力として実施する。
- AC 引用 hit 数の最終集計は Phase 10 で行う。
- CLAUDE.md ↔ runbook の二重正本 drift の継続監視は Phase 12 unassigned 候補（GitHub Actions 化）で再評価。
