# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 8 で SSOT 化した投入コマンド / staging-first ループ / 関数擬似コード（`put_sa_json` / `capture_secret_list` / rollback）を前提に、本タスク固有の品質保証チェックを行う。観点は (1) **仕様書整合性**（Phase 1〜13 の AC-1〜AC-11 引用一致 / artifacts.json と各 phase ファイル名一致）、(2) **ルール整合性**（CLAUDE.md「wrangler 直接禁止」「平文 .env 禁止」「op 経由注入」「ブランチ戦略 feature/* → dev → main」）、(3) **不変条件 #5 不抵触**（D1 直接アクセスなし / apps/api 配下のみ）、(4) **secret 名・スコープ・配置先の一貫性**（`GOOGLE_SERVICE_ACCOUNT_JSON` × `staging` / `production` × `apps/api/wrangler.toml`）、(5) **MINOR 解決状況**（UT25-M-01 gitignore 除外 / UT25-M-02 `--env` 漏れ防止）、(6) **Phase 11 が production 実投入を含まない**ことの再確認、の 6 観点。本ワークフローは spec_created に閉じるため、対象外項目は無料枠（resource 消費なし）/ a11y（UI なし）/ 新規 secret hygiene（既存 op 経路流用）と明記する。検証コマンド SSOT は本仕様書 §検証コマンドに集約。

## 実行タスク

1. AC-1〜AC-11 の Phase 1〜13 引用整合性を確認する手順を確定する（完了条件: 各 AC が `phase-NN.md` の §実行タスク / §完了条件 / §引き継ぎ事項 のいずれかで引用されているか grep 確認、欠落 0）。
2. artifacts.json と各 phase ファイル名・成果物 path の一致確認手順を確定する（完了条件: `phases[*].file` × 実 `phase-NN.md` 一致 / `phases[*].outputs` × 実 outputs path 一致が grep + ls で 0 drift）。
3. 不変条件 #5 不抵触の grep 確認を確定する（完了条件: `D1` / `drizzle` / `apps/web` への直接 secret 配置記述が 0 件）。
4. CLAUDE.md ブランチ戦略との整合確認を確定する（完了条件: `feature/* → dev → main` / `bash scripts/cf.sh` / `op://` / 平文 .env 禁止 の 4 項目すべて grep hit）。
5. secret 名・スコープ・配置先の一貫性を確定する（完了条件: `GOOGLE_SERVICE_ACCOUNT_JSON` の表記揺れ 0 / `--env staging` と `--env production` の出現対称性 / `apps/api/wrangler.toml` の参照網羅）。
6. MINOR 解決状況確認手順を確定する（完了条件: UT25-M-01 = `apps/api/.dev.vars` の `.gitignore` 除外確認手順が Phase 5 / 11 のいずれかに記述、UT25-M-02 = `--env` 引数欠落防止が Phase 5 / 8 / 11 / 13 のいずれかに記述、両方 hit）。
7. Phase 11 が production 投入を含まないことの再確認（完了条件: `phase-11.md` 内で `--env production` 実投入の記述が 0 件、staging のみ smoke）。
8. 対象外項目（無料枠 / a11y / 新規 secret hygiene）を明記する（完了条件: 3 項目すべて対象外と理由が記述）。
9. line budget / link 整合 / navigation drift を `validate-phase-output.js` で機械検証する（完了条件: exit 0 を期待値、spec_created 段階では NOT EXECUTED 許容）。
10. `outputs/phase-09/main.md` に QA チェックリスト結果を集約する（完了条件: 1 ファイルにすべて記述、spec_created のためプレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-08.md | DRY 化済みの SSOT |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-08/main.md | SSOT 集約先 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/index.md | AC-1〜AC-11 / Phase 一覧 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/artifacts.json | path 整合の起点 |
| 必須 | CLAUDE.md（Cloudflare 系 CLI / シークレット管理 / ブランチ戦略） | grep 突合対象 |
| 必須 | apps/api/wrangler.toml | `--env staging` / `--env production` 宣言 |
| 必須 | scripts/cf.sh | wrangler ラッパーの存在確認 |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 機械検証スクリプト |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#secret | wrangler secret コマンド仕様 |

