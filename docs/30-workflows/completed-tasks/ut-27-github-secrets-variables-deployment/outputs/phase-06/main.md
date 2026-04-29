# Phase 6 成果物 — 異常系検証

## 1. 異常系サマリ

T6〜T11 の 6 ケースで、UT-27 base case の fail path（**同名 repository / environment 併存 / Discord 評価不能 if / 誤スコープ Token / Variable 値ミスマッチ / 1Password ↔ GitHub 二重正本 drift / `gh` 認証スコープ不足**）を仕様レベルで網羅する。実走は **Phase 11 smoke / Phase 13 ユーザー承認後配置** に委譲し、本 Phase ではコマンド・期待値・Red 状態・対応を正本化する。secret 値は検証コマンド出力 / Red 状態 / 対応手順に **一切転記しない**（AC-13）。

## 2. T6: 同名 repository / environment 併存事故（§苦戦箇所 #1）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | scope boundary 不変条件（同名併存禁止）の維持 |
| シナリオ | `CLOUDFLARE_API_TOKEN` を environment-scoped で配置済みの状態で、誤って repository-scoped にも `gh secret set CLOUDFLARE_API_TOKEN --body ...` してしまう。environment-scoped が黙って勝つため deploy-staging は green を維持するが、repository-scoped 値が事実上の死蔵となり監査時に「どちらが効いているか」が曖昧化 |
| 検証コマンド | (1) `gh secret list --json name --jq '.[].name' \| sort > /tmp/sec-repo.txt` / (2) `gh secret list --env staging --json name --jq '.[].name' \| sort > /tmp/sec-stg.txt` / (3) `comm -12 /tmp/sec-repo.txt /tmp/sec-stg.txt` で `CLOUDFLARE_API_TOKEN` が両方に出る Red 状態を再現 |
| 期待値 | T2 §4.1 の積集合 = 空が満たされない事故を `comm -12` で**即時検出** / repository-scoped 側を `gh secret delete CLOUDFLARE_API_TOKEN` で削除 → 積集合 = 空に復元 |
| Red 状態 | `comm -12` 結果に `CLOUDFLARE_API_TOKEN` が出現 / staging で意図せず production token を参照する事故 / 監査ログ追跡不能 |
| 対応 | Phase 5 Step 3 §6.3 の `comm -12` 確認を必ず通過。CI gate 候補として Phase 12 unassigned-task-detection.md に登録（PR 内で `gh secret list` 差分の自動検証） |

## 3. T7: Discord Webhook 未設定時の CI 動作 / 評価不能 if 問題（§苦戦箇所 #3）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` の評価不能で起こる無音失敗 / CI red 化 |
| シナリオ | `DISCORD_WEBHOOK_URL` 未配置 or 一時 delete 状態で dev push → workflow の通知ステップが (a) `secrets.X != ''` 条件が常に true 評価で空文字 webhook へ POST → 401 で job 全体 red、または (b) skip されず空通知が送信される |
| 検証コマンド | (1) `grep -nE "if:.*always\(\).*secrets\." .github/workflows/{backend-ci,web-cd}.yml` で旧パターン残存確認 / (2) `gh secret delete DISCORD_WEBHOOK_URL` / (3) `git commit --allow-empty -m "smoke without discord [UT-27]" && git push origin dev` / (4) `gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'` => `success` / (5) `gh run view <run-id> --log` で通知ステップが env 受け + シェル空文字判定で early-return している痕跡を確認 / (6) `gh secret set DISCORD_WEBHOOK_URL --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"` で復元 |
| 期待値 | 未設定状態でも CI 全体が green 維持 / 通知ステップが env 受け + シェル空文字判定で early-return している（exit 0 で即抜け） / 旧パターン（直接 `secrets.X != ''`）が workflow に残存していない |
| Red 状態 | 未設定状態で CI 全体 red / 通知ステップが空 webhook に POST して 401 / 旧パターンが残存し評価が意図と乖離 |
| 対応 | 旧パターン検出時は Phase 12 unassigned-task-detection.md に **「UT-05 へ workflow 修正フィードバック」** を起票。代替設計（env 受け + シェル空文字判定）を `outputs/phase-12/skill-feedback-report.md` で UT-05 に共有 |

### 3.1 評価不能 if の代替設計（UT-05 への期待形 / 再掲）

