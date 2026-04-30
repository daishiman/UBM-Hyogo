# Phase 11: 手動 smoke test → NON_VISUAL 代替 evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（NON_VISUAL 代替 evidence） |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー / Go-No-Go) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / direction-reconciliation / NON_VISUAL |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |
| Issue | #94 (CLOSED — 仕様書化のため再オープンしない) |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは reconciliation の **docs-only / 方針決定** タスクであり、コード変更 / API 実装 / UI 実装を一切伴わない。
  - 出力先は仕様書（`docs/30-workflows/ut09-direction-reconciliation/`）と reconciliation 結論の伝播対象である正本 5 文書 / aiworkflow-requirements references のみ。
  - screenshot / wrangler dev / curl / D1 SELECT は本タスクの一次証跡として **不要**。一次証跡は (a) 文書 diff スキャン結果、(b) `rg` による正本記述抽出ログ、(c) aiworkflow-requirements indexes 整合状態。
  - `outputs/phase-11/screenshots/` は **作成しない**（NON_VISUAL 整合）。
- 必須 outputs:
  - `outputs/phase-11/main.md`（NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先サマリー）
  - `outputs/phase-11/manual-smoke-log.md`（NON_VISUAL 代替版。文書 diff / grep / verify-indexes 状態）
  - `outputs/phase-11/link-checklist.md`（参照 5 文書 + references + 原典 unassigned-task の dead link チェック）

## 目的

`phase-11-non-visual-alternative-evidence.md`（NON_VISUAL 代替 evidence プレイブック）に従い、本 reconciliation タスクで保証可能な範囲を「文書 diff / grep / verify-indexes 状態」の 3 軸で採取する。staging 実機 smoke / 実 D1 への migration / 実 endpoint 叩き は **本タスクのスコープ外** であり、UT-26 staging-deploy-smoke と Phase 10 blocker B-01〜B-07 へ委譲することを明示する。reconciliation 結論（採用 base case = 案 a）が 5 文書 + aiworkflow-requirements references + 原典 unassigned-task に対して **整合的に記述されている** ことを代替 evidence で証明する。

## 実行タスク

1. VISUAL / NON_VISUAL 判定を再確認し、screenshot 不要を明記する。
2. L1〜L4 の代替 evidence を docs-only 文脈へ読み替えて採取する。
3. 代替 evidence 差分表、manual-smoke-log、link-checklist を作成する。
4. pending / PASS / FAIL の 3 値表記と unrelated 削除混入なしを確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 代替 evidence プレイブック |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/index.md | taskType / visualEvidence / AC |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-09.md | 5 点同期チェック結果 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-10.md | GO/NO-GO 入力 |

## 適用条件チェック（プレイブック適用条件 3 件）

| # | 条件 | 本タスク該当 |
| --- | --- | --- |
| 1 | UI 差分なし（API repository / library / config / boundary tooling など） | 該当（仕様書のみ） |
| 2 | staging 環境が未配備、または実フロー前提のシナリオが現環境で実行不能 | 該当（reconciliation は方針決定であり実機実行する対象がない） |
| 3 | phase-11.md の S-1 〜 S-N が wrangler / dep-cruiser バイナリ / 実フォーム / 実 D1 を要求 | 該当（実コード撤回 / migration 撤回 / endpoint 叩きはすべて別タスク = blocker B-01〜B-06 へ委譲） |

> 3 条件すべて該当のため、本 Phase は NON_VISUAL 代替 evidence プレイブックを適用する。

## 代替 evidence の 4 階層（プレイブック準拠）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| L1: 仕様書整合 | `pnpm typecheck` / Markdown lint / 仕様書 diff スキャン | 仕様書の構造整合性 / Phase 番号 / AC 番号 | runtime 振る舞い → UT-26 / B-01 |
| L2: 静的 grep / contract sync | `rg 'sync_jobs|sync_locks|sync_job_logs|admin/sync|GOOGLE_(SHEETS|FORMS)_SA_JSON'` で 5 文書 + references を走査 | 正本記述の 1 方針一致 / 二重正本検出 | 実コード / migration の整合 → B-01 / B-02 |
| L3: aiworkflow-requirements indexes 状態 | `verify-indexes-up-to-date` job 状態確認（`.github/workflows/verify-indexes.yml`） | indexes drift 検出 | 実 rebuild PR / references 更新 → B-05 |
| L4: 意図的 violation snippet | わざと「`sync_locks`」を 1 文挿入し、L2 grep が「**重複表記検出**」として hit することを確認 | 「赤がちゃんと赤になる」 | 実 PR の混入検出は CI / レビュー → B-06 |

