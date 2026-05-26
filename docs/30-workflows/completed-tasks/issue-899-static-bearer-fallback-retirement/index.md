# issue-899-static-bearer-fallback-retirement

[実装区分: 実装仕様書]

> 判定根拠: issue #899 が要求するのは「`.github/workflows/runtime-smoke-staging.yml` に残存する静的 bearer fallback（`STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`）の物理撤去と、mint 方式の恒久化」。
> 対象は CI workflow / runbook / SSOT ドキュメントの edit と、GitHub Environment secret の物理削除手順策定であり、UI 表示物を変更しない（NON_VISUAL）。
> 実装は本仕様書commit後、`STAGING_AUTH_SECRET` provisioning（前提 #916）完了後の別 PR で行う。本タスクは **実装仕様書作成のみ**（コード変更は含まない）。
> CONST_004 デフォルト（実装仕様書）に該当し、CONST_005 必須項目（変更対象ファイル / テスト方針 / 実行コマンド / DoD / 順序制約）を本 root に集約する。

## メタ情報

| 項目                | 値                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Task ID             | TASK-ISSUE-899-STATIC-BEARER-FALLBACK-RETIREMENT-001                                              |
| Feature 名          | issue-899-static-bearer-fallback-retirement                                                       |
| Task type           | implementation                                                                                    |
| visualEvidence      | NON_VISUAL（CI workflow / runbook / SSOT 改定。UI 表示物変更なし）                                |
| implementation_mode | `edit`                                                                                            |
| workflow_state      | `spec_created`（implementation pending / NON_VISUAL）                                              |
| 関連 issue          | #899（クローズ状態維持。本仕様書作成では issue state を変更しない）                               |
| 前提タスク          | #916（`STAGING_AUTH_SECRET` provisioning & mint path で smoke green を 1 回以上記録）            |
| 親 root cause SSOT  | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`  |
| 対象 workflow       | `.github/workflows/runtime-smoke-staging.yml`                                                     |
| 想定 1 cycle 完了   | はい（workflow edit + runbook 改定 + SSOT 更新 + 静的 secret 物理削除手順を 1 PR）                |

## 報告事象と issue #899 の本質

issue #899 は「mint step が既に存在するのに、`STAGING_AUTH_SECRET` 未投入時の後方互換 fallback として静的 `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` が secrets / job.env / mask step に残存している」状態の解消を要求する。前提タスク #916 で `STAGING_AUTH_SECRET` provisioning と mint path での smoke green が確認できた時点で、後方互換は不要となり、**静的 bearer の secret / env / fallback ロジックを物理撤去**して mint 経路一本化に昇格する。

### 現行コード残存箇所（`.github/workflows/runtime-smoke-staging.yml` 最新 HEAD 行番号）

| 行              | 種別                | 撤去対象                                                                                            |
| --------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `:29`           | job.env             | `STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}`                                          |
| `:31`           | job.env             | `STAGING_ME_BEARER: ${{ secrets.STAGING_ME_BEARER }}`                                                |
| `:32-33`        | コメント            | fallback 説明（mint 常時実行と矛盾）                                                                 |
| `:35-37`        | job.env + コメント  | `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'`（warn-only 化）— 静的 bearer 寿命切れ吸収目的のため同時撤去   |
| `:47`           | step `if`           | `if: env.STAGING_AUTH_SECRET != ''`（mint step を常時実行へ昇格）                                    |
| `:88-99`        | mask step           | `RUNTIME_SMOKE_AUTH_PATH` 未設定時 `static-fallback` 書き込み分岐（`:90-95`）                        |

### 追加スコープ（元 issue 未言及・本仕様書で固定）

1. `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'` の撤去（hard-fail 既定への昇格）。静的 bearer を撤去するなら warn-only にする根拠が消えるため。
2. `mask staging credentials` step の `static-fallback` 分岐除去。mint step が常時実行で `RUNTIME_SMOKE_AUTH_PATH=minted` を必ず export するため。
3. mint step 冒頭で `STAGING_AUTH_SECRET` 未設定時 `::error::` + `exit 1` の fail-fast guard 追加（fallback 撤去後の意図しない静的経路復活を構造的に防止）。

## 真の論点

1. **真の論点**: 「fallback を消す」ではなく「mint 一本化を構造的不可逆にする」。env / mask 分岐 / freshness warn-only を同時撤去しないと、後日「secret が無いから一時的に静的を戻す」運用迂回が発生し再発する。
2. **依存関係・責務境界**: 前提 #916 が `STAGING_AUTH_SECRET` provisioning + mint path smoke green を担保。本タスクは provisioning を前提として、撤去 PR マージ後の minted-only 状態を物理 secret 削除まで完了させる。
3. **価値とコストの不均衡**: 最大コストは「workflow / runbook / SSOT の 3 点同期」と「GitHub Environment の物理 secret 削除手順」。実コードは workflow 数行の削除で済み、テストも grep + actionlint で十分。
4. **改善優先順位**: ① 前提 #916 完了確認 → ② workflow edit → ③ runbook 更新 → ④ SSOT 更新 → ⑤ mint 経路 smoke 緑再確認 → ⑥ 静的 secret 物理削除。
5. **4条件評価**:
   - 価値性: bearer lifecycle SSOT の最終段が「実施済み」になり、静的経路の運用迂回リスクが構造的に消える
   - 実現性: workflow 数行削除 + runbook section 削除 + SSOT 状態更新で完結。新規実装なし
   - 整合性: cf.sh wrapper / redaction 不変条件 / freshness gate との整合を全て保持
   - 運用性: minted-only での運用に runbook を整合させ、緊急時の物理削除手順を明記

