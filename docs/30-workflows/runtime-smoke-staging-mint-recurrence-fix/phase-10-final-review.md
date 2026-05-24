# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 10 / 13 |
| 入力 | phase-1-requirements.md（AC-1〜AC-7）/ phase-2-design.md（C-1〜C-6）/ phase-3-design-review.md（GATE PASS） |
| 役割 | Phase 11 へ進めるかを判定する最終ゲート |
| 状態 | `implemented_local_evidence_captured`（本 Phase は実装完了時に充足判定する突合表を確定する） |

## 目的

Phase 13（PR）へ進む前の最終ゲート。phase-1-requirements.md の AC-1〜AC-7 を正本とし、各 AC が
「どの成果物ファイル / どの Phase で満たされるか」を突合表で確定する。本タスクは `implemented_local_evidence_captured` 段階のため、
ローカルで確認可能な judgment と、コード実装・remote CI 観測・secret 投入に依存する user-gated 項目を明確に分離する。

## 実行タスク

1. AC-1〜AC-7 を 1 件ずつ、満たす成果物ファイルと Phase に突合する（§1）。
2. blocker 判定基準を `implemented_local_evidence_captured` 段階の制約（コード実装済み / remote CI 未観測 / secret 投入 user-gated）で確定する（§2）。
3. required status check の context 名不変を確認する観点を定義する（§3）。
4. secret 非転記の最終確認観点を定義する（§4）。
5. acceptance 判定と Phase 11 への handoff を確定する（§5）。

## 1. AC-1〜AC-7 と成果物の突合表

> 判定列は実装完了時に埋める。本改善サイクルでは各 AC を満たす成果物ファイル・Phase・PASS 基準を確定する。

| AC | 内容（要約） | 満たす成果物ファイル | 確定 Phase | PASS 基準 |
|---|---|---|---|---|
| **AC-1**（鮮度ゲート） | smoke 実行前に bearer の `exp` を decode し `exp - now < 21600` なら exit 非ゼロ | `scripts/smoke/bearer-freshness-gate.mts`（`classifyBearerFreshness`）/ `.github/workflows/runtime-smoke-staging.yml`（`verify bearer freshness` step） | Phase 5（実装）/ Phase 6（test） | `classifyBearerFreshness` が `stale` / `expired` / `invalid` を返す経路を持ち、workflow step が exit 1。`bearer-freshness-gate.spec.ts` 全 case green |
| **AC-2**（path 可視化） | workflow が `runtime-smoke auth path: minted/static-fallback` を 1 行出力（secret 値なし） | `.github/workflows/runtime-smoke-staging.yml`（`mask staging credentials` step） | Phase 5 | CI ログに auth path notice が必ず 1 件出力。secret 値を含まない |
| **AC-3**（401 reason 細分化） | 401 を `auth-token-expired`（`exp<=now`）/ `auth-secret-drift`（`exp>now` / decode 不能）に分割。500/403 不変 | `scripts/smoke/runtime-attendance-provider.sh`（reason 分岐）/ `bearer-freshness-gate.mts`（`explainAuthFailureFromBearer`） | Phase 5 / Phase 6 | reason 4 値（§ SSOT 表）が HTTP+exp 条件で一意に分岐。decode 不能時は `auth-secret-drift` |
| **AC-4**（mint 自己検証） | mint 署名直後に `verifySessionJwt` で検証し `null` / claim mismatch なら exit 非ゼロ | `scripts/smoke/mint-staging-bearers.mts`（self verification）/ `mint-staging-bearers.spec.ts` / `mint-staging-bearers-self-verify.spec.ts` | Phase 5 / Phase 6 | self-verify 失敗時 throw（JWT 文字列非出力）。parity + fail path test green |
| **AC-5**（SSOT 化） | bearer/secret ライフサイクル・診断ツリーを単一 SSOT に記録し runbook からリンク | `reference/bearer-lifecycle-ssot.md`（**本改善サイクル で実体完成**）/ `secret-provisioning.md`（SSOT リンク追記） | **Phase 2/10（本 doc 実体）** / Phase 12（runbook 同期） | SSOT に TTL 表（86400/600）・secret 同期不変条件・reason 4 値ディシジョンツリー・鮮度ゲート threshold 21600 が記載され、runbook が SSOT へリンク |
| **AC-6**（fallback 維持） | mint step の `if: env.STAGING_AUTH_SECRET != ''` 維持。静的 bearer 参照を削除しない | `.github/workflows/runtime-smoke-staging.yml`（mint step `if:` 不変） | Phase 5 | mint step の `if:` 条件が不変。静的 `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` 参照が残存 |
| **AC-7**（不変条件維持） | secret/JWT/署名鍵を平文出力しない。required check 名不変。新規 test は `*.spec.ts` のみ | 全変更ファイル + 本 SSOT | Phase 9（QA grep gate）/ Phase 10 §3,§4 | `git grep` で JWT/鍵/secret 実値 0 件。context 名 `runtime smoke staging / smoke` 不変。新規 test 拡張子 `*.spec.ts` |

## 2. blocker 判定（implemented_local_evidence_captured 段階）

