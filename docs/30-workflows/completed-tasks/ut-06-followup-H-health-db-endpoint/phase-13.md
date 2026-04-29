# Phase 13: PR 作成 / ユーザー承認後の実装着手（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後の実装着手 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（本ワークフロー完了 / 後続は別 PR） |
| 状態 | spec_created |
| タスク種別 | implementation / workflow_mode: docs-only / visualEvidence: NON_VISUAL / scope: api_health |
| user_approval_required | **true**（`artifacts.json` の `phases[12].user_approval_required` = true で記録済） |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |

> **PR 作成は user の明示承認後のみ実行する。**
> 本 Phase 仕様書は「PR テンプレ・local check 手順・change-summary・後続実装 PR の起票テンプレ」を **予約** する目的で作成され、`git commit` / `git push` / `gh pr create` は user の明示指示があるまで一切実行しない。
> 本ワークフロー成果物（仕様書・outputs）は Phase 13 完了時点では未コミット状態で待機する。`.claude/skills/task-specification-creator/references/quality-gates.md` の「Phase 13 自動実行禁止」原則に準拠する。

---

## 目的

本 Phase 13 は **本ワークフローの最後のゲート** であり、以下 2 系統の判断を user に提示し、明示承認を得てから初めて実行に移す。

1. **PR 1: 本ワークフロー（Phase 1〜12 仕様書整備）の docs-only PR**
   - 内容: `docs/30-workflows/ut-06-followup-H-health-db-endpoint/` 配下の `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-{01,02,03}/main.md` を 1 PR にまとめる。
   - 本 PR は **docs-only**。`apps/api/src/index.ts` への endpoint 追加・`wrangler.toml` 編集・D1 migration 実行は **一切含まない**。
   - 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害する変更は含まない。
2. **PR 2: 後続 実コード実装 PR の起票方針（Phase 5 ランブックを実走する別 PR）**
   - 別ブランチ（例: `feat/ut-06-fu-h-health-db-impl`）で `apps/api/src/index.ts` への `/health/db` 実装 + Phase 11 smoke S-03 / S-07 の実走を行う。
   - 本 Phase 13 ではこの後続 PR の起票テンプレ（タイトル / description / AC checklist trace / smoke evidence 添付欄）を **仕様レベル** で定義する。
   - 後続 PR の起票・実装着手も **ユーザーの明示承認後** に行う。本 Phase で自動起票しない。

---

## 依存

| 種別 | 対象 | 受け取る前提 |
| --- | --- | --- |
| 上流（必須） | Phase 1〜12 完了 | `artifacts.json.phases[*].status` が `completed`（Phase 1〜3）または `spec_created`（Phase 4〜12）で揃っていること |
| 上流 | Phase 1 真の論点・AC-1〜AC-9 / Phase 2 base case / Phase 3 PASS（with notes）| PR description の AC trace / 採用根拠の出典 |
| 上流 | Phase 12 ドキュメント更新の 5 タスクが `spec_created` 状態で記録 | PR description の「next step」欄の根拠 |
| 関連 | Issue #121（CLOSED） | 本 PR では **CLOSED 状態の参照のみ**（`Refs #121`）。Issue の再 open / 再 close は user 判断 |

---

## ユーザー承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 完了 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜12 spec_created | `artifacts.json` で `spec_created` | 要確認 |
| Phase 12 5 タスクの spec_created 状態 | unassigned-task / implementation-guide / system-spec-update-summary / documentation-changelog / skill-feedback-report が `spec_created` で記録 | 要確認 |
| Issue #121 状態 | CLOSED のままで参照のみ（再 open しない） | 確認済 |
| 不変条件 #5 違反チェック | 本 PR の差分に `apps/web` から D1 を直接叩く形が **含まれていない** こと（docs-only のため当然 0 件） | 要確認 |
| `1Password secret URI` / Secret 値 混入チェック | 0 件（docs に op:// 参照や API token 値が転記されていない） | 要確認 |
| 計画系 wording 残存チェック | `仕様策定のみ` / `実行予定` / `保留として記録` 等の planning wording が outputs に残っていないか | 要確認 |
| user の明示承認（PR 1） | user から「ワークフロー仕様書 PR を作成してよい」の明示指示 | **承認待ち** |
| user の明示承認（PR 2 起票） | user から「後続の実コード実装 PR を起票してよい」の明示指示 | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない。**
> 自動承認・暗黙承認は禁止。user の文言で「PR を作成してよい」「実装 PR を起票してよい」を別個に取得する。

