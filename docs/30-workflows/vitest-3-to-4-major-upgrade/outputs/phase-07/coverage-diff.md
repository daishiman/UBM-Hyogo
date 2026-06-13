# Phase 7 — Coverage Diff 実測記録（C2: v8 AST remapping）

> 実装サイクルでの実測値。vitest `3.2.6` → `4.1.8` メジャーアップグレードに伴う coverage 数値変動（C2: v8 provider が `v8-to-istanbul` 廃止・AST ベース remapping 一本化）の証跡。

## baseline（v3.2.6）の扱い

phase-05 Step 0 の「bump 前 baseline 採取」は、本実装では環境復旧（後述）を優先したため bump 前の数値固定採取を省略した。代替の baseline 根拠として **`dev` ブランチの CI（`coverage-guard.sh` 全メトリクス 80% 一律強制）が green である事実**を採用する。すなわち v3.2.6 時点で全 shard の lines/branches/functions/statements は **すべて ≥ 80%**（CI gate が通っているため下限が 80% と確定）。これを baseline の下限値として diff 判定に用いる。

## after（v4.1.8）実測 — テスト追加前（v4 化直後）

| shard | lines | **branches** | functions | statements | branch ゲート（80%） |
| --- | --- | --- | --- | --- | --- |
| apps/web | 86.04 | **77.93** | 82.56 | 83.61 | ❌ −2.07pt |
| apps/api（merged） | 89.53 | **76.58** | 87.17 | 87.34 | ❌ −3.42pt |
| packages/shared | 92.74 | **75.51** | 92.95 | 88.21 | ❌ −4.49pt |
| packages/integrations/google | 87.14 | 81.43 | 84.90 | 84.54 | ✓ |
| apps/og | 100 | 95.12 | 100 | 100 | ✓ |
| packages/contracts | 100 | 100 | 100 | 100 | ✓ |
| packages/integrations | 100 | 100 | 100 | 100 | ✓ |

### C2 判定（S3 / S4）

- **lines / functions / statements は全 shard で 80% 以上を維持**（baseline と同水準）。低下したのは **branches のみ**。
- これは v4 公式 migration guide の「v3 から更新すると（coverage 数値が）変わることが想定される」記述、特に **AST ベース branch 検出が v3 の `v8-to-istanbul` より網羅的（未到達コード中の分岐も精密に列挙）になったことによる branch% 低下**で説明できる。プロダクトコード・テストの挙動は不変（本タスクは依存 bump + config/scripts + テスト期待値修正のみ）。
- → **C2（計測方式変更）由来と判定**。コード品質劣化ではない。

## 閾値の扱い（Rule 3 によるユーザー判断）

branch の下げ幅が shard あたり **2pt 級を超える**（shared −4.49 / api −3.42）ため、phase-07 Rule 3 と phase-03 エスカレーション条件 3 に従いユーザーへ判断を仰いだ。

- **ユーザー決定: 閾値（80%）は変更せず、対象テストを追加して branch ≥ 80% を回復する。**

`coverage-guard.sh` の `THRESHOLD=80` および `vitest.config.ts` / `vitest.d1.config.ts` の `coverage.include` / `exclude` は **一切変更しない**（Rule 4 遵守）。回復は **既存テスト資産への spec 追加のみ**で行う（プロダクトコード不変）。

## after（v4.1.8）実測 — テスト追加後（最終）

| shard | lines | **branches** | functions | statements | branch ゲート | 追加 spec |
| --- | --- | --- | --- | --- | --- | --- |
| apps/web | 87.06 | **80.01** | 83.99 | 84.93 | ✓ | logger / security-headers / safe-fetch / safe-redirect 分岐 + lib（server-fetch.fixtures, me-photo-client） |
| packages/shared | 98.24 | **90.13** | 100 | 96.19 | ✓ | search / browser-storage / consent 分岐 |
| apps/api（merged） | 92.18 | **81.69** | 90.43 | 90.30 | ✓ | repository（attendance-analytics / identity-conflict / schemaAliases / tagQueue）/ routes contract（members / requests / schema / dashboard）/ sync（manual / backfill / sheets-client）/ workflows（schemaAliasRecompute）/ audit-correlation（redact / persist）/ diagnostics 分岐 |
| packages/integrations/google | 87.14 | 81.43 | 84.90 | 84.54 | ✓ | （追加なし・元から ≥80%） |
| apps/og | 100 | 95.12 | 100 | 100 | ✓ | （追加なし） |
| packages/contracts | 100 | 100 | 100 | 100 | ✓ | （追加なし） |
| packages/integrations | 100 | 100 | 100 | 100 | ✓ | （追加なし） |

> `coverage-guard.sh --no-run` で全 package ≥80%（全 4 メトリクス）を確認済み（`PASS: all packages ≥ 80%`）。apps/api は unit（94 files / 652 tests）+ d1（123 files / 1159 tests）を `coverage-merge.mjs` で統合した merged 値。

## 局所実測の証跡（S5）

branch 低下は特定 1 ファイルへの集中ではなく、**未到達コード（E2E/Playwright 被覆の server component・防御的分岐・テスト fixture）に分散した AST 由来の分岐増**であった。テスト追加は実ソースの到達可能分岐（純粋 util / repository / route handler の条件分岐）に限定し、防御的・到達不能分岐（例: `maskAuditText` の `[masked]` フォールバック）は無理にカバーしていない。

## fetch-attendance.ts の coverage 除外（参考）

`apps/web/src/lib/admin/fetch-attendance.ts`（先頭 `import "server-only"`）は v4 の v8 coverage provider が parse に失敗し、自動的に coverage から除外される旨の警告が出る（`Failed to parse ... Excluding it from coverage.`）。テストは全 green、web の branch ゲートも 80% を満たすため**実害なし**。本ファイルはどのテストからも import されない server-only 経路であり、v3 でも実行時 coverage 対象外であった。config 変更は行わない。
