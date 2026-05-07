# 09c. UI Primitives 仕様

## 0. 概要

本ドキュメントは UBM 兵庫支部会メンバーサイトで使用する **UI Primitives（再利用可能な最小単位 UI コンポーネント）** の正本仕様である。
`docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`（272 行）を token-perfect に再現するために必要な情報を完全網羅する。

- 設計トークン（color / radius / shadow / typography / spacing 等の `--ubm-*` 変数）の値定義は **09b §1〜§5 参照**
- アイコン（`<Icon name="..." />`）の name → SVG マッピングは **09d 参照**
- ページ単位のレイアウト・ナビゲーションは **09a 参照**
- prototype の素の CSS では `--accent` / `--text` / `--bg` 等の短縮名を用いているが、本仕様ではプロダクション実装に合わせ **`var(--ubm-*)` 形式** に正規化して記述する。短縮名 → 正規名のマッピングは 09b §0 を参照。

実装者は **本ドキュメント単独で全 primitive を再現可能** であり、prototype JSX を直接参照する必要はない（出典行は §2.x.8 に明記）。

---

## 1. プリミティブ一覧（カタログ）

| # | name | 用途 | 出典行（primitives.jsx） | variant 数 | 状態 |
|---|------|------|-----------------------|----------|------|
| 1 | `Chip` | ステータス・タグ・バッジ表示 | L5–L14 | 7 (default/accent/ok/warn/danger/info/solid) × outline / size | hover (clickable のみ) |
| 2 | `AvatarStoreProvider` | 画像 dataURL を localStorage に永続化する Context Provider | L17–L28 | — | — |
| 3 | `useAvatarStore` | photos / setPhoto / removePhoto を返す hook | L18 | — | — |
| 4 | `readFileAsDataURL` | File → dataURL 変換ユーティリティ | L30–L35 | — | — |
| 5 | `Avatar` | ユーザーアバター（画像 or initial） | L37–L89 | size: sm/md/lg/xl × hue: 0–7 × editable on/off | hover (editable: overlay / remove) |
| 6 | `Button` | アクションボタン | L92–L110 | variant: primary/accent/ghost/soft/danger × size: sm/md/lg × block × icon/iconRight | hover / active / disabled |
| 7 | `Switch` | ON/OFF トグル | L113–L115 | on / off | — |
| 8 | `Segmented` | セグメント切替コントロール | L118–L126 | active / inactive | — |
| 9 | `Field` | label + input + hint/error の wrapper | L129–L143 | required / optional / hint / error / badge | error |
| 10 | `Input` | テキスト入力 | L145 | lg / 通常 | focus |
| 11 | `Textarea` | 複数行入力 | L146 | — | focus |
| 12 | `Select` | プルダウン | L147 | — | focus |
| 13 | `Search` | 検索入力（左にアイコン） | L150–L155 | — | focus |
| 14 | `Drawer` | 右からスライドインするパネル | L158–L174 | open / closed | escape close |
| 15 | `Modal` | センター配置モーダル | L177–L195 | open / closed × maxWidth | escape close |
| 16 | `ToastProvider` | トースト通知の Provider | L201–L223 | — | auto-dismiss 3.2s |
| 17 | `useToast` | toast push 関数を返す hook | L199 | tone: default/ok/warn/danger | — |
| 18 | `KVList` | key-value リスト | L226–L235 | empty / filled | — |
| 19 | `LinkPills` | 外部 SNS リンク群 | L248–L262 | 9 種 (Web/X/Instagram/Facebook/LinkedIn/note/YouTube/Threads/TikTok) | hover |
| 20 | `zoneTone` | zone 文字列 → Chip tone マッピング関数 | L265 | — | — |
| 21 | `statusTone` | status 文字列 → Chip tone マッピング関数 | L266 | — | — |

ヘルパー定数: `LINK_ICONS`（L238–L242）, `LINK_LABELS`（L243–L246）。
`ToastCtx` / `AvatarStoreCtx` は React.Context オブジェクトであり、Provider と hook 経由で利用する（直接 import しない）。

---

## 2. Chip

### 2.1 用途
ステータス（会員 / アカデミー生 / OB等）、ゾーン（0→1 / 1→10 / 10→）、タグなどを 1 行のラベルで示す。クリック可能にもできる。

### 2.2 Props 型（TypeScript）

```ts
type ChipTone = "default" | "accent" | "ok" | "warn" | "danger" | "info" | "solid";

interface ChipProps {
  children: React.ReactNode;
  tone?: ChipTone;            // default: "default"
  dot?: boolean;              // 左に 6×6 currentColor の dot
  outline?: boolean;          // 背景透過（border のみ）
  onClick?: (e: React.MouseEvent) => void; // 指定時 cursor: pointer
  size?: "sm";                // sm のみ存在（未指定時は通常）
}
```

### 2.3 variant

| tone | 視覚仕様 | 用途 |
|------|---------|------|
| `default` | bg `var(--ubm-bg)` / text `var(--ubm-text-2)` / border `var(--ubm-border)` | 中立タグ |
| `accent` | bg `var(--ubm-accent-soft)` / text `var(--ubm-accent-ink)` / border `var(--ubm-color-mix) 18%, transparent)` | アカデミー生など強調 |
| `ok` | bg `var(--ubm-ok-soft)` / text `var(--ubm-ok)` / border `var(--ubm-color-mix) 18%, transparent)` | 会員、成功 |
| `warn` | bg `var(--ubm-warn-soft)` / text `var(--ubm-warn)` / border `var(--ubm-color-mix) 18%, transparent)` | 警告 |
| `danger` | bg `var(--ubm-danger-soft)` / text `var(--ubm-danger)` / border `var(--ubm-color-mix) 22%, transparent)` | エラー / 退会 |
| `info` | bg `var(--ubm-info-soft)` / text `var(--ubm-info)` / border `var(--ubm-color-mix) 18%, transparent)` | ゾーン 0→1 |
| `solid` | bg `var(--ubm-text)` / text `var(--ubm-panel)` / border transparent | 強調（admin） |
| `outline` | 上記いずれかと併用、bg を transparent に | 軽量タグ |