## QA 観点 1: AC-1〜AC-11 引用整合性

### 1.1 突合表

| AC | 期待される引用先（grep 対象） | 期待 hit |
| --- | --- | --- |
| AC-1 | `bash scripts/cf.sh` 経由 | phase-02 / 05 / 08 / 11 / 13 |
| AC-2 | staging-first 順序 | phase-02 / 05 / 08 / 11 / 13 |
| AC-3 | `private_key` 改行保全（stdin） | phase-02 / 05 / 06 |
| AC-4 | `HISTFILE=/dev/null` / `set +o history` / `op read` 直接 stdin | phase-02 / 05 / 06 |
| AC-5 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` 名前確認 | phase-02 / 11 / 13 |
| AC-6 | `apps/api/.dev.vars` + `.gitignore` 除外 | phase-02 / 05 / 11 |
| AC-7 | rollback delete + 再 put | phase-02 / 06 / 08 / 13 |
| AC-8 | UT-03 runbook 反映 | phase-12 |
| AC-9 | Phase 13 ユーザー承認後の別オペレーション | index / phase-01 / 10 / 13 |
| AC-10 | 4 条件 全 PASS | phase-01 / 03 / 10 |
| AC-11 | artifacts.json `phases[]` と完全一致 | index / 各 phase メタ情報 |

### 1.2 検証コマンド

```bash
for ac in AC-1 AC-2 AC-3 AC-4 AC-5 AC-6 AC-7 AC-8 AC-9 AC-10 AC-11; do
  hit=$(grep -rln "${ac}" docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/ | wc -l)
  echo "${ac}: hit=${hit}"
done
```

### 1.3 期待結果

- 全 AC で hit ≥ 2 (index.md + 担当 phase)。

## QA 観点 2: artifacts.json × phase ファイル整合

| チェック | 方法 | 期待 |
| --- | --- | --- |
| `phases[*].file` × 実 phase-NN.md | `jq -r '.phases[].file' artifacts.json` × `ls phase-*.md` | 完全一致 |
| `phases[*].outputs` × 実 outputs path | `jq -r '.phases[].outputs[]' artifacts.json` × `find outputs -type f` | 完全一致（Phase 11 / 12 / 13 補助成果物含む） |
| Phase 1〜3 status = completed | `jq -r '.phases[0:3][].status'` | 全件 completed |
| Phase 4〜13 status = pending | `jq -r '.phases[3:13][].status'` | 全件 pending |
| Phase 13 user_approval_required: true | `jq -r '.phases[12].user_approval_required'` | true |

## QA 観点 3: 不変条件 #5 不抵触

```bash
# D1 / drizzle / apps/web への secret 配置記述が混入していないこと
grep -rnE '\b(D1|drizzle)\b.*GOOGLE_SERVICE_ACCOUNT_JSON|GOOGLE_SERVICE_ACCOUNT_JSON.*\bD1\b' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/

