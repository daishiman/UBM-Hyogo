[実装区分: 実装仕様書]

# Phase 8: 品質ゲート / CI 統合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-15: WAF / Rate Limiting ルール設定 (ut-15-waf-rate-limiting-rules-setup) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 品質ゲート / CI 統合 |
| 作成日 | 2026-05-09 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（セキュリティ / 監視 / 運用継続性） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / cloudflare_edge_security |
| visualEvidence | NON_VISUAL（CLI / dashboard / GraphQL Analytics ログで evidence 化。screenshot 取得不可） |
| scope | cloudflare_edge_security |

## 目的

Phase 1〜3 で固定した実装方式（`scripts/cf-waf-apply.sh` + `scripts/cf-waf-apply/config.json` + `apps/api/src/middleware/edge-rate-limit-headers.ts`）と Phase 6 の検証マトリクスを、CI gate として恒常的に enforce するための「品質ゲート / CI 統合層」を確定する。本 Phase は実コード未実装の spec_created に閉じ、(a) typecheck / lint / test / coverage の各 gate 期待結果、(b) 新規 CI workflow `cf-waf-validate.yml` 設計（任意採否）、(c) shellcheck / actionlint / 既存 `verify-design-tokens` パターンとの整合、(d) CI 失敗時の対応フローを SSOT として記述する。`wrangler` 直接実行禁止 / `bash scripts/cf.sh` 経由必須 / `op run` 経由 token 注入は CI gate でも維持する。

## 真の論点 (true issue)

- 「Cloudflare 設定スクリプトの正しさ」ではなく、**「`scripts/cf-waf-apply.sh` の宣言的構成（config.json）と実 zone の差分が CI gate で検出可能になっており、`wrangler` 直接実行・`.env` 実値混入・カスタムルール 5 件超過・`apps/web` からの D1 直接アクセス混入が PR マージ前に必ず止まる」状態を確立すること。
- 副次論点: (1) CI で実 Cloudflare API を叩くか叩かないか（`--dry-run --validate-config` のみで完結させる）、(2) `CLOUDFLARE_API_TOKEN` を CI 上で利用するか（dry-run 時は不要にする設計）、(3) shellcheck / actionlint を既存 workflow 群と同じ厳格度で適用するか。

## 1. 既存 CI workflow との整合確認

`.github/workflows/` 配下の現行 gate を CI 統合の前提とする。Phase 5 実装時に下記が現存することを `test -f` または `rg --files .github/workflows` で確認したうえで本 Phase の決定を反映する。

| 既存 workflow | 役割 | UT-15 との関係 |
| --- | --- | --- |
| `verify-design-tokens.yml`（既存） | OKLch トークン正本性 gate | UT-15 では参照のみ。設計パターン（dry-run + diff exit code）を踏襲 |
| `verify-indexes.yml`（既存） | aiworkflow-requirements indexes drift gate | 設計パターン（生成物 drift 検知）を踏襲 |
| typecheck / lint / test の集約 workflow | `pnpm typecheck` / `pnpm lint` / `pnpm test` | UT-15 の `edge-rate-limit-headers.ts` / `cf-waf-apply.test.ts` も同 gate に乗る |

> Phase 5 着手時に上記 workflow 名が drift していたら、`cf-waf-validate.yml` 内部のジョブ名・依存先 workflow 名を実在ファイルに合わせて補正する。本仕様は workflow 名の固定値ではなく「設計パターンの整合」を確定する。

## 2. 品質ゲート（typecheck / lint / test / coverage）期待結果

| Gate | コマンド | 期待 exit | 失敗時対応 |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | 0 | TS エラーを最小差分で解消（unused / null / type 不整合） |
| lint | `mise exec -- pnpm lint` | 0 | `pnpm lint --fix` 適用後、残違反のみ手修正 |
| unit test (helper) | `mise exec -- pnpm test --filter @ubm/api edge-rate-limit-headers` | 0 | RED の意図と実装乖離を Phase 5 へ差し戻し |
| snapshot test (script) | `mise exec -- pnpm test scripts/__tests__/cf-waf-apply.test.ts` | 0 | `cf-waf-apply/config.json` 変更時は snapshot を意図的更新（PR で diff 明示） |
| coverage | `bash scripts/coverage-guard.sh` | 0 | apps/api workspace の 80/80/80/80（Statements/Branches/Functions/Lines）未達は Phase 6 へ戻す |
| miniflare 429 smoke | `mise exec -- pnpm test apps/api -- --run rate-limit-headers-smoke` | 0 | `retry-after` header / JSON body 形式 drift を Phase 6 で修正 |