## 必須テンプレ: 代替 evidence 差分表

> `outputs/phase-11/main.md` に以下を必ず含める。

| Phase 11 シナリオ（VISUAL タスクの元前提） | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 | wrangler dev で `/admin/sync*` を叩く | `rg 'POST /admin/sync'` で 5 文書 + api-endpoints.md の正本記述抽出 | 仕様書レベルの endpoint 表記一致 | UT-26 staging-deploy-smoke / blocker B-01 |
| S-2 | 実 D1 への migration apply | `rg 'sync_jobs|sync_locks|sync_job_logs'` で ledger 表記の重複検出 | 仕様書レベルの ledger 一意性 | blocker B-02 |
| S-3 | 実 SA Secret 注入 + 実 forms.get 叩き | `rg 'GOOGLE_(SHEETS|FORMS)_SA_JSON'` で Secret 表記の正本一致確認 | 仕様書レベルの Secret hygiene | blocker B-05 |
| S-4 | scheduled handler の Cron 自動発火 | `rg '0 \\*/?[0-9]+ \\* \\* \\* \\*'` で 09b runbook の Cron 表記抽出 | 仕様書レベルの Cron 経路一致 | UT-26 / blocker B-01 |
| S-5 | 旧 UT-09 root の direct implementation 撤回 | 旧 UT-09 root index.md の grep で direct implementation 化記述の有無確認 | 仕様書レベルの責務境界 | blocker B-04 |
| S-6 | 意図的 violation で red 確認（L4） | 仮想的に「`sync_locks` 採用」記述を 1 行挿入し L2 grep が hit することを目視確認 | 「赤がちゃんと赤になる」 | （L2 で吸収済） |
| S-7 | references / indexes の実 rebuild | `verify-indexes-up-to-date` job 状態 + `pnpm indexes:rebuild` 実行有無 | indexes drift 検出のみ | blocker B-05 |

## 必須チェック（プレイブック準拠）

- [ ] 代替 evidence で **何を保証し**、**何を保証できないか** を上表で明示
- [ ] 保証できない項目はすべて `unassigned-task-detection.md`（Phase 12 で実施）/ blocker B-01〜B-07 / UT-26 に申し送り済
- [ ] L4（意図的 violation → red 確認）を 1 件以上記述
- [ ] `outputs/phase-11/manual-smoke-log.md` に「NON_VISUAL のため screenshot 不要」を明記
- [ ] Phase 12 implementation-guide.md の §「やってはいけないこと」に reconciliation 違反例（二重正本 / 二重 ledger / endpoint 競合）を含める旨を申し送り

## docs-only / governance 系 Phase 11 outputs 構成（プレイブック準拠）

| ファイル | 役割 | 必須項目 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先 | `visualEvidence: NON_VISUAL`、L1〜L4 結果サマリ、保証できない範囲 |
| `outputs/phase-11/manual-smoke-log.md` | 整合性検査ログ（仕様書 diff / `rg` 抽出 / verify-indexes 状態） | 実行コマンド・終了コード・所要時間・実行者・実行日時 |
| `outputs/phase-11/link-checklist.md` | 仕様書内リンク・参照ドキュメントの dead link チェック | 対象リンク一覧 / 200 確認 / 補正したリンクの差分 |

> `outputs/phase-11/screenshots/.gitkeep` は **作成しない**（NON_VISUAL 整合）。

## 実行手順

### ステップ 1: L1 仕様書整合（typecheck / lint / 仕様書 diff）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

- 期待値: exit 0。本タスクはコード変更を伴わないため typecheck / lint は既存 green を維持。
- 仕様書 diff スキャン: index.md と phase-XX.md の AC 番号 / Phase 番号 / 採用結論表記が一致しているか目視 + `rg 'AC-1[0-4]|AC-[1-9]\b'` で確認。

