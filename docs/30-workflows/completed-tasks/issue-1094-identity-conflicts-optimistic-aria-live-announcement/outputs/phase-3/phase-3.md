# Phase 3: 設計レビュー（Phase 4 進行可否判定）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| phase | 3（設計レビューゲート） |
| 入力 | `phase-2/phase-2.md`（設計） |
| 出力 | Phase 4 進行可否判定（PASS / BLOCKER / MINOR） |

## 目的

Phase 2 の設計が AC を満たし、責務境界・連続処理競合回避・timer 安全性・focus 撤去 a11y・design token gate・不変条件を破綻なく閉じているかをレビューし、Phase 4（テスト作成）への進行可否を判定する。

## 実行タスク

1. 設計妥当性を観点別にチェックする（§3.2）。
2. 既存コンポーネント再利用可否を判定する（§3.3）。
3. MINOR 指摘を抽出し Phase 8 / Phase 12 での扱いを確定する（§3.4）。
4. Phase 4 進行可否を結論づける（§3.1）。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 1 要件 | `../phase-1/phase-1.md` | AC 充足判定 |
| Phase 2 設計 | `../phase-2/phase-2.md` | レビュー対象 |
| SSOT 設計正本 | `../../index.md` | 設計事実の正本 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 再利用可否判定 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-3/phase-3.md` | 設計レビュー結果（PASS 判定 / BLOCKER 0 件 / MINOR 3 件と扱い） |

## 統合テスト連携

- §3.2 の「既存テスト回帰」観点が Phase 4 のテスト更新範囲（line 325-345 の focus-steal assertion）を確定する。
- §3.4 MINOR-3（Playwright SR 実検証 CI 不可）が Phase 11 の NON_VISUAL evidence 方針（focused Vitest + 手動 SR ノート）に連携する。

## 3.1 設計レビュー結論

| 判定 | 結果 |
| --- | --- |
| Phase 4（テスト作成）へ進行 | **可（PASS）** |
| BLOCKER | 0 件 |
| MINOR | 3 件（§3.4・未タスク化判断は Phase 12 で確定） |

## 3.2 設計妥当性チェック

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点に応えているか | ✅ | 「focus 奪取依存の row-local status → focus 不動の単一 region」を topology 分離で解決（§2.1）。AC-1 / AC-2 を構造的に満たす |
| 責務境界の整合 | ✅ | `messages`/`timers` = announcer 所有、`hasAnnouncedRef` = row 所有、文言 = pure module、wrapper 配置 = page。state 所有権が一意（§2.2） |
| 連続処理の競合回避 | ✅ | 単一 region 集約 + append-children で同一 tick 上書き / 文言 collapse を構造的に排除（§2.4・AC-3）。react-aria LiveAnnouncer 類似の確立パターン |
| 文言の単一導出 | ✅ | `announcementFor()` + `Record<IdentityConflictAction, string>` でキー網羅性を型保証（§2.3a・AC-4）。インライン三項を関数化 |
| timer 安全性 | ✅ | TTL timer を `Set`/`Map` で集約、TTL 到達・unmount の全経路で clear（§2.6）。複数 in-flight message に対応 |
| focus stealing 撤去 a11y | ✅ | `aria-live="polite"` は焦点不動の WAI-ARIA 標準用法。操作起点を保持し連続処理に適する（§2.5・AC-2） |
| rollback 非回帰 | ✅ | `role="alert"` inline error（248-257 / 296-305）は不変。撤去対象は row-local status node のみ（AC-5）。`hasAnnouncedRef` の rollback reset で再アナウンス可能化 |
| design token gate | ✅ | live region は `sr-only` のみ。HEX / inline style / 新規 token 追加なし → `verify-design-tokens` gate green（AC-8） |
| 不変条件遵守 | ✅ | #1（API 不変）/ #2（OKLch・HEX 禁止）/ #5（D1 直接禁止）/ #9（primitive 不増）/ #10（hooks 経由）すべて充足（§2.8） |
| 既存テスト回帰 | ✅（要更新明記） | line 325-345 の focus-steal assertion 更新方針と `renderWithAnnouncer` helper を §2.7 で確定。context fallback no-op で wrap なし render も非破壊 |
| Server→client children | ✅ | Next.js App Router の確立パターン。client 化が wrapper に閉じ、data fetch は Server 側に残る（§2.9） |
| NON_VISUAL 区分 | ✅ | 変更は sr-only region とアナウンス挙動のみで画面ピクセル変化なし。screenshot 不要・Phase 11 は NON_VISUAL evidence |

## 3.3 既存コンポーネント再利用可否

- **新規は最小**: ページレベル live region wrapper（`IdentityConflictAnnouncer`）と文言 pure module（`identityConflictAnnouncements.ts`）の 2 つのみ。視覚 primitive（Button / Badge / Textarea / Card 等）は一切増やさない。
- **新規 primitive を生やさない**: announcer は admin 範囲内の機能 component（live region 機構）であり、プロトタイプ primitive 体系への追加ではない。row / page の既存構造を維持し、row-local status node の撤去という **削減**が主。
- `useAdminMutation`（既存 hook）をそのまま使用。新規 hook は `useIdentityConflictAnnounce()`（context reader）のみで、これは announcer に同梱される薄い context accessor。
- → 既存資産再利用優先で a11y を既存レベル以上に引き上げつつ、surface 追加を最小化（不変条件 #9 整合）。

## 3.4 MINOR 指摘（Phase 12 で未タスク化判断）

| # | 指摘 | 扱い |
| --- | --- | --- |
| MINOR-1 | `ANNOUNCE_TTL_MS`（=1000ms）は「SR が 1 文を読み終える前に除去されないか」「連続処理時に child が積み上がりすぎないか」のトレードオフ値。長すぎると DOM が肥大、短すぎると読み上げ途中で消える可能性 | 既定 1000ms を採用。SR は live region 変化を即座にキューへ取り込むため child 除去後も読み上げは継続するのが一般的挙動。Phase 8 で実測・調整余地を確認。値変更は本タスク内で完結（先送りなし） |
| MINOR-2 | `aria-atomic` 未設定。各 message を個別 child として追加する構成では region 全体ではなく追加ノードが読まれるため `aria-atomic="false"`（既定）が望ましいが、明示設定の是非に余地 | 既定（`aria-atomic` 未指定 = false）を採用。append-children では「追加された差分ノードのみ読み上げ」が望ましく既定で正しい。Phase 8 で明示 `aria-atomic="false"` を付けるか可読性観点で判断（任意） |
| MINOR-3 | Playwright での screen reader 実読み上げ検証は CI 環境（ヘッドレス・SR 非搭載）で**実行不可**。Playwright で取得できるのは「単一 `aria-live` region の DOM 存在」「row-local status node 非存在」の構造的非回帰のみ | NON_VISUAL のため Phase 11 は (a) focused Vitest（announce 呼び出し / 非 focus-steal / 連続非競合 / TTL / rollback 非アナウンス）+ (b) 手動 SR 検証ノート（VoiceOver / NVDA での実読み上げ確認手順を `manual-test-result.md` に記録）の two-tier evidence で代替。Playwright は構造非回帰の軽微チェックのみ（任意・screenshot なし） |

> いずれも BLOCKER ではなく、設計の妥当性を覆さない。MINOR-1 / MINOR-2 は本タスク内（Phase 8）で完結し先送りしない。MINOR-3 は CI 制約に起因する evidence 戦略の整理であり、Phase 11 で two-tier 記録として吸収する。

## 完了条件（Phase 3）

- 設計レビューで BLOCKER 0 件、Phase 4 進行可（PASS）と判定した。
- 設計妥当性（topology / 責務境界 / 競合回避 / timer 安全性 / focus 撤去 a11y / rollback 非回帰 / token gate / 不変条件 / 既存テスト回帰 / Server→client children / NON_VISUAL）を観点別に確認した。
- 既存コンポーネント再利用方針（新規は announcer + pure module のみ・primitive 不増・row-local node 削減主体）を確定した。
- MINOR 3 件（TTL 調整余地 / aria-atomic / Playwright SR 実検証 CI 不可）を記録し、Phase 8 / Phase 11 / Phase 12 での扱いを確定した。
- index.md の SSOT と矛盾しないことを確認した。
