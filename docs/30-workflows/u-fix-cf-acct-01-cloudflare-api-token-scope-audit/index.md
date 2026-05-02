# u-fix-cf-acct-01-cloudflare-api-token-scope-audit - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01 |
| タスク名 | Cloudflare API Token のスコープ最小化監査 |
| ディレクトリ | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit |
| Wave | 2026-05-01 起票 |
| 実行種別 | parallel（独立着手可能、U-FIX-CF-ACCT-02 と整合） |
| 作成日 | 2026-05-01 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation |
| サブタイプ | security-audit（Cloudflare API Token のスコープ最小化と権限突合） |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | HIGH |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #330（CLOSED） |
| 補足 | GitHub Issue #330 は CLOSED 状態だが、本タスク仕様書は seed spec から再構築するため `spec_created` として作成する。Phase 11/12 の evidence で Issue 再オープンの要否を判断する |

## 目的

`CLOUDFLARE_API_TOKEN`（GitHub Environment Secret）が `cloudflare/wrangler-action` / D1 migration / Pages deploy の各ステップで必要最小権限に絞られている根拠を示し、過剰権限が付与されていれば最小化したうえで、staging で検証 → production に適用 → rollback 経路を残すまでを実施する。

`CLOUDFLARE_ACCOUNT_ID` の Variable 化（FIX-CF-ACCT-ID-VARS-001）は完了済みのため、本タスクは「Token 値そのもの」と「付与権限」の監査・最小化に責務を限定する。

## スコープ

### 含む

- Cloudflare API Token に必要な権限を Workers Scripts / Workers KV / D1 / Pages / Account Settings / User Details の単位で表化
- staging Token を最小権限で再発行し、`gh` CLI 経由で Environment Secret を更新する手順
- production Token への適用順序と rollback 手順を Phase 11 evidence に残す
- Token 値・Account 情報を成果物に記録しない運用ルールの確認
- ADR 化方針（U-FIX-CF-ACCT-02 の wrangler warning 対応と整合させる token 分離指針）

### 含まない

- `CLOUDFLARE_ACCOUNT_ID` の Variable 化（FIX-CF-ACCT-ID-VARS-001 で完了済み）
- wrangler runtime warning 本体（`apps/api/wrangler.toml` の vars 継承 / `apps/web/wrangler.toml` の `pages_build_output_dir`）の修正（U-FIX-CF-ACCT-02）
- Token 値そのものの記録・転記
- Cloudflare Dashboard の UI 改修・Account 構造変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | FIX-CF-ACCT-ID-VARS-001 | Account ID 参照修正後でないと Token 単独要因の切り分けが困難 |
| 上流 | UT-27（GitHub Secrets / Variables 配備） | `CLOUDFLARE_API_TOKEN` の登録元 |
| 並列 | U-FIX-CF-ACCT-02（CI/CD runtime warning cleanup） | token 分離 ADR を共有する |
| 下流 | main ブランチの本番デプロイ全般 | Token 最小化後も deploy が green であること |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| seed | docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md | 起票元の seed spec |
| 関連 | docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md | 並列タスクとの整合 |
| 必須 | .github/workflows/backend-ci.yml | Token 利用 step（D1 migration / Workers deploy） |
| 必須 | .github/workflows/web-cd.yml | Token 利用 step（Pages deploy） |
| 必須 | scripts/cf.sh | wrangler 実行ラッパ（op + esbuild） |
| 参考 | https://developers.cloudflare.com/fundamentals/api/reference/permissions/ | Cloudflare API Token Permissions リファレンス |
| 参考 | https://github.com/cloudflare/wrangler-action | wrangler-action 必須権限 |
| 参考 | docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment | Secret 配備の正本 |

## 受入条件 (AC)

- AC-1: `CLOUDFLARE_API_TOKEN` に付与されている Cloudflare 権限が表化され、不要権限が 0 件である
- AC-2: 必要権限マトリクス（Workers Scripts:Edit / D1:Edit / Cloudflare Pages:Edit / Account Settings:Read）が Phase 2 で根拠付きに記載されている。Workers KV Storage:Edit / User Details:Read は実測で必要と判明した場合のみ追加候補として扱う
- AC-3: staging Token に最小権限を適用し、`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` が exit=0 になる
- AC-4: staging で `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` が exit=0 になる
- AC-5: staging で `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` が exit=0 になる
- AC-6: production Token への適用順序（旧 Token を一定期間保持 → 新 Token 切替 → 旧 Token 失効）が Phase 2 で図解されている
- AC-7: rollback 手順（旧 Token 復元 → 新 Token 失効）が Phase 2 で記載されている
- AC-8: Phase 11 evidence に Token 値が含まれず、権限名・検証結果・日時のみが記録されている
- AC-9: 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しない（CI/CD と Token 監査は境界外）
- AC-10: Token 分離 ADR（staging / production）の方針が U-FIX-CF-ACCT-02 と整合している
- AC-11: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- AC-12: `gh secret list --env production` / `gh secret list --env staging` で `CLOUDFLARE_API_TOKEN` の存在のみ確認し、値は出力されていない

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計（権限マトリクス・適用順序・rollback） | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR作成 | phase-13.md | blocked_until_user_approval | outputs/phase-13/main.md |

