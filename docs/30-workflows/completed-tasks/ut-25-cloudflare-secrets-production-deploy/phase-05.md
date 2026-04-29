# Phase 5: 実装ランブック（投入手順スクリプト化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（前提確認 → ローカル → staging → 確認 → production → 確認 → runbook 反映） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending（仕様化のみ完了 / 実 put は Phase 13 ユーザー承認後の別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 4 で固定した T1〜T5 を Green にするための **7 ステップ実装ランブック** を仕様化する。コマンド系列（前提確認 / ローカル `.dev.vars` 設定 / staging put / staging list / production put / production list / runbook 反映）は本 Phase で**仕様レベルで定義**するが、**実行は禁止**。実 put は Phase 13 ユーザー承認後の別オペレーションでのみ走る（user_approval_required: true）。

本 Phase の主な成果物は **`outputs/phase-13/deploy-runbook.md` / `rollback-runbook.md` の骨格** を `outputs/phase-05/main.md` に擬似コードとして固定することである。

> **重要**: 本 Phase 冒頭で **UT-03 / 01b / 01c 完了 + 1Password SA JSON 保管 + Phase 13 ユーザー承認** の前提確認を必須化する。1 件でも未充足なら実投入不可（Phase 3 blocked 条件）。

## 前提確認【実投入着手前の必須ゲート】

実装担当者は **Step 1 に入る前に** 以下を確認する。1 件でも該当しない場合は実投入着手禁止。

```bash
# 1. UT-03 完了確認（参照側コードの存在）
test -f apps/api/src/jobs/sheets-fetcher.ts
grep -E "GOOGLE_SERVICE_ACCOUNT_JSON" apps/api/src/jobs/sheets-fetcher.ts

# 2. 01b 完了確認（apps/api wrangler.toml の env 宣言）
grep -E "^\[env\.staging\]"    apps/api/wrangler.toml
grep -E "^\[env\.production\]" apps/api/wrangler.toml

# 3. 01c 完了確認（1Password に SA JSON 保管）
op read 'op://Vault/SA-JSON/credential' | jq -e 'has("private_key")'
# => exit 0（実値はメモリ経由のみ。stdout に表示しない場合は redirect）

# 4. .gitignore 除外確認（T2）
grep -E '^\.dev\.vars$' apps/api/.gitignore
git check-ignore apps/api/.dev.vars

# 5. Phase 13 ユーザー承認の取得状態（実投入実行直前確認）
# → 取得済みでなければ Step 3 以降の put / delete を実行しない
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| UT-03 sheets-auth.ts | 存在 + secret 名参照 | 不在 / 別名参照 |
| wrangler.toml env 宣言 | `[env.staging]` / `[env.production]` 両方存在 | いずれか不在 |
| 1Password SA JSON | jq valid + `private_key` キー有 | parse error / key 欠落 |
| `.dev.vars` gitignore | 除外済み + check-ignore exit 0 | 除外漏れ / 過去 leak |
| Phase 13 ユーザー承認 | 取得済み | 未取得（put / delete 禁止） |

**1 つでも NO-GO 条件に該当 → 実投入着手禁止 → 本 Phase を pending に戻し UT-03 / 01b / 01c / Phase 3 blocked 条件解消へ。**

## 実行タスク

- タスク1: 前提確認を Step 0 として固定する。
- タスク2: lane 1 → lane 2 → lane 3 → lane 4 を 7 ステップに分離する。
- タスク3: staging-first 順序（staging 確認 PASS 後のみ production 着手）を Step 4〜5 ゲートで強制する。
- タスク4: rollback 経路（delete + 再 put）を `rollback-runbook.md` 骨格に組み込む。
- タスク5: 本 Phase で実 put / delete を実行しない境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-04.md | T1〜T5（Green 条件） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-02/main.md | 投入経路 bash 系列 / state ownership |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md §苦戦箇所 | 5 リスク |
| 必須 | scripts/cf.sh | wrangler ラッパー（op 注入 + esbuild 解決 + mise exec） |
| 必須 | CLAUDE.md（Cloudflare 系 CLI / シークレット管理） | 直接実行禁止 / op 経由注入 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#secret | wrangler secret 仕様 |

## 実行手順

1. Step 0 で前提確認を行い、NO-GO 条件を判定する。
2. Step 1〜7 を lane 順に実行する（**ただし Step 3〜6 の put は Phase 13 ユーザー承認後のみ**）。
3. Step 7 の runbook 反映結果は `outputs/phase-13/deploy-runbook.md` / `rollback-runbook.md` に保全する。

## 統合テスト連携

T1〜T5（Phase 4）を各 Step の Green 条件として参照し、Phase 6 の異常系（T6〜T11）で fail path を追加検証する。Phase 11 smoke は Step 1〜4（staging まで）を実走、Phase 13 で production まで含めて applied evidence を最終証跡化する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック骨格（NOT EXECUTED テンプレ）/ deploy-runbook.md / rollback-runbook.md の擬似コード |
| 別オペ成果（参考） | outputs/phase-13/deploy-runbook.md / rollback-runbook.md / secret-list-evidence-{staging,production}.txt | 本ワークフローでは生成しない（Phase 13 ユーザー承認後に実走者が生成） |

## 実装手順（7 ステップ / 仕様レベル）

### Step 0: 前提確認（必須・実 put 禁止）

- 上記「前提確認」を全項目クリア。
- Phase 13 ユーザー承認の取得状況を確認（未取得時は Step 3 以降の put 禁止）。
- T1〜T5 が現在 Red であることを確認（evidence ファイル未生成 / Workers Secret 未配置）。
- シェル履歴汚染防止: `export HISTFILE=/dev/null && set +o history`（Step 1 入る前）。

### Step 1: ローカル `.dev.vars` 設定（lane 1 / 副作用なし＋ローカルファイル作成）

```bash
# .gitignore 除外を再確認（T2）
grep -E '^\.dev\.vars$' apps/api/.gitignore || {
  echo ".dev.vars not gitignored — abort"; exit 1;
}
git check-ignore apps/api/.dev.vars

