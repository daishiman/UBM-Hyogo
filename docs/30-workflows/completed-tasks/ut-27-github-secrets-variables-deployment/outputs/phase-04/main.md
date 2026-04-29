# Phase 4 成果物 — テスト戦略

## 1. テスト戦略サマリ

UT-27 base case（案 A: `gh` CLI 直接実行 + 1Password 手動同期 / lane 1〜5 直列）に対し、**T1〜T5 の 5 ケース**を Phase 5 着手前の Green 条件として固定する。本タスクは UI 変更なし（NON_VISUAL）かつ secrets / variables 配置タスクのため、ユニットテストではなく **配置後の挙動検証マトリクス** として定義する。実走は Phase 5 / Phase 6 / Phase 11 / Phase 13（ユーザー承認後配置）に委譲し、本 Phase はコマンド系列・期待値・Red 状態の正本化のみを行う。`gh secret set` / `gh variable set` / `gh api ... -X PUT` / `git push origin dev` は本 Phase で実行しない。

## 2. 前提条件（NO-GO ゲート再確認）

- 上流 3 件（UT-05 / UT-28 / 01b）が completed であること（Phase 1 / 2 / 3 で 3 重明記済み）。
- Phase 13 のユーザー承認（user_approval_required: true）が未完了の状態では、本テストの **実走は禁止**（仕様確認のみ）。
- secret 値を一切 payload / runbook / Phase outputs / 検証コマンド出力に転記しない（AC-13）。`op://Vault/Item/Field` 参照のみ記述する。

## 3. T1: 配置完了検証（Secret / Variable / Environment が GitHub に存在する）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 lane | lane 2 + lane 3 + lane 4 |
| 検証コマンド | `gh secret list` / `gh secret list --env staging` / `gh secret list --env production` / `gh variable list` / `gh api repos/daishiman/UBM-Hyogo/environments --jq '.environments[].name'` |
| 期待値 | Secrets: repository scope に `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` の 2 件 / environment scope に `CLOUDFLARE_API_TOKEN` が staging / production 各 1 件存在。Variables: `CLOUDFLARE_PAGES_PROJECT` が repository scope に存在。Environments: `staging` / `production` の 2 件存在 |
| Red 状態 | いずれかの key 未配置 / environment 未作成 / 同名 repository / environment 併存 |
| 失敗時切り分け | (a) `gh api` 認証スコープ不足（`administration:write` 欠如で environments PUT 失敗） / (b) lane 2 の environment 作成 skip → environment-scoped secret PUT が 404 / (c) Phase 2 配置決定マトリクスの scope 列と実配置が乖離 |

### 3.1 配置完了チェックリスト（T1 突合用）

| # | 種別 | 名前 | scope | 期待存在数 | 検証 jq |
| --- | --- | --- | --- | --- | --- |
| 1 | Secret | `CLOUDFLARE_ACCOUNT_ID` | repository | 1 | `gh secret list --json name --jq '[.[] \| select(.name=="CLOUDFLARE_ACCOUNT_ID")] \| length'` => 1 |
| 2 | Secret | `DISCORD_WEBHOOK_URL` | repository | 1 | 同上 name 条件 |
| 3 | Secret | `CLOUDFLARE_API_TOKEN` | environment(staging) | 1 | `gh secret list --env staging --json name --jq '...'` => 1 |
| 4 | Secret | `CLOUDFLARE_API_TOKEN` | environment(production) | 1 | `gh secret list --env production --json name --jq '...'` => 1 |
| 5 | Variable | `CLOUDFLARE_PAGES_PROJECT` | repository | 1 | `gh variable list --json name --jq '...'` => 1 |
| 6 | Environment | `staging` | repository | 1 | `gh api repos/daishiman/UBM-Hyogo/environments --jq '[.environments[] \| select(.name=="staging")] \| length'` => 1 |
| 7 | Environment | `production` | repository | 1 | 同上 production |

## 4. T2: 配置スコープ boundary 検証（同名併存禁止 / Secret vs Variable 分離）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 lane | lane 3 + lane 4 |
| 検証コマンド | (1) `gh secret list --json name --jq '.[].name' \| sort > /tmp/sec-repo.txt` / (2) `gh secret list --env staging --json name --jq '.[].name' \| sort > /tmp/sec-stg.txt` / (3) `comm -12 /tmp/sec-repo.txt /tmp/sec-stg.txt`（積集合 = 空） / 同 production / (4) `gh variable list --json name --jq '.[].name' \| rg CLOUDFLARE_PAGES_PROJECT` / (5) `gh secret list --json name --jq '.[].name' \| rg -v CLOUDFLARE_PAGES_PROJECT`（Secret 側不在確認） |
| 期待値 | repository-scoped と environment-scoped の同名併存 0 件。`CLOUDFLARE_PAGES_PROJECT` が Variable 側のみ存在し Secret 側に同名なし |
| Red 状態 | `CLOUDFLARE_API_TOKEN` が repository / environment 両方に存在 / `CLOUDFLARE_PAGES_PROJECT` が Secret 側にも存在（ログマスク事故） |
| 失敗時切り分け | (a) lane 3 で repository-scoped にも安全側コピーした事故 / (b) Phase 2「同名併存禁止」運用ルール未徹底 / (c) Variable と Secret の混同（親仕様 §Variable 化理由 違反） |

