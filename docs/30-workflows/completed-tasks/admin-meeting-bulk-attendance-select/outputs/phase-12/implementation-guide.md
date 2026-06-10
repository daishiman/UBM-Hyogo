# 実装ガイド — admin-meeting-bulk-attendance-select

本ガイドは「開催日ドロワーの出席追加を複数会員同時選択 → 一括追加に是正」タスクの実装ガイドである。
Part 1（初学者・中学生レベル）と Part 2（開発者・技術者レベル）の 2 部構成で記す。本タスクは `implemented_local_evidence_captured`
（コード実装済み）であり、Part 2 のコード例は実装サイクルで参照する設計確定値である。視覚証跡（Phase 11 screenshot）は
local fixture で 7 状態を取得済み。認証済み staging baseline は user-gated として残す。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

学校のクラスで「今日の集まりに来た人」を名簿に登録する係を想像してください。今のやり方は、名簿の登録画面で
「リストから 1 人選ぶ → 追加ボタンを押す」を、来た人の数だけ何度もくり返す必要があります。10 人来たら 10 回、
20 人来たら 20 回。これでは時間がかかるし、押しまちがいも起きやすい。人数が増えるほどしんどくなります。

たとえば、給食の配膳（はいぜん）で、おかずを 1 人分ずつ何度もよそうのではなく、来た人の名前にチェックを
入れて「この 8 人にまとめて配る」と一度に決められたら、ずっとラクですよね。このタスクは、その「まとめて
チェック → 一度に追加」のしくみを出席の登録画面に作る作業です。

### 何が困っているか（1 つの本質）

- 困りごとは「**置き場所**」ではなく「**1 件ずつの手間**」です。
- 出席は「その集まり（開催日）の中の情報」なので、いまの「開催日を開いて、その中で出席をいじる」という
  置き場所は正しい。だから置き場所は変えません。
- 変えるのは「1 人ずつ」を「まとめて」にする操作のやり方だけです。

### 何をするか（チェックリストの例え）

遠足の出欠を取るとき、先生は名簿にチェックを付けていって、最後に「はい、この人たちは参加ね」と一度に
確定しますよね。それと同じものを画面に作ります。

- **チェックリストを出す**: まだ出席に入っていない人だけを一覧で出し、それぞれにチェックボックス（四角い
  チェック欄）を付けます。
- **名前でしぼり込む**: 人数が多いときのために、名前や会員番号を打つと、その人だけにリストがしぼれるように
  します（虫めがねで探すイメージ）。
- **まとめて追加ボタン**: 「選んだ 8 名を一括追加」のように、選んだ人数がボタンに出て、1 回押すだけで
  まとめて登録します。
- **大人数モード**: すごく人数が多いときは「人数が多い時はこちら」を押すと、大きな画面（モーダル＝小窓を
  全面に開くやつ）で、検索したり全員にチェックを入れたりできます。

### 失敗したときの約束（全部か、ゼロか）

このしくみは「**全部うまくいくか、ゼロか**（オール・オア・ナッシング）」という約束で動きます。たとえば
選んだ中に「もう出席済みの人」や「退会した人」がまざっていて 1 人でも登録できなければ、**1 人も登録しません**。
中途半端に「半分だけ入った」状態を作らないためです。そのときは「追加できませんでした（出席済 2 / 削除済 1）」の
ようにお知らせ（トースト＝画面にふわっと出る短いメッセージ）が出て、選んだチェックはそのまま残るので、
選び直してもう一度押せます。

### どこまでやるか（やること・やらないこと）

今回やるのは「画面の操作を一括化する」ところまでです。出席を実際に登録する裏側のしくみ（サーバーの処理）は
**すでにある一括登録の窓口をそのまま借りる**ので、新しく作りません。これにより、裏側を壊すリスクをなくせます。

### 専門用語セルフチェック

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| チェックリスト | 「名前ごとにチェックを入れられる一覧」 |
| インクリメンタル検索 | 「打つそばからリストがしぼれる検索」 |
| モーダル | 「画面の上に開く大きな小窓」 |
| トースト | 「画面にふわっと出る短いお知らせ」 |
| all-or-nothing（オール・オア・ナッシング） | 「全部成功か、1 件でもダメなら全部やらない」 |
| エンドポイント | 「サーバーへのお願いを受け付ける窓口」 |
| primitive（プリミティブ） | 「他でも使い回せる小さな部品（ここでは Checkbox）」 |

---

## Part 2: 技術詳細（開発者レベル）

### 全体方針

- **`apps/web` 完結の UI/UX 是正**。新しい API endpoint / D1 schema / Google Form schema / fetch URL は一切追加・変更しない（不変条件 #1 #5、AC-12）。
- 既存の一括取込 endpoint `POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false` を再利用する。catch-all proxy（`apps/web/app/api/admin/[...path]/route.ts`）で到達するため新規 proxy 不要。
- 選択ロジックは `useBulkAttendanceSelection` に集約し、ドロワー内チェックリスト（主経路）と大量選択モーダル（補助経路）の 2 UI で共有する（AC-9）。
- write（attended state 更新）の唯一の owner は `MeetingsClientShell`。選択状態（selectedIds / query）は hook 局所 state。
- 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加なし（AC-11、`verify:design-tokens` gate）。

