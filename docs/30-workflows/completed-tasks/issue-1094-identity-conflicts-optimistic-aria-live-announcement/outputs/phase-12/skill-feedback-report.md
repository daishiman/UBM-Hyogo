# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 改善点なしでも出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。
> 本タスクは local 実装・source-level evidence まで完了。skill 本体へ即時昇格すべき gate 変更はないが、aiworkflow-requirements の current fact と artifact inventory へ同期する。

---

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| row-local → page-level 集約パターンの記述ガイド | 「発火源 = row / 読み上げ先 = 親の単一 region」へ責務を移す UI a11y 改善は、(a) 単一 live region wrapper の所有権、(b) row 側の announce 呼び出し + 1回固定 ref、(c) provider 外 no-op fallback、の 3 点を必ず spec 化する必要がある。Phase 2 設計テンプレに「state 所有権テーブル（region / row / pure module）」を必須化すると drift が減る | 既存 Phase 2「責務境界 / 状態所有権」観点で吸収可能。row-local → page-level 集約は汎用パターンとして lessons 化候補（実装 close-out 時） |
| live region の append-children パターンの定型化 | 連続 announce の競合回避は「単一 region への append-children（各 message を個別 child・TTL 自動除去）」が確立パターン（react-aria LiveAnnouncer 類似）。`announce()` 副作用 + TTL timer 集約（Map）+ unmount 全 clear をひとまとまりの定型として記述すると、UI a11y タスクで再利用できる | aiworkflow-requirements の ui-ux 系 reference に「aria-live append-children 定型」を汎化候補として記録（実装 close-out 時） |

---

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| NON_VISUAL かつ a11y 挙動変更タスクの evidence 戦略 | SR の実読み上げは CI（ヘッドレス・SR 非搭載）で検証不可。NON_VISUAL の a11y タスクでは「(a) focused Vitest（DOM 構造 / announce 呼び出し / 非 focus-steal）= source-level PASS」+「(b) 手動 SR ノート（VoiceOver / NVDA）= 環境制約下の補助」の two-tier evidence を `manual-test-result.md` に**別カテゴリで分離記録**する運用が有効（WEEKGRD-01: source-level PASS と環境ブロッカーを混在させない） | 既存 NON_VISUAL evidence ルール（FB-04 / 「Phase 11 NON_VISUAL の証跡メタ」）で大枠は足りるが、「a11y 挙動（SR 読み上げ）は CI 検証不可 → two-tier」を NON_VISUAL の下位分類として明示する余地あり |
| Server Component が client wrapper に children を渡す Next.js App Router パターンの記述ガイド | `page.tsx`（Server Component）を client 化せず、新規 client wrapper（live region provider）で `<ul>` を囲み children を渡す構成は、client 境界を wrapper に閉じ data fetch を Server に残す確立パターン。**phase template にはこの「Server→client children で client 境界を最小化する」記述ガイドが無かった**ため、wrapper 配置・client 化範囲・data fetch 残置の 3 点を Phase 2 設計に明示する欄を設けると、Next.js App Router タスクで client 化範囲の判断が安定する | Phase 2 設計テンプレに「client 境界配置（Server→client children）テーブル」を追加候補として記録（汎化候補） |

---

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| identifier drift 防止 | implementation-guide の識別子を SSOT から引用し、実装後に実コード grep / typecheck / focused tests で照合する運用が drift 防止に有効 | 既存 W1-02b-3 で吸収可能 |
| docs→code 再判定 | implementation target が明確な場合、`spec_created` で閉じず local 実装・focused evidence・same-wave sync へ昇格する必要がある | 既存 CONST_004 / CONST_005 と同一。今回の改善で適用済み |

---

## 総括

SKILL.md 本体へ即時昇格すべき新ルール（gate / policy）は検出されなかった。既存の implementation target physical existence gate / same-wave sync rule で今回の不整合は解消できた。体系化候補は以下:

- **row-local → page-level live region 集約パターン**: 単一 `aria-live="polite"` region を page wrapper に置き、row は context 経由 announce を1回だけ呼ぶ（focus を奪わない）。append-children で連続処理の競合・欠落を排除し、TTL（`ANNOUNCE_TTL_MS`）で child を自動除去。provider 外は no-op fallback で非破壊。
- **文言の単一導出**: `Record<Action, string>` map + `announcementFor(action)` でキー網羅性を型保証し、インライン三項分岐を関数化する。
- **NON_VISUAL a11y タスクの two-tier evidence**: focused Vitest（source-level）+ 手動 SR ノートを別カテゴリで記録（SR 実読み上げは CI 検証不可）。
- **Server→client children パターン**: Server Component を client 化せず client wrapper に children を渡し client 境界を最小化する。

既存の implementation target physical existence gate と same-wave sync rule は維持。aiworkflow-requirements の changelog / task-workflow-active / quick-reference / resource-map / artifact inventory へ同一サイクルで current fact を同期する。
