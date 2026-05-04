# Phase 3: 実装計画（変更ファイル一覧 + 編集順序 + ロールバック手順）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 実装計画（変更ファイル一覧 + 編集順序 + ロールバック手順） |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (verify suite 設計) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は実装計画のみで実体ファイルを変更しない。Phase 6〜8 で実装する変更を順序立てて確定する。

## 目的

Phase 2 設計に基づき、変更ファイル一覧・編集順序・コミット粒度・ロールバック手順を確定する。

## 変更ファイル一覧

| 種別 | パス | 役割 | 担当 Phase |
| --- | --- | --- | --- |
| 編集 | docs/30-workflows/_design/sync-jobs-spec.md | ADR-001 セクション追加 + §2 / §3 / §5 参照リンク追記 | 6 |
| 編集 | docs/30-workflows/_design/sync-shared-modules-owner.md | owner 表に `sync-jobs-schema.ts` 行追加 + 冒頭注釈拡張 | 6 |
| 編集（条件付き） | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | canonical 値断言 / PII 拒否ケース不足分の追加 | 7 |
| 編集（条件付き） | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節の `_design/` 参照確認・必要時更新 | 7 |
| 編集 | docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md | status を `unassigned` → `resolved` 更新 | 8 |
| 自動再生成 | .claude/skills/aiworkflow-requirements/indexes/* | indexes 再生成（drift 解消） | 9 |

## 編集順序（依存性に基づく）

1. **Phase 6 (a)**: `_design/sync-jobs-spec.md` に ADR-001 セクション追加
2. **Phase 6 (b)**: `_design/sync-shared-modules-owner.md` の owner 表行追加（ADR の Links セクションから 1-hop で参照されるため、Phase 6 (a) と同コミット内で完結）
3. **Phase 6 (c)**: `_design/sync-jobs-spec.md` §2 / §3 / §5 への参照リンク追記（owner 表が出来てからリンクが有効化）
4. **Phase 7 (a)**: contract test 補強（不足時のみ。Phase 5 棚卸し結果に依存）
5. **Phase 7 (b)**: `database-schema.md` 確認（既に整っていれば no-op）
6. **Phase 8**: `unassigned-task/task-issue195-...` の status 更新
7. **Phase 9**: `mise exec -- pnpm indexes:rebuild` で drift 解消、typecheck / lint / vitest 実行

## コミット粒度

| # | コミット | 含むファイル | 担当 Phase |
| --- | --- | --- | --- |
| C1 | `docs(sync): add ADR-001 runtime SSOT placement and owner table row` | `_design/sync-jobs-spec.md` / `_design/sync-shared-modules-owner.md` | 6 |
| C2 | `test(sync): cover canonical SYNC_JOB_TYPES / SYNC_LOCK_TTL_MS / PII rejection in contract tests` | `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` | 7（不足時のみ） |
| C3 | `docs(sync): align database-schema.md sync_jobs section with _design/ reference` | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 7（必要時のみ） |
| C4 | `docs(workflows): mark issue-195 sync_jobs contract consolidation unassigned task as resolved` | `docs/30-workflows/unassigned-task/task-issue195-...` | 8 |
| C5 | `chore(skills): rebuild aiworkflow-requirements indexes` | `.claude/skills/aiworkflow-requirements/indexes/*` | 9（drift があれば） |

C2 / C3 / C5 は「不足 / 必要 / drift あり」の場合のみ作成。no-op の場合は evidence ログに「該当なし」を記録。

## ロールバック手順

| シナリオ | 対応 |
| --- | --- |
| ADR-001 の表現に異論 | C1 を revert し、Phase 2 設計に戻って ADR 再構成 |
| owner 表行の owner / co-owner アサインに異論 | C1 内の該当行のみ修正 PR を起票（同サイクル内） |
| contract test 追加で既存テスト破壊 | C2 を revert し、Phase 5 棚卸しに戻る |
| indexes drift が解消できない | `_design/` 配下のリンク文字列を再確認、grep evidence と突合 |

## 想定外の差分発生時の方針（L-002）

- 削除（D 差分）が発生する場合は `legacy-ordinal-family-register.md` の §Current Alias Overrides に move destination を行追加するか、新 path への実 R 移動で対応
- 本タスクは追加のみで完結する想定のため D 差分は発生しない見込み

## ローカル実行コマンド

```bash
# Phase 3 は計画のみのため実コマンドは無し。Phase 5 で棚卸しに使う grep を予告:
rg -n "SYNC_JOB_TYPES|SYNC_LOCK_TTL_MS|PII_FORBIDDEN_KEYS|assertNoPii" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts
```

## DoD

- [ ] 変更ファイル一覧（6 件）と各 Phase 担当が明示されている
- [ ] 編集順序が依存性に従って整理されている
- [ ] コミット粒度（C1〜C5）が定義され、条件付きコミットが明示されている
- [ ] ロールバック手順がシナリオ別に列挙されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 実装計画 / コミット粒度 / ロールバック手順 |
| メタ | artifacts.json | Phase 3 を completed に更新（実行時） |

## 統合テスト連携

- 計画のみ。実装は Phase 6〜8、検証は Phase 9 / 11

## 完了条件

- [ ] 6 ファイルの編集計画が確定
- [ ] コミット粒度 C1〜C5 が定義
- [ ] ロールバックシナリオが網羅

## 次 Phase

- 次: 4（verify suite 設計）
- 引き継ぎ事項: 変更ファイル一覧 / コミット粒度
- ブロック条件: 変更スコープが Phase 2 設計と矛盾

## 実行タスク

- 変更ファイル一覧を確定する
- 編集順序とロールバック手順を確認する
- Phase 4 の verify suite に渡す対象を固定する

## 参照資料

- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/index.md`
- `docs/30-workflows/_design/sync-jobs-spec.md`
- `docs/30-workflows/_design/sync-shared-modules-owner.md`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
