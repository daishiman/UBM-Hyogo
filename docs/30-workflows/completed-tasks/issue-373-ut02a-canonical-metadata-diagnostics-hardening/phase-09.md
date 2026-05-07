# Phase 9: 品質保証 — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 5-8 で実装した `verify-static-manifest.mjs` / `regenerate-static-manifest.mjs` / `buildSectionsWithDiagnostics()` 構造化ログ / `alias-queue-adapter.contract.test.ts` / 既存 `metadata.test.ts` 拡張を、typecheck・lint・unit/contract test・coverage・determinism・verify gate という機械的な品質ゲート群で検証する。実コード変更を含む実装タスクであり commit 対象成果物が存在するため CONST_004 区分で実装仕様書扱い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| phase | 9 / 13 |
| 目的 | typecheck / lint / unit-contract test / verify-static-manifest / determinism / coverage の全 gate を GREEN にする |
| 依存 phase | 8（DRY 化） |
| 成果物 | `outputs/phase-09/main.md` + 副次 evidence（後段 Phase 11 で正式保存） |
| user_approval_required | false |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5-8 までで実装した次の差分が、機械検証の観点で全 GREEN であることを確定する:

1. `scripts/verify-static-manifest.mjs` が manifest 健全時 PASS / source spec drift 時 FAIL を返す
2. `scripts/regenerate-static-manifest.mjs` が決定論的（2 回連続実行 byte-identical）に出力する
3. `apps/api/src/repository/_shared/generated/static-manifest.json` に `sourceSpecHash` / `sourceSpecVersion` が追加されており、既存読み込み側（`metadata.ts`）と互換である
4. `buildSectionsWithDiagnostics()` の unknown stable key 件数が `code: "UBM-MANIFEST-UNKNOWN-KEY"` 構造化ログで出力される
5. `alias-queue-adapter.contract.test.ts` が dryRun success / failure / unknownStableKey transit / 未注入 の最低 3-4 ケースで PASS
6. `metadata.test.ts` に hash drift simulation テストが追加され PASS
7. `.github/workflows/ci.yml` に `verify-static-manifest` gate が追加されている

## 実行タスク

- typecheck / lint / test / verify / determinism / coverage を順序付きで実行する
- hash drift simulation と placeholder grep を blocking gate として確認する
- 失敗時の分岐先を同一 Phase 内で確定し、false green を残さない

## 品質ゲートマトリクス

