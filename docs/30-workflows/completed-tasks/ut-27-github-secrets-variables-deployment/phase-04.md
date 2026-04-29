# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（validation matrix: 配置検証 / dev push smoke / Discord 未設定耐性 / Token スコープ boundary / 1Password 同期検証） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending（仕様化のみ完了 / 実走は別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 3 で PASS（with notes 5 件）が確定した base case（案 A: `gh` CLI 直接実行 + 1Password 手動同期 / lane 1〜5 直列）に対して、**Phase 5 着手前に「何を満たせば Green か」を 5 種類のテスト（T1〜T5）として確定する**。本タスクは UI 変更なし（NON_VISUAL）かつ secrets / variables 配置タスクのため、ユニットテストではなく **配置後の挙動検証マトリクス** として固定する。本 Phase はテストの実走ではなく、Phase 5 ランブック / Phase 6 異常系 / Phase 11 smoke / Phase 13 ユーザー承認後配置が参照する **検証コマンド系列の正本** として固定する。

> **本 Phase は仕様化のみ**。実 `gh secret set` / `gh variable set` / `gh api PUT` / `git push origin dev` は Phase 13 ユーザー承認後の別オペレーション。本 Phase ではコマンドを記述するが**実行は禁止**。

## 依存タスク順序（上流 3 件完了必須）— 引き継ぎ確認

UT-05（CI/CD パイプライン実装）/ UT-28（Cloudflare Pages プロジェクト作成）/ 01b（Cloudflare base bootstrap）の 3 件すべてが completed であること（Phase 1 / 2 / 3 で 3 重明記済み）。1 件でも未完了で T1〜T5 を実走させると、(a) `gh secret set` のキー名が workflow と乖離し参照不能、(b) `CLOUDFLARE_PAGES_PROJECT` の値が確定せず suffix 連結が壊れる、(c) `CLOUDFLARE_API_TOKEN` 未発行で 401、いずれかが確定する。

## 実行タスク

- タスク1: T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを表化する。
- タスク2: 上流 3 件完了前提を本 Phase でも再確認する。
- タスク3: 実走を Phase 5 / 6 / 11 / 13 に委譲する境界を明記する。
- タスク4: secret 値を一切転記しないこと（`op` 参照のみ記述）を全 T で徹底する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-02.md | lane 1〜5 設計 / 配置決定マトリクス / state ownership |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | Secret / Variable 一覧 / `gh` CLI コマンド草案 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-03.md | base case PASS / NO-GO 条件 / open question |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md §苦戦箇所・知見 | リスク源（評価不能 if / 二重正本 / Token スコープ） |
| 必須 | .github/workflows/backend-ci.yml | secret/variable 参照キーの突合元 |
| 必須 | .github/workflows/web-cd.yml | secret/variable 参照キーの突合元 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | テスト戦略フォーマット参照 |

## 実行手順

1. Phase 2 設計（lane 1〜5 / 配置決定マトリクス / `gh` CLI 草案）と Phase 3 PASS 判定を入力として確認する。
2. T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態を表に落とす。
3. 本 Phase ではコマンドを実走しないことを Phase 5 ランブック側に明示的に引き渡す。

## 統合テスト連携

T1〜T5 は別オペレーション側で Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 11（手動 smoke）/ Phase 13（ユーザー承認後配置）の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T5 のテスト一覧 / 検証コマンド / 期待値 / 失敗時切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## テスト一覧（happy path）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前 / 配置前）の現状値 / **対応 lane** = Phase 2 §SubAgent lane 設計の lane 番号

### T1: 配置完了検証（Secret / Variable / Environment が GitHub に存在する）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 lane | lane 2 + lane 3 + lane 4（environment / secret / variable 配置） |
| 検証コマンド | `gh secret list` / `gh secret list --env staging` / `gh secret list --env production` / `gh variable list` / `gh api repos/daishiman/UBM-Hyogo/environments --jq '.environments[].name'` |
| 期待値 | Secrets: repository scope に `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` の 2 件 / environment scope に `CLOUDFLARE_API_TOKEN` が staging / production 各 1 件存在。Variables: `CLOUDFLARE_PAGES_PROJECT` が repository scope に存在。Environments: `staging` / `production` の 2 件存在 |
| Red 状態 | いずれかの key が未配置 / environment 未作成 / 同名 repository-scoped と environment-scoped が併存 |
| 失敗時切り分け | (a) `gh api` 認証スコープ不足（`administration:write` 欠如で environments PUT 失敗） / (b) lane 2 の environment 作成 skip → environment-scoped secret PUT が 404 / (c) 配置決定マトリクス（Phase 2）の scope 列と実配置が乖離 |