### 2.4 visual spec
- display: `inline-flex`、align-items: `center`、gap: `var(--ubm-size-md)`
- padding: `var(--ubm-size-md) var(--ubm-size-md)`
- border-radius: `var(--ubm-size-md)`（pill）
- font-size: `var(--ubm-size-md)` / font-weight: `500`
- line-height: `1.6`
- white-space: `nowrap`
- border: `var(--ubm-size-md) solid`（tone により色変化）
- dot: `width:var(--ubm-size-md); height:var(--ubm-size-md); border-radius:50%; background: currentColor`

### 2.5 状態
- default: 上記 visual spec のとおり
- onClick あり: `cursor: pointer`（インライン style で上書き）
- hover: prototype 上は明示的な hover スタイルなし（背景はそのまま）
- disabled / focus: 未定義（必要であれば実装側で追加）

### 2.6 a11y
- semantic: `<span>`（クリック可能でも span。ボタン的に扱う場合は `role="button"` と `tabIndex={0}`、`onKeyDown` で Enter/Space を補う）
- `aria-label`: children のテキストが視覚として読める場合は不要
- 装飾の `dot` は `aria-hidden="true"` を付ける

### 2.7 マークアップ例

```jsx
const Chip = ({ children, tone = "default", dot, outline, onClick, size }) => {
  const cls = [
    "chip",
    tone !== "default" ? tone : "",
    outline ? "outline" : "",
    size === "sm" ? "chip-sm" : "",
  ].filter(Boolean).join(" ");
  return (
    <span
      className={cls}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  );
};
```

CSS（再現に必須）:

```css
.chip {
  display: inline-flex; align-items: center; gap: var(--ubm-size-md);
  padding: var(--ubm-size-md) var(--ubm-size-md); border-radius: var(--ubm-size-md);
  font-size: var(--ubm-size-md); font-weight: 500; line-height: 1.6;
  background: var(--ubm-bg); color: var(--ubm-text-2);
  border: var(--ubm-size-md) solid var(--ubm-border);
  white-space: nowrap;
}
.chip.accent { background: var(--ubm-accent-soft); color: var(--ubm-accent-ink);
  border-color: var(--ubm-color-mix) 18%, transparent); }
.chip.ok     { background: var(--ubm-ok-soft);     color: var(--ubm-ok);
  border-color: var(--ubm-color-mix) 18%, transparent); }
.chip.warn   { background: var(--ubm-warn-soft);   color: var(--ubm-warn);
  border-color: var(--ubm-color-mix) 18%, transparent); }
.chip.danger { background: var(--ubm-danger-soft); color: var(--ubm-danger);
  border-color: var(--ubm-color-mix) 22%, transparent); }
.chip.info   { background: var(--ubm-info-soft);   color: var(--ubm-info);
  border-color: var(--ubm-color-mix) 18%, transparent); }
.chip.solid  { background: var(--ubm-text);        color: var(--ubm-panel);
  border-color: transparent; }
.chip.outline { background: transparent; }
.chip .dot { width: var(--ubm-size-md); height: var(--ubm-size-md); border-radius: 50%; background: currentColor; }
```

### 2.8 prototype 出典
`primitives.jsx` L5–L14。CSS は `styles.css` L358–L382。

---

## 3. Avatar (+ Store)

### 3.1 用途
会員のプロフィール画像（または姓 1 文字 initial）を表示する。`editable` 時はクリックで画像アップロード、削除ボタン表示。`AvatarStoreProvider` 配下では `id` 単位で localStorage `ubm-photos` に dataURL を永続化する。

### 3.2 Props 型

```ts
interface AvatarProps {
  name: string;                    // initial 抽出元（trim().charAt(0)）
  size?: "sm" | "md" | "lg" | "xl"; // default "md"
  hue?: number;                    // 0–7 にモジュロ（hue % 8）
  id?: string;                     // photo store key
  editable?: boolean;              // true でクリック→ファイル選択
  onPhotoChange?: (dataUrl: string | null) => void;
}

interface AvatarStoreValue {
  photos: Record<string, string>;        // id → dataUrl
  setPhoto: (id: string, dataUrl: string) => void;
  removePhoto: (id: string) => void;
}
```

### 3.3 variant
- size: `sm` (34×34, font 13, radius 10), `md`/未指定 (48×48, font 18, radius 14), `lg` (72×72, font 28, radius 20), `xl` (96×96, font 36, radius 24)
- hue: 0–7（`data-hue` 属性で 8 種の oklch ペールカラーを切替）
- editable: false（静的）/ true（hover overlay + camera + remove ボタン）

### 3.4 visual spec
- 共通: `display: grid; place-items: center;` `flex-shrink: 0;` `overflow: hidden;` `position: relative;`
- font-family: `var(--ubm-font-serif)` / font-weight: `600` / letter-spacing: `0.02em`
- 既定 bg: `var(--ubm-bg-2)` / text: `var(--ubm-text)`（hue 指定時は data-hue で上書き）
- hue palette（全て oklch）:
  - `data-hue="0"`: bg `var(--ubm-color-derived)`   / text `var(--ubm-color-derived)`
  - `data-hue="1"`: bg `var(--ubm-color-derived)` / text `var(--ubm-color-derived)`
  - `data-hue="2"`: bg `var(--ubm-color-derived)`  / text `var(--ubm-color-derived)`
  - `data-hue="3"`: bg `var(--ubm-color-derived)` / text `var(--ubm-color-derived)`
  - `data-hue="4"`: bg `var(--ubm-color-derived)`  / text `var(--ubm-color-derived)`
  - `data-hue="5"`: bg `var(--ubm-color-derived)` / text `var(--ubm-color-derived)`
  - `data-hue="6"`: bg `var(--ubm-color-derived)` / text `var(--ubm-color-derived)`
  - `data-hue="7"`: bg `var(--ubm-color-derived)`  / text `var(--ubm-color-derived)`