| # | ゲート名 | 観点 | 検証コマンド | 期待結果 | blocker 種別 |
| --- | --- | --- | --- | --- | --- |
| Q1 | typecheck | 型整合 | `mise exec -- pnpm typecheck` | exit 0 | hard |
| Q2 | lint | コード規約 | `mise exec -- pnpm lint` | exit 0 | hard |
| Q3 | unit/contract test (apps/api/_shared) | 機能 | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose` | 全テスト PASS、新規 alias-queue-adapter.contract.test.ts / metadata.test.ts hash drift ケースが含まれていること | hard |
| Q4 | verify-static-manifest（健全時） | manifest 整合 | `mise exec -- pnpm verify:static-manifest` | exit 0 + `OK: source spec hash matches manifest.sourceSpecHash` 相当のメッセージ | hard |
| Q5 | regenerate determinism | 決定論性 | `mise exec -- pnpm regenerate:static-manifest && git diff --exit-code apps/api/src/repository/_shared/generated/static-manifest.json` | exit 0（diff 0 byte） | hard |
| Q6 | regenerate 2 連続 byte-identical | 決定論性（強化） | `mise exec -- pnpm regenerate:static-manifest && cp …/static-manifest.json /tmp/m1.json && mise exec -- pnpm regenerate:static-manifest && diff /tmp/m1.json apps/api/src/repository/_shared/generated/static-manifest.json` | 出力 0 行 | hard |
| Q7 | coverage（_shared 限定） | テスト網羅 | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --coverage` | `metadata.ts` / `builder.ts` / new contract test 対象範囲で statements >= 90% / branches >= 80% | soft（基準値未達は理由記録） |
| Q8 | hash drift simulation（FAIL 系） | manifest stale 検出 | 一時的に manifest.sourceSpecHash を改竄 → `mise exec -- pnpm verify:static-manifest` → 元に戻す | exit 非 0 + `STALE: manifest.sourceSpecHash diverged from spec hash` 相当 | hard |
| Q9 | structured log emission | diagnostics 観測性 | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared/builder.test.ts -t "logWarn UBM-MANIFEST-UNKNOWN-KEY"` | logger spy が `code: "UBM-MANIFEST-UNKNOWN-KEY"` で 1 回以上呼ばれた assertion が PASS | hard |
| Q10 | dependency-cruiser（任意） | 境界違反 | `mise exec -- pnpm depcruise apps/api/src/repository/_shared` | apps/web からの import 0 件 / D1 import が apps/api に閉じる | soft |
| Q11 | CI workflow YAML lint | gate 配置 | `mise exec -- pnpm exec actionlint .github/workflows/ci.yml` または `yamllint` | exit 0 + `verify-static-manifest` job が存在すること（grep） | hard |
| Q12 | CONST_007 先送り表現不在 | 仕様健全性 | `grep -nE 'TODO\|FIXME\|別 PR\|将来タスク\|Phase XX で' docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-{05..08}/` | 0 hit | hard |

> hard: 失敗時に Phase 10 進行停止 / soft: 理由記録のうえ続行可

## 実行順序

```
Q1 typecheck                    blocking
Q2 lint                         blocking
Q3 unit/contract test           blocking
Q4 verify (健全時)              blocking
Q5 regenerate determinism       blocking
Q6 regenerate 2 連続 identical  blocking
Q8 hash drift simulation        blocking（手動セット → 復元を伴うため Q5 後）
Q9 structured log emission      blocking（Q3 サブセット）
Q11 CI YAML lint                blocking
Q7 coverage                     soft
Q10 depcruise                   soft
Q12 CONST_007 先送り grep       blocking（Phase 10 直前）
```

## 失敗時の対処手順

| ゲート | 失敗時の分岐 | 自動修復可否 |
| --- | --- | --- |
| Q1 typecheck | エラー箇所を Phase 5 実装 / Phase 4 テスト戦略に戻して修正 | × |
| Q2 lint | `pnpm lint --fix` を 1 回試行、残違反は手修正 | ◯（1 回） |
| Q3 unit/contract test | 失敗ケースを Phase 4 テスト戦略 + Phase 5 実装に戻し修復 | × |
| Q4 verify（健全時） FAIL | (a) regenerate を実行して manifest を最新化、(b) なお FAIL なら verify-static-manifest.mjs 自体のロジック修正 | △ |
| Q5 / Q6 determinism FAIL | regenerate-static-manifest.mjs に `Date.now()` 等の非決定的 source が混入していないか調査。`generatedAt` は固定 timestamp（spec の最終 commit ISO）に統一 | × |
| Q8 hash drift simulation で FAIL を返さない | verify-static-manifest.mjs の hash 比較ロジックに分岐欠落あり。Phase 5 ランブックに戻す | × |
| Q9 structured log 未発火 | builder.ts の `logWarn` 呼び出し点漏れ。Phase 5 実装ランブックに戻す | × |
| Q11 CI YAML lint FAIL | `.github/workflows/ci.yml` の YAML 構文修正、`verify-static-manifest` job 追加位置の見直し | × |
| Q7 coverage 未達 | テストケース追加で _shared 系の到達率を上げる。やむを得ず不足のままなら soft pass + 理由記録 | △ |
| Q10 depcruise 違反 | apps/web → apps/api 直接 import / D1 binding 越境を Phase 5 で修正 | × |

CONST_007: いずれの失敗も「Phase 10 で対応」「別 PR」型の先送り禁止。本 Phase で必ず分岐先を確定し、再実行で GREEN 化する。

## hash drift simulation 手順（Q8 詳細）

```
# 1. 現在の sourceSpecHash を退避
ORIG=$(jq -r '.sourceSpecHash' apps/api/src/repository/_shared/generated/static-manifest.json)