---

## PR 1 仕様（ワークフロー仕様書整備 PR）

### ブランチ / base / head

| 項目 | 値 |
| --- | --- |
| head ブランチ | `docs/ut-06-fu-h-task-spec`（本ワークフロー作業ブランチ） |
| base ブランチ | `main`（docs-only のため main 直接 PR を許容。CLAUDE.md ブランチ戦略 §`feature/* → dev → main` のうち、docs のみの変更は dev 経由を省略可。user が dev 経由を希望した場合は `dev` を base にする） |
| labels | `area:docs` / `task:ut-06-fu-h` / `wave:1` / `governance` |
| linked issue | `Refs #121`（**`Closes #121` ではない**。Issue は CLOSED のままで実装は別 PR で行うため） |

### PR タイトル

```
docs(ut-06-fu-h): apps/api /health/db タスク仕様書整備 (Phase 1-13)
```

### PR description テンプレ

````markdown
## 概要

UT-06 AC-4「API 経由 D1 SELECT smoke」を実行可能にするための、`apps/api` への `GET /health/db` D1 疎通 endpoint 追加に関する **Phase 1〜13 タスク仕様書整備 docs-only PR**。実コード実装（`apps/api/src/index.ts` への endpoint 追加 / Phase 11 smoke 実走）は本 PR には含まず、ユーザー承認後の別 PR（`feat/ut-06-fu-h-health-db-impl`）で実施する。

## 動機

- UT-06 Phase 12 で検出された UNASSIGNED-H / 実行前ブロッカー B-2 を解消可能な状態に昇格させる
- `c.env.DB` 型契約・503 + Retry-After 運用境界・WAF + ヘッダ token defense in depth を仕様レベルで固定し、実装 PR の粒度を最小化する
- Issue #121 は CLOSED のままだが、再 open せず仕様書整備のみで先行する（user 指示に基づく運用）

## 変更内容（docs-only）

- 新規: `docs/30-workflows/ut-06-followup-H-health-db-endpoint/`
  - `index.md` / `artifacts.json`
  - `phase-01.md` 〜 `phase-13.md`（13 ファイル）
  - `outputs/phase-01/main.md` / `phase-02/main.md` / `phase-03/main.md`
- **本 PR では `apps/api/` / `apps/web/` / `wrangler.toml` / migration / Cloudflare Secret に一切触れない**

## AC trace（Phase 1 §受入条件 AC-1〜AC-9 → 仕様書中の固定箇所）

| AC | 内容 | 仕様書中の固定箇所 |
| --- | --- | --- |
| AC-1 | `Env.DB: D1Database` 型定義 | Phase 1 §既存命名規則 / Phase 2 §設計対象の特定 |
| AC-2 | `GET /health/db` が `SELECT 1` を実行 | Phase 1 / Phase 2 §擬似シーケンス / Phase 5 ランブック予約 |
| AC-3 | 成功時 HTTP 200 + `{ ok: true, db: "ok", check: "SELECT 1" }` | Phase 2 §レスポンス schema |
| AC-4 | 失敗時 HTTP 503 + `{ ok: false, db: "error", error }` + Retry-After | Phase 2 §レスポンス schema |
| AC-5 | wrangler.toml の D1 binding 確認 | Phase 2 §ファイル変更計画 |
| AC-6 | 認証 / WAF / IP allowlist 方針の意思決定 | Phase 2 §認証 4 案 / Phase 3 base case = D |
| AC-7 | Phase 11 S-03 / S-07 smoke 期待値の drift 防止テンプレ | Phase 2 §smoke 同期方針 |
| AC-8 | タスク種別 `implementation` / `NON_VISUAL` / `api_health` 固定 | Phase 1 メタ情報 / artifacts.json.metadata |
| AC-9 | 不変条件 #5 違反なし | Phase 1 / 2 / 3 §多角的チェック / state ownership 表 |

## 不変条件 #5 違反なし（docs-only）

state ownership 表（Phase 2）で writer / reader 列に `apps/web` が一切現れない。本 PR は markdown / JSON のみの追加で、`apps/web` から D1 を直接叩く形に変質する余地は構造上存在しない。

## Phase 12 5 タスクの spec_created 状態