### 3.5 状態
- default（非 editable）: 上記
- editable hover: `transform: translateY(-var(--ubm-size-md))`、overlay opacity 0→1、remove button opacity 0→1
- overlay: `inset:0; background: var(--ubm-color-mix); color:var(--ubm-color-on-accent); display:grid; place-items:center; border-radius: inherit;` 中央に camera icon
- remove ボタン: 右上 `top:-var(--ubm-size-md); right:-var(--ubm-size-md); width:var(--ubm-size-md); height:var(--ubm-size-md); border-radius:50%; background: var(--ubm-danger); color:var(--ubm-color-on-accent); border:var(--ubm-size-md) solid var(--ubm-panel); box-shadow: 0 var(--ubm-size-md) var(--ubm-size-md) rgba(0,0,0,0.2); z-index:2`
- 画像未設定 + editable: hover で overlay のみ表示（remove ボタンは非表示）
- transition: `transform .15s ease`、`opacity .15s ease`

### 3.6 ファイルアップロードバリデーション
- `file.type.startsWith("image/")` でなければ toast warn `"画像ファイルを選択してください"` を表示
- `file.size > 5 * 1024 * 1024`（5MB）なら toast warn `"5MB以下の画像を選択してください"`
- 成功時 toast ok `"画像をアップロードしました"`、削除時 toast ok `"画像を削除しました"`
- 内部で `readFileAsDataURL(file)` を await し dataUrl を `setPhoto(id, dataUrl)` に渡す
- input 要素は `<input type="file" accept="image/*">` を `display: none` で配置、クリックで `inputRef.current.click()`、選択後 `e.target.value = ""` で再選択可能化

### 3.7 a11y
- `editable` 時はクリックで file picker を開く `<div>` を `role="button"` `tabIndex={0}` `aria-label="プロフィール画像をアップロード"` にする（prototype は title 属性のみだが本仕様で補強）
- remove ボタン: `<button>` に `aria-label="画像を削除"` を付与（prototype は `title="画像を削除"` のみ。本仕様では aria-label を必須化）
- 画像表示時の `<img>` の `alt` は `name`
- keyboard: Enter / Space で file picker を開く（実装は `onKeyDown` でハンドリング）

### 3.8 マークアップ例

```jsx
const AvatarStoreCtx = React.createContext({ photos: {}, setPhoto: () => {}, removePhoto: () => {} });
const useAvatarStore = () => React.useContext(AvatarStoreCtx);

const AvatarStoreProvider = ({ children }) => {
  const [photos, setPhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ubm-photos") || "{}"); } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("ubm-photos", JSON.stringify(photos)); } catch {}
  }, [photos]);
  const setPhoto = useCallback((id, dataUrl) => setPhotos((p) => ({ ...p, [id]: dataUrl })), []);
  const removePhoto = useCallback((id) => setPhotos((p) => {
    const n = { ...p }; delete n[id]; return n;
  }), []);
  return (
    <AvatarStoreCtx.Provider value={{ photos, setPhoto, removePhoto }}>
      {children}
    </AvatarStoreCtx.Provider>
  );
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});

const Avatar = ({ name, size = "md", hue = 0, id, editable, onPhotoChange }) => {
  const initial = (name || "?").trim().charAt(0);
  const { photos, setPhoto, removePhoto } = useAvatarStore();
  const photo = id ? photos[id] : null;
  const toast = useToast();
  const inputRef = useRef(null);
  const cls = "avatar " + (size === "sm" ? "avatar-sm"
                         : size === "lg" ? "avatar-lg"
                         : size === "xl" ? "avatar-xl" : "");

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast?.("画像ファイルを選択してください", "warn"); return; }
    if (file.size > 5 * 1024 * 1024)     { toast?.("5MB以下の画像を選択してください", "warn"); return; }
    const dataUrl = await readFileAsDataURL(file);
    if (id) setPhoto(id, dataUrl);
    onPhotoChange?.(dataUrl);
    toast?.("画像をアップロードしました", "ok");
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (id) removePhoto(id);
    onPhotoChange?.(null);
    toast?.("画像を削除しました", "ok");
  };

  const content = photo
    ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    : initial;

  if (!editable) {
    return <div className={cls} data-hue={hue % 8}>{content}</div>;
  }

  const iconSize = size === "sm" ? 11 : size === "lg" ? 15 : size === "xl" ? 18 : 13;

  return (
    <div className={cls + " avatar-editable"} data-hue={hue % 8}
         style={{ position: "relative", cursor: "pointer" }}
         onClick={() => inputRef.current?.click()}
         role="button" tabIndex={0}
         aria-label="プロフィール画像をアップロード"
         title="クリックして画像をアップロード">
      {content}
      <div className="avatar-overlay" aria-hidden="true">
        <Icon name="camera" size={iconSize} />
      </div>
      {photo && (
        <button className="avatar-remove" onClick={handleRemove} aria-label="画像を削除" title="画像を削除">
          <Icon name="x" size={10} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
             onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
};
```

### 3.9 prototype 出典
`primitives.jsx` L17–L89。CSS は `styles.css` L385–L445。

---

## 4. Button

### 4.1 用途
あらゆるアクション（送信 / 取消 / リンク的操作）。アイコン左右配置、サイズ 3 段階、5 variant、block 表示に対応。

### 4.2 Props 型

```ts
type ButtonVariant = "primary" | "accent" | "ghost" | "soft" | "danger";

interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;        // default "ghost"
  size?: "sm" | "lg";             // 未指定で md
  icon?: string;                  // Icon name（左に表示）
  iconRight?: string;             // Icon name（右に表示）
  block?: boolean;                // width: 100%
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset"; // default "button"
  title?: string;
}
```

### 4.3 variant

| variant | bg | text | border |
|---------|----|------|--------|
| `primary` | `var(--ubm-text)` | `var(--ubm-panel)` | transparent |
| `accent`  | `var(--ubm-accent)` | `var(--ubm-color-on-accent)` | transparent |
| `ghost`   | transparent | `var(--ubm-text)` | `var(--ubm-border-2)` |
| `soft`    | `var(--ubm-bg)` | `var(--ubm-text)` | `var(--ubm-border)` |
| `danger`  | `var(--ubm-danger-soft)` | `var(--ubm-danger)` | transparent |

