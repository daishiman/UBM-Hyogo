# Phase 11: 手動 smoke test（NON_VISUAL 縮約 / 代替証跡）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（legacy umbrella close-out） |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |
| GitHub Issue | #234 (CLOSED, 維持) |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは UT-21（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）を Sheets direct 実装として進めない close-out であり、`apps/` 配下のコード変更を一切伴わない docs-only タスクである。
  - 成果物はすべて Markdown / JSON ドキュメントであり、画面 / コンポーネント / レイアウト / インタラクションを生成しない。UI 差分が無いため screenshot / VRT / Playwright / Storybook 等の視覚証跡は採取しない。
  - 一次証跡は `rg` の stdout、cross-link 死活確認、`aiworkflow-requirements` の `task-workflow.md` current facts との整合検証ログに置き換える。
- 必須 outputs:
  - `outputs/phase-11/main.md`（docs-only smoke 実行サマリー / 既知制限）
  - `outputs/phase-11/manual-smoke-log.md`（rg / grep / gh / ls の実行ログ）
  - `outputs/phase-11/link-checklist.md`（cross-link 死活チェック）
  - `outputs/phase-11/spec-integrity-check.md`（aiworkflow-requirements `task-workflow.md` との整合検証ログ）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体を作らない）。

## 目的

Phase 5 の implementation-runbook（03a / 03b / 04c / 09b への受入条件 patch 案）と Phase 8 の DRY 化結果を踏まえ、本タスクが docs-only / legacy umbrella close-out として閉じられたことを `rg` / `grep` / `gh issue` / `ls` の組み合わせで検証する。範囲は次の 4 点に絞る:

