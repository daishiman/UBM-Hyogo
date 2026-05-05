# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-30 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |
| taskType | spec_created（docs_only=true） |

## 目的

`schema_aliases` テーブルの DDL 適用と 07b alias resolve 配線が手動 smoke でも稼働することを確認するための「将来の実装タスクが収集すべき evidence 種別」を placeholder として明示する。本タスクは spec_created（docs_only）であるため、本 Phase で実 evidence は取得しない。

## 縮約適用根拠

- visualEvidence = NON_VISUAL（D1 / API / repository 配線変更で UI 変更なし）
- taskType = spec_created（実装は別 issue に切り出し予定。本タスクでは仕様書のみ確定）
- screenshot は不要、CLI / curl / SQL 出力で AC を検証する性質のタスク

そのため本 Phase は**縮約テンプレ**を適用し、manual evidence の placeholder を列挙するに留める。

## 実 evidence は不要（spec_created 段階）

実装タスクが起票・実行された段階で、以下 6 種類の evidence を `outputs/phase-11/` 配下に保存する想定。

## evidence placeholder 一覧（実装タスク向け）

### E1. schema_aliases migration 適用確認

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-local --env local
# 期待: <NNNN>_create_schema_aliases.sql が applied 列に表示されること
```

保存先: `outputs/phase-11/e1-migrations-list.txt`

### E2. テーブル構造確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --env local \
  --command "PRAGMA table_info(schema_aliases)"
# 期待: id / stable_key / alias_question_id / alias_label / source / created_at / resolved_by / resolved_at が列挙されること
```

保存先: `outputs/phase-11/e2-table-info.txt`

### E3. 行数 baseline

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --env local \
  --command "SELECT count(*) FROM schema_aliases"
```

保存先: `outputs/phase-11/e3-row-count.txt`

### E4. 07b alias resolve endpoint への curl

```bash
curl -X POST https://<api-host>/admin/schema/aliases \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"aliasQuestionId":"<gid>","stableKey":"membership_kind","source":"manual"}'
# 期待: 200 / { "id": "...", "stableKey": "membership_kind" }
# その直後 SELECT で 1 行 INSERT されていること
```

保存先: `outputs/phase-11/e4-curl-resolve.txt`

### E5. 03a 次回 sync 後の unresolved 件数 before/after

```bash
# before
bash scripts/cf.sh d1 execute ubm-hyogo-db-local --env local \
  --command "SELECT count(*) FROM schema_diff_queue WHERE status='unresolved'"
# alias 解決 → 03a sync 再実行 → after を再取得
```

保存先: `outputs/phase-11/e5-unresolved-diff.txt`（before / after の 2 値を併記）

### E6. `schema_questions` 直接 UPDATE 不在確認（lint）

```bash
grep -rn "UPDATE schema_questions SET stable_key" apps/api/src
# 期待: 0 件（exit 1）
```

保存先: `outputs/phase-11/e6-grep-no-direct-update.txt`

## 多角的チェック観点

- 不変条件 #1: alias 解決ロジックがコードハードコードされていないこと（DB 経由のみ）
- 不変条件 #5: 全 evidence が `apps/api` 経由で取得され、`apps/web` 直接アクセスがないこと
- 無料枠: 行数 baseline が D1 無料枠（5GB / 5M rows）を脅かさないこと
- セキュリティ: curl で使用する admin token がログに残らない（`---` でマスクされる）こと

## サブタスク管理

- [ ] 本 phase-11.md に E1〜E6 の placeholder が列挙されている
- [ ] 縮約適用根拠を NON_VISUAL / spec_created で明記している
- [ ] 実装タスクが起票された際の evidence 保存先パスが outputs/phase-11/ 配下で統一されている
- [ ] 実 evidence が本タスクでは不要である旨を明記している

## 成果物

- `outputs/phase-11/main.md`（本 Phase の縮約適用記録）
- 実 evidence ファイルは実装タスクで生成（本タスクでは未生成で OK）

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 参照資料

- 依存 Phase: Phase 2 / Phase 5 / Phase 6 / Phase 8 / Phase 9 / Phase 10
- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] AC-1 / AC-3 / AC-4 / AC-5 を将来検証する evidence の placeholder が網羅されている
- [ ] 縮約理由が visualEvidence / taskType / docs_only の 3 軸で説明されている
- [ ] spec_created 段階での evidence 不要が明記されている

## タスク100%実行確認

- [ ] E1〜E6 の 6 種 placeholder すべてが書かれている
- [ ] 各 evidence の保存先パスが `outputs/phase-11/eN-*.txt` 形式で統一されている
- [ ] grep -rn の placeholder が「0 件確認」を期待していると明示されている

## 次 Phase への引き渡し

Phase 12 では、本 placeholder を `documentation-changelog.md` に「将来取得すべき evidence 一覧」として再掲し、実装タスク起票時の参照点として残す。
