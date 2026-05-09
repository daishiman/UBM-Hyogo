[実装区分: 実装仕様書]

> CONST_004 判定根拠: Phase 12 の出力 `outputs/phase-12/implementation-guide.md` は文書だが、本サブタスク全体（Phase 1-13）が **実コード成果物（`admin-requests.spec.ts`）** を生む実装仕様書であるため、その完了を表明する Phase 12 も実装仕様書系列として一体管理する。

# Phase 12: ドキュメント更新（Implementation Guide）— サブタスク 2a 単体

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 出力先 | `docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-12/implementation-guide.md` |
| 構成 | Part 1（中学生レベル概念）+ Part 2（実装詳細） |
| 親 phase | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-12.md` |
| 対象読者 | レビュアー / 中学生レベルの読者にも導入を理解してもらう想定 |

---

## 1. ドキュメント更新対象（2a 単体）

| # | path | 更新種別 | 必須 |
|---|------|---------|------|
| 1 | `docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-12/implementation-guide.md` | 新規（Part 1/2） | 必須 |
| 2 | `docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-11/report.md` | Phase 11 完了後に新規 | Phase 11 で生成 |

> Stage 2 全体の `index.md` Phase status table 更新は **本サブタスク範囲外**（親 workflow 側で管理）。

---

## 2. Implementation Guide Part 1（中学生レベル概念説明）

> 専門用語を最小化し、具体例で説明する。長文を避け、表と短文を中心に構成する。

### 2.1 このタスクで何をやるのか — 1 行で

「**管理者が申請を承認したり却下したりする画面が、ちゃんと動くかどうかをロボットに自動で確かめてもらう**」ためのテストを書く。

### 2.2 登場人物の説明

| 言葉 | わかりやすい説明 | 具体例 |
|------|----------------|--------|
| 管理者（admin） | サイトを運営する人 | 申請を「OK」「NG」と判断する人 |
| 会員（member） | サイトに登録した普通の人 | 自分のページは見られるが、他人を OK/NG する権限はない |
| 未ログイン（anonymous） | まだログインしていない人 | 玄関の前に立っているだけの状態 |
| 申請（request） | 「会員になりたい」「情報を直してほしい」などのお願い | ポストに届いた手紙のようなもの |
| approve（承認） | 申請を「OK」とする操作 | 手紙に「許可」のハンコを押す |
| reject（却下） | 申請を「NG」とする操作 | 手紙に「断り」のハンコを押す。理由も書く |
| Playwright | 自動でブラウザを動かしてくれるロボット | 人の代わりにマウスとキーボードを操作 |
| mock（モック） | 「もし本物の API がこう答えたら」と仮定する偽の返事 | 本物のサーバーに迷惑をかけずにテストするための「ごっこ遊び」 |

### 2.3 「画面の自動テスト」って具体的に何をするの？

ロボット（Playwright）が以下を順番に行う:

1. 管理者として `/admin/requests` のページを開く
2. 申請が 3 件表示されているか確認する
3. 1 件目の「承認」ボタンを押す
4. その行が画面から消えたか確認する
5. 別の行の「却下」ボタンを押し、理由を書いて送信する
6. ちゃんと送信できたか確認する

これを **毎回手で確認するのは大変だしミスもする**ので、ロボットに任せる。

### 2.4 「race（レース）」って何？

「**同じボタンを 2 回続けて押してしまったときに、サイトが壊れないか**」を確かめるテスト。

たとえば、管理者が承認ボタンを押した直後に、もう一度押してしまった場合:

- 1 回目: 「承認しました」と返ってくる（正常）
- 2 回目: 「もう承認済みです」とエラーが返ってくる（正常な拒否）

このように **2 回目はちゃんと「だめだよ」と返してくれるか** を確かめる。これが race テスト。
本タスクでは「カウンター」という仕組みで「何回目の呼び出しか」を数えて返事を変える方法を使う。

### 2.5 「認可（にんか）」って何？

「**この人にこの操作をしていいか確かめる**」こと。家の鍵に似ている。

| 鍵を持っているか | 入れる場所 |
|------------------|-----------|
| 管理者の鍵 | 管理画面に入れる |
| 会員の鍵 | 自分のマイページには入れる。管理画面は入れない（403 = 立ち入り禁止） |
| 鍵なし | ログイン画面に案内される（401 → `/login`） |

このタスクでは、**3 種類の人**でそれぞれ正しく扉が閉まっているかを確認する。

### 2.6 なぜ本物のデータベースを使わないの？

本物のデータベース（Cloudflare D1）を使うと:

- テストのたびにデータが書き換わって他のテストに影響する
- 速度が遅い
- 失敗した時に原因が分かりにくい

そこで「**もし API がこう返してきたら**」という偽の返事（mock）を使う。お店ごっこの「これがハンバーガーね」と紙を渡すのと同じ。

### 2.7 このタスクで増やすもの

| 増やすもの | 個数 |
|-----------|------|
| テストケース（テストの種類） | 6 件 |
| 新しい仕組みの追加（API・DB・ライブラリ） | 0 件（既存の仕組みだけで作る） |
| スクリーンショット | 0 件（mock で動くので画像は不要） |

---

## 3. Implementation Guide Part 2（実装詳細）

### 3.1 ファイル一覧（2a 単体）

| path | 役割 | 区分 | 行数目安 |
|------|------|------|---------|
| `apps/web/playwright/tests/admin-requests.spec.ts` | 本 spec の主成果物（6 test） | 新規 | 実装に応じた最小行数 |
| `apps/web/playwright/fixtures/auth.ts` | `adminPage` / `memberPage` / `anonymousPage` を import 参照 | 既存・参照のみ | — |
| `apps/api/src/routes/admin/requests.ts` | mock 対象 endpoint shape の正本 | 既存・参照のみ | — |

### 3.2 test 構造（6 件）

| # | test 名 | fixture | 主 assertion |
|---|---------|---------|-------------|
| 1 | pending list 表示 | `adminPage` | row 3 件、各行 `status=pending` バッジ |
| 2 | approve 成功 | `adminPage` | POST body `{ resolution: 'approve' }`、行消失 |
| 3 | reject + reason 必須 | `adminPage` | 空 submit で inline error → 入力後 POST body `{ resolution: 'reject', resolutionNote }` |
| 4 | race（stale approve は 409） | `adminPage` | stale 409 mock により 2 回目 409 `already_resolved` |
| 5 | member は `/login?gate=admin_required` redirect | `memberPage` | `/login` redirect |
| 6 | anonymous は `/login` redirect | `anonymousPage` | URL に `/login` |

### 3.3 mock 戦略（`page.route()`）

| pattern | endpoint | 例 |
|---------|---------|-----|
| GET 一覧 | `**/admin/requests*` | `route.fulfill({ status: 200, json: { items: [...] } })` |
| POST mutation | `**/admin/requests/*/resolve` | `route.fulfill({ status: 200, json: { ... } })` + body assert |
| race counter | 同上 | closure で `calls` を増やし `calls === 1 ? 200 : 409` |

> 全 mock は spec 内 inline で記述し、Phase 8 での `helpers/admin-mocks.ts` 抽出は **本サブタスク範囲外**。

### 3.4 counter race パターン（疑似コード）

```ts
let calls = 0
await adminPage.route('**/admin/requests/*/resolve', async (route) => {
  calls += 1
  if (calls === 1) {
    return route.fulfill({
      status: 200,
      json: { noteId, resolvedAt, resolution: 'approve' },
    })
  }
  return route.fulfill({
    status: 409,
    json: { error: 'already_resolved' },
  })
})
```

- counter は **test scope の closure** で保持（`beforeEach` には持ち込まない）
- test 4 専用。test 1-3, 5-6 には mount しない

### 3.5 認可境界（3 ロール）

| role | fixture | API 応答 | UI 期待 |
|------|---------|---------|--------|
| admin | `adminPage` | 200 | admin UI 描画 |
| member | `memberPage` | `/login` | `/login?gate=admin_required` redirect |
| anonymous | `anonymousPage` | 401 | `/login` redirect |

> API 側応答（403/401）は実 `requireAdmin` を経由する（mock 不要・任意）。UI 側の redirect / 403 page を主 assertion とする。

### 3.6 fixture object 標準形

```ts
type AdminRequestItem = {
  noteId: string
  memberId: string
  requestStatus: 'pending'
  requestedAt: string
  updatedAt?: string
  resolution?: 'approve' | 'reject'
  resolutionNote?: string
}
```

- `mergedMemberId` 等の禁止 key は **使用しない**（DoD §10-9 で grep 検証）

### 3.7 不変条件（CLAUDE.md UI alignment 1-5）

- 既存 API endpoint surface のみ利用（新 endpoint・D1 schema 変更・Google Form 変更すべて禁止）
- OKLch tokens 経由（HEX / `bg-[#xxx]` 直書き禁止）
- `apps/web` から D1 直接アクセス禁止（mock 経由のみ）
- 新 fixture 追加禁止（`auth.ts` 既存 3 fixture を再利用）
- `test.skip` 0 件（cascade preview の skip は 2c のみ）

### 3.8 Definition of Done（要約 / 詳細は 2a-admin-requests.md §10）

| # | 基準 |
|---|------|
| 1 | spec ファイル存在 |
| 2 | 仕様ケース 6 件 |
| 3 | Playwright `test:e2e admin-requests.spec.ts` で 6/6 green / skip 0 |
| 4 | typecheck pass |
| 5 | lint pass |
| 6 | 3 ロール fixture が test 構造に存在 |
| 7 | `page.route()` mock のみ / D1 binding 参照 0 |
| 8 | `grep -c "test\.skip" == 0` |
| 9 | `grep "mergedMemberId" == 0` |
| 10 | stale 409 mock による race 2 回目 409 経路あり |

### 3.9 cascade preview の扱い

`/admin/requests` には cascade preview 機能は **含まれない**（cascade preview は 2c の `admin-member-delete` 範疇）。本サブタスクには `test.skip` を 1 件も含めない。

---

## 4. Phase 12 完了定義

- [x] Part 1（中学生レベル概念説明）が「画面の自動テスト」を具体例で説明
- [x] Part 1 が登場人物 / race / 認可 / mock を中学生語彙で説明
- [x] Part 2 にファイル一覧 / test 構造 / mock 戦略 / counter race / 認可境界 / 不変条件 / DoD が網羅
- [x] 出力先が `outputs/phase-12/implementation-guide.md` で確定
- [x] cascade preview が 2a 範囲外であることを明示

> Phase 13 へ進める。

---

## 参照

| 用途 | path |
|------|------|
| 主入力 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 親 Phase 12 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-12.md` |
| 中学生レベル要件 | `CLAUDE.md` § Claude Code 設定 / task-specification-creator skill Phase 12 仕様 |
