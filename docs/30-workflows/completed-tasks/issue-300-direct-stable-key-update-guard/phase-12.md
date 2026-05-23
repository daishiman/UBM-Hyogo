[実装区分: 実装仕様書]

# Phase 12: Documentation（7 ファイル必須セット）

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-12/*.md`（7 ファイル） |

## 必須 7 outputs

| canonical path | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 集約サマリー（Lane 統合 narrative） |
| `outputs/phase-12/implementation-guide.md` | Part 1（中学生向け） + Part 2（技術者向け） 2 パート構成 |
| `outputs/phase-12/system-spec-update-summary.md` | `database-implementation-core.md` 更新サマリー / artifacts parity |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル / validator 結果 / 4 点同期 |
| `outputs/phase-12/unassigned-task-detection.md` | repository / AST guard 強化の要否を判定し、現時点 no-op として記録 |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への反映 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 1〜5 完了確認 / planned wording 0 件 |

## Part 1 ドラフト（中学生向け・逐語コピペ用）

### `schema_questions.stable_key` の直接書き換え禁止ガードとは何か

#### 日常生活での例え

学校の名簿で「席番号と名前」を1対1で固定して使うとします。
名簿に書いてある「席番号」を、後から先生が手書きで上書きしてしまうと、
昨日まで席番号5番だった田中さんが、今日は席番号5番が違う人になってしまい、
過去の出席記録と整合性が取れなくなります。

たとえば、保健室から「席番号5番の生徒の体温記録」を要求されたとき、
書き換えが行われていると「いつの席番号5番か」が分からなくなります。

このタスクで作るガード（仕組み）は、その「席番号の直接書き換え」を
コードに混入させないための **見張り役** です。
書き換えたい場合は、専用の「別名表」（schema_aliases）に書く決まりにします。

#### この機能でできること

| 機能 | 説明 | 例 |
|------|------|-----|
| SQL の UPDATE 文を検出 | `UPDATE schema_questions SET stable_key` を含む文を見つける | `db.prepare("UPDATE schema_questions SET stable_key = ?")` |
| ORM の builder を検出 | `.update(schemaQuestions).set({ stableKey })` を見つける | drizzle スタイル |
| 例外を許す | migrations やテストデータは見逃す | `migrations/0001_init.sql` |
| エラー表示 | どこを直すべきかメッセージで教える | 「schema_aliases に書いてください」 |

#### 専門用語セルフチェック

| 用語 | 説明 |
|------|------|
| 正規表現 | 文字列パターンを表す書き方 |
| EXCEPTION_GLOBS | 例外として無視するファイルの場所リスト |
| guard script | CI で間違いを検出して止めるスクリプト |
| pre-commit hook | git commit する直前に自動実行される検査 |

## Part 2 ドラフト（技術者向け要点）

### Current Contract

- `schema_questions.stable_key` は `schema_aliases` テーブル経由で alias 解決される
- direct UPDATE は不変条件 #14 違反
- 既存 `lint-stablekey-literal.mjs` は「文字列リテラル直書き」を検出するが、「direct UPDATE」は検出しない

### Target Delta

- 新規 `scripts/lint-stable-key-update.mjs`（Detector 1/2/3）
- 新規 `.github/workflows/verify-stable-key-update.yml`
- `lefthook.yml` pre-commit 統合
- `package.json` `lint` chain への組み込み
- dead code `updateStableKey()` 削除（`apps/api/src/repository/schemaQuestions.ts:153-172`）
- `database-implementation-core.md` § Schema Alias Resolution Contract への guard 実装パス追記

### 型 / シグネチャ / エラー / エッジケース

Phase 5 / Phase 6 を参照。

### Consumer Contract & IPC Compatibility

該当なし（IPC 変更なし）。

## Task 12-2 system spec update summary（要点）

- Step 1: `database-implementation-core.md` § Schema Alias Resolution Contract に Static guard セクションを追加
- Step 2: `indexes/topic-map.json` を `pnpm indexes:rebuild` で再生成
- canonical-mirror parity: `.claude/skills/aiworkflow-requirements` と `.agents/skills/aiworkflow-requirements`（存在時のみ）の `diff -qr`
- artifacts.json / outputs/artifacts.json の Phase status / outputs list を 4 点同期

## Task 12-3 documentation-changelog 必須エントリ最小セット

| カテゴリ | path |
| --- | --- |
| skill 正本 | `.claude/skills/aiworkflow-requirements/SKILL.md`（変更があった場合） |
| skill 履歴 | `.claude/skills/aiworkflow-requirements/LOGS.md` または `changelog/<yyyymmdd>-issue-300-stable-key-update-guard.md` |
| skill reference | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` |
| workflow artifacts | `docs/30-workflows/issue-300-direct-stable-key-update-guard/{index.md,artifacts.json}` |
| workflow outputs | `docs/30-workflows/issue-300-direct-stable-key-update-guard/outputs/{artifacts.json,phase-12/*.md}` |
| system spec | 該当なし（specs 個別 path 更新なし。reference 更新のみ） |
| validator | `mise exec -- node scripts/lint-stable-key-update.mjs --strict` exit 0 / `mise exec -- pnpm lint` exit 0 / `pnpm exec vitest run scripts/lint-stable-key-update.spec.ts` 14/14 PASS |

## Task 12-4 unassigned-task-detection

- 候補 1: SQL AST guard / TypeScript AST guard への強化（regex の限界補強）: quoted/schema-qualified/複数違反 fixture を追加したため現時点 no-op
- 候補 2: repository contract test（`schema_questions` repository に stable_key 更新メソッドを持たないことを検査）: repository scan と `updateStableKey()` 削除で同一 wave 解消

## Task 12-5 skill-feedback-report

- 主担当 skill: `task-specification-creator`（NON_VISUAL static analysis タスクのテンプレ運用に発見なし）
- 補助 skill: `aiworkflow-requirements`（Schema Alias Resolution Contract への guard 実装パス追記）
- 改善点: なし（既存 reference への最小追記のみ）

## Task 12-6 compliance check

- Task 1〜5 完了確認後に作成
- planned wording 0 件確認: `rg -n "計画|予定|TODO|will be|を予定|仕様策定のみ|保留として記録" outputs/phase-12/*.md` → 0 件
- placeholder token grep 0 件（design token 系には該当しないため N/A: 理由を明記）
- lint gate 4 要素同期 checklist: `package.json scripts.lint` / `eslint` 依存 / config / `outputs/phase-11/evidence/lint.log`

## 完了条件

- [ ] 7 ファイル全実体存在
- [ ] Part 1 中学生レベル例え話 + `たとえば` 1 回以上明示
- [ ] validator 実行記録（コマンド / exit code / 件数）3 値揃う

## 次Phase

Phase 13（user approval gate）