| タスク | 状態 |
| --- | --- |
| unassigned-task-detection | spec_created |
| implementation-guide | spec_created |
| system-spec-update-summary | spec_created |
| documentation-changelog | spec_created |
| skill-feedback-report | spec_created |

## next step（実コード実装は別 PR）

本 PR マージ後、`feat/ut-06-fu-h-health-db-impl` ブランチを切り、Phase 5 ランブックを入力にして `apps/api/src/index.ts` への endpoint 追加 + Phase 11 smoke S-03 / S-07 実走を行う。実装 PR の起票も **user 明示承認後** に実施する（本 Phase 13 §PR 2 仕様 を参照）。

## 関連

- Refs #121（CLOSED のまま参照のみ）
- 上流: `docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint.md`
- 関連: UT-22 D1 migration / UT-06-FU-I（/health 期待値同期）
- 下流: UT-06 Phase 11 S-03 / S-07 smoke / UT-08 通知基盤

## レビュー方針

- solo 運用のため required reviewers = 0（CLAUDE.md §ブランチ戦略 準拠）
- CI gate（`required_status_checks`）/ 線形履歴（`required_linear_history`）/ 会話解決必須化（`required_conversation_resolution`）/ force-push & 削除禁止 で品質保証
````

### CI 必須 check（PR 1）

| check 種別 | 内容 | 想定 |
| --- | --- | --- |
| docs validator | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-06-followup-H-health-db-endpoint` が PASS | docs-only スコープの最終 gate |
| `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml`（CLAUDE.md §よく使うコマンド 参照） | indexes に drift がないこと |
| 線形履歴 | `required_linear_history` | merge commit 不可 |
| 会話解決 | `required_conversation_resolution` | レビューコメント全解決 |
| typecheck / lint / test | docs-only のため対象外（`apps/` への影響なし） | スキップ可 |

### local-check（PR 1 作成前 / docs-only スコープ）

```bash
# 必須ファイル存在確認
ls docs/30-workflows/ut-06-followup-H-health-db-endpoint/
ls docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-01/
ls docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-02/
ls docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-03/

# 不変条件 #5 違反混入チェック（apps/web 編集が含まれていないこと）
git diff --name-only main...HEAD | rg "apps/web/" \
  && echo "FAIL: apps/web 編集が混入" \
  || echo "OK: apps/web 不在"

# 計画系 wording / Secret 値混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/ \
  && echo "FAIL: 計画系 wording 残存" \
  || echo "OK: 計画系 wording なし"

rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=|op://" \
  docs/30-workflows/ut-06-followup-H-health-db-endpoint/ \
  && echo "FAIL: Secret/op URI 混入" \
  || echo "OK: Secret 混入なし"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-06-followup-H-health-db-endpoint
```

### PR 1 作成コマンド（user 承認後のみ実行）

```bash
git status
git branch --show-current

git add docs/30-workflows/ut-06-followup-H-health-db-endpoint/

git commit -m "$(cat <<'EOF'
docs(ut-06-fu-h): apps/api /health/db タスク仕様書整備 (Phase 1-13)

- ut-06-followup-H-health-db-endpoint ワークフロー新規作成
- Phase 1〜13 仕様書 + outputs/phase-{01,02,03}/main.md
- AC-1〜AC-9 / 不変条件 #5 / 503+Retry-After / WAF+ヘッダ token base case を固定
- 実 endpoint 実装は user 承認後の別 PR (feat/ut-06-fu-h-health-db-impl)

Refs #121

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin docs/ut-06-fu-h-task-spec

gh pr create \
  --title "docs(ut-06-fu-h): apps/api /health/db タスク仕様書整備 (Phase 1-13)" \
  --base main \
  --body "$(cat <<'EOF'
（上記 PR description テンプレを貼付）
EOF
)"
```

---

## PR 2 仕様（後続 実コード実装 PR の起票テンプレ）

> **本 Phase 13 では PR 2 を起票しない。** 起票そのものが user の明示承認後の別アクションである。本セクションはテンプレを「予約」するのみ。

### ブランチ / base / head

| 項目 | 値 |
| --- | --- |
| head ブランチ | `feat/ut-06-fu-h-health-db-impl` |
| base ブランチ | `dev`（feature → dev → main の正規ルート。実コード実装は dev → main の段階を踏む） |
| labels | `area:api` / `task:ut-06-fu-h` / `wave:1` / `feature` |
| linked issue | `Closes #121`（**実装完了時のみ Closes**。事前に Issue 再 open するかは user 判断） |

