# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR 作成 |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | pending |
| GitHub Issue | #10（CLOSED — 設計成果物の集約として PR を作成） |
| タスク種別 | design / non_visual / spec_created |

---

## 目的

Phase 1〜12 で作成・更新した全成果物（**設計書のみ・コード変更なし**）をまとめ、GitHub Pull Request を作成して
レビュー可能な状態にする。

> ⚠️ **承認ゲート: ユーザーの明示的な承認なしに本 Phase を実行してはならない。**
>
> Phase 12 完了後、必ずユーザーに「Phase 13（PR 作成）を実行してよいですか？」と確認し、
> 明示的な「OK」「進めてください」等の承認を得てから以下の手順を実行する。
> ユーザーの応答を待たずに自律的に実行することは厳禁である。

---

## 実行タスク

- [ ] **ユーザー承認の確認**（承認なしに実行しない）
- [ ] ローカルチェックとして doc 範囲の link 検証・JSON validity を実行する
- [ ] 変更ファイルの一覧を確認する（**設計ドキュメントのみ・コード/テスト変更ゼロ**であることを確認）
- [ ] PR チェックリストを `outputs/phase-13/pr-checklist.md` として作成する
- [ ] git commit を作成する
- [ ] feature ブランチを remote に push する
- [ ] `gh pr create` で Pull Request を作成する（base = main）
- [ ] PR URL を pr-checklist.md に記録する

---

## 設計タスク特有の CI 影響範囲

| 範囲 | 影響有無 | 備考 |
| --- | --- | --- |
| `apps/web` / `apps/api` のコード | 影響なし | 本タスクは設計成果物のみ |
| `packages/*` | 影響なし | 同上 |
| typecheck / lint / build / test | 影響なし | コード変更なしのため CI で skip 同等 |
| `docs/30-workflows/ut-08-monitoring-alert-design/` | **追加** | 本 PR の主要変更 |
| `.claude/skills/*/LOGS.md` / `topic-map.md` | **更新**（Phase 12 で追記） | global skill sync |
| `.agents/skills/*` | **mirror parity 同期**（差分があれば） | rsync 結果記録 |

> CI は doc 限定の変更を想定。CI が typecheck / lint をスキップしない設定の場合は、設計タスクであっても PASS することを確認する（doc のみのため通常 PASS）。

---

## 実行手順

### ステップ 1: 承認の確認

> **ユーザーの明示的な承認を確認する。承認が得られていない場合は本ステップ以降を実行しない。**

### ステップ 2: ローカルチェック

```bash
# 設計ドキュメントのみのため typecheck / lint は変化なしを確認
mise exec -- pnpm typecheck   # 期待: PASS（変化なし）
mise exec -- pnpm lint        # 期待: PASS（変化なし）

# JSON validity（artifacts.json）
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json','utf8'))" \
  && echo "artifacts.json: PASS"
```

ローカルチェック結果テンプレート:

```
pnpm typecheck:    [ ] PASS / [ ] FAIL
pnpm lint:         [ ] PASS / [ ] FAIL
artifacts.json:    [ ] PASS / [ ] FAIL
mirror parity:     [ ] PASS / [ ] FAIL
```

### ステップ 3: 変更ファイル確認

```bash
git status
git diff --stat main
```

確認:

- 全変更が `docs/30-workflows/ut-08-monitoring-alert-design/` および `.claude/skills/`（LOGS.md / topic-map.md）配下に閉じている
- `apps/` / `packages/` 配下のコード変更が**含まれていない**

### ステップ 4: コミットの作成

コミット粒度の方針：**1 PR = 1 コミット（または論理的に分けるなら 2 コミット）** とする。

- 案 1（推奨）：単一コミット
- 案 2：「workflow 追加」と「global skill sync」を別コミットに分割

```bash
git add \
  docs/30-workflows/ut-08-monitoring-alert-design/ \
  .claude/skills/task-specification-creator/LOGS.md \
  .claude/skills/aiworkflow-requirements/LOGS.md \
  .claude/skills/task-specification-creator/references/resource-map.md \
  .claude/skills/aiworkflow-requirements/indexes/topic-map.md

git commit -m "$(cat <<'EOF'
docs(ut-08): モニタリング/アラート設計タスク仕様書追加

UT-08 (モニタリング/アラート設計) の Phase 1〜13 タスク仕様書および
監視設計成果物（メトリクス・閾値・通知・WAE 計装計画・runbook 差分）を追加。
05a 既存 runbook は上書きせず差分追記方針として記録（不変条件 1 遵守）。

Refs #10
EOF
)"
```

### ステップ 5: remote への push

```bash
git push -u origin feat/wt-3
```

### ステップ 6: PR 作成

