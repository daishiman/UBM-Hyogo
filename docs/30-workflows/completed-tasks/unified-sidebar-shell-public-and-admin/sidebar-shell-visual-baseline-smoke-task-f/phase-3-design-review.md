---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 3
phase_name: 設計レビュー
created_at: 2026-05-29
---

# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## 1. レビュー観点と判断

| # | 観点 | 判断 | 根拠 |
|---|------|------|------|
| R1 | source task のパス（`apps/web/tests/e2e/`）をそのまま採用するか | **採用しない**。`apps/web/playwright/tests/sidebar-shell/` へ補正 | `apps/web/tests/e2e/` は `staging-smoke.spec.ts` のみで E2E 正本は `apps/web/playwright/tests/`。path topology gate（phase-1 §7） |
| R2 | smoke を専用 project にするか既存 project に相乗りするか | **専用 `sidebar-shell-smoke` project を追加**（chromium / local webServer） | 既存 `smoke-chromium` は `full-smoke.spec.ts` 専用 testMatch。相乗りは責務が混ざるため分離。CI matrix へ独立追加可能 |
| R3 | mobile viewport を fixture の 390×844 にするか task-F の 375×812 にするか | **375×812 を採用**（task-F 明示値を正本） | task-F が screenshot 名 `*-375.png` と明記。VIEWPORTS fixture との差分は本 spec 専用 project の `use.viewport` で吸収し、fixture は変更しない |
| R4 | visual を staging baseline にするか local にするか | **local（`mockApi` + auth fixture）** | shell 全体の構造 regression が対象で、role 別データは mock で固定可能。staging 依存を増やさない（不変条件 #7）。Task E（admin-staging-visual）とは別系統 |
| R5 | `toHaveScreenshot` 引数に `/-1280.png` のようなパス区切りを含めるか | **含めない**。`home-1280.png` 等へ正規化 | 引数の `/` は snapshot dir 階層を割り、`-linux.png` 正本配置が不安定化する |
| R6 | role × viewport の全 9 組合せを撮るか task-F の 7 点だけにするか | **7 点のみ**（member は desktop のみ） | task-F 表に準拠。不要撮影で baseline 数を膨らませない |
| R7 | `data-testid` が親 Task A-E に無い場合の扱い | Phase 5 着手時に親 spec へ同一 wave で attribute 追加を申し送り | shell component は親 `spec_created` で未実装。selector 契約を Task F 側で勝手に増やさず親と整合させる |
| R8 | collapse 状態の localStorage キー | 親 Task A（shell primitive）/ Task E の design に従う（`session.isAdmin` 同様、独自再定義しない） | 不変条件: 状態 owner を Task F で新設しない |

---

## 2. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| 親 Task A〜E の未完 / 統合遅延 | Phase 10 ゲートで「Task A-E 完了・統合済」を着手条件として明示。未完なら着手しない |
| 親 shell の `data-testid` 未定義で selector が壊れる | Phase 5 着手時に実 attribute を確認し、不足は親 spec へ同一 wave 申し送り（R7） |
| mockApi seed が shell 表示に必要な GET を network 上カバーしない | 既存 seed（`buildMember`/`buildStats`/`defaultAttendanceSeed`）で不足する応答を Phase 5 で追加（mutation には触らない） |
| baseline の OS 差（macOS dev で撮ると diff） | `-linux.png` 正本・macOS 撮影分は commit しない（不変条件 #1） |
| bot baseline push 後の required check 未発火 | 空コミット再トリガー（user-gated）を Phase 5/13 に明記 |
| visual spec が local default project でも走り baseline 重複 | `desktop-chromium` / `visual-chromium` の testIgnore に visual spec を追加（phase-2 §7） |

---

## 3. 既存 asset との関係

- 新規ファイルのみ（spec 2 + helper 1）。既存 spec の削除・統合は無し（Task E と異なり置換対象なし）。
- `playwright.config.ts` は project 追加 + testIgnore 追記のみ（既存 project は不変更）。
- `playwright-smoke.yml` は job 追加 / matrix 拡張のみ。
- auth fixture（`auth.ts`）/ viewports fixture は**変更しない**（再利用のみ）。

---

## 4. 設計 GO 判定

- AC-1〜AC-8 が Phase 4/5/9 で検証可能な形に落ちている。
- パストポロジ・fixture 差分が phase-1 §7 / 本 phase R1・R3 で補正済み。
- 1 サイクル完結（CONST_007）：実装は Task A-E 完了後だが、仕様は本サイクルで全 Phase 完備。先送りタスク無し。
- → **設計 GO**。Phase 4 以降へ進む。
