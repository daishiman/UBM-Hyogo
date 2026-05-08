# Implementation guide

## Part 1: 中学生レベルの説明

なぜ必要かを先に説明します。
大きな学校で、教室の場所を書いた案内図がないと、次の授業に行く人は毎回だれかに聞くことになります。
`09a-prototype-map.md` は、その案内図のような文書です。

`09a-prototype-map.md` は、プロトタイプのどこを見れば本番画面を作れるかを教える地図です。
たとえば `/members` 画面を作る人は、表で `/(public)/members` を探します。
そこに `pages-public.jsx L208-L338` と書いてあれば、その範囲を読めば見た目のもとが分かります。

このタスクではアプリのコードは変えません。
見た目の参照先を1つの文書にまとめ、後続タスクが迷わないようにします。

### 専門用語セルフチェック

| 用語 | 言い換え |
|------|----------|
| プロトタイプ | 本番を作る前の見本 |
| 本番実装 | 実際にみんなが使う画面 |
| route | 画面の住所 |
| component | 画面を作る部品 |
| line range | 見本の何行目から何行目を見るか |
| verifier | 文書が約束通りか調べる確認係 |

## Part 2: 技術者向け

### Added Artifacts

- `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- `scripts/verify-09a-prototype-line-ranges.sh`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-prototype-map.md`

### Contract

- Routes: exactly 19 (public 6 / member 2 / admin 8 / common 3)
- Primitive mappings: 13+
- Derivation rules: 5.1-5.8
- Line range format: `L<start>-L<end>`
- Rejection markers: `TweaksPanel`, `AvatarStoreProvider`, `data-theme="warm"`, `data-theme="cool"`

### TypeScript Interface

This task does not add runtime TypeScript, but downstream consumers can model the markdown contract with this shape:

```ts
type PrototypeSource =
  | "app.jsx"
  | "primitives.jsx"
  | "pages-public.jsx"
  | "pages-member.jsx"
  | "pages-admin.jsx"
  | "icons.jsx"
  | "data.jsx"
  | "styles.css"
  | "(not present)";

type LineRange = `L${number}-L${number}` | "—";

interface PrototypeMapRouteRow {
  route: string;
  prototypeFile: PrototypeSource;
  lineRange: LineRange;
  primaryComponent: string;
  derivationRule?: "§5.1" | "§5.2" | "§5.3" | "§5.4" | "§5.5" | "§5.6" | "§5.7" | "§5.8";
  note?: string;
}
```

### CLI Signature And Usage

```bash
bash scripts/verify-09a-prototype-line-ranges.sh
```

Expected output:

```text
OK: 09a-prototype-map.md verifier passed
```

The verifier has no arguments. It reads `docs/00-getting-started-manual/specs/09a-prototype-map.md` and the frozen prototype files under `docs/00-getting-started-manual/claude-design-prototype/`.

### Error Handling And Edge Cases

| Case | Behavior |
|------|----------|
| `09a-prototype-map.md` missing | verifier exits non-zero with `FAIL` |
| route rows not exactly 19 | verifier exits non-zero |
| derivation sections not exactly 5.1-5.8 | verifier exits non-zero |
| token literals copied into 09a | verifier exits non-zero |
| prototype file line count shorter than ledger end | verifier exits non-zero |
| expected symbol not found at ledger start line | verifier exits non-zero |
| UI screenshot request | N/A because this task is docs-only / NON_VISUAL |

### Parameters And Constants

| Name | Value |
|------|-------|
| map path | `docs/00-getting-started-manual/specs/09a-prototype-map.md` |
| route rows | exactly 19 |
| minimum map length | 360 lines |
| minimum ledger rows | 25 |
| derivation sections | exactly 8 |
| rejection markers | 4 or more |
| visual evidence | `NON_VISUAL` |

### Boundary

- No app code.
- No package code.
- No schema or migration changes.
- No token values.
- No props/state canonicalization.
