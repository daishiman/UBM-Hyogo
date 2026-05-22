# Phase 12: implementation-guide

[実装区分: 実装仕様書]

## Part 1: 中学生レベル概念説明

### このタスクで何をしようとしているの？

「集まりに来た人を記録する画面（出席登録の画面）」が、ちゃんと正しく動くかを、
**写真（スクショ）で証拠を残して確認する**作業をします。

たとえば、学校の出席簿で考えてみてください。

- もう辞めてしまった生徒の名前が出席候補に出てきたら困りますよね？
- 同じ生徒を 2 回出席にしてしまったら数が合わなくなりますよね？
- 出席を間違えて消したのに、画面ではまだ残っていたら混乱しますよね？

これと同じことが、UBM 兵庫支部会のサイトの「出席登録画面」でも起きないか、
ブラウザ操作の様子を**写真で残して確認**します。

### なぜ写真（スクショ）で確認するの？

「ちゃんと動きました」と文章で書くだけだと、本当に正しく見えていたか
あとから検証できません。**写真があれば、後から見直したときに**
「確かに削除済みの人は表示されていない」と目で確認できます。

これは、料理を作って「美味しかった」とだけ書くのと、
「こういう色・盛り付けで仕上がった」と写真を残すくらいの差があります。

### 写真で何を証明するの？（4 つのポイント）

1. **重複登録できないようにする** — 同じ人を 2 回登録しようとしたら、
   画面に「もう登録されてます」と注意メッセージ（toast）が出ること。
2. **削除済みの人が表示されない** — 退会した人の名前が出席候補に出ないこと。
3. **登録済みの人が表示されない** — もう出席登録した人を、もう一度
   選ぼうとしたときに「すでに登録済」と分かる状態になっていること。
4. **削除したら反映される** — 出席を消したら、ちゃんと画面から
   その人が消えて、「削除しました」のメッセージが出ること。

### toast（トースト）って何？

画面の隅にピョコッと出てきて、数秒で消える短いお知らせのことです。
パンを焼くトースターから飛び出してくるイメージから名前がついています。
「保存しました」「エラーが起きました」「もう登録されてます」など、
**一瞬だけ目に入れたい情報**を出すのに使います。

### Playwright trace（プレイライト・トレース）って何？

Playwright というツールが「ブラウザを自動で操作したときの様子」を
1 ステップずつ録画した記録ファイルです。動画よりも詳しく、
**どのボタンをクリックして、どの順番で画面が変わったか**を
あとから巻き戻して確認できます。
今回は「削除ボタンを押したとき、本当に画面から名前が消えたのか」を
trace で記録します。

---

## Part 2: 技術者向け実装ガイド

### 1. 変更ファイル一覧

| 種別 | パス |
|------|------|
| edit | `apps/web/playwright/tests/attendance.spec.ts` |
| edit | `apps/web/playwright/page-objects/AdminMeetingsPage.ts` |
| edit | `apps/web/playwright/fixtures/auth.ts` |
| new | `apps/web/playwright/fixtures/admin-meetings.ts` |
| edit | `apps/web/src/components/admin/MeetingPanel.tsx`（`data-testid` 追加のみ） |
| edit | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`（detail mutation endpoint/body + registered state） |
| edit | `apps/web/playwright.config.ts`（attendance evidence dir + readiness URL） |
| edit | `apps/api/src/routes/admin/meetings.ts`（detail GET route + existing `/attendances` contract） |
| edit | `apps/api/src/routes/admin/meetings.contract.spec.ts`（detail GET route contract） |
| edit | `.github/workflows/playwright-smoke.yml`（focused attendance visual smoke step） |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/*.png` (6 枚) |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/trace/attendance-delete-trace.zip` |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/*.txt` `*.json` `*.md` |

> 完全列挙は Phase 2 §2 を正本とする。

### 2. mock API 拡張差分（要約）

`apps/web/playwright/fixtures/auth.ts` の `ensureMockApi()` に以下を追加:

| METHOD | PATH | 振る舞い |
|--------|------|---------|
| GET | `/admin/meetings` | seed 済み list view |
| GET | `/admin/meetings/:id` | `MeetingDetail`; unknown / soft-deleted は 404 |
| POST | `/admin/meetings/:id/attendances` | 200 / 409 (already) / 422 (deleted) / 404 (unknown member) |
| POST | `/admin/meetings/:id/attendances` with `{ attended: false }` | 200 |
| POST | `/__test__/seed-meetings` | attendance 領域 seed 上書き |
| POST | `/__test__/reset` | 全 state リセット（attendance 含む） |

state:

```ts
type MockAttendanceState = {
  meetings: MeetingDetail[]
  members: MockMember[]
  meetings: MockMeeting[]
}
```

詳細は Phase 2 §5 を正本とする。

### 3. page object メソッドシグネチャ

```ts
// 既存（detail page）
visit(id?: string): Promise<void>
registerAttendance(memberId: string): Promise<void>
expectDupToast(): Promise<void>
expectDeletedMemberExcluded(deletedMemberId: string): Promise<void>

// 新規（detail page）
expectAlreadyRegistered(memberId: string): Promise<void>

// 新規（list page）
listPageSelectOption(sessionId: string, memberId: string): Locator
addAttendanceOnList(sessionId: string, memberId: string): Promise<void>
removeAttendanceOnList(sessionId: string, memberId: string): Promise<void>
expectListToast(text: string): Promise<void>
expectAttendeePresent(sessionId: string, memberId: string, present: boolean): Promise<void>
```

### 4. 1 行実行コマンド

```bash
# 単体実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium

# evidence 取得込み完全実行
PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
    playwright/tests/attendance.spec.ts --project=desktop-chromium --trace on \
    2>&1 | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-run.txt
```

### 5. CI 配線

- `.github/workflows/playwright-smoke.yml` の `smoke (chromium)` job に focused attendance visual smoke step を追加
- 既存 `pnpm e2e:smoke` は `smoke-chromium` project の `full-smoke.spec.ts` 固定で維持
- `attendance.spec.ts` は追加 step で `--project=desktop-chromium` として実行
- path-filter `apps/web/**` で trigger 済
- artifact (`playwright-smoke-report`) と tracked evidence は重複させない（canonical は tracked path）

新規 path-filter workflow は追加しない。

### 6. ロールバック手順

| 失敗ケース | ロールバック |
|------------|-------------|
| spec が CI で flaky | `attendance.spec.ts` のみ revert（mock fixture は保持） |
| mock endpoint が他 spec を壊す | `auth.ts` の attendance 追加分のみ revert |
| `MeetingPanel.tsx` の `data-testid` 追加が visual baseline diff を発生 | INV-06 user gate で `--update-snapshots` を user 承認後に実行 |
| evidence 欠落 | Phase 11 §2.2 を再実行し canonical path へ commit |

詳細は Phase 2 §10 を正本とする。

### 7. DoD（Definition of Done）

Phase 2 §9 を正本とする。要点:

- `attendance.spec.ts` の 4 test GREEN
- skip 0
- focused Playwright / typecheck / verify-design-tokens すべて green
- AC-1〜AC-9 の evidence が tracked file
- CI `playwright-smoke / smoke (chromium)` に focused attendance visual smoke が配線済み。実 green は commit / push / PR 後の user-gated evidence
