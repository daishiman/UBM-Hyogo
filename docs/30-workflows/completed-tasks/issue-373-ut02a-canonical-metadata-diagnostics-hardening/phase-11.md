# Phase 11: 手動 / 自動 evidence 取得（NON_VISUAL 縮約テンプレ） — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本タスクは `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` の API 内部実装タスク（CI gate 1 つ追加 / scripts 2 本 / contract test 1 本 / manifest schema 拡張 / 構造化ログ追加）であり、UI 副作用も staging/production への runtime mutation も伴わない。Phase 11 では実コマンド出力を evidence として取得し commit するため CONST_004 区分で実装仕様書扱い。screenshot は **作らない**（false green 防止）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| phase | 11 / 13 |
| 目的 | NON_VISUAL evidence（verify ログ / determinism ログ / contract test ログ / diagnostics sample / typecheck / lint / test ログ）を取得し repo に保存する |
| 依存 phase | 10（最終レビュー GO） |
| 成果物 | `outputs/phase-11/main.md` + `evidence/` 配下 7 ファイル + `manual-smoke-log.md` + `link-checklist.md` |
| user_approval_required | false |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 10 GO 後に NON_VISUAL evidence 7 ファイルを取得し、API 内部実装の verify / determinism / diagnostics / contract test / typecheck / lint / test 結果を保存する。

## 実行タスク

- evidence ディレクトリを作成し、7 ファイルの命名を artifacts.json と一致させる
- verify / regenerate / diagnostics sample / contract test / typecheck / lint / test を実行する
- `manual-smoke-log.md` と `link-checklist.md` に NON_VISUAL の代替 evidence 境界を記録する

## 発火条件の機械判定

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/artifacts.json
# => NON_VISUAL → 本縮約テンプレを適用
```

## テスト方式の宣言

- 方式: **NON_VISUAL / API 内部実装 evidence**
- screenshot 作成: **禁止**（API 内部ロジック / CI gate / contract test のみで UI 変更なし）
- 主証跡: vitest 件数（`pnpm --filter @ubm/api test apps/api/src/repository/_shared` の PASS 件数）+ verify-static-manifest exit code + regenerate determinism diff 0 byte
- redaction: **不要**（manifest / diagnostics は schema label / stableKey のみで PII を含まない。Phase 1 / Phase 3 で確認済）
- 状態語彙: 取得完了時は `PASS`（runtime 副作用のない API 内部タスクのため `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は使わない）

## evidence 取得項目

`$EVID = docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-11/evidence/`

| # | ファイル | 取得コマンド | 期待結果 / フォーマット |
| --- | --- | --- | --- |
| 1 | `$EVID/verify-static-manifest.log` | `pnpm verify:static-manifest` | 末尾に `[verify-static-manifest] OK` + exit 0 |
| 2 | `$EVID/regenerate-determinism.log` | 下記「determinism 取得手順」参照 | 2 連続 regenerate 後の `diff` 出力 0 行 + exit 0 |
| 3 | `$EVID/builder-diagnostics-sample.json` | 下記「diagnostics sample 生成手順」参照 | logger spy 経由で取得した `{"code":"UBM-MANIFEST-UNKNOWN-KEY", "count": <n>, "keys":[...], "level":"warn"}` 形式 1 件以上 |
| 4 | `$EVID/test-results.log` | `pnpm vitest run apps/api/src/repository/_shared/metadata.test.ts apps/api/src/repository/_shared/builder.test.ts apps/api/src/repository/_shared/__tests__/static-manifest.verify.test.ts apps/api/src/repository/_shared/__tests__/builder.diagnostics.test.ts apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` | focused 5 files / 32 tests PASS |
| 5 | workspace typecheck | `pnpm typecheck` | exit 0 |

## determinism 取得手順（evidence #2）

```bash
# 1. 1 回目の regenerate 結果を退避
mise exec -- pnpm regenerate:static-manifest
cp apps/api/src/repository/_shared/generated/static-manifest.json /tmp/m1.json

# 2. 2 回目の regenerate
mise exec -- pnpm regenerate:static-manifest

# 3. 2 回連続の出力を比較
{
  echo "# regenerate-static-manifest determinism check"
  echo "## diff /tmp/m1.json apps/api/.../static-manifest.json"
  diff /tmp/m1.json apps/api/src/repository/_shared/generated/static-manifest.json
  echo "## exit_code=$?"
  echo "## git diff --exit-code"
  git diff --exit-code apps/api/src/repository/_shared/generated/static-manifest.json
  echo "## exit_code=$?"
} > $EVID/regenerate-determinism.log
```

期待結果: `diff` 出力 0 行 + `git diff --exit-code` exit 0。