```bash
gh pr create --base main --title "docs(ut-08): モニタリング/アラート設計タスク仕様書追加" --body "$(cat <<'EOF'
## Summary

- UT-08 (モニタリング/アラート設計) の Phase 1〜13 タスク仕様書を追加
- 監視設計成果物（メトリクス・閾値・通知・WAE 計装計画・外部監視評価・failure 検知・Secret 追加・05a runbook 差分計画）を `outputs/phase-02/` 配下に整理
- `spec_created` 設計タスクのため Phase 11 は NON_VISUAL（screenshot 不要）として処理
- `.claude/skills/*/LOGS.md` と `topic-map.md` を Phase 12 Step 1-A 同期で更新

## 影響範囲

- 追加: `docs/30-workflows/ut-08-monitoring-alert-design/`
- 更新: `.claude/skills/task-specification-creator/LOGS.md`、`.claude/skills/aiworkflow-requirements/LOGS.md`、両 skill の `topic-map.md`
- コード変更: **なし**（設計タスク）

## Test plan

- [ ] `pnpm typecheck` PASS（変化なし）
- [ ] `pnpm lint` PASS（変化なし）
- [ ] `artifacts.json` JSON parse PASS
- [ ] Phase 10 の GO 判定（`outputs/phase-10/go-nogo-decision.md`）を確認
- [ ] Phase 11 の NON_VISUAL smoke ログ（`outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md`）を確認
- [ ] Phase 12 same-wave sync（UT-09 / UT-07 / 05a）の整合確認

## 不変条件チェック

- [ ] 05a 既存ファイルを上書きしていない（不変条件 1）
- [ ] 有料 SaaS 前提の設計が混入していない（不変条件 2）
- [ ] WARNING 中心の段階運用方針を維持（不変条件 3）
- [ ] 1Password Environments で Secret 管理（不変条件 4）
- [ ] 計装コードの実装は Wave 2 へ委譲（不変条件 5）

## 関連 Issue

Refs #10
EOF
)"
```

---

## PR チェックリストテンプレート（`outputs/phase-13/pr-checklist.md`）

```markdown
# PR チェックリスト — UT-08

## 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | docs(ut-08): モニタリング/アラート設計タスク仕様書追加 |
| 関連 Issue | #10（CLOSED — Refs として参照） |
| ベースブランチ | main |
| 作成日 | YYYY-MM-DD |

## ローカルチェック結果

- pnpm typecheck:  [ ] PASS / [ ] FAIL
- pnpm lint:       [ ] PASS / [ ] FAIL
- artifacts.json:  [ ] PASS / [ ] FAIL
- mirror parity:   [ ] PASS / [ ] FAIL

## 変更ファイル一覧

### 新規作成
- docs/30-workflows/ut-08-monitoring-alert-design/index.md
- docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json
- docs/30-workflows/ut-08-monitoring-alert-design/phase-01.md 〜 phase-13.md
- docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-01〜phase-12 配下成果物

### 更新（global skill sync）
- .claude/skills/task-specification-creator/LOGS.md
- .claude/skills/aiworkflow-requirements/LOGS.md
- .claude/skills/task-specification-creator/references/resource-map.md
- .claude/skills/aiworkflow-requirements/indexes/topic-map.md

## PR 作成前の最終確認

- [ ] ユーザーの明示的な承認を得た
- [ ] ローカルチェック全 PASS
- [ ] Phase 10 GO 判定が outputs に記録されている
- [ ] Phase 11 NON_VISUAL smoke ログ 3 点（main / manual-smoke-log / link-checklist）が outputs に記録されている
- [ ] Phase 12 の 6 種の必須成果物が outputs に配置されている
- [ ] same-wave sync（UT-09 / UT-07 / 05a）の整合確認が記録されている
- [ ] PR ボディに関連 Issue（#10）が記載されている
- [ ] シークレット値・秘密鍵がコミット内容に含まれていない
- [ ] コード変更がゼロであることを確認した（設計タスク）
- [ ] 不変条件 1〜5 を逸脱していない

## PR URL

（gh pr create 実行後にここに URL を記載する）
```

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | ユーザー承認確認 | 13 | pending |
| 2 | ローカルチェック実行 | 13 | pending |
| 3 | 変更ファイル確認（コード変更ゼロ確認含む） | 13 | pending |
| 4 | pr-checklist.md 作成 | 13 | pending |
| 5 | git commit 作成 | 13 | pending |
| 6 | remote push | 13 | pending |
| 7 | gh pr create 実行 | 13 | pending |
| 8 | PR URL 記録 | 13 | pending |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | タスク全体概要・GitHub Issue #10 |
| 必須 | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧 |
| 必須 | outputs/phase-10/go-nogo-decision.md | GO 判定の根拠 |
| 必須 | outputs/phase-11/main.md | NON_VISUAL smoke 結果 |
| 参考 | CLAUDE.md | ブランチ戦略（feature → main） |
| 参考 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビューゲート基準 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-checklist.md | PR 作成チェックリスト・実行結果・PR URL |
| ドキュメント | outputs/phase-13/local-check-result.md | PR 前ローカルチェック結果 |
| ドキュメント | outputs/phase-13/change-summary.md | PR 本文へ転記する変更サマリー |
| PR | GitHub Pull Request | レビュー依頼 |
| メタ | artifacts.json | phase-13 を completed に更新・タスク全体 complete |

---

## 完了条件

- [ ] ユーザーの明示的な承認が得られている
- [ ] ローカルチェック（typecheck / lint / artifacts.json validity）が全 PASS
- [ ] `outputs/phase-13/pr-checklist.md` が作成され全チェックボックスが確認済み
- [ ] PR が GitHub 上に作成され URL が pr-checklist.md に記録されている
- [ ] artifacts.json の全 Phase が `completed` に更新されている
- [ ] コード変更ゼロ（設計タスク）であることを最終確認している

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] **ユーザー承認なしに実行していないことを確認**
- [ ] artifacts.json の全 Phase を completed に更新

---

## 次 Phase

- 次: なし（Phase 13 が最終 Phase）
- 引き継ぎ事項: PR がマージされたら artifacts.json を `merged` 相当に更新し、Issue #10 のクローズ状態を再確認する。Wave 2 実装タスクは本タスクの設計成果物を入力として開始する
- ブロック条件: ユーザー承認なし / ローカルチェック FAIL / コード変更が混入している場合は実行しない
