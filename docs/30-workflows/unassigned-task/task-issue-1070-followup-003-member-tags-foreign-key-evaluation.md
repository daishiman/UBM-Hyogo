# Issue #1070 follow-up: member_tags DB-level FOREIGN KEY addition evaluation

## メタ情報

```yaml
issue_number: 1119
task_id: task-issue-1070-followup-003-member-tags-foreign-key-evaluation
task_name: Evaluate adding DB-level FOREIGN KEY to member_tags.tag_id
category: 評価
target_feature: tag lifecycle schema governance (member_tags / tag_definitions)
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1070 Phase 12 unassigned-task-detection U-3
created_date: 2026-06-03
dependencies: [issue-1070-tag-reactivate-physical-delete]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1070-followup-003-member-tags-foreign-key-evaluation |
| タスク名 | Evaluate adding DB-level FOREIGN KEY to member_tags.tag_id |
| 分類 | 評価 |
| 対象機能 | tag lifecycle schema governance (member_tags / tag_definitions) |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md` U-3 |
| 関連 Issue | #1070 |

---

## 1. なぜこのタスクが必要か

Issue #1070 では tag 台帳（`tag_definitions`）の reactivate / physical delete を `apps/api` の endpoint として実装した。physical delete では「参照あり tag を消すと孤児化する」ため、削除前に `countMemberTagReferences`（`SELECT COUNT(*) FROM member_tags WHERE tag_id = ?`）で件数を数え、1 件でもあれば 409 `tag_has_references` で拒否する **application-level count guard** を採用した。

この設計の背景には、`member_tags` テーブルに `tag_definitions(tag_id)` への **DB-level FOREIGN KEY が存在しない**という前提がある（`apps/api/migrations/0002_admin_managed.sql:43-51`、`PRIMARY KEY (member_id, tag_id)` のみ）。FK が無いため、DB は参照整合を保証せず、唯一の参照防壁が application 側の count guard になっている。

ここで残る関心事が「そもそも `member_tags.tag_id` に DB-level FOREIGN KEY を追加し、`ON DELETE RESTRICT` 等で DB レイヤから孤児化を機械的に禁止すべきか」である。これは Issue #1070 の AC に含まれない別関心事であり、かつ「先送り」でもない。FK 追加は既存 seed / ingest / migration ordering / D1（SQLite）の `PRAGMA foreign_keys` 挙動の影響評価を伴う **schema governance タスク**であり、合意なしに入れると既存データや fixture を壊しうる。よって本タスクは「FK を追加するか・しないか」の **意思決定 + 影響レポート** を成果物とする評価タスクとして独立させる。

## 2. 何を達成するか

`member_tags.tag_id` への DB-level FOREIGN KEY 追加の可否を、既存スキーマ・データ・経路への影響を踏まえて評価し、採用可否の意思決定と根拠レポートを出力する。実装（migration 適用）まで含めるかは評価結果次第とし、本タスク単体では「評価レポートの確定」までを必須成果物とする。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | `member_tags.tag_id` への DB-level FOREIGN KEY 追加の **可否（追加する / しない）が意思決定され、根拠が文書化**されている |
| AC-2 | 既存 `member_tags` 行に `tag_definitions.tag_id` を満たさない **孤児行が存在するか**を実 D1（および seed / fixture）で調査し、結果が記録されている |
| AC-3 | FK 追加が **seed / ingest / migration 適用順序**へ与える影響（挿入順序依存・既存 seed 順・ingest 経路の tag 先行作成有無）が評価されている |
| AC-4 | Cloudflare D1（SQLite）の **`PRAGMA foreign_keys` 挙動**（D1 でデフォルト ON/OFF か・migration 内での enforcement・既存接続での扱い）が確認・記録されている |
| AC-5 | FK 採用時の **migration 範囲と repository regression 範囲の見積もり**（必要な新 migration、影響を受ける repository / contract spec、fixture 修正点）が提示されている |
| AC-6 | FK 採用が issue-1070 の application-level count guard（`countMemberTagReferences` + 409）と **どう共存 / 代替 / 補強するか**（`ON DELETE RESTRICT` への寄せ・二重防壁の是非）が整理されている |

## 3. 実行方針

1. **現状把握**: `apps/api/migrations/0002_admin_managed.sql` の `member_tags` / `tag_definitions` 定義を確認し、FK 不在と application-level guard（issue-1070 の `countMemberTagReferences`）の現行防壁構造を baseline 化する。
2. **孤児行調査（AC-2）**: 実 D1 と seed / fixture に対し `SELECT * FROM member_tags WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)` 相当で孤児行の有無を計測する。孤児が存在すれば FK 追加は先行クリーンアップが前提になる。
3. **D1 PRAGMA 挙動確認（AC-4）**: Cloudflare D1 における `PRAGMA foreign_keys` の既定値と migration 適用時の enforcement を確認し、FK 制約が実際に効くか（D1 で no-op にならないか）を検証する。
4. **経路影響評価（AC-3）**: seed 投入順・ingest 経路で tag が member_tags 挿入より先に存在することが保証されるかを確認し、FK 追加で挿入順序エラーが起きうる箇所を洗い出す。
5. **意思決定（AC-1 / AC-6）**: 上記を踏まえ「FK を追加する / しない」を判断し、application-level guard との共存・代替・補強の方針（`ON DELETE RESTRICT` 寄せの是非、二重防壁の妥当性）を確定する。
6. **採用時のみ実装スコープ提示（AC-5）**: FK 追加と判断した場合に限り、新 migration（FK 付き再作成 or 制約追加）・seed/fixture audit・repository regression の範囲を見積もり、別実装タスクとして切り出す。実装そのものは本タスクの必須範囲外とし、合意確定後に行う。

