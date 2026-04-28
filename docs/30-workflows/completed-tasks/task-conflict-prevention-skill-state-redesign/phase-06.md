# Phase 6: A-2 実装ランブック（Changesets パターンによる fragment 化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 6 / 13 |
| Phase 名称 | A-2 実装ランブック |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 (A-1 実装ランブック) |
| 下流 | Phase 7 (A-3 / B-1 実装ランブック) |
| 状態 | pending |

## 目的

A-2「append-only ログの fragment 化」を、別タスクが実装できる粒度に固定する。
**コード本体は書かない**。fragment 構造、変換手順、render script API を文章で固定する。

## 対象施策 (A-2) の要点

- 対象ファイル:
  - `.claude/skills/aiworkflow-requirements/LOGS.md`
  - `.claude/skills/task-specification-creator/SKILL-changelog.md`
  - `.claude/skills/**/lessons-learned-*.md`
- Why: 「行末追記」型 ledger は同じ行末位置で追記するため 3-way merge で必ず衝突する。
  Changesets / Knip が採用する fragment パターンは、各変更を個別ファイル
  `changes/<uuid>.md` として書き出し、release 時に集約する。
  これにより「同じファイルを複数人が同時に編集する」現象自体を消滅させる。
- How:
  - `LOGS.md` を `LOGS/` ディレクトリへ転換、各エントリは
    `LOGS/<YYYYMMDD-HHMMSS>-<escaped-branch>-<nonce>.md` として独立ファイル
  - 集約 view が条件を満たす場合は `pnpm skill:logs:render` で結合表示する build script を用意（git 管理外）
  - `SKILL-changelog.md` も `changelog/<version>.md` 形式へ
  - 既存追記コードは fragment 生成へ書き換える（実装は本仕様の外）

## 実装ランブック（別タスクで実行する手順）

### Step 1: ディレクトリ転換

1. 各対象 skill 内に `LOGS/` `changelog/` `lessons-learned/` ディレクトリを新規作成
2. 既存ファイルは `LOGS/_legacy.md` 等の名前で温存（Phase 3 後方互換評価で確定した方針）
3. `.gitkeep` を置いて空ディレクトリ追跡

### Step 2: fragment スキーマ実装（ドキュメント側）

1. `outputs/phase-2/fragment-schema.md` の規約を SKILL.md / references に転記
2. 命名規則（正規表現）と front matter スキーマ（YAML）を提示
3. ブランチ名のエスケープ規則（`/` → `_`）を明記

### Step 3: 追記コードの fragment 生成への書き換え（実装は別タスク）

1. ledger 追記を行っている箇所を grep
2. 「ファイル末尾 append」から「`LOGS/<timestamp>-<branch>.md` 新規作成」へ書き換え
3. front matter の自動付与ヘルパーを共通化

### Step 4: render script 雛形（実装は別タスク）

1. `pnpm skill:logs:render` を package.json に追加
2. スクリプト本体（実装は別タスク）の API は `outputs/phase-2/render-api.md` 準拠
3. 出力先デフォルトは stdout、`--out` 指定時のみファイル書き出し（gitignore 必須）

### Step 5: 検証

1. Phase 4 C-1 / C-2 / C-6 / C-7 を実行
2. 衝突 0 件を確認

## ロールバック手順

1. 新ディレクトリを削除
2. `_legacy.md` をオリジナル名へ戻す
3. 追記コードを元の append 方式に戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-2/fragment-schema.md | fragment 規約 |
| 必須 | outputs/phase-2/render-api.md | render API |
| 必須 | outputs/phase-3/backward-compat.md | _legacy 退避方針 |
| 参考 | https://github.com/changesets/changesets | パターン参照 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-6/main.md | Phase 6 サマリー |
| ドキュメント | outputs/phase-6/fragment-runbook.md | A-2 実装ランブック |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | C-1 / C-2 / C-6 / C-7 を手動検証 |

## 完了条件

- [ ] fragment-runbook.md / main.md 作成
- [ ] AC-2 (命名規約一意性) を満たすことが確認可能
- [ ] artifacts.json の Phase 6 を completed に更新

## 次 Phase

- 次: Phase 7 (A-3 / B-1 実装ランブック)
- 引き継ぎ事項: A-2 ランブック

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。
