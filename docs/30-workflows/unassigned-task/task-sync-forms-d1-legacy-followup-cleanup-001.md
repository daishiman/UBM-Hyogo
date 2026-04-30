# Forms D1 legacy follow-up cleanup - タスク指示書

## メタ情報

```yaml
issue_number: 291
```

| 項目 | 内容 |
| --- | --- |
| Issue | #291 |
| タスクID | task-sync-forms-d1-legacy-followup-cleanup-001 |
| 関連タスク | task-sync-forms-d1-legacy-umbrella-001 |
| タスク名 | Forms D1 legacy follow-up cleanup |
| 分類 | ドキュメント改善 |
| 対象機能 | Google Forms sync / D1 projection / legacy umbrella governance |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | phase12-final-doc-update 30種思考法レビュー |
| 発見日 | 2026-04-30 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-sync-forms-d1-legacy-umbrella-001` は旧 UT-09 を legacy umbrella として閉じ、Forms API / split endpoint / `sync_jobs` を current として固定した。一方で `.claude/skills/aiworkflow-requirements/references` には Google Sheets API、単一 `/admin/sync`、`sync_audit` の記述が残っている。

### 1.2 問題点・課題

残存記述には historical lessons と current drift が混在している。無差別に削除すると履歴が壊れるが、分類せず放置すると新規実装者が stale な Sheets API 経路や `sync_audit` を正本として読む。

### 1.3 放置した場合の影響

Forms sync の実装や運用で、`/admin/sync/schema` / `/admin/sync/responses` ではなく単一 `/admin/sync` を増やす、または `sync_jobs` ではなく `sync_audit` を再導入するリスクが残る。03a / 03b / 04c / 09b / 02c 側から legacy umbrella を逆引きできないため、旧 UT-09 close-out の存在も埋もれる。

---

## 2. 何を達成するか（What）

### 2.1 目的

stale / historical / current を分類し、現行仕様として誤読される記述をなくす。あわせて関連タスクへの逆リンクと legacy umbrella 運用の skill feedback を回収する。

### 2.2 最終ゴール

`.claude/skills/aiworkflow-requirements/references` を読んだ実装者が、Forms API、`POST /admin/sync/schema`、`POST /admin/sync/responses`、`sync_jobs` を current と判断できる状態にする。

### 2.3 スコープ

#### 含むもの

- `Google Sheets API` / `spreadsheets.values.get` / 単一 `/admin/sync` / `sync_audit` の残存 hit 分類
- current drift の修正、historical record の注記、superseded backlog の整理方針
- 03a / 03b / 04c / 09b / 02c への逆リンク追記
- legacy umbrella template / audit flag / README 追記の skill 改善判断

#### 含まないもの

- runtime code 変更
- D1 migration 変更
- Cloudflare secret 投入
- commit、push、PR 作成

### 2.4 成果物

- stale hit 分類表
- 更新済み aiworkflow-requirements references
- 03a / 03b / 04c / 09b / 02c 側の関連タスク逆リンク
- skill 改善の採用 / 不採用理由

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-sync-forms-d1-legacy-umbrella-001` が存在する
- aiworkflow-requirements の references / indexes を更新できる
- 03a / 03b / 04c / 09b / 02c の現行タスク文書が読める

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | stale / current の判定基準 |
| 上流 | 03a / 03b | Forms schema / response sync の正本 |
| 上流 | 04c | admin sync endpoint の正本 |
| 上流 | 09b | cron / release runbook の正本 |
| 上流 | 02c | `sync_jobs` と D1 data access boundary の正本 |

### 3.3 必要な知識

- Google Forms API と旧 Google Sheets API の境界
- Cloudflare D1 の WAL 非前提運用
- task-specification-creator Phase 12 の follow-up 起票ルール

### 3.4 推奨アプローチ

まず `rg` hit を消すのではなく分類する。historical lessons は残し、current guidance として読まれる行だけを更新する。

---

## 4. 実行手順

### Phase構成

1. stale hit を機械抽出する
2. hit を current drift / historical allowed / superseded backlog に分類する
3. references と関連タスク逆リンクを更新する
4. skill 改善候補を採否判定する
5. index を再生成して検証する

### Phase 1: stale hit 抽出

#### 目的

実測ベースで cleanup 対象を確定する。