## 苦戦箇所【記入必須】

- 対象: `apps/api/migrations/0002_admin_managed.sql`（`member_tags` 定義 43-51 行目）
- 症状: `member_tags` は `PRIMARY KEY (member_id, tag_id)` のみで `tag_definitions(tag_id)` への FOREIGN KEY が無い。このため DB は参照整合を保証せず、issue-1070 は application-level の `countMemberTagReferences`（`SELECT COUNT(*) FROM member_tags WHERE tag_id = ?`）+ 409 `tag_has_references` を「唯一の参照防壁」として選んだ。FK を後付けするには、この設計判断を覆す形になるため、application guard と DB guard の二重化方針を先に合意する必要がある。

- 対象: Cloudflare D1（SQLite）の `PRAGMA foreign_keys` / migration 適用順序 / 既存孤児行チェック
- 症状: SQLite は接続ごとに `PRAGMA foreign_keys` の ON/OFF が決まり、OFF だと FK 制約が宣言されていても enforcement されない。D1 での既定値・migration 内での扱いを確認しないと「FK を足したのに効いていない」状態になりうる。さらに既存 `member_tags` に孤児行が 1 件でもあると FK 付きテーブルへの移行（再作成 + データ移送）が失敗するため、先に孤児行の有無を実 D1 で確定する必要がある。SQLite は `ALTER TABLE ... ADD CONSTRAINT` を直接サポートしないため、FK 追加はテーブル再作成（rename → 新テーブル → INSERT SELECT → drop）になる点も難所。

- 対象: 既存 seed / ingest / fixture（`apps/api` の D1 seed・ingest 経路・contract / repository spec の fixture）
- 症状: FK を追加すると `member_tags` 挿入時に対応する `tag_definitions` 行が先に存在することが必須になる。seed や ingest が tag を後から作る順序になっている、または test fixture が孤立した `member_tags` 行を直接 INSERT している場合、FK 追加でこれらが一斉に壊れる。どの fixture / seed が影響を受けるかを洗い出さないと FK 追加が広範囲な regression を生む。これが「合意前提の schema governance タスク」である根拠であり、軽率な migration 追加は既存データや fixture を破壊しうる。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 既存 `member_tags` に孤児行があり FK 付きテーブルへの移行が失敗する | 高 | AC-2 の孤児行調査を意思決定前に必須化し、孤児が存在する場合は FK 追加判断の前提条件（先行クリーンアップ）として明記する |
| D1 で `PRAGMA foreign_keys` が OFF のまま FK が enforcement されず「効いた気になる」 | 高 | AC-4 で D1 の PRAGMA 既定値と migration enforcement を実機確認し、no-op にならないことを検証してから採用可否を決める |
| FK 追加で seed / ingest の挿入順序が壊れ既存経路が一斉に失敗する | 高 | AC-3 で seed / ingest / fixture の tag 先行作成を洗い出し、順序保証が無い箇所を採用前に列挙する |
| application-level guard と DB FK の二重防壁で責務が曖昧化する | 中 | AC-6 で「FK を主防壁にして count guard を残すか / 代替するか」を明文化し、issue-1070 の guard 撤去は本タスクで行わない |
| 評価だけで終わらず軽率に FK migration を即時実装してしまう | 中 | スコープで「合意なしの即時 FK 追加実装」を明確に除外し、採用時の実装は別タスク + 合意確定後とする |

## 検証方法

### 単体検証

評価の根拠となる現行 repository / contract の挙動が、FK 追加を仮定したときに退化しないことを確認するため、issue-1070 で固定済みの参照ガード spec を再実行する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

期待: `countMemberTagReferences` / physical delete の参照ガード（409 `tag_has_references`）と logical DELETE regression が PASS のままで、評価の baseline が維持されている。

### 統合検証

実 D1（および seed / fixture）に対し孤児行の有無・既存 migration 状況・D1 の FK 挙動を確認する。

```bash
# 既存 migration 一覧と適用状況（FK 追加 migration の ordering 影響評価の前提）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 孤児行調査（member_tags.tag_id が tag_definitions に無い行）/ FK 挙動確認は
# 上記 d1 操作ラッパー経由で実施し、結果を評価レポートに記録する
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

期待: 孤児行件数・migration 適用状況・D1 の `PRAGMA foreign_keys` 挙動が記録され、typecheck / lint は本評価タスクで非破壊（コード変更が無ければ green 維持）であること。

## スコープ

### 含む

- `member_tags.tag_id` への DB-level FOREIGN KEY 追加可否の **評価レポート**（意思決定 + 根拠）
- 既存 `member_tags` 孤児行の有無調査（実 D1 / seed / fixture）
- seed / ingest / migration 適用順序への影響評価
- Cloudflare D1（SQLite）`PRAGMA foreign_keys` 挙動の確認
- FK 採用時の migration 範囲 + repository regression 範囲の見積もり
- application-level count guard との共存 / 代替 / 補強方針の整理

### 含まない

- 合意なしの即時 FK 追加実装（FK 付き migration の即時適用）
- issue-1070 の application-level count guard（`countMemberTagReferences` + 409 `tag_has_references`）の撤去
- U-1（physical delete 参照あり時の強制移行 migration・別タスク）
- U-2（admin UI からの reactivate / physical delete 導線・別タスク）
- staging / production deploy、commit、push、PR 作成

## 参照

- Issue #1070: https://github.com/daishiman/UBM-Hyogo/issues/1070
- `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/migrations/0002_admin_managed.sql`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
