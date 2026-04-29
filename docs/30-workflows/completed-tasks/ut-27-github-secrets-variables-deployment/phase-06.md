# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（評価不能 if / 誤スコープ Token / Variable 値ミスマッチ / 同名併存 / 二重正本 drift / 未設定通知無音失敗） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending（仕様化のみ完了 / 実走は Phase 11 / 13） |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 4 の T1〜T5（happy path）に加えて、**fail path / 回帰 guard** を T6〜T11 として固定する。本 Phase は「Webhook 未設定時の CI 動作 / 誤スコープ Token / Variable 値ミスマッチ / 同名 repository / environment 併存 / 1Password ↔ GitHub 二重正本 drift / 評価不能 if 問題」の 6 観点を仕様レベルで網羅する。実走は Phase 11 smoke / Phase 13 ユーザー承認後配置に委譲する。

## 依存タスク順序（上流 3 件完了必須）

上流 3 件（UT-05 / UT-28 / 01b）完了は Phase 5 Step 0 ゲートで担保済み。本 Phase は Step 0 をパスした前提で fail path を扱う。Discord 評価不能 if の代替設計が UT-05 に未組込の場合、T7 で実検出 → Phase 12 unassigned で UT-05 にフィードバック起票する経路を含める。

## 実行タスク

- タスク1: T6〜T11 の 6 件（誤スコープ Token / Variable 値ミスマッチ / 同名併存 / Variable 誤 Secret 化 / 二重正本 drift / 評価不能 if）を定義する。
- タスク2: 各 T のシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応を表化する。
- タスク3: 実走を Phase 11 / 13 に委譲する範囲を明記する。
- タスク4: rollback 経路（1Password から再注入 / `gh secret delete` 後再 set）を T8 / T11 に含める。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-04.md | T1〜T5 happy path |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-05.md | 6 ステップランブック / 4 コミット粒度 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | 配置決定マトリクス / state ownership / 1Password 同期手順 |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md §苦戦箇所・知見 | リスク源 |
| 必須 | .github/workflows/{backend-ci,web-cd}.yml | 評価不能 if パターン突合 |

## 実行手順

1. Phase 4 の happy path と Phase 5 の実装ランブックを確認する。
2. T6〜T11 をシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応に分解する。
3. Phase 7 の AC マトリクス入力として引き渡す。

## 統合テスト連携

T6〜T11 は実 `gh secret set` / `gh secret delete` / `git push origin dev` を伴うため、**Phase 13 ユーザー承認後** の Phase 11 smoke で実走する。本 Phase は fail path 仕様の正本化のみ。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T6〜T11 のテスト一覧 / 期待値 / 観測手順 |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 異常系テスト一覧

### T6: 同名 repository / environment 併存事故（誤って repository-scoped にも安全側コピー / §苦戦箇所 #1）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | scope boundary 不変条件（同名併存禁止）の維持 |
| シナリオ | `CLOUDFLARE_API_TOKEN` を environment-scoped で配置済みの状態で、誤って repository-scoped にも `gh secret set CLOUDFLARE_API_TOKEN --body ...` してしまう。environment-scoped が黙って勝つため deploy-staging は green を維持するが、repository-scoped 値が事実上の死蔵となり監査時に「どちらが効いているか」が曖昧化 |
| 検証コマンド | (1) `gh secret list --json name --jq '.[].name' \| sort > /tmp/sec-repo.txt` / (2) `gh secret list --env staging --json name --jq '.[].name' \| sort > /tmp/sec-stg.txt` / (3) `comm -12 /tmp/sec-repo.txt /tmp/sec-stg.txt` で `CLOUDFLARE_API_TOKEN` が両方に出る Red 状態を再現 |
| 期待値 | T2 §4.1 の積集合 = 空が満たされない事故を `comm -12` で**即時検出** / repository-scoped 側を `gh secret delete CLOUDFLARE_API_TOKEN`（environment scope 指定なし）で削除 → 積集合 = 空に復元 |
| Red 状態 | `comm -12` 結果に `CLOUDFLARE_API_TOKEN` が出現 / staging で意図せず production token を参照する事故 / 監査ログ追跡不能 |
| 対応 | Phase 5 Step 3 §6.3 の `comm -12` 確認を必ず通過。CI gate 候補として Phase 12 unassigned-task-detection.md に登録（PR 内で `gh secret list` 差分の自動検証） |