### PR タイトル

```
feat(api): apps/api に GET /health/db D1 疎通 endpoint を実装 (UT-06 AC-4)
```

### PR description テンプレ（実装 PR）

````markdown
## 概要

ut-06-followup-H-health-db-endpoint ワークフロー Phase 5 ランブックを実走し、`apps/api/src/index.ts` に `GET /health/db` D1 疎通 endpoint を追加する。UT-06 AC-4「API 経由 D1 SELECT smoke」の実行ブロッカー B-2 を解消する。

仕様書は別 PR（docs(ut-06-fu-h)）で `docs/30-workflows/ut-06-followup-H-health-db-endpoint/` 配下に既に固定済。本 PR はその仕様書の Phase 5 を実装に落とすもの。

## 変更内容

- `apps/api/src/index.ts`
  - `Env.DB: D1Database` 型追加（AC-1）
  - `app.get("/health/db", ...)` ハンドラ追加（AC-2）
  - 成功時 200 + `{ ok: true, db: "ok", check: "SELECT 1" }`（AC-3）
  - 失敗時 503 + `{ ok: false, db: "error", error }` + `Retry-After: 30`（AC-4）
- `apps/api/wrangler.toml`
  - D1 binding `[[d1_databases]] binding = "DB"` の存在確認のみ（編集なし / AC-5）
- 認証: 案 D（固定パス + X-Health-Token + WAF / IP allowlist）採用（AC-6）。認証トークンは Cloudflare Secrets に注入
- Phase 11 smoke S-03 / S-07 期待値テンプレ更新（AC-7）

## AC checklist trace

- [ ] AC-1: `Env.DB: D1Database` 追加
- [ ] AC-2: `GET /health/db` が `SELECT 1` を実行
- [ ] AC-3: 成功 200 + 指定 JSON shape
- [ ] AC-4: 失敗 503 + `Retry-After: 30`
- [ ] AC-5: wrangler.toml D1 binding 確認
- [ ] AC-6: WAF + ヘッダ token defense in depth 適用
- [ ] AC-7: Phase 11 smoke S-03 / S-07 drift なし
- [ ] AC-8: scope `api_health` / NON_VISUAL 維持
- [ ] AC-9: 不変条件 #5 違反なし（`apps/web` 不在）

## smoke evidence 添付欄

```
S-03 (success): curl -i https://<staging-host>/health/db
  → 期待: HTTP 200 + { ok: true, db: "ok", check: "SELECT 1" }
  実測: <貼付>

S-11 (failure simulation): D1 binding 一時無効化下での挙動
  → 期待: HTTP 503 + Retry-After: 30 + { ok: false, db: "error", ... }
  実測: <貼付>
```

## 前提（必須）

- UT-22 D1 migration が production / staging で `completed` であること（3 重明記された必須前提）
- 本 PR の前段に「docs(ut-06-fu-h): apps/api /health/db タスク仕様書整備」PR がマージ済であること

## リスク・ロールバック

- ロールバック: endpoint 削除 + `HEALTH_DB_TOKEN` secret 廃止 + WAF rule 解除の 1〜2 コミット粒度
- 不変条件 #5 違反なし: state ownership 表で `apps/web` writer / reader 不在を保証

## 関連

- Closes #121
- 仕様書: `docs/30-workflows/ut-06-followup-H-health-db-endpoint/`
- 上流: UT-22 D1 migration
- 連携: UT-06-FU-I（/health 期待値同期）/ UT-08 通知基盤（503 解釈）
````

### CI 必須 check（PR 2）

| check 種別 | 内容 |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| build | `mise exec -- pnpm build` |
| smoke S-03 / S-07 | Phase 11 ランブックを実走しログを PR description の smoke evidence 欄に貼付 |
| 線形履歴 / 会話解決 / force-push 禁止 | dev / main branch protection 共通 |

---

## ロールバック / 緊急時の手順

