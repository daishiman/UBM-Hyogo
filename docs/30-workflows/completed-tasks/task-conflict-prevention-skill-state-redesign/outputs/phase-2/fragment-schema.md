# Phase 2 設計成果物: Fragment Schema (AC-2)

A-2 で導入する fragment ファイルの命名規約・正規表現・front matter スキーマを固定。
**同一秒・同一 branch でも一意**になることを保証する。

## 1. LOGS fragment 命名規約

### フォーマット

```
LOGS/<YYYYMMDD>-<HHMMSS>-<escaped-branch>-<nonce>.md
```

例: `LOGS/20260428-101514-feat_wt-3-a3f9c20b.md`

### 正規表現（厳格）

```
^LOGS/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$
```

| 部位 | 文字集合 | 長さ | 役割 |
| --- | --- | --- | --- |
| `<YYYYMMDD>` | `[0-9]` | 8 | UTC 日付 |
| `<HHMMSS>` | `[0-9]` | 6 | UTC 時刻（秒精度） |
| `<escaped-branch>` | `[a-z0-9_-]` | 1〜64 | branch 名の正規化（後述） |
| `<nonce>` | `[a-f0-9]` | 8 | ランダム hex（4 byte） |

### 一意性の根拠

- 同秒・同 branch でも 8 hex（32bit）の nonce で実質衝突確率 < 1/2^32
- 1 worktree が 1 秒間に 1000 ファイル生成しても期待衝突回数 ≈ 1000²/2^33 ≈ 1.16×10⁻⁴
- 4 worktree 並列でも秒間生成数 << 衝突閾値

### branch 名 escape 規則

| 元文字 | 変換後 | 理由 |
| --- | --- | --- |
| `/` | `_` | path separator 衝突 |
| 大文字 | 小文字 | macOS / Linux ファイル名差吸収 |
| `[a-z0-9_-]` 以外 | 削除 | filesystem safety |
| 連続 `_` | 単一 `_` | 可読性 |
| 先頭・末尾の `_` `-` | trim | 可読性 |

例: `feat/wt-3` → `feat_wt-3`、`Feature/UBM-001` → `feature_ubm-001`。

### 上限

- branch 部 64 文字（超過時は head 64 で truncate）
- 全体 path 長 ≤ 240 byte（NTFS 互換マージン）

## 2. Front matter YAML スキーマ

```yaml
---
timestamp: 2026-04-28T10:15:14Z   # ISO 8601 UTC、必須
branch: feat/wt-3                 # 元 branch 名（escape 前）、必須
author: claude | human | hook     # 必須
type: log | event | trace         # 必須
summary: "短い要約 ≤ 80 char"      # 任意
---
```

| field | 型 | 必須 | 検証 |
| --- | --- | --- | --- |
| `timestamp` | string (ISO 8601) | ◯ | render が parse 不能なら fail |
| `branch` | string | ◯ | 1〜128 文字 |
| `author` | enum | ◯ | `claude` / `human` / `hook` |
| `type` | enum | ◯ | `log` / `event` / `trace` |
| `summary` | string | × | 80 文字以内推奨 |

## 3. changelog fragment

- パス: `changelog/<semver>.md`
- 正規表現: `^changelog/[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.-]+)?\.md$`
- 1 ファイル = 1 release（semver 単位で必ず一意）
- front matter:

```yaml
---
version: 1.4.0
released: 2026-04-28
---
```

## 4. lessons-learned fragment

- パス: `lessons-learned/<YYYYMMDD>-<topic-kebab>.md`
- 正規表現: `^lessons-learned/[0-9]{8}-[a-z0-9-]+\.md$`
- 1 ファイル = 1 topic

## 5. AC-2 充足根拠

- 命名規約に時刻 + escaped branch + nonce の 3 要素が揃い、同秒・同 branch でも nonce で一意化
- 正規表現で path が機械検証可能
- escape 規則・長さ上限・衝突確率を数値で示した
