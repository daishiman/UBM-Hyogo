# Phase 13: PR 作成 - タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 13 |
| Phase名 | PR 作成 |
| 前提Phase | Phase 12 |
| 後続Phase | なし（最終 Phase） |
| ステータス | pending_user_approval |
| 作成日 | 2026-05-24 |
| 機能名 | issue-838-schema-alias-rollback-notification |
| 実装区分 | 実装仕様書 |

---

## 重要: ユーザー明示承認後のみ実行

**本 Phase のコマンド実行（commit / push / `gh pr create`）は、ユーザーが「PR を作成してください」「PR 出して」等で明示的に承認した場合のみ行います。**

Phase 13 仕様書を Read した時点では何も実行しません。承認を受けてから Step 0 以降を実行してください。

---

## 目的

Phase 1-12 で完成した rollback 通知実装を `dev` ブランチへの PR として提出し、CI gate をパスさせる。PR 本文は `outputs/phase-12/implementation-guide.md` の内容を反映し、NON_VISUAL のためスクリーンショットセクションは含めない。

---

## 基本方針

| 項目 | 値 |
| --- | --- |
| PR base ブランチ | `dev`（既定。production リリース時のみ `main`） |
| 作業ブランチ | `docs/issue-838-schema-alias-rollback-notification` |
| PR タイトル形式 | `feat(api): schema alias rollback 発生時の best-effort 運用通知 (#838)` |
| スクリーンショット | 不要（NON_VISUAL） |

---

## 実行タスク

### Step 0: 前提確認

**実行手順**:
1. Phase 12 の全成果物が存在することを確認する

```bash
ls outputs/phase-12/
# 期待: implementation-guide.md / system-spec-update-log.md / documentation-changelog.md
#       unassigned-task-report.md / skill-feedback-report.md
```

2. 作業ブランチを確認する

```bash
git branch --show-current
# 期待: docs/issue-838-schema-alias-rollback-notification
```

3. `git status --porcelain` で未コミット変更の有無を確認する

---

### Step 1: dev ブランチ同期

**実行手順**:
1. リモート dev を fetch して最新化する

```bash
git fetch origin dev
```

2. ローカル dev を fast-forward 同期する

```bash
git checkout dev
git merge --ff-only origin/dev
git checkout docs/issue-838-schema-alias-rollback-notification
```

3. 作業ブランチに dev をマージする

```bash
git merge dev
```

4. コンフリクトが発生した場合は `CLAUDE.md` の「コンフリクト解消の既定方針」に従って解消する

| 種別 | 方針 |
| --- | --- |
| `package.json` / `tsconfig` | dev 側を採用し、作業ブランチの必要差分を再適用 |
| `pnpm-lock.yaml` | `pnpm install --force` 結果を正とする |
| ソースコード | 両側の変更意図を保持し統合 |
| 自動生成物 | 再生成結果を正とする |
| ドキュメント | dev 側 → 作業ブランチ側の順で意味結合、重複除去 |

5. コンフリクト解消後: `git add` → `git commit`

---

### Step 2: 未コミット変更の確認とコミット

**実行手順**:
1. `git status --porcelain` で未コミット変更を確認する
2. 残っている変更は内容を確認し、実装スコープに含まれる変更であることを確かめてからコミットする

```bash
git add apps/api/src/workflows/schemaAliasRollbackNotification.ts
git add apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts
git add apps/api/src/routes/admin/schema.ts
git add apps/api/src/routes/admin/_shared.ts    # 変更がある場合
git add apps/api/wrangler.toml                  # OPS_NOTIFICATION_EMAIL 追記がある場合
git add apps/api/.dev.vars.example              # op 参照追記がある場合
git add docs/30-workflows/issue-838-schema-alias-rollback-notification/
# （その他 Task 2 Step 1-A〜Step 2 で更新したドキュメント類）
```

3. **注意**: `.env` の実値・API Token・secret 値を含むファイルをコミットしない

---

### Step 3: 品質検証（4 コマンド）

**実行手順**:

以下を順番に実行する。いずれかが失敗した場合は最大 3 回まで自動修復を試み、修復差分をコミットしてから次のコマンドへ進む。

```bash
# 1. 依存関係インストール
mise exec -- pnpm install --force

# 2. 型チェック
mise exec -- pnpm typecheck

# 3. リント
mise exec -- pnpm lint

# 4. PR 事前検証ゲート
bash scripts/verify-pr-ready.sh
```

#### 失敗時の自動修復指針

| コマンド | 失敗原因 | 修復方法 |
| --- | --- | --- |
| `pnpm install --force` | lockfile 不整合 | lockfile を削除して再生成 |
| `pnpm typecheck` | unused import / null 許容 / 型注釈漏れ / export 不整合 | 最小差分で型修正 |
| `pnpm lint` | `pnpm lint --fix` を先に試し、残る違反を手修正 | — |
| `bash scripts/verify-pr-ready.sh` | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照し、`gate-metadata:validate` → `verify:phase12-compliance` → `indexes:rebuild` drift の順で原因特定 | — |

> テストコード実行（`pnpm test`）はユーザーが明示しない限り本フローでは行わない（Phase 9 で完了済み）。

---

### Step 4: PR 対象ファイル一覧の取得

**実行手順**:

```bash
git diff dev...HEAD --name-only
```

出力された一覧を PR 本文の「変更ファイル」セクションに使用する。漏れがある場合は Step 2 へ戻り `git add` し直す。

---

### Step 5: PR 作成

**実行手順**:

```bash
gh pr create --base dev --title "feat(api): schema alias rollback 発生時の best-effort 運用通知 (#838)" \
  --body "$(cat <<'EOF'
## 概要

issue #838「schema alias rollback 発生時の通知」を実装しました。

schema alias の rollback 操作（POST /admin/schema/aliases/:aliasId/rollback）が成功した際に、運用者へ best-effort 通知（Slack 優先 → mail fallback）を送り、通知結果を `audit_log` に記録します。

## 主な変更内容

- **新規**: `apps/api/src/workflows/schemaAliasRollbackNotification.ts`
  - `dispatchSchemaAliasRollbackNotification()`: Slack 優先 / mail fallback の best-effort 通知 dispatch
  - `buildRollbackNotificationPayload()`: PII redaction 済みの通知 payload 構築
  - `redactRollbackActor()`: actor email のマスク（`admin:redacted` 形式）
  - `recordRollbackNotificationAudit()`: `schema_alias.rollback_notification` audit entry 記録
- **新規**: `apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts`（unit / contract テスト）
- **編集**: `apps/api/src/routes/admin/schema.ts`（rollback route に best-effort 通知発火を追加）
- **編集**: `apps/api/wrangler.toml`（`OPS_NOTIFICATION_EMAIL` vars 追加）
- **編集**: `apps/api/.dev.vars.example`（op 参照追記）

## 受入条件の達成状況

| AC | 内容 | 達成 |
| --- | --- | --- |
| AC-1 | Slack 優先 / mail fallback で運用通知 | ✓ |
| AC-2 | payload に PII/secret 非包含（actorRef は `admin:redacted` 形式） | ✓ |
| AC-3 | notification failure が rollback(200) を壊さない（二重隔離） | ✓ |
| AC-4 | status が `schema_alias.rollback_notification` audit entry に併記 | ✓ |
| AC-5 | channel 未設定で `skipped` 記録、エラーにしない | ✓ |
| AC-6 | staging smoke evidence が tracked file として残る | ✓ |
| AC-7 | 既存テスト回帰なし | ✓ |

## 設計判断

- **best-effort auxiliary 通知パターン採用**（issue #588 踏襲）: rollback は admin 操作であり通知対象は運用者。member 限定スキーマの `notification_outbox` には乗せない。
- **二重 failure isolation**: `dispatchSchemaAliasRollbackNotification` が内部で全例外を catch し必ず結果を返す + route 層でも `try/catch` で囲む。
- **migration 不要**: `audit_log.action` に CHECK 制約がないため既存スキーマで充足。
- **不採用案**: `notification_outbox` の generic 化（member 限定スキーマへの破壊的変更が必要なため不採用。Phase 2 参照）。

## 証跡

- 自動テスト: Phase 9 QA で typecheck / lint / vitest all green 確認済み
- staging smoke: `outputs/phase-11/manual-test-result.md` 参照（NON_VISUAL のためスクリーンショットなし）
- 実装ガイド: `outputs/phase-12/implementation-guide.md` 参照

## 関連 issue

- Closes #838
- Refs #778（rollback 本体・完了済み）
- Refs #836（集計再実行・別 issue）
EOF
)"
```