### dry-run validate gate（UT-15 固有）

| Gate | コマンド | 期待 exit | 役割 |
| --- | --- | --- | --- |
| config schema 検証 | `bash scripts/cf-waf-apply.sh --dry-run --validate-config` | 0 | `cf-waf-apply/config.json` の schema / カスタムルール件数（≤5）/ rate limit rules 数を静的検証。Cloudflare API は呼ばない |
| dry-run 差分確認 | `bash scripts/cf-waf-apply.sh --dry-run` | 0（差分なし） / 14（差分あり） | PR で意図しない設定変更を検知。exit 14 は CI fail |

> exit 14 は `scripts/cf-waf-apply.sh` で定義済みの「dry-run で差分あり」コード。config validation は Cloudflare API を呼ばないため `CLOUDFLARE_API_TOKEN` を CI に渡さなくても完走できることを設計不変条件とする。

## 3. 新規 CI workflow `cf-waf-validate.yml`（任意採否）

Phase 5 実装時に下記いずれかを採用する。本仕様では (A) を推奨し、(B) は MINOR-03 として follow-up に残す。

| 候補 | 概要 | 採否 |
| --- | --- | --- |
| (A) `cf-waf-validate.yml` 新規作成 | `--validate-config` + `--dry-run --validate-config` を独立 workflow で gate 化 | **推奨** |
| (B) 既存集約 workflow への step 追加 | typecheck/lint と同 job 内で実行 | 代替（実 workflow 構成次第） |

### (A) `cf-waf-validate.yml` 設計（仕様レベル）

```yaml
# .github/workflows/cf-waf-validate.yml （Phase 5 で実コード化）
name: cf-waf-validate
on:
  pull_request:
    paths:
      - "scripts/cf-waf-apply.sh"
      - "scripts/cf-waf-apply/config.json"
      - "scripts/__tests__/cf-waf-apply.test.ts"
      - "scripts/__tests__/fixtures/cf-waf-apply.snapshot.json"
      - "apps/api/src/middleware/edge-rate-limit-headers.ts"
      - "apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts"
      - "apps/api/src/middleware/rate-limit-magic-link.ts"
      - "apps/api/src/middleware/rate-limit-self-request.ts"
      - "apps/api/wrangler.toml"
      - ".github/workflows/cf-waf-validate.yml"
jobs:
  validate-config:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: mise exec -- pnpm install --frozen-lockfile
      - name: shellcheck
        run: shellcheck scripts/cf-waf-apply.sh
      - name: actionlint
        run: actionlint .github/workflows/cf-waf-validate.yml
      - name: validate-config (no API call)
        run: bash scripts/cf-waf-apply.sh --dry-run --validate-config
      - name: snapshot test
        run: mise exec -- pnpm test scripts/__tests__/cf-waf-apply.test.ts
      - name: free-tier guard
        run: |
          rules=$(jq '.customRules | length' scripts/cf-waf-apply/config.json)
          if [ "$rules" -gt 5 ]; then
            echo "ERROR: customRules exceeds free-tier limit (5): $rules"
            exit 1
          fi
      - name: forbid wrangler-direct invocation
        run: |
          violations=$(grep -rnE '(^|[^.])wrangler\b' \
            scripts/cf-waf-apply.sh apps/api/src apps/web/src \
            2>/dev/null | grep -v 'scripts/cf.sh' || true)
          if [ -n "$violations" ]; then
            echo "ERROR: direct wrangler invocation detected (must use scripts/cf.sh)"
            echo "$violations"
            exit 1
          fi
```

