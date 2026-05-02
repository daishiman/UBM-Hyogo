# Phase 11 成果物 — 手動 smoke test サマリ（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 11 |
| 状態 | planned |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |
| 生成日 | 2026-05-01 |
| 実機実行日時 | （未実施 / Phase 13 直前のユーザー明示承認後に追記） |
| 実施者 | （未実施 / 承認後に GitHub handle のみを追記。氏名・メールは記載しない） |
| Token ラベル | staging: `ubm-hyogo-cf-staging-min-YYYYMMDD` / production: `ubm-hyogo-cf-prod-min-YYYYMMDD`（ラベル名のみ・値は記録しない） |

> **状態語彙の宣言**: 本 Phase 11 成果物は現時点では `planned` である。Static / Runtime 検証コマンドの実機実行は Phase 13 直前のユーザー明示承認後に行い、結果が記録された時点で `executed` に昇格する。Permission Matrix が PASS かつ Phase 12 compliance check が PASS となった時点で `verified` に昇格する。

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（Cloudflare API Token のスコープ最小化監査） |
| 非視覚的理由 | UI / UX に変更を加えない。CI/CD の認証 Secret と Cloudflare 側の Token 権限のみが対象であり、ユーザー画面の見た目・導線・状態遷移を一切変更しない security audit / CI infra 作業である |
| 代替証跡 | (1) `gh secret list --env <env>` の名前と更新日時、(2) `grep` による workflow yaml 内 Secret 参照箇所の件数、(3) `bash scripts/cf.sh` 実行時の exit code と日時、(4) Cloudflare Dashboard Token 詳細ページから転記した「権限名」のみ |
| Screenshot | UI/UX 変更なしのため Phase 11 でのスクリーンショット生成は不要・かつ生成禁止（`outputs/phase-11/` 配下に画像ファイルを置かない） |

## 実施情報

| 項目 | 値 |
| --- | --- |
| 対象 Secret | `CLOUDFLARE_API_TOKEN`（GitHub Environment Secret: `staging` / `production`） |
| 参照 Variable | `${{ vars.CLOUDFLARE_ACCOUNT_ID }}`（実値は記録しない） |
| 実行ホスト | ローカル開発機（macOS / mise + pnpm + 1Password CLI） |
| 実行ラッパ | `bash scripts/cf.sh`（直接 `wrangler` を呼ばない・`set -x` 禁止・`--debug` 禁止） |
| 実行範囲 | staging のみ（production smoke は Phase 13 切替直後に `manual-smoke-log.md` へ追記する。本 main.md では production 結果欄も placeholder として残す） |

## 実施手順との対応

Phase 11 仕様 `phase-11.md` で定義された 3 区分（Static / Runtime / Permission Matrix）に対応するサマリを以下に記録する。実コマンドと出力ログは `outputs/phase-11/manual-smoke-log.md`、Cloudflare Dashboard 権限突合は `outputs/phase-11/permission-matrix-validation.md` に分離して記録する。

## Static 検証サマリ（TC-S01〜TC-S05）

| TC ID | 目的 | 関連 AC | 期待 | staging 判定 | production 判定 |
| --- | --- | --- | --- | --- | --- |
| TC-S01 | `gh secret list --env staging` で `CLOUDFLARE_API_TOKEN` の存在を名前のみで確認 | AC-12 | 1 件ヒット・値非表示 | （planned: PASS / FAIL） | n/a |
| TC-S02 | `gh secret list --env production` で `CLOUDFLARE_API_TOKEN` の存在を名前のみで確認 | AC-12 | 1 件ヒット・値非表示 | n/a | （planned: PASS / FAIL） |
| TC-S03 | workflow yaml 側の Token 参照が `secrets.CLOUDFLARE_API_TOKEN` 経由のみ | AC-8 | `grep` ヒット件数 ≥ 1（backend-ci.yml / web-cd.yml の合計） | （planned: PASS / FAIL） | （同左） |
| TC-S04 | `vars.CLOUDFLARE_API_TOKEN` の誤登録 0 件 | AC-8 / AC-12 | grep 0 件 | （planned: PASS / FAIL） | （同左） |
| TC-S05 | 仕様書・ログに Token 値（40 文字級英数字）が混入していないこと | AC-8 | 疑わしい長文字列 0 件 | （planned: PASS / FAIL） | （同左） |

> 詳細出力（コマンド・exit code・マスク済みログ）は `manual-smoke-log.md` を参照。