# .dev.vars に op 参照のみ書く（実値転記禁止）
# 例: GOOGLE_SERVICE_ACCOUNT_JSON='op://Vault/SA-JSON/credential'
# 実行時は scripts/with-env.sh が op run 経由で動的注入
```

- 確認: T2 が Green。
- 注意: `.dev.vars` に**実値を書かない**（CLAUDE.md ローカル `.env` 運用ルール）。op 参照のみ。

### Step 2: 投入前 stdin 改行保全確認（lane 2 / 副作用なし jq）

```bash
op read 'op://Vault/SA-JSON/credential' | jq -e 'has("private_key")'
op read 'op://Vault/SA-JSON/credential' | jq -r '.private_key' | grep -c 'BEGIN PRIVATE KEY'
# => exit 0 / >=1
```

- 確認: T4 が Green（put 経路の stdin が JSON valid + 改行保全済み）。

### Step 3: staging put（lane 2 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ **本 Phase ではコマンドを記述するが実行は禁止**。実 put は Phase 13 ユーザー承認後の別オペレーションで実走。

```bash
ENV_TARGET=staging  # T3: 変数経由で env を確定
op read 'op://Vault/SA-JSON/credential' | \
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$ENV_TARGET"
```

- 失敗時: 認証エラー / token 失効 → scripts/cf.sh が op 経由 `CLOUDFLARE_API_TOKEN` を再取得し再実行。
- コミット粒度: `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to staging [UT-25]`（**コミット 1**、evidence のみ）。

### Step 4: staging 確認（lane 2 / T1 Green）

```bash
bash scripts/cf.sh secret list \
  --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | tee outputs/phase-13/secret-list-evidence-staging.txt \
  | grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'
```

- 確認: T1 staging 側が Green / evidence ファイル生成。
- **staging 確認 PASS 後のみ Step 5 に進む**（staging-first 強制）。

### Step 5: production put（lane 3 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ Step 4 の staging 確認 PASS 後のみ実行可。

```bash
ENV_TARGET=production
op read 'op://Vault/SA-JSON/credential' | \
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$ENV_TARGET"
```

- コミット粒度: `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to production [UT-25]`（**コミット 2**、evidence のみ）。

### Step 6: production 確認（lane 3 / T1 Green）

```bash
bash scripts/cf.sh secret list \
  --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | tee outputs/phase-13/secret-list-evidence-production.txt \
  | grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'
```

- 確認: T1 production 側が Green。

### Step 7: runbook 反映（lane 4）

- `outputs/phase-13/deploy-runbook.md` に「YYYY-MM-DD: GOOGLE_SERVICE_ACCOUNT_JSON 配置完了（staging / production）」を追記。
- UT-03 runbook（`apps/api` 該当 docs）に配置完了行を追記。
- UT-26 引き渡し: 配置完了通知。
- コミット粒度: `docs(secrets): record UT-25 deploy / rollback runbook`（**コミット 3**、runbook + evidence）。

## rollback-runbook.md 骨格（Phase 13 で具体化）

### 通常 rollback（誤投入の巻き戻し / E1 採用）

```bash
ENV_TARGET=staging  # or production
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env "$ENV_TARGET"

# list で name 消失確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | grep -v GOOGLE_SERVICE_ACCOUNT_JSON

# 旧 key 再投入（1Password の前バージョン）
op read 'op://Vault/SA-JSON-prev/credential' | \
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$ENV_TARGET"

# 再投入後の name 復活確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "$ENV_TARGET" \
  | grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'
```

### 緊急 rollback（production で UT-26 が認証失敗を検出した場合）

1. UT-26 で認証失敗（401/403）を検出
2. `bash scripts/cf.sh secret delete --env production` で誤値を即時除去（fail-fast）
3. 1Password で旧 key を確認し、`op read | secret put --env production` で再投入
4. UT-26 を再実行して認証成功を確認
5. 担当者: solo 運用のため**実行者本人**

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to staging [UT-25]` | `secret-list-evidence-staging.txt` | name 出現 / `--env staging` 確定 |
| 2 | `chore(secrets): deploy GOOGLE_SERVICE_ACCOUNT_JSON to production [UT-25]` | `secret-list-evidence-production.txt` | staging PASS 後 / `--env production` 確定 |
| 3 | `docs(secrets): record UT-25 deploy / rollback runbook` | `deploy-runbook.md` / `rollback-runbook.md` | UT-26 引き渡し / 緊急 rollback 経路明記 |

