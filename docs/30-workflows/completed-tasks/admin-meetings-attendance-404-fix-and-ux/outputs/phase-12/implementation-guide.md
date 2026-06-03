**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12 / Task 12-1: 実装ガイド（admin 開催日追加 404 修正 + 出席管理 UI/UX 改善）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ガイドは実装済みの識別子・挙動を記録する。Task A は `server-fetch.ts` と同じ service binding first 方針を proxy route handler へ反映した。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

学校の先生が職員室から教室へ連絡するとき、2 つの方法があるとします。1 つは「校内放送（直通）」、もう 1 つは「メモを書いて、廊下に貼ってある古い掲示板に貼る」方法です。

今の管理画面はおかしなことになっています。**ページを開いて開催日の一覧を見るとき**は「校内放送（直通）」を使っていて、ちゃんと最新の教室につながります。ところが、**新しい開催日を追加するとき**だけは「古い掲示板」を使っていて、その掲示板はもう誰も見ていない古い場所なので、連絡が届かず「そんな教室はありません（404）」と返ってきてしまいます。

だから、開催日を追加しようとすると「開催追加に失敗: HTTP 404」と出て、いつまでたっても開催日が 0 件のまま追加できません。出席を記録する画面は「各回の開催日カードを開く」と出てくる仕組みなので、開催日が 1 件も作れないと、出席を記録する場所にもたどり着けません。これが「出席管理ができる画面になっていない」の正体です。

### 何をするか（その 1: 404 を直す）

追加するときも「校内放送（直通）」を使うようにそろえます。そうすれば、見るときも追加するときも同じ最新の教室につながるので、開催日がちゃんと追加できて 404 が消えます。たとえば「6 月の例会」を追加したら、すぐに一覧に「6 月の例会」のカードが現れます。

「直通」が用意されていない特別な環境（自分のパソコンでの開発用など）のときだけは、これまでどおり掲示板の住所（設定値）を使うようにして、開発が止まらないようにします。

### 何をするか（その 2: 出席管理を使いやすくする）

開催日が追加できるようになったうえで、出席管理を「ちゃんと使える画面」にします。

1. 開催日カードの見出しに「3 名出席」のように**出席した人数のバッジ**を出す。まだ誰も登録していなければ「出席 未登録」と出す。
2. カードを開いたときの出席者一覧を、これまでの「会員番号だけ」から**会員の氏名**に変える。氏名が分からないときだけ会員番号を出す。
3. カードを開く操作が「出席を記録・編集するためのボタン」だと分かるように、ラベルや読み上げ用の説明を付ける。
4. 一覧に「各開催日を開くと出席を記録・編集できます」という案内文を 1 行添える。

### 今回作るもの（まとめ）

- 開催日を追加できるようになる（404 が消える）。同時に、ほかの管理操作（タグ・会員状態・申請の処理など、同じ通り道を使っているもの）も一緒に直る。
- 出席状況が一目で分かる（人数バッジ）。
- 誰が出席したかが名前で分かる（氏名表示）。
- どこを押せば出席を記録できるかが分かる（導線・案内文）。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針

- **Task A（404 修正・P0）**: admin API proxy route handler（`apps/web/app/api/admin/[...path]/route.ts`）の transport を、`server-fetch.ts` と同一の「service binding `API_SERVICE` 優先 / 不在時のみ `INTERNAL_API_BASE_URL` HTTP fallback」へ統一する。現状 proxy は HTTP fetch のみで、GET（service binding 経由の `server-fetch`）と非対称なため、`INTERNAL_API_BASE_URL` の値依存で `POST /admin/meetings` が 404 になっている。
- **Task B（UI/UX）**: 開催日カードに出席人数バッジ・出席者氏名・導線を追加する。`MeetingsClientShell` が持つ `attended: Record<sessionId, Set<memberId>>` state を最新ソースとして使い、`MeetingItem.attendance`（初期値・stale 化し得る）には依存しない。
- 新規 API / 新規 hook / 新規 primitive / 新規 env アクセサはゼロ。`getAuthEnv()` は既に `API_SERVICE` を公開済み。`apps/api`・D1 schema・Google Form・`useAdminMutation`・`api.ts` の attendance パスは不変（不変条件 #1）。

### Task A — transport 選択の TypeScript 型と binding.fetch シグネチャ

`server-fetch.ts` の確定ロジック（移植元・引用）:

```ts
function getAdminServiceBinding(): { fetch: typeof fetch } | undefined {
  const env = getAdminFetchEnv();
  if (isTestOrPlaywright() && env.INTERNAL_API_BASE_URL) return undefined; // test 隔離分岐
  return env.API_SERVICE;
}

const binding = getAdminServiceBinding();
let res: Response;
if (binding) {
  res = await binding.fetch(`https://service-binding.local${path}`, init);
  logAdminTransport("service-binding", path, res.status);
} else {
  res = await fetch(`${resolveApiBase()}${path}`, init);
  logAdminTransport("http-fallback", path, res.status);
}
```

proxy 側（`route.ts`）で利用する binding の型は、Workers の Service binding（`Fetcher`）であり、本コードベースでは `{ fetch: typeof fetch }` として最小に扱う。`getAuthEnv().API_SERVICE` がこの型で公開済み（`env.ts:136-141`）。

```ts
// route.ts の transport 選択（server-fetch を模範に移植・実装確定）
// env は呼び出し側で getAuthEnv() を 1 度だけ評価して引き回す（module helper は env 引数を受ける）
type AuthEnv = ReturnType<typeof getAuthEnv>;

const isTestOrPlaywright = (env: AuthEnv): boolean =>
  process.env["NODE_ENV"] === "test" ||
  process.env["PLAYWRIGHT_TEST"] === "1" ||
  env.ENVIRONMENT === "local";

function adminServiceBinding(env: AuthEnv): AuthEnv["API_SERVICE"] {
  // server-fetch と同一の test/playwright 隔離: test かつ HTTP base がある場合は HTTP へ落とす
  if (isTestOrPlaywright(env) && env.INTERNAL_API_BASE_URL) return undefined;
  return env.API_SERVICE;
}
```

> `binding.fetch` の第 1 引数は仮想ホスト `https://service-binding.local` を prefix した URL とする（`server-fetch.ts` と同一規約）。proxy は `upstreamPath = /admin/${path.join("/")}${url.search}` を 1 度だけ組み立て、binding 経路では `https://service-binding.local${upstreamPath}`、HTTP 経路では `${base}${upstreamPath}` を使う（path 構築は分岐前に共通化）。

### Task A — proxy ハンドラの transport 分岐（確定コード）

変更前 `proxy()` の末尾は HTTP fetch のみ（404 の原因）。これを transport 3 分岐へ差し替える。`init`（method / headers / body）の組み立て・`requireAdmin()`・`needsSyncAdminBearer()`・cookie / authorization / content-type 中継・`init.body = await req.text()`（GET/DELETE 除外）はすべて不変。`upstreamPath` は分岐前に 1 度だけ構築する。