### 4.4 visual spec
- display: `inline-flex; align-items: center; gap: var(--ubm-size-md);`
- padding: `var(--ubm-size-md) var(--ubm-size-md)`（md）/ `var(--ubm-size-md) var(--ubm-size-md)`（sm）/ `var(--ubm-size-md) var(--ubm-size-md)`（lg）
- border-radius: `var(--ubm-size-md)`
- font-size: `var(--ubm-size-md)`（md）/ `var(--ubm-size-md)`（sm）/ `var(--ubm-size-md)`（lg）
- font-weight: `500`
- border: `var(--ubm-size-md) solid transparent`（variant により色変化）
- transition: `background .15s ease, border-color .15s ease, color .15s ease, transform .1s ease`
- white-space: `nowrap`
- block: `width: 100%; justify-content: center;`
- icon サイズ: sm → var(--ubm-size-md) / md・lg → var(--ubm-size-md)

### 4.5 状態

| 状態 | 仕様 |
|------|------|
| default | 上記 |
| hover (primary) | `background: var(--ubm-color-on-accent)` |
| hover (accent) | `filter: brightness(0.95)` |
| hover (ghost) | `background: var(--ubm-bg)` |
| hover (soft) | `background: var(--ubm-bg-2); border-color: var(--ubm-border-2)` |
| hover (danger) | `background: var(--ubm-color-derived)` |
| active | `transform: translateY(var(--ubm-size-md))` |
| disabled | `opacity: 0.5; cursor: not-allowed;` （`disabled` 属性を見る） |
| focus-visible | （実装で追加）`outline: var(--ubm-size-md) solid var(--ubm-accent); outline-offset: var(--ubm-size-md)` 推奨 |

### 4.6 a11y
- 必ず `<button type="button|submit|reset">` を使う（`<a>` ではない）
- `aria-label` はテキストが視覚で読めれば不要、icon-only の場合は必須
- `disabled` 属性で操作不能化（`aria-disabled` ではなく `disabled` を使う）
- keyboard: Enter / Space でクリック発火（ブラウザ標準）

### 4.7 マークアップ例

```jsx
const Button = ({ children, variant = "ghost", size, icon, iconRight, block, onClick, disabled, type = "button", title }) => {
  const cls = [
    "btn",
    variant === "primary" ? "btn-primary" : "",
    variant === "accent"  ? "btn-accent"  : "",
    variant === "ghost"   ? "btn-ghost"   : "",
    variant === "soft"    ? "btn-soft"    : "",
    variant === "danger"  ? "btn-danger"  : "",
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
    block ? "btn-block" : "",
  ].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} title={title}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 13 : 14} />}
    </button>
  );
};
```

### 4.8 prototype 出典
`primitives.jsx` L92–L110。CSS は `styles.css` L326–L355。

---

## 5. Switch

### 5.1 用途
ON/OFF のバイナリトグル（通知 ON/OFF、公開設定など）。

### 5.2 Props 型

```ts
interface SwitchProps {
  on: boolean;
  onToggle?: (e: React.MouseEvent) => void;
}
```

### 5.3 variant
- on (active) / off (inactive) の 2 状態のみ

### 5.4 visual spec
- track: `width: var(--ubm-size-md); height: var(--ubm-size-md); border-radius: var(--ubm-size-md);`
- track bg (off): `var(--ubm-border-2)` / (on): `var(--ubm-accent)`
- thumb (`::after`): `width: var(--ubm-size-md); height: var(--ubm-size-md); border-radius: 50%; background: var(--ubm-color-on-accent); box-shadow: 0 var(--ubm-size-md) var(--ubm-size-md) rgba(0,0,0,0.15);`
- thumb 位置: off → `top:var(--ubm-size-md); left:var(--ubm-size-md)`、on → `transform: translateX(var(--ubm-size-md))`
- transition: track `background .15s ease`、thumb `transform .18s ease`
- flex-shrink: 0

### 5.5 状態
- off: track grey
- on: track accent + thumb 右寄り
- focus-visible: 実装で `outline: var(--ubm-size-md) solid var(--ubm-accent); outline-offset: var(--ubm-size-md)` 推奨
- disabled: prototype 未定義（必要なら opacity 0.5 + cursor not-allowed）

### 5.6 a11y
- `<button>` 要素 + `aria-pressed={on}` を使用（prototype 通り）
- `aria-label` を必ず付与（"通知を有効化" など意味のある文言）
- keyboard: Space / Enter でトグル（button 標準）

### 5.7 マークアップ例

```jsx
const Switch = ({ on, onToggle }) => (
  <button
    type="button"
    className={"switch" + (on ? " on" : "")}
    onClick={onToggle}
    aria-pressed={on}
  />
);
```

### 5.8 prototype 出典
`primitives.jsx` L113–L115。CSS は `styles.css` L502–L524。

---

## 6. Segmented

### 6.1 用途
互いに排他な少数選択肢（タブ的な切替、表示モード等）の UI。

### 6.2 Props 型

```ts
interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}
interface SegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}
```

### 6.3 variant
- 選択中ボタン (`.active`) / 非選択ボタン

### 6.4 visual spec
- container: `display: inline-flex; padding: var(--ubm-size-md); background: var(--ubm-bg); border: var(--ubm-size-md) solid var(--ubm-border); border-radius: var(--ubm-size-md);`
- button: `padding: var(--ubm-size-md) var(--ubm-size-md); font-size: var(--ubm-size-md); font-weight: 500; border-radius: var(--ubm-size-md); color: var(--ubm-text-2); transition: background .15s ease, color .15s ease;`
- active: `background: var(--ubm-panel); color: var(--ubm-text); box-shadow: var(--ubm-shadow-xs);`

### 6.5 状態
- default (inactive): muted text
- active: panel bg + xs shadow
- hover (inactive): prototype 未定義（実装側で `color: var(--ubm-text)` 推奨）

### 6.6 a11y
- container に `role="tablist"`、各 button に `role="tab"` `aria-selected={value === o.value}` を付与（prototype は role 未指定。本仕様で追加）
- keyboard: 左右矢印で移動（実装側で `onKeyDown` ハンドル推奨）

### 6.7 マークアップ例

```jsx
const Segmented = ({ options, value, onChange }) => (
  <div className="segmented" role="tablist">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="tab"
        aria-selected={value === o.value}
        className={value === o.value ? "active" : ""}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);
```

### 6.8 prototype 出典
`primitives.jsx` L118–L126。CSS は `styles.css` L526–L545。

---

## 7. Field

### 7.1 用途
label + 入力要素 + hint/error/badge を縦積みする wrapper。フォーム 1 行の最小単位。

