# Phase 13 — PR 作成（user approval gate）

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md`
> Phase 種別: NON_VISUAL docs-only / approval-gated
> 出力先ベース: `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-13/`

## 0. 大原則（厳守）

1. **本仕様書作成プロンプトの責務外**: 本 Phase 13 は仕様書のみを記述する。**コミット / push / PR 作成は実行しない**。実行は別プロンプト（`/diff-to-pr` 等）で user の明示承認を取得した後に行う。
2. **user の明示承認なしに PR を作成しない**。曖昧な合意（「いいよ」程度）では実行禁止。
3. **ローカル確認を省略しない**（§4 の検証コマンドは全て実行ログを `local-check-result.md` に保存）。
4. **`Refs phase-3 §4.2 task-20`** を PR body / commit message に必ず含める。`Closes` は使用しない（後追い PR 化の事故防止）。

## 1. docs-only ゆえに省略する gate

| 通常 PR の gate | 本タスクでの扱い |
|----------------|------------------|
| runtime deploy (staging dry-run) | **省略**（コード変更なし、ランタイム影響ゼロ） |
| D1 migration apply | **省略**（D1 schema 不変） |
| Cloudflare Secrets put | **省略**（secret 取扱なし） |
| typecheck / build | **省略**（コード変更なし、`apps/` 配下に diff なし） |
| unit test | **省略**（テスト対象コードなし） |

採用する gate は **markdown 構造 grep / 視覚値 grep / API trace check / コピー原文 grep / markdown validation / 行数 inventory / placeholder** に限る。

## 2. 必須成果物（Phase 13 quick-summary 4 点 + 本タスク固有 1 点）

| ファイル | 役割 |
|---------|------|
| `outputs/phase-13/local-check-result.md` | grep / lint / wc のローカル検証ログ |
| `outputs/phase-13/change-summary.md` | 変更ファイル一覧 / 影響範囲（user 提示用） |
| `outputs/phase-13/pr-info.md` | PR URL / CI 結果（PR 作成後に追記） |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |
| `outputs/phase-13/pr-template.md` | PR body テンプレ（本仕様書 §6 を実体ファイル化） |

## 3. user approval gate（commit-push / PR open ゲート分離）

docs-only かつ不可逆 deploy を含まないため、G1-G4 4 段ゲートではなく以下の **二段ゲート** を採用する:

| # | ゲート | 通過条件 | 本仕様書作成プロンプトでの扱い |
|---|--------|----------|--------------------------------|
| G1 | commit-push 承認ゲート | `change-summary.md` + 実行 plan + rollback 案を提示 → user の明示文言（例「commit/push approve」）取得 | **取得しない**（本プロンプトは仕様書作成のみ） |
| G2 | PR open 承認ゲート | G1 PASS 後、`gh pr create` 実行直前に再度 user の明示承認 | **取得しない** |

> 本仕様書プロンプトの最終 gate 条件: **本ファイル `phase-13.md` を Write した時点で完了**。コミット / push / PR は別プロンプト責務。

## 4. コミット粒度（3 単位）

| # | 粒度 | 含むファイル |
|---|------|--------------|
| 1 | spec | `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/index.md` / `artifacts.json` / `phase-{01..13}.md` |
| 2 | outputs | `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-{01..13}/**` |
| 3 | content | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` / `09f-screen-blueprints-member.md`（同一サイクルで作成・検証済） |

> revert 単位 = commit 単位 を保つ。1 コミットに spec と content を混ぜない。

## 5. ローカル確認（`local-check-result.md` 必須記録）

PR 作成前に以下コマンドを順に実行し、出力を `local-check-result.md` に記録する（exit code / 主要行）。

| # | コマンド | 期待 |
|---|---------|------|
| 1 | `wc -l docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | 実体あり・行数記録 |
| 2 | `wc -l docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | 実体あり・行数記録 |
| 3 | `grep -cE '^## [0-9]+\. ' 09e-...md` | 7 |
| 4 | `grep -cE '^## [0-9]+\. ' 09f-...md` | 3 |
| 5 | `grep -nE '#[0-9a-fA-F]{3,8}\b\|oklch\(\|\b[0-9]+px\b\|\bbg-\[' 09e/09f` | 0 hits |
| 6 | `grep -E 'input\|sent\|unregistered\|deleted\|rules_declined\|error' 09f-...md` | 5+1 状態 hit |
| 7 | `grep -E 'banner\|summary\|request\|delete' 09f-...md` | 4 領域 hit |
| 8 | markdown validation | lint 未定義時は `PASS_WITH_SUBSTITUTION` |
| 9 | `! grep -nE '§TBD' 09e-...md 09f-...md` | placeholder 0 |
| 10 | API trace（現行 API 正本 vs §X.4） | 集合一致 |

失敗した場合は `local-check-result.md` に失敗ログを保存し、PR 作成を **blocked** にして user に報告する。

## 6. CI gate 列挙（PR 作成後に GitHub Actions が実行する gate）

| gate | workflow | 通過条件 |
|------|----------|----------|
| markdown-lint（あれば） | `.github/workflows/*.yml` | error 0 |
| verify-design-tokens（task-18 で導入予定） | 該当 workflow | 09e / 09f に視覚値 0 件で通過 |
| verify-indexes-up-to-date | `.github/workflows/verify-indexes.yml` | drift 0 |

> docs-only のため typecheck / build / test job は本 PR では skip 相当（`apps/` 配下の diff なし）。

## 7. PR template（`pr-template.md` 実体）

```md
## Summary

task-20 screen-blueprints-public-and-member: pages-public.jsx / pages-member.jsx の凍結正本を `09e-screen-blueprints-public.md`（公開 6 画面）/ `09f-screen-blueprints-member.md`（会員 2 画面）の 2 markdown に完全再現する spec を新規作成する。

- 公開 6 routes（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）
- 会員 2 routes（`/login`, `/profile`）
- 各画面で X.1（JSX inline）/ X.2（コピー原文）/ X.3（mermaid 状態遷移）/ X.4（API 表）/ X.5（props/state）/ X.6（a11y）/ X.7（9 series link）の 7 節 fixed schema
- 視覚値（HEX / oklch / px / bg-arbitrary-class）0 件 grep gate
- API 表は現行 API 正本と一致

Refs phase-3 §4.2 task-20
Refs `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md`

## CONST_005 5 項目充足チェック

- [ ] **CONST_005-1 既存 API のみ接続**: 09e / 09f §X.4 は現行 API 正本に同期、新規 endpoint 追加なし
- [ ] **CONST_005-2 OKLch トークン正本化**: 視覚値 0 件 grep gate（4 種パターン）で機械検証
- [ ] **CONST_005-3 プロトタイプ正本順位**: pages-public.jsx / pages-member.jsx は凍結、本 PR で改変なし
- [ ] **CONST_005-4 D1 直接アクセス禁止**: §X.4 API 表に D1 binding を含めない（grep `D1` / `d1_databases` 0 件）
- [ ] **CONST_005-5 secret 不混入**: docs-only、secret 取扱なし

## 元タスク §8 DoD 再掲チェックリスト

- [ ] `09e-screen-blueprints-public.md` が新規作成・公開 6 画面 + §99 を含む
- [ ] `09f-screen-blueprints-member.md` が新規作成・会員 2 画面 + §99 を含む
- [ ] 09e に §1〜§6 + §99（公開 6 + 不採用）
- [ ] 09f に §1〜§2 + §99（会員 2 + 不採用）
- [ ] 全 8 画面で実装に必要な 7 以上の節が揃う
- [ ] login 5+1 状態（input/sent/unregistered/deleted/rules_declined/error）が 09f §1.3 mermaid に列挙
- [ ] `/profile` 4 領域（banner/summary/request/delete）が 09f §2 で網羅
- [ ] register / privacy / terms は phase-3 §3 派生ルール正本転記
- [ ] 視覚値（HEX / oklch / px / bg-arbitrary-class) が grep で 0 件
- [ ] 現行 API 正本と §X.4 の API 表が完全一致
- [ ] consent キー / responseEmail / D1 直接アクセス禁止 等の不変条件が反映
- [ ] markdown validation 済み（lint 未定義時は代替証跡）
- [ ] 09c / 09b / 09d / 09a への link が全画面で記述

## 後続タスクへの影響

- task-11 public top + member list（09e §1 / §2 を実装根拠として参照）
- task-12 detail + register（09e §3 / §4）
- task-13 login（09f §1）
- task-14 my profile + requests（09f §2）
- task-06 09-ui-ux.md（9 series 索引から 09e / 09f を link）
- task-18 regression smoke（視覚値 0 件 grep gate を CI 監視）

## Test plan

- [ ] CI: markdown validation pass
- [ ] CI: verify-indexes drift 0
- [ ] ローカル: 視覚値 0 件 grep（evidence: `outputs/phase-11/evidence/grep-visual-values.log`）
- [ ] ローカル: API trace 一致（evidence: `outputs/phase-11/evidence/grep-api-trace.log`）
- [ ] ローカル: login 5+1 状態 / profile 4 領域 hit（evidence: `outputs/phase-11/evidence/grep-copy-text.log`）
- [ ] ローカル: 行数 inventory（evidence: `outputs/phase-11/evidence/wc-lines.log`）

## 影響範囲

- API endpoint surface 不変
- D1 schema 不変
- ランタイム挙動影響なし（NON_VISUAL / docs-only）
- 後続 task-11..14 / task-06 / task-18 が 09e / 09f を消費

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 8. `change-summary.md`（user 提示用）

必須セクション:

- **目的**: 1 段落で本 PR の意図（spec 新規作成 / docs-only / 後続 task-11..14 の前提）
- **変更ファイル一覧**: §4 コミット粒度 3 単位の表を再掲
- **影響範囲**: 後続タスク / 既存 API / D1 / UI への影響を 1 段落（すべて不変）
- **rollback**: `git revert <merge-commit>` で全戻し可能 / コード変更なしのためロールバック影響ゼロ
- **local-check-result サマリ**: §5 全コマンド PASS 行
- **承認依頼文言**: 「上記内容で commit / push を実行してよいか、明示文言で承認をお願いします（G1）」

## 9. approval 後のフロー（別プロンプト責務）

approval 取得後、以下を順に実行する（**本仕様書作成プロンプトでは実行しない**）:

1. §4 コミット粒度ごとに `git add <files>` → `git commit -m "<msg>"`（HEREDOC で `Refs phase-3 §4.2 task-20` 含む）
2. `git push -u origin <branch>`
3. `gh pr create --title "..." --body "$(cat outputs/phase-13/pr-template.md)"`
4. `outputs/phase-13/pr-info.md` に PR URL / CI 結果を追記
5. `outputs/phase-13/pr-creation-result.md` に commit SHA list / push 結果 / PR API response を保存

## 10. 完了条件（本仕様書作成プロンプトとして）

- [x] `phase-13.md` が `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/` 配下に存在
- [ ] approval-gate 二段（commit-push / PR open）の責務分離が記述されている
- [ ] PR template に CONST_005 5 項目 + 元タスク §8 DoD 13 項目が再掲されている
- [ ] docs-only ゆえの gate 省略（runtime deploy / D1 apply / Cloudflare Secrets / typecheck / build / test）が明示されている
- [ ] CI gate が列挙されている
- [ ] **本仕様書を作成しただけで commit / push / PR を作成していない**ことを最終確認

> 本仕様書の Phase 13 完了 = ファイル Write 完了。実 PR 作成は user の明示承認後、別プロンプトで実行する。
