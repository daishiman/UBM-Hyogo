# Phase 3: 設計レビュー

[phase-2.md](../phase-2/phase-2.md) の設計を 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、Phase 4 への進行可否を判定する。

## 3.1 真の論点

本タスクの主問題は「410 の検出や区別」ではない。それは先行 WF（PR #1194 の `MEMBER_SESSION_410` 専用分岐・`data-cause="session-410"`）が既に解決している。
**真の論点は「410 を区別表示した後の次アクション欠如」**である:

- 会員側: 区別はされているが文言が曖昧（「利用状態を確認できませんでした」）で、提示される唯一の操作が無意味な「再読み込み」。**何が起きたか（退会済み）と、誰に何を頼めばよいか（運営への問い合わせ）と、今どこへ行けるか（公開トップ）**が提示されていない。
- 管理者側: 案内の終着点である管理者にも UI 上の復元手段がなく、実装・テスト済みの restore API が宙に浮いている（`restoreMember` live 使用 0 件が傍証）。

設計はこの論点に正対している: C1 は「事実の明示 + 人間への導線 + 退避先」の 3 点セットへ写像を変え、C2 は既存 API への最後の 1 マイル（ボタン配線）だけを埋める。**新しい仕組みを作らず、行き止まりの両端を既存資産で接続する**構図であり、課題定義と解法の射程が一致している。

## 3.2 4条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ✅ PASS | 退会済み会員の混乱（曖昧文言 + 無意味な再試行）と管理者の運用不能（UI 復元手段なし）を同時に解消する。audit `admin.member.restored` は API 側で記録済みのため、復元操作の説明責任も自動的に担保される |
| 実現性 | ✅ PASS | C1 は純関数の戻り値変更のみ（`SectionError` の表示能力は既存で充足・コンポーネント非接触）。C2 は同ファイル内に完全な前例（`NotificationOptOutToggle`: useAdminMutation + onUpdated patch + disabled=isLoading）があり、復元 API は contract test 済み。技術的未知数がない |
| 整合性 | ✅ PASS | 不変条件と全て整合: apps/api 非接触（AC-7）/ useAdminMutation 経由（#10・AC-4）/ FormField 対象外の根拠明記（#9: input を増やさない）/ memberId 新規露出なし（#11・AC-8: 新規ログ・レスポンス出力ゼロ。memberId は既存表示範囲の endpoint パスにのみ使用）/ `var(--ubm-*)` のみ（AC-9）/ `data-cause` 維持で既存 DOM 診断契約を壊さない（AC-2） |
| 運用性 | ✅ PASS | エラーパスは hook 内蔵処理（toast / login redirect / in-flight ガード）へ委譲し独自エラー UI を増やさない＝保守面の分岐が増えない。404 を成功に倒さない（`treat404AsSuccess` 不使用）・POST 非冪等で自動 retry 不可（型レベル拒否）という hook の安全側設計をそのまま享受する。confirm はネイティブ dialog で追加保守ゼロ |

## 3.3 依存関係・責務境界レビュー

| 観点 | レビュー結果 |
|------|-------------|
| C1 ↔ C2 の独立性 | 完全独立（共有コードなし・別ファイル・別テスト）。片方の実装失敗がもう片方をブロックしない。Phase 5 でどちらから着手してもよい |
| 状態所有権 | `detail` は MemberDrawer 親が唯一の所有者。`MemberRestoreButton` は `isLoading`（hook 由来）以外の状態を持たず、`isDeleted` を複製しない。`onUpdated` patch 方式は `MemberPublishSwitch` / `NotificationOptOutToggle` と同一で、第 3 のパターンを導入しない |
| API 契約依存 | restore API のレスポンス `{id, restoredAt}` は表示に使わず（toast は固定文言）、200 であることのみに依存 → API レスポンス shape 変化への耐性が高い |
| page.tsx / SectionError 非接触の妥当性 | `mapProfileSessionErrorToDisplay` の戻り値だけで After 表示が成立することを props 契約（`actionHref && actionLabel` / `retryHref` 条件描画）で確認済み。非接触判断は妥当 |
| 401 経路との非干渉 | `/profile` の 401 は `AuthRequiredError` rethrow → redirect（page.tsx:57-73）であり 410 分岐より前段。C1 変更は 401 経路に到達しない（AC-3） |

## 3.4 指摘事項と解消（MINOR 2 件・BLOCKER 0 件）

### MINOR-1: `restoreMember`（`apps/web/src/lib/admin/api.ts:85`）との二重経路懸念