| 状況 | 対応 |
| --- | --- |
| PR 1 提出後、レビューで重大な不整合が見つかった | PR を **draft 化**（`gh pr ready --undo`）して該当 Phase へ差し戻し。docs-only のため revert は markdown 削除のみ |
| PR 1 提出後、計画系 wording / Secret URI 混入が事後検出 | PR を **close**（merge せず）し、Phase 12 へ差し戻して再生成。新規 PR で出し直す |
| user 承認が PR 1 提出後に撤回された | PR を draft 化して保留。マージは行わない |
| PR 2（実装 PR）で UT-22 未完了が判明 | 実装 PR を **draft 化**し、UT-22 完了まで block。Phase 3 NO-GO 条件に該当 |
| PR 2 マージ後に runtime で `c.env.DB` undefined | rollback コミット（endpoint 削除 + secret 廃止 + WAF rule 解除）を main へ即時 PR |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | CLAUDE.md §ブランチ戦略 | `feature/* → dev → main` / solo 運用 / required reviewers = 0 / CI gate のみで保護 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web からの D1 直接アクセス禁止 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 13 自動実行禁止原則 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/index.md | PR タイトル / AC / 依存関係根拠 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/artifacts.json | Phase 1〜12 状態 / `user_approval_required: true` の正本 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-01.md | AC-1〜AC-9 / 真の論点 / 4 条件評価 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | base case 案 D / レスポンス schema / state ownership |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | PASS（with notes）/ NO-GO 条件 / open question |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-13.md | フォーマットリファレンス |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-13.md | フォーマットリファレンス（branch protection 系） |

---

## 実行タスク

1. PR 1 / PR 2 の二段階ユーザー承認ゲートを提示する（完了条件: 承認文言が分離されている）。
2. PR 1 の docs-only 変更範囲と AC trace を固定する（完了条件: `apps/` 変更なしが明記されている）。
3. local-check を実行する手順を固定する（完了条件: 必須ファイル / 不変条件 #5 / Secret / validator を確認する）。
4. user 明示承認後のみ PR 1 を作成するコマンドを予約する（完了条件: commit / push / PR 作成の自動実行禁止が明記されている）。
5. PR URL 記録と artifacts 更新条件を定義する（完了条件: PR merge 後に completed 昇格する条件がある）。
6. PR 2 の実コード実装 PR 起票テンプレを予約する（完了条件: 起票も user 明示承認後である）。
7. rollback / 緊急時の手順を固定する（完了条件: PR 1 / PR 2 の差し戻し経路が分離されている）。

## 実行手順

### ステップ 1: 承認ゲートの提示

- user に change-summary（PR 1 / PR 2 双方の差分概要）と AC trace を提示する。
- 本 Phase 13 §ユーザー承認ゲート の各項目を読み合わせ、「PR 1 を作成してよい」の明示文言を取得する。

### ステップ 2: local-check の実行

- 上記 §local-check（PR 1 作成前 / docs-only スコープ）コマンドを実行し、4 件すべて OK を確認する。
- いずれか FAIL した場合は Phase 12 へ差し戻し、修正後に再 local-check。

### ステップ 3: PR 1 の作成（user 承認後のみ）

- ブランチ確認 → 明示 add → commit → push → `gh pr create --base main`。
- `git add .` / `git add -A` は禁止。パス明示で add する。

### ステップ 4: PR URL の記録

- 取得した PR URL を artifacts.json の `phases[12].pr_url` フィールドに追記する（フィールドが無い場合は新規キーで追記）。
- `phases[12].status` を `completed` に更新する条件は **PR がマージされた後** とする（提出時点では `spec_created` のまま、マージ確認後に `completed` へ昇格）。

### ステップ 5: PR 2 起票方針の user 確認

- PR 1 マージ後、改めて user に「後続実装 PR（feat/ut-06-fu-h-health-db-impl）を起票してよいか」を確認する。
- 承認後、別ブランチを作成し Phase 5 ランブックの実走に着手する。本 Phase 13 では起票そのものは行わない。

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| docs validator | PR 1 作成前の最終 gate（typecheck / lint / test は docs-only スコープ外） |
| `verify-indexes-up-to-date` CI | `.claude/skills/aiworkflow-requirements/indexes` に drift がないこと |
| PR description AC trace | AC-1〜AC-9 を Phase 1 §受入条件 ↔ 仕様書中の固定箇所に 1:1 対応 |
| smoke evidence（PR 2） | Phase 11 S-03 / S-07 の実測ログを PR 2 の description 欄に貼付 |

---

## 多角的チェック観点

