# Phase 10: 最終レビュー（全 Phase 統合・AC 充足・リリース可否判定）

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の `spec_created` GO 判定は historical context。現在の GO 判定は `implemented_local_evidence_captured`。実コード・tests・CI gate・aiworkflow sync は完了し、commit / push / PR / Issue mutation / Cloudflare apply のみ user-gated。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-06-02 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / CLI 回帰検証) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（**現状 OPEN** のまま参照のみ・mutation user-gated） |

## 目的

Phase 1〜9 の成果を統合レビューし、AC-1〜AC-9 充足・4 条件 PASS・変更ファイル 7 件整合・read-only 不変条件・issue #1056 との要件マッピング・関連タスク（UT-17-followup-006 / #85 / #75 / #77）との責務境界を最終確認する。本ワークフローは `implemented_local_evidence_captured` であり、実コード・tests・CI gate・aiworkflow sync は完了、commit / push / PR / Issue mutation のみ user-gated としてリリース可否を判定する。

## 全 Phase 統合レビュー

| Phase | 名称 | 主成果 | 整合判定 |
| --- | --- | --- | --- |
| 1 | 要件定義 | AC-1〜AC-9 / 既存 drift 差分 / baseline 整合表（drift 0）/ 4 条件 PASS | PASS |
| 2 | 設計 | 型 + `BINDING_POLICY_MAP` + `parseActiveBindings` / `buildBindingPolicyDrift` / `loadActiveBindings` / `cmdBindingDrift` / 変更ファイル 7 件 | PASS |
| 3 | 設計レビュー | 代替案 A〜E（A 採用）/ 指摘 R1〜R7（MAJOR 0）/ 着手可 | PASS |
| 4 | テスト戦略 | テストケース (a)〜(f) の戦略 | PASS（仕様） |
| 5 | 実装ランブック | 変更ファイル 7 件の差分方針・コミット粒度 | PASS（仕様） |
| 6 | 異常系・回帰テスト拡充 | parser コメント/非コメント分岐・env 横断 | PASS（仕様） |
| 7 | AC / カバレッジマトリクス | AC × ケース双方向対応 / 純関数 branch 100% / 未カバー領域委譲 | PASS |
| 8 | DRY 化・リファクタリング | `load.ts` 再利用 / 別型分離 / over-abstraction 回避 / 命名一貫性 | PASS |
| 9 | 品質保証 | 11 品質ゲート / read-only 検証 / HEX 該当なし / CI 緑判定 | PASS |

## AC-1〜AC-9 充足確認

| AC | 内容（要約） | 充足根拠（Phase） | 判定 |
| --- | --- | --- | --- |
| AC-1 | binding kind ↔ policy 対応表が const + 棚卸し表に明文化 | Phase 2（`BINDING_POLICY_MAP`）/ Phase 7（AC-1 行）/ Phase 8（再利用 / 命名） | PASS |
| AC-2 | drift 2 種を read-only 純関数で列挙（mutation なし） | Phase 2（`buildBindingPolicyDrift`）/ Phase 9（QG-6 read-only） | PASS |
| AC-3 | コメント尊重 line parser・env 横断集約 | Phase 2（parser 状態機械）/ Phase 6（分岐）/ Phase 7（(e)(f)） | PASS |
| AC-4 | 現状 drift 0（green baseline） | Phase 1（baseline 表）/ Phase 9（QG-4 exit 0） | PASS |
| AC-5 | CLI `binding-drift [--json] [--ci]`・exit 0/2/64・API 非呼び出し | Phase 2（CLI 配線）/ Phase 9（QG-4/QG-5/QG-6） | PASS |
| AC-6 | 回帰 spec (a)〜(f) が `test:alerts` に含まれる | Phase 4 / Phase 6 / Phase 7（マトリクス）/ Phase 9（QG-3） | PASS |
| AC-7 | CI gate（PR `validate` job + wrangler.toml paths） | Phase 2（workflow 編集）/ Phase 9（QG-7） | PASS |
| AC-8 | `deployment-cloudflare.md` 対応表 + 責務境界追記 | Phase 2（変更ファイル #7）/ Phase 7（AC-8 行） | PASS |
| AC-9 | 4 条件全 PASS | Phase 1 / Phase 3 / 本 Phase | PASS |