grep -rn 'apps/web.*GOOGLE_SERVICE_ACCOUNT_JSON\|apps/web.*\.dev\.vars' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/
```

期待: 0 件（apps/api 配下のみ言及されること）。

## QA 観点 4: CLAUDE.md ルール整合性

| CLAUDE.md 記述 | 期待される運用 | grep コマンド |
| --- | --- | --- |
| Cloudflare 系 CLI は scripts/cf.sh 経由 | runbook が wrangler を直接呼ばない | `grep -nE 'bash scripts/cf\.sh' phase-*.md` |
| 平文 .env 禁止 / op 参照のみ | 投入経路が `op read` stdin パイプ | `grep -nE 'op read|op://' phase-*.md` |
| ブランチ戦略 feature/* → dev → main | 投入は dev / main の merge とは独立した手動オペレーション | `grep -nE 'feature/\*|--env (staging|production)' phase-*.md` |
| wrangler login 禁止 | OAuth トークン利用記述なし | `grep -rnE 'wrangler login' .` で 0 件期待 |

## QA 観点 5: secret 名・スコープ・配置先一貫性

| チェック | コマンド | 期待 |
| --- | --- | --- |
| secret 名表記揺れ 0 | `grep -rnE 'GOOGLE[-_]?SERVICE[-_]?ACCOUNT[-_]?JSON' docs/.../ut-25-.../` | 全件 `GOOGLE_SERVICE_ACCOUNT_JSON` のみ |
| `--env` 出現対称性 | `grep -cE '\-\-env staging' phase-*.md` × `grep -cE '\-\-env production' phase-*.md` | 件数差 ≤ 1（staging-first 解説で許容） |
| 配置先 wrangler.toml 参照 | `grep -rn 'apps/api/wrangler\.toml'` | Phase 1 / 5 / 8 / 13 で hit |
| evidence 命名統一 | `grep -rn 'secret-list-evidence-'` | `secret-list-evidence-{staging,production}.txt` のみ |

## QA 観点 6: MINOR 解決状況

| MINOR | 解決方針 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| UT25-M-01: `apps/api/.dev.vars` gitignore 除外 | Phase 5 / 11 のいずれかで `.gitignore` チェック手順記述 | `grep -rn '\.dev\.vars.*\.gitignore\|gitignore.*\.dev\.vars'` | hit ≥ 1 |
| UT25-M-02: `--env` 引数漏れ防止 | Phase 5 / 8 / 11 / 13 のいずれかで `--env` 必須化記述 | `grep -rnE '\-\-env.*必須\|env 漏れ\|env 欠落'` | hit ≥ 1 |

## QA 観点 7: Phase 11 が production 実投入を含まない再確認

```bash
# Phase 11 内で --env production の実投入記述が無いこと
grep -nE '\-\-env production' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-11.md

# Phase 11 が staging のみであること
grep -nE 'staging|production' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-11.md \
  | head -30
```

期待:
- `--env production` の **実投入記述 0 件**（参考引用や rollback 説明での mention は許容、`secret put` 系コマンドが production を取る記述は 0）
- staging のみで smoke、production は Phase 13 ユーザー承認後で固定。

## QA 観点 8: line budget / link 整合 / navigation drift

| チェック | 方法 | 期待 |
| --- | --- | --- |
| line budget (phase-NN.md) | `wc -l` | 各 100〜500 行 |
| line budget (index.md) | `wc -l` | 250 行以内 |
| line budget (outputs/main.md) | `wc -l` | 50〜400 行 |
| outputs path 整合 | artifacts.json × find | 完全一致 |
| 相対参照リンク切れ | `grep -rn '\](\.\./\|\](\./'` + ls 突合 | 0 |
| `validate-phase-output.js` | 実走 | exit 0 |

## 対象外項目（明記）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積（Workers / D1 / Sheets） | 対象外 | 本タスクは Cloudflare resource を消費しない。secret 配置のみ |
| 新規 secret hygiene 経路 | 対象外 | 既存 1Password / scripts/cf.sh / op CLI を流用、新規 secret 管理経路 0 |
| a11y (WCAG 2.1) | 対象外 | UI なし。`apps/web` を触らない |
| free-tier-estimation.md | 不要 | 上記 3 項目が対象外のため別ファイル化しない |

## 検証コマンド（SSOT）

```bash
WF=docs/30-workflows/ut-25-cloudflare-secrets-production-deploy

# 1. AC 引用整合
for ac in AC-1 AC-2 AC-3 AC-4 AC-5 AC-6 AC-7 AC-8 AC-9 AC-10 AC-11; do
  echo "${ac}: $(grep -rln "${ac}" "$WF" | wc -l)"
done

# 2. artifacts.json × phase ファイル
jq -r '.phases[].file' "$WF/artifacts.json" | sort > /tmp/expected_phases.txt
ls "$WF"/phase-*.md | xargs -n1 basename | sort > /tmp/actual_phases.txt
diff /tmp/expected_phases.txt /tmp/actual_phases.txt

# 3. 不変条件 #5
grep -rnE '\b(D1|drizzle|apps/web)\b.*GOOGLE_SERVICE_ACCOUNT_JSON' "$WF" || echo "OK: no D1 leakage"