### T7: Discord Webhook 未設定時の CI 動作 / 評価不能 if 問題（§苦戦箇所 #3）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` の評価不能で起こる無音失敗 / CI red 化 |
| シナリオ | `DISCORD_WEBHOOK_URL` 未配置 or 一時 delete 状態で dev push → workflow の通知ステップが (a) `secrets.X != ''` 条件が常に true 評価で空文字 webhook へ POST → 401 で job 全体 red、または (b) skip されず空通知が送信される |
| 検証コマンド | (1) `grep -nE "if:.*always\(\).*secrets\." .github/workflows/{backend-ci,web-cd}.yml` で旧パターン残存確認 / (2) `gh secret delete DISCORD_WEBHOOK_URL` / (3) `git commit --allow-empty -m "smoke without discord [UT-27]" && git push origin dev` / (4) `gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'` => `success` を期待 / (5) `gh run view <run-id> --log` で通知ステップが env 受け + シェル空文字判定で early-return している痕跡を確認 / (6) `gh secret set DISCORD_WEBHOOK_URL --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"` で復元 |
| 期待値 | 未設定状態でも CI 全体が green 維持 / 通知ステップが env 受け + シェル空文字判定で early-return している（exit 0 で即抜け） / 旧パターン（直接 `secrets.X != ''`）が workflow に残存していない |
| Red 状態 | 未設定状態で CI 全体 red / 通知ステップが空 webhook に POST して 401 / 旧パターンが残存し評価が意図と乖離 |
| 対応 | 旧パターン検出時は Phase 12 unassigned-task-detection.md に **「UT-05 へ workflow 修正フィードバック」** を起票。代替設計（env 受け + シェル空文字判定）を `outputs/phase-12/skill-feedback-report.md` の形で UT-05 に共有 |

### T8: `CLOUDFLARE_API_TOKEN` 誤スコープ事故（過剰スコープ / 不足スコープ）（§苦戦箇所 #5）

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | 最小スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）の維持 |
| シナリオ A（過剰）| 01b で発行された Token が Global API Key 流用 or `Account.All Resources.Edit` で広すぎる → 漏洩時の影響範囲が production Cloudflare 全体に拡大 |
| シナリオ B（不足）| Token に D1 Edit が含まれず `apps/api` の D1 マイグレーションが 401 / Workers Scripts Edit が含まれず deploy 401 |
| 検証コマンド | (1) Cloudflare ダッシュボード or `bash scripts/cf.sh whoami` で Token 名から発行スコープを目視確認（Token 値は出力しない / scope メタデータのみ） / (2) dev push smoke で 401 が出ない（T3 結果と接続） / (3) Token 名規則（`ubm-hyogo-cd-{env}-{yyyymmdd}`）に環境・発行日が含まれることを目視確認 |
| 期待値 | Token 発行スコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read のみ / それ以上でも以下でもない / Token 名にローテーション履歴を追える環境・日付が含まれる |
| Red 状態 | Global API Key 流用 / Account.All Resources / Token 名に日付なしでローテーション履歴不能 / dev push smoke で 401 |
| 対応 | 過剰時: 01b に戻り Token を最小スコープで再発行 → Step 3 で再注入。不足時: 401 / 404 ログから不足スコープを特定 → 01b で Token 再発行 → Step 3 で再注入。**Token rollback** = Cloudflare 側で旧 Token revoke + 1Password 上書き + Step 3 再実行。**実 PUT 含む rollback 経路は Phase 13 ユーザー承認後** |

