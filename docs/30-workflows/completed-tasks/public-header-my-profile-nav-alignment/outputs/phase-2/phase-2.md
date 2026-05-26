# Phase 2: 設計

## メタ情報

| 項目   | 値                              |
| ------ | ------------------------------- |
| Phase  | 2 / 13（設計）                  |
| 依存   | Phase 1                         |
| 成果物 | outputs/phase-2/phase-2.md      |

## 目的

`PublicHeader` の sync テスト互換を保ったまま、公開層に「ログイン中はマイページ動線」を追加する
設計を確定する。session 取得責務を新設の async wrapper `SessionAwarePublicHeader` に閉じ込め、
presentational component と session 認識を責務分離する。

## 実行タスク

- [x] topology を確定する
- [x] 責務境界（presentational / session / wiring）を表で分離する
- [x] 設計判断の根拠を明文化する
- [x] 不変条件 #5 / #11 と整合する fail-closed フローを確認する
- [x] 既存 primitives / token で意匠を満たすことを確認する（HEX 直書きなし）

## topology

```
(public)/layout.tsx                                   app/page.tsx
        │                                                   │
        └── <SessionAwarePublicHeader />  ─── new async ────┘
                       │
                       │ await getSession()
                       ▼
                <PublicHeader currentUser={...} />   ← sync presentational
```

## 責務境界

| 責務                 | 所有者                       | 備考                                                          |
| -------------------- | ---------------------------- | ------------------------------------------------------------- |
| session 取得         | `SessionAwarePublicHeader`   | `getSession()` 経由。async server component                   |
| presentation         | `PublicHeader`               | sync component。props で `currentUser` を受け取るだけ          |
| layout / page wiring | `(public)/layout.tsx`, `app/page.tsx` | 単に wrapper を呼ぶだけ                              |

## 設計判断

1. **PublicHeader を async 化しない**: 既存 `PublicHeader.spec.tsx` の構造テストを壊さないため、
   session 認識を wrapper に切り出す。
2. **`currentUser` shape**: `{ memberId: string; name?: string }`。最小プロパティで将来拡張余地を残す。
   本タスクでは name 表示は実装しない。
3. **nav と CTA の二重表示**: プロトタイプ準拠で右上 CTA + nav 内リンクの二箇所で到達可能。
4. **fail-closed**: `getSession()` が `null` を返したら未ログイン UI に倒す（invariant #11 整合）。
5. **HomePage 個別配線**: HomePage (`app/page.tsx`) は `(public)` group 外のため、layout 経由で
   ヘッダが供給されない。個別に `<SessionAwarePublicHeader />` を呼ぶ。

## 参照資料

| 参照                          | パス                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| 既存 `PublicHeader`           | `apps/web/src/components/public/PublicHeader.tsx`             |
| session helper                | `apps/web/src/lib/session.ts`                                 |
| 既存 layout                   | `apps/web/app/(public)/layout.tsx`                            |
| プロトタイプ                  | `docs/00-getting-started-manual/claude-design-prototype/`     |

## 成果物

- `outputs/phase-2/phase-2.md`（本書）

## 完了条件

- [x] topology と責務境界を確定した
- [x] PublicHeader 非 async 維持の根拠を記述した
- [x] `currentUser` shape を確定した
- [x] fail-closed フローを確認した
- [x] HomePage 個別配線の必要性を確認した
