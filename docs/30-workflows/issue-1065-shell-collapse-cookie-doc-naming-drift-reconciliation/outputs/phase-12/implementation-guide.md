# Implementation Guide — issue-1065 shell-collapse-cookie 命名 SSOT 整合

- 区分: 実装仕様書（NON_VISUAL / implementation_mode: new）
- workflow: `docs/30-workflows/issue-1065-shell-collapse-cookie-doc-naming-drift-reconciliation/`
- issue: #1065（CLOSED・2026-06-02T21:40:20Z）/ 本仕様書は CLOSED のまま現行コードへ再スコープ（reopen しない）
- 対象ファイル: `apps/web/src/components/shell/shell-collapse-cookie.ts`（+ 設計 doc 3 本の命名整合）

---

## Part 1（やさしい説明 / 中学生レベル）

### 背景（なぜ必要か）

このタスクが必要な理由は、**1 つの機能（しくみ）に「呼び名」が 2 つあって混乱の元になっている**からです。

たとえば、学校で同じ 1 人の先生を「田中先生」と「ミスター・タナカ」の 2 つの呼び方で呼ぶと、初めて聞いた人は「2 人の別の先生がいるのかな？」と勘違いします。実際には同じ 1 人なのに、呼び名が 2 つあるだけで混乱が生まれます。

今回のプログラムでも同じことが起きています。サイドバー（画面の横にあるメニュー）を「畳んだ／開いた」状態を覚えておくための小さなしくみがあり、その部品（関数や定数）に対して、本当に使われている**正式な呼び名**と、もう使われていない**古い別名（エイリアス）**の 2 種類が残っていました。専門用語で「エイリアス」とは、同じものに付けた別の名前のことです。

### 何をするか（要約）

やることはシンプルです。本やノートの背表紙に貼るラベルを 1 つに統一するのと同じで、**正式な呼び名だけを残し、もう誰も使っていない古い別名 3 つを消します**。さらに、設計の説明書（ドキュメント）3 冊に書かれている古い呼び名を、正式な呼び名へ書き直します。

- 残す正式な呼び名（5 つ）はそのまま。
- 使われていない古い別名（3 つ）を削除する。
- 設計ドキュメント 3 本の古い呼び名を、正式な呼び名へ統一する。

これによって、次にこのコードを読む人が「呼び名が 2 つある＝何か違うものなのかな？」と迷わなくなります。これが「SSOT（Single Source of Truth／唯一の正しい情報源）」という考え方です。「正しい呼び名はこれ 1 つ」とハッキリ決める、という意味です。

### 実装ステップ（やさしい順番）

1. まず「古い別名 3 つが、本当にどこからも使われていないか」を確認する（grep という検索で 0 件を確認）。
2. 確認できたら、古い別名 3 行を削除する。
3. 設計ドキュメント 3 本の古い呼び名を、正式な呼び名へ書き直す。
4. 型チェック・lint・テストを動かして、何も壊れていないことを確かめる。

### 既知の注意点

- これは画面（見た目）を一切変えない作業です。だからスクリーンショットは不要です。
- クッキー（cookie＝ブラウザが状態を覚えておく小さなメモ）の名前や中身は**一切変えません**。名前を変えると、すでに状態を覚えている利用者の設定が消えてしまうからです。

---

## Part 2（開発者向け詳細）

### 背景

`shell-collapse-cookie.ts` はサイドバー collapse 状態を cookie へ永続化する内部 helper。実装上の primary 名（5 export）と、過去の設計 doc で使われた別名が混在し、コード末尾に **apps/web/src 内 0 参照の dead alias 3 件**が残っていた。命名 SSOT を **code-primary** に確定し、dead alias を削除、設計 doc を primary 名へ整合させる。

### 要約

- keep（正本 5 export）: 後述シグネチャ。
- delete（dead alias 3 件）: `SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`。
- 設計 doc 3 本を primary 名へ置換。
- diff は alias 3 行削除のみ（test 無変更）。

### 型 / シグネチャ（正本 5 export）

```ts
// apps/web/src/components/shell/shell-collapse-cookie.ts
import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";

// private（非 export）
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 31536000

export function parseShellCollapsedCookie(
  value: string | undefined | null,
): boolean | null;

export function serializeShellCollapsedCookie(collapsed: boolean): string;

export function writeShellCollapsedCookie(collapsed: boolean): void;

export function readCollapsedFromDocument(): boolean | null;
```

