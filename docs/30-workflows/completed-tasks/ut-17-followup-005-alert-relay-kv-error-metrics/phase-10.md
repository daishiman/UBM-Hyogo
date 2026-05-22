# Phase 10: 後付けリファクタ（最小スコープ / 主に no-op 確認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| タスクID | ut-17-followup-005-alert-relay-kv-error-metrics |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リファクタ（主に不要を確認） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (NON_VISUAL evidence) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本タスクは小規模（helper 1 関数 + emit 2 箇所 + test 4 ケース + runbook 追記）であり、リファクタは原則「不要」を確認する Phase。ただし helper の module-private 性 / import 漏れ / type 安全性は明示的に確認し、過剰抽象化（`apps/api/src/lib/` への切り出し）を行わないことを文書化する。 |

---

## 目的

Phase 9 で受入確認を通過した実装に対し、**最小スコープのリファクタ**のみを行う。
本タスクは小規模であるため、以下の方針で過剰リファクタを抑止する:

- 公開 API（`/internal/alert-relay` route handler）は変更しない
- `logKvOperationError` を `apps/api/src/lib/` へ切り出さない（YAGNI）
- リファクタは **helper の module-private 性確認** と **type 安全性確認** に限る

---

## 10-1. リファクタ判定マトリクス

| 観点 | 判定基準 | 該当時の対応 |
| --- | --- | --- |
| `logKvOperationError` の module-private 性 | export 文が無い | 不要（既に private） |
| 外部からの import | spec.ts と alert-relay.ts 自身以外で import されない | 不要 |
| `crypto.subtle.digest` の async 取り扱い | helper 内 await 漏れなし | grep で await 確認 |
| `isolateId` の再採番防止 | module top で 1 回のみ | grep で確認 |
| handler 内 try/catch 構造の重複 | `get` / `put` の catch 内が 3 行以下 | 既に helper 経由のため抽出不要 |
| `errorClass` 抽出の重複 | helper 内 1 箇所のみ | 重複なし |
| `dedupeKeyHash` 計算の重複 | helper 内 1 箇所のみ | 重複なし |
| type 安全性 | `op: "get" \| "put"` リテラル union 維持 | grep で確認 |
| `apps/api/src/lib/` への切り出し | 再利用候補が他に存在しない | 実施しない（YAGNI） |

> **結論方針**: 抽出・切り出しは **行わない**。本 Phase は「リファクタ不要」を確認し、
> その根拠を `outputs/phase-10/refactor-summary.md` に記録する。

---

## 10-2. 抽出候補と判定（全て不採用）

### 候補 A: `logKvOperationError` を `apps/api/src/lib/kv-error-logger.ts` へ切り出し

| 項目 | 内容 |
| --- | --- |
| 判定 | **実施しない** |
| 根拠 | 現時点で本タスク以外の caller が存在しない。再利用候補（他の KV namespace 使用箇所）が出てくるまで `apps/api/src/routes/internal/alert-relay.ts` 内 private に閉じる |
| 将来移動条件 | `apps/api/src/routes/internal/` 配下に第二の KV 利用 route が追加される場合 |

### 候補 B: `dedupeKeyHash` 計算を `apps/api/src/lib/hash.ts` へ切り出し

| 項目 | 内容 |
| --- | --- |
| 判定 | **実施しない** |
| 根拠 | SHA-256 first 12 hex の用途は本タスク固有（dedupeKey の容量圧縮）。汎用 hash util を作ると逆に責務不明瞭になる |

### 候補 C: `errorClass` 抽出を共通 util 化

| 項目 | 内容 |
| --- | --- |
| 判定 | **実施しない** |
| 根拠 | `err instanceof Error ? err.constructor.name : typeof err` は 1 行で十分。util 化は過剰抽象化 |

### 候補 D: `isolateId` を `apps/api/src/lib/isolate-id.ts` へ切り出し

| 項目 | 内容 |
| --- | --- |
| 判定 | **実施しない** |
| 根拠 | module top で `const isolateId = crypto.randomUUID();` の 1 行で完結。別ファイルに切り出すと import 経路で「同一 isolate ライフサイクル内で 1 回」の保証が読みにくくなる |

---

## 10-3. 確認チェックリスト

### 10-3-1. helper の module-private 性

```bash
grep -nE "export.*logKvOperationError" \
  apps/api/src/routes/internal/alert-relay.ts
```

期待: hit 0 行

### 10-3-2. 外部 import なし