# 4. CLAUDE.md ルール
grep -rnE 'bash scripts/cf\.sh|op read|op://' "$WF/phase-"*.md | wc -l
grep -rnE '^[^#>].*\bwrangler\b' "$WF/phase-"*.md | grep -vE 'scripts/cf\.sh' | grep -v reference || echo "OK: no direct wrangler"

# 5. secret 名・スコープ
grep -rnE 'GOOGLE[-_]?SERVICE[-_]?ACCOUNT[-_]?JSON' "$WF" | grep -v GOOGLE_SERVICE_ACCOUNT_JSON || echo "OK: name unified"

# 6. MINOR
grep -rn '\.dev\.vars' "$WF" | grep -E 'gitignore|除外'
grep -rnE '\-\-env.*(必須|漏れ|欠落)' "$WF"

# 7. Phase 11 が production 実投入を含まない
grep -nE 'secret put.*\-\-env production|\-\-env production.*secret put' "$WF/phase-11.md" || echo "OK: phase-11 staging only"

# 8. line budget / link / drift
wc -l "$WF"/phase-*.md "$WF"/outputs/phase-*/main.md
grep -rn '\](\.\./\|\](\./' "$WF" | head -20
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow "$WF" 2>/dev/null || echo "SKIP (spec_created)"
```

## QA チェックリスト（サマリー）

> 詳細は `outputs/phase-09/main.md`。本仕様書は観点のみ。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | AC-1〜AC-11 引用整合 | 全 AC hit ≥ 2 | spec_created |
| 2 | artifacts.json × phase 整合 | drift 0 | 実走可 |
| 3 | 不変条件 #5 不抵触 | D1 / apps/web 言及 0 | 実走可 |
| 4 | CLAUDE.md ルール | wrangler 直叩き 0 / op 経由 hit | 実走可 |
| 5 | secret 名一貫性 | 表記揺れ 0 | 実走可 |
| 6 | MINOR 解決 | UT25-M-01/02 両方 hit | spec_created |
| 7 | Phase 11 staging 限定 | production 実投入 0 件 | spec_created（Phase 11 作成後に確認） |
| 8 | line budget | 範囲内 | 実走可 |
| 9 | link 切れ | 0 | 実走可 |
| 10 | navigation drift | 0 | 実走可 |
| 11 | 無料枠 | 対象外 | resource 消費なし |
| 12 | secret hygiene | 対象外 | 既存経路流用 |
| 13 | a11y | 対象外 | UI なし |

## 実行手順

### ステップ 1: AC 引用整合の grep 検証
- AC-1〜AC-11 全件で hit ≥ 2 を確認。

### ステップ 2: artifacts.json × phase / outputs 整合
- jq + ls + find で完全一致確認。

### ステップ 3: 不変条件 #5 grep 検証
- D1 / drizzle / apps/web への secret 配置記述 0 件確認。

### ステップ 4: CLAUDE.md ルール grep 検証
- scripts/cf.sh / op read / 平文 .env 禁止 / wrangler login 禁止 の 4 項目。

### ステップ 5: secret 名・スコープ・配置先確認
- 表記揺れ 0 / `--env` 出現対称性 / wrangler.toml 参照網羅。

### ステップ 6: MINOR 解決状況確認
- UT25-M-01 / UT25-M-02 両方の grep hit。

### ステップ 7: Phase 11 staging 限定確認
- `phase-11.md` 内に production 実投入記述 0 件。

### ステップ 8: 対象外 3 項目明記
- 無料枠 / secret hygiene / a11y を理由付きで対象外と確定。

### ステップ 9: line budget / link / drift 確認
- `wc -l` / `grep` / `validate-phase-output.js` の 3 ツール。

### ステップ 10: outputs/phase-09/main.md 集約
- QA 13 項目を 1 ファイルに集約（spec_created プレースホルダ可）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | QA 13 項目の判定結果を GO/NO-GO 根拠に使用 |
| Phase 11 | staging smoke コマンド系列の grep 整合性を実走時に再確認 |
| Phase 12 | implementation-guide.md に検証コマンド SSOT を転記 |
| Phase 13 | PR description に QA サマリーを転記、本投入後の secret list 整合確認 |

## 多角的チェック観点（AIが判断）

- 価値性: 仕様書整合性 / ルール整合 / 不変条件 / secret 一貫性 / MINOR / Phase 11 限定 の 6 観点で Phase 10 GO/NO-GO 前にドリフトを検知できる。
- 実現性: grep / jq / find / 既存 validate-phase-output.js で完結、新規依存ゼロ。
- 整合性: 不変条件 #5 / Phase 8 SSOT / artifacts.json と一致。CLAUDE.md ブランチ戦略との二重正本 drift を grep で検出。
- 運用性: 検証コマンド SSOT 化により再現可能。
- 認可境界: 新規 secret 0、対象外明記。
- 無料枠: resource 消費なし、対象外明記。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC 引用整合 grep | 9 | spec_created | 全 11 件 hit ≥ 2 |
| 2 | artifacts.json × phase 整合 | 9 | spec_created | drift 0 |
| 3 | 不変条件 #5 grep | 9 | spec_created | D1 / apps/web 言及 0 |
| 4 | CLAUDE.md ルール grep | 9 | spec_created | 4 項目 |
| 5 | secret 一貫性 | 9 | spec_created | 表記揺れ 0 |
| 6 | MINOR 解決 | 9 | spec_created | UT25-M-01/02 |
| 7 | Phase 11 staging 限定 | 9 | spec_created | production 実投入 0 |
| 8 | 対象外 3 項目明記 | 9 | spec_created | 無料枠 / secret / a11y |
| 9 | line budget / link / drift | 9 | spec_created | validate-phase-output.js |
| 10 | outputs/phase-09/main.md 集約 | 9 | spec_created | QA 13 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA チェックリスト 13 項目の結果集約 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-11 引用整合が 11 件すべて確認済み
- [ ] artifacts.json × phase / outputs path drift 0
- [ ] 不変条件 #5 不抵触（D1 / apps/web 言及 0）
- [ ] CLAUDE.md 4 項目（cf.sh / op / 平文禁止 / wrangler login 禁止）すべて確認
- [ ] secret 名表記揺れ 0 / `--env` 対称性 / wrangler.toml 参照網羅
- [ ] UT25-M-01 / UT25-M-02 両方 hit
- [ ] Phase 11 内で production 実投入記述 0 件（spec_created 段階では Phase 11 作成後に再確認）
- [ ] 対象外 3 項目（無料枠 / secret hygiene / a11y）が理由付きで明記
- [ ] outputs/phase-09/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 対象外 3 項目が明記
- 検証コマンド SSOT が 1 箇所に集約
- artifacts.json の `phases[8].status` が `spec_created`

## 苦戦防止メモ

- AC 引用 grep は AC ID 表記を `AC-1` で固定。`AC1` / `AC_1` 等の表記揺れが 1 件でも混入すると検出漏れになるため、Phase 8 §用語統一で AC ID も対象に含める。
- artifacts.json × find 整合は Phase 11 / 12 / 13 の補助成果物（manual-smoke-log.md / implementation-guide.md / deploy-runbook.md 等）も含める。
- Phase 11 staging 限定は spec_created 段階では Phase 11 がまだ作成中の可能性があるため、Phase 11 作成完了直後に再 grep する運用を Phase 10 GO/NO-GO チェックリストに含める。
- CLAUDE.md ↔ runbook の二重正本 drift は continuous な monitoring が難しい。Phase 13 PR description で再確認するか、別タスクで GitHub Actions 化を検討（unassigned 候補）。

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QA 13 項目の判定結果（spec_created プレースホルダ）
  - AC 引用整合の grep 結果
  - artifacts.json × phase 整合性
  - CLAUDE.md ルール 4 項目の整合性
  - MINOR UT25-M-01 / UT25-M-02 の解決状況
  - 対象外 3 項目（無料枠 / secret hygiene / a11y）
- ブロック条件:
  - AC 引用 hit が 1 件でも 0
  - artifacts.json × phase に drift
  - 不変条件 #5 違反の grep hit
  - CLAUDE.md ルール 4 項目のいずれかが miss
  - Phase 11 が production 実投入を含む
