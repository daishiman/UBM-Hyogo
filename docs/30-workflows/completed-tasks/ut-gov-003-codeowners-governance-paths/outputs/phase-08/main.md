# Phase 8 Output: CODEOWNERS DRY 化結果

> 状態: **NOT EXECUTED — pending**
> 本 Phase は仕様作成段階のため、実 CODEOWNERS 編集は行わない。実適用は実装 PR で実施する。

## 1. 既存 CODEOWNERS スナップショット

```
# NOTE: solo development project.
# This CODEOWNERS file documents ownership for reference only.
# `require_code_owner_reviews` is intentionally NOT enabled in branch protection.
*                   @daishiman
doc/01a-*/          @daishiman
doc/01b-*/          @daishiman
doc/01c-*/          @daishiman
.github/            @daishiman
```

問題点:
1. `doc/` 旧表記（現行は `docs/`）。
2. `01a-*` / `01b-*` / `01c-*` の 3 行に分散（DRY 違反）。
3. global `*` の位置は冒頭で OK だが、governance 重要 5 パス未指定。
4. `.github/workflows/**` の owner が広い `.github/` でしか担保されない。

## 2. After CODEOWNERS（Phase 5 実装 PR で適用予定）

```
# NOTE: solo development project — single maintainer @daishiman.
# CODEOWNERS is the SSOT (single source of truth) for ownership declaration.
# CLAUDE.md / README / docs/00-getting-started-manual/specs/* MUST NOT carry owner columns.
# `require_code_owner_reviews` is intentionally NOT enabled (UT-GOV-001 integration).
# Order policy: leading `*` (global fallback) -> broad globs -> narrow governance globs.
# CODEOWNERS uses "last matching pattern wins" semantics.

# === Global fallback ===
*                                       @daishiman

# === Infrastructure docs ===
docs/01-infrastructure-setup/**         @daishiman

# === Workflow / governance docs ===
docs/30-workflows/**                    @daishiman

# === Skill canonical references ===
.claude/skills/**/references/**         @daishiman

# === GitHub governance (broad) ===
.github/**                              @daishiman

# === GitHub Actions / CI (narrow, last wins) ===
.github/workflows/**                    @daishiman

# === Apps (responsibility-separated, NOT collapsed under apps/**) ===
apps/api/**                             @daishiman
apps/web/**                             @daishiman
```

## 3. 集約 / 分離判定表

| 親 glob | 子パス | 判定 | 理由 |
| --- | --- | --- | --- |
| `docs/30-workflows/**` | `docs/30-workflows/completed-tasks/**` | 集約 | 同一 owner、YAGNI |
| `docs/01-infrastructure-setup/**` | `01a-*/` `01b-*/` `01c-*/` | 集約 | 旧表記の 3 行を 1 行へ |
| `.github/**` | `.github/workflows/**` | 後置で上書き | CI を別 owner にしたい将来需要のため明示行を残す |
| `apps/**` | `apps/api/**` `apps/web/**` | **分離維持** | 責務境界（API / Web）が異なる |
| `.claude/skills/**/references/**` | 各 skill 配下 | 集約 | 正本仕様の owner は単一 |

## 4. 重複・競合候補（解消済み）

| # | 候補 | 解消結果 |
| --- | --- | --- |
| 1 | `doc/01a-*/` `doc/01b-*/` `doc/01c-*/` | `docs/01-infrastructure-setup/**` に統合 |
| 2 | `.github/` と `.github/workflows/**` | `.github/**` を先、`.github/workflows/**` を後置 |
| 3 | global `*` の位置 | 冒頭 1 行を維持 |
| 4 | 親子重複 `docs/30-workflows/**` × `completed-tasks/**` | 親 1 行に集約（completed-tasks 別 owner 不要） |
| 5 | CLAUDE.md / README の owner 列 | **未存在を確認**。SSOT 宣言を CODEOWNERS 冒頭コメントに追加 |

## 5. doc/ → docs/ 置換差分（pending 段階の想定）

実走時に `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!*.lock' .` で抽出する。
代表的な検出予定箇所:
- `.github/CODEOWNERS` 内の `doc/01a-*/` 等 3 行 → `docs/01-infrastructure-setup/**` 1 行に統合
- 仕様書本文中の旧 `doc/` 記述 → 外部 URL / 過去 commit 引用は対象外（不可避ケースとして残置可）

## 6. SSOT 宣言

- `.github/CODEOWNERS` が owner 表明の単一情報源 (SSOT)。
- CLAUDE.md / README / 正本仕様 / `docs/00-getting-started-manual/**` に owner 列を新設しない。
- 将来の owner 変更は CODEOWNERS の差分のみで完結する設計とする。

## 7. 残課題（次 Phase へ）

- Phase 9 で `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` を実走し errors=[] を確認。
- Phase 10 で 4 条件 (価値性 / 実現性 / 整合性 / 運用性) を再評価。
- 表記揺れ実走置換は実装 PR で実施。

> 本ファイルは pending プレースホルダ。実装 PR にて After CODEOWNERS を適用後、§5 の置換差分を実 diff で更新する。