### API 契約（再利用・無変更）

```
POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false
Content-Type: application/json
Body: { "rows": [ { "memberId": "TEST-MEM-04" }, ... ] }
```

レスポンス（200）:

```jsonc
{
  "ok": true,
  "summary": { "total": 5, "ok": 5, "duplicate": 0, "deletedMember": 0, "unknownMember": 0, "invalid": 0 },
  "rows": [ { "index": 0, "status": "ok", "memberId": "TEST-MEM-04" } ],
  "dryRun": false,
  "committed": true
}
```

- `dryRun` 既定は **true**。commit には明示的に `?dryRun=false` が必要。
- commit は **all-or-nothing**: `commit && rows.length>0 && rows.every(status==='ok')` の時のみ INSERT。1 件でも非 ok なら `committed:false`・副作用ゼロ。
- row status: `ok | duplicate | deleted_member | unknown_member | invalid`。
- `committed:false` でも HTTP は 200 で返る（業務的失敗）点に注意。

### TypeScript 型定義（F1: `lib/admin/api.ts` に追加）

```ts
export interface ImportAttendanceSummary {
  total: number; ok: number; duplicate: number;
  deletedMember: number; unknownMember: number; invalid: number;
}
export interface ImportAttendanceRowResult {
  index: number;
  status: "ok" | "duplicate" | "deleted_member" | "unknown_member" | "invalid";
  memberId?: string; message?: string;
}
export interface ImportAttendanceResponse {
  ok: boolean;
  summary: ImportAttendanceSummary;
  rows: ImportAttendanceRowResult[];
  dryRun: boolean;
  committed: boolean;
}
```

### API シグネチャ（F1: web client `importAttendance`）

```ts
export const importAttendance = (
  sessionId: string,
  memberIds: ReadonlyArray<string>,
): Promise<
  | { ok: true; data: ImportAttendanceResponse }
  | { ok: false; status: number; error: string }
> =>
  call(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/import?dryRun=false`,
    "POST",
    { rows: memberIds.map((memberId) => ({ memberId })) },
  );
```

### Hook シグネチャ（F3: `useBulkAttendanceSelection`）

```ts
export interface UseBulkAttendanceSelection {
  query: string;
  setQuery: (q: string) => void;
  selectableCandidates: ReadonlyArray<MemberCandidate>;  // attended 除外 + query 絞込
  selectedIds: ReadonlySet<string>;
  toggle: (memberId: string) => void;
  selectAllFiltered: () => void;                          // 絞込結果のうち未出席を全選択
  clear: () => void;
  selectedCount: number;
}
export function useBulkAttendanceSelection(
  candidates: ReadonlyArray<MemberCandidate>,
  attended: ReadonlySet<string>,
): UseBulkAttendanceSelection;
```

- 未出席のみを母集合にし（`!attended.has(memberId)`）、query で fullName / memberId を部分一致絞込。
- `attended` 変化時に既出席となった id を選択集合から除く effect を持つ（stale 防止）。
- 副作用（API 呼び出し）は持たない。送信は親 Shell が担当（責務分離）。

### 変更 / 新規ファイルの Before → After 要約

| # | ファイル | 種別 | Before | After |
| --- | --- | --- | --- | --- |
| F1 | `apps/web/src/lib/admin/api.ts` | 編集 | `addAttendance` / `removeAttendance` のみ | `importAttendance` と `ImportAttendance*` 型を追加（既存 endpoint 再利用） |
| F2 | `apps/web/src/components/ui/Checkbox.tsx` | 新規 | 不在（`ui/` に Checkbox なし） | `type="checkbox"` 固定の primitive。`ui-checkbox` / `ui-checkbox__input` / `ui-checkbox__label`・OKLch トークン・FormField 互換 |
| F3 | `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | 新規 | — | 選択 Set / toggle / selectAllFiltered / clear / query 絞込 / stale 除去 effect |
| F4 | `.../_meetings/bulk-attendance-message.ts` | 新規 | — | `bulkFailureMessage(summary)` 純関数（例外を投げず文字列返却） |
| F5 | `.../_meetings/BulkAttendanceChecklist.tsx` | 新規 | — | ドロワー主経路 UI（検索 FormField + 候補 Checkbox + 件数ボタン + モーダル起動リンク） |
| F6 | `.../_meetings/BulkAttendanceModal.tsx` | 新規 | — | 補助経路 UI（全画面 overlay・全選択昇格・同一 hook 利用） |
| F7 | `.../_meetings/MeetingAttendanceDrawer.tsx` | 編集 | 単一 select + 単発「出席を追加」 | 単発を保持 + `BulkAttendanceChecklist` 埋込 + `onBulkAddAttendance` prop 追加 + modal 開閉 useState |
| F8 | `.../_meetings/MeetingsClientShell.tsx` | 編集 | attended owner / addAttendance / removeAttendance | `onBulkAdd(sessionId, memberIds)` 追加（importAttendance → summary 反映・all-or-nothing） |
| F9 | `.../_meetings/index.ts` | 編集 | 既存 export | 新規 export 追加（必要時） |
| F10 | `apps/web/src/styles/globals.css` | 編集 | `.admin-meeting-drawer` 系 | `.bulk-attendance-*` / `.ui-checkbox` / `.bulk-attendance-modal*` を `@layer components` 末尾に追加 |

