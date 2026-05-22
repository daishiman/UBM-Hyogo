# Phase 10 成果物: リファクタ結果（no-op 確認）

## サマリ

本 Phase はコード差分ゼロ。Phase 6〜9 で確定した実装に対して、
**リファクタが不要であること**を確認し、その根拠を記録する。

---

## no-op の根拠

本タスクは小規模であり（helper 1 関数 + emit 2 箇所 + test 4 ケース + runbook 追記）、
過剰抽象化を行わない方針を Phase 10 仕様書 10-1 / 10-2 で定めた。
以下の確認チェックリスト（phase-10.md 10-3）が全て PASS することを以て、
リファクタ不要を確定する。

---

## 10-3 確認チェックリスト結果

| # | 確認項目 | コマンド | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 10-3-1 | helper の module-private 性 | `grep -nE "export.*logKvOperationError" alert-relay.ts` | hit 0 行 | _実測値_ | [ ] |
| 10-3-2 | 外部 import なし | `grep -rn "logKvOperationError" apps/api/src` 除外フィルタ後 | hit 0 行 | _実測値_ | [ ] |
| 10-3-3 | `crypto.subtle.digest` の await 漏れなし | `grep -nB 1 -A 3 "crypto.subtle.digest"` | 全て `await` 前置 | _実測値_ | [ ] |
| 10-3-4 | `isolateId` の module top 採番 | 行番号比較 | isolate_line < first_func_line | _実測値_ | [ ] |
| 10-3-5 | `op` リテラル union 維持 | `grep -nE 'op:\s*"(get\|put)"\s*\|\s*"(get\|put)"'` | helper signature に hit | _実測値_ | [ ] |
| 10-3-6 | handler 内 catch の薄さ | `awk` 抽出 + `wc -l` | 各 catch 内 5 行以下 | _実測値_ | [ ] |
| 10-3-7 | typecheck / lint PASS | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` | exit 0 | _実測値_ | [ ] |

---

## 10-2 不採用候補（過剰抽象化の抑止記録）

以下は本サイクルで意図的に **抽出しない** と決定した候補。
将来再利用候補が現れた場合の followup task として記録する。

### 候補 A: `logKvOperationError` を `apps/api/src/lib/kv-error-logger.ts` へ切り出し

- 判定: **不採用**
- 根拠: 現時点で本タスク以外の caller が存在しない。`apps/api/src/routes/internal/` 配下に
  第二の KV 利用 route が追加される段階で followup task として切り出しを検討する
- 将来移動条件: KV namespace を使う internal route が 2 つ以上になった時点

### 候補 B: `dedupeKeyHash` 計算を `apps/api/src/lib/hash.ts` へ切り出し

- 判定: **不採用**
- 根拠: SHA-256 first 12 hex の用途は本タスク固有（dedupeKey の容量圧縮）。
  汎用 hash util を作ると逆に責務不明瞭になる
- 将来移動条件: 他箇所で 12 hex hash の同一仕様が再利用される具体例が出た時点

### 候補 C: `errorClass` 抽出を共通 util 化

- 判定: **不採用**
- 根拠: `err instanceof Error ? err.constructor.name : typeof err` は 1 行で十分。util 化は過剰抽象化
- 将来移動条件: 3 箇所以上で同一表現が登場した時点

### 候補 D: `isolateId` を `apps/api/src/lib/isolate-id.ts` へ切り出し

- 判定: **不採用**
- 根拠: module top で `const isolateId = crypto.randomUUID();` の 1 行で完結。
  別ファイルに切り出すと import 経路で「同一 isolate ライフサイクル内で 1 回」の
  保証が読みにくくなる
- 将来移動条件: isolate ライフサイクル代理識別子を別 worker / 別 route でも使う需要が出た時点

---

## 変更対象ファイル差分

| ファイル | Phase 10 起因の差分 |
| --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | **なし**（Phase 6 確定内容を維持） |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | **なし** |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | **なし**（Phase 8 確定内容を維持） |

### 確認コマンド

```bash
git diff dev -- apps/api/src/routes/internal/alert-relay.ts
git diff dev -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
git diff dev -- docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
```

期待: Phase 6 / 7 / 8 で確定した差分のみ。Phase 10 で追加・削除された行は **ゼロ**。

---

## before / after 行数

| ファイル | before（Phase 9 完了時） | after（Phase 10 完了時） | 差分 |
| --- | --- | --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | _N 行_ | _N 行_ | 0 |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | _M 行_ | _M 行_ | 0 |

---

## DoD 対応表

| Phase 10 DoD 項目 | 本ファイル該当箇所 |
| --- | --- |
| 10-3 確認チェックリスト全項目 PASS | 上記「10-3 確認チェックリスト結果」 |
| 10-4 変更対象ファイルに Phase 10 起因の追加差分が無い | 上記「変更対象ファイル差分」 |
| `outputs/phase-10/refactor-summary.md` に no-op の根拠と 10-2 不採用候補が記載 | 本ファイル全体 |
| typecheck / lint / test 全 PASS | Phase 11 evidence にて再収集 |

---

## 結論

本 Phase は **no-op**（コード差分ゼロ）。
リファクタ判定マトリクスの全観点で「現状のまま維持」が最適解であり、
不採用候補 4 件は将来の followup task に委ねる。
Phase 11 では typecheck / lint / test / grep-gate の 4 種 evidence を
最終 NON_VISUAL evidence として収集する。
