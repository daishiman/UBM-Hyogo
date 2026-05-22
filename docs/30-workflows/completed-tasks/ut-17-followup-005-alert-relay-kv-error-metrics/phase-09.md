# Phase 9: 受入確認（AC-1〜AC-10 検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| タスクID | ut-17-followup-005-alert-relay-kv-error-metrics |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 受入確認 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | index.md AC-1〜AC-10 を local 環境で機械的に検証する Phase。production deploy / staging 実機発火は本サイクル外（user-gated）であり、本 Phase は **local code + test + grep + docs 整合** のみで AC 充足を判定する。 |

---

## 目的

index.md で定義した AC-1〜AC-10 すべてに対し、**機械的に検証可能な手順**を提示し、
実測値を `outputs/phase-09/acceptance.md` に記録する。
production deploy / staging 実機 emit 確認は本サイクル外（user-gated）のため、
本 Phase の受入は **local 完結する範囲** に閉じる。

---

## 9-1. 受入対象 Acceptance Criteria（AC）

| AC ID | 内容 | 検証手段 |
| --- | --- | --- |
| AC-1 | `alert-relay.ts` module top に `const isolateId = crypto.randomUUID();` が 1 回採番 | grep / 行数確認 |
| AC-2 | 同ファイル top-level に private helper `logKvOperationError` が定義され外部 export されていない | grep + import 解析 |
| AC-3 | 固定 schema `{ event, op, errorClass, dedupeKeyHash, isolateId, ts }` で JSON 1 行 emit | vitest payload assertion |
| AC-4 | `dedupeKeyHash` が SHA-256 first 12 hex chars（lowercase）で同一 key に対し再現 | vitest |
| AC-5 | `KV.get` が try/catch で囲まれ catch 内で helper 呼出 + fail-open 継続 | grep + vitest |
| AC-6 | `KV.put` 既存 catch が helper 呼出に置換され、`dedupPersisted: false` 挙動不変 | grep + vitest |
| AC-7 | spec.ts に 4 ケース追加（get throw / put throw / 成功 0 回 emit） | vitest 実行 |
| AC-8 | runbook に「KV 操作エラーログの確認」セクション + grep 例 + しきい値 + schema 表 | grep + 目視 |
| AC-9 | typecheck / lint / test 全 PASS | コマンド実行 |
| AC-10 | 既存 behaviour change なし（`get` の fail-open 化のみ意図的変更） | 既存 vitest PASS |

---

## 9-2. 着手前提チェックリスト

| # | 確認項目 | 確認方法 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Phase 1〜8 が全 completed | `artifacts.json` 確認 | phase-01〜08 が completed | [ ] |
| 2 | `apps/api/src/routes/internal/alert-relay.ts` への実装差分が存在 | `git diff dev -- apps/api/src/routes/internal/alert-relay.ts` | 差分あり | [ ] |
| 3 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への差分が存在 | `git diff dev -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 差分あり | [ ] |
| 4 | runbook 差分が存在 | `git diff dev -- docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 差分あり | [ ] |
| 5 | feature ブランチが dev 起点 | `git log --oneline dev..HEAD` | dev 起点で commit 列が確認可 | [ ] |

> 全項目 [x] になるまで受入検証を開始しない。

---

## 9-3. AC 別検証手順

### AC-1: `isolateId` module top 1 回採番

```bash
grep -nE "const isolateId\s*=\s*crypto\.randomUUID\(\)" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-01-isolate-id.txt
```

期待:
- hit 1 行のみ
- 行番号が handler 関数定義より前（module top 位置）
- 関数内で再採番されていない（`function` キーワード行より小さい行番号）

判定: hit 数 = 1 かつ handler 関数より前であれば PASS

### AC-2: `logKvOperationError` private helper 定義 + 非 export

```bash
# 定義の存在
grep -nE "async function logKvOperationError\(" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-02-helper-def.txt

# export されていないことの確認
grep -nE "export.*logKvOperationError" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-02-no-export.txt

# 外部からの import が無いこと
grep -rn "logKvOperationError" apps/api/src \
  | grep -v "apps/api/src/routes/internal/alert-relay.ts" \
  | grep -v "apps/api/src/routes/internal/__tests__/alert-relay.spec.ts" \
  | tee outputs/phase-09/ac-02-no-external-import.txt
```