> **NON_VISUAL のため PR 本文にスクリーンショットセクションを含めない。**

---

### Step 6: CI 確認

**実行手順**:
1. PR 作成後、GitHub Actions の CI status を確認する

```bash
gh pr checks
```

2. required status check が fail している場合は原因を調査し、修正コミットを push して解消する
3. CI が全 green になったことを確認する

---

### Step 7: 最終レポート

PR 作成完了後、以下の情報を 1 回だけ報告する:

| 項目 | 内容 |
| --- | --- |
| PR URL | `gh pr view --web` で取得した URL |
| 採用ブランチ | `docs/issue-838-schema-alias-rollback-notification` → base: `dev` |
| 自動修復の実施有無 | typecheck / lint / verify-pr-ready.sh の失敗と修復内容 |
| コンフリクト解消の有無 | dev merge 時のコンフリクト内容と解消方法 |
| 残課題 | `outputs/phase-12/unassigned-task-report.md` の U-1〜U-3（別 issue 管理） |

---

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| CLAUDE.md PR 作成方針 | `CLAUDE.md`（PR作成の完全自律フロー） | base ブランチ / コンフリクト解消方針 |
| diff-to-pr コマンド仕様 | `.claude/commands/ai/diff-to-pr.md` | PR 本文フォーマット |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | PR 本文の技術詳細 |
| 未タスク検出レポート | `outputs/phase-12/unassigned-task-report.md` | 残課題の根拠 |
| PR 事前検証チェックリスト | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` | `verify-pr-ready.sh` 失敗時の切り分け |

---

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| PR | GitHub PR（base: `dev`） | `Closes #838` を含む PR 本文。受入条件達成表・設計判断・証跡を反映 |
| PR 対象ファイル一覧 | `git diff dev...HEAD --name-only` の出力 | PR に含めるファイルの漏れなし確認 |
| 最終レポート | 本ターンのチャット出力 | PR URL・採用ブランチ・自動修復・コンフリクト解消・残課題（U-1〜U-3） |

> 本 Phase はユーザー明示承認後のみ実行する。承認前は手順記載に留める。

---

## 完了条件

- [ ] Phase 12 全成果物の存在を確認した
- [ ] `git fetch origin dev` → dev fast-forward → 作業ブランチへマージ を実施した
- [ ] コンフリクトがあれば解消してコミットした
- [ ] `pnpm install --force` が成功した
- [ ] `pnpm typecheck` が green（最大 3 回修復）
- [ ] `pnpm lint` が green（最大 3 回修復）
- [ ] `bash scripts/verify-pr-ready.sh` が green（最大 3 回修復）
- [ ] `git status --porcelain` が空（全変更コミット済み）
- [ ] `git diff dev...HEAD --name-only` で PR 対象ファイルを確認した
- [ ] `gh pr create --base dev` で PR を作成した
- [ ] PR 本文にスクリーンショットセクションが含まれていない（NON_VISUAL）
- [ ] CI status を確認した
- [ ] 最終レポートを 1 回だけ報告した

---

## タスク100%実行確認【必須】

- [ ] 本Phase内の全タスクを100%実行完了
- [ ] 各タスクを100%完了し、完了を明記
- [ ] 成果物が全て生成されていることを確認

---

## 次Phase

本 Phase が最終 Phase です。PR 作成完了をもって issue-838-schema-alias-rollback-notification タスクを完了とします。
