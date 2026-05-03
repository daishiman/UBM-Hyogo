# Phase 8: `database-schema.md` の参照更新 + 03a/03b spec 参照確認

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 8 / 13 |
| Phase 名称 | `database-schema.md` の参照更新 + 03a/03b spec 参照確認 |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 7 (call site 差し替え) |
| 次 Phase | 9 (indexes 再生成 + drift 検証 + typecheck/lint/test 実行) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

`.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節を `_design/sync-jobs-spec.md` 参照に統一し、03a / 03b の関連 spec から `_design/` への参照リンクが既に張られているか grep で確認する（無ければ追加）。

## 実行タスク

1. `database-schema.md` の `sync_jobs` 節を grep で特定し現状を記録
2. 該当節を `_design/sync-jobs-spec.md` 参照に統一（重複定義は削除）
3. 03a / 03b 配下の spec で `_design/sync-jobs-spec.md` への参照状態を grep
4. 不足箇所があれば 1 行リンクを追加
5. TS 正本 `_shared/sync-jobs-schema.ts` への参照も `database-schema.md` に明記

## 変更対象ファイル

| 種別 | パス | 変更概要 |
| --- | --- | --- |
| 編集 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節を `_design/` + TS 正本参照に統一 |
| 編集（条件付） | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/ 配下の関連 spec | `_design/sync-jobs-spec.md` 参照リンクが無ければ追加 |
| 編集（条件付） | docs/30-workflows/03a-* 配下の関連 spec | 同上（取り込み済の場合） |

## 詳細手順

### ステップ 1: 現状把握

```bash
rg -n "sync_jobs" .claude/skills/aiworkflow-requirements/references/database-schema.md
rg -n "_design/sync-jobs-spec" docs/30-workflows
```

### ステップ 2: `database-schema.md` 更新

`sync_jobs` 節の `job_type` enum / `metrics_json` schema / lock TTL の重複定義を削除し、以下に置換:

```md
### sync_jobs

正本仕様: [`docs/30-workflows/_design/sync-jobs-spec.md`](../../../docs/30-workflows/_design/sync-jobs-spec.md)
TS ランタイム正本: [`apps/api/src/jobs/_shared/sync-jobs-schema.ts`](../../../apps/api/src/jobs/_shared/sync-jobs-schema.ts)

DDL は `apps/api/migrations/0003_auth_support.sql` および `0005_response_sync.sql` を参照。
`job_type` enum / `metrics_json` schema / lock TTL の値は `_design/` を論理正本、TS を実装正本とする。
```

### ステップ 3: 03a/03b spec 参照確認

```bash
rg -L "_design/sync-jobs-spec" docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/
```

ヒットしないファイルのうち、`sync_jobs` / `job_type` / `metrics_json` を含むものに 1 行リンクを追加:

```md
> 関連正本: [`docs/30-workflows/_design/sync-jobs-spec.md`](../../_design/sync-jobs-spec.md)
```

### ステップ 4: 重複定義の削除確認

`database-schema.md` 側に `job_type` enum リストや `metrics_json` schema を再掲していたら削除し、参照のみに揃える。

## ローカル実行コマンド

```bash
rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md  # 1+ 件
rg -n "_shared/sync-jobs-schema" .claude/skills/aiworkflow-requirements/references/database-schema.md  # 1+ 件
mise exec -- pnpm indexes:rebuild
```

## DoD

- [ ] `database-schema.md` の `sync_jobs` 節が `_design/` + TS 正本への参照に統一されている
- [ ] 重複定義（enum リスト / schema 定義）が削除されている
- [ ] 03a / 03b spec から `_design/sync-jobs-spec.md` への参照リンクが少なくとも 1 件存在
- [ ] `mise exec -- pnpm indexes:rebuild` で drift がない（次 Phase で再確認）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 編集前後 diff / 03a/03b 参照確認結果 |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 統合テスト連携

- indexes drift は次 Phase で確定検証
- ドキュメントのみの変更で typecheck/test には影響しない

## 完了条件

- [ ] AC-8 検証コマンドで 1+ 件
- [ ] 03a/03b spec の参照リンク状態が記録されている
- [ ] 重複定義の削除結果が diff として記録されている

## 次 Phase

- 次: 9（indexes 再生成 + drift 検証 + typecheck/lint/test 実行）
- 引き継ぎ事項: ドキュメント更新済み状態
- ブロック条件: indexes drift が解消できない
