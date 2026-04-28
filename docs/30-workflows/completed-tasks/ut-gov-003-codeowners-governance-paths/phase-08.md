# Phase 8: リファクタリング (DRY 化)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング (DRY 化) |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |
| 親タスク | task-github-governance-branch-protection |
| 原典 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md |

## 目的

`.github/CODEOWNERS` は「最終マッチ勝ち」「行ベース」「glob は gitignore 風」という固有仕様を持つため、governance パスを個別列挙すると一見 DRY に見えても **glob が衝突**したり、**具体度の異なるルールが意図せず上書き**される事故が起きやすい。本 Phase は CODEOWNERS の DRY 化観点（glob 集約 / 行順序設計 / SSOT 単一化）を確定し、Phase 9 品質保証に「重複行 / 競合行 / 表記揺れ」を持ち越さないことを目的とする。

CLAUDE.md の主要ディレクトリ表は **owner 情報を持たない**（パス → 役割の対応表）ため、CODEOWNERS と直接重複はしないが、`docs/` 配下の owner 表明は CODEOWNERS のみを **SSOT** とし、CLAUDE.md / README / 正本仕様には owner 列を作らないことを本 Phase で明文化する。

## 実行タスク

1. `.github/CODEOWNERS` 既存行を棚卸しし、governance 重要 5 パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）が **個別列挙されているか / 1 親 glob で集約可能か** を判定する（完了条件: 集約可否表が埋まっている）。
2. CODEOWNERS の **最終マッチ勝ち** 仕様に沿って、行順序を「global fallback (`*`) → 広い glob → 狭い glob → governance 重要パス」に並べ替える設計を確定する（完了条件: 並べ替えポリシーが文書化）。
3. `doc/` と `docs/` の表記揺れ箇所を `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!*.lock'` で全文棚卸しし、CODEOWNERS の glob を **`docs/` のみに統一**する（完了条件: `doc/` 残存件数と置換差分が一覧化）。
4. CLAUDE.md / 正本仕様 / README に **owner 表が存在しない** ことを確認し、CODEOWNERS が owner SSOT であることを明文化する（完了条件: SSOT 宣言が記述）。
5. glob 集約による「意図しないパスの巻き込み」が起きていないか確認する。具体的には `docs/30-workflows/**` と `docs/30-workflows/completed-tasks/**` のように **親で覆える子 glob** は親に集約しつつ、completed-tasks のみ別 owner にしたい場合に限り狭い glob を **後置** する（完了条件: 巻き込みチェック表が埋まっている）。
6. `outputs/phase-08/main.md` に Before/After CODEOWNERS、重複候補表、SSOT 宣言、glob 集約方針を集約する（完了条件: 1 ファイルに記述。pending 段階ではプレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック（AC / 落とし穴 / scope） |
| 必須 | .github/CODEOWNERS | 既存 owner 行 |
| 必須 | CLAUDE.md | 主要ディレクトリ表（owner 列が無いことの確認源） |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-08.md | DRY 化 phase の構造参照 |
| 参考 | GitHub Docs: "About code owners" | 最終マッチ勝ち仕様 / glob 仕様 |
| 参考 | UT-GOV-001 (branch-protection-apply) | `require_code_owner_reviews=false` 整合先 |

## Before / After 比較テーブル（リファクタ対象）

> 詳細は `outputs/phase-08/main.md`。本仕様書には観点と代表例のみ記載。

### glob 集約

| 対象 | Before（既存または想定） | After | 理由 |
| --- | --- | --- | --- |
| infrastructure docs | `doc/01a-*/` `doc/01b-*/` `doc/01c-*/` の 3 行に分散 | `docs/01-infrastructure-setup/** @daishiman` 1 行に集約（`doc/` → `docs/` 統一前提） | DRY / 表記揺れ解消 |
| governance docs | （未指定） | `docs/30-workflows/** @daishiman` 1 行で `completed-tasks/**` まで包含 | 親 glob による集約 |
| 正本仕様 | （未指定） | `.claude/skills/**/references/** @daishiman` | governance 重要パス明示 |
| CI / workflow | `.github/ @daishiman` のみ | `.github/workflows/** @daishiman` を末尾近くに **後置** し、より広い `.github/` の上書きを意図 | 最終マッチ勝ち順序 |
| アプリ | （未指定） | `apps/api/** @daishiman` / `apps/web/** @daishiman` の 2 行（責務境界が異なるため集約しない） | 責務境界の維持 |

### 行順序

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| global fallback | 冒頭付近（`*` がファイル中段以前） | **最末尾の `*` ではなく最先頭の `*`** に変更し、後続の具体 glob で上書きする構造に統一 | CODEOWNERS は最終マッチ勝ちなので、`*` が末尾だと governance 行を全て無効化する。`*` は **冒頭に 1 行** が正解 |
| governance 重要パス | 順不同 | 「広い glob → 狭い glob」順に統一 | 最終マッチ勝ちで狭い glob を勝たせる |
| コメント | NOTE が冒頭にあるが SSOT 宣言なし | NOTE に「CODEOWNERS は owner SSOT。CLAUDE.md / README / 正本仕様に owner を書かない」を追記 | SSOT 一意化 |

