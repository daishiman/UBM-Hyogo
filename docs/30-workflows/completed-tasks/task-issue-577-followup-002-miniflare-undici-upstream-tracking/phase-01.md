# Phase 1: 要件定義

## 真の論点

1. **軸B（`--maxWorkers=1 --minWorkers=1`）が恒久解として固定化するリスク** — Issue #577 で `EADDRNOTAVAIL` 抑制のため worker cap を 1 に絞ったが、これは症状抑制であり、上流（Miniflare / undici / workerd）が socket pool / keep-alive / port reuse を改善した瞬間に worker cap を緩和する義務がある。追跡経路が無いと「軸B = 恒久解」として記憶が固定化し、CI 時間問題が解決済み扱いとなる。
2. **上流改善検知の能動的経路が存在しない** — Dependabot / Renovate は version bump を通知するが、changelog 中に socket pool 関連の改善が含まれるかまでは判定しない。triage キーワードベースの月次手動チェックが現実解。
3. **A/B で誤って flaky 設定を採用するリスク** — 1 回だけ green でも採用すると、後日 CI 上で flaky 化する。連続 3 回 PASS / 0 EADDRNOTAVAIL を採用条件にする。
4. **「上流改善が出たら別タスク化」という先送りの誘惑** — CONST_007 で禁止する。今回サイクルで現時点の releases を必ず triage し、結論を出す。

## AC 確定

index.md で定義した AC-1〜6 を本 phase で正式採択する。各 AC は検証手段付き断定形:

- AC-1: 追跡 repo / キーワード / 頻度が markdown 固定
- AC-2: 直近 release を `gh api` で triage 表記録
- AC-3: 改善なし時は package.json 未変更 evidence
- AC-4: 改善あり時は連続 3 回 vitest evidence で 133/133 PASS / 0 EADDRNOTAVAIL を採用根拠
- AC-5: secret hygiene grep 0 件
- AC-6: 不変条件 #5 / apps/api ロジック / D1 schema 不変確認

## 不変条件 trace

| # | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| #5（中心） | D1 直接アクセスは `apps/api` 経由のみ | 本タスクは package.json scripts 編集のみで D1 binding に触れない |
| CONST_002 | commit/push/PR は user 指示前は禁止 | Phase 13 は user 明示承認後のみ実行 |
| CONST_007 | 1 サイクル完了 / 先送り禁止 | 改善検知時は今回サイクルで A/B 完了させる。「別タスク化」しない |
| aiworkflow-requirements | Cloudflare runtime / Workers binding 仕様不変 | 本タスクは vitest 設定のみ対象 |

## artifacts.json metadata 確定

- `metadata.taskType = "implementation"`（条件付きで package.json 編集が発生する可能性）
- `metadata.implementationCategory = "conditional"`
- `metadata.docs_only = false`
- `metadata.visualEvidence = "NON_VISUAL"`（CLI evidence のみ）
- `metadata.workflow_state = "spec_created"`
- `metadata.evidence_type = "triage_table_and_optional_ab_logs"`

## スコープ最終確認（CONST_007）

- 含む: 追跡フロー定義 / 直近 release triage / 改善検知時 A/B 評価 / 採用or維持結論
- 含まない: 上流 PR / apps/api コード変更 / D1 変更 / 検知時の別タスク化先送り
- **先送り禁止**: 改善検知時は今回サイクル内で A/B evidence 取得まで完遂する

## 次フェーズへの引き継ぎ事項

Phase 2 では (a) 追跡対象 repo の正式リスト、(b) triage キーワード 6 件、(c) 月次 + メジャー更新 trigger、(d) triage 表 template を設計する。

## 完了条件

- [x] AC-1〜6 を採択
- [x] 不変条件 trace 確定
- [x] CONST_007 先送り禁止を明記
