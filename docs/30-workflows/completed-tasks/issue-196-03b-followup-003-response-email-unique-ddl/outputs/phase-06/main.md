# Phase 6: 異常系検証

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 6 |
| status | `done` |

## 目的

既適用 migration コメント編集、文言不整合、履歴改ざん、spec 更新漏れの異常系を事前に定義する。

## 実行タスク

- migration hash drift の検証手順を定義する。
- immutable migration 方針時の縮退手順を定義する。
- completed-tasks 配下を編集しないガードを定義する。

## 参照資料

- `apps/api/migrations/0001_init.sql`
- `apps/api/migrations/0005_response_sync.sql`
- `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/`

## 統合テスト連携

D1 migration list は Phase 11 evidence として実装 follow-up 時に取得する。production D1 接続を伴うため Phase 13 承認時に取得する。

## 想定リスクと検証手順

### リスク 1: D1 migration hash drift

**懸念**: D1 が migration ファイルを hash 比較する場合、コメント差分で再適用が要求される可能性。

**検証**:

```bash
# staging で migrations list を実行し、0001 / 0005 が "applied" のままであることを確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

**期待**: 0001_init.sql / 0005_response_sync.sql が `applied` 状態のまま、新規 pending 表示にならない。

**根拠**: D1 (wrangler) の migration tracker は `d1_migrations` テーブルにファイル名のみを記録し、内容 hash は再計算しない（2026-05 時点）。コメント差分は SQL parser からも無視される。ただし wrangler の version によって挙動差異があり得るため staging で必ず確認する。

**異常時の対応**: もし pending として再表示された場合は、本タスクの方針を「コメント追記禁止 / spec doc 更新のみ」に縮退し、AC-2 / AC-3 を「`database-schema.md` 内に DDL 抜粋ブロックでコメント追記」へ振替える。

### リスク 2: 文言不整合（0001 と 0005）

**懸念**: 0001 と 0005 のコメント文言が齟齬し、未来の調査者を再度混乱させる。

**検証**:

```bash
diff <(grep "正本 UNIQUE\|再宣言" apps/api/migrations/0001_init.sql) \
     <(grep "正本 UNIQUE\|再宣言" apps/api/migrations/0005_response_sync.sql)
```

**期待**: 共通語彙「正本 UNIQUE」が両 file に出現すること（厳密一致は不要、語彙の存在のみ）。

### リスク 3: completed-tasks 配下の検出表を誤って書き換える

**懸念**: `docs/30-workflows/completed-tasks/03b-.../phase-12/unassigned-task-detection.md` を書き換えると履歴改ざんになる。

**検証**:

```bash
git diff main -- docs/30-workflows/completed-tasks/
```

**期待**: 出力が空。

**異常時の対応**: 即時 revert し、訂正は本 workflow の Phase 12 outputs にのみ記録する。

### リスク 4: spec doc 内の他箇所（主要 UNIQUE 一覧節・責務表）の更新漏れ

**懸念**: `database-schema.md` 内に既存の UNIQUE 一覧表があり、そこに `response_email` 行が無いまま放置される。

**検証**:

```bash
grep -n "UNIQUE" .claude/skills/aiworkflow-requirements/references/database-schema.md
```

**期待**: 全 UNIQUE 列挙箇所に `member_identities.response_email` が含まれている。

## 完了条件

- [x] リスク 1〜4 の検証コマンドと期待結果が記載されている
- [x] 異常時のフォールバック手順（リスク 1）が定義されている

## 成果物

- `outputs/phase-06/main.md`: 本異常系検証のコピー
