# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |
| user_approval_required | true（承認 gate） |

## 目的

local check 結果と change summary を提示し、user 承認後にコミット / push / PR を作成する。

## 承認 gate（三役 gate）

| Gate | 内容 | 通過条件 |
| --- | --- | --- |
| user 承認 | ユーザーへの「PR 作成しますか？」確認 | 明示的な GO 回答 |
| local check PASS | typecheck / lint / build / test 全通過 | `local-check-result.md` |
| evidence parity | Phase 11 / 12 成果物が path どおりに揃っている | `change-summary.md` |

`user_approved` が出るまで commit / push / PR 作成を実行しない。

## 実行フロー

### Step 1: Local check

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
mise exec -- pnpm test --filter @apps/api
```

結果を `outputs/phase-13/local-check-result.md` に保存。

### Step 2: Change summary

- 変更ファイル一覧（`git diff --stat origin/main..HEAD`）
- 新規追加ファイル
- 02a interface 不変の確認
- AC-1〜10 充足状態
- N+1 metric 結果

→ `outputs/phase-13/change-summary.md`

### Step 3: PR template 用意

- `outputs/phase-13/pr-template.md`
- title: `feat(api): MemberProfile.attendance 実データ統合 (UT-02A)`
- body:
  - **Summary**: 02a で stub していた `MemberProfile.attendance` を `meeting_sessions` / `member_attendance` の実データに置換
  - **Refs**: `Refs #107`（`Closes` は使わない。Issue は CLOSED のまま）
  - **AC checklist**: AC-1〜10
  - **Test plan**: 単体 / 統合 / 02a regression / N+1 metric
  - **Evidence**: api-curl + ui-smoke 4 ファイルへの相対 link

### Step 4: user 承認待ち

- user 承認後にのみ以下を実行:
  - `git add` 対象ファイル明示
  - `git commit -m "..." `（HEREDOC + Co-Authored-By）
  - `git push -u origin <branch>`
  - `gh pr create --title ... --body ...`

### Step 5: PR URL を user に返却

- 作成 PR の URL を出力
- CI 結果は `gh pr checks` で確認

## コミット粒度

solo 開発ポリシーに従い、5 単位を目安に分割（必要に応じて 1 コミットに集約可）:

1. branded type module 新設
2. AttendanceRepository 新設 + 単体テスト
3. builder.ts 統合 + 統合テスト
4. 呼び出し側 provider 注入
5. ドキュメント更新（Phase 12 成果物 + legacy stub Canonical Status）

## 不変ルール

- `--no-verify` 禁止
- force-push 禁止
- main / dev への直接 push 禁止（feature ブランチから PR）
- `Closes #107` は使わない（既に CLOSED）。`Refs #107` で参照
- secret / token を commit に含めない（evidence は事前 hygiene check 済み）

## 完了条件

- [ ] local check 全 PASS
- [ ] change summary 完成
- [ ] PR template 完成
- [ ] user 承認取得
- [ ] PR URL 取得済み
- [ ] CI 全 gate 通過確認

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 主成果物 |
| 結果 | outputs/phase-13/local-check-result.md | typecheck / lint / build / test |
| 差分 | outputs/phase-13/change-summary.md | 変更ファイル / AC 充足 |
| Template | outputs/phase-13/pr-template.md | PR title / body 雛形 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 13 を completed
- [ ] root `metadata.workflow_state` を `completed` に更新（Phase 11 evidence 全取得 + Phase 12 sync 完了が前提）

## 次

- なし（最終 Phase）
- 後続観測: 02b の進行 / pagination 候補（F-11）の起票判断

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
