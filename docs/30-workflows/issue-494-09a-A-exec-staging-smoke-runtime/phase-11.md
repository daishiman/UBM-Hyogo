# Phase 11: 手動 smoke / 実測 evidence acquisition — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本 Phase は実 Cloudflare staging 環境への deploy・D1 migration apply・Forms API quota 消費・Workers tail 取得を伴い、repo にコミットされる runtime evidence artifact を 13 件以上生成する。CONST_004 により実 staging 副作用 + repo コミット成果物が成立 → 実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task id | UT-09A-A-EXEC-STAGING-SMOKE-001 |
| GitHub Issue | #494 |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| phase | 11 / 13 |
| wave | 9a-fu |
| mode | sequential（G1 → G2 → G3 → G4 の逐次実行）|
| 作成日 | 2026-05-06 |
| taskType | implementation-spec / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定実行者 | 人間オペレーター + Claude Code（G1-G4 user approval gate 併用）|

## 実行タスク

- [ ] G1-G4 user approval gate に従って runtime evidence を取得する
- [ ] 取得した証跡を `outputs/phase-11/evidence/` 配下に保存する
- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の placeholder を実測値に置換する
| 親 spec | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-11.md`（PR #493 で確定）|

## 目的

09a-A spec の Phase 11 evidence root を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態から脱出させ、実 staging runtime evidence を G1-G4 multi-stage approval gate のもと逐次取得する。本 Phase は親 spec の実行ランブックを Issue #494 のスコープに切り出した「執行 phase」であり、新規仕様の創出ではなく契約遵守の現場実行に専念する。

最終状態:

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/main.md` の `NOT_EXECUTED` placeholder が全置換され、13 evidence の hash / size / 取得時刻 / PASS-FAIL が埋まっている
- G1-G4 各 gate の user approval timestamp が `outputs/phase-13/main.md` に記録されている
- 09c blocker 文書が「09a-A 完了済 / 残課題: …」に更新されている
- `references/task-workflow-active.md` の 09a-A 行が `runtime_evidence_captured` に昇格している

## 事前準備チェックリスト（G1 直前まで）

- [ ] `git branch --show-current` が `feat/issue-494-09a-A-exec-staging-smoke-runtime`（または `feat/issue-494-09a-A-exec-staging-smoke-runtime` 互換ブランチ）であること
- [ ] `mise exec -- node -v` が `v24.15.0` であること
- [ ] `bash scripts/cf.sh whoami` が成功し Account ID を返すこと（出力を `$EVID/preflight/cf-whoami.log` に保存。値そのものはトークンを含まないので保存可）
- [ ] `op signin` 済みかつ `op run --env-file=.env -- env | grep -c CLOUDFLARE_API_TOKEN` が `1` を返すこと（**値は表示・記録しない**）
- [ ] `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` で旧 version ID を控える（rollback 用、`outputs/phase-11/main.md` の rollback セクションに記録）
- [ ] `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging` で旧 version ID を控える
- [ ] evidence ディレクトリ作成: `EVID=docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence; mkdir -p $EVID/{preflight,deploy,curl,screenshots,playwright,forms,d1,wrangler-tail}`
- [ ] 親 spec phase-11.md / phase-12.md を当日中に再読し、契約変更が無いこと

> 本 Phase 仕様書は親 spec を **正本** とし、本ファイルでは Issue #494 固有の運用記述（gate 制約・redaction policy・evidence schema・運用上の禁則）に集約する。コマンド詳細は親 spec phase-11.md の「13 evidence 一覧」「実行手順」「wrangler tail capture」を参照する。

## G1-G4 multi-stage approval gate — 逐次実行手順

### 共通ルール（spec 由来・本 Phase で再掲）

- **合算承認禁止**: 「G1〜G4 まとめて approve」「進めて」等の包括承認は spec 違反。各 gate 直前で対象操作・影響範囲・rollback 手段を提示し、独立承認を得たうえでのみ次に進む
- **逆順実行禁止**: G4 commit を G1 deploy より先に行う等は禁止
- **production 拡張時は追加承認必須**: staging スコープを越えて production を触る場合（例: prod の `bash scripts/cf.sh d1 export`）は新たな approval を取得し、`outputs/phase-13/main.md` に独立行で記録
- **承認文字列**: `approve G1` / `approve G2` / `approve G3` / `approve G4`（または同等明示文字列）。曖昧な肯定（「OK」「いいよ」のみ）は再確認する
- **失敗時は次 gate に進まない**: 例えば G1 deploy が fail した場合は rollback evidence を保存後、G2 へ進まず本 Phase をその時点で止め、`outputs/phase-11/main.md` notes に状況を記録