期待:
- 定義: hit 1 行
- export: hit 0 行
- 外部 import: hit 0 行（spec.ts と alert-relay.ts 自身を除く）

### AC-3: 固定 schema JSON 1 行 emit

```bash
# helper 内で 6 field 全てが現れるか
grep -nE "event|op|errorClass|dedupeKeyHash|isolateId|ts" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-03-schema-fields.txt

# event literal の固定値
grep -nE '"alert_relay_kv_op_failed"' \
  apps/api/src/routes/internal/alert-relay.ts

# console.warn(JSON.stringify(...)) パターン
grep -nE "console\.warn\(JSON\.stringify\(" \
  apps/api/src/routes/internal/alert-relay.ts
```

vitest 側 assertion で payload shape を確認:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
```

期待: payload に 6 field が含まれる assertion が PASS

### AC-4: `dedupeKeyHash` の再現性

vitest 内で同一 dedupeKey を 2 回投入し hash 一致を確認するケースが存在することを grep:

```bash
grep -nE "dedupeKeyHash|SHA-256|sha-256" \
  apps/api/src/routes/internal/__tests__/alert-relay.spec.ts \
  | tee outputs/phase-09/ac-04-hash-test.txt
```

期待:
- hash 計算ロジックを検証するテストケース有り
- 12 hex chars（lowercase）の正規表現 `/^[0-9a-f]{12}$/` 相当 assertion 有り

### AC-5: `KV.get` try/catch + fail-open

```bash
# get 周辺の try/catch 構造
grep -nB 2 -A 8 "ALERT_DEDUP_KV\.get\(" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-05-get-trycatch.txt
```

期待:
- `try { ... await env.ALERT_DEDUP_KV.get(dedupeKey) ... } catch (...) { await logKvOperationError('get', ...) ... }` 構造
- catch 後の処理が `seen = null` 相当（dedup skip して通常配信継続）

### AC-6: `KV.put` 既存 catch 置換 + 挙動不変

```bash
grep -nB 2 -A 8 "ALERT_DEDUP_KV\.put\(" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-06-put-catch.txt

# dedupPersisted: false の挙動が維持されているか
grep -nE "dedupPersisted" apps/api/src/routes/internal/alert-relay.ts
```

期待:
- `put` の catch 内で `logKvOperationError('put', ...)` 呼出
- catch 内・catch 後の `dedupPersisted: false` レスポンス挙動が不変

### AC-7: spec.ts に 4 ケース追加

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  apps/api/src/routes/internal/__tests__/alert-relay.spec.ts \
  2>&1 | tee outputs/phase-09/ac-07-spec-run.txt

# テスト名の存在確認
grep -nE "KV\.get throw|KV\.put throw|dedupeKeyHash|成功パス|warn 0 回|emit されない" \
  apps/api/src/routes/internal/__tests__/alert-relay.spec.ts \
  | tee outputs/phase-09/ac-07-test-names.txt
```

期待:
- 4 ケース（get throw / dedupeKeyHash 再現性 / put throw / 成功時 warn 0 回）が PASS
- `vi.restoreAllMocks()` が `afterEach` に存在（spy leak 防止）

```bash
grep -nE "afterEach.*restoreAllMocks|vi\.restoreAllMocks" \
  apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
```

### AC-8: runbook 追記内容の整合

```bash
# セクション存在
grep -nE "KV 操作エラーログの確認|Step 4c" \
  docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md \
  | tee outputs/phase-09/ac-08-runbook-section.txt

# grep コマンド例
grep -nE "scripts/cf\.sh tail.*alert_relay_kv_op_failed" \
  docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md

# しきい値「直近 1 時間 10 件超」
grep -nE "1 時間.*10 件|10 件.*1 時間" \
  docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md

# schema 表（6 field 全て登場）
for f in event op errorClass dedupeKeyHash isolateId ts; do
  grep -c "$f" docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
done | tee outputs/phase-09/ac-08-schema-fields.txt
```

期待:
- セクション見出し hit 1 行以上
- `bash scripts/cf.sh tail` の grep 例が記載
- しきい値が記載
- 6 field 全てが runbook 内に登場

### AC-9: typecheck / lint / test PASS

```bash
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-09/ac-09-typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-09/ac-09-lint.log
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee outputs/phase-09/ac-09-test.log
```

