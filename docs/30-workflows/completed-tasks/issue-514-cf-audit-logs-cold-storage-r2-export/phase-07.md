# Phase 7: カバレッジ判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 目的 | exporter / restore-drill / redaction-guard に限定した focused coverage threshold（80%）を判定し、不足モジュールに対し追加テスト or 例外申請を決める |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

親タスクの `coverage AC=適用外`（GitHub Actions workflow + 単発 scripts のためアプリ本体の coverage gate を適用しない）を所与とし、**本タスクで新規追加するコアモジュールに限定した focused threshold** を判定する。対象は以下 3 モジュール:

1. `scripts/cf-audit-log/export-to-r2.ts`
2. `scripts/cf-audit-log/restore-drill.ts`
3. `scripts/cf-audit-log/redaction-guard.ts`

threshold は **statements / branches / functions / lines いずれも 80%** とし、未達の場合は (a) 追加テスト (b) 例外申請（理由を本ファイルに記述）のいずれかで解決する。

## 統合テスト連携

NON_VISUAL implementation。本 Phase は判定のみで実装変更は行わない（不足時の追加テストは Phase 6 に戻して実装）。

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `vitest.config.ts` | 編集 | `coverage.thresholds` に focused パターンを追加（既存 root threshold は触らない） |
| `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/phase-07.md` | 新規 | 本ファイル（判定結果を記録） |
| `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-07/coverage-report.md` | 新規 | 実行 evidence（Phase 11 で更新） |

## focused threshold 設定

### `vitest.config.ts` 追加分

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        // root threshold（既存）はそのまま
        // focused: 本タスクで追加するモジュールのみ 80%
        "scripts/cf-audit-log/export-to-r2.ts": {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        "scripts/cf-audit-log/restore-drill.ts": {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        "scripts/cf-audit-log/redaction-guard.ts": {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
      include: [
        "scripts/cf-audit-log/export-to-r2.ts",
        "scripts/cf-audit-log/restore-drill.ts",
        "scripts/cf-audit-log/redaction-guard.ts",
      ],
    },
  },
});
```

> `r2-client.ts` / `manifest-store.ts` / `object-key.ts` は薄い wrapper / pure function のため focused threshold の対象外。これらは exporter / restore-drill 経由で間接的にカバーされる。

## 判定フロー

### Step 1. coverage 取得

```bash
mise exec -- pnpm vitest run --coverage \
  scripts/cf-audit-log/__tests__/export-to-r2.spec.ts \
  scripts/cf-audit-log/__tests__/restore-drill.spec.ts \
  scripts/cf-audit-log/__tests__/redaction-guard.spec.ts
```

### Step 2. report 解析

`coverage/coverage-summary.json` から以下 3 ファイルの metrics を抽出:

| ファイル | statements | branches | functions | lines | 判定 |
| --- | --- | --- | --- | --- | --- |
| `export-to-r2.ts` | PLANNED >=80% | PLANNED >=80% | PLANNED >=80% | PLANNED >=80% | PENDING_IMPLEMENTATION |
| `restore-drill.ts` | PLANNED >=80% | PLANNED >=80% | PLANNED >=80% | PLANNED >=80% | PENDING_IMPLEMENTATION |
| `redaction-guard.ts` | PLANNED >=90% | PLANNED >=90% | PLANNED >=90% | PLANNED >=90% | PENDING_IMPLEMENTATION |

> 数値は Phase 11 実行時に `outputs/phase-07/coverage-report.md` へ記録する。

### Step 3. 不足判定

| 判定 | アクション |
| --- | --- |
| 全項目 80% 以上 | Phase 7 完了 |
| 80% 未満かつ追加テスト可能 | Phase 6 に差し戻し、追加ケースを実装してから再判定 |
| 80% 未満だが構造的に到達不能（dead branch / defensive throw） | 例外申請を本ファイル「例外記録」セクションに記述、`/* c8 ignore next */` を該当行に付与 |

## 例外申請の基準

以下のみ例外を許容する:

1. **defensive throw**: TypeScript 型では到達するが runtime では到達不能な分岐（例: `switch` の `default: throw new Error("unreachable")`）
2. **environment guard**: `if (typeof process === "undefined")` 等の Workers / Node 両対応の defensive 分岐
3. **error re-throw**: 既に上位で catch / throw されている例外を再 throw する 1 行

それ以外（特に redaction-guard の pattern 分岐）は **必ず追加テストで埋める**。redaction は fail-closed の本丸であり例外を許さない。

## 例外記録

> Phase 11 実行後に該当行があれば追記。本 Phase 仕様書時点では「想定 0 件」。

| ファイル:行 | 種別 | 理由 |
| --- | --- | --- |
| (none yet) | - | - |

## 入力・出力・副作用

- 入力: Phase 6 で実装した 24 ケース（integration を除く）の vitest 実行結果
- 出力: `outputs/phase-07/coverage-report.md`（実数値）、`vitest.config.ts` の focused threshold
- 副作用: threshold 未達時は CI / `pnpm test:coverage` が exit 非 0

## テスト方針

判定のみのため新規テストは追加しない。不足モジュールがあれば Phase 6 に戻して実装する。

## ローカル実行・検証コマンド

```bash
# 1. coverage 取得 + threshold 判定（threshold 未達時は exit 非 0）
mise exec -- pnpm vitest run --coverage \
  scripts/cf-audit-log/__tests__/export-to-r2.spec.ts \
  scripts/cf-audit-log/__tests__/restore-drill.spec.ts \
  scripts/cf-audit-log/__tests__/redaction-guard.spec.ts

# 2. coverage HTML を browser で確認
open coverage/index.html

# 3. JSON summary を抽出して報告に貼る
cat coverage/coverage-summary.json | jq '.["scripts/cf-audit-log/export-to-r2.ts"]'
cat coverage/coverage-summary.json | jq '.["scripts/cf-audit-log/restore-drill.ts"]'
cat coverage/coverage-summary.json | jq '.["scripts/cf-audit-log/redaction-guard.ts"]'

# 4. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD（Phase 7 完了条件）

- [ ] `vitest.config.ts` の `coverage.thresholds` に exporter / restore-drill / redaction-guard の focused 80% が追加されている
- [ ] `pnpm vitest run --coverage` が exit 0 で終了する（3 モジュール全項目 80% 以上 or 例外申請済み）
- [ ] `outputs/phase-07/coverage-report.md` に 3 ファイル × 4 metrics の実数値が記録されている（Phase 11 で更新）
- [ ] 例外申請がある場合、本ファイルの「例外記録」セクションに理由付きで記述されている
- [ ] redaction-guard の 5 pattern × hit/non-hit × 10 ケースが全て branch coverage に寄与し、redaction 関連の例外申請が 0 件である
- [ ] `pnpm typecheck` / `pnpm lint` green