### 4.1 scope boundary 不変条件

| 不変条件 | 期待 | 違反時の影響 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` の repository scope 不在 | `gh secret list --json name \| jq '[.[] \| select(.name=="CLOUDFLARE_API_TOKEN")] \| length'` => 0 | environment-scoped が黙って勝つため監査不能 / staging で production 値誤参照のリスク |
| `CLOUDFLARE_PAGES_PROJECT` の Secret 側不在 | `gh secret list` に出現しない | CI ログでマスクされ suffix 連結デバッグ不能 |
| `CLOUDFLARE_ACCOUNT_ID` の environment scope 不在 | `gh secret list --env {staging,production}` に出現しない | 同一アカウント前提が崩れる / 配置決定マトリクス Phase 2 と乖離 |

## 5. T3: dev push → CD green smoke（実稼働化の最終確認）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 lane | lane 5 |
| 検証コマンド | (1) `git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"` / (2) `git push origin dev` / (3) `gh run watch` / (4) `gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'` => `success` / (5) 同 `web-cd.yml` |
| 期待値 | `backend-ci.yml` の `deploy-staging` が green / `web-cd.yml` の `deploy-staging` が green / ログ上で `CLOUDFLARE_PAGES_PROJECT` の suffix 連結結果（例: `ubm-hyogo-web-staging`）が visible（Variable のためマスクされない） |
| Red 状態 | 401（API Token スコープ不足 or 値未配置）/ 404（`CLOUDFLARE_ACCOUNT_ID` 不一致 or Pages project 不在）/ ログに `CLOUDFLARE_PAGES_PROJECT` 値が `***` でマスク |
| 失敗時切り分け | (a) `gh secret list --env staging` で `CLOUDFLARE_API_TOKEN` 不在 / (b) Token スコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read を満たさない / (c) UT-28 の Pages project 命名と Variable 値の乖離 / (d) `CLOUDFLARE_PAGES_PROJECT` を誤って Secret 化 |

### 5.1 CD smoke 観測ポイント

| 観測 | 取得元 | green 条件 |
| --- | --- | --- |
| backend-ci.yml deploy-staging conclusion | `gh run list --workflow backend-ci.yml --branch dev --limit 1` | `success` |
| web-cd.yml deploy-staging conclusion | `gh run list --workflow web-cd.yml --branch dev --limit 1` | `success` |
| `CLOUDFLARE_PAGES_PROJECT` 値の visibility | `gh run view <run-id> --log \| rg -F "$(gh variable get CLOUDFLARE_PAGES_PROJECT)"` | 平文ヒット（マスクされていない） |
| Cloudflare 側デプロイ完了 | `bash scripts/cf.sh pages deployment list --project-name=...` | latest が `success` |

## 6. T4: Discord 通知到達 / 未設定耐性検証（評価不能 if 問題への対処確認）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 lane | lane 5 |
| ケース A 検証 | (1) `gh secret list --json name --jq '.[].name' \| rg DISCORD_WEBHOOK_URL` で存在確認 / (2) dev push 後に Discord チャンネルで通知到達を目視 |
| ケース B 検証 | (1) 一時的に `gh secret delete DISCORD_WEBHOOK_URL` / (2) `git commit --allow-empty -m "chore(cd): smoke without discord [UT-27]"` && `git push origin dev` / (3) `gh run view <run-id> --log` で通知ステップが skip / early-return しジョブ全体が green を維持することを確認 / (4) `gh secret set DISCORD_WEBHOOK_URL --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"` で復元 / (5) `unset` 不要（サブシェル内で揮発） |
| 期待値 | ケース A: Discord にメッセージ到達 / ケース B: 通知ステップが空文字判定で early-return し CI 全体は green。`if: ${{ always() && secrets.X != '' }}` の評価不能で無音失敗していない |
| Red 状態 | ケース B で CI 全体が red / 通知ステップが起動して webhook 401 でジョブを巻き込み red 化 / `secrets.X != ''` 条件が常に true 評価で空通知が送信される |
| 失敗時切り分け | (a) workflow 側で `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` パターン残存 → UT-05 にフィードバック起票（Phase 12 unassigned） / (b) env 受け + シェル空文字判定の代替設計が未導入 / (c) ケース B 復元時に `op read` 出力をシェル history に残す事故 |

### 6.1 評価不能 if 問題の代替設計（UT-05 への期待形）

```yaml
# 期待されるパターン（UT-05 側に組み込み済みの確認 / 未組込なら Phase 12 でフィードバック）
- name: Notify Discord
  if: always()
  env:
    WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
  run: |
    if [ -z "$WEBHOOK" ]; then
      echo "DISCORD_WEBHOOK_URL not configured; skipping notification" >&2
      exit 0
    fi
    curl -fsS -X POST -H 'Content-Type: application/json' -d '{"content":"..."}' "$WEBHOOK"
```

