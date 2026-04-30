# fix-cf-account-id-vars-reference - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | FIX-CF-ACCT-ID-VARS-001 |
| タスク名 | Fix Cloudflare Account ID reference (`secrets.` → `vars.`) in CI workflows |
| ディレクトリ | docs/30-workflows/fix-cf-account-id-vars-reference |
| Wave | 1 |
| 実行種別 | parallel（独立着手可能、他タスク完了待ちなし） |
| 作成日 | 2026-04-30 |
| 担当 | unassigned |
| 状態 | implemented_static_verified |
| タスク種別 | implementation |
| サブタイプ | ci-fix（GitHub Actions workflow yaml の参照修正） |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | HIGH（main ブランチの本番デプロイが赤継続中） |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | 未起票（必要に応じて Phase 12 で起票判断） |

## 目的

`.github/workflows/backend-ci.yml` および `.github/workflows/web-cd.yml` 内で Cloudflare account ID を参照している 6 箇所が `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` と記述されているが、GitHub 実設定では同名の Secret が存在せず、実体は **Repository Variable**（`vars.CLOUDFLARE_ACCOUNT_ID`）として登録されている。このため Workflow 実行時に `accountId` 入力が空文字列に展開され、wrangler が `/memberships` API を呼びに行き Authentication error [code: 10000] で失敗する。

なお、aiworkflow-requirements の現行 UT-27 正本（`deployment-gha.md` / `deployment-secrets-management.md`）には `CLOUDFLARE_ACCOUNT_ID` を Secret とする stale 記述が残っている。本タスクは実 GitHub 設定と workflow 復旧を優先し、Phase 12 Step 2 で正本仕様を Variable へ同期する。

本タスクは該当 6 箇所の参照を `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` に置換し、main ブランチの `backend-ci` / `web-cd` deploy-production job を green に戻すことを目的とする。

## スコープ

### 含む

- `.github/workflows/backend-ci.yml` の `secrets.CLOUDFLARE_ACCOUNT_ID` 参照 4 箇所（L42, L53, L87, L98）を `vars.CLOUDFLARE_ACCOUNT_ID` に置換
- `.github/workflows/web-cd.yml` の `secrets.CLOUDFLARE_ACCOUNT_ID` 参照 2 箇所（L45, L82）を `vars.CLOUDFLARE_ACCOUNT_ID` に置換
- aiworkflow-requirements の GitHub Secrets / Variables 正本で `CLOUDFLARE_ACCOUNT_ID` を Repository Variable として同期
- 修正後の workflow yaml の構文検証（actionlint / yamllint）
- リポジトリ全体に他の `secrets.CLOUDFLARE_ACCOUNT_ID` 参照が残っていないかの全文検索
- 参照変更が `vars.CLOUDFLARE_ACCOUNT_ID` の登録状態と整合するかの確認（`gh api repos/.../actions/variables`）
- main マージ後の deploy-production job 再実行による回帰確認手順

### 含まない

