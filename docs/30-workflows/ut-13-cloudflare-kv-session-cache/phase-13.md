# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR作成 |
| 作成日 | 2026-04-27 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（マージ準備完了） |
| 状態 | pending |

## 目的

Phase 1〜12 の成果物をまとめて PR を作成し、ユーザー承認を得てマージする。docs-only タスクとして変更サマリーを簡潔にまとめ、レビュアーが KV 設定根拠・TTL 方針・無料枠運用方針を即座に把握できる PR を作成する。

> **重要: このフェーズはユーザーの明示的な承認なしに実行してはならない（approval gate 必須）。**
> PR 作成・マージ操作を行う前に、必ずユーザーに確認を取ること。

## 実行タスク

- ユーザー承認ゲートを通過する（承認確認）
- local-check-result（lint / typecheck / build）を確認・記録する
- change-summary（変更ファイルリスト + 影響範囲）を作成する
- feature ブランチ `feat/ut-13-cloudflare-kv-session-cache` を作成する
- PR を作成し GitHub Issue #16 に紐付ける
- CI 確認と承認後のマージ手順を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | spec 同期結果の参照 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | PR タイトル・説明の根拠 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 参考 | CLAUDE.md | ブランチ戦略・PR レビュー人数 |

## 実行手順

### ステップ 1: ユーザー承認ゲート（必須）

**このステップはユーザーの明示的な承認なしに進めてはならない。**

1. Phase 10 の GO 判定が確認されていることを確認する
2. Phase 12 の compliance-check が全 PASS であることを確認する
3. change-summary をユーザーに提示して承認を依頼する
4. ユーザーの承認を得た後にステップ 2 へ進む

### ステップ 2: local-check-result の確認

- `mise exec -- pnpm lint` を実行し PASS を確認する
- `mise exec -- pnpm typecheck` を実行し PASS を確認する
- `mise exec -- pnpm build` を実行し PASS を確認する（docs-only のため影響軽微の想定）
- git status で変更ファイルを確認する
- documentation-changelog と実際の変更ファイルが一致していることを確認する
- 機密情報（KV Namespace ID 実値・Account ID 等）がコミット対象に含まれていないことを確認する

### ステップ 3: PR の作成

- feature ブランチを作成する（`feat/ut-13-cloudflare-kv-session-cache`）
- 変更ファイルをステージングする（`git add -A` ではなくパス指定）
- コミットメッセージを作成する
- PR を作成する（GitHub Issue #16 に紐付け）

## 承認ゲート（ユーザー承認必須）【必須】

| ゲート項目 | 確認内容 | 承認状態 |
| --- | --- | --- |
| Phase 10 GO 判定確認 | outputs/phase-10/go-nogo.md が PASS / MINOR であること | 要確認 |
| Phase 12 compliance-check | 全項目 PASS であること | 要確認 |
| change-summary レビュー | ユーザーが変更内容を把握していること | **ユーザー承認待ち** |
| 機密情報の非混入確認 | KV Namespace ID 実値・Account ID・API Token が含まれていないこと | 要確認 |
| local-check-result 全 PASS | lint / typecheck / build すべて PASS | 要確認 |
| PR 作成実行 | **ユーザーの明示的な指示があった場合のみ実行** | **承認待ち** |

## local-check-result【必須】

PR 作成前に以下のコマンドで品質チェックと変更ファイル確認を行う。

```bash
# 品質チェック（mise exec 経由で Node 24 を確実に使用）
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm build

# 変更ファイルの確認
git status

# ステージング予定ファイルの確認
git diff --name-only

# 機密情報の混入チェック（KV Namespace ID 実値が含まれていないか）
grep -rE "[0-9a-f]{32}" docs/30-workflows/ut-13-cloudflare-kv-session-cache/ \
  --include="*.md" | grep -v "placeholder\|dummy\|<.*>\|example"
```

| チェック項目 | 期待値 | 状態 |
| --- | --- | --- |
| pnpm lint | PASS | pending |
| pnpm typecheck | PASS | pending |
| pnpm build | PASS | pending |
| 変更ファイルが documentation-changelog と一致 | 一致 | pending |
| 機密情報（実 KV Namespace ID / Account ID）が含まれていない | 含まれていない | pending |
| phase-*.md が全 13 ファイル存在する | 13 ファイル | pending |
| index.md の Phase 一覧状態が更新されている | 全 Phase completed | pending |
| outputs/phase-12/ 必須 6 ファイル存在 | 6 ファイル | pending |

## change-summary【必須】

### 変更概要

