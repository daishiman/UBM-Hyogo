# Phase 11: 手動テスト / VISUAL

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | Phase 11（手動テスト / VISUAL 視覚 evidence） |
| task type | **VISUAL**（merge 成功時に row が fade out して消える視覚変化を伴う） |
| route | `/admin/identity-conflicts` |
| 対象 component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| evidence 方針 | **two-tier**: (1) local jsdom render + focused Vitest / (2) local Playwright screenshot captured |
| screenshot capture | **captured**（local admin identity conflicts fixture で Phase 11 screenshots 3 PNG 保存済み） |

## 目的

本タスクで導入する「optimistic row 消失の fade / collapse animation」は **DOM の有無・opacity・レイアウトの視覚的変化** を伴う VISUAL 区分である。
text assertion だけでは「fade を経て安定状態へ消えた」「rollback で復元した」という操作体感を担保できないため、視覚 evidence の取得計画を確定する。

local Playwright fixture で admin route と identity-conflict SSR データを供給し、本フェーズでは以下の two-tier evidence 戦略を正本とする。

| tier | evidence | 役割 | 本サイクルでの状態 |
| --- | --- | --- | --- |
| **tier 1（主証跡）** | local jsdom render + focused Vitest（Phase 4/6 のケース） | exiting → removed 遷移 / rollback での exiting キャンセル / reduced-motion 即時 / success-stays-removed を component-local に検証 | 取得済み（focused Vitest 13/13 PASS） |
| **tier 2（補強）** | local Playwright screenshot 3 枚 | fade 後の安定状態・rollback 復元の視覚状態遷移を固定 | 取得済み（desktop 8/8 PASS、3 PNG captured） |

> 親 #988 は「即時 `return null`」を前提に screenshot を取得した。本タスクで挙動が「fade 後の安定 removed」へ変わるため、#1043 自身の canonical screenshot 名を新設し、意味 drift を `phase11-capture-metadata.json` の注記で防止する（後述 §MINOR-2）。

## 実行タスク

### 1. VISUAL 区分の宣言

本タスクは **VISUAL タスク**である（`NON_VISUAL` ではない）。
- **根拠**: merge 二段階 confirm 完了直後に該当 row が fade out（opacity 減衰 + 任意 scale collapse）して一覧から消え、fade 完了後に DOM から除去される。server error 時は exiting を解いて row を復元し inline error（`role="alert"`）を表示する。これらは視覚的状態遷移であり screenshot 補強が望ましい。

### 2. ブラウザ smoke（capture 起点の確認）

| 手順 | 内容 |
| --- | --- |
| 1 | staging で `/admin/identity-conflicts` を認証済みセッションで開く |
| 2 | identity conflict row が 1 件以上表示されること（conflict / source / target / email mask が読める） |
| 3 | merge 二段階 confirm（merge → 次へ → merge 理由 → 「merge 実行」）まで遷移できること |
| 4 | 上記が成立した状態を capture 起点とする |

> route が開けない / row が存在しない場合は capture を行わず、データ準備（conflict seed）を先行する。本サイクルでは local fixture で route と row を供給し capture 済み。

### 3. screenshot canonical 3 点（撮影状態定義）

命名は `<component>-<state>.png` 形式。phase spec / `screenshot-plan.json` / `phase11-capture-metadata.json` / implementation-guide で **同一の canonical 名**を用いる。配置先は `outputs/phase-11/screenshots/`。

| # | canonical ファイル名 | 撮影状態（どの相を撮るか） | 対応 TC / AC |
| --- | --- | --- | --- |
| 1 | `identity-conflict-row-exiting-fade.png` | **exiting 相**: 「merge 実行」click 直後、row が fade out 途中／開始の可視状態（opacity 減衰中・DOM 残存）。fade の進行が視認できる中間状態 | TC-VIS-01 / AC-1 |
| 2 | `identity-conflict-row-removed-stable.png` | **removed 相**: fade 完了後、該当 row が DOM から除去され、一覧レイアウトが崩れない安定状態 | TC-VIS-02 / AC-2・AC-4 |
| 3 | `identity-conflict-row-rollback-restored.png` | **rollback 相**: server error で exiting がキャンセルされ row が復元、inline error（`role="alert"`）が表示された状態 | TC-VIS-03 / AC-3 |

### 4. Playwright の安定待ち手順（flaky 防止）

animation 中の不確定タイミングでは screenshot を撮らず、**stable locator state を待ってから**撮影する。

| 撮影対象 | 待機条件 | 備考 |
| --- | --- | --- |
| `identity-conflict-row-exiting-fade.png`（exiting） | merge response を遅延 mock（例: 500ms）して exiting 相を意図的に滞留させ、row が detach する前の可視状態で撮る | exiting は本質的に過渡的。response 遅延で可視窓を確保する。撮れない環境では tier 1（jsdom isExiting class 検証）を主証跡とする |
| `identity-conflict-row-removed-stable.png`（removed） | `await expect(row).toHaveCount(0)` で row が DOM から完全 detach したことを待ってから撮る | fade 完了後の安定状態。`toHaveCount(0)` がアニメ完了の同期点 |
| `identity-conflict-row-rollback-restored.png`（rollback） | `await expect(row.getByRole('alert')).toContainText(...)` で error alert locator の出現を待ってから撮る | exiting キャンセル + 復元の安定点。error alert の可視を同期点とする |