期待: 全コマンド exit 0

### AC-10: 既存 behaviour change なし

```bash
# 既存 alert-relay.spec.ts の既存テスト名が全て PASS（追加分以外）
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  apps/api/src/routes/internal/__tests__/alert-relay.spec.ts \
  --reporter=verbose 2>&1 | tee outputs/phase-09/ac-10-regression.log

# レスポンス body の dedupPersisted フィールド不変性
grep -nE "dedupPersisted" \
  apps/api/src/routes/internal/alert-relay.ts \
  | tee outputs/phase-09/ac-10-dedup-persisted.txt
```

期待:
- 既存テスト 1 件も FAIL しない
- `get` 失敗時のみ意図的な behaviour change（fail-open 化）。既存テストに該当 case があれば
  spec 側で「`get` throw → 200 OK + Slack 配信継続」に更新済みであることを確認

---

## 9-4. AC 突合表（Phase 9 完了時に埋める）

| AC ID | 検証手順 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 9-3 AC-1 | grep hit 1 行 / 関数より前 | _実測転記_ | [ ] |
| AC-2 | 9-3 AC-2 | def hit 1 / export 0 / 外部 import 0 | _実測転記_ | [ ] |
| AC-3 | 9-3 AC-3 | 6 field + literal + console.warn パターン hit / vitest PASS | _実測転記_ | [ ] |
| AC-4 | 9-3 AC-4 | hash 再現性テスト PASS / 12 hex 正規表現 PASS | _実測転記_ | [ ] |
| AC-5 | 9-3 AC-5 | try/catch + fail-open 継続を grep + vitest で確認 | _実測転記_ | [ ] |
| AC-6 | 9-3 AC-6 | put catch helper 置換 + dedupPersisted 不変 | _実測転記_ | [ ] |
| AC-7 | 9-3 AC-7 | 4 ケース PASS + restoreAllMocks 設定済 | _実測転記_ | [ ] |
| AC-8 | 9-3 AC-8 | runbook セクション + grep 例 + しきい値 + 6 field | _実測転記_ | [ ] |
| AC-9 | 9-3 AC-9 | typecheck / lint / test exit 0 | _実測転記_ | [ ] |
| AC-10 | 9-3 AC-10 | 既存テスト全 PASS + dedupPersisted 不変 | _実測転記_ | [ ] |

---

## 9-5. DoD

- [ ] 9-2 着手前提 5 項目全 [x]
- [ ] 9-3 AC-1〜AC-10 全検証コマンドを実行
- [ ] 9-4 AC 突合表が全 [x]
- [ ] `outputs/phase-09/acceptance.md` に実測値が記録
- [ ] AC FAIL があれば該当 Phase（実装 = Phase 6 / テスト = Phase 7 / docs = Phase 8）へ差し戻し

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 6 | 実装の AC-1〜AC-7 / AC-10 検証 | 本 Phase で確定。FAIL 時は Phase 6 差し戻し |
| Phase 7 | テスト追加の AC-7 検証 | 本 Phase で vitest 実行結果を evidence 化 |
| Phase 8 | runbook の AC-8 検証 | 本 Phase で grep ベース整合確認 |
| Phase 11 | NON_VISUAL evidence | AC-9 の typecheck / lint / test log を Phase 11 evidence にも転載 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/index.md | AC 定義 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 検証対象本体 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | 検証対象テスト |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | AC-8 検証対象 |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-09.md | 受入確認フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/acceptance.md | AC 突合表 + 実測値 |
| evidence | outputs/phase-09/ac-{01..10}-*.{txt,log} | AC 別の grep / コマンド出力 |
| メタ | artifacts.json | phase-09 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（リファクタ）
- 引き継ぎ事項:
  - AC-1〜AC-10 が全 PASS の場合のみ Phase 10 に進む
  - AC-9 の typecheck / lint / test ログは Phase 11 NON_VISUAL evidence に転載
- ブロック条件: AC のいずれかが FAIL の場合、該当 Phase に差し戻し、本 Phase を再実行

## 実行タスク

- AC-1〜AC-10 を grep / Vitest / typecheck / lint で確認する。

## 完了条件

- [x] AC-1〜AC-10 が PASS し、Phase 11 evidence に転記できるログが存在する。