本 PR は UT-13 (Cloudflare KV セッションキャッシュ設定) タスクの仕様書を docs-only として作成するものです。
KV Namespace（production / staging）作成・wrangler.toml バインディング設定・TTL 方針・無料枠運用方針・最終的一貫性制約への設計指針を文書化し、`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV 設定セクションを追記します。

### 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
| --- | --- | --- |
| docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | 新規 / 更新 | タスク仕様書インデックス |
| docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-01.md〜phase-13.md | 新規 | Phase 1〜13 の仕様書 |
| docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/ | 新規 | Phase 別成果物（phase-01〜phase-13） |
| docs/30-workflows/ut-13-cloudflare-kv-session-cache/artifacts.json | 新規 | Phase 状態管理 |
| .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 追記 | KV 設定セクション追加 |
| .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 追記 | KV / SESSION_KV エントリ追加 |
| .claude/skills/aiworkflow-requirements/LOGS.md | 追記 | UT-13 完了ログ |
| .claude/skills/task-specification-creator/LOGS.md | 追記 | UT-13 仕様作成完了ログ |

### 影響範囲

- 実装コードへの変更なし（docs-only）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV 設定セクションを追加（下流タスクの参照元）
- 下流の認証実装・セッション管理タスクの前提となる KV 設定方針を確立

### 受入条件の充足

| AC | 充足状態 |
| --- | --- |
| AC-1: KV Namespace 作成手順・命名規約（prod/staging） | outputs/phase-05 の runbook に作成手順を記録 |
| AC-2: wrangler.toml バインディング設計 | outputs/phase-08 で DRY 化方針を確立 |
| AC-3: Workers からの read/write 動作確認手順 | outputs/phase-11 の smoke test 手順で記録（実装は下流） |
| AC-4: TTL 設定方針ドキュメント化 | outputs/phase-02 / phase-08 で方針確立 |
| AC-5: 無料枠運用方針明文化 | outputs/phase-09 の quality-report で確認 |
| AC-6: Namespace/バインディング名の下流タスク向け文書化 | outputs/phase-12 で deployment-cloudflare.md に追記 |
| AC-7: 最終的一貫性制約の設計指針明記 | outputs/phase-09 の最終的一貫性指針で確立 |

## PR 作成手順

ユーザー承認後に以下のコマンドを実行する。

```bash
# feature ブランチの作成（main から）
git fetch origin main
git checkout -b feat/ut-13-cloudflare-kv-session-cache origin/main

# 変更ファイルのステージング（パス指定で機密混入を防ぐ）
git add docs/30-workflows/ut-13-cloudflare-kv-session-cache/
git add .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
git add .claude/skills/aiworkflow-requirements/indexes/topic-map.md
git add .claude/skills/aiworkflow-requirements/LOGS.md
git add .claude/skills/task-specification-creator/LOGS.md

# コミット
git commit -m "$(cat <<'EOF'
feat(ut-13): Cloudflare KV セッションキャッシュ namespace 設定

- Phase 1〜13 の仕様書を作成（docs-only）
- KV Namespace（prod/staging）作成・wrangler.toml バインディング設定方針を文書化
- TTL 方針・無料枠運用方針・最終的一貫性制約の設計指針を確立
- deployment-cloudflare.md に KV 設定セクションを追記

Closes #16
EOF
)"

# PR 作成
gh pr create \
  --title "feat(ut-13): Cloudflare KV セッションキャッシュ namespace 設定" \
  --body "$(cat <<'EOF'
## 概要

UT-13 (Cloudflare KV セッションキャッシュ設定) タスクの仕様書を docs-only として作成します。

## 変更内容

- Phase 1〜13 の仕様書を作成
- KV Namespace（production / staging）作成手順・wrangler.toml バインディング設定・TTL 方針を文書化
- 無料枠（write 1,000/day, read 100,000/day）運用方針を明文化
- 最終的一貫性制約（最大 60 秒の伝搬遅延）への設計指針を記録
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV 設定セクションを追記

## 受入条件

- AC-1〜AC-7 を全件充足
- 実装コードへの変更なし（docs-only / NON_VISUAL）

## レビュー観点

- 機密情報（KV Namespace ID / Account ID）が記載されていないこと
- production / staging のバインディング名が `SESSION_KV` で一貫していること
- 運用検証 TTL が Cloudflare KV の current 制約と最終的一貫性を踏まえていること

Closes #16
EOF
)" \
  --base main \
  --head feat/ut-13-cloudflare-kv-session-cache
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を PR 作成の前提条件として使用 |
| Phase 12 | documentation-changelog から変更ファイルを特定 |

## 多角的チェック観点（AIが判断）

- 価値性: PR が Issue #16 を close し、下流タスクへの統合根拠が明確か。
- 実現性: docs-only 変更のみであり CI でのコード品質チェックは非該当か確認する。
- 整合性: change-summary が Phase 12 の documentation-changelog と一致しているか。
- 運用性: PR レビュアーが変更意図を理解できる説明になっているか（CLAUDE.md のブランチ戦略に従い dev→main で 1 名レビュー）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート | 13 | pending | **承認なし禁止** |
| 2 | local-check-result（lint/typecheck/build） | 13 | pending | mise exec 経由 |
| 3 | 機密情報混入チェック | 13 | pending | KV ID / Account ID grep |
| 4 | change-summary 作成 | 13 | pending | ユーザーへの提示用 |
| 5 | feature ブランチ作成 | 13 | pending | ユーザー承認後のみ |
| 6 | PR 作成 | 13 | pending | ユーザー承認後のみ |
| 7 | CI 確認 | 13 | pending | PR 作成後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR | https://github.com/daishiman/UBM-Hyogo/pull/TBD | UT-13 仕様書 PR |
| メタ | artifacts.json | 全 Phase completed に更新 |
| ログ | outputs/phase-13/local-check-result.md | lint/typecheck/build 結果記録 |
| ログ | outputs/phase-13/change-summary.md | 変更ファイルリストと影響範囲 |

## 完了条件

- ユーザー承認ゲートを通過している
- local-check-result の全チェック項目が PASS である
- 機密情報の混入がないことを確認済み
- PR が作成されて Issue #16 に紐付いている
- artifacts.json の全 Phase 状態が completed である

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述（なし：最終 Phase）
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: なし（マージ準備完了）
- 引き継ぎ事項: PR マージ後、下流の認証実装・セッション管理タスクの担当者に deployment-cloudflare.md の KV 設定セクションの存在を通知する。
- ブロック条件: ユーザー承認がない場合は PR 作成を実行しない。
