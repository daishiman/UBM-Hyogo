# Phase 12 実装ガイド — admin サイドバー Google Form 回答編集リンク追加

## Part 1: 中学生にもわかる説明（専門用語なし）

### なぜ必要か

管理者が、Google フォームに集まった回答を「直接いじりたい」ことがあります。今までは、別のブラウザのタブを
開いて、長い URL を手で打ち込んだり、ブックマークを探したりしていました。これは毎回めんどうです。
そこで、管理画面の左側にあるメニュー（サイドバー）に「Form回答」というボタンを 1 個足して、
押すだけで回答編集ページに飛べるようにしました。

### 何が変わるか

管理者は、管理画面を開いたまま「Form回答」を押すだけで、別タブの Google Form 回答編集画面へ移動できる。
長い URL を探す作業がなくなり、会員情報が反映されない原因をフォーム回答側からすぐ確認できる。

### 「外部リンク」って何？

メニューのほかのボタンは、この管理サイトの**中**のページに移動します。たとえば「会員」を押すと
会員一覧ページに切り替わります。これは「同じ建物の中の別の部屋に行く」イメージです。

でも今回足したボタンは、Google フォームという**よその場所（外部）**に飛びます。
これを「外部リンク」と呼びます。よその場所なので、行き方をちょっと変える必要があります。

### なぜ「別のタブ」で開くの？

外部リンクは、今見ている管理画面を消さずに、**新しいタブ**（別の窓）でフォームを開くようにしました。
こうすると、フォームをいじったあとに元の管理画面へすぐ戻れます。同じタブで開いてしまうと、
管理画面が消えてしまって不便だからです。

### `target="_blank"` と `rel="noopener noreferrer"` って何？

- `target="_blank"`: 「新しいタブで開いてね」という合図です。これで別タブが開きます。
- `rel="noopener noreferrer"`: 「安全のためのカギ」です。

  新しいタブで外部ページを開くと、開いた先のページが、こっそり**元のタブを操作できてしまう**ことが
  あります（元のタブを勝手に別のあやしいページに書き換える、など）。これを「タブナビング」と呼びます。
  `rel="noopener noreferrer"` を付けると、新しいタブから元のタブへの**つながり（窓口）を切る**ので、
  外部ページがこちらを乗っ取れなくなります。だから外部リンクには必ずこの 2 つをセットで付けます。
  これは本プロジェクトの不変条件 #7 にもなっています。

### メニュー項目に「外部リンクですよ」という目印（external フラグ）を足す

メニューの各ボタンは「ラベル（表示名）」「飛び先」「アイコン」などの情報を持っています。
今回は、ここに「これは外部リンクですよ」という**目印（`external` というフラグ）**を 1 個足しました。

ボタンを描くプログラムは、この目印を見て:

- 目印が **ある** ボタン → 別タブで開く `<a>` にして、右上に `↗`（外に出る矢印）マークを付ける。
  さらに目には見えないが読み上げソフト用に「（外部リンク）」という説明も付ける。
- 目印が **ない** ボタン → 今まで通り、サイト内のページに移動する。

こうすると、外部リンクだけ特別な開き方になり、見た目でも「これは外に飛ぶんだな」と分かります。

### 「今いるページ」の強調（active）から外す理由

メニューは、今開いているページのボタンを色で**強調（active）**します。でも外部リンクは
「よその場所」なので、この管理サイトの中で「今ここにいる」という状態になりません。だから
外部リンクは、強調の対象から**外して**あります。強調してしまうと「今ここにいる」と勘違いさせるからです。

### なぜ URL を「定数」にするの？

フォームの URL は長くて複雑です。これをボタンの中に直接書いてしまうと、
あとで URL が変わったときに、書いた場所を探して直すのが大変ですし、書き間違いも起きます。
そこで URL を `FORM_RESPONSES_EDIT_URL` という**名前付きの箱（定数）に 1 か所だけ**しまっておき、
ボタンはその箱の名前を呼ぶだけにしました。これなら URL を変えたいときは箱の中身を 1 か所直すだけで済み、
書き間違いも防げます（ハードコード禁止）。

### まとめ

- 管理画面のメニューに「Form回答」ボタンを 1 個追加した。
- それは外部（Google フォーム）に飛ぶ「外部リンク」。
- 別タブで開き、安全のため `target="_blank"` + `rel="noopener noreferrer"` を付ける。
- メニュー項目に「外部リンク」の目印（external フラグ）を足して開き方を分岐した。
- 「今ここ」の強調からは外す。
- URL は `FORM_RESPONSES_EDIT_URL` 定数に 1 か所だけ置く（書き間違い防止）。