## 4 条件 PASS 最終確認

| 観点 | 判定 | 最終根拠 |
| --- | --- | --- |
| 価値性 | PASS | binding 活性 ↔ policy enabled 整合の単一検証点を新設。将来 KV alert 運用開始時の有効化忘れを CI で機械捕捉し、現状に対し green baseline を確立 |
| 実現性 | PASS | policy `enabled` は既存 `loadExpected().policies` 再利用。binding 活性はコメント尊重 line parser。drift は純関数で 2 種列挙。Cloudflare API 不要で secret 障壁なし |
| 整合性 | PASS | 不変条件 #5（D1 境界）非接触 / #8（`.spec.ts`）厳守。既存 `Drift`（宣言 vs デプロイ）と別型・別サブコマンド・別 exit で排他。read-only |
| 運用性 | PASS | `cf.sh alerts {list,diff,apply}` 正本経路に `binding-drift` 同型追加。exit code 規約（0/2/64）踏襲。revert は追加分 1 コミット粒度。UT-17-followup-006 へ policy 有効化判断を委譲 |

## 変更ファイル 7 件 整合確認

| # | パス | 種別 | 対応 AC | 整合 |
| --- | --- | --- | --- | --- |
| 1 | infra/cloudflare-alerts/lib/binding-policy-drift.ts | 新規 | AC-1 / AC-2 / AC-3 | 型 + mapping + parser + drift 純関数 + IO helper |
| 2 | infra/cloudflare-alerts/lib/cli.ts | 編集 | AC-5 | `cmdBindingDrift` / `printBindingDrifts` + switch + usage（追加のみ） |
| 3 | infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts | 新規 | AC-6 | (a)〜(f)・`.spec.ts`（不変条件 #8） |
| 4 | scripts/cf.sh | 編集 | AC-5 | allowlist + usage に `binding-drift`（追加のみ） |
| 5 | package.json | 編集 | AC-5 / AC-6 | `cf:alerts:binding-drift` script（`test:alerts` glob は自動包含） |
| 6 | .github/workflows/cloudflare-alerts-drift.yml | 編集 | AC-7 | `validate` job step + paths（`diff` job 非接触） |
| 7 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 編集 | AC-8 | 対応表 + UT-17-followup-006 / #85 / #75 / #77 責務境界 |

> 変更は全件「新規追加」または「既存への追記のみ」。既存関数（`loadExpected` / `cmdDiff` / `diffPolicy` / `diff` job）への破壊的変更は 0 件（Phase 8 確認）。

## read-only 不変条件 最終確認

- `binding-policy-drift.ts` / `cmdBindingDrift` は `setAlertTokenMode` / `loadActual` / `fetch` / `op run` を呼ばない（Phase 9 QG-6 grep 0 件で担保予定）。
- `alerts apply` / Cloudflare write API / policy 有効化 / binding 追加を一切行わない（Phase 1 AC-2 / Phase 3 R5 PASS）。
- IO は `loadActiveBindings` の `apps/api/wrangler.toml` read と `loadExpected` の policy JSON read のみ（read-only）。
- CI `validate` job は secret 不要で実行（local-only）。

## issue #1056 との要件マッピング（issue 原文 Phase → 本 spec 写像）

