# Phase 9: 品質保証 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本 Phase は実 staging 環境で取得した 13 evidence の整合性 / redaction / 再現性 / parity を機械的に検証する品質ゲートを定義する。検証対象は実 staging への副作用結果であり、commit/push を伴うため CONST_004 区分で実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 9 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #494 |

## 目的

Phase 11 で取得した 13 evidence と G1〜G4 承認証跡に対し、以下 4 観点を機械的に検証する品質ゲートを確定する:

1. **Completeness**: 13 evidence path がすべて存在 + size > 0 + `NOT_EXECUTED` placeholder 0 hit
2. **Redaction**: secret / PII（Authorization / Cookie / email / token / IP / API key）が evidence 内に 0 hit
3. **Reproducibility**: 同一コマンドを再実行可能な形で記録（コマンド全文 + redaction パイプ + 保存先パス）
4. **Parity**: `artifacts.json` ↔ `outputs/artifacts.json` が一致、staging ↔ production schema parity が `diffCount=0` または follow-up 起票済

> **lint / typecheck / build は対象外**: 本タスクの成果物はランブック markdown と evidence ファイルのみで、実装コード変更を含まない。代わりに **markdown lint** / **link-check** / **evidence schema validation** を品質ゲートとする。

## 品質ゲートマトリクス

| # | ゲート名 | 観点 | 検証コマンド | 期待結果 | blocker 種別 |
| --- | --- | --- | --- | --- | --- |
| Q1 | markdown lint | reproducibility | `mise exec -- pnpm lint -- --filter "docs/30-workflows/issue-494-**"` 相当 / または `npx markdownlint-cli2 'docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/**/*.md'` | exit 0 | hard |
| Q2 | link check | reproducibility | `npx markdown-link-check phase-08.md phase-09.md phase-10.md` 相当 | dead link 0 件 | soft（外部 URL 一時的不達は理由記録） |
| Q3 | evidence presence | completeness | issue 本文「必須証跡パス」13 件に対し `for f in <list>; do test -s "$f" \|\| echo "MISSING:$f"; done` | `MISSING:` 0 行 | hard |
| Q4 | placeholder 不在 | completeness | `grep -rn 'NOT_EXECUTED' docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/` | 0 hit | hard |
| Q5 | secret leak | redaction | `grep -rEn 'Bearer\|token=\|sk-\|API_KEY=\|password=\|access_token=\|refresh_token=' <evidence_root>` | 0 hit | hard |
| Q6 | email / IP redaction | redaction | `grep -rEn '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\|([0-9]{1,3}\.){3}[0-9]{1,3}' <evidence_root>` 後、許可リスト（テストアカウント・staging public ホスト）以外 0 件 | 0 hit | hard |
| Q7 | reproducibility（コマンド記録） | reproducibility | `outputs/phase-11/main.md` に各 evidence 取得コマンドの全文 + 取得 timestamp が記録されている | 13/13 件記録済 | hard |
| Q8 | artifacts.json parity | parity | `diff <(jq -S . docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json) <(jq -S . docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/artifacts.json)` | 出力 0 行 | hard |
| Q9 | D1 schema parity | parity | `jq '.summary.diffCount' <evidence_root>/d1/d1-schema-parity.json` | `0` または `productionMigrationTodo` フィールド存在 | hard |
| Q10 | D1 migration parity | parity | `<evidence_root>/d1/d1-migrations-staging.log` の pending 行数 | 0 行、または follow-up unassigned-task 起票済 | hard |
| Q11 | curl smoke status | completeness | 各 `curl-*.log` の HTTP status を grep（`HTTP/[12].[01] (200\|401\|403)`） | Phase 2 の期待 status 表と一致 | hard |
| Q12 | deploy version id 抽出 | completeness | `grep -E 'Current Version ID:\|Deployed' <evidence_root>/deploy/deploy-{api,web}-staging.log` | 各 1 hit 以上 | hard |
| Q13 | wrangler tail 取得 OR 取得不能理由 | completeness | `<evidence_root>/wrangler-tail/api-30min.log` 1 行目 | 「観測開始時刻」または「取得不能理由」記載 | soft |
| Q14 | screenshot 4 枚 | completeness | `ls <evidence_root>/screenshots/{public-members,login,me,admin}-staging.png \| wc -l` | `4` | hard |
| Q15 | G1〜G4 承認 timestamp 記録 | completeness | `<spec_root>/outputs/phase-13/main.md` に G1/G2/G3/G4 の user 発言 timestamp 4 件 | 4/4 件記録済 | hard |
| Q16 | 09c blocker 更新 | parity | `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md` に「09a-A 実測完了済 / 残課題: ...」セクション存在 | 存在 | hard |