### ステップ 2: L2 静的 grep / contract sync

```bash
# 二重 ledger 検出
rg 'sync_jobs|sync_locks|sync_job_logs' docs/30-workflows/ .claude/skills/aiworkflow-requirements/references/

# endpoint 表記
rg 'POST /admin/sync' docs/30-workflows/ .claude/skills/aiworkflow-requirements/references/

# Secret 名
rg 'GOOGLE_(SHEETS|FORMS)_SA_JSON|SHEETS_SPREADSHEET_ID' docs/30-workflows/ .claude/skills/aiworkflow-requirements/references/
```

- 期待値:
  - `sync_jobs` が 5 文書 + database-schema.md で正本登録、`sync_locks` / `sync_job_logs` は本 reconciliation 仕様書および「撤回対象」コンテキスト内のみで言及。
  - `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 endpoint 表記が 04c / api-endpoints.md / 09b で一致、単一 `POST /admin/sync` は撤回対象コンテキスト内のみ。
  - `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` が environment-variables.md / deployment-cloudflare.md で正本登録、`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` は廃止候補コンテキスト内のみ。

### ステップ 3: L3 aiworkflow-requirements indexes 状態

```bash
# verify-indexes job 状態確認（GitHub Actions log 参照）
gh run list --workflow=verify-indexes.yml --branch=$(git rev-parse --abbrev-ref HEAD) --limit=1
```

- 期待値: 直近 verify-indexes job が green（drift 0）。drift があれば blocker B-05 に register。
- **本タスクで `pnpm indexes:rebuild` は実行しない**（docs-only 境界）。drift 解消は別タスク。

### ステップ 4: L4 意図的 violation snippet（red 確認）

- 仮想的に「`sync_locks` を採用する」という違反記述を 1 行 phase-08.md などに挿入したと想定し、ステップ 2 の grep が hit することを目視確認。
- 実際には挿入せず、grep パターンが正しく hit する条件を `manual-smoke-log.md` に記録（「赤がちゃんと赤になる」）。

### ステップ 5: link 検証（link-checklist.md）

| チェック | 方法 | 期待 |
| --- | --- | --- |
| index.md × phase-XX.md | `Phase 一覧` × 実ファイル | 完全一致 |
| phase-XX.md 内 `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 5 文書同期対象 path | legacy umbrella / 03a / 03b / 04c / 09b | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/{api-endpoints,database-schema,deployment-secrets-management}.md` | 実在 |
| 原典 unassigned-task | `../unassigned-task/task-ut09-direction-reconciliation-001.md` | 実在 |
| current 方針正本 | `../unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 実在 |
| GitHub Issue | `https://github.com/daishiman/UBM-Hyogo/issues/94` | CLOSED でも 200 OK |

### ステップ 6: 既知制限のリスト化

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | 本タスクは docs-only のため runtime 振る舞いを保証できない | 実コード / endpoint / migration | UT-26 / blocker B-01〜B-04 |
| 2 | aiworkflow-requirements references / indexes の実更新は別タスク | references drift 解消 | blocker B-05 |
| 3 | 案 b（Sheets 採用）採用時の評価は将来検討 | 戦略判断 | Phase 12 unassigned-task-detection |
| 4 | unrelated verification-report 削除は本 PR に混ぜない | governance | 別 unassigned-task（B-06） |
| 5 | staging 実機 smoke は本タスクで実施しない | 実機検証 | UT-26 staging-deploy-smoke |
| 6 | D1 contention mitigation 5 知見の実コード移植は別タスク | 品質要件移植 | blocker B-03 |
| 7 | 旧 UT-09 root の legacy umbrella 参照復元は別 PR | 仕様修正 | blocker B-04 |

## 申し送り先サマリー（保証できない範囲）