## diagnostics sample 生成手順（evidence #3）

`buildSectionsWithDiagnostics()` に **意図的に unknown stable key を発生させる** ため、Phase 5 で配置した diagnostics sample 生成テスト（`builder.test.ts` 内の専用 it ブロック）を経由して logger spy に流れた warn payload を JSON ファイルに書き出す。

```bash
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared/builder.test.ts \
  -t "logWarn UBM-MANIFEST-UNKNOWN-KEY" \
  --reporter=verbose \
  > /tmp/builder-diag.log

# テスト内で sample payload を fs.writeFileSync で出力する設計に従い、
# 出力先（テストで指定した path）から evidence directory にコピー
cp apps/api/src/repository/_shared/__fixtures__/diagnostics-sample.json $EVID/builder-diagnostics-sample.json
```

> 上記 fixture path はあくまで参考。Phase 5 ランブックで確定した sample 出力経路に従う。fixture path 不整合時は Phase 5 の出力経路定義に戻して修正する（CONST_007 先送り禁止）。

期待結果: `$EVID/builder-diagnostics-sample.json` が次の shape を持つ:

```json
{
  "code": "UBM-MANIFEST-UNKNOWN-KEY",
  "level": "warn",
  "count": 1,
  "keys": ["<unknownStableKey>"],
  "context": "buildSectionsWithDiagnostics"
}
```

## evidence collection 手順（実行順序）

```
1. cd <repo root>（worktree ルート）
2. mkdir -p $EVID
3. workspace typecheck → pnpm typecheck
4. evidence #1 verify-static-manifest.log → pnpm verify:static-manifest
6. evidence #2 regenerate-determinism.log → 上記 determinism 取得手順
7. evidence #4 test-results.log → focused _shared tests
8. evidence #3 builder-diagnostics-sample.json → 上記 diagnostics sample 生成手順
9. evidence #4 test-results.log → _shared focused 全テスト
10. ls -la $EVID で 7 ファイルの存在 + size > 0 を確認
```

## redaction 確認

本タスクは PII / secret を含まないため redaction パイプ不要。ただし念のため次を実行する:

```bash
grep -rEn 'Bearer|sk-|API_KEY=|password=|access_token=|refresh_token=' $EVID || echo "REDACTION_OK: 0 hit"
grep -rEn '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' $EVID || echo "REDACTION_OK: 0 hit"
```

両 grep が `REDACTION_OK: 0 hit` を出力すれば PASS。

## 必須 outputs（NON_VISUAL 縮約テンプレ）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index。テスト方式 NON_VISUAL 宣言 / 7 evidence path 一覧 / 状態語彙 PASS / 取得日時 / 取得者（worktree branch 名）|
| `outputs/phase-11/manual-smoke-log.md` | 上記 evidence #1〜#7 の「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル + screenshot を作らない理由（NON_VISUAL）|
| `outputs/phase-11/link-checklist.md` | 仕様書 → 実装ファイル / fake fixture / contract test / CI workflow への参照リンクが OK / Broken のチェック表 |
| `outputs/phase-11/evidence/` 配下 7 ファイル | 上表 #1〜#7 |

## `outputs/phase-11/main.md` 必須記載

- 状態語彙: `PASS`（runtime 副作用なし・boundary suffix 不要の根拠を本文に明記）
- 7 evidence path とそれぞれの判定（PASS / SOFT-PASS）
- redaction 確認結果（REDACTION_OK 2 hit）
- screenshot を作らない理由: `NON_VISUAL`（API 内部実装タスク）
- 取得実行日時 + worktree branch 名

## `outputs/phase-11/manual-smoke-log.md` 最小フォーマット

```markdown
# Manual Smoke Log — issue-373-ut02a-canonical-metadata-diagnostics-hardening

## 主証跡
- vitest 件数: <PASS_COUNT>/<TOTAL_COUNT>（apps/api/_shared）
- verify-static-manifest exit: 0
- regenerate determinism diff: 0 byte
- screenshot: 不作成（理由: NON_VISUAL）

## 実行記録

| # | 実行コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | mise exec -- pnpm verify:static-manifest | exit 0 / "OK: ..." | exit 0 / message OK | PASS |
| 2 | regenerate ×2 + diff | diff 0 行 / git diff --exit-code 0 | 0 / 0 | PASS |
| 3 | mise exec -- pnpm --filter @ubm/api test … contract.test.ts | 全 case PASS | <n>/<n> PASS | PASS |
| 4 | mise exec -- pnpm typecheck | exit 0 | exit 0 | PASS |
| 5 | mise exec -- pnpm lint | exit 0 | exit 0 | PASS |
| 6 | mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared | 全 case PASS | <n>/<n> PASS | PASS |
| 7 | builder.test.ts -t "logWarn UBM-MANIFEST-UNKNOWN-KEY" | spy 1 回以上呼び出し | <m> 回 | PASS |

## redaction
- secret grep: 0 hit
- email grep: 0 hit

## 取得情報
- worktree: <branch>
- acquired_at: <ISO8601>
```

