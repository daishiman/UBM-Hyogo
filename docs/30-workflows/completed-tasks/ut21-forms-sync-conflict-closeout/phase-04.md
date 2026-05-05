# Phase 4: テスト戦略（docs-only 整合性検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（docs-only 整合性検証戦略） |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック：受入条件 patch 案) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（legacy umbrella close-out） |

## 目的

本タスクは UT-21 を legacy umbrella として閉じる docs-only 作業であり、`apps/api` / `apps/web` の実コードには一切手を入れない。
したがって従来の unit / integration / e2e テストは対象外で、検証の本質は次の 3 軸に絞られる。

1. **stale 参照の機械検出**: `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` / `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 等の旧 UT-21 語彙が、本仕様書群を経由して現行正本側 (03a/03b/04c/09b および aiworkflow-requirements skill) に再混入していないかを `rg` で確認する。
2. **cross-link 死活**: 本タスクの index.md / phase-XX.md と、参照先 (UT21-U02/U04/U05、姉妹 close-out、UT-21 当初仕様、aiworkflow-requirements references) の相互リンクが切れていないかを確認する。
3. **正本との整合性 grep**: 03a / 03b / 04c / 09b の現行受入条件と、本タスクが Phase 5 で提示する patch 案が重複・矛盾していないかを `rg` で突き合わせる。

これらを Phase 7 の AC マトリクス（特に AC-1 / AC-2 / AC-3 / AC-7 / AC-9 / AC-10）にトレースする。

## 実行タスク

1. 検証スイート 4 種（stale 参照 grep / cross-link 死活 / 正本整合性 grep / 手動目視レビュー）の対象範囲を確定する（完了条件: スイート × 対象パスのマトリクスに空セル無し）。
2. AC-10 で要求されている `rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` を含む rg コマンド集 6 件以上を確定する（完了条件: 各コマンドに「期待される出力 (zero-hit / hit-allowed-paths)」が併記）。
3. cross-link 死活確認の手順を確定する（完了条件: index.md / phase-04〜07 / U02/U04/U05 / 姉妹 umbrella の相互参照が cycle-free に検証できるコマンドが記述）。
4. 03a/03b/04c/09b 受入条件との整合性 grep を確定する（完了条件: Bearer guard / 409 排他 / D1 retry / manual smoke の 4 観点で「正本側に既に記述があるか」「重複定義になっていないか」を確認できる手順が記述）。
5. 手動目視レビュー観点（grep で検出不能な論点）を 4 件以上列挙する（完了条件: API 境界の意味的衝突 / job_kind 単一責務 / U02 判定の前倒し誘惑 / `apps/api/src/sync/*` 想定混入 を含む）。
6. AC-1〜AC-11 すべてが少なくとも 1 つの検証スイートに紐付くことを確認する（完了条件: AC × スイート の対応表が空セル無し）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | AC-1〜AC-11 原典 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-02.md | 移植マトリクス設計（検証対象の構造） |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-03.md | レビュー判定（PASS/MINOR/MAJOR の前提） |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様 (legacy)。stale 語彙の発生源 |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 姉妹 close-out フォーマット |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | current facts（D1 / sync_jobs / deployment） |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | Forms response sync 正本実装（参照のみ・編集禁止） |
| 必須 | apps/api/src/sync/schema/ | schema 同期正本実装（参照のみ・編集禁止） |
| 参考 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-04.md | docs-only 検証戦略の参考フォーマット |

## 検証スイート設計

### 1. stale 参照 grep（旧 UT-21 語彙の混入検出）

| 観点 | 期待出力 | コマンド |
| --- | --- | --- |
| 単一 endpoint 復活誘惑 (`POST /admin/sync` / `GET /admin/sync/audit`) | 本タスク内の「禁止方針として明記する文脈」と UT-21 legacy 仕様内の引用以外で hit してはならない | `rg -n "POST /admin/sync\b\|GET /admin/sync/audit" docs/30-workflows .claude/skills/aiworkflow-requirements/references` |
| audit テーブル (`sync_audit_logs` / `sync_audit_outbox`) | U02 判定タスクと本タスク内の禁止文脈以外で hit してはならない | `rg -n "sync_audit_logs\|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` |
| 旧実装パス想定 (`apps/api/src/sync/{core,manual,scheduled,audit}.ts`) | UT-21 legacy 仕様 / U05 後続タスク以外で hit してはならない | `rg -n "apps/api/src/sync/(core\|manual\|scheduled\|audit)" docs/30-workflows .claude/skills/aiworkflow-requirements/references` |
| Sheets API v4 同期元 | UT-21 legacy / U05 / 本タスク差分表内の引用以外で hit してはならない | `rg -n "spreadsheets\.values\.get\|Google Sheets API v4\|SheetRow" docs/30-workflows .claude/skills/aiworkflow-requirements/references` |
| 単一 `job_kind` 違反 (UT-21 由来の hard-coded `kind='sync'`) | 0 hit を期待 | `rg -n "job_kind\s*=\s*['\"]sync['\"]" docs/30-workflows .claude/skills/aiworkflow-requirements/references` |
| AC-10 規定コマンド | 既知 hit のみ（本タスク仕様書 + UT-21 legacy + U02） | `rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" docs/30-workflows .claude/skills/aiworkflow-requirements/references` |

### 2. cross-link 死活

```bash
# 本タスクから外向きリンクの抽出（相対パス）
rg -oN "\.\.?/[A-Za-z0-9_\-/.]+\.md" docs/30-workflows/ut21-forms-sync-conflict-closeout | sort -u > /tmp/ut21-outlinks.txt
# 各リンク先の実在確認
while read -r line; do
  path=$(echo "$line" | cut -d: -f3-)
  base=$(echo "$line" | cut -d: -f1 | xargs dirname)
  test -e "$base/$path" || echo "BROKEN: $line"
done < /tmp/ut21-outlinks.txt
```

`BROKEN:` が 0 件であることを期待。

### 3. 正本整合性 grep（03a / 03b / 04c / 09b 受入条件 ↔ patch 案）

| 観点 | コマンド | 期待 |
| --- | --- | --- |
| 04c の Bearer guard 既述有無 | `rg -n "SYNC_ADMIN_TOKEN\|Bearer\|401\|403\|409" docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints` | 既述があれば patch 案は「補強」、なければ「新規追記」 |
| 03a/03b の 409 排他 既述有無 | `rg -n "sync_jobs\.status\s*=\s*'running'\|409\s*Conflict" docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver` | 既述があれば「補強」 |
| 03a/03b の D1 retry / SQLITE_BUSY | `rg -n "SQLITE_BUSY\|backoff\|batch.?size\|retry" docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver` | 既述があれば「補強」 |
| 09b の manual smoke / runbook | `rg -n "manual smoke\|runbook\|Cron Triggers\|pause\|resume" docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook` | 既述があれば「補強」 |

これらの grep 結果を Phase 5 の patch 案分類（「補強」/「新規追記」）に反映する。

### 4. 手動目視レビュー観点

| # | 観点 |
| --- | --- |
| 1 | API 境界の意味的衝突（`/admin/sync/schema` + `/admin/sync/responses` の 2 系統が `job_kind` 単一責務原則に整合しているかを文脈判定） |
| 2 | `sync_jobs` ledger の不足分析を本タスクで前倒ししていないか（U02 への切り出しが守られているか） |
| 3 | 実装パス想定 (`apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`) と patch 案で言及するパスが食い違っていないか |
| 4 | `apps/web` 側に D1 直接アクセス記述が混入していないか（不変条件 #5 の grep だけでは判定不能な文脈） |
| 5 | UT-21 legacy 仕様書の状態欄に「legacy / superseded by ut21-forms-sync-conflict-closeout」と明記されているか |

## AC × 検証スイート 対応

| AC# | スイート 1 | スイート 2 | スイート 3 | スイート 4 |
| --- | --- | --- | --- | --- |
| AC-1 | ○ | - | - | ○ |
| AC-2 | - | - | ○ | ○ |
| AC-3 | ○ | - | - | ○ (#5) |
| AC-4 | ○ (audit) | - | - | ○ (#2) |
| AC-5 | - | ○ | - | - |
| AC-6 | - | - | ○ | - |
| AC-7 | ○ | - | ○ | ○ |
| AC-8 | - | - | - | ○ |
| AC-9 | - | - | - | ○ (#4) |
| AC-10 | ○ (規定) | - | - | - |
| AC-11 | - | - | - | ○ (`gh issue view 234 --json state`) |

すべての AC が 1 件以上の検証手段に紐付く。

## TDD 相当の Red→Green サイクル（docs 版）

| サイクル | 内容 |
| --- | --- |
| Red | stale grep が hit / cross-link が BROKEN / 整合性 grep で重複定義検出 / 手動レビューで MAJOR |
| Green | 本タスク内文書を patch 案・cross-link 修正 / 03a/03b/04c/09b 側は本タスクで触らず Phase 5 の patch 案として提示 |
| Refactor | 重複表記を 1 箇所に集約（DRY 化は Phase 8 で実施） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 整合性 grep の結果を patch 案分類（補強 / 新規追記）に反映 |
| Phase 6 | 各検証スイートで検出される failure case を異常系の入力に転換 |
| Phase 7 | AC × 検証 × 成果物 × 担当 Phase の 4 列マトリクスに転記 |
| Phase 9 | stale grep / cross-link / 整合性 grep を品質保証ログとして実測 |
| Phase 11 | 手動目視観点 5 件を smoke 観点に転記 |

## 多角的チェック観点

- 価値性: AC-1〜AC-11 すべてが 1 つ以上の検証手段で検証可能か。
- 実現性: 全 grep / link チェックがローカル `rg` のみで完結し、Cloudflare Secret 等を要求しないか。
- 整合性: 03a/03b/04c/09b の現行仕様を本 Phase 内で書き換えていないか（読み取りのみ）。
- 運用性: コマンドが copy-paste で動作するか。
- 不変条件: #5（D1 アクセス境界）/ #7（Forms 再回答経路）の検出が手動観点に組み込まれているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | stale 参照 grep スイート（6 件以上） | spec_created |
| 2 | cross-link 死活確認手順 | spec_created |
| 3 | 正本整合性 grep（03a/03b/04c/09b 4 観点） | spec_created |
| 4 | 手動目視観点 5 件 | spec_created |
| 5 | AC × スイート 対応表 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 検証スイート 4 種・rg コマンド集・cross-link 死活手順・AC 対応表 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 検証スイート 4 種 × 対象パスのマトリクスに空セル無し
- [ ] rg コマンドが 6 件以上列挙（AC-10 規定コマンドを含む）
- [ ] cross-link 死活確認手順が記述（BROKEN 0 件期待）
- [ ] 03a/03b/04c/09b 整合性 grep が 4 観点で記述
- [ ] 手動目視観点が 4 件以上（実態 5 件）列挙
- [ ] AC-1〜AC-11 すべてが 1 つ以上のスイートに紐付く

## タスク100%実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置予定
- 検証は read-only に限定され、03a/03b/04c/09b の実体ファイルを本 Phase で編集しないことが明記
- 不変条件 #5 / #7 抵触検出が手動観点に含まれる

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック：受入条件 patch 案)
- 引き継ぎ事項:
  - stale grep の hit 一覧 → Phase 5 で「禁止文脈として明記する patch」の入力
  - 整合性 grep の結果 → Phase 5 patch 案の「補強 / 新規追記」分類
  - 手動観点 → Phase 11 smoke の観点に転記
- ブロック条件:
  - rg コマンドが 6 件未満
  - AC のいずれかに検証手段が割り当たらない
  - cross-link 死活確認が定義されない
