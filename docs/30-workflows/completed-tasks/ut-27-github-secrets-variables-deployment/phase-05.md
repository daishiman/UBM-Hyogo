# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（前提確認 → environment 作成 → secret 配置 → variable 配置 → 動作確認 + 同期検証） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending（仕様化のみ完了 / 実 PUT は Phase 13 ユーザー承認後の別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 4 で固定した T1〜T5 を Green にするための **6 ステップ実装ランブック** を仕様化する。コマンド系列（`gh api ... environments PUT` / `gh secret set` / `gh variable set` / dev push smoke / 1Password Last-Updated 更新）は本 Phase で **仕様レベルで定義** するが、**実行は禁止**。実 PUT / push は Phase 13 ユーザー承認後の別オペレーションでのみ走る（user_approval_required: true）。

> **重要**: 本 Phase 冒頭で **上流 3 件（UT-05 / UT-28 / 01b）completed の前提確認** を必須化する。1 件でも未完了の場合は実装着手不可（Phase 3 NO-GO 条件）。

## 上流 3 件完了の前提確認【実装着手前の必須ゲート】

実装担当者は **Step 1 に入る前に** 以下を確認する。1 件でも該当した場合は実装着手禁止 → Phase 3 NO-GO へ差し戻す。

```bash
# 上流 3 件完了確認（必須・GET / 文書確認のみ / 副作用なし）
gh pr list --search "UT-05" --state merged --json number,title    # UT-05 マージ確認
grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml  # 参照キー確認
bash scripts/cf.sh pages project list                              # UT-28 Pages project 名確定
op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token_staging,account_id | jq 'keys'  # 01b で 1Password に値存在
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| UT-05 task `status` | `completed`（PR マージ済み） | `pending` / `in_progress` |
| `.github/workflows/{backend-ci,web-cd}.yml` の secret/variable 参照 | 4 キー（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` / `CLOUDFLARE_PAGES_PROJECT`）すべて参照 | いずれか欠落 / 別名 |
| UT-28 task `status` | `completed`（Cloudflare Pages project 命名確定） | 命名未確定 |
| 01b task `status` | `completed`（API Token 発行 / Account ID 取得 / 1Password Item 存在） | いずれか欠落 |
| Phase 13 ユーザー承認 | 取得済み | 未取得（Step 2 以降の `gh api PUT` / `gh secret set` / `gh variable set` / `git push origin dev` 禁止） |
| Discord 通知の代替設計（評価不能 if 対策） | env 受け + シェル空文字判定で実装済み | 旧パターン（`if: secrets.X != ''`）残存 → Phase 12 unassigned で UT-05 にフィードバック |

**1 つでも NO-GO 条件に該当 → 実装着手禁止 → 本 Phase を pending に戻し UT-05 / UT-28 / 01b 着手 へ。**

## 実行タスク

- タスク1: 上流 3 件完了ゲートを Step 0 として固定する。
- タスク2: environment 作成 / secret 配置 / variable 配置 / 動作確認 / 同期検証 を 6 ステップに分離する。
- タスク3: 同名 repository / environment 併存禁止と Variable / Secret 分離を全 Step で徹底する。
- タスク4: secret 値を一切 payload / runbook / Phase outputs / 検証コマンド出力に転記しない（`op://...` 参照のみ）。
- タスク5: 本 Phase で実 PUT / `git push` を実行しない境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-04.md | T1〜T5（Green 条件） |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | 配置決定マトリクス / `gh` CLI コマンド草案 / 1Password 同期手順 |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md §苦戦箇所・知見 | Token 最小スコープ / 同名併存リスク / 評価不能 if 問題 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI 実行ルール） | `op` 一時注入パターン / `scripts/cf.sh` 思想 |
| 必須 | .github/workflows/{backend-ci,web-cd}.yml | 配置先キー名の最終突合 |
| 参考 | https://docs.github.com/en/rest/actions/secrets | Secrets REST API |
| 参考 | https://docs.github.com/en/rest/actions/variables | Variables REST API |
| 参考 | https://docs.github.com/en/rest/deployments/environments | Environments REST API |

## 実行手順