| issue 原文 Phase | 内容 | 本 spec での写像 |
| --- | --- | --- |
| Phase 1（対応表整理） | binding kind ↔ alert policy 対応表の整理 | AC-1 / `BINDING_POLICY_MAP`（Phase 2）/ `deployment-cloudflare.md` 表（AC-8） |
| Phase 2（drift ロジック設計） | MONITORING_GAP / STALE_MONITORING の判定設計 | AC-2 / `buildBindingPolicyDrift`（Phase 2 判定ロジック） |
| Phase 3（検知手段決定） | script / CI gate のいずれで実行するか決定 | AC-5（CLI `cf.sh alerts binding-drift`）+ AC-7（CI `validate` job）。CONST_007 により両方を 1 サイクル完結（follow-up 分離せず） |
| Phase 4（責務境界確認） | UT-17-followup-006 / #85 / #75 / #77 との境界 | AC-8 / 下記責務境界表 |

> issue 原文は「設計のみ」の 4 Phase 構成だが、CONST_004 により目的（drift を検知する）達成にはコードが必須のため **実装仕様書** へ昇格（Phase 1 で確定）。issue アンカーは全て現行コード一致で陳腐化なし（index.md 調査結論）。

## 関連タスクとの責務境界 最終確認

| 関連タスク | 本タスクとの境界 | 重複なし根拠 |
| --- | --- | --- |
| UT-17-followup-006（KV alert policy 運用開始） | 本タスクは drift 検知のみ。policy の実 `enabled:true` 化判断は委譲 | 本タスクは mutation を持たず policy を有効化しない（AC-2） |
| #1054（wrangler 三者ドリフト gate） | 共に Issue #57 follow-up・棚卸し表入力だが突合軸が異なり独立 | 本タスク=alert policy `enabled` 次元 / #1054=env.ts 型次元 |
| 既存 `cloudflare-alerts diff` | 突合軸が異なる別ガード | 本タスク=binding 活性 vs policy enabled / diff=宣言 vs 実デプロイ。別型・別サブコマンド（Phase 3 R4） |
| #85 / #75 / #77（監視・アラート運用設定） | 本タスクは整合 drift 検知に限定。運用閾値・サイクル設計は委譲 | 本タスクは閾値・運用設計を持たない |

## リリース可否判定

| 判定軸 | 結果 |
| --- | --- |
| AC-1〜AC-9 | 全件 PASS |
| 4 条件 | 全 PASS（MAJOR 0） |
| 変更ファイル 7 件 | 全件整合（追加のみ・破壊的変更 0） |
| read-only 不変条件 | 充足（mutation / API / op 非呼び出し） |
| issue 要件マッピング | issue 原文 Phase 1〜4 を全件写像 |
| 責務境界 | UT-17-followup-006 / #1054 / 既存 diff / #85 / #75 / #77 と排他 |
| **総合判定** | **GO（implemented_local_evidence_captured）** |

> **判定**: 本ワークフローは `workflow_state=implemented_local_evidence_captured`。仕様（Phase 1〜13 + Phase 1〜3 設計成果物）と実コード変更は完成しており **local evidence captured として GO**。commit / push / PR / Issue mutation は**ユーザー承認待ち**（Phase 13）。issue #1056 は OPEN のまま据え置く（close / reopen は user-gated）。

## 実行タスク

1. Phase 1〜9 の成果を統合レビュー表で PASS 確認する（完了条件: 全 Phase 整合判定が表に存在）。
2. AC-1〜AC-9 充足を Phase 根拠付きで確認する（完了条件: 全 AC PASS）。
3. 4 条件 PASS / 変更ファイル 7 件整合 / read-only 不変条件を最終確認する（完了条件: 各表が存在し MAJOR 0）。
4. issue #1056 要件マッピング（原文 Phase 1〜4）と関連タスク責務境界を確認しリリース可否（GO）を判定する（完了条件: マッピング表 + 責務境界表 + GO 判定が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | AC / 4 条件 / baseline / issue state |
| 必須 | phase-02.md | 設計 / 変更ファイル 7 件 |
| 必須 | phase-03.md | 代替案 / 指摘 / MAJOR 0 |
| 必須 | phase-07.md | AC マトリクス / 未カバー領域 |
| 必須 | phase-08.md | DRY / 責務分離 / 命名 |
| 必須 | phase-09.md | 11 品質ゲート / read-only 検証 |
| 必須 | index.md | issue state / 調査結論 / Phase 一覧 |
| 参考 | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-09.md | レビュー表フォーマット参照 |

