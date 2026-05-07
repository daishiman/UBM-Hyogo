# Phase 12: implementation-guide / 親タスク state 境界 / unassigned / skill-feedback / compliance

task-specification-creator skill の Phase 12 6 必須タスクを実行する。

## Task 12-1: implementation-guide 作成

`outputs/phase-12/implementation-guide.md` を作成する。

### Part 1（中学生レベル）

- 「会員サイトの裏側にある『出席を取ってくる係』が、ちゃんと係に任命されているかをテスト用環境で実際に動かして確認した」
- 「もし任命されていないとサイトはエラーで止まるしくみになっている。その止まり方も問題ないことを確認した」
- 「実行ログには合言葉（パスワード）が残らないように、機械的に塗りつぶす仕組みを入れた」

### Part 2（技術者レベル）

- 親タスク（issue-371）で確立した `c.var.attendanceProvider` middleware DI 経路の staging runtime 検証
- `/admin/members*` × 3 / `/me/` × 3 の HTTP 200 + route-specific JSON contract 確認。DI-bound evidence は `/admin/members/:memberId` と `/me/profile` に限定する
- silent fallback 撤廃された throw 経路を unit test で再確認（`builder.test.ts:192,301`）
- secret / PII hygiene として raw body 永続化禁止 + summary-only runtime log + grep-gate を適用
- 親タスクの workflow_state は staging runtime smoke PASS 後にのみ `PASS_RUNTIME_VERIFIED` に遷移する。credentials 未提供の本 wave では pending 維持

## Task 12-2: システム仕様書更新

更新対象（最小）:

- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md`
  - runtime smoke PASS 前は編集しない
  - PASS 後にメタ表「状態」を `implemented-local / evidence captured (Issue は closed のまま)` → `completed / PASS_RUNTIME_VERIFIED (Issue は closed のまま)` へ更新
  - PASS 後にフッター注釈へ「runtime smoke は #531 で実施」を 1 行追加（Refs #531）

更新不要（本タスクは新規 endpoint / D1 schema 変更を伴わないため）:

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に下記を canonical absolute path で列挙:

```
- /docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/  # 本タスク仕様書一式
- /scripts/smoke/runtime-attendance-provider.sh
- /scripts/smoke/redact.sh
- /docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-07/shellcheck.log
- /docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log
```

## Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）。

期待される未タスク候補（解析結果に応じて起票判断）:

- runtime smoke の **CI 化**（`.github/workflows/` への組み込み）— 本タスクは scale:small で手動実行に閉じたため別タスク化候補
- production への smoke 適用（本タスクは staging のみ）
- write/tag/note provider の middleware 化（親タスク scope out）

各候補について「苦戦箇所 / リスクと対策 / 検証方法 / スコープ」の 4 セクションを記述。

## Task 12-5: skill-feedback レポート

`outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）。

3 観点固定:

- テンプレ改善: NON_VISUAL runtime smoke 専用テンプレの不在
- ワークフロー改善: 親タスクの `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED` 遷移を skill 側で fast-path 化できないか
- ドキュメント改善: secret hygiene patterns（Set-Cookie / authjs / cf-_session）を skill references に集約

## Task 12-6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下チェック表を記録:

| チェック | 結果 |
| --- | --- |
| index.md 必須項目（メタ / purpose / scope / dependencies / refs / AC / phase index） | PASS |
| Phase 1-13 ファイル存在 | PASS |
| 実装区分明記 | PASS（実装仕様書） |
| CONST_005 必須項目（変更ファイル / シグネチャ / 入出力 / テスト / コマンド / DoD） | PASS |
| AC ↔ Phase マッピング | PASS（phase-02.md） |
| Phase 11 evidence canonical path | PASS |

## 完了条件

- `outputs/phase-12/` 配下に 7 ファイル（main / implementation-guide / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / system-spec-update-summary）が配置されている
- 親タスク `index.md` は runtime smoke PASS 前に更新されていないこと。PASS 後のみ state update する
- `aiworkflow-requirements` skill の indexes に drift がある場合は `pnpm indexes:rebuild` を実行