### T2: 配置スコープ boundary 検証（同名併存禁止 / environment vs repository 分離）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 lane | lane 3 + lane 4（scope 設計の不変条件） |
| 検証コマンド | (1) `gh secret list --json name --jq '.[].name'` で repository scope 一覧 / (2) `gh secret list --env staging --json name --jq '.[].name'` / (3) `comm -12 <(... repository ... \| sort) <(... staging ... \| sort)` で **積集合 = 空** を確認 / 同 production / (4) `gh variable list --json name --jq '.[].name'` で `CLOUDFLARE_PAGES_PROJECT` が Variable 側にのみ存在し Secret 側に存在しないことを確認 |
| 期待値 | repository-scoped と environment-scoped の同名併存 0 件。`CLOUDFLARE_PAGES_PROJECT` が Variable 側のみ（Secret 側に同名なし） |
| Red 状態 | `CLOUDFLARE_API_TOKEN` が repository / environment 両方に存在（どちらが効いているか曖昧化）/ `CLOUDFLARE_PAGES_PROJECT` が Secret 側にも存在（ログマスクでデバッグ困難） |
| 失敗時切り分け | (a) lane 3 で repository-scoped にも安全側コピーした事故 / (b) Phase 2 配置決定マトリクスの「同名併存禁止」運用ルール未徹底 / (c) Variable と Secret の混同（親仕様 §Variable 化理由 違反） |

### T3: dev push → CD green smoke（実稼働化の最終確認）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 lane | lane 5（動作確認） |
| 検証コマンド | (1) `git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"` / (2) `git push origin dev` / (3) `gh run watch` / (4) `gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'` => `success` / (5) 同 `web-cd.yml` |
| 期待値 | `backend-ci.yml` の `deploy-staging` ジョブが green / `web-cd.yml` の `deploy-staging` ジョブが green。両ジョブのログから `CLOUDFLARE_PAGES_PROJECT` の suffix 連結結果（例: `ubm-hyogo-web-staging`）が visible（Variable のためマスクされない）であることを確認 |
| Red 状態 | 401（API Token スコープ不足 or 値未配置）/ 404（`CLOUDFLARE_ACCOUNT_ID` 不一致 or Pages project 不在）/ ログに `CLOUDFLARE_PAGES_PROJECT` の値が `***` でマスクされている（Secret 化事故） |
| 失敗時切り分け | (a) `gh secret list --env staging` で `CLOUDFLARE_API_TOKEN` 不在 / (b) Token スコープが Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read を満たさない / (c) UT-28 の Pages project 命名と Variable 値の乖離 / (d) `CLOUDFLARE_PAGES_PROJECT` を誤って Secret 化 |

### T4: Discord 通知到達 / 未設定耐性検証（評価不能 if 問題への対処確認）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 lane | lane 5（動作確認 / 未設定耐性） |
| 検証コマンド | **ケース A（設定あり）**: (1) `gh secret list --json name --jq '.[].name' \| rg DISCORD_WEBHOOK_URL` で存在確認 / (2) dev push 後に Discord チャンネルで通知到達を目視。**ケース B（未設定）**: (1) 一時的に `gh secret delete DISCORD_WEBHOOK_URL` / (2) dev 空コミット push / (3) `gh run view <run-id> --log` で通知ステップが skip / early-return しジョブ全体が green を維持することを確認 / (4) `gh secret set DISCORD_WEBHOOK_URL --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')" && unset` で復元 |
| 期待値 | ケース A: Discord にメッセージ到達。ケース B: 通知ステップが空文字判定で early-return し CI 全体は green。`if: ${{ always() && secrets.X != '' }}` の評価不能で無音失敗していない |
| Red 状態 | ケース B で CI 全体が red / 通知ステップが起動して webhook 401 でジョブを巻き込み red 化 / `secrets.X != ''` 条件が常に true 評価で空通知が送信される |
| 失敗時切り分け | (a) workflow 側で `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` パターン残存 → UT-05 にフィードバック起票（Phase 12 unassigned へ） / (b) env 受け + シェル空文字判定の代替設計が未導入 / (c) ケース B 復元時の `unset` 漏れで shell history に値残存 |

