# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終 Phase） |
| 状態 | pending |

## 目的

Phase 1〜12 で作成・更新した全成果物をまとめ、GitHub Pull Request を作成して変更をレビュー可能な状態にする。

> ⚠️ **承認ゲート: ユーザーの明示的な承認なしに本 Phase を実行することを禁止する。**
>
> Phase 12 完了後、必ずユーザーに「Phase 13（PR 作成）を実行してよいですか？」と確認し、
> 明示的な「OK」「進めてください」等の承認を得てから以下の手順を実行すること。
> ユーザーの応答を待たずに自律的に実行することは厳禁である。

## 実行タスク

- ローカルチェック（typecheck / lint / build）を実行し結果を記録する
- 変更ファイルの一覧を確認する
- PR チェックリストを `outputs/phase-13/pr-checklist.md` として作成する
- git commit を作成する
- feature ブランチを remote に push する
- `gh pr create` で Pull Request を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/ut-03-sheets-api-auth/index.md | タスク全体概要・GitHub Issue #5 |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | outputs/phase-10/go-nogo-decision.md | GO 判定の根拠 |
| 参考 | CLAUDE.md | ブランチ戦略・コミット規約 |

## 実行手順

### ステップ 1: 承認の確認

> **ユーザーの明示的な承認を確認する。承認が得られていない場合は本ステップ以降を実行しない。**

### ステップ 2: ローカルチェックの実行

以下のコマンドを実行し、全て PASS であることを確認してから PR を作成する。

```bash
# typecheck
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# build
mise exec -- pnpm build
```

**ローカルチェック結果テンプレート**

```
pnpm typecheck: [ ] PASS  /  [ ] FAIL（エラー内容: ）
pnpm lint:      [ ] PASS  /  [ ] FAIL（エラー内容: ）
pnpm build:     [ ] PASS  /  [ ] FAIL（エラー内容: ）
```

> 一つでも FAIL の場合は問題を修正してから先に進む。

### ステップ 3: 変更ファイルの確認

```bash
git status
git diff --stat main
```

### ステップ 4: コミットの作成

```bash
git add \
  docs/ut-03-sheets-api-auth/index.md \
  docs/ut-03-sheets-api-auth/artifacts.json \
  docs/ut-03-sheets-api-auth/phase-*.md \
  docs/ut-03-sheets-api-auth/outputs/ \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md

git commit -m "docs(ut-03): Sheets API 認証方式設定タスク仕様書追加"
```

### ステップ 5: remote への push

```bash
# ブランチ名は実際の feature ブランチ名に合わせる
git push -u origin feature/ut-03-sheets-api-auth
```

### ステップ 6: PR の作成

```bash
gh pr create \
  --title "docs(ut-03): Sheets API 認証方式設定タスク仕様書追加" \
  --body "$(cat <<'EOF'
## Summary

- UT-03 (Sheets API 認証方式設定) の Phase 1〜13 タスク仕様書を追加
- `packages/integrations/src/sheets-auth.ts` の実装ガイド・smoke テスト手順・ドキュメント更新手順を整備
- `deployment-secrets-management.md` / `environment-variables.md` に `GOOGLE_SERVICE_ACCOUNT_JSON` の管理方針を追記

## 変更ファイル

### 新規作成
- `docs/ut-03-sheets-api-auth/index.md`
- `docs/ut-03-sheets-api-auth/artifacts.json`
- `docs/ut-03-sheets-api-auth/phase-01.md`〜`phase-13.md`
- `docs/ut-03-sheets-api-auth/outputs/`

### 更新
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## Test plan

- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm build` PASS
- [ ] Phase 10 の GO/NO-GO チェックリストを確認
- [ ] Phase 11 の smoke テストエビデンスを確認
- [ ] Phase 12 の same-wave sync（UT-01, UT-02, UT-09）を確認

## 関連 Issue

Closes #5

EOF
)"
```

## PR チェックリストテンプレート

`outputs/phase-13/pr-checklist.md` に以下の内容を記録する。

```markdown
# PR チェックリスト

## 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | docs(ut-03): Sheets API 認証方式設定タスク仕様書追加 |
| 関連 Issue | #5 |
| ベースブランチ | dev |
| 作成日 | YYYY-MM-DD |

## ローカルチェック結果