### 7.2 Props 型

```ts
interface FieldProps {
  label?: React.ReactNode;
  required?: boolean;     // "*必須" バッジ
  optional?: boolean;     // "任意" バッジ
  hint?: React.ReactNode; // error が無いときのみ表示
  error?: React.ReactNode;// 表示時 hint を上書き
  badge?: React.ReactNode;// label 右に追加バッジ
  children: React.ReactNode; // 入力要素本体
}
```

### 7.3 variant
- required / optional / hint / error / badge の有無で表示切替。組合せ可。

### 7.4 visual spec
- container `.field-group`: `display: flex; flex-direction: column; gap: var(--ubm-size-md);`
- `.label`: `font-size: var(--ubm-size-md); font-weight: 500; color: var(--ubm-text-2); display: flex; align-items: center; gap: var(--ubm-size-md); margin-bottom: var(--ubm-size-md);`
- `.label .req`: `color: var(--ubm-danger); font-size: var(--ubm-size-md);` （文言: `*必須`）
- `.label .opt`: `color: var(--ubm-text-3); font-size: var(--ubm-size-md); font-weight: 400;` （文言: `任意`）
- hint / error: `.small`（`font-size: var(--ubm-size-md); color: var(--ubm-text-3); line-height: 1.5;`）。error は inline style で `color: var(--ubm-danger)`。

### 7.5 状態
- default: hint 表示
- error: error 表示（hint 抑制）

### 7.6 a11y
- label を `<label htmlFor={id}>` にして input と紐付ける（prototype は div だが本仕様で必須）
- error 表示時、入力要素に `aria-invalid="true"` と `aria-describedby={errorId}` を付ける
- hint も `aria-describedby` で紐付け推奨

### 7.7 マークアップ例

```jsx
const Field = ({ label, required, optional, hint, error, children, badge }) => (
  <div className="field-group">
    {label && (
      <div className="label">
        {label}
        {required && <span className="req">*必須</span>}
        {optional && <span className="opt">任意</span>}
        {badge}
      </div>
    )}
    {children}
    {hint && !error && <div className="small">{hint}</div>}
    {error && <div className="small" style={{ color: "var(--ubm-danger)" }}>{error}</div>}
  </div>
);
```

### 7.8 prototype 出典
`primitives.jsx` L129–L143。CSS は `styles.css` L301, L473–L485。

---

## 8. Input / Textarea / Select

### 8.1 用途
プレーンな入力プリミティブ。`Field` の children として使う。

### 8.2 Props 型

```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  lg?: boolean; // 大きめ padding/font
}
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode; // <option>
}
```

### 8.3 variant
- Input: 通常 / `lg`（field-lg クラス追加）
- Textarea: 単一形（min-height var(--ubm-size-md)）
- Select: prototype は appearance:none + カスタム caret SVG

### 8.4 visual spec（共通 `.field`）
- `width: 100%; padding: var(--ubm-size-md) var(--ubm-size-md);`
- `border: var(--ubm-size-md) solid var(--ubm-border-2);` `border-radius: var(--ubm-size-md);`
- `background: var(--ubm-panel);` `color: var(--ubm-text);`
- `font-size: var(--ubm-size-md);`
- `transition: border-color .15s ease, box-shadow .15s ease;`
- `.field-lg`: `padding: var(--ubm-size-md) var(--ubm-size-md); font-size: var(--ubm-size-md);`
- `textarea.field`: `min-height: var(--ubm-size-md); resize: vertical; line-height: 1.6;`
- `select.field`: `appearance: none; padding-right: var(--ubm-size-md);` 背景に caret SVG（右 var(--ubm-size-md) 中央）。
  caret SVG（そのまま使用）:
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='none' stroke='%238a877e' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/></svg>")`

### 8.5 状態
- default: 上記
- focus: `outline: none; border-color: var(--ubm-accent); box-shadow: 0 0 0 var(--ubm-size-md) var(--ubm-color-mix) 18%, transparent);`
- disabled: 実装側で `opacity: 0.6; cursor: not-allowed;`（prototype 未定義）
- error: 親 Field の error と組み合わせ、border-color を `var(--ubm-danger)` に切替（実装で追加）

### 8.6 a11y
- Field の `<label htmlFor>` で紐付ける
- placeholder は label の代用にしない
- Select の caret は `aria-hidden`（CSS 背景なので問題なし）

### 8.7 マークアップ例

```jsx
const Input = (props) => (
  <input
    className={"field " + (props.lg ? "field-lg " : "") + (props.className || "")}
    {...props}
    lg={undefined}
  />
);
const Textarea = (props) => (
  <textarea className={"field " + (props.className || "")} {...props} />
);
const Select = ({ children, ...p }) => (
  <select className={"field " + (p.className || "")} {...p}>{children}</select>
);
```

### 8.8 prototype 出典
`primitives.jsx` L145–L147。CSS は `styles.css` L448–L471。

---

## 9. Search

### 9.1 用途
左に検索アイコンを配置した検索専用 input。

### 9.2 Props 型

```ts
interface SearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
```

### 9.3 variant
- 単一形

### 9.4 visual spec
- shell: `position: relative; width: 100%;`
- inner `.field`: `padding-left: var(--ubm-size-md);`（左アイコン分のスペース）
- `.search-icon`: `position: absolute; left: var(--ubm-size-md); top: 50%; transform: translateY(-50%); color: var(--ubm-text-3);`
- icon size: `var(--ubm-size-md)`（Icon name="search"）

### 9.5 状態
- focus: 内部 `.field` の focus スタイル（accent border + ring）
- empty: placeholder のみ

### 9.6 a11y
- `<input type="search">` を使う（prototype は type 指定なしだが本仕様で type="search" 推奨）
- `aria-label` または外側 `<label>` を必須化
- 検索アイコンは `aria-hidden="true"`

### 9.7 マークアップ例

```jsx
const Search = ({ value, onChange, placeholder }) => (
  <div className="search-shell">
    <Icon name="search" size={16} className="search-icon" aria-hidden="true" />
    <input
      type="search"
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder || "検索"}
    />
  </div>
);
```

### 9.8 prototype 出典
`primitives.jsx` L150–L155。CSS は `styles.css` L487–L500。