> **3 コミット粒度を分離する理由**: staging / production / runbook を独立に revert 可能とし、片側だけのロールバック確定性を保つため。

## 検証コマンド（実装担当者向け / NOT EXECUTED）

```bash
# Step 0 完了後（前提確認の通過確認）
grep -E '^\.dev\.vars$' apps/api/.gitignore
grep -E '^\[env\.(staging|production)\]' apps/api/wrangler.toml

# Step 4 完了後（T1 staging）
grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b' outputs/phase-13/secret-list-evidence-staging.txt

# Step 6 完了後（T1 production）
grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b' outputs/phase-13/secret-list-evidence-production.txt

# Step 7 完了後
test -f outputs/phase-13/deploy-runbook.md
test -f outputs/phase-13/rollback-runbook.md
```

## 完了条件

- [ ] Step 0〜7 が `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] 前提確認（UT-03 / 01b / 01c / `.gitignore` / Phase 13 承認）が Step 0 ゲートとして明記されている
- [ ] 3 コミット粒度（staging / production / runbook）が分離設計されている
- [ ] staging-first 順序が Step 4 → Step 5 ゲートで強制されている
- [ ] rollback-runbook.md 骨格に通常 / 緊急の 2 経路が記載されている
- [ ] 緊急 rollback 担当者（solo = 実行者本人）が rollback-runbook.md 骨格に明記されている
- [ ] 本ワークフローで実 `wrangler secret put` / `secret delete` を実行しない旨が明示されている

## 多角的チェック観点（AIが判断）

- `bash scripts/cf.sh` 経由で wrangler を呼んでいるか（直接 wrangler 呼出が無いか）。
- Step 1〜2 が副作用なし（put 系を含まない）であり、Step 3 以降の put は Phase 13 承認後限定であることが明示されているか。
- `op read | stdin pipe` 経路で値がプロセス引数 / ファイル / 履歴に残らない構造になっているか。
- staging-first が Step 4 → 5 のゲートで強制されているか（staging skip 経路が無いか）。
- rollback の delete + 再 put（E1）が骨格に組み込まれており、上書き put（E2）に退化していないか。
- `.dev.vars` への実値書き込み禁止が明記されているか（op 参照のみ）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Step 0 前提確認 | 5 | pending | 5 項目ゲート |
| 2 | Step 1 ローカル `.dev.vars` | 5 | pending | op 参照のみ |
| 3 | Step 2 stdin valid 確認 | 5 | pending | T4 |
| 4 | Step 3〜4 staging | 5 | pending | T1 / Phase 13 承認後 |
| 5 | Step 5〜6 production | 5 | pending | staging PASS 後 |
| 6 | Step 7 runbook 反映 | 5 | pending | UT-26 引き渡し |
| 7 | rollback-runbook 骨格 | 5 | pending | E1 通常 + 緊急 |

## 苦戦防止メモ

1. **前提未充足で着手しない**: UT-03 / 01b / 01c のいずれか欠落で put → 参照側不在 / env 不在 / 投入元不在の事故。Step 0 ゲートで block。
2. **staging skip 禁止**: Step 4 PASS なしで Step 5 に進むと production 単独 GO となり運用性 MAJOR。
3. **stdin パイプ以外を採用しない**: tty 直接入力は自動化不可・履歴に残るリスク。`cat sa.json` はディスク残留。`op read` 直接 stdin が第一選択。
4. **`.dev.vars` に実値を書かない**: CLAUDE.md ローカル `.env` 運用ルール違反。AI 学習混入事故防止。
5. **rollback 上書き put 禁止**: 誤値が runtime に残る fail-fast 違反。delete + 再 put の 2 段階を維持。
6. **本 Phase 自身は実 put しない**: 仕様化のみ。Step 3〜6 の実走は Phase 13 ユーザー承認後の別オペレーション。

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が `outputs/phase-05/main.md` に反映
- Step 0〜7 と rollback-runbook 骨格の両方が記述されている
- artifacts.json の `phases[4].status` は `pending`

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 3 コミット粒度の分離が異常系（`--env` 漏れ / op 失敗 / 改行破損 / list 遅延 / `.dev.vars` 値ずれ）の前提
  - Step 0 の前提確認 5 項目が異常系の入力（前提未充足 = 異常系の発生源）
  - Step 3 / 5 の実 put は Phase 13 ユーザー承認後（user_approval_required: true）
- ブロック条件:
  - Step 0 前提確認ゲートが欠落
  - staging-first ゲート（Step 4 → 5）が手順から欠落
  - `.dev.vars` への実値書き込みが手順に含まれる
  - rollback が上書き put に退化
  - 緊急 rollback 担当者明記が rollback-runbook 骨格に無い
