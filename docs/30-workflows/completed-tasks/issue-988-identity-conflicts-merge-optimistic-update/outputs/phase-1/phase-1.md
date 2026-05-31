# Phase 1: 要件定義

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 1.1 タスク分類（Feedback 1 / Feedback 3 対応）

- **UI task**（VISUAL）: merge 操作直後に row が画面から消える視覚変化を伴う。Phase 11 は VISUAL（screenshot 取得）。
- docs-only ではない。コード変更（component state 追加 + test）が目的達成に必須。

## 1.2 スコープ

### 含むもの

- `IdentityConflictRow.tsx` に optimistic 非表示 state を追加し、merge ハンドラを「trigger 直後に row を消す → error 時のみ復元」へ差し替える
- focused vitest に optimistic hide / rollback / success-stays-hidden ケースを追加
- Playwright e2e に「merge 後即座に row が消える」「server error で row 復元」シナリオを追加

### 含まないもの（スコープ外）

| 項目 | 理由 | 実施時期/場所 |
| --- | --- | --- |
| `useAdminMutation` hook への optimistic option 追加 | component-local state で要件を満たせるため hook 拡張は不要（後方互換リスク回避） | 不要（本サイクルで判断確定） |
| dismiss 側の optimistic 化 | Issue #988 スコープ外（dismiss は不変が受け入れ基準） | 必要なら別 followup（本サイクルでは不要と判断） |
| merge endpoint / API contract 変更 | 不変条件 #1（既存 API のみ） | 対象外 |
| D1 schema 変更 | 不変条件 #1 | 対象外 |

> **CONST_007 確認**: 本タスクは単一コンポーネントの state 機構追加 + test であり、後続実装プロンプト（03.実装.md）の **1 サイクル内で完了可能**。先送り・分割は行わない。dismiss optimistic 化は「Issue が明示的にスコープ外宣言」しているため未タスク候補としてのみ Phase 12 で扱う。

## 1.3 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 観点 | 既存規則 | 本タスクでの適用 |
| --- | --- | --- |
| component 内 state | `useState` + camelCase（`stage`, `mergeReason`, `dismissReason`） | 新規 state は `optimisticMerged: boolean`（camelCase 踏襲） |
| stage union | `"idle" \| "merge-confirm" \| "merge-final" \| "dismiss"`（kebab-case 値） | optimistic は stage union に混ぜず**独立 boolean** とする（責務分離: stage = dialog 表示制御、optimisticMerged = row 可視性制御） |
| mutation hook | `useAdminMutation`（`@/features/admin/hooks` 経由、`../../features/admin/hooks` import） | 既存 import をそのまま使用。legacy `@/lib/useAdminMutation` は不使用（#10） |
| error 変数 | `mergeError = mergeMutation.error?.message ?? null` | 既存のまま流用（rollback 後の inline error 表示に再利用） |
| トークン | `var(--ubm-color-*)`（OKLch 正本、HEX 直書きなし） | 新規 markup でも同方式。本タスクは markup 追加最小のためトークン新規追加なし |

## 1.4 carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline -5`:

```
7b2bf0537 feat(login-redirect): redirect authenticated users from /login (#1011)
015edc80f feat: ログイン状態に応じた公開ヘッダー導線に更新 (#1012)
37fe488e8 feat(members): メンバー一覧のUX明確化 (#1009)
b70ded680 fix(admin): Admin API fetchでService Bindingを優先 (#1003)
8d0cd3ca3 feat(api): membersフォーム同期診断と公開状態backfillを追加 (#1001)
```

- 直近に identity-conflicts merge optimistic を扱うコミットなし。`#990`（親サイクル）は UI primitives 整合のみ。
- 本タスクは `#990` で整った `IdentityConflictRow.tsx` の上に optimistic 挙動を追加する差分。重複なし。

## 1.5 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の新規実装（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | No | 未マージ。新規実装として扱う |
| 前提タスク（依存タスク）完了済み | Yes（#990 で row component 整合済） | 依存解消タスク不要 |

→ `implementation_mode: "new"`。Phase 4 は RED テスト設計、Phase 5 は新規実装。

## 1.6 受け入れ条件（AC）

### 機能要件

- AC-1: merge 二段階 confirm 完了（「merge 実行」click）直後、server 応答前に該当 row が一覧から消える（optimistic hide）
- AC-2: server がエラー（403/5xx/network）を返したとき、row が復元し inline error（`role="alert"`）が表示される（rollback）
- AC-3: server 成功時、row は消えたまま（再表示されない）。既存 `router.refresh()` が server list を後追い整合する
- AC-4: dismiss 側の挙動は不変（optimistic 化しない）

### 品質要件

- AC-5: focused vitest（optimistic hide / rollback / success-stays-hidden）全 green
- AC-6: Playwright e2e（optimistic hide + rollback）全 green
- AC-7: `pnpm typecheck` / `pnpm --filter web lint` green
- AC-8: legacy `@/lib/useAdminMutation` 未参照（`grep` で 0 件）

### 視覚要件（VISUAL）

- AC-9: Phase 11 で `merge-confirm`→`optimistic-removed`→`rollback-error` の状態遷移 screenshot を取得

## 1.7 artifact 命名 canonical 一覧（後回し禁止 / Feedback 1）

| artifact | canonical path |
| --- | --- |
| Phase 11 screenshot (1) | `outputs/phase-11/screenshots/identity-conflict-row-merge-final.png` |
| Phase 11 screenshot (2) | `outputs/phase-11/screenshots/identity-conflict-row-optimistic-removed.png` |
| Phase 11 screenshot (3) | `outputs/phase-11/screenshots/identity-conflict-row-rollback-error.png` |
| Phase 11 metadata | `outputs/phase-11/phase11-capture-metadata.json` |

## 1.8 inventory（変更対象 surface）

| surface | 役割 | 変更種別 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | merge UI 本体 + optimistic state | 編集 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | focused vitest | 編集 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | e2e | 編集 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | Server Component list | **変更なし**（参照のみ） |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | mutation hook | **変更なし**（参照のみ） |