### 表記統一

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| doc / docs | `doc/01a-*/` 等の旧表記 | `docs/01-infrastructure-setup/**` | 表記揺れ 0 / glob 漏れ防止 |
| 末尾スラッシュ | `/` 終端と `**` 混在 | `**` に統一（CODEOWNERS は recursive を `**` で明示） | glob 仕様の明示性 |
| 末尾 newline | 有無の表記揺れ | 末尾 newline 1 つで終端 | POSIX text file 規約 |

## 重複・競合候補の抽出箇所

| # | 候補 | 種別 | 解消方針 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `doc/01a-*/` `doc/01b-*/` `doc/01c-*/` の 3 行 | 重複 | `docs/01-infrastructure-setup/**` 1 行に集約 | 表記揺れ解消とセット |
| 2 | `.github/` と `.github/workflows/**` | 競合（具体度違い） | 広い `.github/` を先、狭い `.github/workflows/**` を後置 | 最終マッチ勝ちで意図通り動かす |
| 3 | global `*` の位置 | 順序事故 | `*` は冒頭 1 行、以降は具体 glob のみ | governance 行が必ず勝つ |
| 4 | `docs/30-workflows/**` × `docs/30-workflows/completed-tasks/**` | 親子重複 | 親 1 行に集約。completed-tasks のみ別 owner にする要件が出るまで子 glob は書かない | YAGNI |
| 5 | CLAUDE.md / README に owner 列 | 二重管理 | CODEOWNERS を SSOT とし、他媒体には書かない | SSOT 宣言 |

## glob 巻き込みチェック

| 親 glob | 子パス例 | 巻き込み判定 | 備考 |
| --- | --- | --- | --- |
| `docs/30-workflows/**` | `docs/30-workflows/completed-tasks/**` | 巻き込む（OK） | 同一 owner なら集約可 |
| `docs/30-workflows/**` | `docs/30-workflows/**/outputs/phase-NN/main.md` | 巻き込む（OK） | 深い path も自動カバー |
| `.claude/skills/**/references/**` | `.claude/skills/aiworkflow-requirements/references/...` | 巻き込む（OK） | skill 横断 |
| `.github/` | `.github/workflows/foo.yml` | 巻き込む。後置の `.github/workflows/**` で上書きする設計 | 最終マッチ勝ち順序が必須 |
| `apps/` | `apps/api/**` / `apps/web/**` | **意図的に親を作らない**。責務境界（api / web）を分けるため | 親集約より責務分離を優先 |

## SSOT 宣言

- **CODEOWNERS は owner 表明の単一情報源 (SSOT)** とする。
- CLAUDE.md / README / `doc(s)/00-getting-started-manual/specs/*` は **owner 列を持たない**（現状もそうなっている）。
- 将来 owner 表明を追加したくなった場合は、必ず `.github/CODEOWNERS` のみを編集する。他媒体への owner 列追加は禁止。

## 共通化パターン

- 行順序: 「冒頭 `*` (global fallback) → 広い glob → 狭い glob → 最重要 governance パス」を固定。
- 命名: recursive は `**` で明示。`/` 終端単独は使わない（`docs/30-workflows/` ではなく `docs/30-workflows/**`）。
- コメント: 各セクションに `# === <area> ===` ヘッダーを 1 行入れる（「Global」「Docs」「Skill references」「GitHub governance」「Apps」）。
- 用語: 「owner 表明 (ownership declaration)」「SSOT」「最終マッチ勝ち (last matching pattern wins)」を CODEOWNERS / 本 Phase / Phase 9 で固定。

## 削除対象一覧

- `doc/01a-*/` `doc/01b-*/` `doc/01c-*/` の旧表記行（`docs/01-infrastructure-setup/**` に統合）。
- 仮に CLAUDE.md / README に owner 列が将来追加された場合の該当行（本 Phase 時点では未存在を確認）。
- 末尾に余分な空行が複数連続する場合の余剰 newline。

## 実行手順

### ステップ 1: 既存 CODEOWNERS 棚卸し
- `cat .github/CODEOWNERS` で全行を抽出し、governance 重要 5 パスの被覆を確認。

### ステップ 2: 表記揺れ棚卸し
- `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!*.lock'` で `doc/` 残存を全文抽出。

### ステップ 3: glob 集約方針確定
- 上記巻き込みチェック表を埋め、親集約 / 責務分離の判断を確定。

### ステップ 4: 行順序設計
- 「冒頭 `*` → 広い → 狭い」順で並べ替えた After CODEOWNERS を記述。