> hard: 失敗時に Phase 13 PR 作成停止 / soft: 理由記録のうえ続行可

## 実行順序と blocking / non-blocking 区分

```
[order]                                [blocking?]
Q1  markdown lint                      blocking（Phase 11 evidence 取得前）
Q2  link check                         non-blocking（soft）
   --- Phase 11 evidence 取得後 ---
Q3  evidence presence                  blocking
Q4  placeholder 不在                   blocking
Q5  secret leak                        blocking
Q6  email / IP redaction               blocking
Q11 curl smoke status                  blocking
Q12 deploy version id                  blocking
Q14 screenshot 4 枚                    blocking
Q10 D1 migration parity                blocking
Q9  D1 schema parity                   blocking
Q7  reproducibility                    blocking
Q13 wrangler tail                      non-blocking（soft）
Q8  artifacts.json parity              blocking
Q15 G1〜G4 承認 timestamp              blocking
Q16 09c blocker 更新                   blocking（Phase 13 PR 直前）
```

## evidence schema validation

### `d1-schema-parity.json` schema 検証

```
jq -e '
  has("summary") and
  (.summary | has("diffCount")) and
  has("staging") and has("production") and
  (.staging | type == "object") and
  (.production | type == "object")
' <evidence_root>/d1/d1-schema-parity.json
```

`diffCount > 0` の場合は `productionMigrationTodo` フィールド（unassigned-task path 文字列）が必須。

### `sync-jobs-staging.json` schema 検証

```
jq -e 'type == "array" and (length > 0) and all(.[]; has("id") and has("status") and has("created_at"))' \
  <evidence_root>/forms/sync-jobs-staging.json
```

### `audit-log-staging.json` schema 検証

```
jq -e 'type == "array" and (length > 0) and all(.[]; has("action") and has("created_at"))' \
  <evidence_root>/forms/audit-log-staging.json
```

### `artifacts.json` ↔ `outputs/artifacts.json` parity（Q8 詳細）

```
diff \
  <(jq -S . docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json) \
  <(jq -S . docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/artifacts.json)
```

出力 0 行で PASS。差分があれば本 Phase で同期する（CONST_007 先送り禁止）。

## quality gate fail 時の差し戻し基準

| ゲート | 失敗時の分岐 | 自動修復可否 |
| --- | --- | --- |
| Q1 markdown lint | `--fix` を 1 回試行、残違反は手修正 | ◯（1 回） |
| Q2 link check | 一時的不達は理由記録で soft pass、恒久 dead link は本 Phase で修正 | × |
| Q3 evidence presence | 不足 evidence を Phase 11 で再取得（該当 G ゲートに戻す） | × |
| Q4 placeholder 不在 | placeholder 残存 evidence を該当 G ゲートで再取得 | × |
| Q5 / Q6 redaction | 該当 evidence を `bash scripts/lib/redaction.sh` で再処理し上書き保存。元差分は破棄 | × |
| Q7 reproducibility | コマンド転写漏れを `outputs/phase-11/main.md` に追記 | × |
| Q8 artifacts.json parity | `outputs/artifacts.json` を `artifacts.json` から再生成または手同期 | × |
| Q9 D1 schema parity | `diffCount > 0` のとき follow-up unassigned-task 起票で 09c へ移譲 | × |
| Q10 D1 migration parity | pending 残存時、G2 で apply 再実行または follow-up 起票 | × |
| Q11 curl status | api/web 伝播待ち（最大 60 秒）→ 再実行 1 回。なお NG なら G1 deploy log を確認 | △（再実行 1 回） |
| Q12 deploy version id | deploy log を G1 で再取得 | × |
| Q13 wrangler tail | 取得不能理由を log 1 行目に記載で soft pass | △ |
| Q14 screenshot 4 枚 | 不足分を Playwright 再実行で取得 | × |
| Q15 G1〜G4 timestamp | 漏れた gate を user に再承認要求し timestamp 取得 | × |
| Q16 09c blocker 更新 | Phase 13 PR 直前で必ず追加 | × |