1. Step 0 で上流 3 件完了 / Phase 13 承認状態を確認し、NO-GO 条件を判定する。
2. Step 1〜5 を lane 1〜5 順に実行する（**ただし Step 2 / 3 / 4 / 5 の `gh api PUT` / `gh secret set` / `gh variable set` / `git push origin dev` は Phase 13 ユーザー承認後のみ**）。
3. Step 5 の動作確認結果は `outputs/phase-13/verification-log.md` / `outputs/phase-11/manual-smoke-log.md` に保全する。同期検証結果は `outputs/phase-13/op-sync-runbook.md` に追記。

## 統合テスト連携

T1〜T5（Phase 4）を各 Step の Green 条件として参照し、Phase 6 の異常系（T6〜T11）で fail path を追加検証する。Phase 11 smoke は Step 5 を実走、Phase 13 で apply-runbook.md / op-sync-runbook.md / verification-log.md を最終証跡化する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック（NOT EXECUTED テンプレ） |
| 別オペ成果（参考） | outputs/phase-13/apply-runbook.md / outputs/phase-13/op-sync-runbook.md / outputs/phase-13/verification-log.md / outputs/phase-11/manual-smoke-log.md | 本ワークフローでは生成しない（Phase 13 ユーザー承認後に実走者が生成） |

## 実装手順（6 ステップ / 仕様レベル）

### Step 0: 前提確認（必須・実 PUT 禁止）

- 上記「上流 3 件完了の前提確認」を全項目クリア。
- Phase 13 ユーザー承認の取得状況を確認（未取得時は Step 2 以降の `gh api PUT` / `gh secret set` / `gh variable set` / `git push origin dev` 禁止）。
- T1〜T5 が現在 Red であることを確認（Secret / Variable / Environment が未配置 / dev push 後の CD が green になっていない）。

### Step 1: 上流確認 inventory（lane 1 / 副作用なし GET）

```bash
# workflow 参照キーの最終突合（PUT ではないので Phase 13 承認前でも可）
grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml \
  > /tmp/ut-27-workflow-keys.txt

# 1Password エントリ存在確認（field 存在のみ確認 / 値は出力しない）
op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token_staging,api_token_production,account_id | jq 'keys'
op item get "Discord"    --vault UBM-Hyogo --format json --fields webhook_url | jq 'keys'

# Cloudflare Pages project 名確定（UT-28 結果）
bash scripts/cf.sh pages project list
```

- 確認: 4 キー（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` / `CLOUDFLARE_PAGES_PROJECT`）が `/tmp/ut-27-workflow-keys.txt` に出現 / 1Password 側 field が全件存在 / Pages project 名が判明。
- 結果は `outputs/phase-13/verification-log.md §upstream` に転記（**値ではなくキー存在のみ**）。

### Step 2: environment 作成（lane 2 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ **本 Phase ではコマンドを記述するが実行は禁止**。実 PUT は Phase 13 ユーザー承認後の別オペレーションで実走。

```bash
# staging / production の 2 環境を独立 PUT（bulk 化禁止）
gh api repos/daishiman/UBM-Hyogo/environments/staging    -X PUT --silent
gh api repos/daishiman/UBM-Hyogo/environments/production -X PUT --silent

# 確認
gh api repos/daishiman/UBM-Hyogo/environments --jq '.environments[].name' | sort
# => production
# => staging
```

- 確認: T1 §3.1 の #6 / #7（environment 2 件存在）が Green。
- 失敗時: 403 → `gh auth status` で `administration:write` スコープ不足を疑う / `gh auth refresh -s admin:repo_hook,repo` で再認証。
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで `outputs/phase-13/apply-runbook.md` に手順追記する形でコミット 1）。

### Step 3: secret 配置（lane 3 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ 値は **`op read` 経由でサブシェル内に閉じ込め**、`--body "$(op read ...)"` の one-shot ラッパーで投入する。一時変数を使う場合は直後に `unset`。

```bash
# 前提: gh auth login 済み / op signin 済み

# repository-scoped Secret（2 件）
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$(op read 'op://UBM-Hyogo/Cloudflare/account_id')"
gh secret set DISCORD_WEBHOOK_URL   --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"