## `outputs/phase-11/link-checklist.md` 最小項目

- spec phase-09 / phase-10 → `outputs/phase-09/main.md` / `phase-10/main.md` の存在
- spec → 実装ファイル（`scripts/verify-static-manifest.mjs` / `scripts/regenerate-static-manifest.mjs` / `apps/api/src/repository/_shared/generated/static-manifest.json` / `apps/api/src/repository/_shared/builder.ts` / `apps/api/src/repository/_shared/metadata.ts`）への参照
- spec → contract test（`alias-queue-adapter.contract.test.ts`）への参照
- spec → CI workflow（`.github/workflows/ci.yml` の `verify-static-manifest` job）への参照
- spec → `docs/00-getting-started-manual/specs/01-api-schema.md` retirement 節への anchor 参照
- 全項目 OK / Broken の表で記録

## 多角的チェック観点

- 7 evidence のすべてが size > 0 で取得済（completeness）
- redaction 不要を明記しつつ念のため grep 0 hit を確認（false negative 防止）
- vitest 件数・verify exit code・determinism diff が `manual-smoke-log.md` に主証跡として記録される（reproducibility）
- screenshot を作らない理由（NON_VISUAL）が `main.md` / `manual-smoke-log.md` に明記される（false green 防止）
- contract test が D 観点（future-proof）の Phase 10 判定と整合する 4 ケース構成で取得されている
- diagnostics sample が JSON shape で fixed schema を持つ（後続 Phase 12 implementation-guide で参照可能）
- CONST_007: 失敗時は `manual-smoke-log.md` の判定列を FAIL とし、Phase 5/9 に戻して再取得する（先送り禁止）

## サブタスク管理

- [ ] `mkdir -p $EVID` を実行
- [ ] evidence #1〜#7 を実行順序で取得
- [ ] redaction 確認 grep を実行（0 hit）
- [ ] `outputs/phase-11/main.md` を作成（PASS 状態語彙 + 7 evidence path + 取得日時）
- [ ] `outputs/phase-11/manual-smoke-log.md` を作成（最小フォーマットテーブル）
- [ ] `outputs/phase-11/link-checklist.md` を作成（仕様 → 実装の OK/Broken 表）
- [ ] artifacts.json `phases.phase-11.outputs` の 7 path（verify-output / regenerate-determinism / builder-diagnostics-sample / alias-queue-contract / typecheck / lint / test）と本 Phase で取得した evidence 名が一致している

## 成果物

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/evidence/{verify-static-manifest.log, regenerate-determinism.log, test-results.log}`

## 完了条件 / DoD

- [ ] 上記 7 evidence ファイルが存在し size > 0
- [ ] `manual-smoke-log.md` の判定列が全 PASS（hard 失敗時は Phase 5/9 戻し）
- [ ] `link-checklist.md` の OK/Broken 列が Broken 0 件
- [ ] redaction grep 2 種が 0 hit
- [ ] `outputs/phase-11/main.md` の状態語彙が `PASS`（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` ではなく素直な PASS で close）
- [ ] screenshot ファイル 0 件（NON_VISUAL false green 防止）

## タスク 100% 実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007 違反（「Phase 12 で取得」型の先送り）がない
- [ ] secret / PII の plaintext を本仕様書に書いていない
- [ ] screenshot を作っていない（NON_VISUAL 違反防止）

## 次 Phase（Phase 12 ドキュメント更新）への引き継ぎ事項

- 7 evidence path 一覧（artifacts.json `phase-11.outputs` 同期対象）
- 状態語彙 `PASS`（Phase 12 の `task-workflow-active.md` 更新では `implemented-local` / Phase 13 user approval 境界を維持し、commit / push / PR 未実行のまま `completed` へ昇格しない）
- diagnostics sample JSON の shape（implementation-guide Part 2 で技術者向けに記載）
- contract test 4 ケース ID（implementation-guide Part 2 + skill-feedback-report の参照対象）
- `01-api-schema.md` retirement 節 anchor（Phase 12 system-spec-update-summary で diff stat の対象）

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-09.md` / `phase-10.md`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `generated/static-manifest.json`
- `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`
- `scripts/verify-static-manifest.mjs` / `scripts/regenerate-static-manifest.mjs`
- `.github/workflows/ci.yml`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（NON_VISUAL 縮約テンプレ）
- `CLAUDE.md`（mise exec / pnpm workspace）