> CONST_007: いずれの失敗も「Phase XX で対応」型の先送り禁止。本タスク内で **再取得 / follow-up 起票 / soft pass 理由記録** のいずれかに必ず収める。

## redaction 共通 snippet（spec phase-08 と整合）

```
| bash scripts/lib/redaction.sh
```

すべての `*.log` / `*.json` / `tail` 出力の保存前にこのパイプを通す（Phase 8 で grep 検証済）。

## 実行手順（本 Phase の作業）

1. Phase 11 evidence 取得後、Q3 〜 Q16 を順次実行。
2. Q1 / Q2 は Phase 11 evidence 取得**前**に markdown のみで実施可能なため先行実行する。
3. 各ゲート失敗時は上表「差し戻し基準」に従い分岐。
4. 全ゲート判定結果を `outputs/phase-09/main.md` に表形式で記録。
5. soft pass の場合は理由を本文に併記。

## 多角的チェック観点

- 13 evidence の completeness が機械的に検証される（Q3 / Q4）
- redaction が二重ガード（Q5 secret + Q6 email/IP）
- reproducibility がコマンド全文記録（Q7）で確保される
- parity が 3 観点（Q8 artifacts / Q9 D1 schema / Q10 D1 migration）で検証される
- production への mutation 系コマンドが evidence に残らない（Q5/Q11 と併せて確認）
- coverage 概念は本タスクで適用外（実コード変更なし。lint / typecheck / build は markdown lint と link check に置換）
- CONST_007: 失敗ゲートは本 Phase 内で必ず分岐先確定

## サブタスク管理

- [ ] Q1〜Q16 を実行順序に従い実施
- [ ] 失敗ゲートを「再取得 / follow-up 起票 / soft pass 理由記録」のいずれかに分岐
- [ ] schema validation（`d1-schema-parity.json` / `sync-jobs-staging.json` / `audit-log-staging.json`）を実行
- [ ] `artifacts.json` ↔ `outputs/artifacts.json` parity 同期
- [ ] `outputs/phase-09/main.md` を作成

## 成果物

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-09/main.md`
- 副次成果物として spec タスク側 evidence root に `qa-*.log` / `qa-*.diff` を追加（本タスクで生成）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 品質ゲート Q1〜Q16 がすべて PASS / SOFT-PASS / FAIL→分岐 のいずれかに判定されている
- hard ゲートはすべて PASS
- soft ゲートは PASS または理由記録による SOFT-PASS
- evidence schema validation がすべて exit 0
- `artifacts.json` ↔ `outputs/artifacts.json` parity が `diff` 0 行
- `outputs/phase-09/main.md` に判定結果が表形式で記録されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] coverage 概念が誤用されていない（本タスクでは markdown lint / link check / schema validation に置換していることを明記）
- [ ] CONST_007 違反（「Phase XX で QA」型の先送り）が無い
- [ ] secret / PII の plaintext を本仕様書に書いていない

## 次 Phase への引き渡し

Phase 10 へ:

- 品質ゲート Q1〜Q16 の判定結果
- soft pass / hard fail の境界（Q2 link / Q13 wrangler tail）
- 失敗時に「再取得 / follow-up 起票」のどちらに割り当てたかの一覧
- evidence schema validation 結果
- `artifacts.json` parity 確認状態

## 参照資料

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-09.md`（spec 正本品質ゲート）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-02.md`（evidence パス命名規則）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-08.md`
- `scripts/lib/redaction.sh` / `scripts/cf.sh`
- `CLAUDE.md`（branch protection / Cloudflare CLI / シークレット管理）
- GitHub Issue #494「必須証跡パス」表

## 実行タスク

- [ ] phase-09 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 統合テスト連携

Phase 9 は統合テストの品質ゲートを定義する。実行は Phase 11 で行い、staging API/Web deploy 後の Playwright smoke、D1 migrations/schema parity、Forms schema/responses sync、wrangler tail redaction check を対象にする。未実行の統合テストを PASS と書かず、runtime evidence 取得前は `PENDING_RUNTIME_EVIDENCE` として扱う。