```bash
grep -rn "logKvOperationError" apps/api/src \
  | grep -v "apps/api/src/routes/internal/alert-relay.ts" \
  | grep -v "apps/api/src/routes/internal/__tests__/alert-relay.spec.ts"
```

期待: hit 0 行

### 10-3-3. `crypto.subtle.digest` の await 漏れなし

```bash
grep -nB 1 -A 3 "crypto\.subtle\.digest" \
  apps/api/src/routes/internal/alert-relay.ts
```

期待: `await crypto.subtle.digest(...)` パターンで使用

### 10-3-4. `isolateId` の module top 採番

```bash
# 行番号確認
isolate_line=$(grep -nE "const isolateId\s*=\s*crypto\.randomUUID\(\)" \
  apps/api/src/routes/internal/alert-relay.ts | head -1 | cut -d: -f1)
first_func_line=$(grep -nE "^(export )?(async )?function|^(export )?const \w+ = (async )?\(" \
  apps/api/src/routes/internal/alert-relay.ts | head -1 | cut -d: -f1)

[ "$isolate_line" -lt "$first_func_line" ] && echo "OK: module top" || echo "FAIL: 関数内"
```

期待: `OK: module top`

### 10-3-5. `op` リテラル union 維持

```bash
grep -nE 'op:\s*"(get|put)"\s*\|\s*"(get|put)"' \
  apps/api/src/routes/internal/alert-relay.ts
```

期待: helper signature に `op: "get" | "put"` が記載

### 10-3-6. handler 内 catch の薄さ

```bash
# get catch 内行数
awk '/ALERT_DEDUP_KV\.get\(/,/^\s*\}/' \
  apps/api/src/routes/internal/alert-relay.ts | wc -l

# put catch 内行数
awk '/ALERT_DEDUP_KV\.put\(/,/^\s*\}/' \
  apps/api/src/routes/internal/alert-relay.ts | wc -l
```

期待: 各 catch 内が 5 行以下（helper 1 行呼出 + fail-open 継続のみ）

### 10-3-7. typecheck / lint PASS

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: exit 0

---

## 10-4. 変更対象ファイル一覧

| ファイル | 変更内容 |
| --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | **変更なし**（Phase 6 で確定した内容を維持） |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | **変更なし** |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | **変更なし**（Phase 8 で確定） |

> 本 Phase は **コード差分ゼロ** が原則。10-3 で違反が発見された場合のみ Phase 6 / 7 に差し戻す。

---

## 10-5. 入出力・副作用

| 入力 | 出力 | 副作用 |
| --- | --- | --- |
| Phase 9 受入完了後の `alert-relay.ts` | 同一ファイル（変更なし） | なし |
| 10-3 確認コマンドの実行結果 | `outputs/phase-10/refactor-summary.md` | evidence のみ |

---

## 10-6. テスト方針 / 検証コマンド

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| 静的 | `mise exec -- pnpm typecheck` | PASS |
| 静的 | `mise exec -- pnpm lint` | PASS |
| ユニット | `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 全 PASS（リファクタゼロのため Phase 9 と同一結果） |
| 差分確認 | `git diff dev -- apps/api/src/routes/internal/alert-relay.ts` | Phase 6 で確定した差分のみ。Phase 10 で追加差分なし |

---

## 10-7. DoD

- [ ] 10-3 確認チェックリスト全項目 PASS
- [ ] 10-4 変更対象ファイルに Phase 10 起因の追加差分が **無い**
- [ ] `outputs/phase-10/refactor-summary.md` に no-op の根拠と 10-2 不採用候補が記載
- [ ] typecheck / lint / test 全 PASS

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | 受入確認結果（AC-1〜AC-10）を no-op の根拠として参照 | 引用 |
| Phase 11 | typecheck / lint / test log を NON_VISUAL evidence に転載 | 共有 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 確認対象 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/phase-09.md | 前 Phase の AC 結果 |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-10.md | リファクタ判定フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/refactor-summary.md | no-op の根拠 + 10-2 不採用候補 + 10-3 確認結果 |
| メタ | artifacts.json | phase-10 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（NON_VISUAL evidence）
- 引き継ぎ事項:
  - 本 Phase は no-op。Phase 11 で typecheck / lint / test log を最終 evidence として転記
- ブロック条件: 10-3 確認チェックリストで違反が発見された場合、Phase 6 または Phase 7 に差し戻し

## 実行タスク

- helper の module-private 性、外部 import 不在、await 漏れなしを確認する。

## 完了条件

- [x] リファクタ不要の根拠が `outputs/phase-10/refactor-summary.md` に記録されている。