---

## 10. Drawer

### 10.1 用途
画面右端からスライドインするパネル。会員詳細 / 編集 / フィルタなど。

### 10.2 Props 型

```ts
interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}
```

### 10.3 variant
- 単一形（右配置）

### 10.4 visual spec
- scrim: `position: fixed; inset: 0; background: rgba(24,23,20,0.28); backdrop-filter: blur(var(--ubm-size-md)); z-index: 100; animation: fadein .2s ease;`
- drawer: `position: fixed; right: 0; top: 0; bottom: 0; width: min(var(--ubm-size-md), 92vw); background: var(--ubm-panel); border-left: var(--ubm-size-md) solid var(--ubm-border); box-shadow: var(--ubm-shadow-lg); z-index: 101; display: flex; flex-direction: column; animation: drawerin .25s cubic-bezier(.2,.8,.2,1);`
- 補助セクション（drawer 内で使用想定）:
  - `.drawer-head`: `padding: var(--ubm-size-md) var(--ubm-size-md) var(--ubm-size-md); display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ubm-size-md); border-bottom: var(--ubm-size-md) solid var(--ubm-border);`
  - `.drawer-body`: `padding: var(--ubm-size-md); overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: var(--ubm-size-md);`
  - `.drawer-foot`: `padding: var(--ubm-size-md) var(--ubm-size-md); border-top: var(--ubm-size-md) solid var(--ubm-border); display: flex; gap: var(--ubm-size-md); justify-content: flex-end; background: var(--ubm-panel-2);`
- アニメーション:
  - `@keyframes fadein { from { opacity: 0 } to { opacity: 1 } }`
  - `@keyframes drawerin { from { transform: translateX(var(--ubm-size-md)); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`

### 10.5 状態
- closed: `null` を返してアンマウント
- open: scrim + drawer 表示
- escape key: `onClose` 呼び出し
- scrim click: `onClose` 呼び出し

### 10.6 a11y
- drawer 要素に `role="dialog"` `aria-modal="true"` `aria-labelledby={titleId}`
- open 時 body スクロールロック（実装で追加）
- focus trap（実装で追加。初回 focus を drawer 内へ、close 時に呼び出し元へ戻す）
- keyboard: Escape で close（prototype 実装済み）

### 10.7 マークアップ例

```jsx
const Drawer = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true">
        {children}
      </div>
    </>
  );
};
```

### 10.8 prototype 出典
`primitives.jsx` L158–L174。CSS は `styles.css` L646–L689, L713–L714。

---

## 11. Modal

### 11.1 用途
画面中央のモーダルダイアログ（確認 / 入力 / 警告）。

### 11.2 Props 型

```ts
interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  maxWidth?: number | string; // inline style に渡す
}
```

### 11.3 variant
- 単一形（maxWidth で幅可変）

### 11.4 visual spec
- scrim: Drawer と同一
- `.modal-wrap`: `position: fixed; inset: 0; display: grid; place-items: center; z-index: 101; padding: var(--ubm-size-md); animation: fadein .2s ease;`
- `.modal`: `background: var(--ubm-panel); border-radius: var(--ubm-r-xl); box-shadow: var(--ubm-shadow-lg); max-width: var(--ubm-size-md); width: 100%; overflow: hidden; border: var(--ubm-size-md) solid var(--ubm-border); animation: modalin .25s cubic-bezier(.2,.8,.2,1);`
- `.modal-body`: `padding: var(--ubm-size-md);`
- `.modal-foot`: `padding: var(--ubm-size-md) var(--ubm-size-md); border-top: var(--ubm-size-md) solid var(--ubm-border); display: flex; gap: var(--ubm-size-md); justify-content: flex-end; background: var(--ubm-panel-2);`
- `@keyframes modalin { from { transform: translateY(var(--ubm-size-md)); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`

### 11.5 状態
- closed: `null` を返す
- open: scrim + wrap + modal 表示
- scrim / wrap クリック: `onClose`（modal 内クリックは `e.stopPropagation()` で抑止）
- escape: `onClose`

### 11.6 a11y
- modal 要素に `role="dialog"` `aria-modal="true"` `aria-labelledby` / `aria-describedby`
- 初回 focus を確認ボタンに移す（実装で追加）
- focus trap 必須

### 11.7 マークアップ例

```jsx
const Modal = ({ open, onClose, children, maxWidth }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal-wrap" onClick={onClose}>
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};
```

### 11.8 prototype 出典
`primitives.jsx` L177–L195。CSS は `styles.css` L691–L715。

---

## 12. Toast (Provider + useToast)

### 12.1 用途
画面下部中央にスタックする一時的通知。3.2 秒で自動消滅。

### 12.2 Props 型

```ts
type ToastTone = "default" | "ok" | "warn" | "danger";
type ToastPushFn = (msg: React.ReactNode, tone?: ToastTone) => void;

interface ToastProviderProps { children: React.ReactNode; }
// useToast(): ToastPushFn  （Provider 外で呼ぶと no-op 関数）
```

### 12.3 variant
- tone: `default` / `ok` / `warn` / `danger`
- ok / warn / danger は左に Icon 表示（ok=`checkCircle`、warn=`alertTriangle`、danger=`alertTriangle`）

### 12.4 visual spec
- stack: `position: fixed; bottom: var(--ubm-size-md); left: 50%; transform: translateX(-50%); z-index: 200; display: flex; flex-direction: column; gap: var(--ubm-size-md); pointer-events: none;`
- toast: `background: var(--ubm-text); color: var(--ubm-panel); padding: var(--ubm-size-md) var(--ubm-size-md); border-radius: var(--ubm-r-md); font-size: var(--ubm-size-md); box-shadow: var(--ubm-shadow-lg); animation: rise .25s ease; display: flex; align-items: center; gap: var(--ubm-size-md); max-width: var(--ubm-size-md);`
- `.toast.ok`:    `background: var(--ubm-color-derived);`
- `.toast.warn`:  `background: var(--ubm-color-derived);`
- `.toast.danger`:`background: var(--ubm-color-derived);`
- `@keyframes rise { from { transform: translateY(var(--ubm-size-md)); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`
- icon: var(--ubm-size-md)