# environment-scoped Secret（CLOUDFLARE_API_TOKEN を staging / production 別 token で配置）
gh secret set CLOUDFLARE_API_TOKEN --env staging    --body "$(op read 'op://UBM-Hyogo/Cloudflare/api_token_staging')"
gh secret set CLOUDFLARE_API_TOKEN --env production --body "$(op read 'op://UBM-Hyogo/Cloudflare/api_token_production')"

# 配置完了確認（T1 §3.1 #1〜#4）
gh secret list                          --json name --jq '.[].name' | sort
gh secret list --env staging            --json name --jq '.[].name' | sort
gh secret list --env production         --json name --jq '.[].name' | sort

# scope boundary 確認（T2 / 同名併存禁止）
comm -12 \
  <(gh secret list                --json name --jq '.[].name' | sort) \
  <(gh secret list --env staging  --json name --jq '.[].name' | sort)
# => 出力空（積集合なし）
```

- 確認: T1（配置完了）/ T2（scope boundary）が Green。
- 1Password Item Notes に Last-Updated 日時を追記（**値ハッシュは記載しない**）:

  ```bash
  op item edit "Cloudflare" --vault UBM-Hyogo \
    notesPlain="Last-Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ) by UT-27 Phase 5 Step 3"
  ```

- 失敗時:
  - 401 / 403 → `gh auth status` で `actions:write` スコープ確認
  - 404（environment-scoped 配置時） → Step 2 完了済みか確認、未完了なら Step 2 に戻る
  - 1Password 値取得失敗 → `op signin` 再実行
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで `outputs/phase-13/apply-runbook.md §secrets` / `outputs/phase-13/op-sync-runbook.md` に手順追記する形でコミット 2）。

### Step 4: variable 配置（lane 4 / **Phase 13 ユーザー承認後のみ実行**）

```bash
# UT-28 で確定したプロジェクト名（例: ubm-hyogo-web）
gh variable set CLOUDFLARE_PAGES_PROJECT --body "ubm-hyogo-web"

# 配置完了確認（T1 §3.1 #5）
gh variable list --json name,value --jq '.[] | select(.name == "CLOUDFLARE_PAGES_PROJECT")'

# Variable / Secret 分離確認（T2 / Variable 化理由）
gh secret list --json name --jq '.[].name' | rg -v CLOUDFLARE_PAGES_PROJECT
# => Secret 側に出現しない
```

- 確認: T1 #5 / T2 §4.1（Variable 側のみ存在）が Green。
- **Variable は値マスクされない**ため CI ログで suffix 連結結果（`ubm-hyogo-web-staging`）の visibility が確保される（親仕様 §「Variable にする理由」）。
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで `outputs/phase-13/apply-runbook.md §variables` に手順追記する形でコミット 3）。

### Step 5: 動作確認 + 同期検証（lane 5 / **Phase 13 ユーザー承認後のみ実行**）

#### 5.1 dev push smoke（T3）

```bash
# dev branch で空コミット → push → CD 観測
git checkout dev
git pull --ff-only origin dev
git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"
git push origin dev

# CD 結果観測
gh run watch
gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
# => success
gh run list --workflow web-cd.yml     --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
# => success