### 今回作ったもの

管理画面の左メニューに「Form回答」という外部リンクを作った。これにより、管理者は元の管理画面を残したまま、
別タブで Google Form の回答編集画面を開ける。

---

## Part 2: 技術者向け実装ガイド

> 識別子は landed 実装（親 PR #1064 / commit `745c95115`）に一致。本サイクルは正本記述（`verify_existing`）であり、
> `apps/web` の新規差分は発生させない（`git diff origin/dev...HEAD -- apps/web` は空）。

### 全体データフロー

```
shell-config.ts: buildAdminGroup()
  └─ ShellNavItem[] に { id: "form-responses", label: "Form回答",
                         href: FORM_RESPONSES_EDIT_URL, icon: "form-responses", external: true } を追加
       └─ SidebarNavItem.tsx が item.external を見て描画分岐
            external === true → <a href={item.href} target="_blank" rel="noopener noreferrer">
                                  + アイコン + ラベル + ↗ + <span class="sr-only">（外部リンク）</span>
                                  + active 判定をスキップ（aria-current を付けない）
            external falsy    → 既存の内部リンク描画（next/link・active 判定あり）
       └─ icons.tsx: ICONS Record<ShellNavIcon, ReactNode> に "form-responses" の SVG path を追加
            （網羅型 Record のため key 追加を忘れると型エラーで CI が落ちる＝型強制）
```

### 変更ファイルと役割

| 区分 | パス | 役割 |
| --- | --- | --- |
| 定数 | `apps/web/src/lib/constants/form.ts` | `FORM_RESPONSES_EDIT_URL` を export（外部リンク URL の唯一の正本） |
| nav config | `apps/web/src/components/shell/shell-config.ts` | `ShellNavItem` の icon union に `"form-responses"` を追加 / `external?: boolean` フィールド追加 / `buildAdminGroup()` に項目追加 |
| icon | `apps/web/src/components/shell/icons.tsx` | 網羅型 `Record<ShellNavIcon, ...>` に `"form-responses"` の SVG path を追加 |
| 描画 | `apps/web/src/components/shell/SidebarNavItem.tsx` | `item.external` 分岐で `<a target="_blank" rel="noopener noreferrer">` + `↗` + sr-only + active 除外 |
| 定数 spec | `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | `FORM_RESPONSES_EDIT_URL` の値・形を検証 |
| 描画 spec | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | external 時の `target`/`rel`/sr-only/active 除外を 3 test で検証 |
| nav config spec | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | `buildAdminGroup()` に external 項目が含まれることを検証 |

### nav 項目への external フラグ設計

```typescript
// shell-config.ts（概念）
export type ShellNavIcon = /* ...既存... */ | "form-responses";

export interface ShellNavItem {
  id: string;
  label: string;
  href: string;
  icon: ShellNavIcon;
  external?: boolean; // ← 追加。未指定（falsy）は内部リンク（後方互換）
}

// buildAdminGroup() 内
{
  id: "form-responses",
  label: "Form回答",
  href: FORM_RESPONSES_EDIT_URL,
  icon: "form-responses",
  external: true,
}
```

> `external?` は optional。既存の内部 nav 項目は未指定＝従来挙動のままで、後方互換を保つ。

### 描画分岐（SidebarNavItem.tsx・概念）

```tsx
if (item.external) {
  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer" /* active 判定なし */>
      <Icon name={item.icon} />
      <span>{item.label}</span>
      <span aria-hidden>↗</span>
      <span className="sr-only">（外部リンク）</span>
    </a>
  );
}
// 既存の内部リンク描画（next/link + active 判定）
```

> external 分岐では `aria-current` / active クラスを付与しない（AC-D4）。`↗` は装飾なので `aria-hidden`、
> 判別語は `sr-only` のテキストでスクリーンリーダーに伝える。

### APIシグネチャ

外部サービス API は追加しない。本変更の実装シグネチャは `buildNavForRole(role, ctx?)` と
`SidebarNavItem` props に閉じる。

```typescript
export function buildNavForRole(
  role: ShellRole,
  ctx?: { readonly schemaDiffCount?: number },
): ShellNavGroup[];

export function SidebarNavItem(props: {
  readonly item: ShellNavItem;
  readonly collapsed: boolean;
  readonly activePath: string;
}): React.ReactElement;
```

### 使用例

```typescript
const adminGroups = buildNavForRole("admin");
const adminItems = adminGroups.find((group) => group.id === "admin")?.items ?? [];
const formResponsesItem = adminItems.find((item) => item.id === "form-responses");

// formResponsesItem は external=true なので SidebarNavItem が <a target="_blank"> で描画する。
```

### エラーハンドリング

- `FORM_RESPONSES_EDIT_URL` が誤って変更された場合は `form-responses.spec.ts` が canonical URL 不一致で fail する。
- `"form-responses"` icon を `PATHS` に追加し忘れた場合は `Record<ShellNavItemId, string>` により typecheck が fail する。
- external 項目に active 属性が付いた場合は `SidebarNavItem.spec.tsx` が `aria-current=null` / `data-active=null` で fail する。

### エッジケース

- collapsed sidebar では label が `sr-only` になり、`↗` は非表示にする。リンク自体と sr-only 外部リンク告知は維持する。
- external item はどの app pathname とも一致しないため、`/admin/audit` など内部 route 表示中でも active にしない。
- `external?` は optional なので、既存内部 item は未指定のまま従来どおり `next/link` で描画される。

### 設定項目と定数一覧

| 定数 / 設定 | 値 / 役割 |
| --- | --- |
| `FORM_RESPONSES_EDIT_URL` | Google Form 回答編集画面 URL の単一正本 |
| `ShellNavItem.external?` | true のとき外部 `<a>` 分岐へ切替 |
| `ShellNavItemId = "form-responses"` | nav item / icon Record の key |

### テスト構成

| spec | 役割 |
| --- | --- |
| `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | URL 定数の canonical 値を検証 |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | admin nav に external item が含まれることを検証 |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | `<a target/rel>`、sr-only、active 非付与、collapsed 挙動を検証 |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/lib/constants/__tests__/form-responses.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

> vitest はリポジトリルートから実行する。

### ローカル検証結果（2026-06-01 実測）

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | exit 0（6 workspace projects typecheck Done） |
| `mise exec -- pnpm lint` | exit 0（dependency-cruiser / stable-key-update / no-inline-style / workspace lint Done。`stablekey-literal-lint` は既存 warning 2 件・mode=warning） |
| `mise exec -- pnpm exec vitest run apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | exit 0（Test Files 3 passed / Tests 13 passed） |
| `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | exit 0（Test Files 1 passed / Tests 9 passed） |

### 受け入れ条件との対応

| AC | 条件 | 実装上の担保 | 主検証 |
| --- | --- | --- | --- |
| AC-D1 | クリックで Form 編集 URL を別タブで開く（元画面は遷移しない） | `external` 分岐で `<a target="_blank">` | `SidebarNavItem.spec.tsx` |
| AC-D2 | `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7・タブナビング防止） | external 分岐に固定付与 | `SidebarNavItem.spec.tsx` |
| AC-D3 | href は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止） | `buildAdminGroup()` が定数を参照 | `form-responses.spec.ts` / `shell-config.spec.ts` |
| AC-D4 | `↗` + sr-only 判別 + active 対象外 | external 分岐で `↗`/sr-only 付与、active 判定スキップ | `SidebarNavItem.spec.tsx` / `shell-config.spec.ts` |

### 視覚証跡

本タスクは VISUAL（admin サイドバー nav に項目を 1 件追加する UI 変更）だが、対象画面 `/(admin)/admin/**` は
staging 認証（admin ログイン）必須であり、認証を伴う staging 操作は user-gated である。よって
**screenshot は取得せず `pending`（user-gated）** とし、主証跡は `apps/web` の jsdom render unit /
純関数 unit / 定数 unit（自動テスト）とする two-tier evidence を採る。詳細は Phase 11 証跡を参照。

## 完了条件

- Part 1（中学生レベル説明）と Part 2（技術者向けガイド）の両方を含むこと。
- 外部リンク・`target=_blank`/`rel=noopener noreferrer`（タブナビング）・external フラグ設計・URL 定数化の
  平易な説明が含まれること。
- 変更ファイルと役割の表・検証コマンド・AC 対応表を含むこと。
- VISUAL だが screenshot は user-gated（pending）である two-tier evidence が明記されていること。
