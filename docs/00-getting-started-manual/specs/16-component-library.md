# コンポーネントライブラリ仕様

## 位置づけ

`claude-design-prototype/primitives.jsx` を `apps/web/src/components/ui/` に移植する際の実装仕様。
Next.js App Router + TypeScript で再実装する。`localStorage` 依存は除去し、server/client 境界を明確にする。

---

## ディレクトリ構成

```
apps/web/src/components/
├── ui/                   # UIプリミティブ（本ドキュメントの対象）
│   ├── Chip.tsx
│   ├── Avatar.tsx
│   ├── Button.tsx
│   ├── Switch.tsx
│   ├── Segmented.tsx
│   ├── Field.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Search.tsx
│   ├── Drawer.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── KVList.tsx
│   ├── LinkPills.tsx
│   └── index.ts
├── layout/               # ページ共通レイアウト
│   ├── AppHeader.tsx
│   ├── AdminSidebar.tsx
│   └── PageContainer.tsx
├── member/               # メンバー表示系
│   ├── MemberCard.tsx
│   ├── ProfileHero.tsx
│   ├── VisibilitySummary.tsx
│   └── FilterBar.tsx
└── admin/                # 管理操作系
    ├── MemberDrawer.tsx
    ├── TagQueuePanel.tsx
    ├── SchemaDiffPanel.tsx
    └── MeetingPanel.tsx
```

---

## プリミティブ詳細

### Chip

```tsx
type ChipTone = "stone" | "warm" | "cool" | "green" | "amber" | "red"

interface ChipProps {
  tone?: ChipTone
  outline?: boolean
  children: React.ReactNode
}
```

用途: UBM区画バッジ・参加ステータス・タグ表示。
色決定: `zoneTone(zone)` / `statusTone(status)` ヘルパーを使う。

```ts
// apps/web/src/lib/tones.ts
export function zoneTone(zone: string): ChipTone { ... }
export function statusTone(status: string): ChipTone { ... }
```

---

### Avatar

```tsx
interface AvatarProps {
  memberId: string
  name: string
  hue?: number      // 0–360、memberId から生成する
  size?: "sm" | "md" | "lg"
  photoUrl?: string // サーバー側で管理する場合に渡す
  editable?: boolean
}
```

注意: prototype では `localStorage` にアバター画像を保存しているが、本番では画像 URL をサーバー管理にする（または Cloudflare Images）。`editable` プロップは管理者のみに限定する。
`editable=true` でもローカル保存は行わず、画像アップロード API が実装されるまでは表示専用にする。

---

### Button

```tsx
type ButtonVariant = "primary" | "accent" | "ghost" | "soft" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName       // left icon name
  iconRight?: IconName  // right icon name
  as?: "button" | "a"  // polymorphic
  href?: string         // "a" の場合
  loading?: boolean
}
```

`IconName` は prototype の `icons.jsx` から使用実績のある名前だけを `packages/shared` か `apps/web/src/components/ui/icons.ts` に列挙する。
正式実装では lucide-react を優先し、該当がないブランドアイコンだけ個別実装する。

---

### Switch

```tsx
interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}
```

用途: `/admin/members` ドロワーの公開/非公開トグル。

---

### Segmented

```tsx
interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}
```

用途: density 切替 (`comfy | dense | list`) など排他選択。
`comfortable` / `compact` は使用しない。

---

### Field

```tsx
interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}
```

`<Input>`, `<Textarea>`, `<Select>` を `children` に受け取るラッパー。エラー文字は赤で `aria-describedby` 連携する。

---

### Input / Textarea / Select

標準 HTML 要素の型付きラッパー。`<Field>` 内で使う。追加 props なし（`className` は内部で管理）。

---

### Search

```tsx
interface SearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}
```

虫眼鏡アイコンと × ボタン付き入力。`FilterBar` で `q` パラメータに対応する。

---

### Drawer

```tsx
interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: number   // default 480
  children: React.ReactNode
}
```

- 右からスライドイン
- Escape キーで閉じる
- `dialog` 要素ベース（アクセシビリティ対応）
- `/admin/members` のメンバー詳細操作に使用する

---

### Modal

```tsx
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}
```

- 中央表示、背景オーバーレイ
- 破壊的操作の確認（削除・公開停止）
- Google Form 再回答へ進む前の確認

---

### Toast

```tsx
// Provider をアプリルートに配置
<ToastProvider>
  {children}
</ToastProvider>

// 使用側
const { toast } = useToast()
toast({ message: "保存しました", type: "success" })
toast({ message: "エラーが発生しました", type: "error" })
```

- API 成功後にのみ表示する（prototype の demo toast は使用しない）
- 自動消滅: 3秒

---

### KVList

```tsx
interface KVListProps {
  items: { label: string; value: React.ReactNode }[]
  columns?: 1 | 2   // default 1
}
```

用途: `/profile` のフォーム回答内容表示、`/admin/members` ドロワーの回答確認。

---

### LinkPills

```tsx
interface LinkPillsProps {
  links: {
    label: string
    url: string
    icon?: "twitter" | "instagram" | "facebook" | "linkedin" | "web" | "line"
  }[]
}
```

用途: `/members/[id]` と `/profile` の SNS・連絡先セクション。
外部リンクは `target="_blank" rel="noopener noreferrer"` を付与する。

---

## デザイントークン

`styles.css` から移植するカスタムプロパティ。`apps/web/src/app/globals.css` に配置する。

| トークン | 用途 |
|---------|------|
| `--accent` | 主要アクションカラー（Button primary, Chip cool等） |
| `--surface` | カード・パネルの背景 |
| `--border` | 境界線の色 |
| `--text` | 本文テキスト |
| `--text-muted` | 補助テキスト |
| `--radius` | 角丸の基準値 |
| `--shadow-sm` | カードの影 |

テーマ切替（`stone / warm / cool`）は prototype のデモ機能であり、本番ではユーザー向けに公開しない。

---

## アクセシビリティ最低基準

実装時に必ず対応する項目:

| 項目 | 対応 |
|------|------|
| `Drawer` / `Modal` | `dialog` role、`aria-labelledby`、focus trap |
| `Button` | `aria-busy` (loading 中) |
| `Switch` | `role="switch"`, `aria-checked` |
| `Field` / `Input` | `id` と `htmlFor` 連携、`aria-describedby` (error) |
| 画像なし `Avatar` | `aria-label` に氏名を設定 |
| `LinkPills` | アイコンのみの場合 `aria-label` で URL 先を示す |

---

## prototype との差分ルール

| prototype の実装 | 本番での扱い |
|----------------|------------|
| `localStorage` でアバター画像保存 | サーバー管理に切り替える |
| `theme / nav / detailLayout` 切替 | 削除（ユーザー機能にしない） |
| `demo toast` で即時成功を出す | API レスポンス後に `useToast()` を呼ぶ |
| `MEMBERS` 配列から直接読む | `apps/api` エンドポイント経由にする |
| `window.UBM` グローバル参照 | Next.js の `fetch` + React Server Components に置き換える |

---

## 実装受け入れ条件

1. `apps/web/src/components/ui/index.ts` から全プリミティブを export する
2. `Button`, `Switch`, `Drawer`, `Modal`, `Search` は keyboard 操作で使える
3. `Drawer` と `Modal` は focus trap と Escape close を持つ
4. `Avatar` は `memberId` から安定した `hue` を生成し、`localStorage` を使わない
5. `Toast` は API 成功/失敗の結果からだけ表示する
6. `LinkPills` は外部リンクに `rel="noopener noreferrer"` を必ず付与する
