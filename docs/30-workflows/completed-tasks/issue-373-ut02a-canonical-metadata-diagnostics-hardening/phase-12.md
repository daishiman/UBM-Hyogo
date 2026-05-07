# Phase 12: ドキュメント更新 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 11 で取得した NON_VISUAL evidence を踏まえ、(1) 中学生 + 技術者 2 部構成の implementation guide、(2) 正本仕様書（`docs/00-getting-started-manual/specs/01-api-schema.md`）への retirement 条件追記、(3) ドキュメント更新履歴、(4) 未タスク検出レポート、(5) skill フィードバックレポート、(6) タスク仕様書コンプライアンスチェック の **6 必須タスク**を実行する。複数ファイルを repo にコミットする副作用があり、後続タスク（03a alias queue adapter / static manifest retirement）の前提条件を更新する波及効果を持つため CONST_004 区分で実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| phase | 12 / 13 |
| 目的 | task-specification-creator skill の Phase 12 6 必須タスクを実行し、retirement spec / aiworkflow-requirements skill index を同期する |
| 依存 phase | 11（evidence 取得 PASS） |
| 成果物 | `outputs/phase-12/{main.md, implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md}` + `01-api-schema.md` 差分 + `task-workflow-active.md` 差分 |
| user_approval_required | false |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 11 evidence を受けて Phase 12 strict 7 outputs を作成し、retirement spec、aiworkflow-requirements 導線、元 follow-up の formalized 状態を同一 wave で同期する。

## 実行タスク（task-specification-creator Phase 12 6 必須タスク）

- [ ] Task 1: 実装ガイド作成（中学生レベル + 技術者レベル）
- [ ] Task 2: システム仕様書更新（`01-api-schema.md` への retirement 条件追記）
- [ ] Task 3: ドキュメント更新履歴
- [ ] Task 4: 未タスク検出レポート（0 件でも出力必須）
- [ ] Task 5: スキルフィードバックレポート（改善点なしでも出力必須）
- [ ] Task 6: タスク仕様書コンプライアンスチェック

## 中学生レベルの概念説明（Phase 12 必須）

- **manifest stale detection（古さ検出）とは**: 「教科書の正本（`01-api-schema.md`）」と「教科書のダイジェスト（`static-manifest.json`）」の中身がズレていないかをハッシュ値で照合する仕組み。ズレていたら CI が止めるので、コードと仕様の食い違いを実行前に潰せる。
- **決定論的再生成とは**: 同じ入力からは必ず同じバイト列が出る再生成スクリプト。`Date.now()` のような実行時依存の値を使わず、いつ実行しても同じファイルが出る。これにより diff レビューが意味を持つ。
- **構造化ログとは**: ただの文字列ログではなく `code` / `level` / `count` のような決まったキーを持つ JSON 形式のログ。後で grep / フィルタで「unknown stable key が何件出たか」を機械的に集計できる。
- **contract test とは**: 「将来 03a で実装する alias queue の使い方の約束ごと」を、実装より先にテストとして固定するもの。03a を実装する人は「このテストが通るように作る」だけで済む。
- **retirement 条件とは**: 「このダイジェストファイル（static-manifest.json）はいつ捨てていいか」を仕様書に書いておくこと。03a alias queue が D1 に動的データを持つようになったら捨てる、と決めてある。

## Task 1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を 2 部構成で作成する。

### Part 1: 中学生レベル概念説明

- 上記「中学生レベルの概念説明」5 項目をそのまま採用
- 「なぜこのタスクが必要か」を 1 段落で（UT-02A 完成後の暫定 baseline 運用化のため）
- 「03a 完成時に何が起きるか（retirement の流れ）」を 3 ステップで

### Part 2: 技術者レベル詳細