### T9: `CLOUDFLARE_PAGES_PROJECT` Variable 値ミスマッチ（UT-28 命名と不整合 / §苦戦箇所 #2）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | UT-28 で確定した Pages project 名と Variable 値の整合 / Variable 化（Secret 化禁止）の維持 |
| シナリオ A（値ミスマッチ）| Variable 値が `ubm-hyogo-web` だが UT-28 で実際に作成された project 名が `ubm-hyogo` 等で suffix 連結 `${{ vars.X }}-staging` の結果が Cloudflare に存在しない → 404 |
| シナリオ B（Secret 化事故）| `CLOUDFLARE_PAGES_PROJECT` を誤って `gh secret set` で配置 → CI ログで `***` マスクされ suffix 連結結果がデバッグ不能 |
| 検証コマンド | (1) `gh variable get CLOUDFLARE_PAGES_PROJECT`（**Variable は値取得可**） / (2) `bash scripts/cf.sh pages project list \| jq -r '.[].name' \| sort` の結果と突合 / (3) `web-cd.yml` の suffix 連結パターン（`${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` 等）の結果が Cloudflare project 名集合に含まれることを確認 / (4) `gh secret list --json name --jq '.[].name' \| rg -v CLOUDFLARE_PAGES_PROJECT` で Secret 側不在確認 |
| 期待値 | Variable 値 = UT-28 確定 project 名（base）/ suffix 連結結果が Cloudflare 上の project 名と一致 / Secret 側に同名なし |
| Red 状態 | `gh variable get` 結果と Cloudflare project 名集合に乖離 / Secret 側にも `CLOUDFLARE_PAGES_PROJECT` が存在 / CI ログで `***` マスク |
| 対応 | 値ミスマッチ時: `gh variable set CLOUDFLARE_PAGES_PROJECT --body "<UT-28 確定値>"` で上書き → dev push 再実行。Secret 化事故時: `gh secret delete CLOUDFLARE_PAGES_PROJECT` → `gh variable set CLOUDFLARE_PAGES_PROJECT --body ...` |

### T10: 1Password ↔ GitHub Secrets 二重正本 drift（GitHub UI 直編集 / §苦戦箇所 #6）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | 1Password 正本 / GitHub 派生コピーの境界維持（state ownership） |
| シナリオ | GitHub UI で `CLOUDFLARE_API_TOKEN` を直接編集 → 1Password 側が古いまま → ローテーション時に 1Password から再注入すると GitHub 側が古い値で上書きされる事故 |
| 検証コマンド | (1) `op item get "Cloudflare" --vault UBM-Hyogo --format json \| jq -r '.notes' \| rg "Last-Updated"` で 1Password Last-Updated 取得 / (2) `gh secret list --env staging --json name,updatedAt --jq '.[] \| select(.name == "CLOUDFLARE_API_TOKEN")'` で GitHub updatedAt 取得 / (3) GitHub updatedAt > 1Password Last-Updated（GitHub 側が新しい）の状態を Red と判定 |
| 期待値 | 1Password Last-Updated >= GitHub updatedAt（1Password が常に正本 / GitHub 派生）/ GitHub UI 直編集の痕跡なし / drift 検出時は 1Password を先に更新 → Step 3 で再注入 |
| Red 状態 | GitHub updatedAt > 1Password Last-Updated / 1Password Item Notes に Last-Updated 記載なし / 値ハッシュが Notes に記録されている（推測リスク） |
| 対応 | drift 検出時: (a) GitHub UI 直編集の有無を運用ヒアリング / (b) 1Password 側に正値が無ければ Cloudflare 側で Token 再発行 → 1Password 上書き → Step 3 再注入 / (c) Last-Updated メモ更新を運用フローに固定。**rollback** = 1Password から再注入で GitHub 側を上書き |

### T11: `gh` 認証スコープ不足での environment / secret PUT 失敗（regression）

| 項目 | 内容 |
| --- | --- |
| ID | T11 |
| 観点 | 実行者ローカル `gh auth login` のスコープ要件（`actions:write` / `administration:write`）の維持 |
| シナリオ | 実行者の `gh auth status` が `repo` スコープのみ → environments PUT が 403 / environment-scoped secret PUT が 404 |
| 検証コマンド | (1) `gh auth status` で現在のスコープ列挙 / (2) `gh api repos/daishiman/UBM-Hyogo/environments/_test -X PUT --silent` の試行（**意図的失敗ケース** / 失敗時はスコープ不足）→ Phase 11 smoke で stage 環境で確認 / (3) `gh auth refresh -s admin:repo_hook,repo` でスコープ追加 → 再試行 |
| 期待値 | `gh auth status` に `actions:write` / `administration:write` が出現 / environments PUT / environment-scoped secret PUT が 200 |
| Red 状態 | `gh auth status` に該当スコープなし / Step 2 の `gh api ... environments/{staging,production} -X PUT` が 403 / Step 3 の `gh secret set --env staging ...` が 404 |
| 対応 | `gh auth refresh -s admin:repo_hook,repo` でスコープ追加 / 追加後 Step 2 / Step 3 再実行。**rollback** 不要（PUT 失敗で副作用なし） |

## fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step | CI gate 候補 |
| --- | --- | --- | --- |
| T6 | lane 3 | Phase 5 Step 3 §6.3 / Phase 11 smoke | ◎（Phase 12 登録 / `gh secret list` 差分 PR 自動検証） |
| T7 | lane 5 | Phase 5 Step 5.2 / Phase 11 smoke / Phase 12 UT-05 フィードバック | -（UT-05 側で対処） |
| T8 | lane 5 | 01b に戻り Token 再発行 / Phase 5 Step 3 再実行 / Phase 11 smoke | -（Cloudflare ダッシュボード目視） |
| T9 | lane 4 | Phase 5 Step 4 / Phase 11 smoke | ◎（Phase 12 登録 / `gh variable list` ↔ `cf.sh pages project list` 自動突合） |
| T10 | lane 5 | Phase 5 Step 3 / Step 5.3 / Phase 12 運用ドキュメント | -（updatedAt 比較を運用周期で実施） |
| T11 | lane 2 + lane 3 | Phase 5 Step 0 / Step 2 / Step 3 | -（実行者ローカル環境依存） |

## 完了条件

- [ ] T6〜T11 が `outputs/phase-06/main.md` に表化されている
- [ ] 各テストにシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応が記述されている
- [ ] 6 観点（同名併存 / 評価不能 if / 誤スコープ Token / Variable 値ミスマッチ / 二重正本 drift / `gh` 認証スコープ不足）がカバーされている
- [ ] T7 の workflow 旧パターン検出 → UT-05 フィードバック経路（Phase 12）が明記されている
- [ ] T8 の Token rollback 経路（Cloudflare 側 revoke → 1Password 上書き → Step 3 再注入）が明記されている
- [ ] T10 の 1Password 正本維持ルール（GitHub UI 直編集禁止）が明記されている
- [ ] 実テスト走行は Phase 11 / 13（ユーザー承認後）に委ねる旨が明示されている
- [ ] secret 値が検証コマンド出力 / Red 状態の説明 / 対応手順に転記されていない（AC-13）

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-06/main.md
rg -c "^### T(6|7|8|9|10|11):" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-06/main.md
# => 6
```

## 苦戦防止メモ

1. **T6 / T9 は CI gate 化が必須**: 手動 review では同名併存と Variable 値ミスマッチを検出しきれない。Phase 12 unassigned-task-detection.md に CI gate タスクを登録。
2. **T7 の評価不能 if は `web-cd.yml` / `backend-ci.yml` 双方で確認**: workflow ごとに記述パターンが異なる可能性があるため、両方を `grep` で確認する。旧パターン残存時は UT-05 への 1 PR で両方修正することを Phase 12 で起票。
3. **T8 の Token スコープ確認は値を出力しない**: Cloudflare ダッシュボード目視 or `bash scripts/cf.sh whoami` のメタデータのみ。Token 値の `cat` / `echo` を含む検証コマンドは禁止。
4. **T10 は updatedAt 比較で検出**: 値ハッシュ照合は推測リスクがあるため運用禁止。日時のみで drift を判定（Phase 4 §7.1）。
5. **T11 は実行者ローカル環境依存**: CI gate 化不能。Phase 5 Step 0 のチェックリストで毎回 `gh auth status` を確認する運用に固定。
6. **本 Phase は実走しない**: 仕様化のみ。実走は Phase 11 smoke / Phase 13 ユーザー承認後配置。
7. **secret 値転記禁止を異常系シナリオでも徹底**: 「Red 状態」の説明で「token が `xyz...` で 401」のような実値示唆も避ける。「過剰スコープで 401」「不足スコープで 401」のように観測される現象のみを記述する。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T5（happy path）+ T6〜T11（fail path）の合計 11 件を Phase 7 AC マトリクス入力として渡す
  - T6 / T9 を CI gate 候補として Phase 12 に申し送り
  - T7 の workflow 旧パターン検出 → UT-05 フィードバック経路を Phase 12 unassigned-task-detection.md に登録
  - T10 の 1Password 正本維持ルールを Phase 12 documentation-changelog.md / op-sync-runbook.md に転記
- ブロック条件:
  - 6 観点のいずれかが未カバー
  - T7 の workflow 旧パターン検出経路が Phase 12 への引き渡しから欠落
  - T8 の Token rollback 経路が runbook に記載されない
  - secret 値が異常系シナリオの説明 / 検証コマンド / 対応手順に転記されている