### G1: api / web staging deploy

**対象操作**:
```
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging | tee $EVID/deploy/deploy-api-staging.log
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging | tee $EVID/deploy/deploy-web-staging.log
```

**影響範囲**: `ubm-hyogo-api-staging` / `ubm-hyogo-web-staging` Workers の version 切替。staging 公開 URL の挙動が即時切替される。production には影響しない。

**rollback**:
```
bash scripts/cf.sh rollback <旧API_VERSION_ID> --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh rollback <旧WEB_VERSION_ID> --config apps/web/wrangler.toml --env staging
```

**承認プロンプトテンプレ**:
```
[G1: STAGING DEPLOY APPROVAL]
予定コマンド: <上記 deploy 2 行>
影響範囲: ubm-hyogo-{api,web}-staging Worker version 切替
旧 version ID: api=<...> / web=<...>
失敗時 rollback: <上記 rollback>
承認後の作業: deploy log + version id を $EVID/deploy/ に保存
"approve G1" と返信してください。
```

**事後検証**:
- `grep -E 'Deployed|Current Version ID' $EVID/deploy/deploy-api-staging.log` が version ID を含む 1 行以上を返す
- web も同様

### G2: D1 staging migration apply（pending がある場合のみ）

**事前 list**（承認不要・read-only）:
```
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging | tee $EVID/d1/d1-migrations-staging.log
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production | tee $EVID/d1/d1-migrations-prod.log
```

**pending 行 0 件の場合**: G2 は **skip** する。`outputs/phase-11/main.md` の G2 行に `SKIPPED (pending=0)` を記録し G3 へ進む。

**pending 行 ≥ 1 の場合のみ承認取得**:

**対象操作**:
```
bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output $EVID/d1/backup-pre-migrate.sql
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

**影響範囲**: staging D1 schema 変更（CLI rollback なし）

**rollback**: `backup-pre-migrate.sql` を別の D1 instance に restore し手動同期、または `unassigned-task` 起票（自動 rollback 不可のため事前 export を rollback 手段として位置付ける）

**承認プロンプトテンプレ**:
```
[G2: D1 MIGRATION APPLY APPROVAL]
対象 DB: ubm-hyogo-db-staging
pending 件数: <N>（d1-migrations-staging.log 参照）
事前 export 完了: $EVID/d1/backup-pre-migrate.sql (size=<bytes>)
予定コマンド: bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
影響: D1 schema 変更（rollback CLI なし）
"approve G2" と返信してください。
```

**事後検証**:
- 再度 `migrations list` で `pending=0` を確認し log 末尾に追記
- D1 schema parity スクリプト（親 spec Phase 2）を実行して `$EVID/d1/d1-schema-parity.json` 生成

### G3: Forms sync（schema → responses 順）

**対象操作**: api admin endpoint `/admin/forms/sync/schema` → `/admin/forms/sync/responses` を curl で順次叩く（admin session cookie 付与）。レスポンスを tee で `$EVID/forms/forms-schema-sync.log` / `forms-responses-sync.log` に保存。

**影響範囲**: Google Forms API quota 消費（1 サイクル）/ D1 `sync_jobs` テーブルに行追加 / `audit_log` 追記

**承認プロンプトテンプレ**:
```
[G3: FORMS SYNC APPROVAL]
影響: Google Forms API quota を 1 サイクル消費 / sync_jobs / audit_log に行追加
予定: schema sync → responses sync の順に各 1 回実行
失敗時: 翌日リトライ TODO を outputs/phase-11/main.md に記録
"approve G3" と返信してください。
```

**事後 dump**（承認不要・read-only）:
```
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
  --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20" \
  > $EVID/forms/sync-jobs-staging.json
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json \
  --command "SELECT * FROM audit_log ORDER BY id DESC LIMIT 50" \
  > $EVID/forms/audit-log-staging.json
```

### Visual smoke + wrangler tail（G3 後・G4 前に実行）

#### Playwright UI smoke（4 screenshots）

```
pnpm --filter web exec playwright test --config=playwright.staging.config.ts \
  --reporter=html,list --output=$EVID/playwright