- API Token のスコープ監査・ローテーション（別タスク化候補。本タスクの scope out）
- staging / production の Token 値分離（別タスク化候補。本タスクの scope out）
- `apps/api/wrangler.toml` の `vars.SHEETS_SPREADSHEET_ID` 等が `env.production.vars` に継承されない warning の対応（別タスク化候補）
- `apps/web/wrangler.toml` の `pages_build_output_dir` 未設定 warning の対応（別タスク化候補）
- `CLOUDFLARE_ACCOUNT_ID` を Variable から Secret へ移し替える運用変更（Cloudflare Account ID は識別子であり資格情報ではないため不要と判断、Phase 1 で根拠を明記）
- 他の workflow（`ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml`）への変更（参照箇所が存在しないことを Phase 1 で確認）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-27（GitHub Secrets / Variables 配備） | `vars.CLOUDFLARE_ACCOUNT_ID` の registration 元 |
| 上流 | UT-CICD-DRIFT-001（CI/CD topology drift cleanup） | workflow 棚卸しの正本 |
| 並列 | なし | 独立した小規模 fix |
| 下流 | main ブランチの本番デプロイ全般 | 修正後 deploy-production job が回復することで以降の main push が green になる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/backend-ci.yml | 修正対象（4 箇所） |
| 必須 | .github/workflows/web-cd.yml | 修正対象（2 箇所） |
| 必須 | https://github.com/daishiman/UBM-Hyogo/actions/runs/25153872414 | backend-ci 失敗ログ（authentication error 出力元） |
| 必須 | https://github.com/daishiman/UBM-Hyogo/actions/runs/25153872595 | web-cd 失敗ログ |
| 参考 | https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/ | Account ID は識別子であり Secret 化不要の根拠 |
| 参考 | https://github.com/cloudflare/wrangler-action | `accountId` 入力仕様（機密フラグなし） |
| 参考 | docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment | Secret / Variable 振り分けの正本 |

## 受入条件 (AC)

- AC-1: `.github/workflows/backend-ci.yml` の 4 箇所が `vars.CLOUDFLARE_ACCOUNT_ID` に置換されている
- AC-2: `.github/workflows/web-cd.yml` の 2 箇所が `vars.CLOUDFLARE_ACCOUNT_ID` に置換されている
- AC-3: リポジトリ内に `secrets.CLOUDFLARE_ACCOUNT_ID` の参照が 0 件である（`grep -rn 'secrets.CLOUDFLARE_ACCOUNT_ID' .github/`）
- AC-4: `gh api repos/daishiman/UBM-Hyogo/actions/variables` で `CLOUDFLARE_ACCOUNT_ID` が Variable として登録され、`actions/secrets` には存在しないことを確認している
- AC-5: 修正後 yaml が `actionlint` および `yamllint` で構文エラーゼロで通る
- AC-6: main マージ後に `backend-ci` deploy-production job が green になる（手動 smoke として記録）
- AC-7: main マージ後に `web-cd` deploy-production job が green になる（手動 smoke として記録）
- AC-8: Phase 12 close-out で 7 ファイル（main.md + 6 補助）が揃っている
- AC-9: 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しないことを確認している（参照変更のみで侵害不可）
- AC-10: Account ID を Secret 化しない判断根拠が Phase 1 に明記されている
- AC-11: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- AC-12: aiworkflow-requirements の UT-27 / GitHub Secrets・Variables 正本が `CLOUDFLARE_ACCOUNT_ID` = Repository Variable に同期されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計（修正方針・参照置換マップ） | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11/main.md / manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md + 6 補助ファイル |
| 13 | PR作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4 条件評価・真の論点・vars vs secret 判断根拠・正本 drift） |
| 設計 | outputs/phase-02/main.md | 修正方針・参照置換マップ・検証戦略 |
| レビュー | outputs/phase-03/main.md | 代替案検討・PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/main.md | 修正の検証戦略（grep / actionlint / CI 再実行） |
| 実装 | outputs/phase-05/main.md | 6 箇所置換のランブック・diff サンプル |
| 異常系 | outputs/phase-06/main.md | vars 未登録時 / yaml 構文エラー時の挙動 |
| AC | outputs/phase-07/main.md | AC × 検証 × 成果物トレース |
| DRY | outputs/phase-08/main.md | 重複参照削減の検討（不要判定） |
| QA | outputs/phase-09/main.md | line budget / link / mirror parity |
| ゲート | outputs/phase-10/main.md | GO/NO-GO 判定 |
| 証跡 | outputs/phase-11/main.md | NON_VISUAL smoke 結果サマリー |
| 証跡 | outputs/phase-11/manual-smoke-log.md | grep / gh api / CI run 結果ログ |
| ガイド | outputs/phase-12/main.md | Phase 12 サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け）+ Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | scope out した派生タスク列挙 |
| ガイド | outputs/phase-12/skill-feedback-report.md | skill フィードバック |
| ガイド | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 compliance evidence |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |
| メタ | artifacts.json | 機械可読サマリー |
| メタ | outputs/artifacts.json | 生成物 ledger |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| GitHub Actions | CI / CD workflow 実行基盤 | public repo は無制限 |
| Cloudflare Workers / Pages | apps/api / apps/web デプロイ先 | 無料枠 |
| cloudflare/wrangler-action@v3 | wrangler 実行アクション | OSS |
| actionlint / yamllint | workflow yaml 構文検証 | OSS |
| ripgrep (`rg`) / `grep` | 参照箇所の網羅検索 | OSS |
| `gh api` | GitHub Variables/Secrets 状態確認 | OSS |