### ステップ 5: SSOT 宣言記述
- CODEOWNERS 冒頭コメントと本 Phase の SSOT セクションに「他媒体に owner を書かない」を明記。

### ステップ 6: outputs/phase-08/main.md に集約
- pending 段階では「NOT EXECUTED — pending」プレースホルダで可。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | `gh api .../codeowners/errors` 検証の前提として DRY 化済み CODEOWNERS を渡す |
| Phase 10 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）の根拠に集約結果を使用 |
| UT-GOV-001 | `require_code_owner_reviews=false` 整合確認時に SSOT 宣言を引用 |
| UT-GOV-004 | `.github/workflows/**` owner の最終マッチ勝ち順序を引き継ぎ |

## 多角的チェック観点

- 価値性: governance 重要 5 パスの owner 表明が単一の SSOT (CODEOWNERS) に集約される。
- 実現性: 既存 `.github/CODEOWNERS` 5〜10 行程度の編集で完結。
- 整合性: 不変条件（CODEOWNERS が owner の正本）/ UT-GOV-001 の `require_code_owner_reviews=false` 方針 / 表記統一 (`docs/`) を保つ。
- 運用性: 行順序 1 ルール（冒頭 `*` → 広い → 狭い）で将来の追加もブレない。
- 責務境界: `apps/api` / `apps/web` は責務分離のため親集約しない。
- 用語ドリフト: 「owner 表明 / SSOT / 最終マッチ勝ち」3 用語の表記揺れ 0。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 既存 CODEOWNERS 棚卸し | 8 | pending | 5 governance パス被覆確認 |
| 2 | doc/docs 表記揺れ全文棚卸し | 8 | pending | rg コマンド固定 |
| 3 | glob 集約可否判定 | 8 | pending | 親子巻き込みチェック表 |
| 4 | 行順序設計（冒頭 `*` 方針） | 8 | pending | 最終マッチ勝ち遵守 |
| 5 | SSOT 宣言記述 | 8 | pending | CLAUDE.md / README に owner 列なしを確認 |
| 6 | outputs/phase-08/main.md 作成 | 8 | pending | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After CODEOWNERS / 重複候補表 / SSOT 宣言 / glob 集約方針 |
| メタ | （任意）artifacts.json | Phase 8 状態の更新 |

## 検証コマンド

```bash
# 表記揺れ全文棚卸し
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!*.lock' \
  -g '!docs/30-workflows/completed-tasks/**' .

# 既存 CODEOWNERS 全行 + 行数確認
cat .github/CODEOWNERS
wc -l .github/CODEOWNERS

# 重複行検出（同一 path が複数回現れていないか）
awk 'NF && !/^#/ {print $1}' .github/CODEOWNERS | sort | uniq -d

# governance 重要 5 パスの被覆確認
for p in 'docs/30-workflows/' '.claude/skills/' '.github/workflows/' 'apps/api/' 'apps/web/'; do
  echo "== $p =="
  grep -F "$p" .github/CODEOWNERS || echo '  NOT FOUND'
done
```

## 完了条件

- [ ] glob 集約可否表が埋まっている（親子巻き込み 5 ペア以上）
- [ ] Before/After 比較が 3 区分（glob 集約 / 行順序 / 表記統一）すべて埋まる
- [ ] 重複・競合候補が 4 件以上抽出されている
- [ ] `doc/` 残存件数と置換差分が一覧化
- [ ] SSOT 宣言（CLAUDE.md / README に owner を書かない）が記述
- [ ] 行順序ポリシー（冒頭 `*` → 広い → 狭い）が文書化
- [ ] outputs/phase-08/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `pending`
- 成果物が `outputs/phase-08/main.md` に配置予定
- 用語ドリフト 0（owner 表明 / SSOT / 最終マッチ勝ち）
- 表記揺れ 0（`docs/` のみ）

## 苦戦防止メモ

- CODEOWNERS の `*` 位置を間違えると governance 行が **silently** 全部無効化される。`*` は冒頭、具体 glob を後段に置くこと。
- `doc/` を `docs/` に置換する際、CHANGELOG / 旧 commit log / 外部 URL 文字列まで巻き込まないこと。`rg` で確認後、置換は CODEOWNERS と CLAUDE.md の誤記に限定する（外部リンクは不可避ケースとして残置可）。
- 親 glob で集約しすぎると将来 owner を分割したくなった時に行構造が壊れる。`apps/api` / `apps/web` は責務分離のため意図的に親を作らない。

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済み CODEOWNERS Before/After
  - SSOT 宣言（CODEOWNERS が owner の正本）
  - 行順序ポリシー（冒頭 `*` → 広い → 狭い）
  - `doc/` → `docs/` 表記統一の置換差分
- ブロック条件:
  - global `*` が冒頭以外に置かれている
  - governance 重要 5 パスのいずれかが未指定
  - 重複行が解消されていない
  - `doc/` 残存が解消されていない