> Phase 1〜12 の `completed` は仕様成果物・planned evidence container の作成完了を意味する。Cloudflare Token 再発行、GitHub Secret 更新、staging smoke 実測、production 切替、PR 作成は未実行であり、root workflow は `spec_created` のまま据え置く。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4 条件評価・真の論点・Token vs OIDC 判断） |
| 設計 | outputs/phase-02/main.md | 権限マトリクス・staging→production 適用順序・rollback 設計 |
| レビュー | outputs/phase-03/main.md | 代替案（広め Token / scope 別 Token / OIDC）と PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/main.md | grep / cf.sh dry-run / gh api を使った検証戦略 |
| 実装 | outputs/phase-05/main.md | Token 再発行・Secret 更新ランブック |
| 異常系 | outputs/phase-06/main.md | 権限不足時 / Token 失効時の挙動 |
| AC | outputs/phase-07/main.md | AC × 検証 × 成果物トレース |
| 証跡 | outputs/phase-11/main.md | NON_VISUAL smoke 結果サマリー（Token 値非記録） |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け）+ Part 2（技術者向け） |
| メタ | artifacts.json | 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Dashboard / API Tokens | Token 発行・権限編集 | 無料 |
| GitHub Actions Environments | staging / production の Secret 分離 | public repo は無料 |
| `gh secret` / `gh api` | Secret 状態確認（値は出さない） | OSS |
| `scripts/cf.sh` | wrangler 実行ラッパ（op + esbuild） | リポジトリ内 |
| `cloudflare/wrangler-action@v3` | CI 上の wrangler 実行 | OSS |

## Secrets / Variables 一覧

本タスクは既存 Secret の値を再発行・更新するが、新規 Secret / Variable は導入しない。

| 名前 | 種別 | 用途 | 本タスクでの扱い |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret（environment: staging / production） | wrangler 認証 | 権限を最小化して再発行・値を更新 |
| `CLOUDFLARE_ACCOUNT_ID` | Variable（repository） | Cloudflare account 識別 | 参照のみ（変更なし） |
| `CLOUDFLARE_PAGES_PROJECT` | Variable（repository） | Pages project 名 | 参照のみ（変更なし） |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | CI/CD Token の権限監査のみ。`apps/web` 側のデータアクセス境界に影響なし。D1:Edit 権限は CI（`apps/api` のマイグレーション）からの利用のみ |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-12 が Phase 7 / 10 / 12 で完全トレースされる
- skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- staging / production の Token に余剰権限がゼロであることを Cloudflare Dashboard 確認結果として Phase 11 evidence に記録
- Phase 11 evidence に Token 値・Account 情報が含まれていない
- Phase 13 はユーザー明示承認後にのみ実行する

## 状態語彙

| 状態 | 意味 | 本仕様での扱い |
| --- | --- | --- |
| `planned` | 手順・期待結果を定義済みで、実行証跡は未作成 | Phase 1〜13 の本文は原則この状態 |
| `executed` | 手動操作・コマンドを実行し、`outputs/` に実測ログがある | Phase 5 / 11 実行後のみ使用 |
| `verified` | Phase 11 evidence と Phase 12 compliance check が PASS | 正本仕様同期と Phase 13 の前提 |

この workflow root は `spec_created` のため、本文中の PASS / GO は「実行時の判定基準」または「設計レビュー上の暫定判定」を意味する。`outputs/` 実体がない段階で実測 PASS と扱わない。

## 苦戦想定

**1. Token 値が表示できない**
Cloudflare API Token は発行直後の 1 度しか平文表示されない。再発行と切替の間に旧 Token を保持する必要があり、Phase 2 でその保持期間（推奨: 24h 以内）と切替手順を設計する必要がある。

**2. CI ログに Token を露出させてはいけない**
`whoami` 等の wrangler 出力には Token は含まれないが、エラー時のスタックトレースに含まれるリスクがある。Phase 6 異常系で必ず `set -x` を使わない手順を定義する。

**3. 必要最小権限の境界**
`Workers Scripts:Edit` だけでは KV や Queues を扱えず、`Cloudflare Pages:Edit` は `Workers Scripts:Edit` を内包しない。Phase 2 で wrangler-action と D1 migration それぞれが触る resource を表化する必要がある。

**4. staging / production の Token 分離**
現状は staging / production 双方が environment-scoped Secret として登録されているが、値が同一 Token のままだと scope 監査の意味が半減する。U-FIX-CF-ACCT-02 と整合した分離方針を ADR 化する。

**5. CLOSED Issue #330 との関係**
Issue は CLOSED だが seed spec は未消化のため、本仕様書は `spec_created` として開始する。Phase 12 で Issue 再オープンか新規 Issue 起票かの判断根拠を残す。

## 関連リンク

- 上位 README: ../README.md
- seed spec: ../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md
- 並列タスク: ../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md
- 上流仕様: ../completed-tasks/ut-27-github-secrets-variables-deployment/
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/330（CLOSED）
