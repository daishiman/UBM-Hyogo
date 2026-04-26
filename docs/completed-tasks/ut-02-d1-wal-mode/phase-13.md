# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |

## 目的

Phase 1〜12 の成果物をまとめて PR を作成し、ユーザー承認を得てマージする。docs-only タスクとして変更サマリーを簡潔にまとめ、レビュアーが設定根拠を即座に把握できる PR を作成する。

> **重要: このフェーズはユーザーの明示的な承認なしに実行してはならない。**
> PR 作成・マージ操作を行う前に、必ずユーザーに確認を取ること。

## 実行タスク

- ユーザー承認ゲートを通過する（承認確認）
- local-check-result を確認する
- change-summary を作成する
- PR を作成する
- CI 確認と承認後のマージ手順を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/ut-02-d1-wal-mode/outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | docs/ut-02-d1-wal-mode/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/ut-02-d1-wal-mode/index.md | PR タイトル・説明の根拠 |
| 参考 | CLAUDE.md | ブランチ戦略・PR レビュー人数 |

## 実行手順

### ステップ 1: ユーザー承認ゲート（必須）

**このステップはユーザーの明示的な承認なしに進めてはならない。**

1. Phase 10 の GO 判定が確認されていることを確認する
2. Phase 12 の compliance-check が全 PASS であることを確認する
3. change-summary をユーザーに提示して承認を依頼する
4. ユーザーの承認を得た後にステップ 2 へ進む

### ステップ 2: local-check-result の確認

- git status で変更ファイルを確認する
- documentation-changelog と実際の変更ファイルが一致していることを確認する
- 機密情報（database_id 実値等）がコミット対象に含まれていないことを確認する

### ステップ 3: PR の作成

- feature ブランチを作成する（例: `feature/ut-02-d1-wal-mode`）
- 変更ファイルをステージングする
- コミットメッセージを作成する
- PR を作成する（GitHub Issue #4 に紐付け）

## 承認ゲート（ユーザー承認必須）【必須】

| ゲート項目 | 確認内容 | 承認状態 |
| --- | --- | --- |
| Phase 10 GO 判定確認 | outputs/phase-10/go-nogo.md が GO であること | 要確認 |
| Phase 12 compliance-check | 全項目 PASS であること | 要確認 |
| change-summary レビュー | ユーザーが変更内容を把握していること | **ユーザー承認待ち** |
| 機密情報の非混入確認 | database_id 実値・API キーが含まれていないこと | 要確認 |
| PR 作成実行 | **ユーザーの明示的な指示があった場合のみ実行** | **承認待ち** |

## local-check-result【必須】

PR 作成前に以下のコマンドで変更ファイルを確認する。

```bash
# 変更ファイルの確認
git status

# ステージング予定ファイルの確認
git diff --name-only

# 機密情報の混入チェック（database_id 実値が含まれていないか）
grep -r "database_id" docs/ut-02-d1-wal-mode/ \
  --include="*.md" | grep -v "placeholder\|dummy\|<.*>"
```

| チェック項目 | 期待値 | 状態 |
| --- | --- | --- |
| 変更ファイルが documentation-changelog と一致 | 一致 | spec_created |
| 機密情報（実 database_id）が含まれていない | 含まれていない | spec_created |
| phase-*.md が全 13 ファイル存在する | 13 ファイル | spec_created |
| index.md の Phase 一覧状態が更新されている | 全 Phase completed | spec_created |

## change-summary【必須】

### 変更概要

本 PR は UT-02 (D1 WAL mode 設定) タスクの仕様書を docs-only として作成するものです。
Cloudflare D1 の WAL mode 設定根拠・手順・環境差異を文書化し、02-serial-monorepo-runtime-foundation の runbook に統合します。

### 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
| --- | --- | --- |
| docs/ut-02-d1-wal-mode/index.md | 新規 / 更新 | タスク仕様書インデックス |
| docs/ut-02-d1-wal-mode/phase-01.md〜phase-13.md | 新規 | Phase 1〜13 の仕様書 |
| docs/ut-02-d1-wal-mode/outputs/ | 新規 | Phase 別成果物 |

