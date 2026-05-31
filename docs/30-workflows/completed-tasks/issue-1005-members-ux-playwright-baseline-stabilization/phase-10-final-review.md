<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 10 -->

[実装区分: 実装仕様書]

# Phase 10 — 最終レビュー

## 1. Phase 1-9 の整合性確認

| 観点 | 確認 |
| ---- | ---- |
| 根本原因 (RC-1..4) | Phase 1-3 で確定。RC-1 warm-up / RC-2 path drift / RC-3 冗長 project / RC-4 runtime-notes 文言 を Phase 8-9 で実装観点へ展開 |
| 変更範囲 | `playwright.config.ts` / `members-ux-clarity.spec.ts` の 2 ファイルのみ。INV-1 / INV-5 と整合 |
| 2 層防御 (RC-1) | config webServer ready URL `/members` 化 + spec `beforeAll` warm-up navigation の両方を維持 |
| 命名・配置整合 (Phase 8) | `isMembersUxClarityBaseline` を既存 `is*` 群へ整合、EVIDENCE_DIR 三項チェーンへ既存順序で追加 |

## 2. AC ↔ 成果物 対応表

| AC | 内容 | 充足根拠 |
| -- | ---- | -------- |
| AC-1 | cold start PASS | Phase 9 §1.1（`CI=1` cold start run） |
| AC-2 | 24 PNG spec 本体生成 | Phase 9 §1.2 / Phase 11 matrix table（12 test × 2 = 24 PNG） |
| AC-3 | 補正後 path 出力・旧 dir 非生成 | Phase 8 R-4/R-5 + Phase 9 §1.3 |
| AC-4 | 単一 project | Phase 8 R-2（flag gate）+ Phase 9 §1.4（`fixtureGatedTestIgnore`） |
| AC-5 | runtime-notes 補完不要証跡 | Phase 9 §1.4 / Phase 11 §5（runtime-notes.md 更新） |
| AC-6 | typecheck + lint GREEN | Phase 9 §1.5 |
| AC-7 | 既存 run 非回帰 | Phase 9 §1.5（既存 `is*` 分岐の挙動変更なし） |

## 3. Gate-B 通過前提条件

- Phase 4-11 完了（test plan / 実装 / coverage / refactor / qa / final-review / manual-test）。
- cold start で 24 PNG が spec 本体生成され、補正後 path に出力されること（implementation_review）。
- typecheck / lint GREEN、既存 run 非回帰が確認されていること。

## 4. 残リスク

| リスク | 対応方針 | Gate |
| ------ | -------- | ---- |
| staging visual baseline 撮影（Linux runner 正本） | Gate-C / user-gated。本サイクルでは macOS ローカル cold start evidence に留める | Gate-C |
| commit / push / PR (dev base) | user-gated。Phase 13 で PR 本文作成 | Gate-C |
| Issue #1005 state 変更 | OPEN を維持・変更しない（user-gated） | Gate-C |

## 5. 現状ステータス

- 本 workflow は **implemented_local_evidence_captured** 状態であり、実コード差分（`playwright.config.ts` / `members-ux-clarity.spec.ts`）を本サイクル内で反映済み。
- Phase 11 は `outputs/phase-11/manual-test-result.md` と completed parent workflow 側の 24 PNG / runtime-notes で PASS 証跡を保持している。

## DoD

- [ ] Phase 1-9 の整合性確認が記録されている
- [ ] AC-1〜AC-7 と成果物の対応表が配置されている
- [ ] Gate-B 通過前提条件が明記されている
- [ ] 残リスク（staging baseline は Gate-C / user-gated）が列挙されている
- [ ] implemented_local_evidence_captured 状態であり実差分と Phase 11 evidence が揃っている旨が明記されている
