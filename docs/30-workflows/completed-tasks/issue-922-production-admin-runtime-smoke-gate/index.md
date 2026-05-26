# issue-922-production-admin-runtime-smoke-gate

[実装区分: 実装仕様書]

> 判定根拠: issue #922 は親 #864（CLOSED）で確立した staging deploy 後の authenticated `/admin` runtime smoke gate を
> **production 層へ横展開** する followup-001。`.github/workflows/web-cd.yml` への job 追加、
> `scripts/smoke/runtime-admin-web.sh` の environment-aware 一般化、`mint-staging-session-cookie.mts` の env prefix 引数化、
> production secret 用の GitHub Environment 設計、`main` required status check 追加準備を伴う。
> ドキュメント・調査のみで完結する余地はなく、CONST_004 のデフォルト（実装仕様書）に該当する。
> 同一 wave で仕様書 + runner / mint helper 一般化 + CI wiring + focused tests + skill 正本同期まで実装する。
> Cloudflare production 実走・production-runtime-smoke Environment secret 投入・required status check PUT・
> 意図的 throw regression evidence・commit / push / PR は user-gated。

## メタ情報

| 項目                | 値                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Task ID             | TASK-ISSUE-922-PRODUCTION-ADMIN-RUNTIME-SMOKE-GATE-001                                    |
| Feature 名          | issue-922-production-admin-runtime-smoke-gate                                            |
| Task type           | implementation                                                                           |
| visualEvidence      | NON_VISUAL（CI/runtime gate の production 展開、UI 表示物の意匠変更なし）                |
| implementation_mode | `extend`（既存 staging gate の environment-aware 一般化 + production job 追加）           |
| workflow_state      | `implemented_local_runtime_pending`                                                       |
| 関連 issue          | #922（CLOSED 状態を維持。本仕様書作成では issue state を変更しない）                     |
| 親 issue            | #864（CLOSED。staging admin runtime smoke gate 確立済み）                                 |
| 親タスク root       | `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/`        |
| 関連 PR             | #864 wave の PR（staging 側 merge 済み）                                                  |
| 対象環境            | Cloudflare Workers production（`ubm-hyogo-web-production`）                              |
| エラー digest       | `167275886`（親 issue で staging 上で観測された render error。production でも回帰検出対象）|
| 想定 1 cycle 完了   | はい（runner 一般化 → mint helper env 引数化 → web-cd production job 追加 → test 拡充 を 1 PR）|

## 背景と issue #922 の本質

親 issue #864（CLOSED）で staging deploy 後の authenticated `/admin` runtime smoke gate を
`.github/workflows/web-cd.yml` の `admin-runtime-smoke` job (`needs: deploy-staging`) として確立済み。
当時の Phase 12 unassigned-task-detection.md で UT-CANDIDATE-1 として
「production への同 gate 展開」を明示し、staging gate の安定運用後に着手する後続として位置付けていた。

本タスク #922 は **同型 gate を production 層へ展開** する followup-001。
issue #922 は既に CLOSED されているが、ユーザー指示で CLOSED 維持のままタスク仕様書を作成する。

現状の調査結論（最新コード）:

| 既存機構                                       | #922 の要求を満たすか | 理由                                                                 |
| ---------------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| `.github/workflows/web-cd.yml admin-runtime-smoke` (staging) | ❌ | `needs: deploy-staging` で staging 専用。production deploy 後は発火しない |
| `scripts/smoke/runtime-admin-web.sh`           | ❌ | `if [[ "$ENVIRONMENT" != "staging" ]]; then ... exit 2; fi` で staging hard-code |
| `scripts/smoke/mint-staging-session-cookie.mts`| ❌ | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` を直参照 |
| production deploy job (`web-cd.yml` 行 162-203) | △ | 存在するが post-deploy admin runtime smoke を持たない                |

→ **#922 は未解決の真の gap であり、本仕様書の作成・実装が必要**。staging gate の構造を保ったまま
両環境を扱える形へ一般化し、production 用 job を追加する。

## 真の論点（task-specification-creator 思考法）

1. **真の論点**: 「production deploy のたびに `/admin` render regression を staging と同等の自動 gate で守る」。
   staging gate が確立した今、最も信頼すべき production 層の安全網が手薄なままという非対称を解消する。
2. **依存関係・責務境界**:
   - runner（shell）と mint helper（mts）は staging 専用 hard-code を含むため、 environment-aware に一般化する責務を持つ。
   - production env-specific secret は GitHub Environment `production-runtime-smoke` に閉じ、leak surface を増やさない。
   - CI orchestration（web-cd job）は staging job を構造テンプレートとして再利用し、`needs: deploy-production` と `if: github.ref_name == 'main'` の 2 条件で発火制御する。
3. **価値とコストの不均衡**: 最大コスト部品は **production 実走時の意図的 throw regression evidence**（AC-5）。
   実本番デプロイで意図的に壊して fail を観測するため、独立の検証 PR / revert flow を user-gated として明確に分離する。
4. **改善優先順位**: ① runner / mint helper の env prefix 一般化 → ② web-cd production job 追加 →
   ③ test 拡充（production 分岐 + env path）→ ④ user-gated:GitHub Environment 作成 + secret 投入 +
   required status check 追加 + regression evidence 実走。
5. **4条件評価**:
   - 価値性: production deploy ごとに `/admin` render regression を自動検出（staging gate と対称の安全網）
   - 実現性: staging gate の構造を再利用、 environment-aware 一般化は薄い拡張のみで済む
   - 整合性: `scripts/cf.sh` 経由、redaction grep gate、env 参照不変条件、CLAUDE.md `production-runtime-smoke` Environment 設計と整合
   - 運用性: evidence artifact upload + Slack 失敗通知 + main branch protection の required status check 候補化

## Phase 構成

| Phase | 名称             | 状態        | 出力先                       |
| ----- | ---------------- | ----------- | ---------------------------- |
| 1     | 要件定義         | completed | outputs/phase-1/phase-1.md   |
| 2     | 設計             | completed | outputs/phase-2/phase-2.md   |
| 3     | 設計レビュー     | completed | outputs/phase-3/phase-3.md   |
| 4     | テスト作成       | completed | outputs/phase-4/phase-4.md   |
| 5     | 実装             | completed | outputs/phase-5/phase-5.md   |
| 6     | テスト拡充       | completed | outputs/phase-6/phase-6.md   |
| 7     | カバレッジ確認   | completed | outputs/phase-7/phase-7.md   |
| 8     | リファクタリング | completed | outputs/phase-8/phase-8.md   |
| 9     | 品質保証         | completed | outputs/phase-9/phase-9.md   |
| 10    | 最終レビュー     | completed | outputs/phase-10/phase-10.md |
| 11    | 手動テスト       | completed | outputs/phase-11/phase-11.md |
| 12    | ドキュメント更新 | completed | outputs/phase-12/phase-12.md |
| 13    | PR作成           | pending_user_approval | outputs/phase-13/phase-13.md |

## 受入条件（Acceptance Criteria）

| ID   | 受入条件                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| AC-1 | `.github/workflows/web-cd.yml` に `needs: deploy-production` の `admin-runtime-smoke-production` job が追加される（staging job を構造テンプレートとして再利用） |
| AC-2 | 同 job は `if: github.ref_name == 'main'` で production deploy 完了を依存条件に自動 trigger される                |
| AC-3 | production `/admin` への authenticated HTTP 200 probe が pass する（contract test での local stub + Gate-B real probe）|
| AC-4 | `cf.sh tail` ベースの Workers log capture で `error.boundary.caught`(scope=admin) / digest=`167275886` が不発火であることを確認する |
| AC-5 | 意図的 throw regression を 1 回 production へ deploy し、本 gate が fail することを evidence として取得（user-gated 実走で取得）|
| AC-6 | `PRODUCTION_AUTH_SECRET` 等未設定環境では graceful skip し、`main` push をブロックしない（AC-8 of #864 と対称）   |
| AC-7 | evidence artifact が redaction grep gate を通過する（JWT / Cookie / token を leak しない）                       |
| AC-8 | runner / mint helper / job いずれも `wrangler` 直叩きせず、Cloudflare 系 CLI は `scripts/cf.sh` 経由のみで動作する |
| AC-9 | `main` branch protection の required status check に `admin runtime smoke production / smoke` を追加する準備が完了する（実 PUT は user 明示承認後） |

## 不変条件（CLAUDE.md より）

- Cloudflare 系 CLI は `scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止）
- `.env` の中身を `cat`/`Read`/`grep` で読まない。JWT / API Token / OAuth token 値を出力・ドキュメントへ転記しない
- `apps/web` ランタイムの env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（本タスクは web ソース変更を伴わない想定）
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（shell test は `*.test.sh` を踏襲）
- 既存 API endpoint surface のみ利用（新 endpoint 追加・D1 schema 変更・Google Form 仕様変更禁止）
- D1 直接アクセスは `apps/web` から禁止（変更なし）
- commit / push / PR は user の明示承認後のみ（Phase 13）
- `main` branch protection 実値の変更は user 明示承認後のみ。read-only before JSON は事前 evidence として取得可能

## スコープ外（明示的に含めない）

- staging admin runtime smoke gate の機能追加（親 #864 で完了済み。本タスクは production 層への展開のみ）
- Sentry alert ルールの新設（既存 boundary log 検出で代替。staging と同一方針）
- production `/admin` 以外の page への runtime smoke 展開（`/profile` 等は別タスク。本タスクは authenticated `/admin` render regression gate に限定）
- runner の SubAgent 並列化や cf.sh `tail` の機能拡張（YAGNI、現行 capture で十分）

## DoD（Definition of Done）

- AC-1〜AC-9 を全て満たす
- `pnpm typecheck` / `pnpm lint` pass
- `bash scripts/verify-pr-ready.sh` は phase12 / gate-metadata PASS（未コミット generated index drift は許容境界）
- `gate-metadata:validate` と `verify:phase12-compliance` が pass
- Gate-A（spec compliance）passed、Gate-B（production runtime smoke 実走 + regression evidence）は user-gated のため `pending`