| 保証できない項目 | 申し送り先 |
| --- | --- |
| 実コード（Sheets API 実装 / 単一 `/admin/sync`）の撤回 | blocker B-01（reconciliation 後 implementation task） |
| `sync_locks` / `sync_job_logs` migration の up/down 実行 | blocker B-02（D1 migration 撤回 task） |
| D1 contention mitigation 5 知見の 03a / 03b / 09b への移植実装 | blocker B-03（品質要件移植 task） |
| 旧 UT-09 root の legacy umbrella 参照復元 | blocker B-04（仕様修正 task） |
| references / indexes の実更新 | blocker B-05（references 更新 task） |
| unrelated verification-report 削除 | blocker B-06（別 unassigned-task） |
| 案 b（Sheets 採用）の将来採用判断時期 | blocker B-07（Phase 12 unassigned-task-detection 経由 Wave 後段） |
| staging 実機 smoke / 実 endpoint 叩き / 実 D1 SELECT | UT-26 staging-deploy-smoke |

## 自動テスト結果サマリー

> 本タスクはコード変更を伴わないため、自動テスト（unit / contract / integration / authz）は **該当なし**。既存 CI（typecheck / lint / vitest / verify-indexes）の green を維持することのみ確認。

| 種別 | 状態 | 備考 |
| --- | --- | --- |
| typecheck | 既存 green 維持 | コード変更なし |
| lint | 既存 green 維持 | コード変更なし |
| vitest | 既存 green 維持 | コード変更なし |
| verify-indexes-up-to-date | 既存 green 維持（drift 検出時は blocker B-05 へ） | 本タスクで indexes 更新なし |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | NON_VISUAL 代替 evidence 採取結果を unassigned-task-detection / documentation-changelog に転記 |
| Phase 13 | 代替 evidence のサマリーを PR description に転記（本タスクは PR 化を含まない / ユーザー承認前提） |
| UT-26 | staging 実機 smoke 観点を引き継ぎ（既知制限 #5） |
| 別タスク（B-01〜B-07） | 申し送り先サマリー経由で保証できない範囲を委譲 |

## 多角的チェック観点

- 価値性: 代替 evidence で reconciliation 結論の整合性が証明されているか。
- 実現性: docs-only 範囲で grep + 仕様書 diff + verify-indexes 状態のみで完結するか。
- 整合性: 不変条件 #1/#4/#5/#6 + current facts 5 文書整合がすべて維持されているか。
- 運用性: 保証できない範囲が blocker / UT-26 に申し送られているか。
- 認可境界: `/admin/sync*` の 2 endpoint 表記が grep 結果で一致しているか。
- ledger 一意性: `sync_jobs` 単一表記が grep 結果で一致しているか。
- Secret hygiene: Forms 系正本 / Sheets 系廃止候補が grep 結果で確認されているか。
- staging smoke 表記: pending / PASS / FAIL 区別が `manual-smoke-log.md` に反映されているか。
- unrelated 削除混入: 本 PR に含めない方針が `manual-smoke-log.md` に再掲されているか。
- docs-only 境界: `pnpm indexes:rebuild` / 実 PR が本タスクで実行されていないか。
- NON_VISUAL 整合: `outputs/phase-11/screenshots/` が **作成されていない**か。
- L4: 意図的 violation snippet による red 確認が記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | NON_VISUAL 適用条件 3 件チェック | 11 | spec_created | 全該当 |
| 2 | 代替 evidence 4 階層（L1〜L4）採取 | 11 | spec_created | プレイブック準拠 |
| 3 | 代替 evidence 差分表（7 シナリオ） | 11 | spec_created | main.md |
| 4 | L1 typecheck / lint 既存 green 確認 | 11 | spec_created | コード変更なし |
| 5 | L2 grep（ledger / endpoint / Secret） | 11 | spec_created | 二重正本検出ゼロ |
| 6 | L3 verify-indexes job 状態確認 | 11 | spec_created | drift 0 維持 |
| 7 | L4 意図的 violation snippet（red 確認） | 11 | spec_created | 仮想 / 目視 |
| 8 | link 検証（link-checklist.md） | 11 | spec_created | リンク切れ 0 |
| 9 | 既知制限リスト（7 件以上） | 11 | spec_created | UT-26 / B-01〜B-07 委譲 |
| 10 | 申し送り先サマリー | 11 | spec_created | 保証できない範囲 |

## manual evidence（NON_VISUAL 代替版・実採取時の placeholder）【必須】