| 区分 | 該当条件 | 対応 |
|---|---|---|
| **BLOCKER** | AC-1 / AC-3 / AC-4 / AC-7 のいずれかが実装後 FAIL | PR を作らず Phase 5 / 8 / 9 へ差し戻す |
| **本改善サイクルの既定状態（blocker ではない）** | コード実装済み / local focused tests PASS / remote CI 未観測（dev マージ後の `runtime smoke staging / smoke` 結果は未取得）/ secret 投入未実行（`STAGING_AUTH_SECRET` は user-gated） | remote CI と secret 投入は user-gated 境界であり blocker ではない。source-level は本改善サイクル内で解消済み |
| **user-gated（本改善サイクル スコープ外）** | `STAGING_AUTH_SECRET` 実投入（1Password → `gh secret set --env staging-runtime-smoke`） | 手順は runbook / SSOT §6 に記載済み。実行はユーザー承認後。未投入でも AC-1 鮮度ゲートが失効 6h 前に loud fail し、サイレント再発を構造的に不可能にする（AC-6 と両立） |

> 設計時点（Phase 3 GATE PASS）で BLOCKER 想定なし。Phase 3 の MINOR 指摘（RV-1 / RV-2）は設計内で解消済み、INFO（RV-3）は責務分離の説明で対応不要。実装後に新規 blocker が出た場合は本表に追記して差し戻す。

## 3. required status context 名 不変の確認

| 確認項目 | expected |
|---|---|
| workflow 名 / job 名 | `runtime-smoke-staging.yml` の workflow 名・job 名が不変（step 追加・`setup-project` の `if` 撤去は context 名に影響しない） |
| required status check context | `runtime smoke staging / smoke` が不変（branch protection の required context と一致） |
| branch protection 突合 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の required_status_checks contexts と job 名が一致（read-only 確認のみ。変更しない） |

> step の追加・並べ替え・`setup-project` の `if` 撤去（常時実行化）は status context 名を変えない。job 名 / workflow 名のみが context 名に影響するため、それらを触っていないことを確認する。

## 4. secret 非転記の最終確認

| 確認項目 | expected |
|---|---|
| 仕様書（本ワークフロー docs 全体 + SSOT） | secret 実値・JWT 文字列・署名鍵が 0 件（不変条件 1） |
| `reference/bearer-lifecycle-ssot.md` | 構造と手順のみ。実 secret 値・実 JWT・署名鍵を記載しない（本 doc 内で明記済み） |
| `bearer-freshness-gate.mts` / workflow / runner / mint helper | token 文字列・`exp` 以外の claim・署名鍵を stdout / log / GITHUB_OUTPUT 値以外へ出さない（Phase 9 G-9 grep gate と二重確認） |
| PR 本文（Phase 13） | 実値・鍵・JWT を含めない。`::add-mask::` / redact 方針を文章で説明するに留める |

## 5. 最終レビュー総合判定と Phase 11 handoff

| 観点 | expected 結論 |
|---|---|
| AC-1〜AC-7 | §1 の PASS 基準を全件満たすこと（実装サイクルで判定） |
| blocker | なし（§2。本改善サイクルの実装済みローカル証跡 / runtime未観測 / user-gated は既定状態） |
| required context 名 | 不変（§3） |
| secret 非転記 | 遵守（§4。本 SSOT 含む全 doc で実値 0 件） |
| 因果ループ解消 | 静的 bearer 失効の自己強化ループを鮮度ゲート（AC-1）が失効 6h 前の loud fail で断つ（Phase 3 §2 と整合） |

上記すべてを満たす場合のみ Phase 11（手動テスト・NON_VISUAL 代替証跡）→ Phase 12（ドキュメント）→ Phase 13（PR、ユーザー承認後）へ進む。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 9（QA） | §1 の AC-1〜AC-7 PASS 基準を QA gate 結果と突合する | phase-9-qa.md |
| Phase 11（手動テスト） | §5 の handoff を受けて NON_VISUAL 代替証跡の検証計画を実行する | phase-11-manual-test.md |
| Phase 13（PR） | blocker なし判定（§2）と required context 不変（§3）を PR 前提として引き継ぐ | phase-13-pr.md |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| 要件 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-1-requirements.md` | AC-1〜AC-7 / inventory |
| 設計 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1〜C-6 |
| 設計レビュー | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-3-design-review.md` | 4 条件評価 / GATE PASS |
| SSOT | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md` | reason 4 値 / TTL / 同期不変条件 |
| エラーハンドリング | `.claude/skills/aiworkflow-requirements/references/error-handling.md` | fail-loud / 診断可能性 |
| セキュリティ運用 | `.claude/skills/aiworkflow-requirements/references/security-operations.md` | secret 取り扱い / 漏洩防止 |

## 成果物

- 本ファイル（`phase-10-final-review.md`）: AC-1〜AC-7 突合表 / blocker 判定 / context 名不変確認 / secret 非転記確認 / Phase 11 handoff。

## 完了条件

- [x] AC-1〜AC-7 を 1 件ずつ成果物ファイル・Phase・PASS 基準に突合する表がある。
- [x] blocker 判定が `implemented_local_evidence_captured` 段階（コード実装済み / remote CI 未観測 / secret 投入 user-gated）で定義されている。
- [x] required status context 名 不変の確認観点がある。
- [x] secret 非転記の最終確認観点がある（SSOT 含む）。
- [x] Phase 11 への handoff 条件が明記されている。
