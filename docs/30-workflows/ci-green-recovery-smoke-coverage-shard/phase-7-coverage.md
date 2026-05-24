# Phase 7: カバレッジ確認

mint helper の分岐網羅と reason 分類分岐の網羅を確認する。NON_VISUAL タスクのため Phase 11 は screenshot を持たず、自動テスト + CI 観測を代替証跡とする。coverage threshold 80% を維持（issue-617 正本）。

---

## 1. coverage 対象と threshold

| 項目 | 値 |
|---|---|
| threshold | **80%**（lines / branches / functions / statements）。issue-617 / coverage-80-enforcement の正本を維持（変更しない） |
| 判定経路 | `scripts/coverage-guard.sh`（本タスクで判定ロジックは不変） |
| 新規テスト対象 | `scripts/smoke/mint-staging-bearers.mts` の純粋関数 `mintStagingBearers` |

> `scripts/smoke/` 配下が既存の coverage 集計 package に含まれない場合、本 unit は coverage 数値には乗らないが、分岐網羅は test ケースで明示的に担保する（下記 §2/§3）。shell script（`coverage-guard.sh` / `runtime-attendance-provider.sh`）は Vitest 対象外のため、分岐網羅は目視 + command 実行で確認する。

---

## 2. mint helper の分岐網羅（admin / me / 欠落 / TTL）

| 分岐 | 網羅するケース | Phase 4/6 対応 |
|---|---|---|
| admin JWT 発行（isAdmin=true） | T-A1（parity）、F-A6（取り違え防止） | ✅ |
| me JWT 発行（isAdmin=false） | T-A2（parity）、F-A6 | ✅ |
| memberId 出力契約（admin の memberId） | T-A3 | ✅ |
| TTL 既定値（600） | T-A5 | ✅ |
| TTL 明示指定 | T-A4 | ✅ |
| TTL 境界（有効 / 失効） | T-A4, T-A5, F-A3, F-A4 | ✅ |
| 必須 env 欠落（純粋関数 throw / CLI exit2） | T-A7, F-A5 | ✅ |
| 鍵不一致 verify 失敗 | T-A6, F-A1 | ✅ |
| 改ざん token | F-A2 | ✅ |

全分岐がテストケースに紐づき、`mintStagingBearers` の lines/branches/functions/statements を 80% 以上で満たす（純粋関数のため到達不能経路なし）。

---

## 3. reason 分類分岐の網羅（`runtime-attendance-provider.sh`）

| 分岐 | 条件 | 期待 reason | 網羅手段 |
|---|---|---|---|
| auth misconfigured | 500 + `{"error":"auth misconfigured"}` | `auth-secret-binding-missing` | 既存系の回帰（F-A9）+ 目視 |
| token 失効/改ざん | 401 + `{"error":"unauthorized"}` | `auth-token-invalid-or-expired` | Phase 4 §1.4 + 目視 |
| 権限不足 | 403 + `{"error":"forbidden"}` | `auth-not-admin` | Phase 4 §1.4 + 目視 |
| 正常 | 200 | reason 無し | smoke PASS で確認 |

> shell の分岐は redact 済み body を入力に `jq -e` で error 種別のみ判定する経路を全て列挙済み。実 status は CI（staging）でのみ観測するため、ローカルは分岐到達の目視 + 擬似 body での jq 確認に留める。

---

## 4. Lane B/C のカバレッジ観点

- `coverage-guard.sh` / `ci.yml` は shell / YAML のため数値 coverage 対象外。
- 代替担保: `--no-run` のメッセージ確認（F-B3/F-B4）、step 順序の actionlint + 目視（F-B1/F-B2）。
- aggregate coverage threshold（80%）は本タスク後も `--no-run` で従来通り強制される（判定ロジック不変）。

---

## 5. Phase 11 代替証跡（NON_VISUAL）

UI 変更が無いため screenshot は取得しない。代替証跡として以下を Phase 11 で記録する:

| 証跡 | 内容 |
|---|---|
| mint parity unit ログ | `vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` の PASS 出力 |
| actionlint 結果 | `ci.yml` / `runtime-smoke-staging.yml` のエラー 0 |
| coverage-guard `--no-run` ログ | MISSING メッセージ強化の出力 / PASS 出力 |
| CI 観測 | `runtime-smoke-staging / smoke` の admin-list 200 + `.members` array、`coverage-gate` PASS（実 CI run で観測。secret 投入後・ユーザー gated） |

> secret 実値・JWT 文字列は証跡に含めない（`::add-mask::` 前提 / 不変条件 3）。CI ログは mask 済みのものを参照する。

---

## 6. DoD

- [ ] mint helper の全分岐（admin/me/欠落/TTL/鍵不一致/改ざん）がテストケースに紐づく
- [ ] reason 分類 3 種（500/401/403）+ 正常が網羅されている
- [ ] coverage threshold 80% が変更されていない（issue-617 正本維持）
- [ ] NON_VISUAL の代替証跡が列挙されている
- [ ] secret 非露出（mask 前提）が維持されている

---

## 7. 成果物

- `outputs/phase-7/coverage.md`（本 Phase のカバレッジ確認サマリ）