| 項目 | 記載内容 |
| --- | --- |
| 追加スクリプト | `scripts/verify-static-manifest.mjs`（spec hash 比較・FAIL 時 exit 非 0）/ `scripts/regenerate-static-manifest.mjs`（決定論的・キー順固定・固定 timestamp） |
| manifest schema 拡張 | `sourceSpecHash` (sha256 hex) / `sourceSpecVersion`（spec 文書の最終 commit ISO もしくは semver）追加。既存 `generatedAt` / `regenerateCommand` / `retirementCondition` は維持。読み込み側は optional 読み込みで後方互換 |
| diagnostics 構造化ログ | `buildSectionsWithDiagnostics()` の戻り値 unknownStableKey 件数を `apps/api/src/lib/logger.ts` 経由で `logWarn({ code: "UBM-MANIFEST-UNKNOWN-KEY", count, keys, context })` として出力 |
| contract test | `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`。dryRun success / dryRun failure / unknownStableKey transit / 未注入 の 4 ケース。fake adapter は `vi.fn()` ベース in-memory のみ |
| CI gate | 既存 backend 対象 workflow（第一候補: `.github/workflows/backend-ci.yml`）に `verify-static-manifest` step を追加。`mise exec -- pnpm verify:static-manifest` を実行 |
| Phase 11 evidence | `outputs/phase-11/evidence/` 配下 7 ファイル（verify-output / regenerate-determinism / builder-diagnostics-sample / alias-queue-contract / typecheck / lint / test）|
| retirement 条件 | `docs/00-getting-started-manual/specs/01-api-schema.md` 末尾節に追記する。trigger: 03a alias queue adapter が D1-backed 実装に差し替わり `schema_questions` populate 完了時 |

## Task 2: システム仕様書更新（retirement 条件追記）

更新対象: `docs/00-getting-started-manual/specs/01-api-schema.md`（または `08-free-database.md` 参照リンク）。

### 追記節の最小内容

```markdown
## static-manifest.json retirement 条件

- 配置: `apps/api/src/repository/_shared/generated/static-manifest.json`
- 役割: 03a alias queue adapter 完成までの暫定 canonical schema baseline
- retirement trigger: 03a alias queue adapter が D1-backed 実装に差し替わり、D1 `schema_questions` テーブルが populate された時点
- retirement 手順:
  1. `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` の fake adapter を D1-backed adapter に差し替え（contract test の assertion はそのまま維持）
  2. `apps/api/src/repository/_shared/generated/static-manifest.json` を削除
  3. `.github/workflows/ci.yml` の `verify-static-manifest` job を撤去
  4. `scripts/verify-static-manifest.mjs` / `scripts/regenerate-static-manifest.mjs` を削除
  5. `package.json` の `verify:static-manifest` / `regenerate:static-manifest` script を削除
- 関連: `docs/00-getting-started-manual/specs/08-free-database.md` の D1 schema 章
```

### aiworkflow-requirements skill との整合

`.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` には、本 workflow root を `implemented-local / implementation / NON_VISUAL / Phase 11 evidence captured / Phase 12 completed / Phase 13 blocked_pending_user_approval` として登録する。commit / push / PR は Phase 13 user approval 後のみ実行する。

更新行例:

```
| issue-373-ut02a-canonical-metadata-diagnostics-hardening | implemented-local / implementation / NON_VISUAL / Phase 11 evidence captured / Phase 12 completed / Phase 13 blocked_pending_user_approval | 2026-05-06 | Issue #373 / PR pending user approval | evidence root: docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-11/evidence/ |
```

skill index 再生成は次のいずれかが当てはまる場合のみ実施:

- `references/data-model.md` 系に影響する schema 変更 → 該当時のみ `mise exec -- pnpm indexes:rebuild`
- `references/runbook.md` 系に追加されるべき手順がある → 本タスクの retirement 手順 1-5 を runbook に追記
- いずれも該当しない場合は `feedback_required: false` を `outputs/phase-12/main.md` に 1 行記録

## Task 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に 1 段落追記:

```
2026-05-06 (Issue #373): UT-02A canonical metadata diagnostics hardening Phase 12 実行時の記録。
manifest stale detection (verify-static-manifest.mjs) / 決定論的再生成 (regenerate-static-manifest.mjs) /
buildSectionsWithDiagnostics 構造化ログ (UBM-MANIFEST-UNKNOWN-KEY) /
alias-queue-adapter contract test 4 ケース / static-manifest.json retirement 条件 spec 反映。
Phase 11 evidence 7 ファイル取得後、task-workflow-active.md を implemented-local に昇格。
```