**指摘**: web 側には restore 用の関数 `restoreMember` が既に定義されており、今回 `useAdminMutation` で直接 endpoint を叩く設計を加えると、同一 API への到達経路がコード上 2 つ並存する。実装者が `restoreMember` を `mutationFn` として渡す折衷案を選ぶと、hook の timeout / abort / 401 redirect が効かない経路（`mutationFn` 経路はそれらが非適用）になり劣化する。

**解消（決定記録）**: **`useAdminMutation(endpoint, "POST", ...)` の直接 fetch 経路を正とし、`restoreMember` は非接触（使用しない・削除もしない）**。根拠: (1) 不変条件 #10 の正規経路は hook であり、同ファイル内の全 mutation（tags / photo / notification-pref）が同形式で統一されている、(2) `restoreMember` は live 使用 0 件で BulkActionBar.spec のモジュール mock のみが参照しており、削除はテスト改修を伴うスコープ拡大になる、(3) 二重「実装」ではなく「未使用定義の残存」であり、現状記録（Phase 1 §2.2-7）と本決定記録で将来の実装者が迷わない。`restoreMember` の整理は本タスクの AC に影響しないため対象外とする。

### MINOR-2: DELETED セクション既存文言とボタンの自己矛盾

**指摘**: 既存文言「復元する場合は管理者にお問い合わせください。」は閲覧者が管理者本人である admin drawer 内では元々ねじれており、復元ボタンを直下に置くと明確に自己矛盾する（「問い合わせください」の真下に実行ボタン）。

**解消（決定記録）**: 文言を「この会員は論理削除されています。下のボタンから復元できます。」へ差し替えることを **C2 のスコープ内**と明確化した（Phase 2 §2.4 反映済み）。変更対象ファイルは増えず（同一 JSX ブロック内）、index.md の変更対象表とも矛盾しない。

## 3.5 リスク確認（残リスクと受容判断)

| リスク | 受容判断 |
|--------|---------|
| `globalThis.confirm` は jsdom/happy-dom 環境で未 stub だと例外や暗黙 false になりうる | Phase 4 で `vi.spyOn(globalThis, "confirm")` の stub を必須 mock として設計済み。本番はブラウザネイティブで問題なし |
| toast 検証はテストで ToastProvider が無いと hook が noop fallback する | Phase 4 §4.3 で ToastProvider ラップ（または successMessage オプションの単体検証）を設計し、AC-5 の検証可能性を確保 |
| 文言変更による既存テストの RED | 意図された RED（CC-1 / page.spec の 410 ケースが旧文言をアサート中）。Phase 4 で更新対象として列挙済みであり、想定外破壊ではない |

## 3.6 判定

**GO — Phase 4（テスト作成）へ進む。**

- BLOCKER: 0 件
- MINOR: 2 件（いずれも本 Phase 内で決定記録済み・設計へ反映済み）
- 設計は AC-1〜AC-10 の全てに対応する実装手段を持ち、不変条件への抵触がない。

## 参照資料

- [phase-1.md](../phase-1/phase-1.md) — AC・スコープ・現状分析
- [phase-2.md](../phase-2/phase-2.md) — レビュー対象の設計
- [index.md](../../index.md) — 不変条件 1〜8・変更対象ファイル表
- `apps/web/src/lib/admin/api.ts:85`（MINOR-1 対象）/ `apps/web/src/features/admin/hooks/useAdminMutation.ts`（mutationFn 経路の制約根拠）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:285-287`（MINOR-2 対象文言）

## 実行タスク

- [x] 真の論点（410 区別後の次アクション欠如）を特定し、設計が論点に正対しているか検証した（§3.1）
- [x] 4 条件（価値性 / 実現性 / 整合性 / 運用性）で設計を評価した（§3.2）
- [x] 依存関係・状態所有権・非接触判断の妥当性をレビューした（§3.3）
- [x] MINOR 指摘 2 件（restoreMember 二重経路 / 文言自己矛盾）を起票し、決定記録として解消した（§3.4）
- [x] 残リスクの受容判断を記録した（§3.5）
- [x] Phase 4 進行判定（GO）を下した（§3.6）

## 完了条件

- [x] 4 条件すべてが PASS 評価で、根拠が明文化されている
- [x] BLOCKER 指摘が 0 件である（MINOR は解消済み決定記録あり）
- [x] 指摘の解消が Phase 2 設計または Phase 4 テスト設計へ反映されている
- [x] GO/NO-GO 判定が明示されている

## 成果物

- 本ドキュメント（`outputs/phase-3/phase-3.md`）: 設計レビュー（真の論点 / 4 条件評価 / 依存・責務境界レビュー / MINOR 指摘 2 件と解消 / GO 判定）
