---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-06
task_id: issue-1102-usedismissable-hook-extraction
issue: 1102
issue_state: CLOSED
visual_category: NON_VISUAL
---

# スキル改善フィードバック — issue-1102-usedismissable-hook-extraction

> 本タスク（`useDismissable` hook 抽出の実装仕様書作成）で得た知見を、
> 観点別（テンプレート改善 / ワークフロー改善 / ドキュメント改善）に提案として記録する。
> **skill 本体への反映は本 wave では行わない**（spec 作成のみ）。
> 改善提案は実装 close-out wave または skill メンテナンス時に採否を判断する。

---

## 1. テンプレート改善（task-specification-creator）

| ID | 提案 | 背景・効果 |
| --- | --- | --- |
| FB-T-01 | **YAGNI 見送り → rule of three 成立の再判定トリガーを追跡する仕組み** | issue #1102 は起票時「再利用先 1 箇所のみ＝rule of three 未到達」で early abstraction を見送り、follow-up として温存された。その後 `DensityToggle` で 2 箇所目が出現し着手トリガーが成立した。spec テンプレに「YAGNI で見送った抽出は、後続で N 箇所目の重複が出たら自動的に着手可能化する」旨の再判定ステップ（Phase 1 調査時に `rg <重複パターン>` で現在の重複数を再カウント）を明示すると、温存された follow-up の着手タイミングを取りこぼさない |
| FB-T-02 | **cross-feature hook の配置先（feature 配下 vs `src/hooks/`）判断基準の明文化** | 本タスクでは shell（`SidebarUserMenu`）と public（`DensityToggle`）の 2 feature にまたがる dismiss ロジックを `apps/web/src/hooks/useDismissable.ts`（feature 非依存の共通 hook 置き場）へ配置した。判断基準は「2 つ以上の feature が消費する純粋 UI util は `src/hooks/`、単一 feature 専用は feature 配下」。この cross-feature 判定基準を skill テンプレに記すと、配置先の手戻り（feature 配下に置いて後で移動）を防げる |
| FB-T-03 | **`onClose(reason)` で複数 consumer の挙動差を吸収する設計パターンの登録** | 2 consumer の挙動差（DensityToggle のみ Escape 時に summary へ focus 復帰）を、hook 内に条件分岐を持ち込まず `onClose(reason: DismissReason)` のコールバック引数で呼び出し側に委譲することで、hook を単一責務（検知 → 通知）に保ったまま consumer 差分を吸収できた。「共通化対象に微妙な挙動差がある場合は、差分を callback 引数（reason / context）で呼び出し側へ押し出す」設計パターンとして skill の抽出ガイドに登録すると、過剰な options 肥大化を防げる |

## 2. ワークフロー改善（aiworkflow-requirements / Phase 運用）

| ID | 提案 | 背景・効果 |
| --- | --- | --- |
| FB-W-01 | **behavior-preserving refactor では「既存 spec の無改修回帰」を最強証跡として運用に固定** | 本タスクは挙動完全不変リファクタ（NON_VISUAL）であり、`SidebarUserMenu.spec.tsx` / `DensityToggle.client.spec.tsx` を**一行も改修せず全パス**することが「挙動が変わっていない」最も強い証跡となる。Phase 11 が NON_VISUAL で実 screenshot を持てないケースでは、この「既存 spec 無改修回帰」を代替証跡の第一級項目として運用ルール化すると、証跡の説得力が安定する |
| FB-W-02 | **元 unassigned-task を「消費せず参照保持」する独立 root の扱いを明文化** | 本 root は issue #1102 を正本 trigger とする独立 workflow であり、親 WF 配下の unassigned-task を物理 consume（移動/削除）せず `source_unassigned_task` として参照のみ保持した。「issue trigger 起点の独立 root は、親 WF の unassigned-task を物理消費しない（親 WF の close-out 管轄を侵さない）」という境界をワークフロー運用に明記すると、close-out の責務衝突（兄弟 session 間の巻き戻し事故）を予防できる |

## 3. ドキュメント改善

| ID | 提案 | 背景・効果 |
| --- | --- | --- |
| FB-D-01 | **不変条件 I-5（browser API 入口の単一化）の参照導線を抽出仕様に常設** | dismiss 系 hook は `document.addEventListener` を直接触りがちだが、本リポジトリでは `browserDocument()`（`apps/web/src/lib/is-browser.ts`）経由が不変条件（I-5: SSR / Workers 安全・null で no-op）。UI hook 抽出系の spec には「browser API は必ず `browserDocument()` 経由」を冒頭の不変条件に常設すると、SSR 安全性の取りこぼしを防げる |
| FB-D-02 | **配置参考ファイル（既存 hook）を spec の参照欄に明示する慣習** | 本 spec は `apps/web/src/hooks/useImeSafeInput.ts` を配置・構造の参考として参照欄に明記した。新規 hook の spec に「同階層の既存 hook を構造リファレンスとして 1 件挙げる」慣習を持たせると、コーディング規約（命名 / export 形式 / テスト配置）の一貫性が保たれる |

---

## 4. 本 wave での skill 本体反映ステータス

| 対象 skill | 反映 | 備考 |
| --- | --- | --- |
| task-specification-creator | **本 wave 反映なし** | FB-T-01/02/03 は提案として本レポートに記録のみ。本体改変は skill メンテナンス時に採否判断 |
| aiworkflow-requirements | **本 wave 反映なし** | FB-W-01/02 は提案記録のみ。実装 close-out wave で artifact-inventory / LOGS / changelog を同期予定 |

> 本タスクは `implemented_local_evidence_captured` まで反映済み。skill 本体への改変は行わないが、aiworkflow discoverability は同 wave で同期した。
> 改善提案の skill 反映は本 wave のスコープ外（実装 close-out wave または skill メンテナンス時に対応）。
