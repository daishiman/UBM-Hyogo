# Phase 3: 設計レビュー（Phase 4 進行可否ゲート）

> workflow: mypage-prototype-alignment

## 3.1 不変条件適合チェック

| 不変条件 | 設計上の遵守点 | 判定 |
|----------|----------------|------|
| #1 既存 API のみ | GET /me, /me/profile + POST visibility/delete-request のみ。新規 endpoint・PATCH なし | ✅ PASS |
| #2 本文編集 UI 非描画 | 編集は RevalidateModal → Google Form リンクのみ。`<input>`/`<textarea>` 本文編集なし | ✅ PASS |
| #3 OKLch tokens | 全 component が tokens class 経由。HEX 直書き設計なし。verify-design-tokens gate | ✅ PASS |
| #4 prototype 正本 + 新規 primitive ゼロ | 既存 `ui/` primitives のみ合成。新規は合成 component のみ | ✅ PASS |
| #5 D1 直接禁止 | fetchAuthed 経由のみ。adapter は web 層の純粋関数 | ✅ PASS |
| #6 stableKey 経由 | pickProfileSummary / ProfileFields は stableKey 参照 | ✅ PASS |
| #7 consent キー統一 | publicConsent / rulesConsent のみ | ✅ PASS |
| #8 test suffix | 全新規テスト `*.spec.{ts,tsx}` | ✅ PASS |

## 3.2 設計レビュー観点

### 価値性
会員が「自分が今どう公開されているか（status banner + visibility 件数）」「どこから更新するか（RevalidateModal）」「公開ページの見え方（公開ページを見る）」を1画面で把握できる。現状の bare HTML は情報はあるが認知負荷が高く、ユーザー体感「編集画面がない」の主因を解消する。

### 実現性
- 全 primitives 既存・全データ既存レスポンス内 → 1サイクルで完了可能（CONST_007）。
- 新規ファイルは合成 component + 2 純粋関数のみ。実装ボリュームは中規模。

### 整合性
- 状態所有権が Server（データ）/ client（Modal open）で明確分離。
- VisibilitySummary の件数は導出値で state 不要 → stale 問題なし。
- 「公開ページを見る」の publishState 連動が唯一の条件分岐 → Phase 4 で 3 値（public/member_only/hidden）テスト必須。

### 運用性
- verify-design-tokens + Playwright smoke で回帰保護。
- API 不変のため contract test（`me/index.contract.spec.ts`）への影響なし。

## 3.3 リスクと対策

| リスク | 対策 | Phase |
|--------|------|-------|
| `editResponseUrl` が null（取得中）の経路 | RevalidateModal「フォームを開く」は `editResponseUrl ?? fallbackResponderUrl` で常に有効リンク。disabled 文言は出さない | Phase 4/5 |
| sections に displayName 用 stableKey が無い | pickProfileSummary は欠損時 空表示（例外を投げない） | Phase 4/5 |
| 「公開ページを見る」の publishState 別挙動漏れ | Phase 4 で public→有効リンク / member_only・hidden→aria-disabled の 3 ケース必須 | Phase 4 |
| MemberHeader 既存テスト（data-testid）破壊 | data-testid="member-header" と既存リンクを維持して拡張 | Phase 4/5 |
| AttendanceList の扱い未確定 | **決定: 既存のまま維持し、最小 Card ラップのみ**（視覚整備は本タスクでは深追いせず、未タスク化候補へ） | Phase 2 確定 |
| Stat の grid レイアウト（grid-3） | tokens の grid class（既存 `grid-3` 相当）を使用。無ければ globals.css の既存 utility を確認 | Phase 5 |

## 3.4 未確定事項の確定（エスカレーション不要レベル）

| 事項 | 確定内容 |
|------|----------|
| RevalidateModal を client にするか | Yes（open state 保持）。EditCta.client に内包 |
| 「公開ページを見る」リンク先 | `/members/[memberId]`（個別公開ページ）。memberId は session 由来 |
| MemberHeader「公開ページ」リンク先 | `/members`（一覧）。個別は ProfileHeader の「公開ページを見る」が担当 |
| Avatar editable | 非対応（API 無し）。size="xl" の表示のみ |
| AttendanceList | 既存維持 + 最小 Card ラップ |

## 3.5 ゲート判定

**判定: PASS — Phase 4 へ進行可**

- 全不変条件 PASS。
- 設計の4条件（価値性 / 実現性 / 整合性 / 運用性）すべて充足。
- 残リスクは Phase 4/5 のテスト・実装で吸収可能なレベル。エスカレーション事項なし。
- 編集モデルはユーザー確認済（プロトタイプ準拠 / 2026-05-23）。
