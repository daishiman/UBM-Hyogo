# Phase 6: テスト拡充（fail path / 回帰 guard）

> workflow: mypage-prototype-alignment
> task 種別: UI task（VISUAL） / implementation_mode: "existing-ui-alignment"
> 正本: Phase 4（基本ケース）+ Phase 5（実装）。本フェーズは境界・異常系・回帰 guard を追加する。

Phase 4 は happy path 中心。Phase 6 では `editResponseUrl=null` / `publishState=hidden` / 空 sections / 未知 visibility / pendingRequests あり時の申請パネル等の **fail path・edge case** を追加し、既存テスト（特に AttendanceList / RequestActionPanel POST 経路）の非破壊を固定する。

---

## 6.1 変更対象ファイル一覧（変更種別）

| パス | 種別 | 追加内容 |
|------|------|---------|
| `apps/web/app/profile/_lib/__tests__/visibility-counts.spec.ts` | 修正 | 全 admin / 全 member 偏り、複数未知値混在 |
| `apps/web/app/profile/_lib/__tests__/profile-summary.spec.ts` | 修正 | 重複 stableKey（最初/最後どちらを採るか固定）、空文字 value |
| `apps/web/app/profile/_components/__tests__/ProfileHeader.component.spec.tsx` | 修正 | hidden の title 文言、editResponseUrl 配線確認 |
| `apps/web/app/profile/_components/__tests__/StatusBanner.component.spec.tsx` | 修正 | hidden=warning の role=alert、同意/認証要約の表示 |
| `apps/web/app/profile/_components/__tests__/VisibilitySummary.component.spec.tsx` | 修正 | 未知 visibility 混入時に件数へ加算されない |
| `apps/web/app/profile/_components/__tests__/RevalidateModal.component.spec.tsx` | 修正 | editResponseUrl=null fallback、フォームを開く後 onClose |
| `apps/web/app/profile/_components/__tests__/EditCta.component.spec.tsx` | 修正 | editResponseUrl=null でも開閉可能 |
| `apps/web/app/profile/_components/__tests__/RequestActionPanel.regression.spec.tsx` | 新規 | danger-zone wrap 後も POST 経路・pending 表示・gate が不変 |
| `apps/web/app/profile/_components/__tests__/ProfilePreview.component.spec.tsx` | 新規 | displayName 欠損時の空表示、chips 空 |

> 既存 `RequestActionPanel.component.spec.tsx` / `DeleteRequest.component.spec.tsx` / `VisibilityRequest.component.spec.tsx` / `AttendanceList`（存在すれば）は**変更しない**。回帰確認は新規 `RequestActionPanel.regression.spec.tsx` に閉じる（既存テストを汚さない）。

---

## 6.2 関数・型シグネチャ

Phase 5 で確定済みの surface を対象とし、本フェーズで新規 export は追加しない。`RequestActionPanel.regression.spec.tsx` は Phase 4 の RequestActionPanel mock パターン（`vi.hoisted` + `vi.mock("next/navigation")` + dialog mock）を踏襲する。

---

## 6.3 テスト方針

- fail path / 回帰のみ追加。happy path は Phase 4 で担保済み。
- `window` 全置換禁止 / `Object.defineProperty(window, ...)`（[Feedback VSCPKR-02]）。
- 環境ブロッカー（esbuild mismatch 等）と source-level fail を混在記録しない（[WEEKGRD-01]）。Phase 6 record では両者を別カテゴリで記す。
- 純粋関数の異常系は「例外を投げず防御的な値を返す」ことを assert（throw を期待しない / [WEEKGRD-02]）。

---

## 6.4 追加テストケース（ファイル別）

### A. visibility-counts.spec.ts（追加）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `全 field が admin のとき admin のみ加算` | admin×4 | `{ public:0, member:0, admin:4 }` |
| `複数の未知値が混在しても無視する` | `"secret"`×2 + `"draft"`×1 + public×1 | `{ public:1, member:0, admin:0 }` |
| `visibility が undefined の field を無視する` | undefined×1（キャスト）+ member×1 | `{ public:0, member:1, admin:0 }` |

### B. profile-summary.spec.ts（追加）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `同一 stableKey が複数あるとき最初の有効値を採る` | fullName="A"（先）/ fullName="B"（後） | `displayName: "A"`（先頭優先を仕様固定）|
| `value が空文字のとき空表示として扱う` | fullName: value="" | `displayName: ""` |
| `value が配列/オブジェクトのとき空文字に丸める` | fullName: value=["x"]（キャスト）| `displayName: ""`（防御的）|

> 重複時の採択（先頭 or 末尾）は Phase 5 実装方針に合わせる。本仕様では「最初の有効値」を採択基準とする。

### C. ProfileHeader.component.spec.tsx（追加）

| ケース名 | props | 期待値 |
|---------|-------|--------|
| `hidden のとき非公開理由の title を持つ` | `publishState="hidden"` | 「公開ページを見る」要素の `title` に非公開の旨を含む |
| `editResponseUrl が EditCta へ配線される` | `editResponseUrl="https://edit"` | 「情報を更新する」click → modal の「フォームを開く」href が `https://edit` |