### T5: 1Password 同期検証（正本 ↔ 派生コピー drift チェック）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 lane | lane 5（同期検証） |
| 検証コマンド | (1) `op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token_staging,account_id` で 1Password 側に値が存在することを確認（**値そのものは出力しない / 存在のみ確認**） / (2) `op item get "Cloudflare" --vault UBM-Hyogo --format json \| jq '.notes'` で Last-Updated メモが存在 / (3) `gh secret list --json name,updatedAt --jq '.[] \| select(.name == "CLOUDFLARE_API_TOKEN")'` で GitHub 側の updatedAt を取得し、1Password Last-Updated メモの日付と乖離が 1 日以内であること |
| 期待値 | 1Password 側に該当 field 存在 / Last-Updated メモが直近の同期日時 / GitHub 側 updatedAt と 1Password 側 Last-Updated の乖離が許容範囲内（運用上 1 日以内）。GitHub UI で直接編集された痕跡なし |
| Red 状態 | 1Password Item Notes に Last-Updated 記載なし / GitHub updatedAt が 1Password Last-Updated より新しい（GitHub UI 直編集の疑い）/ 1Password 側 field が空 |
| 失敗時切り分け | (a) lane 3 同期手順で Last-Updated メモ更新を skip / (b) GitHub UI 直編集禁止ルールの運用違反 / (c) 1Password 側のローテーションが GitHub に未反映 |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| 配置完了（Secret 3 件 / Variable 1 件 / Environment 2 件） | T1 で全件被覆 |
| scope boundary（同名併存禁止 / Secret vs Variable 分離） | T2 で全件突合 |
| dev push smoke（backend-ci.yml + web-cd.yml deploy-staging） | T3 で 2 workflow 被覆 |
| Discord 通知 / 未設定耐性（評価不能 if 問題） | T4 でケース A + ケース B 両被覆 |
| 1Password 正本 ↔ GitHub 派生 drift | T5 で同期検証 |
| secret 値転記禁止 | 全 T で `op://...` 参照のみ記述。実値出力の検証コマンドは含まない |

## 完了条件

- [ ] T1〜T5 が `outputs/phase-04/main.md` に表化されている
- [ ] 各テストに ID / 対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] 上流 3 件完了が本 Phase の前提として再確認されている
- [ ] base case PASS（Phase 3）と配置決定マトリクス（Phase 2）が入力として参照されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 / 13 に委ねる旨が明示されている
- [ ] 本 Phase で `gh secret set` / `gh variable set` / `gh api ... -X PUT` / `git push origin dev` を実行していない（仕様化のみ）
- [ ] secret 値の payload / runbook / Phase outputs / 検証コマンドへの転記禁止が全 T で守られている

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
# 仕様の存在確認のみ（実テストは走らせない）
test -f docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-04/main.md
rg -c "^### T[1-5]:" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-04/main.md
# => 5
```

## 苦戦防止メモ

1. **配置スコープ boundary は CI ログでは検出できない**: 同名 repository-scoped と environment-scoped が併存しても CI は green になり得るが、environment-scoped が黙って勝つため監査時の混乱源。T2 の積集合確認を必須化。
2. **`CLOUDFLARE_PAGES_PROJECT` は Variable で固定**: T3 のログ可視性が Secret 化で失われ、デバッグ難度が跳ね上がる（親仕様 §「Variable にする理由」）。Phase 5 の `gh variable set` 経路を厳守。
3. **Discord 未設定耐性（T4 ケース B）は実コマンドでの一時 delete + 復元が必要**: workflow の `if` 条件だけ静的に読んでも GitHub Actions の評価不能問題は再現しない。Phase 11 smoke で実走。
4. **1Password 同期 drift（T5）は値ではなく日時で検出する**: 値ハッシュを記録すると間接的に値推測されるリスクがある。Last-Updated 日時のみで drift 判定（Phase 2 §同期手順）。
5. **本 Phase は実走しない**: T1〜T5 の Red 確認は Phase 5 着手直前 / Phase 11 smoke / Phase 13 ユーザー承認後配置で行う。仕様化のみで Phase 5 へ進む。
6. **secret 値を含むコマンド出力を Phase outputs に貼らない**: `gh secret get` 系で値が出るコマンドは存在しないが、`op read` 出力を直接出力に流すと事故になる。`op read` は `--body "$(op read ...)"` のサブシェル内に閉じ、即時 unset する（Phase 2 §同期手順）。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T5 を Phase 5 ランブック Step 1〜5 の Green 条件として参照
  - T1（配置完了）/ T2（scope boundary）の検証コマンドを Phase 5 各 Step の確認コマンドに転記
  - T3（dev push smoke）/ T4（Discord 未設定耐性）/ T5（1Password 同期）は Phase 11 smoke の主要ケース
  - 実走は Phase 13 ユーザー承認後（user_approval_required: true）
- ブロック条件:
  - 上流 3 件（UT-05 / UT-28 / 01b）のいずれかが completed でない
  - T1〜T5 のいずれかに期待値・検証コマンドが欠けている
  - T4 ケース B（未設定耐性）が省略されている
  - T5 で値ハッシュ記録など secret 推測リスクがある記述が混入している