> 上記は仕様レベルの擬似 yaml。実コードは Phase 5 で actionlint をパスする形に整える。`paths` トリガは `cf-waf-apply.sh` / `config.json` / `edge-rate-limit-headers.ts` 系の変更でのみ走らせ、無関係 PR の CI コストを抑える。

## 4. shellcheck / actionlint gate

| ツール | 対象 | 期待 |
| --- | --- | --- |
| shellcheck | `scripts/cf-waf-apply.sh` | 警告ゼロ（既存 `scripts/cf.sh` と同水準。SC1091 / SC2086 は意図がある場合のみ disable コメント明記） |
| actionlint | `.github/workflows/cf-waf-validate.yml` | エラーゼロ |
| jq schema | `scripts/cf-waf-apply/config.json` | `.zones` / `.managedRulesets` / `.customRules`（≤5）/ `.rateLimitRules` の型と件数を静的検証 |

## 5. 既存 `verify-design-tokens` 等のパターン整合

| パターン | UT-15 への適用 |
| --- | --- |
| 「生成物 drift を CI で gate 化する」 | `cf-waf-apply/config.json` ⇄ `cf-waf-apply.snapshot.json` の dry-run 差分検出に適用 |
| 「dry-run で差分があれば fail」 | exit 14（差分あり）= CI fail に統一 |
| 「PR の paths trigger で関連変更時のみ走らせる」 | `cf-waf-validate.yml` の `paths:` で限定 |
| 「workspace 横断で `mise exec` 経由」 | Node 24 / pnpm 10 を `mise-action` + `mise exec --` で固定 |

## 6. CI 失敗時の対応フロー

| 失敗 gate | 一次対応 | エスカレーション |
| --- | --- | --- |
| typecheck | 当該 PR で型を最小差分修正 → 再 push | 3 連続失敗で Phase 5 設計差分を Phase 3 へ差し戻す |
| lint | `pnpm lint --fix` → 残違反を手修正 | ルール不一致が頻発する場合 lint 設定の調整 PR を別建て |
| unit / smoke test | RED → 実装の意図を確認のうえ Phase 5 / 6 へ戻す | smoke test が flaky な場合は Phase 9 の監視で再現性を確認 |
| coverage | テスト追加で 80/80/80/80 達成 | 達成困難なら Phase 6 で対象範囲を再定義 |
| dry-run diff (exit 14) | snapshot 意図的更新の PR では `cf-waf-apply.snapshot.json` も同時更新 | 意図しない差分は revert |
| free-tier guard | カスタムルール削減 / 統合 | 5 件超過要件発生時は Pro 移行 RFC を新規 issue で起票（MINOR-01 と統合） |
| forbid wrangler-direct | `bash scripts/cf.sh` 経由に書き換え | 例外不可（CLAUDE.md §シークレット管理 違反） |
| shellcheck / actionlint | 該当行修正 | 抑止コメントは SSOT（本 Phase）の許可がある場合のみ |

## 7. 実行タスク

1. 既存 `.github/workflows/*.yml` を `rg --files .github/workflows` で列挙し、本 Phase が想定する workflow 名と drift がないか Phase 5 着手時に再確認する。
2. (A) `cf-waf-validate.yml` 新規作成案と (B) 既存集約 workflow への step 追加案のうち、Phase 5 実装担当が repo 状況に応じて採否を決定する（本仕様の推奨は (A)）。
3. dry-run validate gate（`--dry-run --validate-config`）が CI 上で `CLOUDFLARE_API_TOKEN` 不要で完走することを設計不変条件として固定する。
4. shellcheck / actionlint / jq schema 静的検証を CI step として盛り込む。
5. 「カスタムルール 5 件超過」「`wrangler` 直接実行」「`apps/web` からの D1 直接アクセス」を CI gate で fail させる guard step を仕様化する。
6. CI 失敗時の対応フロー表を Phase 9（運用継続性）/ Phase 12（implementation-guide）へ引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `index.md` | 受け入れ基準 AC-1〜AC-10 |
| 必須 | `phase-01.md` | 想定アーキテクチャ / 実装ターゲット候補 |
| 必須 | `phase-02.md` | Rate Limiting / WAF / 責務分離マトリクス |
| 必須 | `phase-03.md` | exit code 仕様 / MINOR / NO-GO |
| 必須 | `CLAUDE.md` §シークレット管理 / Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 経由必須・`wrangler` 直接実行禁止 |
| 必須 | `scripts/cf.sh` | Cloudflare 系 CLI ラッパ正本 |
| 参考 | `.github/workflows/verify-design-tokens.yml`（既存） | dry-run + diff exit code の設計パターン |
| 参考 | `.github/workflows/verify-indexes.yml`（既存） | drift gate の設計パターン |