- pnpm typecheck: [ ] PASS / [ ] FAIL
- pnpm lint: [ ] PASS / [ ] FAIL
- pnpm build: [ ] PASS / [ ] FAIL

## 変更ファイル一覧

### 新規作成
- docs/ut-03-sheets-api-auth/index.md
- docs/ut-03-sheets-api-auth/artifacts.json
- docs/ut-03-sheets-api-auth/phase-01.md〜phase-13.md
- docs/ut-03-sheets-api-auth/outputs/

### 更新
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md

## PR 作成前の最終確認

- [ ] ユーザーの明示的な承認を得た
- [ ] ローカルチェック（typecheck / lint / build）が全て PASS
- [ ] Phase 10 GO 判定が outputs に記録されている
- [ ] Phase 11 smoke テストエビデンスが outputs に記録されている
- [ ] Phase 12 の 6 種の必須成果物が outputs に配置されている
- [ ] same-wave sync（UT-01, UT-02, UT-09）の整合確認が記録されている
- [ ] PR ボディに関連 Issue (#5) が記載されている
- [ ] シークレット値・秘密鍵がコミット内容に含まれていない

## PR URL

（gh pr create 実行後にここに URL を記載する）
```

## change-summary

### 追加ファイル一覧

`docs/ut-03-sheets-api-auth/` 配下の全ファイル：

| ファイル | 説明 |
| --- | --- |
| `index.md` | タスク全体の正本 index |
| `artifacts.json` | Phase 1〜13 の成果物レジストリ |
| `phase-01.md`〜`phase-13.md` | Phase 別仕様書 |
| `outputs/phase-10/.gitkeep` | Phase 10 成果物ディレクトリ |
| `outputs/phase-11/.gitkeep` | Phase 11 成果物ディレクトリ |
| `outputs/phase-12/.gitkeep` | Phase 12 成果物ディレクトリ |
| `outputs/phase-13/.gitkeep` | Phase 13 成果物ディレクトリ |

### PRタイトル案

```
docs(ut-03): Sheets API 認証方式設定タスク仕様書追加
```

## 多角的チェック観点（AIが判断）

- 価値性: PR が GitHub Issue #5 を承認条件に沿ってクローズし、UT-09 の実装開始に必要な仕様書が全て揃っているか
- 実現性: ローカルチェック（typecheck / lint / build）が全て PASS であるか
- 整合性: PR ボディの変更ファイル一覧が実際のコミット内容と一致しているか
- 運用性: PR レビュアーが変更内容を理解するのに十分な説明が PR ボディに記載されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認確認 | 13 | pending | 承認なしに実行禁止 |
| 2 | ローカルチェック実行 | 13 | pending | typecheck / lint / build |
| 3 | 変更ファイル確認 | 13 | pending | git status / git diff |
| 4 | pr-checklist.md 作成 | 13 | pending | outputs/phase-13/pr-checklist.md |
| 5 | git commit 作成 | 13 | pending | チェック PASS 後に実行 |
| 6 | remote push | 13 | pending | feature ブランチを push |
| 7 | gh pr create 実行 | 13 | pending | PR URL を pr-checklist.md に記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-checklist.md | PR 作成チェックリスト・実行結果 |
| PR | GitHub Pull Request | 変更内容のレビュー依頼 |
| メタ | artifacts.json | Phase 状態の更新・タスク complete 記録 |

## 完了条件

- [ ] ユーザーの明示的な承認が得られている
- [ ] ローカルチェック（typecheck / lint / build）が全て PASS
- [ ] `outputs/phase-13/pr-checklist.md` が作成され、全チェックボックスが確認済みである
- [ ] PR が GitHub 上に作成され、URL が `pr-checklist.md` に記録されている
- [ ] `artifacts.json` の全 Phase が `completed` に更新されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（ローカルチェック FAIL・push 失敗・PR 作成失敗）も確認済み
- artifacts.json の全 Phase を completed に更新
- **ユーザー承認なしに実行していないことを確認**

## 次 Phase

- 次: なし（Phase 13 が最終 Phase）
- 引き継ぎ事項: PR がマージされたら artifacts.json を `merged` に更新し、GitHub Issue #5 をクローズする
- ブロック条件: ユーザーの明示的な承認がなければ実行しない。ローカルチェック FAIL の場合は修正後に再実行する