### 12.5 状態
- 表示後 3200ms で自動消滅（setTimeout）
- 同時表示は縦スタック、上が古い

### 12.6 a11y
- stack コンテナに `role="status"` `aria-live="polite"` `aria-atomic="true"`（prototype 未指定。本仕様で追加）
- `pointer-events: none` のため操作不可。操作が必要な通知は Modal を使う
- danger は `role="alert"` `aria-live="assertive"` を別 region で（実装で必要なら追加）

### 12.7 マークアップ例

```jsx
const ToastCtx = React.createContext(() => {});
const useToast = () => React.useContext(ToastCtx);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = "default") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.tone}>
            {t.tone === "ok"     && <Icon name="checkCircle"   size={14} />}
            {t.tone === "warn"   && <Icon name="alertTriangle" size={14} />}
            {t.tone === "danger" && <Icon name="alertTriangle" size={14} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
```

### 12.8 prototype 出典
`primitives.jsx` L198–L223。CSS は `styles.css` L716, L721–L747。

---

## 13. KVList

### 13.1 用途
プロフィール詳細などで使う key-value（ラベル / 値）の縦リスト。

### 13.2 Props 型

```ts
interface KVRow {
  k: React.ReactNode;
  v?: React.ReactNode; // 空 / falsy のとき "—" を表示し empty スタイル適用
}
interface KVListProps { rows: KVRow[]; }
```

### 13.3 variant
- 値あり / 値なし（empty: text-3 色 + ダッシュ）

### 13.4 visual spec
- `.kv`: `display: flex; flex-direction: column; gap: var(--ubm-size-md); background: var(--ubm-border); border-radius: var(--ubm-r-md); overflow: hidden; border: var(--ubm-size-md) solid var(--ubm-border);` （gap var(--ubm-size-md) の隙間で罫線を見せる）
- `.kv-row`: `background: var(--ubm-panel); padding: var(--ubm-size-md) var(--ubm-size-md); display: grid; grid-template-columns: var(--ubm-size-md) 1fr; gap: var(--ubm-size-md); align-items: baseline;`
- `.kv-row .kv-k`: `font-size: var(--ubm-size-md); color: var(--ubm-text-3); letter-spacing: 0.02em; font-family: var(--ubm-font-en);`
- `.kv-row .kv-v`: `font-size: var(--ubm-size-md); line-height: 1.7; word-break: break-word;`
- `.kv-row .kv-v.empty`: `color: var(--ubm-text-3);`
- レスポンシブ（≤var(--ubm-size-md)、`styles.css` L1009）: `grid-template-columns: 1fr; gap: var(--ubm-size-md); padding: var(--ubm-size-md) var(--ubm-size-md);`

### 13.5 状態
- 値あり: 通常
- 値なし: `—` 表示 + muted text

### 13.6 a11y
- semantic に `<dl>` / `<dt>` / `<dd>` を使うのが理想（prototype は div 構成）。本仕様では実装側で `<dl>` 化を許容（CSS class はそのまま流用可能）
- もしくは `role="list"` / `role="listitem"` を付与

### 13.7 マークアップ例

```jsx
const KVList = ({ rows }) => (
  <div className="kv">
    {rows.map((r, i) => (
      <div key={i} className="kv-row">
        <div className="kv-k">{r.k}</div>
        <div className={"kv-v" + (r.v ? "" : " empty")}>{r.v || "—"}</div>
      </div>
    ))}
  </div>
);
```

### 13.8 prototype 出典
`primitives.jsx` L226–L235。CSS は `styles.css` L750–L754, L1009。

---

## 14. LinkPills

### 14.1 用途
会員プロフィールの SNS / 外部リンク群を pill 状に並べる。

### 14.2 Props 型

```ts
interface MemberLinkFields {
  urlWebsite?: string;
  urlX?: string;
  urlInstagram?: string;
  urlFacebook?: string;
  urlLinkedin?: string;
  urlNote?: string;
  urlYoutube?: string;
  urlThreads?: string;
  urlTiktok?: string;
}
interface LinkPillsProps {
  member: MemberLinkFields;
}
```

### 14.3 variant
- 1 種類の pill。値が無い key はスキップ。全部 falsy の場合 `<div class="small muted">リンクは未登録です</div>` を表示。

### 14.4 visual spec
- container: `.row-wrap`（`display: flex; gap: var(--ubm-size-md); flex-wrap: wrap;`）
- `.link-ext`: `display: inline-flex; align-items: center; gap: var(--ubm-size-md); padding: var(--ubm-size-md) var(--ubm-size-md); background: var(--ubm-bg); border: var(--ubm-size-md) solid var(--ubm-border); border-radius: var(--ubm-size-md); font-size: var(--ubm-size-md); color: var(--ubm-text); transition: all .15s; font-weight: 500;`
- `.link-ext:hover`: `border-color: var(--ubm-border-2); background: var(--ubm-panel-2);`
- `.link-ext .link-icon`: `color: var(--ubm-text-3); flex-shrink: 0;`
- 左 icon `link`（var(--ubm-size-md)）/ 右 icon `external`（var(--ubm-size-md)）
- 空時: `.small.muted`（font-size var(--ubm-size-md) / color var(--ubm-text-3)）

### 14.5 状態
- default
- hover: border + bg 変化
- focus-visible: 実装側で `outline: var(--ubm-size-md) solid var(--ubm-accent); outline-offset: var(--ubm-size-md)`

### 14.6 a11y
- `<a target="_blank" rel="noreferrer">`（prototype 通り）。`rel="noopener noreferrer"` への昇格を推奨
- アイコンは装飾なので `aria-hidden="true"`、テキストはサービス名（"X" / "Instagram" など）
- 外部リンクであることを `aria-label` に補強（例: `aria-label="X（外部サイト）"`）

### 14.7 マークアップ例

