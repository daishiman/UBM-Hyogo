# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: profile ページの参加履歴一覧 UI に対し、Server/Client Component 分離・state 管理・fetch ロジック・error UI を新規実装するため、コード変更を伴う実装仕様書として作成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | AttendanceList cursor paging UI (G4-1) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

`GET /api/me/attendance` の cursor paging に追従する profile ページ参加履歴 UI のスコープ・受入条件・論点を確定する。

## 真の論点

### 論点 1: 初回 fetch の責務配置（Server vs Client）

- **(A) Server Component (`profile/page.tsx`) で `/me/profile` default 50 件 fetch + props 渡し** — SEO / TTFB 良好。Client は初期 state を props から起こすだけ。**第一推奨**。
- **(B) Client Component 内で `useEffect` 初回 fetch** — hydration 後の loading 表示が必要・体感悪化。**不採用**。

→ **(A)** を採用。

### 論点 2: 追加読込のトリガー

- **(A) 明示的「もっと見る」ボタン** — ユーザー操作で fetch コストをコントロール。**第一推奨**。
- **(B) IntersectionObserver による無限スクロール** — スクリーンリーダー互換性低下・誤発火コストあり。**不採用**。

→ **(A)** を採用。

### 論点 3: cursor の取り扱い

- **(A) opaque string としてそのまま query に流す** — API 側で `encodeAttendanceCursor / decodeAttendanceCursor` が責務を持つ。フロントは内部構造を解釈しない。**第一推奨**。
- **(B) フロントで decode して再構成** — API 仕様変更で必ず壊れる。**不採用**。

→ **(A)** を採用。`encodeURIComponent` のみ実施。

### 論点 4: error 後の操作性

- **(A) error 表示 + button 再 enabled** — 一時的なネットワーク障害から再試行可能。**第一推奨**。
- **(B) error で button を完全 disable** — UX 悪化。**不採用**。

→ **(A)** を採用。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | `apps/api/src/routes/me/*` | `/api/me/attendance` の response shape は不変。改変禁止 |
| 上流 | `apps/web/src/lib/api/me-types.ts` | `MeAttendancePageResponse` 型追加のみ |
| 連携 | `apps/web/app/profile/page.tsx` | 初回 fetch + props 渡し |
| 対象 | `apps/web/app/profile/_components/AttendanceList.tsx` | 新規 Client Component |
| 対象外 | API ルート実装 | 既存利用のみ |
| 対象外 | D1 schema | 不変 |

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | ユーザーが過去全参加履歴に到達できるか | PASS | — |
| 実現性 | 既存 API surface のみで実装可能か | PASS | API 側に既に cursor 実装あり |
| 整合性 | Server/Client 境界・MVP recovery 不変条件と整合するか | PASS | OKLch tokens のみ使用 |
| 運用性 | error 復帰 / loading 表示が UX として妥当か | PASS | role="alert" + button 再 enable |

## 既存資産インベントリ

| 資産 | 確認結果 |
| --- | --- |
| `apps/api/src/routes/me/schemas.ts:123` | `nextCursor: z.string().nullable()` |
| `apps/api/src/routes/me/index.contract.spec.ts:352` | `decodeAttendanceCursor` 利用例 |
| `apps/web/app/profile/page.tsx` | Server Component、`fetchAuthed("/me/profile")` 実装済 |

## スコープ確定

### 含む

- AttendanceList Client Component 新規作成
- profile page の props 受け渡し変更
- `MeAttendancePageResponse` 型定義追加
- 「もっと見る」button + loading / error / empty UI
- unit test (Vitest) と profile smoke test 連携

### 含まない

- API endpoint 変更 / 新規追加
- 無限スクロール / IntersectionObserver
- D1 / Google Form schema 変更

## 用語集

| 用語 | 意味 |
| --- | --- |
| cursor | API が返す opaque base64url string。次ページ取得用キー |
| hasMore | API が返す boolean。次ページの有無 |
| Client Component | `"use client"` directive を持つ React component |
| opaque | 中身の構造をフロント側で解釈しないこと |

## 実行タスク

- [x] 原典 spec.md を読み込み、4 論点を明文化
- [x] 4 条件評価
- [x] 既存資産インベントリ
- [x] `outputs/phase-01/requirements.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物 |

## 完了条件

- [x] 4 論点が文書化
- [x] 4 条件評価が PASS
- [x] AC-1〜AC-9 を index.md で正式承認
- [x] downstream handoff を Phase 2 に明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 論点 1-4 の採用案 ((A)/(A)/(A)/(A)) を Phase 2 設計の前提として固定