```

**screenshots 命名規則**:
- `$EVID/screenshots/public-members-staging.png`
- `$EVID/screenshots/login-staging.png`
- `$EVID/screenshots/me-staging.png`
- `$EVID/screenshots/admin-staging.png`

PII 混入時の対応は親 spec phase-11.md 手順 6 に従う（fixture アカウント切替 / `mask:` / 再撮影で置換）。

#### wrangler tail（30 分相当 redacted log）

親 spec phase-11.md「wrangler tail capture」セクションのコマンド + redact パイプ をそのまま使用。出力先は `$EVID/wrangler-tail/api-30min.log`。取得不能時は同 spec の理由記録テンプレ（reason / attempted-command / exit-code / stderr-excerpt / fallback-attempted / follow-up-task）を 1 行目に記載。

### G4: 09c blocker 更新コミット & PR 作成

**対象操作**: 以下 5 系統を順に commit（個別 commit またはまとめ commit のいずれかは G4 承認時に明示し承認を得る）:

1. evidence ファイル群（`$EVID/` 配下 13 件）
2. `outputs/phase-11/main.md` の `NOT_EXECUTED` 全置換
3. `outputs/phase-12/implementation-guide.md` の runtime status を実測結果へ昇格
4. `artifacts.json` ↔ `outputs/artifacts.json` parity 維持（evidence 配列長 = 13）
5. `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md` blocker 状態更新 + `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` 09a-A 行を `runtime_evidence_captured` に昇格

**承認プロンプトテンプレ**:
```
[G4: BLOCKER UPDATE COMMIT & PR APPROVAL]
更新対象（git diff --stat 提示）:
  <提示>