## Task 4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` を 0 件でも作成する。

検出観点:

| 観点 | 検出条件 | 起票テンプレ path |
| --- | --- | --- |
| 03a alias queue adapter 本体実装 | 既に Issue / unassigned-task として存在しているか確認。存在しなければ、03a 本体に依存するため独立未タスク化の理由を明記して新規起票 | `docs/30-workflows/unassigned-task/task-03a-alias-queue-adapter-d1-backed-impl-XXX.md` |
| static-manifest.json retirement 実行 | 03a 完成後でなければ実行できないため、既存の 03a / retirement task に接続する。既存導線が無ければ依存理由付きで起票 | `docs/30-workflows/unassigned-task/task-static-manifest-retirement-XXX.md` |
| `01-api-schema.md` 章番号 / 目次更新 | retirement 節追加に伴う TOC 同期が必要か | docs PR で同期済なら起票不要 |

最低 1 軸が「既存タスクとして存在 / 起票済」または「本タスクで起票」のいずれかに分岐し、`unassigned-task-detection.md` に判定理由を記録する。0 件で済む場合も「検出 0 件 / 確認手順」を明記する（CONST_007 先送り禁止）。

## Task 5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` を改善点なしでも作成する。

必須セクション:

- 対象 skill: `task-specification-creator` / `aiworkflow-requirements`
- 本タスクで適用したテンプレ: NON_VISUAL 縮約テンプレ（phase-11）/ Phase 12 6 必須タスクテンプレ
- 改善提案（あれば）: 例「NON_VISUAL タスクで `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` の vocabulary 適用ロジックが曖昧 → 「runtime 副作用の有無」で明示分岐ルール追加を提案」など
- 改善提案がない場合: `feedback_required: false` を 1 行記録

## Task 6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` で次 4 条件を検証:

| 条件 | 検証内容 | 判定 |
| --- | --- | --- |
| 矛盾なし | Phase 1-13 で記述された不変条件 / scope / DoD に矛盾がない | PASS / FAIL |
| 漏れなし | 元 unassigned task 完了条件 5 項目（stale detection / determinism / diagnostics evidence / contract test / retirement spec 反映）すべてに対応 phase が存在 | PASS / FAIL |
| 整合性 | implementation-guide / system-spec-update / documentation-changelog / unassigned-task-detection / skill-feedback-report / 本ファイル間で参照リンクと事実が整合 | PASS / FAIL |
| 依存関係整合 | Phase 11 evidence path と本 Phase の implementation-guide / system-spec-update の参照先が一致 | PASS / FAIL |

> 状態語彙: 本タスクは NON_VISUAL かつ runtime 副作用なしのため `PASS` 単独表記で問題なし（VISUAL_ON_EXECUTION 系の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は適用しない）。Phase 11 で確定済。

### artifacts.json parity

`outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

この文言を `outputs/phase-12/phase12-task-spec-compliance-check.md` に転記する。`outputs/artifacts.json` 不在を「監査スキップ」や「N/A」とは扱わない。

## 更新対象ドキュメント一覧

| # | path | 更新内容 | 検証コマンド |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | 中学生 + 技術者 2 部構成。NON_VISUAL evidence path 7 件を Part 2 に転記 | 新規作成 |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | `01-api-schema.md` retirement 節追加の diff stat と差分要約 | 新規作成 |
| 3 | `docs/00-getting-started-manual/specs/01-api-schema.md` | retirement 節追記（上記最小内容） | `grep -n 'static-manifest.json retirement' docs/00-getting-started-manual/specs/01-api-schema.md` |
| 4 | `outputs/phase-12/documentation-changelog.md` | 1 段落追記 | 末尾日付を grep |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 検出結果（0 件でも作成） | 新規作成 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | feedback 結果（改善点なしでも作成） | 新規作成 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 4 条件 PASS 判定 | 新規作成 |
| 8 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本タスク行を登録。実装完了後のみ `implemented-local` へ昇格 | `grep 'issue-373-ut02a' .claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| 9 | `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/artifacts.json` | Phase 12 実行後に `phase-12.status` を `completed` に / `phases.phase-11.outputs` を実 evidence path と整合 | `jq '.phases."phase-12".status'` |
| 10 | `outputs/phase-12/main.md` | 本 Phase 自身のログ。更新済 9 ファイルの diff stat / 6 必須タスク完了一覧 / skill feedback 反映要否判定 | 新規作成 |

