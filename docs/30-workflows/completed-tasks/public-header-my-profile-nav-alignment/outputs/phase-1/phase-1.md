# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目       | 値                                                                                |
| ---------- | --------------------------------------------------------------------------------- |
| Task ID    | TASK-PUB-HEADER-MY-PROFILE-NAV                                                    |
| Phase      | 1 / 13（要件定義）                                                                |
| 依存       | なし                                                                              |
| 成果物     | outputs/phase-1/phase-1.md                                                        |
| タスク分類 | UI task（公開ヘッダの session 認識動線追加）/ visualEvidence = VISUAL_ON_EXECUTION |

## 目的

公開層 (`(public)` route group と `/` HomePage) を閲覧中のログイン会員が、`/profile`（マイページ）へ
1 click で到達できる動線を `PublicHeader` に追加する。プロトタイプ
(`docs/00-getting-started-manual/claude-design-prototype/`) で示されている「ログイン中はマイページ最短遷移」
動線の欠落を解消する。

## 実行タスク

- [x] P50 前提確認チェックを実施し、`implementation_mode` を確定する
- [x] 既存 `PublicHeader.tsx` / `(public)/layout.tsx` / `app/page.tsx` の現状 inventory を行番号付きで列挙する
- [x] `getSession()` の戻り値 shape (`{ memberId: string; name?: string }`) を確定し、`currentUser` prop の型を固定する
- [x] 命名規則（`PascalCase.tsx` / `*.spec.tsx` / `XxxCurrentUser`）の整合を確認する
- [x] AC-1〜AC-8 を `index.md` と整合させて列挙する
- [x] targeted vitest 対象ファイルを事前列挙する（FB-UI-02-2）

## P50 前提確認チェック

| 確認項目                           | 結果 | メモ                                                              |
| ---------------------------------- | ---- | ----------------------------------------------------------------- |
| current branch に実装が存在する    | Yes  | 5 ファイル変更 + 1 新規。focused vitest green 確認済              |
| upstream（dev/main）にマージ済み   | No   | feature branch のみ、未コミット                                   |
| 前提タスク（依存タスク）が完了済み | Yes  | `ui-prototype-alignment-mvp-recovery` で `/profile` 基盤実装済    |

→ `implementation_mode: "verify_existing"`。Phase 5 は diff 確認モード。

## 現状 inventory

| 対象                                                | 状態                                                          |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `apps/web/src/components/public/PublicHeader.tsx`   | sync server component。`currentUser` prop 未対応              |
| `apps/web/src/components/public/SessionAwarePublicHeader.tsx` | 未存在（本タスクで新設）                              |
| `apps/web/app/(public)/layout.tsx`                  | `<PublicHeader />` 直呼び                                     |
| `apps/web/app/page.tsx`                             | `<SessionAwarePublicHeader />` への置換予定                   |
| `apps/web/src/lib/session.ts#getSession()`          | `{ memberId, name? } | null` を返す既存 helper                |
| `MemberHeader.tsx`                                  | `/profile` / `/members` リンク既保有（本タスク範囲外）        |

## targeted vitest 対象ファイル

```bash
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/components/public/__tests__/PublicHeader.spec.tsx \
  "apps/web/app/(public)/layout.spec.tsx"
```

## 参照資料

| 参照                | パス                                                                     | 内容                                                  |
| ------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| プロトタイプ        | `docs/00-getting-started-manual/claude-design-prototype/`                | 公開ヘッダ動線（ログイン中はマイページ最短遷移）       |
| 親 workflow         | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`                 | `/profile` 基盤・既存 token / primitives 群           |
| session 仕様        | `docs/00-getting-started-manual/specs/02-auth.md`                        | session shape / fail-closed 規約                      |
| 不変条件            | CLAUDE.md「不変条件 #5 / #11」                                            | D1 直接アクセス禁止 / fail-closed                     |

## 成果物

- `outputs/phase-1/phase-1.md`（本書）

## 完了条件

- [x] P50 チェック結果と `implementation_mode` を確定した
- [x] 現状 inventory を行番号 / shape 付きで列挙した
- [x] AC-1〜AC-8 を `index.md` と一貫させた
- [x] targeted vitest 対象ファイルを事前固定した
- [x] 命名規則の整合を確認した