### D. StatusBanner.component.spec.tsx（追加）

| ケース名 | props | 期待値 |
|---------|-------|--------|
| `hidden の Banner は role=alert を持つ` | `publishState="hidden"` | `getByRole("alert")` が存在（warning tone）|
| `同意・認証要約を補足表示する` | rulesConsent 等を渡す | 規約同意/認証状態の要約行が描画される |

### E. VisibilitySummary.component.spec.tsx（追加）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `未知 visibility は件数に加算されない` | public×2 + `"secret"`×3 | PUBLIC=2 / MEMBERS=0 / PRIVATE=0、throw しない |

### F. RevalidateModal.component.spec.tsx（追加）

| ケース名 | props | 操作 | 期待値 |
|---------|-------|------|--------|
| `editResponseUrl=null のとき fallback を開く（再確認）` | `editResponseUrl={null}, fallbackResponderUrl="https://fb"` | — | 「フォームを開く」href=`https://fb`, `rel="noopener noreferrer"` |
| `フォームを開く click 後に onClose が呼ばれる` | onClose=mock | 「フォームを開く」click | `onClose` が 1 回呼ばれる |
| `editResponseUrl も fallback も空文字のとき href は空（防御）` | 両方 ""（異常系）| — | href が `""`（throw しない）|

### G. EditCta.component.spec.tsx（追加）

| ケース名 | props | 期待値 |
|---------|-------|--------|
| `editResponseUrl=null でも Modal を開閉できる` | `editResponseUrl={null}` | click → dialog 出現、キャンセル → 消失 |

### H. RequestActionPanel.regression.spec.tsx（新規 / 回帰 guard）

danger-zone Card wrap 後も挙動不変であることを固定。dialog は Phase 4 同様 mock 化（POST は実呼びしない）。

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `rulesConsent!=consented のとき申請パネルは無効化表示` | `rulesConsent="declined"` | `data-testid="request-action-panel-disabled"` が存在、操作ボタンなし |
| `publishState=public のとき公開停止ボタンを表示` | `publishState="public", rulesConsent="consented"` | `data-testid="open-hide-dialog"` が存在 |
| `publishState=hidden のとき再公開ボタンを表示` | `publishState="hidden"` | `data-testid="open-republish-dialog"` が存在 |
| `pendingRequests.visibility ありのとき pending banner 表示 + ボタン disabled` | visibility pending を渡す | RequestPendingBanner 相当が描画、`open-hide-dialog`/`open-republish-dialog` が disabled |
| `pendingRequests.delete ありのとき退会ボタン disabled` | delete pending を渡す | `data-testid="open-delete-dialog"` が disabled |
| `danger-zone の見出し（DANGER ZONE / 公開の停止・退会）を描画する` | consented | 見出し文言が存在 |

### I. ProfilePreview.component.spec.tsx（新規）

| ケース名 | props | 期待値 |
|---------|-------|--------|
| `displayName ありのとき名前と subtitle を描画` | `displayName="山田太郎", subtitle="デザイナー"` | 両文言が存在、Avatar に aria-label が付く |
| `displayName 空のとき安全に描画する` | `displayName=""` | throw せず、PREVIEW eyebrow が描画される |
| `chips 未指定のとき chip 行が空でも描画する` | `chips=undefined` | throw しない |

---

## 6.5 既存テスト非破壊確認

- AttendanceList の既存テスト（存在する場合）/ RequestActionPanel 既存 component spec / DeleteRequest / VisibilityRequest spec を **変更せず** 再実行し GREEN を維持する。
- POST endpoint・body schema・dialog の submit 経路が不変であることを、既存テストの pass で担保する。

---

## 6.6 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build

# Phase 6 追加 + 既存回帰（profile 配下 + MemberHeader）を targeted run
mise exec -- pnpm --filter web exec vitest run \
  app/profile/_lib \
  app/profile/_components \
  src/components/layout/__tests__/MemberHeader.spec.tsx

# 残存参照ゼロ確認（旧コンポーネント / [FB-UI-02-1]）
grep -rn "PublicVisibilityBanner" apps/web/app apps/web/src || echo "no live import"

mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec verify-design-tokens
```

---

## 6.7 DoD（Phase 6 完了条件）

1. 6.1 の追加/新規テストが作成され、`*.spec.{ts,tsx}` 命名である。
2. fail path（editResponseUrl=null / hidden / 空 sections / 未知 visibility / pending あり）が全て GREEN。
3. `RequestActionPanel.regression.spec.tsx` で POST 経路・pending・gate の不変を固定（既存 spec は無改変）。
4. AttendanceList 既存テストが非破壊（GREEN 維持）。
5. 純粋関数の異常系は throw せず防御的値を返すことを assert 済み。
6. 旧 `PublicVisibilityBanner` 等の live import がゼロ（grep 確認）。
7. `typecheck` / `lint` / `verify-design-tokens` が pass。
8. 環境ブロッカーと source-level fail が記録上分離されている（[WEEKGRD-01]）。