```jsx
const LINK_LABELS = {
  urlWebsite: "Web", urlX: "X", urlInstagram: "Instagram", urlFacebook: "Facebook",
  urlLinkedin: "LinkedIn", urlNote: "note", urlYoutube: "YouTube", urlThreads: "Threads", urlTiktok: "TikTok",
};
const LINK_ICONS = {
  urlWebsite: "external", urlX: "external", urlInstagram: "external",
  urlFacebook: "external", urlLinkedin: "external", urlNote: "external",
  urlYoutube: "external", urlThreads: "external", urlTiktok: "external",
};

const LinkPills = ({ member }) => {
  const keys = Object.keys(LINK_LABELS).filter((k) => member[k]);
  if (!keys.length) return <div className="small muted">リンクは未登録です</div>;
  return (
    <div className="row-wrap">
      {keys.map((k) => (
        <a
          key={k}
          className="link-ext"
          href={member[k]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${LINK_LABELS[k]}（外部サイト）`}
        >
          <Icon name="link" size={13} className="link-icon" aria-hidden="true" />
          <span>{LINK_LABELS[k]}</span>
          <Icon name="external" size={11} className="link-icon" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
};
```

### 14.8 prototype 出典
`primitives.jsx` L238–L262。CSS は `styles.css` L850–L864, L552（`.row-wrap`）, L300–L301（`.muted` / `.small`）。

---

## 15. zoneTone / statusTone（ヘルパー関数）

### 15.1 用途
member データの `zone` / `status` 文字列から Chip の `tone` を導出する純関数。

### 15.2 仕様

```ts
const zoneTone = (z: string): "info" | "accent" | "ok" =>
  z === "0→1" ? "info" : z === "1→10" ? "accent" : "ok";

const statusTone = (s: string): "ok" | "accent" | "default" =>
  s === "会員" ? "ok" : s === "アカデミー生" ? "accent" : "default";
```

### 15.3 マッピング表

| 入力 | zone tone | 入力 | status tone |
|------|-----------|------|-------------|
| `"0→1"` | `info` | `"会員"` | `ok` |
| `"1→10"` | `accent` | `"アカデミー生"` | `accent` |
| その他（`"10→"` 等） | `ok` | その他（OB等） | `default` |

### 15.4 prototype 出典
`primitives.jsx` L265–L266。

---

## 16. グローバルエクスポート（prototype 環境）

`primitives.jsx` L268–L272 で `Object.assign(window, { ... })` により window にぶら下げているが、プロダクション実装では各 primitive を **個別 named export** とし `import { Chip, Avatar, Button, ... } from "@/components/ui"` の形で提供する。

提供する識別子（prototype と同一）:
`Chip`, `Avatar`, `Button`, `Switch`, `Segmented`, `Field`, `Input`, `Textarea`, `Select`, `Search`, `Drawer`, `Modal`, `ToastCtx`, `useToast`, `ToastProvider`, `KVList`, `LinkPills`, `LINK_LABELS`, `zoneTone`, `statusTone`, `AvatarStoreProvider`, `useAvatarStore`, `readFileAsDataURL`。

---

## 17. 補助 primitive / helper 転記

### 17.1 AvatarStoreProvider excerpt

```jsx
const AvatarStoreProvider = ({ children }) => {
  const [photos, setPhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ubm-photos") || "{}"); } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem("ubm-photos", JSON.stringify(photos)); } catch {} }, [photos]);
  const setPhoto = useCallback((id, dataUrl) => setPhotos((p) => ({ ...p, [id]: dataUrl })), []);
  const removePhoto = useCallback((id) => setPhotos((p) => { const n = { ...p }; delete n[id]; return n; }), []);
  return <AvatarStoreCtx.Provider value={{ photos, setPhoto, removePhoto }}>{children}</AvatarStoreCtx.Provider>;
};
```

### 17.2 readFileAsDataURL excerpt

```jsx
const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});
```

### 17.3 Input / Textarea / Select excerpt

```jsx
const Input = (props) => <input className={"field " + (props.lg ? "field-lg " : "") + (props.className || "")} {...props} lg={undefined} />;
const Textarea = (props) => <textarea className={"field " + (props.className || "")} {...props} />;
const Select = ({ children, ...p }) => <select className={"field " + (p.className || "")} {...p}>{children}</select>;
```

### 17.4 zoneTone / statusTone excerpt

```jsx
const zoneTone = (z) => z === "0→1" ? "info" : z === "1→10" ? "accent" : "ok";
const statusTone = (s) => s === "会員" ? "ok" : s === "アカデミー生" ? "accent" : "default";
```

## 18. 実装上の注意

1. **token 名の正規化**: prototype の `var(--accent)` 等は実装時に `var(--ubm-accent)` に置換する（09b §0 マッピング表に従う）。
2. **localStorage キー**: `AvatarStoreProvider` は `ubm-photos` を使用。SSR 時は guard（`typeof window !== "undefined"`）を必須化する。
3. **JSON.parse 失敗**: `try/catch` で `{}` フォールバック（prototype 通り）。
4. **toast の id**: `Math.random().toString(36).slice(2)` で十分（衝突しない前提）。型安全性を上げる場合は `crypto.randomUUID()` を推奨。
5. **focus trap / scroll lock**: Drawer / Modal は prototype に無い。本実装では `react-focus-lock` 等で必ず追加する（a11y 要件）。
6. **Icon コンポーネント**: 09d 参照。size は number（px）、`name` は 09d の name catalog に存在するもののみ許容。
7. **CSS 変数の dark mode 対応**: 09b §6 参照（本仕様では light mode token 名のみで定義）。
8. **prototype 上の素リテラル**: prototype に存在する色・寸法の具体値は 09b token 名へ正規化する。本仕様には値リテラルを残さない。

---

## 99. 不採用 primitive

| 対象 | prototype 上の役割 | 09c で採用しない理由 | 下流での扱い |
| --- | --- | --- | --- |
| TweaksPanel | design prototype の表示調整 UI | 本番 UI primitive ではなく、開発時の見た目確認用 control であるため | task-10 では実装しない |
| data-theme switcher | light / dark などの preview 切替 | 本番テーマ適用は 09b token と app shell の責務であり、primitive 単体の責務ではないため | 09h shell / theme policy を参照 |
| AvatarStoreProvider#localStorage | prototype 内の avatar preview 永続化 | 本番の avatar 保存は backend / object storage / profile flow の責務であり、localStorage 固定にしないため | Avatar の表示 primitive と store 実装を分離する |

## 100. 変更履歴

- 2026-05-07: 初版作成（primitives.jsx の const-based primitive / helper を網羅し、token は `var(--ubm-*)` 形式に正規化）