- **不変条件 #5**: PR 1 の差分が markdown / JSON のみで、`apps/web` から D1 を直接叩く変更が一切混入していないか。
- **solo 運用適合**: required reviewers = 0 / CI gate / 線形履歴 / 会話解決 / force-push 禁止 で品質保証されているか。CLAUDE.md と GitHub branch protection 実値が drift していないか。
- **CI gate 構成**: docs validator / verify-indexes / 線形履歴 / 会話解決必須化が PR 1 の必須 check として機能するか。
- **Issue #121 CLOSED 状態の取扱い**: 本 PR で **再 open しない / Closes #121 を書かない / Refs #121 のみ**。実装 PR（PR 2）で初めて `Closes #121` 候補にする。
- **user 承認の二段階性**: PR 1 提出承認と PR 2 起票承認は別アクション。一括承認を強制しない。
- **rollback 粒度**: PR 1 = markdown 削除のみ / PR 2 = 1〜2 コミット粒度。いずれも逆操作可能。
- **計画系 wording / Secret 混入**: `仕様策定のみ` / `op://` / API token 値が outputs / docs に転記されていないか。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ユーザー承認ゲート定義 | 13 | spec_created | 二段階承認（PR 1 / PR 2 起票） |
| 2 | PR 1 仕様（タイトル / description / コマンド）固定 | 13 | spec_created | base = main、docs-only |
| 3 | PR 2 起票テンプレ仕様化（実装 PR） | 13 | spec_created | base = dev、Closes #121 候補 |
| 4 | CI 必須 check 一覧の固定 | 13 | spec_created | docs validator / verify-indexes / 線形履歴 / 会話解決 |
| 5 | local-check スクリプト固定 | 13 | spec_created | 不変条件 #5 / Secret / 計画系 wording |
| 6 | ロールバック / 緊急時手順 | 13 | spec_created | draft 化 / close / revert PR |
| 7 | Issue #121 CLOSED 状態の取扱い明記 | 13 | spec_created | Refs のみ / 再 open 禁止 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-13.md | 本ファイル。PR は user 明示承認後にのみ作成 |

> 本 Phase 13 では `outputs/phase-13/` ディレクトリは作成しない。PR 1 自体が成果物相当であり、PR が user 承認後に作成されるまで生成物は本 phase-13.md のみ。

---

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] ユーザー承認ゲート（PR 1）の全項目 PASS（user 明示承認を含む）
- [ ] local-check（docs validator / 不変条件 #5 / Secret / 計画系 wording）が 4 件すべて OK
- [ ] PR 1 が作成され、Issue #121 へ `Refs #121`（`Closes` ではない）でリンクされている
- [ ] PR URL が記録されている（artifacts.json `phases[12].pr_url` に追記）
- [ ] PR 1 の CI（docs validator / verify-indexes / 線形履歴 / 会話解決）が green
- [ ] PR 1 マージ後、`artifacts.json.phases[12].status` が `completed` に更新される
- [ ] PR 2 起票方針が user に提示され、起票判断が user に委ねられている

---

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が `completed` 相当（user 承認取得 / local-check / PR 1 作成 / PR URL 記録 / PR 2 方針提示）
- 本 phase-13.md が `docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-13.md` に配置済み
- artifacts.json の `phases[12].status` が PR マージ後に `completed` へ更新される運用が明記されている
- 不変条件 #5 違反 / Secret 混入 / 計画系 wording 残存が 0 件であることを local-check で確認

---

## 次タスク

- 次: 本ワークフロー完了。
- 後続（別 PR / 別タスク）:
  - **後続 実コード実装 PR の起票**（user 明示承認後のみ）: `feat/ut-06-fu-h-health-db-impl` ブランチで Phase 5 ランブックを実走し、`apps/api/src/index.ts` への endpoint 追加 + Phase 11 smoke S-03 / S-07 の実走を行う。Issue #121 の `Closes` 候補。
  - UT-22 D1 migration の `completed` 状態を実装 PR 着手前に再確認（NO-GO 条件 3/3）。
  - UT-06-FU-I（/health 期待値同期）との応答 prefix `{ ok: ... }` 整合を実装 PR 内で再確認。
- ブロック条件:
  - user 承認が無い間は PR 1 / PR 2 のいずれも作成・起票しない
  - local-check が FAIL（→ Phase 12 へ差し戻し）
  - 不変条件 #5 違反 / Secret 混入 / 計画系 wording 残存が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
  - UT-22 未完了下で PR 2 を起票しない
