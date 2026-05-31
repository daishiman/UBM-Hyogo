# Phase 3: 設計レビュー（Gate-A） — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 0. 本 Phase の目的

Phase 2 の設計を Phase 4（テスト作成）へ進めてよいかを判定する設計レビューゲート（Gate-A）。
対象は `apps/web/src/lib/admin/server-fetch.ts` の untyped `throw new Error(...)`（line 530）を
`AdminFetchError extends Error` に置換し、`apps/web/src/lib/server-fetch/safe-fetch.ts` の status 抽出を
構造化優先 + 正規表現 fallback に強化する設計（NON_VISUAL）。

## 1. レビュー観点表（Gate-A 判定）

| # | 観点 | 評価基準 | 設計上の根拠（Phase 2 参照） | 判定 |
| --- | --- | --- | --- | --- |
| RV-1 | 責務境界（共通層の admin 非依存） | `safe-fetch.ts` が `AdminFetchError` を import しない。status は duck typing で読む | Phase 2 §2 注記 / §5「`AdminFetchError` を import しない（duck typing で `status` を読む）」 | **PASS** |
| RV-2 | message byte-identical 維持 | 4 ケース（body 短文 / 256+ / 空 / 読取失敗）で現状 message と一致。`binding.spec.ts:89/101` を満たす | Phase 2 §3.3 検証マトリクス | **PASS** |
| RV-3 | 二重 read 回避 | error path で `res.text()` を 1 回のみ。`Response.clone()` を導入しない | Phase 2 §4 注記「read 回数は現状と同じ 1 回」 | **PASS** |
| RV-4 | 命名規則の一貫性 | class=`AdminFetchError` / guard=`isAdminFetchError` / フィールド=`status`/`path`/`responseBodySnippet`。既存 `is*` guard 命名・`__tests__/*.spec.ts` 規約に整合 | Phase 2 §3.1 / 不変条件#8 | **PASS** |
| RV-5 | fallback 後方互換 | `STATUS_FROM_MESSAGE` 正規表現を削除せず維持。構造化 status 未提供の既存呼び出し（message-only Error）も従来 code を返す | Phase 2 §1 表 / §5 注記 | **PASS** |
| RV-6 | フィールドのスライス独立性 | message suffix=256 と `responseBodySnippet`=500 が独立スライスであり混同していない | Phase 2 §3.1 constructor / §3.3 | **PASS** |
| RV-7 | Workers bundling 耐性 | cross-module で `instanceof` が false 化する事故に対し `name === "AdminFetchError"` fallback を持つ | Phase 2 §3.1 `isAdminFetchError` | **PASS** |
| RV-8 | status 非整数防御 | `statusFromError` が `Number.isInteger` ガードで構造化 status を検証 | Phase 2 §5 `statusFromError` | **MINOR**（下記 M-1） |

## 2. 同サイクル改善点（設計最適化の記録）

| ID | 内容 | 元案 | 最適化後 | 理由 |
| --- | --- | --- | --- | --- |
| IMP-1 | `safe-fetch.ts` の status 取得方式 | followup-001 §3.1 step3 は `safe-fetch.ts` 内で `err instanceof AdminFetchError` を判定する案 | 共通層では `instanceof` を使わず **duck typing**（`typeof err.status === "number" && Number.isInteger(err.status)`）で読む | 共通層（public/admin 兼用）が admin 固有 class を import すると責務境界違反 + 循環 import 化。duck typing で admin 非依存を維持しつつ同じ status 抽出を達成。本サイクル内で設計に反映済み（Phase 2 §5） |
| IMP-2 | error path の body 表現 | 現状は `bodySnippet`（` body=...` 接頭済み文字列）を組み立てて throw | 生 `rawBody`（`""`/`null` を区別）を `AdminFetchError` に渡し、suffix 組み立ては class 内に集約 | message 生成ロジックを 1 箇所（constructor）に集約し byte-identical 検証を単一化。Phase 2 §4 で反映済み |

## 3. MINOR 指摘（Phase 12 未タスク化判定対象）

| ID | 指摘 | 重大度 | 同サイクル対応可否 | 扱い |
| --- | --- | --- | --- | --- |
| M-1 | `statusFromError` の `Number.isInteger` 防御は、現実の `fetch` `Response.status` は常に整数であり通常経路では発火しない。防御コードのままで実害はないが、対応する明示 TC（status=非整数 / NaN を持つ Error）が Phase 2 時点で未列挙 | low | **同サイクル対応**（Phase 6 で fail-path TC として補完する） | 同サイクル内で Phase 6 に取り込むため **未タスク化（Issue 化）不要**。Phase 12 unassigned-task-detection では「same-wave 内で解消済み」として記録する候補 |

> M-1 以外に MINOR / MAJOR 指摘なし。本サイクルで Issue 起票を要する残課題は現時点で 0 件（最終確定は Phase 12 detection で行う）。

## 4. 判定

**Phase 4 へ進行可（Gate-A PASS。本サイクルで実装・検証まで完了）。**

- 観点 RV-1〜RV-7 は PASS。RV-8 は MINOR（M-1）だが同サイクル（Phase 6）で TC 補完するため設計続行を妨げない。
- 本 workflow は `workflow_state = implemented_local_evidence_captured`。実装・focused tests・typecheck・lint は本サイクルで完了し、PR / staging runtime 観測のみ user-gated として残す。

## 完了条件（Phase 3）

- [x] レビュー観点表（責務境界 / message byte-identical / 二重read回避 / 命名一貫性 / fallback後方互換 ほか）を全て PASS/MINOR で評価
- [x] 同サイクル改善点（duck typing 最適化 IMP-1、body 表現集約 IMP-2）を記録
- [x] MINOR 指摘（M-1）を Phase 12 未タスク化判定対象として明記し、同サイクル対応方針を確定
- [x] 判定「Phase 4 へ進行可（Gate-A 条件付き PASS）」を明記