> 上記が `web-cd.yml` / `backend-ci.yml` に存在することを T4 ケース B 実行前に `grep` で確認する。未組込なら本タスク完了時に UT-05 へフィードバックとして Phase 12 unassigned-task-detection.md に登録。

## 7. T5: 1Password 同期検証（正本 ↔ 派生コピー drift チェック）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 lane | lane 5 |
| 検証コマンド | (1) `op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token_staging,account_id \| jq 'keys'`（**field 存在のみ確認 / 値は出力しない**） / (2) `op item get "Cloudflare" --vault UBM-Hyogo --format json \| jq -r '.notes' \| rg "Last-Updated"` で Last-Updated メモ確認 / (3) `gh secret list --json name,updatedAt --jq '.[] \| select(.name == "CLOUDFLARE_API_TOKEN")'` で GitHub 側 updatedAt 取得 / (4) 1Password Last-Updated メモ日付と GitHub updatedAt の乖離が運用上許容範囲（1 日以内）であることを目視確認 |
| 期待値 | 1Password 側に該当 field が存在 / Last-Updated メモが直近の同期日時 / GitHub 側 updatedAt と 1Password 側 Last-Updated の乖離が許容範囲内 / GitHub UI 直編集の痕跡なし |
| Red 状態 | 1Password Item Notes に Last-Updated 記載なし / GitHub updatedAt が 1Password Last-Updated より新しい（GitHub UI 直編集の疑い） / 1Password 側 field が空 |
| 失敗時切り分け | (a) lane 3 同期手順で Last-Updated メモ更新を skip / (b) GitHub UI 直編集禁止ルールの運用違反 / (c) 1Password 側のローテーションが GitHub に未反映 |

### 7.1 同期検証で禁止する操作

| 禁止操作 | 理由 |
| --- | --- |
| 値ハッシュを Phase outputs / Item Notes に記録 | ハッシュから値の特定を試みるレインボーテーブル攻撃の素地となる |
| `op read` 出力を変数経由なしに直接コマンド引数に渡す | shell history に値が残る事故 |
| `gh secret list --json value` 等の値取得試行 | GitHub Actions Secrets API は値の GET 不可（マスク前提）。試行ログ自体が監査ノイズ |

## 8. テストカバレッジ目標（仕様レベル）

> 「全ファイル一律 X%」表記は **禁止**（apps/* / D1 / runtime コードに変更なし）。スコープ 6 件で配置仕様の line / branch を 100% 被覆する。

| スコープ | 対象 | 100% 被覆を担う T |
| --- | --- | --- |
| 配置完了（Secret 3 件 / Variable 1 件 / Environment 2 件） | lane 2 + lane 3 + lane 4 の最終状態 | T1 |
| scope boundary（同名併存禁止 / Secret vs Variable 分離） | Phase 2 配置決定マトリクスの不変条件 | T2 |
| dev push smoke（backend-ci.yml + web-cd.yml deploy-staging） | lane 5 の CD green 達成 | T3 |
| Discord 通知 / 未設定耐性 | lane 5 のケース A + ケース B | T4 |
| 1Password 正本 ↔ GitHub 派生 drift | lane 5 の同期検証 | T5 |
| secret 値転記禁止（AC-13） | 全 T のコマンド・出力 | 全 T で `op://...` 参照のみ |

## 9. 実走計画（本 Phase 範囲外）

| 実走 Phase | 対象 T | 備考 |
| --- | --- | --- |
| Phase 5 ランブック実走 | T1 / T2 | 配置完了 / scope boundary の検証コマンドは Step 完了時の確認に流用（実 PUT を伴わない GET / list のみ） |
| Phase 6 異常系 | T1〜T5 の Red 系 | 評価不能 if / Token スコープ不足 / 値ミスマッチ / 同名併存 / 二重正本 drift |
| Phase 11 smoke | T3 / T4 / T5 | 実 push / 一時 delete + 復元 / 1Password 突合を含むため Phase 13 ユーザー承認後 |
| Phase 13 PR + ユーザー承認後配置 | T1〜T5 全件 | apply-runbook.md / op-sync-runbook.md / verification-log.md を最終証跡として保全 |

## 10. 引き渡し（Phase 5 へ）

- T1〜T5 を Phase 5 ランブック Step 1〜5 の Green 条件として転記
- T1（配置完了）の 7 行チェックリストを Phase 5 各 Step の確認コマンドに転記
- T2（scope boundary）の積集合確認を Phase 5 配置直後の sanity check に組み込む
- T4（Discord 未設定耐性）の代替設計確認 grep を Phase 5 Step 0（前提確認）に追加
- T5（1Password 同期）の Last-Updated メモ更新を Phase 5 Step 同期検証に必須化
- 実走は本ワークフロー外 / 本 Phase で `gh secret set` / `gh variable set` / `gh api PUT` / `git push origin dev` を実行しない