# CLOUDFLARE_PAGES_PROJECT 値の visibility 確認（Variable のためマスクされていない）
RUN_ID=$(gh run list --workflow web-cd.yml --branch dev --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$RUN_ID" --log | rg -F "$(gh variable get CLOUDFLARE_PAGES_PROJECT)"
# => 平文ヒット
```

- 確認: T3（dev push → CD green）が Green。
- 失敗時:
  - 401 → Step 3 の `CLOUDFLARE_API_TOKEN` を再配置（1Password から再注入）
  - 404 → `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_PAGES_PROJECT` 値の整合確認
  - ログマスク（`***`）→ `CLOUDFLARE_PAGES_PROJECT` を誤って Secret 化していないか確認

#### 5.2 Discord 未設定耐性確認（T4 ケース B）

```bash
# 一時的に DISCORD_WEBHOOK_URL を削除 → CI green 維持を確認 → 復元
gh secret delete DISCORD_WEBHOOK_URL
git commit --allow-empty -m "chore(cd): smoke without discord [UT-27]"
git push origin dev
gh run watch
gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
# => success（通知ステップが early-return）

# 復元（one-shot ラッパー / shell history に値残らず）
gh secret set DISCORD_WEBHOOK_URL --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"
```

- 確認: T4 ケース B（未設定耐性）が Green。CI green 維持できなければ UT-05 への workflow 修正フィードバックを Phase 12 unassigned-task-detection.md に登録。

#### 5.3 1Password 同期検証（T5）

```bash
# Last-Updated メモ確認
op item get "Cloudflare" --vault UBM-Hyogo --format json | jq -r '.notes' | rg "Last-Updated"

# GitHub 側 updatedAt との乖離確認
gh secret list --json name,updatedAt --jq '.[] | select(.name == "CLOUDFLARE_API_TOKEN")'
gh secret list --env staging    --json name,updatedAt --jq '.[] | select(.name == "CLOUDFLARE_API_TOKEN")'
gh secret list --env production --json name,updatedAt --jq '.[] | select(.name == "CLOUDFLARE_API_TOKEN")'
```

- 確認: T5（同期検証）が Green。
- リハーサル結果を `outputs/phase-11/manual-smoke-log.md` / `outputs/phase-13/verification-log.md` / `outputs/phase-13/op-sync-runbook.md` に記録（**値・ハッシュは記載しない / 日時とキー名のみ**）。
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで verification-log.md / op-sync-runbook.md にコミット 4）。

## コミット粒度（Phase 13 別オペ側で実施）

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `docs(cd): record UT-27 environments creation runbook` | apply-runbook.md §environments | staging / production 独立 PUT / `administration:write` スコープ |
| 2 | `docs(cd): record UT-27 secrets sync runbook` | apply-runbook.md §secrets / op-sync-runbook.md | one-shot `op read` パターン / Last-Updated 更新 / 値転記なし |
| 3 | `docs(cd): record UT-27 variables placement runbook` | apply-runbook.md §variables | `CLOUDFLARE_PAGES_PROJECT` Variable 配置 / Secret 側不在確認 |
| 4 | `docs(cd): record UT-27 verification log (dev push smoke / discord resilience / op sync)` | verification-log.md / manual-smoke-log.md | T3 / T4 / T5 の結果（値・ハッシュなし） |

> **4 コミット粒度を分離する理由**: 配置領域（environment / secret / variable / 検証）ごとに 1 コミットに保ち、片方向の revert で部分復元可能にする。secret 値を含むコマンド出力をコミット差分に含めない境界を明示する。

## one-shot ラッパーパターン（secret 値の shell history 残存防止）

| パターン | 例 | 理由 |
| --- | --- | --- |
| `$(op read ...)` 直接埋め込み（推奨） | `gh secret set X --body "$(op read 'op://...')"` | サブシェル内で揮発、shell history に値が残らない |
| 一時 export + `unset`（次善） | `export TMP=$(op read ...); gh secret set X --body "$TMP"; unset TMP` | env 経由で複数 set に再利用可だが unset 漏れリスク |
| `op run --env-file=.env` 経由（Cloudflare 系のみ） | `bash scripts/cf.sh ...` | `scripts/cf.sh` が `op run` でラップ、ファイル化なし |
| ❌ ファイル化 | `op read ... > /tmp/token; gh secret set X --body "$(cat /tmp/token)"` | ディスク残存リスク。**禁止** |
| ❌ 引数直書き | `gh secret set X --body "actual-token-value"` | shell history・スクリーンレコーディング・スクショ残存。**禁止** |

## 検証コマンド（実装担当者向け / NOT EXECUTED）

```bash
# Step 1 完了後
test -s /tmp/ut-27-workflow-keys.txt && rg -c "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|DISCORD_WEBHOOK_URL|CLOUDFLARE_PAGES_PROJECT" /tmp/ut-27-workflow-keys.txt
# => 4 以上

# Step 2 完了後（Phase 13 承認後）
gh api repos/daishiman/UBM-Hyogo/environments --jq '[.environments[].name] | sort'
# => ["production","staging"]

# Step 3 完了後（T1 / T2）
gh secret list --json name --jq '[.[].name] | sort'
gh secret list --env staging --json name --jq '[.[].name] | sort'
gh secret list --env production --json name --jq '[.[].name] | sort'
comm -12 <(gh secret list --json name --jq '.[].name' | sort) <(gh secret list --env staging --json name --jq '.[].name' | sort)
# => 出力空

# Step 4 完了後（T1 #5 / T2 §4.1）
gh variable list --json name --jq '.[].name' | rg CLOUDFLARE_PAGES_PROJECT
gh secret   list --json name --jq '.[].name' | rg -v CLOUDFLARE_PAGES_PROJECT

# Step 5 完了後（T3 / T4 / T5 / Phase 13 承認後）
gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
gh run list --workflow web-cd.yml     --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
op item get "Cloudflare" --vault UBM-Hyogo --format json | jq -r '.notes' | rg "Last-Updated"
```

## 完了条件

- [ ] Step 0〜5 が `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] 上流 3 件完了確認が Step 0 ゲートとして明記されている
- [ ] 4 コミット粒度（environments / secrets / variables / verification-log）が Phase 13 別オペ側の分離設計として明記されている
- [ ] one-shot `op read` ラッパーパターンが Step 3 で徹底されている
- [ ] 同名 repository / environment 併存禁止（T2）の積集合確認が Step 3 に組み込まれている
- [ ] `CLOUDFLARE_PAGES_PROJECT` の Variable 化（Secret 側不在）が Step 4 で確認されている
- [ ] Discord 未設定耐性（T4 ケース B）の一時 delete + 復元手順が Step 5.2 にある
- [ ] 1Password Last-Updated メモ更新（値ハッシュ記載禁止）が Step 3 / Step 5.3 にある
- [ ] 本ワークフローで実 `gh api PUT` / `gh secret set` / `gh variable set` / `git push origin dev` を実行しない旨が明示されている

