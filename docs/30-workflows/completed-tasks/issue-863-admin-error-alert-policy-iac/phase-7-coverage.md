# Phase 7: カバレッジ確認（変更行の line/branch 実測）

> 入力: [phase-6-test-additions.md](phase-6-test-additions.md)
> 出力: `outputs/phase-7/coverage.md`
> 方針 [Feedback BEFORE-QUIT-002 / Feedback 5]: coverage 対象範囲を明示し、変更したファイル/ブロック以外は対象外とする。広域 % ではなく**変更行の line/branch 実測**を証跡に残す。

## 7-1. カバレッジ対象範囲（明示）

| 対象 | 範囲 | 理由 |
|---|---|---|
| **対象** | `apps/web/src/lib/logger.ts` の `emit()` 内 **scope/digest 昇格分岐のみ**（`if (typeof merged.scope === "string")` / `if (typeof merged.digest === "string")` の both branch） | 本タスクの核心コード変更。両分岐（present/absent × scope/digest）を網羅 |
| **対象** | `infra/sentry-alerts/lib/` 全ファイル（`load.ts` / `diff.ts` / `canonicalize.ts` / `types.ts`） | 新規追加コードのため変更行 = 全行 |
| **対象（部分）** | `infra/sentry-alerts/lib/api-client.ts` / `cli.ts` | mock dir 経由の read/write 分岐 + subcommand dispatch。実 API path（fetch）は対象外（CI drift job の統合確認で担保） |
| **対象外** | `logger.ts` の `emit()` 以外（`redact` / `RUNTIME_TAG` / `build`） | 既存コードで本タスク非変更。既存テストで担保済み |
| **対象外** | `apps/web` の logger 以外、`apps/api`、`infra/cloudflare-alerts/` | 本タスク非変更 |
| **対象外** | `error.tsx`（emit する側） | スコープ外（emit は既存実装。本タスクは tag 昇格のみ） |

## 7-2. 変更行カバレッジの目標

| ファイル / ブロック | line 目標 | branch 目標 | 網羅すべき分岐 |
|---|---|---|---|
| `logger.ts` `emit()` scope/digest 昇格 | 100% | 100% | (1) scope=string で tag 追加（TC-LOG-01） (2) scope 非 string で tag 未追加（TC-LOG-02,03） (3) digest=string で tag 追加（TC-LOG-01） (4) digest 非 string で tag 未追加（TC-LOG-02,03） (5) warn 経路の tag 共有（TC-LOG-04） |
| `infra/sentry-alerts/lib/load.ts` | 100% | 100% | dir 存在/不在、json 0件/複数件 |
| `infra/sentry-alerts/lib/diff.ts` | 100% | 100% | missing / extra / changed / 一致（空配列）/ 配列 deepDiff |
| `infra/sentry-alerts/lib/canonicalize.ts` | ≥95% | ≥90% | strip キーあり/なし、filters sort、description trim |

> 既存 alert（`cloudflare-alerts`）と異なり error event alert は閾値判定がないため、branch の主因は「scope/digest の string guard」と「diff の3分類」。この2点の both branch 網羅を必須とする。

## 7-3. 実測コマンド

### (A) logger.ts の変更行カバレッジ

```bash
# logger.spec.ts のみで logger.ts を対象に coverage 計測
mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts \
  --coverage --coverage.include='apps/web/src/lib/logger.ts' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

- 確認観点: text reporter の `logger.ts` 行で `% Branch` が 100、`Uncovered Line #s` に `emit()` の scope/digest 行が出ないこと。
- 証跡: `emit()` の scope 分岐 line 100% / branch 100%、digest 分岐 line 100% / branch 100% を `coverage.md` に転記する（広域 % ではなく分岐単位で記載）。

### (B) sentry-alerts lib のカバレッジ

```bash
mise exec -- pnpm exec vitest run infra/sentry-alerts/lib/__tests__ \
  --coverage --coverage.include='infra/sentry-alerts/lib/**' \
  --coverage.exclude='infra/sentry-alerts/lib/__tests__/**' \
  --coverage.reporter=text
```

- 確認観点: `load.ts` / `diff.ts` / `canonicalize.ts` が line/branch とも目標達成。
- `api-client.ts` の実 fetch path（mock dir 未設定の本番分岐）は uncovered 許容（CI drift job で統合確認）。その旨を `coverage.md` に「対象外行: api-client.ts L<n> (live fetch path)」として明記する。

## 7-4. カバレッジ証跡テンプレート（`outputs/phase-7/coverage.md` へ記載）

```
## 変更行カバレッジ実測

### logger.ts emit() scope/digest 昇格
- scope guard 分岐: line 100% / branch 100% (TC-LOG-01,02,03)
- digest guard 分岐: line 100% / branch 100% (TC-LOG-01,02,03)
- warn 経路 tag 共有: covered (TC-LOG-04)
- fail-soft try/catch: covered (TC-LOG-05)

### infra/sentry-alerts/lib
- load.ts: line __% / branch __%
- diff.ts: line __% / branch __%
- canonicalize.ts: line __% / branch __%
- api-client.ts: mock path covered / live fetch path 対象外（CI drift job 担保）

### 対象外（本タスク非変更）
- logger.ts redact/RUNTIME_TAG/build, error.tsx, apps/api, infra/cloudflare-alerts
```

## 7-5. 完了条件

- [ ] logger.ts の scope/digest 昇格 both branch が branch 100%（実測値を証跡記載）。
- [ ] sentry-alerts lib（load/diff/canonicalize）が line/branch 目標達成。
- [ ] 対象外範囲を明示し、未カバー行に理由（live fetch path 等）を併記。
- [ ] 広域 % のみの記載で済ませず、変更ブロック単位の実測を残す。