### API 使用例

```ts
// SidebarShell.server.tsx（Server Component 側 / cookie 値を parse）
import {
  parseShellCollapsedCookie,
  SHELL_COLLAPSE_COOKIE_NAME,
} from "@/components/shell/shell-collapse-cookie";

const raw = cookieStore.get(SHELL_COLLAPSE_COOKIE_NAME)?.value;
const collapsed = parseShellCollapsedCookie(raw) ?? false;

// useSidebarState.ts（Client 側 / document.cookie へ書込）
import { writeShellCollapsedCookie } from "@/components/shell/shell-collapse-cookie";
writeShellCollapsedCookie(true);
```

### エラーハンドリング / エッジケース

- `parseShellCollapsedCookie`: 入力が `"true"` → `true`、`"false"` → `false`、それ以外（`undefined` / `null` / 想定外文字列）は **`null`**（throw しない）。呼び出し側は `?? false` で既定値へフォールバックする。
- `writeShellCollapsedCookie` / `readCollapsedFromDocument`: SSR 等 `document` 不在環境は `browserDocument()` が `null` を返し、書込は no-op / 読込は `null`。
- `readCollapsedFromDocument`: `document.cookie` を `;` split → `<name>=` で始まる entry を find → 該当なしは `null`、該当時は値部を `parseShellCollapsedCookie` へ委譲。

### 設定項目 / 定数一覧

| 項目 | 値 |
| --- | --- |
| cookie 名 | `ubm_shell_collapsed`（`SHELL_COLLAPSE_COOKIE_NAME`） |
| Max-Age | `31536000` 秒（= 60*60*24*365 / `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS`・非 export） |
| SameSite | `Lax` |
| Path | `/` |
| serialize 形式 | `ubm_shell_collapsed=true; Path=/; Max-Age=31536000; SameSite=Lax` |

### 実装ステップ

1. `rg -n 'SHELL_COLLAPSE_COOKIE\b\|readCollapsedFromCookieString\|writeCollapsedCookie' apps/web/src` で 3 alias の参照を確認（**削除前 grep 0 件が前提・AC-3**）。
2. `shell-collapse-cookie.ts` 末尾の alias 3 行を削除:
   - `export const SHELL_COLLAPSE_COOKIE = SHELL_COLLAPSE_COOKIE_NAME;`
   - `export const readCollapsedFromCookieString = parseShellCollapsedCookie;`
   - `export const writeCollapsedCookie = writeShellCollapsedCookie;`
3. 設計 doc 3 本（後述）を primary 名へ置換。
4. 検証コマンド（後述）で green 確認。

### 設計 doc 整合（AC-1）

| doc | 置換ルール | drift token 実測（2026-06-03 grep） |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/phase-2-design.md` | 下表の置換 | 旧名多数（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie` / `COLLAPSE_COOKIE_MAX_AGE`）→ 置換対象 |
| `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/phase-3-design-review.md` | **置換対象 0 件**（旧名トークン不在・参照は `readCollapsedFromDocument` のみで既に primary と一致）→ **検証のみ（no-op）** | 0 |
| `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/implementation-guide.md` | 下表の置換 | 旧名多数 → 置換対象 |

> AC-1 の「設計 doc」のうち置換が発生するのは phase-2-design.md と implementation-guide.md の 2 本。phase-3-design-review.md は旧名トークンが 0 のため no-op（旧名残存 0 の確認のみ）。
>
> **SSOT 完遂レビュー追記（user 決定・スコープ後追い拡張）**: 当初は AC-1 の設計 doc に限定していたが、*phase-2-design は整合済なのに phase-5-implementation は旧名のまま*という内部矛盾が SSOT 目的と衝突するため、issue-1024 配下の旧名残存 doc（phase-4 / phase-5 / phase-6 / phase-7 / phase-8 / phase-9 / phase-13 + outputs/phase-12 の system-spec-update-summary / phase12-task-spec-compliance-check / unassigned-task-detection）も同一置換マップで primary 名へ全整合した。結果、`apps/`・`packages/`・`specs/`・issue-1024 doc 全体で dead alias を 0 化（残るのは「削除済みを説明する枠組み」のみ）。

置換表:

| 旧名 | 新名（primary） |
| --- | --- |
| `SHELL_COLLAPSE_COOKIE` | `SHELL_COLLAPSE_COOKIE_NAME` |
| `readCollapsedFromCookieString` | `parseShellCollapsedCookie` |
| `writeCollapsedCookie` | `writeShellCollapsedCookie` |
| `readCollapsedFromDocument` | （不変） |
| `COLLAPSE_COOKIE_MAX_AGE` | `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` |

> 実 doc 編集はローカルで実行済み（2026-06-03）。phase-2-design.md と implementation-guide.md の旧名トークンを上表どおり primary 名へ置換し、phase-3-design-review.md は旧名 0 件の no-op を確認した。commit/PR のみ user-gated。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused（shell-collapse-cookie の test は primary 名のみ import → 無変更で green）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
git diff --stat apps/web/src/components/shell/shell-collapse-cookie.ts  # alias 3 行削除のみ
```

### 既知制限

- cookie 名 / value / 属性（Max-Age / SameSite / Path）は**無変更**（I-6 / AC-5）。既存利用者の collapse 状態を破壊しない。
- 設計 doc の他 phase（履歴ドキュメント）の旧名残存は、当初は整合必須対象外としていたが、SSOT 完遂レビュー（user 決定）で本サイクル内に primary 名へ全整合済み（上記「SSOT 完遂レビュー追記」参照）。dead alias 名が残るのは「削除済みを説明する枠組み」のみ。

---

## SSOT 正本 API 対応表（AC-2）

| 正本名（keep） | 入力 | 出力 | 使用箇所 | 削除した alias |
| --- | --- | --- | --- | --- |
| `SHELL_COLLAPSE_COOKIE_NAME` | （定数 `"ubm_shell_collapsed"`） | `string` | SidebarShell.server.tsx:12 / 同モジュール内 | `SHELL_COLLAPSE_COOKIE` |
| `parseShellCollapsedCookie` | cookie **値** `string\|undefined\|null` | `boolean\|null` | SidebarShell.server.tsx:12 / readCollapsedFromDocument 内 | `readCollapsedFromCookieString` |
| `serializeShellCollapsedCookie` | `collapsed: boolean` | `string`（cookie 文字列） | writeShellCollapsedCookie 内 | （alias なし） |
| `writeShellCollapsedCookie` | `collapsed: boolean` | `void`（document.cookie 書込） | useSidebarState.ts:10 | `writeCollapsedCookie` |
| `readCollapsedFromDocument` | （引数なし・document.cookie を読む） | `boolean\|null` | （内部 read 経路） | （alias なし） |

---

## issue 前提誤りの訂正注記（AC-2・必須）

issue #1065 および source unassigned-task は、

> 「`parseShellCollapsedCookie` が cookie ヘッダ全体を受け取り、`readCollapsedFromCookieString` とは別契約である」

と記述するが、これは **現行コードに対して誤り**である。

- 現行 `parseShellCollapsedCookie(value: string | undefined | null)` は **cookie 値のみ**を受け取る pure な value parser である（ヘッダ全体ではない）。`"true"` / `"false"` 以外は `null` を返す。
- `readCollapsedFromCookieString` は `export const readCollapsedFromCookieString = parseShellCollapsedCookie;` という **直接 alias（同一関数）** であり、ヘッダ vs 値の契約差は存在しない。
- cookie ヘッダ文字列全体を split して該当値を抜き出す処理は、別関数 `readCollapsedFromDocument`（`document.cookie` を読む）が担っており、こちらは削除対象でなく不変。

**なぜ 2 系統あったか / なぜ 1 系統にしたか**:

- 過去（issue-1024 実装時）、設計 doc 上で「cookie 文字列を読む」概念名（`readCollapsedFromCookieString`）と実装関数名（`parseShellCollapsedCookie`）が並走し、互換のため alias を残した経緯がある。
- しかし実コードでは両者は同一関数で、alias は apps/web/src 内 0 参照のまま放置（dead alias）。「2 系統 = 別契約」と読むと**誤った drift**を生むため、code-primary に一本化し、次にコードを読む人が再び別契約と誤認しないよう本注記を残す。

---

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。

代替証跡として以下を参照:

- `outputs/phase-11/manual-test-result.md`（手動検証コマンド結果・diff 確認）
- `phase-10-final-review.md`（最終レビュー・alias 0 参照 grep 証跡）
