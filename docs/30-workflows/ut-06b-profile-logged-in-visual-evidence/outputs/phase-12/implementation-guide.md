# Implementation Guide

## Part 1: 中学生レベル

### これは何をするタスクか（学校生活の例え話）

このタスクは、「学校の掲示板に貼ってある自己紹介カード」を確認する作業に似ています。掲示板のカードは「見るだけ」で、その場で書き換えたり、新しい紙を貼り付けたりはできません。書き換えたいときは、職員室にある「書き換え用紙（Google Form）」をもらってきて、別の場所で書き直してから先生に渡す決まりになっています。

このタスクで確認する `/profile` というページも、まさにこの掲示板と同じです。ログインして自分のページを開くと、自分の情報が表示されますが、その画面の中には「書き換えボタン」も「入力欄」もありません。書き換えたいときは別の用紙（Google Form）に飛ぶ仕組みです。

確認のしかたは 2 つあります。1 つ目は、画面そのものを写真に撮るように保存する「スクリーンショット」。2 つ目は、画面の中に「ボタンや入力欄がいくつあるか」を数える小さなプログラムを走らせて、答えが「0 個」になることを確かめる方法です。両方の証拠が揃って、はじめて「この掲示板は本当に見るだけだね」と言えます。

さらに、URL の最後にこっそり `?edit=true` という"おまじない"を付けても、書き換え画面が出てきてはいけません。これも上の 2 つの方法で「ボタンや入力欄は 0 個のまま」だと確かめます。自分のパソコン（ローカル）と、インターネット上の検証用サーバー（staging）の両方で同じ確認を行います。

### 専門用語セルフチェック表

| 用語 | 中学生向け説明 | 例え |
| --- | --- | --- |
| profile | ログインした人の「自分のページ」 | 学校の自己紹介カード |
| URL クエリパラメータ | URL の後ろに `?` を付けて指示を渡す書き方 | お店の注文伝票の備考欄 |
| スクリーンショット | 画面そのものを写真として保存したファイル | 黒板を写真で撮ること |
| read-only | 「見るだけ」で書き換え不可な状態 | ガラスケースの中の展示物 |
| 不変条件 | 「絶対にこうあるべき」というルール | 校則のように破ってはいけない決まり |

## Part 2: 技術者レベル

### TypeScript / route surface

- UI route: `apps/web/app/profile/page.tsx` renders `/profile` after authenticated session resolution.
- Data route dependencies: `GET /me` and `GET /me/profile`.
- Web helper dependency: `apps/web/src/lib/fetch/authed.ts`.
- Static guard: `apps/web/src/__tests__/static-invariants.test.ts` rejects `form`, `input`, `textarea`, and submit buttons under `app/profile`.

### Capture API / commands

Manual DevTools snippets output only this shape:

```ts
type ProfileVisualObservation = {
  path: string;
  selector: "form,input,textarea,button[type=submit]";
  count: number;
  timestamp: string;
};
```

Local evidence:

- `M-08-profile.png`: logged-in `/profile`.
- `M-09-no-form.png` and `M-09-no-form.devtools.txt`: read-only selector count is `0`.
- `M-10-edit-query-ignored.png` and `M-10-edit-query-ignored.devtools.txt`: `/profile?edit=true` keeps count `0`.

Staging evidence:

- `M-14-staging-profile.png`: logged-in staging `/profile`.
- `M-15-edit-cta.png`: external Google Form edit CTA, no inline edit form.
- `M-16-localstorage-ignored.png` and `M-16-localstorage-ignored.devtools.txt`: sanitized localStorage / DOM observation only.

Parent evidence:

- `manual-smoke-evidence-update.diff`: parent 06b M-08〜M-10 / M-14〜M-16 rows move from `pending` to `captured`.

### Error handling / edge cases

- If local session cannot be established, keep Phase 11 `not executed` and do not create placeholder PNGs.
- If staging is unavailable before 09a, mark the workflow `partial`; root `completed` remains forbidden.
- If any evidence contains `token`, `cookie`, `authorization`, `bearer`, or `set-cookie`, discard and recapture after redaction.
- If `/profile?edit=true` renders any inline form/input/textarea/submit button, Phase 11 fails and the UI implementation must be fixed before documentation close-out.

### Constants / hygiene

- Canonical evidence count: 10 files = 6 screenshots + 3 DevTools txt + 1 diff.
- Support metadata count: 4 files = `screenshot-plan.json`, `manual-test-result.md`, `ui-sanity-visual-review.md`, `phase11-capture-metadata.json`.
- Secret hygiene check must treat a grep match as FAIL and no match as PASS.