### 影響範囲

- 実装コードへの変更なし（docs-only）
- 02-serial-monorepo-runtime-foundation の runbook に D1 競合対策の条件付き確認セクションを追加
- UT-09 (Sheets→D1 同期実装) の前提となる設定方針を確立

### 受入条件の充足

| AC | 充足状態 |
| --- | --- |
| AC-1: wrangler.toml D1 バインディング + D1 contention policy コメント | outputs/phase-02 で設計・phase-08 で DRY 化方針確立 |
| AC-2: WAL mutation は公式永続サポート確認後のみ実行 | outputs/phase-05 の runbook に gate と read-only 確認手順記録 |
| AC-3: D1 競合対策手順が 02-serial runbook に記録 | phase-12 の runbook 統合で対応 |
| AC-4: ローカル環境との差異文書化 | outputs/phase-02/env-diff-matrix.md |
| AC-5: 02-serial AC との整合確認 | phase-07 の AC matrix で確認 |

## PR 作成手順

ユーザー承認後に以下のコマンドを実行する。

```bash
# feature ブランチの作成（main から）
git fetch origin main
git checkout -b feature/ut-02-d1-wal-mode origin/main

# 変更ファイルのステージング
git add docs/ut-02-d1-wal-mode/

# コミット
git commit -m "docs(ut-02): D1 WAL mode 設定タスク仕様書を追加

- Phase 1〜13 の仕様書を作成
- WAL mode 設定根拠・手順・環境差異を文書化
- 02-serial-monorepo-runtime-foundation runbook との統合手順を記録

Closes #4"

# PR 作成
gh pr create \
  --title "docs(ut-02): D1 WAL mode 設定タスク仕様書" \
  --body "$(cat <<'EOF'
## 概要

UT-02 (D1 WAL mode 設定) タスクの仕様書を docs-only として作成します。

## 変更内容

- Phase 1〜13 の仕様書を作成
- WAL mode 設定根拠・環境差異・DRY 化方針を文書化
- 02-serial-monorepo-runtime-foundation の runbook 統合手順を記録

## 受入条件

- AC-1〜AC-5 を全件充足
- 実装コードへの変更なし（docs-only）

Closes #4
EOF
)" \
  --base main \
  --head feature/ut-02-d1-wal-mode
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を PR 作成の前提条件として使用 |
| Phase 12 | documentation-changelog から変更ファイルを特定 |

## 多角的チェック観点（AIが判断）

- 価値性: PR が Issue #4 を close し、02-serial への統合根拠が明確か。
- 実現性: docs-only 変更のみであり CI でのコード品質チェックは非該当か確認する。
- 整合性: change-summary が Phase 12 の documentation-changelog と一致しているか。
- 運用性: PR レビュアーが変更意図を理解できる説明になっているか（CLAUDE.md のブランチ戦略に従い dev→main で1名レビュー）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート | 13 | spec_created | **承認なし禁止** |
| 2 | local-check-result 確認 | 13 | spec_created | 機密情報混入チェック |
| 3 | change-summary 作成 | 13 | spec_created | ユーザーへの提示用 |
| 4 | feature ブランチ作成 | 13 | spec_created | ユーザー承認後のみ |
| 5 | PR 作成 | 13 | spec_created | ユーザー承認後のみ |
| 6 | CI 確認 | 13 | spec_created | PR 作成後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR | ユーザー承認後に作成 | UT-02 仕様書 PR |
| メタ | artifacts.json | 全 Phase completed に更新 |

## 完了条件

- [ ] ユーザー承認ゲートを通過している
- local-check-result の全チェック項目が PASS である
- PR が作成されて Issue #4 に紐付いている
- artifacts.json の全 Phase 状態が completed である

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述（なし：最終 Phase）
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項: PR マージ後、02-serial-monorepo-runtime-foundation の担当者に WAL mode runbook セクションの存在を通知する。
- ブロック条件: ユーザー承認がない場合は PR 作成を実行しない。