## 苦戦防止メモ

1. **上流 3 件未完了で着手しない**: 値ミスマッチで CI 401 / 404 事故。Step 0 ゲートで block。
2. **同名 repository / environment 併存禁止**: environment-scoped が黙って勝つため監査時の混乱源。Step 3 末尾の `comm -12` で積集合 = 空を確認（T2）。
3. **`CLOUDFLARE_PAGES_PROJECT` を Secret 化しない**: ログマスクで suffix 連結デバッグ不能（親仕様 §「Variable にする理由」）。Step 4 で Variable 配置 + Secret 側不在を毎回確認。
4. **secret 値を一切転記しない**: payload / runbook / Phase outputs / 検証コマンド出力 / 1Password Notes へのハッシュ転記すら禁止。`op://...` 参照と Last-Updated 日時のみ記述（AC-13）。
5. **one-shot `op read` ラッパー必須**: 一時変数 + `unset` パターンは unset 漏れで shell history に残るリスク。`$(op read ...)` 直接埋め込みを優先（Step 3 / Step 5.2）。
6. **Discord 未設定耐性は実コマンドで一時 delete + 復元**: workflow `if` の静的読みでは GitHub Actions の評価不能問題は再現しない。Step 5.2 で実走。未対応なら Phase 12 unassigned で UT-05 にフィードバック。
7. **本 Phase 自身は実 PUT / push しない**: 仕様化のみ。Step 2〜5 の実走は Phase 13 ユーザー承認後の別オペレーション。
8. **GitHub UI 直編集禁止**: 1Password 正本 / GitHub 派生 の境界が崩れる。Step 5.3 で updatedAt 乖離検出。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 4 コミット粒度の分離が異常系（401 / 404 / 同名併存 / Variable 誤 Secret 化 / 評価不能 if / 二重正本 drift）の前提
  - Step 1 の上流確認 inventory が Phase 6 異常系の入力
  - Step 2〜5 の実 PUT / push は Phase 13 ユーザー承認後（user_approval_required: true）
  - Discord 未設定耐性（T4 ケース B / Step 5.2）の workflow 代替設計が UT-05 に未組込なら Phase 12 でフィードバック起票
- ブロック条件:
  - 上流 3 件完了確認ゲートが Step 0 から欠落
  - 同名 repository / environment 併存禁止（T2）が Step 3 から欠落
  - `CLOUDFLARE_PAGES_PROJECT` の Variable 化（T2 §4.1）が Step 4 から欠落
  - one-shot `op read` ラッパーパターンが Step 3 で守られていない
  - secret 値が Step 例 / 検証コマンド / コミット粒度説明に直書きされている