| 項目 | コマンド / 確認 | 採取先 | 採取済 |
| --- | --- | --- | --- |
| typecheck 既存 green | `mise exec -- pnpm typecheck` | manual-smoke-log.md §L1 | TBD |
| lint 既存 green | `mise exec -- pnpm lint` | §L1 | TBD |
| 仕様書 AC / Phase 番号整合 | `rg 'AC-1[0-4]\|AC-[1-9]\b' docs/30-workflows/ut09-direction-reconciliation/` | §L1 | TBD |
| ledger 表記 grep | `rg 'sync_jobs\|sync_locks\|sync_job_logs' docs/ .claude/` | §L2-ledger | TBD |
| endpoint 表記 grep | `rg 'POST /admin/sync' docs/ .claude/` | §L2-endpoint | TBD |
| Secret 表記 grep | `rg 'GOOGLE_SHEETS_SA_JSON|GOOGLE_FORM_ID|GOOGLE_SERVICE_ACCOUNT_EMAIL|GOOGLE_PRIVATE_KEY' docs/ .claude/` | §L2-secret | TBD |
| verify-indexes job 状態 | `gh run list --workflow=verify-indexes.yml --limit=1` | §L3 | TBD |
| 意図的 violation 仮想確認 | grep が hit する条件の目視確認 | §L4 | TBD |
| link 検証（5 文書 + references + 原典） | 各 path の存在確認 | link-checklist.md | TBD |
| NON_VISUAL screenshot 不要宣言 | 文言記載 | manual-smoke-log.md 冒頭 | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録。
> Secret 値 / op:// 参照値は必ずマスクする。実値出力ゼロを維持する。

## 既知制限リスト【必須】

> 上記「ステップ 6」と同一。再掲のためここでは省略し、`main.md` には完全版を転記する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL 宣言 / 代替 evidence 差分表 / 申し送り先 / 既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | L1〜L4 整合性検査ログ（NON_VISUAL 代替版） |
| チェックリスト | outputs/phase-11/link-checklist.md | 5 文書 + references + 原典の dead link チェック |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] NON_VISUAL 適用条件 3 件すべて該当が確認されている
- [ ] 代替 evidence 4 階層（L1〜L4）すべて採取手順記述
- [ ] 代替 evidence 差分表が 7 シナリオで埋まっている
- [ ] L4（意図的 violation → red 確認）が 1 件以上記述
- [ ] manual evidence テーブル（10 項目）すべての採取列が完了（または各 N/A 理由が記載）
- [ ] L2 grep 結果で ledger / endpoint / Secret の 1 方針一致が確認できる設計になっている
- [ ] 既知制限が 7 項目以上列挙され、それぞれ委譲先（UT-26 / blocker B-01〜B-07）が記述されている
- [ ] 申し送り先サマリーで保証できない範囲が漏れなく blocker / UT-26 に register
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] `manual-smoke-log.md` 冒頭に「NON_VISUAL のため screenshot 不要」明記

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- staging 実機 smoke が UT-26 へ委譲されることが明記
- 実コード / migration / references / indexes 更新が blocker B-01〜B-05 へ委譲されることが明記
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - NON_VISUAL 代替 evidence 採取結果（L1〜L4）を Phase 12 unassigned-task-detection / documentation-changelog に転記
  - 既知制限 7 項目を Phase 12 implementation-guide.md に取り込み（特に staging smoke は UT-26 委譲、実コード撤回は B-01 委譲）
  - 申し送り先サマリー（保証できない範囲）を Phase 12 で blocker register
  - 03-serial / legacy umbrella との 5 点同期チェック結果を Phase 12 に渡す
  - L4 意図的 violation snippet による red 確認パターンを Phase 12 implementation-guide.md §「やってはいけないこと」に転記
- ブロック条件:
  - manual evidence の項目に未採取 / 未 N/A 化が残っている
  - L4 の意図的 violation snippet が記述されていない
  - `screenshots/` ディレクトリが誤って作成されている
  - 既知制限が 5 件未満
  - 保証できない範囲が blocker / UT-26 に申し送られていない
  - `pnpm indexes:rebuild` を本タスクで実行しようとしている（docs-only 境界違反）