### 使用例（Shell の `onBulkAdd` 配線）

```ts
const onBulkAdd = async (sessionId: string, memberIds: ReadonlyArray<string>): Promise<boolean> => {
  const fresh = memberIds.filter((id) => !attended[sessionId]?.has(id));
  if (fresh.length === 0) { setToast("追加対象がありません"); return false; }
  if (fresh.length > 500) { setToast("一度に追加できるのは 500 名までです"); return false; }
  let res;
  try { res = await importAttendance(sessionId, fresh); }
  catch (e) { setToast(`一括追加に失敗: ${getMessage(e)}`); return false; }
  if (!res.ok) { setToast(`一括追加に失敗: ${res.error}`); return false; }
  const { summary, committed } = res.data;
  if (!committed) { setToast(bulkFailureMessage(summary)); return false; }   // AC-7: attended 不変・選択保持
  setAttended((s) => {
    const next = { ...s }; const cur = new Set(next[sessionId] ?? []);
    for (const id of fresh) cur.add(id); next[sessionId] = cur; return next;
  });
  setToast(`${summary.ok} 名の出席を追加しました`);   // AC-6
  return true;
};
```

- checklist / modal は `if (await onBulkAdd(ids)) clear()` とし、成功（`committed:true`）時のみ選択 clear。
  失敗時は clear しない（AC-7 選択保持）。SSOT に従い `onBulkAddAttendance` の戻り値は `Promise<boolean>`（committed）。

### エラー処理

| ケース | 挙動 |
| --- | --- |
| ネットワーク例外 | try/catch で捕捉し `「一括追加に失敗: <message>」` toast。attended 不変 |
| `res.ok === false`（HTTP エラー） | `「一括追加に失敗: <error>」` toast。attended 不変 |
| `committed:false`（HTTP 200・業務失敗） | `bulkFailureMessage(summary)` で内訳 toast。attended 不変・選択保持（AC-7） |
| 選択 0 件 | 送信ボタン disabled（AC-3）。Shell でも `fresh.length===0` ガード |
| 選択 > 500 件 | 送信前ガードで `「一度に追加できるのは 500 名までです」` toast（`IMPORT_MAX_ROWS=500`） |

> `committed:false` は HTTP 200 で返るため、`useAdminMutation` の `unwrap`（throw 前提）に合わない。
> Shell 内で `importAttendance` を直接呼び `{ok,data}` を見る設計とし、その理由を Phase 8 で注記する
> （既存 `removeAttendance` も Shell raw 構築の前例あり）。

### 設定可能パラメータ・定数

| 名前 | 値 | 出所 |
| --- | --- | --- |
| `IMPORT_MAX_ROWS` | `500` | `apps/api` 側既定。web は送信前ガードに利用（無変更） |
| `dryRun` | `false` を明示付与 | commit に必須 |
| data-testid | `bulk-attendance-{search,option,submit,checklist,modal}-${sessionId}` | 既存 `<action>-<sessionId>` 規約 |

### トークン使用例（HEX 直書き禁止）

```css
.bulk-attendance__option[aria-checked="true"] {
  background: var(--ubm-color-accent-soft);
  border-color: var(--ubm-color-accent);
}
.ui-checkbox__input {
  accent-color: var(--ubm-color-accent);
}
```

色・余白・角丸・影は全て `var(--ubm-*)` 経由。`oklch(...)` / `#rrggbb` / `bg-[#...]` を新規に書かない（AC-11）。

### 視覚証跡（Phase 11 screenshot 参照）

本タスクは VISUAL のため、Phase 11 の local fixture pixel screenshot を 7 状態（ドロワー閉 / チェックリスト展開 /
複数選択中 / 検索絞込 / モーダル展開 / 成功 toast / 失敗 toast）で取得済みである。撮影計画と実ファイル一覧は
[`../phase-11/screenshot-plan.json`](../phase-11/screenshot-plan.json) と [`../phase-11/phase11-capture-metadata.json`](../phase-11/phase11-capture-metadata.json) を参照。
PNG は `outputs/phase-11/screenshots/` 配下に配置済み。認証済み staging baseline は user-gated として残す。

### 検証コマンド（本 wave で実行済み）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
git diff --name-only -- apps/api packages   # 空であること（AC-12）
```

> 2026-06-09 の実装レビューで focused Vitest（10 files / 38 tests）と local fixture screenshot 7 枚を確認済み。