# 2. ダミー hash に置換
jq '.sourceSpecHash = "0000000000000000000000000000000000000000000000000000000000000000"' \
  apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m.json
mv /tmp/m.json apps/api/src/repository/_shared/generated/static-manifest.json

# 3. verify が FAIL することを確認（exit 非 0 + STALE メッセージ）
mise exec -- pnpm verify:static-manifest; echo "exit=$?"

# 4. 元に戻す（重要: コミット汚染防止）
git checkout apps/api/src/repository/_shared/generated/static-manifest.json
```

> 復元忘れ防止のため、本手順は Q8 ログを取得し終えた直後に必ず `git diff --exit-code apps/api/src/repository/_shared/generated/static-manifest.json` で 0 を確認する。

## 多角的チェック観点

- typecheck / lint / unit / contract test の 4 軸が GREEN（Q1-Q3 / Q9）
- manifest 整合 verify の正常系 + 異常系が両方検証されている（Q4 + Q8）
- 決定論性が 2 段階（Q5 同一 byte / Q6 2 回連続同一）で検証される
- 構造化ログの code label が test で固定検証される（Q9）
- CI 上で同じ verify gate が走ることが YAML lint で確認される（Q11）
- 不変条件 #5 違反（apps/web → D1 直接 import）が depcruise で検出される（Q10 soft）
- Phase 5-8 outputs に CONST_007 先送り表現が混入していない（Q12）

## サブタスク管理

- [ ] Q1〜Q12 を実行順序に従い実施
- [ ] Q5-Q6 で `Date.now()` 等の非決定的 source 不在を確認
- [ ] Q8 で hash 改竄 → 復元の往復が 1 サイクル成立
- [ ] Q9 logger spy assertion が PASS
- [ ] Q11 CI workflow に `verify-static-manifest` job が grep で存在
- [ ] `outputs/phase-09/main.md` を作成し Q1-Q12 の判定結果を表で記録

## 成果物

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/outputs/phase-09/main.md`

## 完了条件 / DoD

- [ ] Q1-Q6 / Q8 / Q9 / Q11 / Q12 の hard ゲートがすべて PASS
- [ ] Q7 / Q10 の soft ゲートが PASS または理由記録による SOFT-PASS
- [ ] hash drift simulation 後 manifest が元に戻っている（`git diff --exit-code` 0）
- [ ] `outputs/phase-09/main.md` に判定結果が表形式で記録されている
- [ ] 元 unassigned task 完了条件 5 項目（stale 検出 / determinism / diagnostics evidence / contract test / retirement spec 反映）のうち、Phase 9 範囲（前 4 項目）の機械検証が GREEN

## タスク 100% 実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] coverage 概念が誤用されていない（_shared 限定で適用）
- [ ] CONST_007 違反（「Phase 10 で QA」型の先送り）がない
- [ ] secret / PII の plaintext を本仕様書に書いていない

## 次 Phase（Phase 10 最終レビュー）への引き継ぎ事項

- Q1-Q12 の判定結果一覧
- soft pass 項目（Q7 / Q10）の理由記録
- hash drift simulation 後の manifest 復元確認結果
- CI workflow `.github/workflows/ci.yml` への `verify-static-manifest` job 追加位置
- coverage の到達率（_shared 限定）
- depcruise が検出した境界（apps/web ↔ apps/api / D1 binding）の状態

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-03.md`（設計レビュー GO 判定）
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-04.md`〜`phase-08.md`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` / `generated/static-manifest.json`
- `scripts/verify-static-manifest.mjs` / `scripts/regenerate-static-manifest.mjs`
- `.github/workflows/ci.yml`
- `CLAUDE.md`（mise exec / pnpm workspace / 不変条件）