## Phase 構成

| Phase | 名称             | 状態      | 出力先                                                       |
| ----- | ---------------- | --------- | ------------------------------------------------------------ |
| 1     | 要件定義         | completed | outputs/phase-1/phase-1.md                                   |
| 2     | 設計             | completed | outputs/phase-2/phase-2.md                                   |
| 3     | 設計レビュー     | completed | outputs/phase-3/phase-3.md                                   |
| 4     | テスト作成       | completed | outputs/phase-4/phase-4.md                                   |
| 5     | 実装手順         | completed | outputs/phase-5/phase-5.md                                   |
| 6     | テスト拡充       | completed | outputs/phase-6/phase-6.md                                   |
| 7     | カバレッジ確認   | completed | outputs/phase-7/phase-7.md                                   |
| 8     | リファクタリング | completed | outputs/phase-8/phase-8.md                                   |
| 9     | 品質保証         | completed | outputs/phase-9/phase-9.md                                   |
| 10    | 最終レビュー     | completed | outputs/phase-10/phase-10.md                                 |
| 11    | 手動テスト       | completed | outputs/phase-11/phase-11.md                                 |
| 12    | ドキュメント更新 | completed | outputs/phase-12/phase-12.md                                 |
| 13    | PR作成           | pending_user_approval | outputs/phase-13/phase-13.md                       |

## 受入条件（Acceptance Criteria）

| ID    | 受入条件                                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `.github/workflows/runtime-smoke-staging.yml` の job.env から `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` 行が消えている |
| AC-2  | 同 file から `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'` および関連コメントが消え、freshness gate が hard-fail 既定へ昇格する  |
| AC-3  | mint step の `if: env.STAGING_AUTH_SECRET != ''` が消え、常時実行となる                                                  |
| AC-4  | mint step 冒頭に `STAGING_AUTH_SECRET` 未設定時 `::error::` + `exit 1` の fail-fast guard が追加される                    |
| AC-5  | `mask staging credentials` step の `static-fallback` 分岐（`:90-95`）が消え、`RUNTIME_SMOKE_AUTH_PATH=minted` 前提に簡素化 |
| AC-6  | runbook（`secret-provisioning.md`）から「後方互換 fallback」「即時運用復旧」section が削除され、minted-only 運用記述に置換 |
| AC-7  | runbook に GitHub Environment secret 物理削除手順（`gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke` 等）が追加される |
| AC-8  | bearer-lifecycle SSOT §6 の「fallback 撤去（#899）」状態が「完了予定 → 実施済み」へ更新される                              |
| AC-9  | `actionlint` PASS / grep gate（`static-fallback`, `if: env.STAGING_AUTH_SECRET`, `STAGING_ADMIN_BEARER` の workflow 内残存）0 件 |
| AC-10 | 撤去 PR マージ後、`runtime-smoke-staging / smoke` を 1 回以上 `gh workflow run` で再実行し auth-path = `minted` & job=success が記録される（user-gated） |
| AC-11 | GitHub Environment `staging-runtime-smoke` の `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` が `gh secret delete` で物理削除される（user-gated） |

## 不変条件（CLAUDE.md より）

- Cloudflare 系 CLI は `scripts/cf.sh` 経由のみ（本タスクは workflow edit が主のため直接影響しないが、runbook 表記は cf.sh 経由を維持）
- `.env` 中身を読まない / JWT / token 値を出力・ドキュメントへ転記しない
- mint → `::add-mask::` → `GITHUB_ENV export` の 1-step redaction sequence は撤去後も保全
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（shell test は `*.test.sh`）
- commit / push / PR は user 明示承認後のみ（Phase 13）
- 実装 PR と仕様書 PR を分離する場合、本仕様書 PR は仕様書 commit のみで base=dev

## スコープ外（明示的に含めない）

- 前提タスク #916 の `STAGING_AUTH_SECRET` provisioning 作業そのもの（別 issue）
- mint helper（`scripts/smoke/mint-staging-bearers.mts`）のロジック変更
- freshness gate（`scripts/smoke/bearer-freshness-gate.mts`）の閾値変更（hard-fail 既定への切替は env 削除のみで達成）
- production deploy への展開（staging に限定）

## 順序制約（不変条件）

1. **前提**: #916 完了（`STAGING_AUTH_SECRET` 投入 + mint path smoke green 1 回以上）が確認できるまで撤去 PR をマージしない
2. workflow 撤去 PR マージ → mint 経路 smoke green 再確認 → 静的 secret 物理削除 の順を厳守（逆転禁止）
3. 物理削除を先に行うと、撤去前の workflow が secret 欠落で fail するため**必ず workflow edit が先**

## DoD（Definition of Done）

- AC-1〜AC-11 を全て満たす（AC-10/11 は user-gated 実走）
- `pnpm typecheck` / `pnpm lint` / `actionlint` PASS
- `gate-metadata:validate` / `verify:phase12-compliance` PASS
- 仕様書 PR base=dev / 本仕様書 commit + aiworkflow 正本索引同期のみ（workflow 実装は #916 完了後の user-gated 実装 PR）
- issue #899 はクローズ状態維持
