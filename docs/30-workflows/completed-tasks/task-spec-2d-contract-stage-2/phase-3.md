# Phase 3: 設計レビュー（4-condition gate）

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 3 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 4-condition gate

| # | 条件 | 判定 | 根拠 |
|---|------|------|------|
| 1 | 矛盾なし | PASS | Phase 1 受け入れ基準と Phase 2 設計 §3 import map が 7 endpoint で 1:1 整合。spec 内 schema 再定義は CONST_007 で禁止し、route/shared import に統一。 |
| 2 | 不変条件適合 | PASS | 不変条件 8 件すべて Phase 2 設計で吸収。新 endpoint 追加 0、D1 schema 変更 0、`apps/web` 依存 0、`z.object(` 0、skip 0、shared 昇格は別 PR、単一サイクル完結。 |
| 3 | スコープ閉 | PASS | Out of scope（Phase 1 §4）に E2E 本体・新 endpoint・cascade preview・integration test・shared 昇格を明示。pure unit に限定。 |
| 4 | 依存解決 | PASS | shared schema は既存、route 側 named export 化は本 PR 内で完結（+1 行 × 3 ファイル）。外部 task / 並列 sub-task への着手前依存なし。2a/2b/2c の fixture 整合は CI 上で 2d が drift 検知する後発確認。 |

---

## 2. レビュー観点別チェック

| 観点 | 結果 | コメント |
|------|------|---------|
| 命名 | OK | `contract-stage-2.test.ts` は既存 `audit-correlation/__tests__/contract.test.ts` の命名規約に整合 |
| testability | OK | pure unit、binding mock 不要、5s timeout で十分 |
| 影響範囲 | minimal | route 3 ファイル各 +1 行（既存呼び出し非破壊の別名 re-export） |
| 既存 import 破壊 | なし | `ListQueryZ` / `QueryZ` の元 const はそのまま、末尾で別名 re-export を追加 |
| 性能 | 影響なし | CI test job 内で +0.5s 程度の追加実行 |

---

## 3. 想定リスクと軽減

| リスク | 軽減策 |
|--------|--------|
| `MergeIdentityResponseZ` shape 補正が 2b spec と乖離する | Phase 12 で 2b 仕様書側に「fixture は §5 標準形に揃える」と明記 |
| 行数 200-260 超過 | fixture inline literal を `as const` で簡潔化、共通 helper は導入しない |
| `adminRequestResolveBodySchema` の barrel export 路 | Phase 5 実装時に `packages/shared/src/index.ts` を grep で確認 |

---

## 4. Gate 判定

**条件付き PASS → Phase 4 へ進む。**

条件: `artifacts.json` / Phase 12 strict 7 / aiworkflow same-wave sync / 2a-2c fixture 注記が本 workflow 内で実行可能に記載されていること。これらが欠落した状態では全体 4 条件 PASS と扱わない。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| gate | 4-condition gate |

## 目的

設計を 4 条件で確認し、実装に入る前に root artifacts、Phase 12 strict outputs、aiworkflow sync、fixture 正本の未定義を閉じる。

## 実行タスク

1. Phase 1/2 の AC と import map を照合する。
2. 2a/2b/2c fixture と shared schema の同期リスクを確認する。
3. Phase 12 strict 7 と aiworkflow same-wave sync が計画に含まれることを確認する。
4. PASS 表現を条件付きにし、未実行 evidence を runtime PASS と混同しない。

## 参照資料

- `artifacts.json`
- `phase-1.md`
- `phase-2.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- 4-condition gate 判定
- 条件付き PASS の根拠
- Phase 4 へ渡す blocker 0 件の確認

## 完了条件

- [x] 矛盾なし / 漏れなし / 整合性あり / 依存関係整合を確認している
- [x] Phase 12 / aiworkflow / artifacts の未定義が残っていない
- [x] fixture 同型性の保証範囲と限界を記載している
- [x] タスク100%実行確認: Phase 3 の実行タスクをすべて完了してから Phase 4 へ進む

## 統合テスト連携

本 Phase はレビュー gate であり実行ログは生成しない。Phase 4 以降の focused Vitest / grep gate が本 gate の設計判断を検証する。