```yaml
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

## 4. T8: `CLOUDFLARE_API_TOKEN` 誤スコープ事故（§苦戦箇所 #5）

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | 最小スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）の維持 |
| シナリオ A（過剰）| Token が Global API Key 流用 or `Account.All Resources.Edit` で広すぎる → 漏洩時の影響範囲が production Cloudflare 全体に拡大 |
| シナリオ B（不足）| Token に D1 Edit が含まれず `apps/api` D1 マイグレーションが 401 / Workers Scripts Edit が含まれず deploy 401 |
| 検証コマンド | (1) Cloudflare ダッシュボード or `bash scripts/cf.sh whoami` で Token 名から発行スコープを目視確認（Token 値は出力しない / scope メタデータのみ） / (2) dev push smoke で 401 が出ない（T3 結果と接続） / (3) Token 名規則（`ubm-hyogo-cd-{env}-{yyyymmdd}`）に環境・発行日が含まれることを目視確認 |
| 期待値 | Token 発行スコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read のみ / Token 名にローテーション履歴を追える環境・日付が含まれる |
| Red 状態 | Global API Key 流用 / Account.All Resources / Token 名に日付なし / dev push smoke で 401 |
| 対応 | 過剰時: 01b に戻り Token を最小スコープで再発行 → Step 3 で再注入。不足時: 401 / 404 ログから不足スコープを特定 → 01b で Token 再発行 → Step 3 で再注入。**Token rollback** = Cloudflare 側で旧 Token revoke + 1Password 上書き + Step 3 再実行。**実 PUT 含む rollback 経路は Phase 13 ユーザー承認後** |

### 4.1 Token rollback 3 経路

| 経路 | 手順 | 用途 |
| --- | --- | --- |
| A. 通常 rollback | Cloudflare で新 Token 発行 → 1Password 上書き → `gh secret set CLOUDFLARE_API_TOKEN --env {env} --body "$(op read ...)"` | 計画的ローテーション / スコープ修正 |
| B. 緊急 revoke | Cloudflare で旧 Token revoke → 旧 Token を `gh secret delete CLOUDFLARE_API_TOKEN --env {env}` → 新 Token 発行 + 配置 | 漏洩疑い時 |
| C. 環境分離 rollback | staging のみ問題なら staging Token のみ revoke + 再発行 + 再配置（production には触らない） | dev / main 片側分離（Phase 5 §環境別配置の堅持） |

## 5. T9: `CLOUDFLARE_PAGES_PROJECT` Variable 値ミスマッチ（§苦戦箇所 #2）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | UT-28 で確定した Pages project 名と Variable 値の整合 / Variable 化（Secret 化禁止）の維持 |
| シナリオ A（値ミスマッチ）| Variable 値が `ubm-hyogo-web` だが UT-28 で実際に作成された project 名が `ubm-hyogo` 等で suffix 連結 `${{ vars.X }}-staging` の結果が Cloudflare に存在しない → 404 |
| シナリオ B（Secret 化事故）| `CLOUDFLARE_PAGES_PROJECT` を誤って `gh secret set` で配置 → CI ログで `***` マスクされ suffix 連結結果がデバッグ不能 |
| 検証コマンド | (1) `gh variable get CLOUDFLARE_PAGES_PROJECT` / (2) `bash scripts/cf.sh pages project list \| jq -r '.[].name' \| sort` の結果と突合 / (3) `web-cd.yml` の suffix 連結パターンの結果が Cloudflare project 名集合に含まれることを確認 / (4) `gh secret list --json name --jq '.[].name' \| rg -v CLOUDFLARE_PAGES_PROJECT` で Secret 側不在確認 |
| 期待値 | Variable 値 = UT-28 確定 project 名（base）/ suffix 連結結果が Cloudflare 上の project 名と一致 / Secret 側に同名なし |
| Red 状態 | `gh variable get` 結果と Cloudflare project 名集合に乖離 / Secret 側にも同名存在 / CI ログで `***` マスク |
| 対応 | 値ミスマッチ時: `gh variable set CLOUDFLARE_PAGES_PROJECT --body "<UT-28 確定値>"` で上書き → dev push 再実行。Secret 化事故時: `gh secret delete CLOUDFLARE_PAGES_PROJECT` → `gh variable set CLOUDFLARE_PAGES_PROJECT --body ...` |

## 6. T10: 1Password ↔ GitHub Secrets 二重正本 drift（§苦戦箇所 #6）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | 1Password 正本 / GitHub 派生コピーの境界維持（state ownership） |
| シナリオ | GitHub UI で `CLOUDFLARE_API_TOKEN` を直接編集 → 1Password 側が古いまま → ローテーション時に 1Password から再注入すると GitHub 側が古い値で上書きされる事故 |
| 検証コマンド | (1) `op item get "Cloudflare" --vault UBM-Hyogo --format json \| jq -r '.notes' \| rg "Last-Updated"` で 1Password Last-Updated 取得 / (2) `gh secret list --env staging --json name,updatedAt --jq '.[] \| select(.name == "CLOUDFLARE_API_TOKEN")'` で GitHub updatedAt 取得 / (3) GitHub updatedAt > 1Password Last-Updated の状態を Red と判定 |
| 期待値 | 1Password Last-Updated >= GitHub updatedAt（1Password が常に正本）/ GitHub UI 直編集の痕跡なし / drift 検出時は 1Password を先に更新 → Step 3 で再注入 |
| Red 状態 | GitHub updatedAt > 1Password Last-Updated / 1Password Item Notes に Last-Updated 記載なし / 値ハッシュが Notes に記録（推測リスク） |
| 対応 | drift 検出時: (a) GitHub UI 直編集の有無を運用ヒアリング / (b) 1Password 側に正値が無ければ Cloudflare 側で Token 再発行 → 1Password 上書き → Step 3 再注入 / (c) Last-Updated メモ更新を運用フローに固定。**rollback** = 1Password から再注入で GitHub 側を上書き |

## 7. T11: `gh` 認証スコープ不足での environment / secret PUT 失敗（regression）

| 項目 | 内容 |
| --- | --- |
| ID | T11 |
| 観点 | 実行者ローカル `gh auth login` のスコープ要件（`actions:write` / `administration:write`）の維持 |
| シナリオ | 実行者の `gh auth status` が `repo` スコープのみ → environments PUT が 403 / environment-scoped secret PUT が 404 |
| 検証コマンド | (1) `gh auth status` で現在のスコープ列挙 / (2) `gh api repos/daishiman/UBM-Hyogo/environments/_test -X PUT --silent` の試行（**意図的失敗ケース**） / (3) `gh auth refresh -s admin:repo_hook,repo` でスコープ追加 → 再試行 |
| 期待値 | `gh auth status` に `actions:write` / `administration:write` が出現 / environments PUT / environment-scoped secret PUT が 200 |
| Red 状態 | `gh auth status` に該当スコープなし / Step 2 の `gh api ... environments/{staging,production} -X PUT` が 403 / Step 3 の `gh secret set --env staging ...` が 404 |
| 対応 | `gh auth refresh -s admin:repo_hook,repo` でスコープ追加 / 追加後 Step 2 / Step 3 再実行。**rollback** 不要（PUT 失敗で副作用なし） |

## 8. fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step | CI gate 候補 |
| --- | --- | --- | --- |
| T6 | lane 3 | Phase 5 Step 3 §6.3 / Phase 11 smoke | ◎（Phase 12 登録 / `gh secret list` 差分 PR 自動検証） |
| T7 | lane 5 | Phase 5 Step 5.2 / Phase 11 smoke / Phase 12 UT-05 フィードバック | -（UT-05 側で対処） |
| T8 | lane 5 | 01b に戻り Token 再発行 / Phase 5 Step 3 再実行 / Phase 11 smoke | -（Cloudflare ダッシュボード目視） |
| T9 | lane 4 | Phase 5 Step 4 / Phase 11 smoke | ◎（Phase 12 登録 / `gh variable list` ↔ `cf.sh pages project list` 自動突合） |
| T10 | lane 5 | Phase 5 Step 3 / Step 5.3 / Phase 12 運用ドキュメント | -（updatedAt 比較を運用周期で実施） |
| T11 | lane 2 + lane 3 | Phase 5 Step 0 / Step 2 / Step 3 | -（実行者ローカル環境依存） |

## 9. 実走計画（本 Phase 範囲外）

| 実走 Phase | 対象 T |
| --- | --- |
| Phase 11 smoke（Phase 13 承認後） | T6（同名併存意図的再現 → 即削除）/ T7（一時 delete + 復元）/ T9（Variable 値突合）/ T10（updatedAt 比較） |
| Phase 13 PR + ユーザー承認後配置 | T8（Token スコープ目視 + dev push smoke）/ T11（`gh auth status` 確認） |

## 10. 引き渡し（Phase 7 へ）

- 異常系 6 件（T6〜T11）+ happy path 5 件（T1〜T5）= 全 11 件を Phase 7 AC マトリクス入力に渡す
- T6 / T9 を CI gate 候補として Phase 12 unassigned-task-detection.md に申し送り
- T7 の workflow 旧パターン検出 → UT-05 フィードバック経路を Phase 12 で起票
- T10 の 1Password 正本維持ルールを Phase 12 documentation-changelog.md / op-sync-runbook.md に転記
- 本 Phase で実 PUT / `git push` / `gh secret delete` を実行しない境界を Phase 7 / 11 / 13 に再確認させる