予定 commit 単位: <1 commit / 5 commit 等を明示>
予定 PR タイトル: feat(09a-A): staging deploy smoke 実測 evidence 13 件取得 + 09c blocker 更新
"approve G4" と返信してください。
```

**事後**:
- `gh pr create` 実行 → PR URL を `outputs/phase-13/main.md` に記録
- `gh pr checks <N> --watch` で CI gate 待機

## 対象操作 / 影響範囲 / rollback 提示テンプレ（共通）

各 gate 直前で必ず以下 5 行を Claude Code が user に提示してから停止する:

```
[G<N>: <GATE_NAME> APPROVAL]
予定コマンド: <実行する全コマンドを 1 字単位で正確に>
影響範囲: <staging のどのリソースに何が起きるか / production 影響の有無>
旧状態（rollback 用）: <version id / D1 export path / 直前 commit SHA 等>
失敗時 rollback: <具体コマンド or 手動手順>
承認語: "approve G<N>"
```

## redaction policy（secret 値・PII 置換ルール）

evidence 保存・log tee 時に必ず適用する sed パイプ（親 spec と同一・本ファイルで再掲）:

```
sed -E \
  -e 's/(Authorization: )[^[:space:]]+/\1[REDACTED]/g' \
  -e 's/([Cc]ookie: )[^[:space:]]+/\1[REDACTED]/g' \
  -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[REDACTED_EMAIL]/g' \
  -e 's/(token=|Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/g' \
  -e 's/([0-9]{1,3}\.){3}[0-9]{1,3}/[REDACTED_IP]/g'
```

**追加禁則**:
- `.env` 実値・`op://` 解決後の token 値・Cloudflare Account ID 以外の secret は evidence・PR 本文・コミットメッセージ・本 Phase 提出物のいかなる場所にも書かない
- 実会員氏名 / 実会員メール / 電話番号 / 住所が screenshot に映る場合は撮り直し（`manjumoto.daishi@senpai-lab.com` / `manju.manju.03.28@gmail.com` の test fixture を使用）
- 取得後 grep 検証: `grep -RE '(Bearer |Authorization: [A-Za-z0-9])' $EVID` が 0 件、`grep -RE '[A-Za-z0-9._%+-]+@(?!senpai-lab\.com|gmail\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}' $EVID` が 0 件であることを最終確認

## evidence schema

### `d1-schema-parity.json` の JSON 構造例

```
{
  "comparedAt": "2026-05-06T12:34:56Z",
  "stagingDb": "ubm-hyogo-db-staging",
  "productionDb": "ubm-hyogo-db-prod",
  "tables": [
    {
      "name": "members",
      "stagingColumns": [{"name": "id", "type": "TEXT", "notnull": 1, "pk": 1}, ...],
      "productionColumns": [{"name": "id", "type": "TEXT", "notnull": 1, "pk": 1}, ...],
      "diff": []
    }
  ],
  "diffCount": 0,
  "stagingOnlyTables": [],
  "productionOnlyTables": []
}
```

`diffCount > 0` の場合、`unassigned-task/task-09a-d1-schema-parity-followup-001.md` を新規起票し、本 PR には起票ファイルへのリンクを含める。

### `outputs/phase-11/main.md` の最終構成（4 必須セクション）

1. status: `pending → executed`（タイムスタンプ付）
2. evidence 一覧表（13 行 × `path` / `hash(sha256)` / `size_bytes` / `acquired_at_utc` / `result(PASS|FAIL|N/A)` / `notes`）
3. approval gate 取得記録表（G1〜G4 × `approved_at` / `approved_by` / `command_executed` / `evidence_paths`）
4. 親タスクへの引き渡し（09c blocker 更新差分の reference / 新規起票した unassigned-task のパス一覧）

## 完了条件チェックリスト（Issue #494 本文 13 項目を再掲）

- [ ] Cloudflare auth: `bash scripts/cf.sh whoami` PASS evidence が `$EVID/preflight/cf-whoami.log` に保存
- [ ] D1 migration list（staging / prod）と schema parity evidence が保存
- [ ] G1 deploy 完了: API/Web Worker version id が deploy log に記録
- [ ] G2 D1 apply 完了 or pending=0 skip 理由が `outputs/phase-11/main.md` に記録
- [ ] G3 Forms sync 完了: `sync_jobs` / `audit_log` dump 保存
- [ ] Playwright report + 4 staging screenshots 保存
- [ ] `wrangler-tail/api-30min.log` 取得 または取得不能理由テンプレ保存
- [ ] secret 値・PII の redaction 確認 grep が 0 件
- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` の `NOT_EXECUTED` 全置換
- [ ] `artifacts.json` ↔ `outputs/artifacts.json` parity（evidence 配列長 = 13）
- [ ] `references/task-workflow-active.md` 09a-A 行 `runtime_evidence_captured` 昇格
- [ ] 09c blocker 状態を実測結果で更新
- [ ] G4 PR 作成完了

## 多角的チェック観点

- 包括承認（「全部進めて」等）で複数 gate を一気に実行していない
- 逆順実行（G4 commit を先に行う等）が発生していない
- production 拡張時に追加承認を取得した記録が残っている
- secret / PII が evidence へ混入していない（grep 確認済）
- `NOT_EXECUTED` が本タスク outputs/ から完全消滅している
- D1 schema parity `diffCount = 0` または production 側 migration TODO 起票済み

## 失敗時運用

| 事象 | 対応 | 記録先 |
| --- | --- | --- |
| G1 deploy 失敗 | rollback コマンド実行 → log 保存 → 本 Phase 停止（G2 へ進まない） | `outputs/phase-11/main.md` notes |
| G2 D1 apply 失敗 | export backup 参照だけ記録 → `unassigned-task/task-09a-d1-apply-failure-XXX.md` 新規起票 | 同上 |
| G3 Forms quota 枯渇 | 翌日リトライ TODO を `outputs/phase-11/main.md` に明記 → 翌日再実行（先送り扱いせず本 Phase 内完了） | 同上 |
| Playwright flaky | 最大 2 回再実行 → 3 回目 fail は trace 保存 + fail 理由記録 | 同上 |
| screenshot に PII | 即再撮影 + masked 前ファイル不コミット | 同上 |
| wrangler tail 取得不能 | 親 spec の理由記録テンプレを 1 行目に保存 | `wrangler-tail/api-30min.log` |

## 統合テスト連携

- 上流: PR #493 (09a-A spec 確定) / 08a coverage gate / Cloudflare staging secrets 整備
- 下流: 09c production deploy execution（本 Phase 生成 evidence path をそのまま 09c 入力に渡す）

## サブタスク管理

- [ ] 事前準備チェックリスト 8 項目を完了
- [ ] G1〜G4 approval gate を独立に取得し timestamp を記録
- [ ] 13 evidence をすべて保存
- [ ] `outputs/phase-11/main.md` 4 セクションを更新
- [ ] redaction grep 0 件確認
- [ ] 包括承認・逆順実行が発生していないことを `outputs/phase-13/main.md` で自己監査

## 成果物

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/` 配下 13 件
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/main.md` 更新版
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/main.md`（本タスク側ログ）

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み
- 上記「完了条件チェックリスト」13 項目すべてが満たされている
- approval gate G1〜G4 の取得記録が `outputs/phase-13/main.md` に独立行で記録されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で commit / push / PR を実行していない（G4 承認後 Phase 13 で実施）
- [ ] CONST_007 違反（先送り）が発生していない

## 次 Phase への引き渡し

Phase 12 へ:
- 13 evidence の hash / size / 結果サマリ
- 起票した unassigned-task のパス一覧
- 09c blocker 更新の素案（実測値置換版）
- G1-G4 timestamp ログ（Phase 13 PR 本文用）

## 参照資料

- 親 spec: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-11.md`
- 親 spec phase-12.md / phase-13.md
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- GitHub Issue #494
- spec 確定 PR: #493
