# Phase 3 成果物 — 設計レビュー (08a)

## 1. 目的

Phase 2 で確定した test architecture に対し、D1 mock 戦略の alternative 3 案を比較し、PASS-MINOR-MAJOR で 1 案を選定する。本タスクの test 体系は contract / repository / authz / type / lint / invariant の 6 軸で構成されており、D1 mock 方式が **速度・無料枠・本番互換性・実装コスト** の 4 観点を支配する。

## 2. alternative 3 案

| 案 | D1 mock 方式 | Forms API mock | 概要 |
| --- | --- | --- | --- |
| **A. msw 全面** | D1 binding を HTTP shim 経由で msw が intercept | msw | binding 呼び出し全体を HTTP 化し、mock の流儀を msw に統一 |
| **B. miniflare D1** | miniflare の D1 emulator (devDeps に既存) | msw or local | Cloudflare 公式エミュレータで本番に最も近い挙動 |
| **C. in-memory sqlite + msw (Forms のみ)** | better-sqlite3 `:memory:` または既存 `fakeD1.ts` | msw | D1 = local (sqlite or fakeD1) / Forms = msw のハイブリッド |

## 3. 評価マトリクス

| 観点 | A (msw 全面) | B (miniflare D1) | C (sqlite + msw) |
| --- | --- | --- | --- |
| 速度 (1 spec 平均 ms) | ✕ HTTP 経路で遅い (200ms+) | △ miniflare 起動コスト (起動 1〜3s × suite) | ◎ in-memory (10〜50ms) |
| 無料枠 (CI 時間) | △ msw shim メンテ + HTTP 経路で suite > 5min 懸念 | △ miniflare ブート × parallel suite で時間増 | ◎ 単 process で完了 |
| 本番互換性 | ✕ binding semantics が崩れる | ◎ 公式エミュレータ | △ D1 固有 SQL (JSON1 / fts5) は sqlite ビルドフラグで対応 |
| 実装コスト | ✕ 全 binding を HTTP 化する shim 新規 | △ miniflare 起動 wrapper 必要 | ◎ 既存 `fakeD1.ts` / `__fixtures__` を流用 |
| 既存資産活用 | ✕ fakeD1 / __fixtures__ を捨てる | △ 一部再利用 | ◎ 全面活用 (Phase 2 §4) |
| 不変条件 #1 (extraFields) 観測 | ◎ msw で生 payload | ◎ msw 併用可 | ◎ msw 併用 |
| 不変条件 #6 (lint boundary) | 中立 | 中立 | 中立 |
| msw 既知バグ・将来性 | △ msw 2.x の WHATWG fetch 依存 | ○ | ○ |
| デバッグ容易性 | ✕ shim 階層深い | △ miniflare ログ独特 | ◎ stack trace がシンプル |
| 並列 CI 実行 | △ port 衝突注意 | ✕ miniflare 起動コストで並列性低下 | ◎ プロセス内完結 |

凡例: ◎ 優, ○ 良, △ 可, ✕ 不可

## 4. 不変条件適合度

| 不変条件 | A | B | C |
| --- | --- | --- | --- |
| **#1** schema 固定しすぎない | 同等 (msw) | 同等 (msw 併用) | 同等 (msw 併用) |
| **#2** responseEmail system field | 同等 | 同等 | 同等 |
| **#5** 3 層分離 | 同等 (authz は middleware test) | 同等 | 同等 |
| **#6** apps/web → D1 直 import 禁止 | 同等 (lint で実装) | 同等 | 同等 |
| **#7** 論理削除 | 同等 | ◎ 本番 SQL 完全互換で最も厳密 | ○ sqlite で確認可 (deleted_at) |
| **#11** profile 編集 endpoint なし | 同等 (route test) | 同等 | 同等 |
| **無料枠** | △ | △ | ◎ |

不変条件の適合度に大差はないが、**速度 / 無料枠 / 既存資産** で C が支配的優位。

## 5. PASS-MINOR-MAJOR 判定

### 採用案: **C (in-memory sqlite + msw)**