## Secrets / Variables 一覧

本タスクで導入・変更する Secret / Variable はない。既存の参照を `secrets.` から `vars.` に切り替えるのみ。

| 名前 | 種別 | 用途 | 本タスクでの扱い |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret（environment: staging / production） | wrangler 認証 | 参照のみ（変更なし） |
| `CLOUDFLARE_ACCOUNT_ID` | Variable（repository） | Cloudflare account 識別 | 参照を `secrets.` → `vars.` に修正 |
| `CLOUDFLARE_PAGES_PROJECT` | Variable（repository） | Pages project 名 | 参照のみ（変更なし） |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | workflow 参照変更のみ。データアクセス境界に影響なし |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-12 が Phase 7 / 10 / 12 で完全トレースされる
- skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- main マージ後の `backend-ci` および `web-cd` deploy-production job が green になる
- Phase 12 の same-wave sync ルール（LOGS.md / SKILL.md / topic-map）に違反しない
- Phase 13 はユーザー明示承認後にのみ実行する

## 苦戦想定 / 知見

**1. vars vs secret の判断軸**
Cloudflare Account ID はダッシュボード URL 等で公開される識別子であり、資格情報ではない。Variable 配置は Cloudflare 公式・wrangler-action 公式の慣行と整合する。Secret 化はコスト（運用・ローテーション・他値との混同）が便益を上回るため不採用。Phase 1 に判断根拠を明記。

**2. CI ログでの Account ID 露出**
失敗時の `whoami` 出力で Account ID が公開ログに既に露出している。仮に Secret 化しても wrangler 自身がマスクなしで出力するため、Secret 化による情報秘匿効果はゼロ。この事実を Phase 1 / Phase 2 に記録。

**3. 参照箇所の網羅性**
`secrets.CLOUDFLARE_ACCOUNT_ID` の参照は 6 箇所以外に存在しないことを `grep -rn 'secrets.CLOUDFLARE_ACCOUNT_ID' .github/` で確認する。Phase 1 開始時の必須チェック。

**4. 回帰確認のタイミング**
本修正は main マージ後でないと deploy-production job の回復確認ができない（job が `if: github.ref_name == 'main'` で gate されているため）。Phase 11 の smoke test は「マージ後の CI 再実行で green を確認」する手順とし、マージ前は actionlint / yamllint / grep で代替する。

**5. 派生タスクの起票方針**
scope out した 4 項目（API Token スコープ監査 / staging-prod token 分離 / wrangler.toml warning 2 件）は Phase 12 の `unassigned-task-detection.md` で起票候補として列挙する。本タスクで実装する範囲ではない。

## 関連リンク

- 上位 README: ../README.md
- 失敗ログ（backend-ci）: https://github.com/daishiman/UBM-Hyogo/actions/runs/25153872414
- 失敗ログ（web-cd）: https://github.com/daishiman/UBM-Hyogo/actions/runs/25153872595
- 上流仕様: ../completed-tasks/ut-27-github-secrets-variables-deployment/
- 上流棚卸し: ../completed-tasks/ut-cicd-workflow-topology-drift-cleanup/