#### 手順

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references
```

#### 成果物

- hit 一覧

#### 完了条件

- 対象 file / 行 / 文脈 / 初期分類が表になっている

### Phase 2: 分類と更新

#### 目的

current 仕様の誤誘導を解消する。

#### 手順

1. `api-endpoints.md` の単一 `/admin/sync` を current drift として修正する。
2. `environment-variables.md` / `deployment-cloudflare.md` / `deployment-secrets-management.md` の Sheets secret guidance を Forms API current facts と衝突しない形に更新する。
3. `task-workflow.md` / `task-workflow-backlog.md` の `sync_audit` は historical / superseded / current drift を分類する。
4. lessons-learned の `/admin/sync*` は歴史的知見として残すか注記する。

#### 成果物

- 更新済み references

#### 完了条件

- current guidance として stale route / table / API が残らない

### Phase 3: 逆リンク反映

#### 目的

legacy umbrella を受け手タスク側から辿れるようにする。

#### 手順

1. 03a / 03b / 04c / 09b / 02c の関連タスク表を確認する。
2. `task-sync-forms-d1-legacy-umbrella-001` を upstream / legacy-umbrella として追記する。
3. 既に完了済みタスクの場合は追記理由を changelog または Decision Log に残す。

#### 成果物

- 逆リンク追記

#### 完了条件

- 5 タスクすべてから legacy umbrella を逆引きできる

### Phase 4: skill 改善判断

#### 目的

今回の false green を再発防止する。

#### 手順

1. `legacy-umbrella-template.md` 追加の要否を判定する。
2. `audit-unassigned-tasks.js --detect-legacy-umbrella` 追加の要否を判定する。
3. `docs/30-workflows/unassigned-task/` README への close-out 手順追記の要否を判定する。

#### 成果物

- 採用 / 不採用理由

#### 完了条件

- 少なくとも README 追記か audit 拡張のどちらかを実施、または不採用理由を記録する

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] stale hit が分類表で管理されている
- [ ] current guidance として単一 `/admin/sync` が残らない
- [ ] current guidance として `sync_audit` が残らない
- [ ] current guidance として Google Sheets API sync が残らない

### 品質要件

- [ ] historical lessons を無差別削除していない
- [ ] `sync_jobs` / Forms API / split endpoint の正本性が明確
- [ ] 03a / 03b / 04c / 09b / 02c への逆リンクがある

### ドキュメント要件

- [ ] aiworkflow-requirements indexes を再生成している
- [ ] skill 改善候補の採否が記録されている
- [ ] apps/ packages/ 変更なし

---

## 6. 検証方法

### テストケース

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| stale current scan | current guidance として stale API / endpoint / table が残らない | 分類済み、または 0 hit |
| backlink scan | 5 受け手タスクが legacy umbrella を参照する | 5/5 hit |
| conflict marker scan | conflict marker がない | 0 hit |
| index validation | aiworkflow-requirements indexes が最新 | generator 実行後差分確認 |

### 検証手順

```bash
rg -n "Google Sheets API|spreadsheets\.values\.get|sync_audit|/admin/sync\b" \
  .claude/skills/aiworkflow-requirements/references

rg -l "task-sync-forms-d1-legacy-umbrella-001" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver \
  docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints \
  docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary

rg -n "^(<<<<<<<|=======|>>>>>>>)" .claude/skills/aiworkflow-requirements/references docs/30-workflows
```

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 歴史的 lessons を消して運用知見を失う | 中 | 中 | hit を分類してから編集する |
| stale current guidance が残る | 高 | 中 | current guidance / historical allowed を明示する |
| 逆リンク追記で完了済みタスクの履歴が乱れる | 中 | 低 | Decision Log または changelog に追記理由を書く |
| skill 改善が肥大化する | 中 | 中 | README 追記を最小実装にし、audit 拡張は別判断にする |

---

## 8. 参照情報

### 関連ドキュメント

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/` | 判定基準 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | endpoint current guidance |
| 必須 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | sync secrets / endpoint guidance |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare / D1 / sync guidance |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | secret 正本 |
| 必須 | `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-12/implementation-guide.md` | legacy umbrella close-out の実装ガイド / Issue 参照元 |

### 参考資料

- `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-12/skill-feedback-report.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | Phase 11 / 12 で stale scan を 0 hit 想定として PASS 扱いしていたが、実測では複数 references に hit があった |
| 原因 | historical record と current guidance の分類をせず、期待値だけを証跡にしていた |
| 対応 | 本 follow-up で実測 hit を分類し、current drift だけを更新する |
| 再発防止 | legacy umbrella task では stale scan の 0 hit 断言を禁止し、hit 分類表を必須 evidence にする |

### レビュー指摘の原文（該当する場合）

```text
stale 表記 0 hit / PASS という自己申告と実検索結果が一致していない。
逆リンクと skill 改善候補も「追加未タスクなし」では弱い。
```

### 補足事項

このタスクは仕様掃除であり runtime 実装ではない。コード変更が必要になった場合は別タスクに分離する。
