> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

# Phase 11: 証跡 (PASS 5 点セット / NON_VISUAL evidence)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3（task-03 後・直列） |
| 実行種別 | NON_VISUAL（UI 変更なし・logger / SSR ガード基盤） |
| Phase 番号 | 11 / 13 |
| 上流 Phase | 10（最終レビュー） |
| 下流 Phase | 12（ドキュメント / 引き継ぎ） |
| 状態 | completed |
| CONST_005 準拠 | ○（証跡を `outputs/phase-11/evidence/` に canonical 配置） |

## 目的

task-04 §9 DoD を裏付ける **PASS 5 点セット**（typecheck / lint / test / build / grep-gate）を `outputs/phase-11/evidence/` 配下に決定論的ファイルとして配置し、Phase 12（ドキュメント）と Phase 13（PR）での参照点を確定する。本タスクは画面/UI 変更を伴わない **NON_VISUAL** タスクのため、screenshot evidence は採取せず、ランタイム挙動（JSON 一行 logger 出力 / Sentry capture）の textual evidence で代替する。

## NON_VISUAL 根拠

- task-04 の変更対象（§3）は `apps/web/src/lib/{is-browser,logger}.ts` / 同 `__tests__/` / `eslint.config.mjs` / 既存 `window` 参照箇所の最小ラップであり、**route component / primitives / tokens への変更なし**。
- 既存ページの DOM / OKLch token / spacing rhythm を変えないため、`outputs/phase-10/` 系で要求される screenshot diff は対象外。
- VISUAL gate（`verify-design-tokens` 等）は CI で自動回るが、本 phase では grep-gate と build SSR 警告 0 をもって視覚回帰なしを宣言する。

## 証跡コマンドと期待結果

すべて `mise exec --` 経由で Node 24 / pnpm 10 を確実に使う。出力は `tee` で canonical path に保存する。

### 1. typecheck

```bash
mkdir -p outputs/phase-11/evidence
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit \
  2>&1 | tee outputs/phase-11/evidence/typecheck.log
```

- 期待: exit 0 / `error TS` 0 件
- canonical path: `outputs/phase-11/evidence/typecheck.log`

### 2. lint

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint \
  2>&1 | tee outputs/phase-11/evidence/lint.log
```

- 期待: exit 0 / `no-restricted-globals` 違反 0 件
- 検証観点: 新ルール（`window` / `document` 直参照禁止）が **既存コードに違反 0 で適用**されている
- canonical path: `outputs/phase-11/evidence/lint.log`

### 3. test

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test \
  src/lib/__tests__/is-browser.test.ts \
  src/lib/__tests__/logger.test.ts \
  2>&1 | tee outputs/phase-11/evidence/test.log
```

- 期待: 全 case pass（task-04 §7 の 7 ケース全て）
- 観点: `logger.error` が `captureException` を 1 回呼ぶ / `logger.warn` が `captureMessage` を `level: "warning"` で呼ぶ / `child()` が base fields をマージする / Sentry hook throw でも logger 自身は throw しない
- canonical path: `outputs/phase-11/evidence/test.log`

### 4. build

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build \
  2>&1 | tee outputs/phase-11/evidence/build.log
```

- 期待: exit 0 / SSR 実行時警告 0 / `ReferenceError: window is not defined` 0 件
- 観点: `@opennextjs/cloudflare` 経由で Workers bundle が生成されること、build 中の SSR pre-render で `window` 参照が走らないこと
- canonical path: `outputs/phase-11/evidence/build.log`

### 5. grep-gate

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'src/lib/is-browser.ts' \
  | grep -v 'src/instrumentation-client.ts' \
  | tee outputs/phase-11/evidence/grep-gate.log
test ! -s outputs/phase-11/evidence/grep-gate.log && echo "PASS: 0 hits" \
  | tee -a outputs/phase-11/evidence/grep-gate.log
```

- 期待: 出力ファイルが空（=`window.` 直参照は `is-browser.ts` / `instrumentation-client.ts` に**のみ**残存）
- 観点: ESLint 例外 override 対象（§0.6）以外で素手 `window.` が 0 件
- canonical path: `outputs/phase-11/evidence/grep-gate.log`

## Sentry 手動 smoke（任意 / staging 時）

ローカル / staging で実 Sentry に event が届くか手動確認する手順。Phase 11 完了の必須要件ではないが、G4 staging smoke で再実行する。

