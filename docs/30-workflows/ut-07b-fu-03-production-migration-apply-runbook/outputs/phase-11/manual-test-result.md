# Manual Test Result

## Result

`DOC_PASS_WITH_OPEN_RUNTIME_EVIDENCE`

## 説明

仕様書段階（spec_created）の「想定 evidence の保存仕様」確定として、以下が PASS:

| 検証 | 結果 | 備考 |
| --- | --- | --- |
| Structure verification（5 オブジェクトの SQL モデル出力定義） | PASS | `structure-verification.md` |
| Grep verification（仕様書配下に機密値混入なし） | PASS | `grep-verification.md` |
| Redaction check（F3 evidence.sh の redact 仕様 + false-positive 除外） | PASS | `redaction-check.md` |
| Link checklist（仕様書内 / cross-reference / external URL） | PASS | `link-checklist.md` |
| Manual test checklist（bats / staging DRY_RUN / CI gate / shellcheck の手順網羅） | PASS | `manual-test-checklist.md` |

## 開いている runtime evidence

以下は production 実走とは別の runtime evidence として扱う。ローカルで取得できるものは本実装サイクルで検証し、PR/production 依存のものは Phase 13 または FU-04 で取得する:

| Evidence | 取得タイミング | 取得タスク |
| --- | --- | --- |
| bats 実行ログ（`pnpm test:scripts`） | F1〜F7 実装後にローカル検証 | 本サイクル / Phase 13 PR |
| staging DRY_RUN ログ（`DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging`） | staging credential と Cloudflare runtime が使える環境 | Phase 13 PR |
| CI gate `d1-migration-verify` green | PR 作成後 | UT-07B-FU-03 Phase 13 PR |
| `.evidence/d1/<ts>/` 実 evidence（meta.json + 3 ログ） | production 実走時 | UT-07B-FU-04 |

## Boundary

- production 実走 PASS は主張しない。bats はローカル検証、staging DRY_RUN / CI gate green は PR 上の runtime evidence、production 実走 evidence は FU-04 で取得する。
- Production 実 apply は operator-gated（G5 ユーザー承認）であり、spec_created 段階で runtime PASS を主張しない。
- `set -x` 禁止 / Token 値記録なし / `op://` 参照のみ許容、を全 evidence ファイルで遵守。

## Final

`DOC_PASS_WITH_OPEN_RUNTIME_EVIDENCE` — 文書証跡とローカル実装境界は完了。PR 依存 runtime evidence と production 実走 evidence は Phase 13 PR と FU-04 で順次補完される。
