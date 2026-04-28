# Fragment Schema

## ディレクトリレイアウト

```
.claude/skills/<skill>/
├── LOGS/                      # 旧 LOGS.md
│   ├── .gitkeep
│   ├── _legacy.md             # 旧 LOGS.md を git mv で退避
│   └── <fragment>.md
├── changelog/                 # 旧 SKILL-changelog.md
│   ├── .gitkeep
│   ├── _legacy.md
│   └── <fragment>.md
└── lessons-learned/           # 旧 lessons-learned-*.md
    ├── .gitkeep
    ├── _legacy-<base>.md
    └── <fragment>.md
```

## 命名 regex

```
^(LOGS|changelog|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$
```

`scripts/lib/fragment-path.ts:FRAGMENT_NAME_REGEX` に定数化。

## branch escape

| ステップ | 処理 |
| -------- | ---- |
| 1 | 大文字 → 小文字 |
| 2 | `/` → `-` |
| 3 | 許可文字 `[a-z0-9_-]` 以外を `-` に置換 |
| 4 | 連続 `-` を 1 つに圧縮 |
| 5 | 64 文字超は trailing trim |

実装: `scripts/lib/branch-escape.ts:escapeBranch`

## nonce

- 4 byte / 8 hex（`randomBytes(4).toString("hex")`）
- 衝突期待値 ≈ `1000² / 2^33 ≈ 1.16×10⁻⁴`（秒間 1000 件想定）
- 同 path 事前存在チェック → 衝突時 nonce 再生成最大 3 回（4 回目で throw `CollisionError`）

## front matter（YAML 必須項目）

| key | 型 | 例 |
| --- | -- | -- |
| `timestamp` | ISO8601 UTC | `2026-04-28T17:00:00Z` |
| `branch` | escape 前の元 branch | `feat/issue-130-skill-ledger-a2-fragment-task-spec` |
| `author` | git user.email など | `daishimanju@gmail.com` |
| `type` | `log` / `changelog` / `lessons-learned` | `log` |

## path 上限

- 240 byte（NTFS 互換マージン）
- `scripts/lib/fragment-path.ts:isWithinPathByteLimit` で事前検証 → 超過時 throw

## legacy 退避規約

- 旧 `LOGS.md` → `LOGS/_legacy.md`（`git mv` で履歴連続性保持）
- 旧 `SKILL-changelog.md` → `changelog/_legacy.md`
- 旧 `lessons-learned-<base>.md` → `lessons-learned/_legacy-<base>.md`
- render は `_legacy*.md` を末尾「Legacy」セクションへ連結（`--include-legacy` 指定時のみ）
