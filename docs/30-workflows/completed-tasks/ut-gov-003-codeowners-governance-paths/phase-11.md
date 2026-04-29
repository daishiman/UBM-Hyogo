# Phase 11: 手動 smoke test（NON_VISUAL / governance）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003-codeowners-governance-paths) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（CODEOWNERS suggested reviewer 観察 + errors=[] 検証） |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| タスク種別 | **docs-only / spec_created / NON_VISUAL / infrastructure_governance** |
| GitHub Issue | #146 |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- **taskType: docs-only / spec_created**
- 判定理由:
  - 本タスクの成果物は `.github/CODEOWNERS` および `doc/` → `docs/` 表記揺れ修正であり、UI / Renderer / 画面遷移の差分は発生しない。
  - GitHub UI 上の suggested reviewer 表示は「観察対象」だが、UBM-Hyogo Web アプリの UI ではないため screenshot による視覚証跡の対象外（UI 仕様 / state diff の検証ではない）。
  - 検証は (a) `gh api repos/:owner/:repo/codeowners/errors` の JSON 出力、(b) test PR で各 governance path に 1 ファイル touch した際の suggested reviewer 出力ログ、(c) 本仕様書内リンク健全性チェックの 3 系統で代替する。
- **`outputs/phase-11/screenshots/` ディレクトリは作成しない**（NON_VISUAL のため `.gitkeep` 含め一切作らない）。
- 本 Phase 仕様書では「smoke test を Phase 5 以降の実装 PR で実走する手順を仕様レベル固定」する。仕様書整備 PR（本 PR）の段階では実 CODEOWNERS 適用前のため smoke test は **NOT EXECUTED** ステータスで予約する。

## 必須 outputs（NON_VISUAL Phase 11 代替証跡 3 点）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の CODEOWNERS 適用結果 |
| `outputs/phase-11/manual-smoke-log.md` | test PR による governance path × suggested reviewer 観察コマンド系列と `gh api .../codeowners/errors` 実行手順（status: NOT EXECUTED） |
| `outputs/phase-11/link-checklist.md` | index.md / phase-NN.md / outputs / 原典スペック / CLAUDE.md / `task-github-governance-branch-protection` 草案 間の参照健全性チェック |

## 目的

Phase 1〜10 で固定された CODEOWNERS 仕様（global fallback を冒頭、governance path を後段に置く最終マッチ勝ち順序）に対し、NON_VISUAL 代替 evidence プレイブックを適用して spec walkthrough を実施し、以下を確定する。

1. 仕様書の自己完結性（前提 / AC-1〜AC-6 / 成果物パス）が満たされている
2. test PR による governance path 単位 suggested reviewer 観察手順が manual-smoke-log.md で再現可能な形に固定されている
3. `gh api repos/:owner/:repo/codeowners/errors` 実行手順と「期待値: errors: []」が明示されている
4. 全リンク（index.md ↔ phase-NN.md ↔ outputs ↔ 原典スペック ↔ CLAUDE.md ↔ UT-GOV-001/002/004 関連タスク）が健全である
5. NON_VISUAL の限界（GitHub UI の suggested reviewer 表示時刻ずれ / team handle の権限要件 / glob 仕様の非互換性）を明示し、保証できない範囲を Phase 12 unassigned-task-detection.md へ申し送る

## 実行タスク

1. NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）を `outputs/phase-11/main.md` に作成する（完了条件: 4 階層が漏れなく記述）。
2. test PR による 5 governance path × suggested reviewer 観察手順を `outputs/phase-11/manual-smoke-log.md` に NOT EXECUTED ステータスで列挙する（完了条件: `docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**` の 5 path × 1 ファイル touch を網羅）。
3. `gh api repos/:owner/:repo/codeowners/errors` の実行手順と「errors: [] 期待値」を `manual-smoke-log.md` に記録する（完了条件: コマンドラインと期待 JSON が記載）。
4. spec walkthrough を実施し、phase-01〜phase-13 / index.md / artifacts.json / outputs/* / 原典スペック / CLAUDE.md / UT-GOV-001 草案 間の参照リンクを `outputs/phase-11/link-checklist.md` に記録する（完了条件: 全リンクが OK / Broken で表記）。
5. 「smoke test はPhase 13 PR smokeで実走」を `main.md` 冒頭に明記する（完了条件: NOT EXECUTED ラベル明示）。
6. 保証できない範囲（GitHub UI 表示反映ラグ / team handle 権限不足時の silently skip / glob 仕様の `**` 非互換ケース / `require_code_owner_reviews` 非有効化下では強制力ゼロ）を Phase 12 申し送り候補として列挙する（完了条件: 最低 3 項目）。

## NON_VISUAL 代替 evidence の 4 階層（CODEOWNERS 適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 構文** | `.github/CODEOWNERS` の syntax を GitHub 公式 docs（"About code owners"）の grammar に対し読み取り検証（path / owner spec の token-level 整合） | 構文の「型」 | 実リポジトリ上での owner 解決（team 権限 / user 存在） |
| **L2: 順序 / boundary** | 「最終マッチ勝ち」仕様に対し、global fallback (`* @daishiman`) が冒頭 1 行のみであること、governance path はその後段に配置されていることを spec レベルで boundary 検証 | order-sensitivity の静的整合 | 実 PR でのマッチ結果（後段に意図せず広域 glob を追加した際の事故） |
| **L3: API 検証** | `gh api repos/:owner/:repo/codeowners/errors` を仕様レベルで固定（実走はPhase 13 PR smoke で）、期待値 `errors: []` を明示 | GitHub 公式 validator による syntax / 権限エラー検出の手順 | API 実行時点の owner（team / user）状態の時刻依存性 |
| **L4: 意図的 violation snippet** | わざと存在しない user (`@nonexistent-bot-handle-xyz`) を governance path に書いた fixture 例を spec walkthrough で red 確認の手順として提示 | 「赤がちゃんと赤になる」（API errors に存在しない user として検出される）ことの設計妥当性 | （L4 自体は green 保証ではない） |

## test PR による governance path 観察コマンド系列（NOT EXECUTED）

> 本 Phase では実走しない。Phase 13 PR smokeの完了後に別 PR / 観察ジョブで走らせる前提。
> ここで列挙するのはコマンドの「仕様レベル固定」のみであり、実行ログは取得しない。

```bash
# (1) test branch で各 governance path に空コミット相当の touch を 1 ファイルずつ実施
git checkout -b chore/codeowners-smoke
echo "<!-- smoke -->" >> docs/30-workflows/ut-gov-003-codeowners-governance-paths/index.md
echo "<!-- smoke -->" >> .claude/skills/task-specification-creator/references/artifact-naming-conventions.md
echo "# smoke" >> .github/workflows/verify-indexes.yml
echo "// smoke" >> apps/api/src/index.ts
echo "// smoke" >> apps/web/app/layout.tsx
git add -- <touched-files>
git commit -m "chore: codeowners smoke (DO NOT MERGE)"
git push -u origin chore/codeowners-smoke

# (2) PR を draft で作成し、suggested reviewer 表示を観察
gh pr create --draft --base dev \
  --title "chore: codeowners smoke (DO NOT MERGE)" \
  --body "smoke for UT-GOV-003. close without merge."

# (3) suggested reviewer 表示観察（GitHub UI 上で 5 path 全てに対し @daishiman が表示されることを確認）
gh pr view --json reviewRequests,reviewDecision

# (4) GitHub 公式 validator による errors=[] 確認
gh api repos/:owner/:repo/codeowners/errors
# 期待値: { "errors": [] }

# (5) smoke 終了後、PR を close（マージ禁止）し branch を削除
gh pr close --delete-branch
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック（AC / 苦戦箇所） |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-02.md（存在すれば） | governance path glob の正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | L1〜L4 プレイブックの正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL Phase 11 必須 3 outputs |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-11.md | NON_VISUAL Phase 11 構造例 |
| 参考 | GitHub Docs "About code owners" | CODEOWNERS の最終マッチ勝ち仕様 / team 権限要件 |
| 参考 | GitHub REST API `GET /repos/{owner}/{repo}/codeowners/errors` | L3 検証の正本 |

## 実行手順

1. NON_VISUAL 代替 evidence の 4 階層を `outputs/phase-11/main.md` へ記録する。
2. test PR による governance path × suggested reviewer 観察コマンド系列と `gh api .../codeowners/errors` 手順を `manual-smoke-log.md` に NOT EXECUTED として記録する。
3. `link-checklist.md` で index / phase / outputs / 原典 / CLAUDE.md / 関連 UT-GOV タスク間の参照を確認する。

## 統合テスト連携

本 Phase は仕様書整備のため smoke を実走しない。Phase 13 PR smokeで同コマンド系列を実走し、errors=[] と suggested reviewer 表示を確認する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| walkthrough | outputs/phase-11/main.md | NON_VISUAL 代替 evidence の記録 |
| smoke log | outputs/phase-11/manual-smoke-log.md | test PR + `gh api .../codeowners/errors` の NOT EXECUTED コマンド系列 |
| link check | outputs/phase-11/link-checklist.md | 仕様書間 / 関連タスク間リンク確認 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）が `main.md` に記載
- [ ] 5 governance path × suggested reviewer 観察手順が `manual-smoke-log.md` に NOT EXECUTED ステータスで網羅
- [ ] `gh api repos/:owner/:repo/codeowners/errors` の実行手順と期待 JSON (`errors: []`) が `manual-smoke-log.md` に記載
- [ ] spec walkthrough のリンク健全性が `link-checklist.md` に OK/Broken で記録
- [ ] 「smoke test はPhase 13 PR smokeで実走」が `main.md` 冒頭で明記
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙

## 検証コマンド

```bash
# 必須 3 ファイルの存在
ls docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/
# main.md / manual-smoke-log.md / link-checklist.md の 3 件のみ

# screenshots/ が存在しないこと
test ! -d docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/screenshots && echo OK

# 「NOT EXECUTED」が manual-smoke-log.md に明記
rg -n "NOT EXECUTED" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/manual-smoke-log.md

# 5 governance path がすべて smoke コマンド系列に登場
rg -n "docs/30-workflows|\.claude/skills/.*references|\.github/workflows|apps/api|apps/web" \
  docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/manual-smoke-log.md
```

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は spec walkthrough。manual-smoke-log.md には必ず `NOT EXECUTED` ステータスを残す。
3. **suggested reviewer 表示は GitHub UI に時刻依存**: `gh pr view --json reviewRequests` 取得時刻と CODEOWNERS 反映タイミングがずれる場合があり、L1〜L3 では「手順が固定されていること」までしか保証できない。
4. **team handle の権限要件**: 本タスクは個人 handle (`@daishiman`) に寄せる方針。将来 team handle 採用時は GitHub 組織側で対象 team が当該リポジトリに **write 以上** の権限を持つことを事前確認すること（権限不足だと silently skip）。
5. **L4（意図的 violation）の省略禁止**: 存在しない user 指定が `gh api .../codeowners/errors` で正しく error として返ることを spec walkthrough 上で必ず確認する。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - L3/L4 で発見した「保証できない範囲」を `unassigned-task-detection.md` へ転記
  - test PR コマンド系列を `implementation-guide.md` Part 2 に再掲
  - link-checklist.md の Broken 項目があれば Phase 12 で同 sprint 修正
- ブロック条件:
  - `screenshots/` ディレクトリが誤って作成されている
  - manual-smoke-log.md が「実走済」と誤記している
  - link-checklist.md が空（spec walkthrough 未実施）