## Runtime 検証サマリ（TC-R01〜TC-R05・staging のみ）

| TC ID | 目的 | 検証する権限 | 関連 AC | 期待 exit | staging 判定 | production 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| TC-R01 | `bash scripts/cf.sh whoami` が成功する（Token 値は出力しない） | User context 取得 | AC-3 / AC-8 | 0 | （planned） | （Phase 13 後追記） |
| TC-R02 | `bash scripts/cf.sh d1 list` が成功する | Account Settings:Read + D1:Read 系 | AC-3 | 0 | （planned） | （Phase 13 後追記） |
| TC-R03 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` が成功する | D1:Edit | AC-3 | 0 | （planned） | n/a（production migration は Phase 13 切替後に別途記録） |
| TC-R04 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` が成功する | Workers Scripts:Edit | AC-4 | 0 | （planned） | （Phase 13 後追記） |
| TC-R05 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` が成功する | Cloudflare Pages:Edit | AC-5 | 0 | （planned） | （Phase 13 後追記） |

> 詳細出力（コマンド・exit code・マスク済みログ・実行日時）は `manual-smoke-log.md` を参照。

## Permission Matrix 突合サマリ

Cloudflare Dashboard の Token 詳細ページから「権限名のみ」を `permission-matrix-validation.md` に転記し、Phase 2 で確定した必要最小権限テーブルと 1 対 1 で突合する。

| Token resource | Phase 2 必要 | staging Token 実付与 | production Token 実付与 | 判定 | 関連 AC |
| --- | --- | --- | --- | --- | --- |
| Account / Workers Scripts:Edit | ✅ | （planned: 記録） | （planned: 記録） | （PASS/FAIL） | AC-1 / AC-2 / AC-4 |
| Account / D1:Edit | ✅ | （planned: 記録） | （planned: 記録） | （PASS/FAIL） | AC-1 / AC-2 / AC-3 |
| Account / Cloudflare Pages:Edit | ✅ | （planned: 記録） | （planned: 記録） | （PASS/FAIL） | AC-1 / AC-2 / AC-5 |
| Account / Account Settings:Read | ✅ | （planned: 記録） | （planned: 記録） | （PASS/FAIL） | AC-1 / AC-2 |
| Account / Workers KV Storage:Edit | 条件付き | 4 権限で dry-run 失敗時のみ追加 | 同左 | （N/A or 追加要） | AC-2 |
| User / User Details:Read | 条件付き | 4 権限で whoami 失敗時のみ追加 | 同左 | （N/A or 追加要） | AC-2 |
| その他（過剰権限） | ❌（0 件） | （planned: 0 件宣言） | （planned: 0 件宣言） | 0 件であること | AC-1 |

> 過剰権限が 1 件でも検出された場合は AC-1 不充足として Phase 5 ランブックへ差し戻す。Workers KV Storage:Edit / User Details:Read を後付け追加した場合は、Phase 2 設計書と本 main.md の双方に追記し、ADR の Token 権限境界に反映させる。

## AC PASS/FAIL 判定欄（実機実行後に更新）

| AC | 内容（要約） | 判定根拠 | 判定 |
| --- | --- | --- | --- |
| AC-3 | staging Token で `d1 migrations list` が exit=0 | TC-R03 | （planned: PASS / FAIL） |
| AC-4 | staging で `apps/api` deploy --dry-run が exit=0 | TC-R04 | （planned: PASS / FAIL） |
| AC-5 | staging で `apps/web` deploy --dry-run が exit=0 | TC-R05 | （planned: PASS / FAIL） |
| AC-8 | Phase 11 evidence に Token 値が含まれず権限名・検証結果・日時のみ記録 | TC-S03 / TC-S05 / 本ファイルおよび `manual-smoke-log.md` のマスク確認 | （planned: PASS / FAIL） |
| AC-12 | `gh secret list` で `CLOUDFLARE_API_TOKEN` の存在のみ確認・値非出力 | TC-S01 / TC-S02 | （planned: PASS / FAIL） |

> AC-1 / AC-2（権限マトリクス突合）の判定は `permission-matrix-validation.md` に集約し、本 main.md からはサマリ参照のみとする。AC-6 / AC-7（適用順序・rollback）は Phase 2 設計に対する Phase 11 の実機検証として「rollback dry-run が staging で 1 度通っていること」を `manual-smoke-log.md` 末尾に記録する。

## Cloudflare Dashboard 確認結果欄（権限名のみ）

実機確認は実施承認後に Cloudflare Dashboard の `My Profile → API Tokens → <Token> → View / Edit` から「権限名のみ」を読み取り、以下に転記する。Token 値、Token ID、Token URL、IP 制限、TTL の絶対値は転記しない。

### staging Token

| Resource Scope | 権限名（実付与） | Phase 2 必要との一致 |
| --- | --- | --- |
| （planned: Account 配下） | （planned: 例 `Workers Scripts:Edit`） | （PASS/FAIL） |
| ... | ... | ... |
| 過剰権限件数 | （planned: 0 件） | （宣言済 / NG） |

### production Token

| Resource Scope | 権限名（実付与） | Phase 2 必要との一致 |
| --- | --- | --- |
| （planned: Phase 13 切替直後に追記） | （planned） | （planned） |
| 過剰権限件数 | （planned: 0 件） | （宣言済 / NG） |

## 既知制限・運用上の注意

- `set -x` は本 Phase で **使用禁止**。bash の x-trace は環境変数（1Password 経由で注入された Token を含む）をそのまま stderr に書き出すため、ログ転記時に Token 値が混入するリスクがある。`scripts/cf.sh` 内部でも `set -x` を有効化しないこと。
- `wrangler --debug` フラグも **使用禁止**。スタックトレースに Token 値が含まれるリスクがある。デバッグが必要な場合は `--dry-run` のみで切り分けする。
- `gh secret get` は実値を取得できるため **使用禁止**。Phase 11 では `gh secret list` の名前と更新日時のみを使う。
- stderr の取り扱い: コマンド実行時は `2>&1` で stdout/stderr を一体化したうえで `manual-smoke-log.md` に貼り付ける前に、40 文字以上の英数字列（Token 値の典型形）を `***REDACTED***` に置換する。マスク後の grep（TC-S05）で再確認すること。
- Cloudflare Dashboard の Token 詳細 URL（`/profile/api-tokens/<token-id>` の `<token-id>` 部分）はログに残さない。Token ラベル名のみで識別する。
- staging Token と production Token の値は **必ず別 Token** にする（Phase 2 で分離方針を確定済み）。同一値だと scope 監査の意味が半減する。
- Token 発行直後の 1 度しか平文表示されないため、staging Token 発行 → smoke 実施 → production 切替の動線は 24h 以内で完了させる。旧 Token は rollback 用に 24h 保持し、smoke / rollback dry-run が PASS した時点で失効させる。

## 完了条件チェックリスト（Phase 11 内部）

- [ ] Static 検証 5 項目（TC-S01〜TC-S05）が全 PASS で `manual-smoke-log.md` に記録されている
- [ ] Runtime 検証 5 項目（TC-R01〜TC-R05）が staging で exit=0 として `manual-smoke-log.md` に記録されている
- [ ] Permission Matrix 突合（`permission-matrix-validation.md`）で過剰権限 0 件・不足権限 0 件が宣言されている
- [ ] NON_VISUAL 宣言が `manual-smoke-log.md` 冒頭にも明記されている
- [ ] Token 値・Account ID 値・Token ID が成果物に含まれない（TC-S05 で再確認済み）
- [ ] rollback 手順（旧 Token 復元 → 新 Token 失効）が staging で 1 度通っていることが `manual-smoke-log.md` 末尾に記録されている
- [ ] 本 main.md の AC PASS/FAIL 欄が（planned）から実値に置換されている
- [ ] `artifacts.json` の `phase-11.status` が `executed`（または `verified`）に更新されている

## 関連リンク

- `../../index.md`
- `../../phase-11.md`
- `../../artifacts.json`
- `../phase-02/main.md`（権限マトリクス・適用順序・rollback 設計の正本）
- `../phase-04/main.md`（テスト戦略・TC ID 体系の正本）
- `../phase-05/main.md`（実装ランブック・Token 再発行手順の正本）
- `../phase-07/main.md`（AC × 検証 × 成果物トレース）
- `./manual-smoke-log.md`（実コマンド・exit code・マスク済みログの正本）
- `./permission-matrix-validation.md`（Cloudflare Dashboard 権限突合の正本）
- 並列タスク `U-FIX-CF-ACCT-02`（CI/CD runtime warning cleanup・Token 分離 ADR を共有）
- `scripts/cf.sh`（wrangler 実行ラッパ・op + esbuild + mise）
- `.github/workflows/backend-ci.yml` / `.github/workflows/web-cd.yml`