> **設計判断**: removed は `toHaveCount(0)`、rollback は error alert locator を同期点とすることで、CSS transition の実時間に依存せず安定撮影できる（jsdom の transitionend 非発火制約とは別に、Playwright 実ブラウザでは実 transition が走るため、count/locator state を待つことで flaky を排除する）。

### 5. reduced-motion 検証観点

| 観点 | 内容 | 対応 |
| --- | --- | --- |
| reduced-motion 抑制 | `prefers-reduced-motion: reduce` 環境で transition-duration ≈ 0 となり、視覚上ほぼ即時に row が消える（旧 `return null` 同等体感） | AC-5 / tier 1 vitest（reduced-motion 即時ケース）で検証。Playwright では `page.emulateMedia({ reducedMotion: 'reduce' })` で再現可能（撮影は任意・user-gated） |
| removed 遷移保証 | reduced-motion 下でも timeout fallback により removed へ確実に遷移する | tier 1 vitest（fake timers）で fallback を検証 |

### 6. 3層評価観点

| 層 | 評価観点 | 対応 screenshot |
| --- | --- | --- |
| **Semantic（意味）** | exiting 相が「処理中（pending）」ではなく「確定的に退場していく」と読めること。removed 後に list が意味的に欠落しないこと。rollback 後 row の role/aria が復元前と同一であり error が `role="alert"` であること | #1（exiting）/ #2（removed）/ #3（rollback） |
| **Visual（視覚）** | fade は OKLch トークン配色を変えず opacity / transform のみで成立し、HEX 直書き・inline `style` を含まないこと（`verify-design-tokens` gate 準拠）。removed 後にレイアウト崩れがないこと。inline error が danger トークンで視認できること | #1・#2・#3 |
| **AI UX（操作体感）** | fade が控えめ（200ms 程度）で連続 row 処理時に「どの row を処理したか」の視覚的手がかりになること。reduced-motion 配慮で過度な動きを強制しないこと。rollback で迷子にならないこと | #1（手がかり）/ #3（復帰可能性） |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 確定設計（state machine） | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` | 3 相 state・timer 二重化・reduced-motion 3 重保証・canonical 命名 |
| 既存 Playwright | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 安定待ち（`toHaveCount(0)` / `getByRole('alert')`）・遅延 mock パターン |
| 兄弟 VISUAL テンプレート | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-11/` | VISUAL phase 構造の踏襲元（即時削除版 screenshot） |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch token 正本（HEX 直書き禁止根拠） |

## 成果物

| 成果物 | path | 役割 |
| --- | --- | --- |
| 本 phase 仕様 | `outputs/phase-11/phase-11.md` | VISUAL 区分・two-tier evidence・canonical 3 点・安定待ち手順 |
| screenshot 計画 | `outputs/phase-11/screenshot-plan.json` | `mode: "VISUAL"` / canonical 3 shots |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` | 各 screenshot の state/tc + #988 drift 注記 + captured status |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | tier 1/2 証跡（focused Vitest + local Playwright screenshot） |
| ビジュアルレビュー | `outputs/phase-11/ui-sanity-visual-review.md` | VISUAL 宣言 + Apple HIG motion 観点 + 3層評価 |
| screenshots（実体） | `outputs/phase-11/screenshots/*.png`（3 枚） | **captured** |

## 統合テスト連携

- tier 1（主証跡）: Phase 4/6 の focused Vitest（`IdentityConflictRow.spec.tsx`）で exiting/removed/rollback/reduced-motion/success-stays-removed を検証。
- tier 2（補強）: Phase 8 の Playwright（`admin-identity-conflicts.spec.ts`）で `toHaveCount(0)` / error alert locator を同期点に screenshot を取得済み。
- canonical 名は本 phase / screenshot-plan / capture-metadata / Phase 12 implementation-guide / Phase 13 で完全一致させる。

## 完了条件（Phase 11）

- VISUAL 区分を宣言し、two-tier evidence（tier 1 = focused Vitest + jsdom / tier 2 = local Playwright screenshot captured）を確定した。
- screenshot canonical 3 点（exiting-fade / removed-stable / rollback-restored）の撮影状態を定義した。
- Playwright の安定待ち手順（removed は `toHaveCount(0)`、rollback は error alert locator を同期点）を明記し flaky 防止を担保した。
- reduced-motion 検証観点と 3層評価観点を確定した。
- #988 screenshot の意味 drift を metadata 注記で防止する方針を記録した（§MINOR-2 は capture metadata に記載）。