## 検証コマンド

```bash
# 6 必須 outputs の存在確認
ls docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}

# retirement 節の追記確認
grep -n 'static-manifest.json retirement' docs/00-getting-started-manual/specs/01-api-schema.md

# task-workflow-active.md の状態確認
grep 'issue-373-ut02a' .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

# placeholder 残存チェック
grep -RE 'NOT_EXECUTED|TODO|FIXME|別 PR' \
  docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-12/

# lint
mise exec -- pnpm lint
```

## 多角的チェック観点

- 6 必須タスクすべての output ファイルが存在し size > 0
- 中学生レベル概念説明が 5 項目（manifest stale / 決定論的再生成 / 構造化ログ / contract test / retirement 条件）含まれている
- `01-api-schema.md` retirement 節が 5 ステップ retirement 手順を含む
- `task-workflow-active.md` の本タスク行が current root として登録され、実装前後の状態語彙境界が明記されている
- artifacts.json `phase-12.status` が Phase 実行後に `completed` / Phase 11 outputs 配列が実 evidence path と一致
- skill feedback の `feedback_required: <true/false>` が 1 行で記録
- unassigned-task-detection の検出結果が 0 件であっても明示記録
- CONST_007: 「次の PR で対応」「将来タスク」型の先送り表現 0 件

## サブタスク管理

- [ ] Task 1: implementation-guide.md（Part 1 + Part 2）作成
- [ ] Task 2: `01-api-schema.md` retirement 節追記 + system-spec-update-summary.md 作成
- [ ] Task 3: documentation-changelog.md 追記
- [ ] Task 4: unassigned-task-detection.md（0 件でも作成）
- [ ] Task 5: skill-feedback-report.md（改善点なしでも作成）
- [ ] Task 6: phase12-task-spec-compliance-check.md（4 条件 PASS）
- [ ] aiworkflow-requirements `task-workflow-active.md` を current root として登録（実装完了後のみ昇格）
- [ ] artifacts.json `phase-12.status` を Phase 実行後に `completed` に
- [ ] `outputs/phase-12/main.md` を作成（diff stat + 6 必須タスク完了一覧 + skill feedback 判定）

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`（retirement 節追記の diff）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（current root 登録 / 実装完了後の昇格 diff）
- `artifacts.json`（phase-12 完了反映）

## 完了条件 / DoD

- [ ] 6 必須タスクすべて完了
- [ ] 7 outputs ファイル + `01-api-schema.md` retirement 節 + `task-workflow-active.md` current root 登録 + `artifacts.json` 更新が確認できる
- [ ] phase12-task-spec-compliance-check.md の 4 条件すべて PASS
- [ ] CONST_007 先送り表現 0 件
- [ ] `outputs/phase-12/main.md` に 6 必須タスク完了一覧が表形式で記録

## タスク 100% 実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない（commit / PR は Phase 13）
- [ ] CONST_007 違反（先送り表現）がない
- [ ] secret / PII の plaintext を本仕様書に書いていない
- [ ] 中学生レベル概念説明が含まれている（Phase 12 必須）

## 次 Phase（Phase 13 PR 作成）への引き継ぎ事項

- 6 必須 outputs path
- `01-api-schema.md` の retirement 節追加 diff（PR diff レビュー対象）
- `task-workflow-active.md` の current root 登録 diff
- artifacts.json `phase-12.status=completed` 反映（Phase 12 実行後）
- unassigned-task 起票 path（あれば）
- skill feedback 反映要否判定（true なら `mise exec -- pnpm indexes:rebuild` 実行履歴）

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-tasks-guide.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md` / `08-free-database.md`
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-11.md`
- `CLAUDE.md`
