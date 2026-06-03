# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056） |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-06-02 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |

## 目的

Phase 2 設計を代替案と比較し、PASS / MINOR / MAJOR を判定して Phase 4 以降の着手可否ゲートを通す。本タスクは read-only 検知のため安全性の論点は小さく、レビュー焦点は「既存資産との整合」「parser の堅牢性」「CI 配置の妥当性」「scope の 1 サイクル完結性」。

## 代替案比較

| 案 | 概要 | 採否 | 理由 |
| --- | --- | --- | --- |
| A（採用） | `binding-policy-drift.ts` 新設 + `loadExpected` 再利用 + `cf.sh alerts binding-drift` + PR validate job | **採用** | 既存資産再利用・read-only・secret 不要・1 サイクル完結。`cf.sh alerts` 正本経路に同型追加 |
| B | 既存 `diff.ts` の `Drift` 型を拡張し `cmdDiff` に統合 | 不採用 | 突合軸（宣言 vs デプロイ）が異なり混線。`cmdDiff` は Cloudflare API を呼ぶため local-only にできず secret 必須化 |
| C | 完全独立な `scripts/cf-binding-alert-drift.mjs` を新設 | 不採用 | policy JSON 読込・canonical 化を `load.ts` から再実装する重複。`cf.sh alerts` 体系から外れ発見性低下 |
| D | CI gate 化を follow-up に分離（issue 原文の第一候補） | 不採用 | local-only で secret 不要のため PR job 追加コストゼロ。CONST_007（先送り禁止）に反する |
| E | TOML ライブラリで wrangler 解析 | 不採用 | コメント block を捨て active/commented を区別不能。ALERT_DEDUP_KV 判定が成立しない |

## レビュー指摘

| # | 観点 | 重大度 | 指摘 | 対応 |
| --- | --- | --- | --- | --- |
| R1 | parser 堅牢性 | MINOR | テーブルヘッダ後にコメント binding 行が続く場合、currentKind は維持されるが行が skip され収集されない（意図通り） | テストケース（f）で `# binding = "ALERT_DEDUP_KV"` が inactive になることを保証 |
| R2 | policy 不在 | MINOR | mapping 上の policy が `policies/` に存在しない場合 `enabledByName.get` は undefined | `?? false`（disabled 扱い）で吸収。active 時 MONITORING_GAP として顕在化し気付ける |
| R3 | env 横断集約 | MINOR | production は active / staging は commented のような env 非対称時の扱い | quota は account 単位のため「いずれかで active なら active」で集約（Phase 2 で確定） |
| R4 | 既存 diff 排他性 | PASS | `BindingPolicyDrift` は `Drift` と別型・別サブコマンド・別 exit 経路 | 混線なし。`cmdBindingDrift` は `loadActual` を呼ばない |
| R5 | read-only | PASS | `setAlertTokenMode` / write API / `op` を呼ばない | CLI 設計と型で保証。CI は `--ci` でも apply 不可 |
| R6 | baseline | PASS | 現状コードで drift 0（KV inactive+disabled / R2 active+enabled） | Phase 1 現状コード分析テーブルで確認済。CI 初回 green |
| R7 | CI 配置 | PASS | local-only のため secret 不要 PR job に置け、全 PR 強制可能 | `validate` job（`if: pull_request`）に step 追加で実現 |

## 4 条件評価（再確認）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 単一検証点の新設 + 将来 drift の CI 捕捉 + green baseline |
| 実現性 | PASS | 既存 `load.ts` 再利用・純関数 + line parser・secret 不要。先例（cf.sh alerts 体系） |
| 整合性 | PASS | 不変条件 #5/#8 遵守。既存 diff と排他。read-only |
| 運用性 | PASS | exit code 規約踏襲・1 コミット粒度 revert・UT-17-followup-006 へ責務委譲 |

## 着手可否判定

- MAJOR: **0 件**
- MINOR: 3 件（R1/R2/R3 — いずれもテストケースと `?? false`・集約規則で吸収済み）
- 判定: **着手可（Phase 4 以降へ進行可能）**

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 代替案 A〜E が比較され A 採用の根拠が記録されている
- [x] レビュー指摘 R1〜R7 が重大度付きで列挙され対応が記述されている
- [x] MAJOR 0 件で着手可と判定されている
- [x] 4 条件が全 PASS で再確認されている

## タスク100%実行確認【必須】

- 代替案 5 件・指摘 7 件が `outputs/phase-03/main.md` と一致
- MAJOR 0 件の着手可ゲートが通過
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項: MINOR 3 件（R1/R2/R3）をテストケースへトレース、着手可
- ブロック条件: なし（MAJOR 0）