```ts
const env = getAuthEnv();
const url = new URL(req.url);
const upstreamPath = `/admin/${path.join("/")}${url.search}`;
// ...（headers / init の組み立ては不変）...

const binding = adminServiceBinding(env);
let upstream: Response;
if (binding) {
  // ① service binding 経路（staging / production の正経路）
  upstream = await binding.fetch(`https://service-binding.local${upstreamPath}`, init);
} else {
  // ② HTTP fallback（local dev）。base が無ければ既存の 500 fail-fast を維持
  const base = apiBase(env);
  if (base === null) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "internal_api_base_url_missing",
        message: "INTERNAL_API_BASE_URL is not configured for this environment",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  upstream = await fetch(`${base}${upstreamPath}`, init);
}
const text = await upstream.text();
return new Response(text, {
  status: upstream.status,
  headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
});
```

| 分岐 | 条件 | transport | 備考 |
| --- | --- | --- | --- |
| ① | `adminServiceBinding(env)` が binding を返す | `binding.fetch("https://service-binding.local${upstreamPath}", init)` | staging / production の正経路。404 解消 |
| ② | binding 無し かつ `apiBase(env)` が URL を返す | `fetch(`${base}${upstreamPath}`, init)` | local dev（`pnpm dev`）互換 |
| ③ | binding 無し かつ `apiBase(env)` が `null` | `500 internal_api_base_url_missing` | 従来の fail-fast 維持 |

> **状態所有権**: transport 選択は route handler（Facade 境界）に閉じる。優先順位ロジックを `env.ts` に漏らさない（`getAuthEnv()` は値提供のみ）。module helper（`adminServiceBinding` / `apiBase` / `isTestOrPlaywright`）はいずれも `env: AuthEnv` を引数で受け取り、`proxy()` 内で `getAuthEnv()` を 1 度だけ評価して引き回す。実装では transport ログ（`logAdminTransport`）は導入していない（upstream status をそのまま中継し、観測は呼び出し側に委ねる）。

### Task A — 既存挙動（不変境界・回帰防止）

| ブロック | 扱い |
| --- | --- |
| `requireAdmin()`（403） | 不変。transport 切替の前に評価 |
| `needsSyncAdminBearer(path)` + `SYNC_ADMIN_TOKEN`（欠落時 500） | 不変。`headers.authorization = Bearer ...` の付与位置も不変 |
| cookie / authorization / content-type 中継 | 不変 |
| `init.body = await req.text()`（GET/DELETE 除外） | 不変 |
| `GET = POST = PATCH = DELETE = proxy` の export | 不変 |
| upstream の status / content-type 戻し | 不変（binding/HTTP で同一の戻し方） |

### Task B — props 変更（state 引き渡し）

| component | 既存 props | 追加/変更 props | 由来 |
| --- | --- | --- | --- |
| `MeetingsClientShell` | `attended: Record<string, Set<string>>`, `candidates: ReadonlyArray<MemberCandidate>` | `getAttendanceCount` callback を `MeetingTimeline` へ渡す（既存 `attended` state からインライン算出） | 既存 state（新 state を増やさない） |
| `MeetingTimeline` | `items`, `onSelect` 等 | `getAttendanceCount?: (item: MeetingItem) => number` | `MeetingsClientShell` の `attended` 由来 |
| `MeetingAttendanceDrawer` | `attended`, `candidates` | 変更なし（内部で `candidateNameById` Map を構築） | 既存 `candidates` |

```tsx
// MeetingsClientShell: 最新 attended state からカウントを callback でインライン算出（stale 回避・新 state なし）
// <MeetingTimeline
//   items={items}
//   getAttendanceCount={(m) => attended[m.sessionId]?.size ?? m.attendance?.length ?? 0}
//   ...
// />
```

```tsx
// MeetingAttendanceDrawer: candidates → fullName 解決 Map
const candidateNameById = useMemo(
  () => new Map(candidates.map((c) => [c.memberId, c.fullName])),
  [candidates],
);
// 出席者行: const fullName = candidateNameById.get(mid);
//   {fullName ?? mid}{fullName ? <span className="text-xs text-muted"> ({mid})</span> : null}
```

```tsx
// MeetingTimeline: 見出しの出席人数バッジ + 導線 aria-label
// 親（MeetingsClientShell）が getAttendanceCount callback を渡し、Timeline 側で評価する
const attendanceCount = getAttendanceCount?.(m) ?? m.attendance?.length ?? 0;
const attendanceLabel = attendanceCount > 0 ? `${attendanceCount} 名出席` : "出席 未登録";
// <button aria-label={`${m.title}（${m.heldOn}）の出席を記録・編集`} aria-expanded={...}>
//   <span className="ui-badge" data-testid={`meeting-attendance-count-${m.sessionId}`}>
//     {attendanceLabel}
//   </span>
// </button>
```

### エラーハンドリング

| ケース | 仕様 |
| --- | --- |
| binding 経路で upstream が非 200 | upstream の status / content-type をそのまま返す（502 等に変換しない）。client mutation 側で既存どおりエラー表面化 |
| binding 不在 + URL 不在（非 local） | 従来どおり `500 internal_api_base_url_missing`（fail-fast 維持・AC-A2） |
| `SYNC_ADMIN_TOKEN` 欠落（sync 系 path） | 従来どおり `500 sync_admin_token_missing`（不変） |
| 氏名解決失敗（candidates に memberId なし） | `candidateNameById.get(mid) ?? mid` で memberId へ fallback（AC-B1） |
| `attended` が当該 sessionId を持たない | `getAttendanceCount?.(m) ?? m.attendance?.length ?? 0` が 0 → `出席 未登録` 表示（AC-B2） |

### エッジケース

| ケース | 仕様 |
| --- | --- |
| test / Playwright かつ `INTERNAL_API_BASE_URL` あり | `isTestOrPlaywright(env)` 隔離で binding を使わず HTTP へ落とす（既存テスト互換・server-fetch と同一） |
| 出席追加直後の人数バッジ | `attended` state 由来のため即時反映（`MeetingItem.attendance` 初期値に依存しない・stale 回避） |
| GET / DELETE の body | `init.body` を組まない（既存条件 `req.method !== "GET" && req.method !== "DELETE"` 不変） |
| 開催日 0 件 | 既存 `AdminEmptyState` を維持。導線テキストは 1 件以上時のみ表示（AC-B4） |
| 同一 proxy を通る他 admin mutation（tags / member-status / requests） | transport 統一により同時回復。回帰確認は AC-A5 |

### 設定項目と定数一覧

本タスクで追加する設定値・新規定数・新規トークンは**なし**。利用する既存値のみ。

| 項目 | 値 | 備考 |
| --- | --- | --- |
| `API_SERVICE`（service binding） | wrangler service binding | 既存。`getAuthEnv().API_SERVICE` で公開済み |
| `INTERNAL_API_BASE_URL` | env | 既存。binding 不在時の HTTP fallback base |
| `LOCAL_DEV_FALLBACK` | `http://127.0.0.1:8787` | 既存定数。local dev の最終 fallback（不変） |
| service binding 仮想ホスト | `https://service-binding.local` | `server-fetch.ts` と同一規約 |
| `getAttendanceCount` callback | `attended` state 由来でインライン算出 | 新 state なし |
| 新規トークン | なし | markup 追加が最小（既存 `admin-*` class + token） |