1. 「`POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針」が本仕様書と UT-21 当初仕様書（legacy）の双方に明記されている。
2. UT-21 の stale 前提 5 項目（同期元 / 単一 endpoint / `GET /admin/sync/audit` / audit table（`sync_audit_logs` + `sync_audit_outbox`） / 実装パス）が現行正本（Forms sync）と矛盾しない形で固定されている。
3. cross-link（後続 U02 / U04 / U05、姉妹 close-out、aiworkflow-requirements 参照）がすべて死活 OK。
4. `aiworkflow-requirements` の `task-workflow.md` current facts と本仕様書の 4 セクション（同期元・endpoint・audit table・実装パス）に矛盾が無い。

## 実行タスク

1. AC-3 / AC-10 検証: `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` が docs/30-workflows/02-application-implementation 配下と aiworkflow-requirements references 配下に「新設前提」として残っていないことを `rg` で確認する。
2. AC-1 検証: UT-21 当初仕様書（`docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）の状態欄に close-out 済 / 新設しない方針 / 現行 Forms sync が正本である旨が明記されているかを `rg` で確認する。
3. AC-5 検証: 後続 U02 / U04 / U05 の独立タスクファイルが `unassigned-task/` 配下に存在し、本仕様書から相対パスで到達可能か `ls` + `test -e` で確認する。
4. AC-7 検証: `aiworkflow-requirements` skill の `task-workflow.md` の current facts（D1 直接アクセス境界 / sync_jobs ledger / Forms sync 実装パス）と本仕様書の差分表が矛盾しないかを `diff` ベースで確認し、`spec-integrity-check.md` に記録する。
5. AC-9 検証: 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）違反となる「`apps/web` から D1」「Sheets API direct 経路」等の表現が本仕様書内に残っていないかを `rg` で確認する。
6. AC-11 検証: GitHub Issue #234 の状態を `gh issue view 234 --json state,title,url` で確認し、CLOSED のまま維持されていることを記録する。
7. cross-link 死活: 本仕様書 / index.md / 各 phase-*.md / 各 outputs/* から参照される相対パスをすべて `link-checklist.md` に列挙し、`test -e` で死活確認する（死リンク 0 件）。
8. 既知制限を `outputs/phase-11/main.md` に列挙する（docs-only として検証できない事項は委譲先付きで明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | 本タスク index と AC 一覧 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/artifacts.json | 機械可読サマリー |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/migration-matrix-design.md | 移植マトリクス検証対象 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/no-new-endpoint-policy.md | 新設禁止方針 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md | 03a/03b/04c/09b への patch 案 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-07/ac-matrix.md | AC × smoke 項目の対応 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-10/go-no-go.md | GO 判定の前提 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様（legacy） |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md | 原典 close-out スペック |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 姉妹 close-out 形式 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | 後続 U02 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md | 後続 U04 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md | 後続 U05 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | current facts 整合検証 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | Forms response sync 正本実装（読み取りのみ） |
| 必須 | apps/api/src/sync/schema/ | schema sync 正本実装（読み取りのみ） |
| 参考 | docs/00-getting-started-manual/specs/01-api-schema.md | フォーム schema 参考 |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成参考 |

## 実行手順

### ステップ 1: AC-3 / AC-10 — 新設禁止方針の検証（rg）

```bash
# 「新設する」前提の記述が残っていないことを確認
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
   docs/30-workflows/02-application-implementation \
   .claude/skills/aiworkflow-requirements/references \
   docs/30-workflows/ut21-forms-sync-conflict-closeout

# 本仕様書では「新設しない」「U02 判定後まで保留」の文脈でのみ出現することを確認
rg -nC2 "新設しない|U02 判定後まで保留|not introduced" \
   docs/30-workflows/ut21-forms-sync-conflict-closeout
```

- 期待値:
  - `02-application-implementation` 配下に「新設する」前提の記述が残っていない（残っていれば impl 必要差分として U05 へ委譲）。
  - `aiworkflow-requirements` references に endpoint 追加前提の記述が無い。
  - 本仕様書内の hit はすべて「新設しない」「保留」「U02 判定」文脈である。
- 失敗時: hit を `manual-smoke-log.md` §1 に列挙し、Phase 5 implementation-runbook へ差し戻す。

### ステップ 2: AC-1 — UT-21 legacy 仕様書の状態欄検証

```bash
rg -nC3 "状態|status|close-out|legacy umbrella|Forms sync が正本" \
   docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md
```

- 期待値: `close-out 済` / `現行 Forms sync を正本とする` / `本タスクで新設しない` の 3 文言が状態欄に存在する。
- 失敗時: docs-only 差分として Phase 12 system-spec-update-summary に「UT-21 legacy 仕様書状態欄パッチ案」を追加。

### ステップ 3: AC-5 — 後続タスクファイル死活確認

```bash
for f in \
  docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md \
  docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md \
  docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md; do
  test -e "$f" && echo "OK $f" || echo "MISSING $f"
done
```

- 期待値: 3 件すべて `OK`。
- 失敗時: 欠落ファイルは Phase 12 unassigned-task-detection で起票方針に追加。

### ステップ 4: AC-7 — aiworkflow-requirements 整合検証

```bash
# task-workflow.md の current facts セクションを抽出
rg -nC5 "current facts|sync_jobs|D1 直接アクセス|Forms sync" \
   .claude/skills/aiworkflow-requirements/references/task-workflow.md

# 本仕様書内の対応する記述を抽出
rg -nC5 "sync_jobs|forms\\.get|forms\\.responses\\.list|apps/api/src/jobs/sync-forms-responses" \
   docs/30-workflows/ut21-forms-sync-conflict-closeout/
```

- 期待値: 両者の current facts が矛盾しない（同期元 = Forms API、ledger = `sync_jobs`、実装パス = `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）。
- 結果記録: `outputs/phase-11/spec-integrity-check.md` に対応表として整理。
- 失敗時: Phase 12 で aiworkflow-requirements `task-workflow.md` への正本 patch（UT-21 は legacy umbrella として close-out 済）を追記する指示を `system-spec-update-summary.md` に追加。

### ステップ 5: AC-9 — 不変条件 #5 違反検出

```bash
rg -n "apps/web.*D1|D1.*apps/web|Sheets API.*direct|spreadsheets\\.values\\.get" \
   docs/30-workflows/ut21-forms-sync-conflict-closeout/
```

- 期待値: hit 0 件（または「禁止」「排除」文脈のみ）。
- 失敗時: 即修正。Phase 5 へ差し戻し。

### ステップ 6: AC-11 — GitHub Issue #234 状態確認

```bash
gh issue view 234 --json state,title,url
```

- 期待値: `state: CLOSED`。CLOSED のまま仕様書を成果物として残す方針が原典指示と整合。
- 補足: 再オープンは行わない（原典指示）。

### ステップ 7: cross-link 死活チェック

```bash
# 相対パスを抽出して死活確認
rg -o "\\.\\./[A-Za-z0-9_/.-]+\\.md|docs/[A-Za-z0-9_/.-]+\\.md|\\.claude/[A-Za-z0-9_/.-]+\\.md" \
   docs/30-workflows/ut21-forms-sync-conflict-closeout/ | \
   sort -u | while read -r p; do
     # 相対パスは仕様書ディレクトリ起点で解決
     base="docs/30-workflows/ut21-forms-sync-conflict-closeout"
     resolved=$(echo "$p" | sed "s|^\\.\\./|docs/30-workflows/|")
     test -e "$resolved" && echo "OK $resolved" || echo "MISSING $resolved"
   done
```

- 期待値: MISSING 0 件、または死リンクは Phase 12 documentation-changelog で修正対象として転記。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test-strategy.md の rg / cross-link / 整合性チェック観点を本 Phase の手順に落とし込み |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入 |
| Phase 9 | docs-only QA 結果（rg / cross-link / spec-integrity）を本 Phase の `main.md` に転記 |
| Phase 12 | 検証で判明した運用知見を `unassigned-task-detection.md` / `skill-feedback-report.md` / `system-spec-update-summary.md` に登録 |

## docs-only 検証サマリー（Phase 9 から転記、本 Phase の主証跡ソース）

| 種別 | チェック対象 | PASS | FAIL | 主な検証対象 |
| --- | --- | --- | --- | --- |
| rg 棚卸し（新設禁止） | docs/30-workflows/02-application-implementation / aiworkflow-requirements references / 本仕様書 | TBD | TBD | `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_*` |
| rg（UT-21 legacy 状態欄） | UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | TBD | TBD | close-out / 新設しない / Forms sync 正本 |
| ls / test -e（後続 U02/U04/U05） | unassigned-task/ | TBD | TBD | 3 ファイル存在 |
| spec-integrity（aiworkflow-requirements） | task-workflow.md current facts | TBD | TBD | 同期元 / ledger / 実装パス整合 |
| rg（不変条件 #5） | 本仕様書全体 | TBD | TBD | apps/web→D1 / Sheets direct 表現 0 |
| gh issue view #234 | GitHub Issue | TBD | TBD | state == CLOSED |
| cross-link 死活 | 相対パス全件 | TBD | TBD | MISSING 0 |

> **本 Phase は docs-only / NON_VISUAL 検証**。screenshot / runtime smoke は不要で、上記 stdout が一次証跡。

## 多角的チェック観点

- 価値性: stale 前提 5 項目の差分表が current facts を反映し、新設禁止方針が二重明記されているか。
- 実現性: rg / grep / gh / ls / test -e のみで再現可能なコマンドとして記載されているか（追加 CLI 不要）。
- 整合性: AC-1〜AC-11 の証跡パスが Phase 7 の AC matrix と整合しているか。
- 運用性: docs-only として閉じられない差分が「impl 必要 → U05」「audit 判定 → U02」「real-env smoke → U04」として明示委譲されているか。
- 不変条件: 本仕様書が `apps/web` → D1 直アクセス・Sheets API direct の経路を一切誘導していないこと（#5）/ Forms 再回答経路の単方向性が崩れていないこと（#7）。
- Secret hygiene: `manual-smoke-log.md` に `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` 実値が混入していないこと（参照のみで実行しないため、原則 hit しない想定）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | rg（新設禁止方針） | 11 | spec_created | AC-3 / AC-10 |
| 2 | rg（UT-21 legacy 状態欄） | 11 | spec_created | AC-1 |
| 3 | ls / test -e（後続 U02/U04/U05） | 11 | spec_created | AC-5 |
| 4 | spec-integrity（aiworkflow-requirements） | 11 | spec_created | AC-7 |
| 5 | rg（不変条件 #5） | 11 | spec_created | AC-9 |
| 6 | gh issue view #234 | 11 | spec_created | AC-11 / CLOSED 維持 |
| 7 | cross-link 死活 | 11 | spec_created | 死リンク 0 |
| 8 | 既知制限のリスト化 | 11 | spec_created | 委譲先明記 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| 新設禁止 rg | `rg -n "POST /admin/sync\\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" docs/30-workflows/02-application-implementation .claude/skills/aiworkflow-requirements/references docs/30-workflows/ut21-forms-sync-conflict-closeout` | outputs/phase-11/manual-smoke-log.md §1 | TBD |
| UT-21 legacy 状態欄 rg | `rg -nC3 "状態\|close-out\|Forms sync が正本" docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | outputs/phase-11/manual-smoke-log.md §2 | TBD |
| 後続 U02/U04/U05 存在 | `for f in ... ; do test -e "$f" && echo OK \|\| echo MISSING; done` | outputs/phase-11/manual-smoke-log.md §3 | TBD |
| spec-integrity（aiworkflow-requirements） | `rg -nC5 "current facts\|sync_jobs\|Forms sync" .claude/skills/aiworkflow-requirements/references/task-workflow.md` | outputs/phase-11/spec-integrity-check.md | TBD |
| 不変条件 #5 違反検出 | `rg -n "apps/web.*D1\|spreadsheets\\.values\\.get" docs/30-workflows/ut21-forms-sync-conflict-closeout/` | outputs/phase-11/manual-smoke-log.md §5 | TBD |
| Issue #234 状態 | `gh issue view 234 --json state,title,url` | outputs/phase-11/manual-smoke-log.md §6 | TBD |
| cross-link 死活 | rg + sed + test -e | outputs/phase-11/link-checklist.md | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録すること。Token / API Key は必ずマスクする（参照のみのため原則出現しない想定）。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | docs-only タスクのため `apps/api/src/jobs/*` / `apps/api/src/sync/schema/*` 自体は変更しない | 実体側の品質要件適用は本 PR では行わない | 03a / 03b / 04c / 09b の各 Phase で適用 |
| 2 | `sync_audit_logs` / `sync_audit_outbox` の最終要否判定は本 Phase で行わない | audit 設計判断が遅延する可能性 | UT21-U02（task-ut21-sync-audit-tables-necessity-judgement-001） |
| 3 | 実 secrets / 実 D1 環境の manual smoke は本 Phase で実施しない | runtime 検証は別タスク | UT21-U04（task-ut21-phase11-smoke-rerun-real-env-001）+ 09b runbook |
| 4 | 実装パス境界（`apps/api/src/sync/{core,manual,scheduled,audit}` vs 現行構成）の最終整理は本 Phase で行わない | import path / Cron handler 配置整理が遅延 | UT21-U05（task-ut21-impl-path-boundary-realignment-001） |
| 5 | aiworkflow-requirements `task-workflow.md` の current facts に「UT-21 は legacy umbrella として close-out 済」を追記するパッチは Phase 12 で適用 | skill 側の現在事実が一時的に未反映 | Phase 12 system-spec-update-summary.md Step 1-A |
| 6 | GitHub Issue #234 は CLOSED のまま維持し、再オープンしない | Issue 上の議論履歴に本仕様書の追加は cross-link 経由のみ | 原典指示遵守 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | docs-only smoke 実行サマリー・既知制限・NON_VISUAL 判定理由 |
| ログ | outputs/phase-11/manual-smoke-log.md | 6 命令分の rg / ls / gh 実行ログ（§1〜§6） |
| チェックリスト | outputs/phase-11/link-checklist.md | cross-link 死活確認 |
| 整合性 | outputs/phase-11/spec-integrity-check.md | aiworkflow-requirements `task-workflow.md` との対応表 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` / `spec-integrity-check.md` の 4 ファイルが揃っている
- [ ] manual evidence テーブルの 7 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] docs-only 検証サマリー（rg / ls / spec-integrity / cross-link / gh）が転記されている
- [ ] 既知制限が 6 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] GitHub Issue #234 が CLOSED のまま記録されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 4 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1 / AC-3 / AC-5 / AC-7 / AC-9 / AC-10 / AC-11 の証跡採取コマンドが定義済み
- 不変条件 #5 / #7 抵触懸念が manual evidence で確認可能
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - rg / spec-integrity / cross-link で得られた検証結果を Phase 12 の `system-spec-update-summary.md` に転記
  - 既知制限 #5（aiworkflow-requirements `task-workflow.md` への close-out 済追記）を Phase 12 Step 1-A の必須パッチとして登録
  - 既知制限 #2 / #3 / #4（U02 / U04 / U05）を `unassigned-task-detection.md` に register（既起票分の参照確認）
  - cross-link の死リンクがあれば `documentation-changelog.md` の修正対象として渡す
- ブロック条件:
  - manual evidence の 7 項目に未採取 / 未 N/A 化が残っている
  - `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_*` の「新設前提」表現が本仕様書外に残っている（→ Phase 5 へ差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
  - GitHub Issue #234 が誤って再オープンされている