## 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TBD（Phase 6 で記録 → 本 Phase で gate 化） |
| ユニットテスト Branch | 80%+ | TBD |
| ユニットテスト Function | 80%+ | TBD |
| 結合テスト API | 100% | TBD（apps/api 既存 contract test 回帰なし） |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系 | 80%+ | TBD（429 retry-after smoke / dry-run diff） |
| CI/CD workflow 実在確認 | 100% | TBD（`rg --files .github/workflows` で確認） |

## 多角的チェック観点

- **CI workflow 実在確認**: 仕様書・PR body・runbook が参照する `.github/workflows/*.yml` が repo に実在するか（Phase 9 品質ゲート §CI/CD workflow 変更 と整合）。
- **API 不要 dry-run**: `--validate-config` モードで CI 上 `CLOUDFLARE_API_TOKEN` を要求していないか（要求していたら設計違反）。
- **無料枠 guard**: カスタムルール 5 件超過を CI で必ず fail させる構成か。
- **wrangler 直接禁止 guard**: grep gate がリポジトリ全体（または UT-15 関連 path）で機能するか。
- **shellcheck / actionlint 統合**: 既存 workflow と同水準で警告ゼロを担保しているか。

## 完了条件

- [ ] typecheck / lint / unit / snapshot / coverage / miniflare smoke の各 gate 期待 exit が表化されている
- [ ] dry-run validate gate（`--dry-run --validate-config`）が `CLOUDFLARE_API_TOKEN` 不要で完走する設計が確定している
- [ ] 新規 workflow `cf-waf-validate.yml`（推奨採否）の擬似 yaml と paths trigger が示されている
- [ ] shellcheck / actionlint / jq schema / 無料枠 guard / wrangler 直接禁止 guard が CI step として仕様化されている
- [ ] 既存 `verify-design-tokens` / `verify-indexes` パターンとの整合方針が記述されている
- [ ] CI 失敗時の対応フロー（gate 別）が表化されている
- [ ] coverage 既定閾値（80/80/80/80）が完了条件に明記されている（Phase 6 / 9 / 11）
- [ ] **本 Phase 内のタスクを 100% 実行完了**

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- `cf-waf-validate.yml` 設計擬似 yaml が本仕様書に記述
- 失敗時対応フロー表が Phase 9 / Phase 12 へ引き渡し可能

## 次 Phase への引き渡し

- 次 Phase: 9（セキュリティ / 監視 / 運用継続性）
- 引き継ぎ事項:
  - CI 上で `CLOUDFLARE_API_TOKEN` を必要とする apply（非 dry-run）モードは Phase 9 のシークレット管理境界へ引き渡し
  - 失敗時対応フローのうち「監視 alert と接続する項目（dry-run diff の常態化検知 等）」を Phase 9 で alert ルール化
  - 1Password / Cloudflare Secrets / GitHub Secrets の役割分離は Phase 9 で確定
- ブロック条件:
  - `--dry-run --validate-config` が CI 上で API token を要求する設計
  - カスタムルール 5 件超過を gate で止められない
  - `wrangler` 直接実行を許容する記述が残っている

## 次の Phase

Phase 9: セキュリティ / 監視 / 運用継続性

## 実行タスク

1. CI gate と local validation matrix を固定する。
2. direct `wrangler` / secret leakage / drift の検出方針を固定する。

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 8 CI / quality gate specification | `phase-08.md` |