### テスト構成

| レイヤ | ファイル | 追加ケース（TC-ID は Phase 7 と対応） |
| --- | --- | --- |
| focused vitest（A） | `apps/web/app/api/admin/[...path]/route.spec.ts` | TC-A-binding（binding mock → `binding.fetch` 呼出 + upstream status 中継）/ TC-A-http（binding 無し + URL あり → HTTP）/ TC-A-missing（binding 無し + URL 無し + 非 local → 500）。`requireAdmin` 403・`needsSyncAdminBearer` の既存挙動が退行しないこと。PASS（6 tests） |
| focused vitest（B1） | `MeetingAttendanceDrawer.spec.tsx` | TC-B1（候補あり → 氏名表示）/ TC-B1-fallback（候補に無い memberId → memberId 表示） |
| focused vitest（B2/B3） | `MeetingTimeline.spec.tsx` | TC-B2（`N 名出席`）/ TC-B2-zero（`出席 未登録`）/ TC-B3（見出し button の aria-label が導線として識別可能） |
| focused vitest（B2/B4） | `MeetingsClientShell.spec.tsx` | TC-B2（バッジ値が `attended` state 由来で stale でない）/ TC-B4（導線テキスト表示） |

実行: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts <上記 spec パス>`（ルートから config 明示・`apps/web/vitest.config.ts` は不在）。

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | endpoint / payload 不変。proxy は transport 切替のみ。`apps/api` 不変 |
| #2 OKLch トークン正本 | バッジ色は既存 `admin-*` class / token 変数。HEX 直書きなし（`verify-design-tokens` 対象） |
| #5 D1 直接アクセス禁止 | proxy は backend Worker（binding/HTTP）経由のみ。D1 binding に触れない |
| #9 primitive 経由 | 既存 timeline class / `AdminStat` / `AdminEmptyState` を流用。新規 primitive・新規 `<input>` を増やさない |
| #10 useAdminMutation | client mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変）。legacy `@/lib/useAdminMutation` 不使用 |

### DoD（Definition of Done）

- `pnpm typecheck` pass / `pnpm lint` pass。
- focused vitest（route transport 3 分岐 / 各 component 新挙動）が pass。
- 既存 admin proxy 経由 mutation（tags resolve / member status / requests resolve）が回帰なし（AC-A5）。
- staging で `POST /api/admin/meetings`（admin cookie + 有効 body）が 201、開催日が一覧に追加される（AC-A4・user-gated 実測）。
- AC-A1..A5 / AC-B1..B5 すべて達成。

---

## 視覚証跡

本タスクは VISUAL_ON_EXECUTION（開催日追加成功で 404 が消えてカードが現れる視覚変化・出席人数バッジ・氏名表示）を伴う。ただし screenshot は **staging 認証（admin cookie）が必要**なため **user-gated** であり、現時点では **未取得（pending）**。canonical 名のみ Phase 11 と一致させて固定する。

| # | ファイル名（計画） | 撮影状態（計画） | 取得状態 |
| --- | --- | --- | --- |
| 1 | `admin-meetings-attendance-after-fix.png` | 開催日追加が 201 で成功し、開催日カードが一覧に出現（404 解消） | pending（user-gated staging） |
| 2 | `admin-meetings-attendance-count-badge.png` | 出席人数バッジ（`3 名出席` / `出席 未登録`）+ 展開時の出席者氏名表示 | pending（user-gated staging） |

> focused Vitest は取得済み。staging 実測・screenshot は user-gated 操作で取得する。`screenshots/` に空 PNG・placeholder は作らない（PNG 0 件が正）。