## スコープ

### 含む

- Phase 1〜9 統合レビュー
- AC-1〜AC-9 充足確認 / 4 条件 PASS 最終確認
- 変更ファイル 7 件整合 / read-only 不変条件確認
- issue #1056 要件マッピング / 関連タスク責務境界
- リリース可否（GO・implemented_local_evidence_captured）判定

### 含まない

- 追加の実コード変更（今回サイクルの実装済み 7 ファイルを越える範囲）
- commit / push / PR / Issue mutation（ユーザー承認待ち・Phase 13）
- GitHub Issue #1056 の状態変更（OPEN のまま）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 + CLI smoke 基準（AC-4 exit 0 / AC-5 exit code）を手動 smoke へ渡す |
| Phase 12 | AC 充足 / 責務境界を compliance-check / ドキュメント更新へ渡す |
| Phase 13 | リリース可否（GO・user-gated）を PR 作成判断へ渡す |

## 多角的チェック観点

- 全 Phase の成果が矛盾なく統合されているか。
- AC-1〜AC-9 が漏れなく PASS 根拠を持つか。
- read-only 不変条件が型 / CLI / CI の全層で保証されているか。
- issue 原文 4 Phase が漏れなく写像されているか。
- 関連タスクとの責務境界が排他で重複がないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | Phase 1〜9 統合レビュー | completed | 全 PASS |
| 2 | AC-1〜AC-9 充足確認 | completed | 全 PASS |
| 3 | 4 条件 / 変更ファイル / read-only 確認 | completed | MAJOR 0 |
| 4 | issue マッピング / 責務境界 / GO 判定 | completed | GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レビュー | （本 phase-10.md に内包。artifacts.json では別 main.md を持たない） | 統合レビュー / AC 充足 / 4 条件 / 変更ファイル整合 / read-only / issue マッピング / 責務境界 / GO 判定 |
| メタ | artifacts.json `phases[9].outputs` | 空配列（本 phase-10.md が正本） |

> **Automation-30 改善後の現行状態**: GO 判定は `implemented_local_evidence_captured`。user-gated は commit / push / PR / Issue mutation / Cloudflare apply に限定。

## 完了条件 (Acceptance Criteria for this Phase)

- [x] Phase 1〜9 が統合レビューで全件整合（PASS）と確認されている
- [x] AC-1〜AC-9 が Phase 根拠付きで全件 PASS と確認されている
- [x] 4 条件が全 PASS（MAJOR 0）で最終確認されている
- [x] 変更ファイル 7 件が AC に紐付き整合（追加のみ・破壊的変更 0）と確認されている
- [x] read-only 不変条件（mutation / API / op 非呼び出し）が最終確認されている
- [x] issue #1056 原文 Phase 1〜4 が本 spec に漏れなく写像されている
- [x] UT-17-followup-006 / #1054 / 既存 diff / #85 / #75 / #77 との責務境界が排他で確認されている
- [x] リリース可否が GO（implemented_local_evidence_captured・外部操作のみ user-gated）と判定されている

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `completed`
- artifacts.json で Phase 10 は別 output を持たないため、本 phase-10.md が正本
- AC-1〜AC-9 / 4 条件 / 変更ファイル 7 件 / read-only / issue マッピング / 責務境界が全て確認済み
- artifacts.json の `phases[9].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / CLI 回帰検証)
- 引き継ぎ事項:
  - GO 判定（implemented_local_evidence_captured）+ CLI smoke 基準（AC-4 exit 0 baseline / AC-5 `--json` exit code）
  - 実コード変更 7 件 / commit / PR / Issue mutation は user-gated（Phase 13）
  - issue #1056 は OPEN のまま据え置き
- ブロック条件:
  - AC のいずれかが未充足
  - read-only 不変条件に違反が残る