#### PASS
- AC-1〜7 全てを達成可能 (Phase 1 §4 と整合)
- Phase 2 §4 の既存資産 (`fakeD1.ts`, `__fixtures__/*`, `tests/fixtures/forms-get.ts`) を全て流用
- CI 時間 ≤ 5 min を狙える (in-memory + 単 process)
- secret hygiene OK (msw は Forms 経由で secret 不要、sqlite は env なし)

#### MINOR
1. **D1 固有 SQL 対応**: JSON1 / fts5 など sqlite 拡張を必要とする場合、`better-sqlite3` の build option `--build-from-source --enable-fts5 --enable-json1` で吸収。または既存 `fakeD1.ts` で SQL を抽象化する path を採用。Phase 5 runbook に `pnpm setup:test-db` を整備する。
2. **fakeD1 vs better-sqlite3 の選択**: 既存 `fakeD1.ts` は手書き fake で SQL parser を持たない。`schemaDiffQueue` / `tagQueue` 等の複雑クエリは sqlite の方が確実。**Phase 5 で「単純 CRUD は fakeD1、複雑クエリは sqlite」のハイブリッドを許容**する。
3. **msw 2.x の Workers 環境互換**: `apps/api` は Workers ランタイムを vitest 上で direct import するため、msw の global fetch 介入が問題ないことを Phase 5 spike で確認 (5 分で済む簡単な検証)。
4. **brand 型 type-check**: `vitest --typecheck` を有効化する場合、CI 時間が +30% 程度増加する。typecheck を別 job に分離するかは Phase 4 で判断。

#### MAJOR
- **なし**

## 6. 採用理由要約

C を採用する根拠は以下 3 点に集約される。

1. **既存資産の最大活用**: Phase 1 §3 で確認した `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` と `__fixtures__/{admin,members,d1mock}.ts`、および 15 件の既存 `repository/__tests__/*.test.ts` を全て破棄せず継承できる。A 案は破棄、B 案は半分破棄。
2. **無料枠制約への適合**: GitHub Actions 無料分・Cloudflare 無料枠を超過しない設計が CLAUDE.md ポリシー。in-memory + 単 process の C が最も短時間で完了。
3. **不変条件適合度に有意差がない**: 表 §4 が示す通り 6 不変条件いずれも 3 案で適合する。ならば運用容易性が支配的に優位な C を選ぶのが合理。

## 7. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| sqlite が D1 固有 SQL を解釈できない | Phase 5 で SQL ごとに fakeD1 / sqlite を選択。複雑クエリは Phase 11 smoke で実 D1 (staging) と diff |
| msw が Workers fetch を intercept できない | Phase 5 spike で 1 contract test を実装し intercept 可否を確認。NG なら local fixture (apps/api/tests/fixtures/forms-get.ts) に fallback |
| typecheck で CI 時間が伸びる | type-check を `api-tests-typecheck.yml` 別 job に分離 (Phase 4 で判断) |
| brand 型違反 test の `@ts-expect-error` を将来削除される | lefthook pre-commit で `@ts-expect-error` 行数を監視 (将来の Phase 8 で検討) |

## 8. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | C 案前提で verify suite signature を生成 |
| Phase 5 | runbook (`pnpm setup:test-db`, fakeD1 / sqlite 選択基準) |
| Phase 7 | AC × C 案実装 × 不変条件のトレース |
| Phase 11 | smoke 実行ログ + coverage evidence |

## 9. 完了条件チェック

- [x] alternative 3 案 (A / B / C) を §2-3 で列挙・table 化
- [x] PASS-MINOR-MAJOR 判定を §5 に記録 (採用 C / PASS + MINOR 4 件 / MAJOR 0)
- [x] 不変条件適合度マトリクス §4
- [x] 採用案確定 (**C**)
- [x] リスクと緩和策 §7

## 10. 次 Phase 引き継ぎ

- 採用案 **C (in-memory sqlite + msw)** で Phase 4 verify suite を設計
- MINOR 4 件 (sqlite ビルドフラグ / fakeD1 vs sqlite ハイブリッド / msw Workers 互換 spike / typecheck 分離) は Phase 4-5 で対応
- MAJOR なし → Phase 2 戻しは不要