```bash
# 1. dev server 起動（local）
mise exec -- pnpm --filter @ubm-hyogo/web dev

# 2. RSC route で logger.error 発火（適当な error route を一時的に呼ぶ）
#    あるいは vitest で logger.error を直接 invoke

# 3. Sentry dashboard で event 受信を確認
#    - tag.event = "smoke.task-04"
#    - tag.runtime ∈ {browser, workers, nodejs}
```

- evidence: `outputs/phase-11/evidence/sentry-smoke.md`（手動メモ / dashboard URL / event ID）
- 状態語彙: ローカルで完結すれば `PASS`、staging 実機検証を G4 に持ち越す場合は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

## Workers ランタイム evidence 取得方針

build 成果物の SSR 実行で `console.info` JSON 一行が想定 schema（`{level, ts, runtime, event, ...}`）であることを確認する。

```bash
# wrangler dev で apps/web を起動し、logger を呼ぶ route を 1 回叩く
mise exec -- pnpm --filter @ubm-hyogo/web exec wrangler dev --local \
  > outputs/phase-11/evidence/wrangler-tail.log 2>&1 &

curl -s http://localhost:8788/ > /dev/null
# tail の JSON 一行に `"runtime":"workers"` または `"runtime":"nodejs"` が含まれること
grep -E '"level":"(info|error|warn)"' outputs/phase-11/evidence/wrangler-tail.log \
  | head -5 | tee outputs/phase-11/evidence/runtime-logger.log
```

- canonical path: `outputs/phase-11/evidence/runtime-logger.log`
- 任意（dev server 立ち上げが phase 内で困難な場合は staging G4 に倒す）

## PASS 状態語彙

| 条件 | 状態 |
|------|------|
| 1〜5 全てローカルで PASS かつ Sentry smoke がローカル完結 | `PASS` |
| 1〜5 PASS / Sentry / runtime-logger は staging で実施予定 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| いずれか fail | `FAIL`（修正後 phase-11 を再実行） |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | typecheck evidence 採取 | completed |
| 2 | lint evidence 採取 | completed |
| 3 | test evidence 採取 | completed |
| 4 | build evidence 採取 | completed |
| 5 | grep-gate evidence 採取 | completed |
| 6 | Sentry smoke（任意 / staging 持ち越し可） | runtime pending (Phase 13 / G4) |
| 7 | runtime-logger evidence（任意） | runtime pending (Phase 13 / G4) |

## 成果物

| 種別 | パス |
| --- | --- |
| evidence | outputs/phase-11/evidence/typecheck.log |
| evidence | outputs/phase-11/evidence/lint.log |
| evidence | outputs/phase-11/evidence/test.log |
| evidence | outputs/phase-11/evidence/build.log |
| evidence | outputs/phase-11/evidence/grep-gate.log |
| evidence（任意） | outputs/phase-11/evidence/sentry-smoke.md |
| evidence（任意） | outputs/phase-11/evidence/runtime-logger.log |
| サマリ | outputs/phase-11/phase-11.md |

## 完了条件 (DoD)

- [ ] PASS 5 点（typecheck / lint / test / build / grep-gate）の log が `outputs/phase-11/evidence/` に配置済み
- [ ] grep-gate.log が空（`is-browser.ts` / `instrumentation-client.ts` 以外で `window.` 0 件）
- [ ] test.log で task-04 §7 全 7 ケース pass
- [ ] build.log で SSR 警告 0 / `ReferenceError: window is not defined` 0 件
- [ ] PASS 状態語彙が確定（`PASS` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- [ ] NON_VISUAL であることが本ファイル内に明記
- [ ] CONST_005: canonical path 規約準拠

## 次 Phase

- 次: Phase 12（ドキュメント更新 / 引き継ぎ / strict 7 outputs）
- 引き継ぎ: PASS 5 evidence path 一覧、PASS 状態語彙、未対応 `window` 参照箇所一覧（あれば）
- ブロック条件: PASS 5 点未達、または grep-gate fail

## 実行タスク

1. typecheck / lint / test / build / grep-gate evidence を取得する。
2. Sentry smoke と runtime logger evidence の user gate を分離する。
3. Phase 12 へ PASS 状態語彙を引き継ぐ。

## 参照資料

| 種別 | パス |
| --- | --- |
| Phase 10 | `phase-10.md` |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |
