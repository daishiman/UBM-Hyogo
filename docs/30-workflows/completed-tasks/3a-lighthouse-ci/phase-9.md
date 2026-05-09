# Phase 9: 品質保証（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-8.md` |
| 出力 | typecheck / lint / actionlint / yamllint 結果 / secret 静的検査 |

---

## 1. typecheck / lint

本タスクは `apps/web/src` のコード変更を含まないが、PR-A merge 前に既存 gate が green であることを再確認する。

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| Q-01 | 全 workspace typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| Q-02 | 全 workspace lint | `mise exec -- pnpm lint` | exit 0 |

> 本 PR-A は YAML / JSON / lockfile 変更のみで TS 影響はないが、CI gate の `ci`（typecheck + lint）が pass することを規約として確認する。

---

## 2. actionlint（YAML 構文）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| Y-01 | violation 0 | `mise exec -- pnpm dlx actionlint -color .github/workflows/lighthouse.yml` | violation 0 |
| Y-02 | `name:` が context と完全一致 | `grep -E '^name:\s*lighthouse-ci$' .github/workflows/lighthouse.yml` | hit 1 |
| Y-03 | `runs-on: ubuntu-latest` | `grep 'runs-on: ubuntu-latest' .github/workflows/lighthouse.yml` | hit 1 |
| Y-04 | `actions/checkout@v4` / `pnpm/action-setup@v4` / `actions/setup-node@v4` / `actions/upload-artifact@v4` major version 固定 | `grep -E '@v4' .github/workflows/lighthouse.yml \| wc -l` | >= 4 |
| Y-05 | inline script 内の `${{ }}` 展開で shell injection 経路がないこと | コードレビュー（user input を `run:` に直接流さない） |
| Y-06 | `if: always()` の upload-artifact step | `grep 'if: always()' .github/workflows/lighthouse.yml -A2 \| grep 'upload-artifact'` | hit 1 |

---

## 3. yamllint（補助）

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| L-01 | YAML 構文 | `mise exec -- pnpm dlx yaml-lint .github/workflows/lighthouse.yml` | exit 0 |
| L-02 | indent 一貫性 | `actionlint` に内包（追加 yamllint 設定は不要） | violation 0 |

---

## 4. `lighthouserc.json` 検証

| # | 内容 | コマンド | 期待 |
|---|------|---------|------|
| J-01 | JSON 構文 | `jq . lighthouserc.json` | parse 成功 |
| J-02 | lhci healthcheck | `mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json` | exit 0 |
| J-03 | URL 全て localhost | `jq -r '.ci.collect.url[]' lighthouserc.json \| grep -cE '^http://localhost:3000/'` | 4（縮退時 3） |
| J-04 | assertion 4 カテゴリ | `jq '.ci.assert.assertions \| keys' lighthouserc.json` | `["categories:accessibility","categories:best-practices","categories:performance","categories:seo"]` |

---

## 5. secret / token 列挙と静的検査

### 5.1 Stage 3a で参照する secret 一覧

| name | scope | 用途 | 設定先 |
|------|-------|------|--------|
| `GITHUB_TOKEN` | workflow auto | Actions 標準操作 | GitHub auto-provided |
| 追加 secret なし | — | — | — |

### 5.2 hardcode 検査

| # | 検査 | コマンド | 期待 |
|---|------|---------|------|
| S-01 | GitHub PAT 直書き | `grep -rE '(ghp_\|ghs_\|github_pat_)[A-Za-z0-9_]+' .github/workflows/lighthouse.yml lighthouserc.json` | hit 0 |
| S-02 | Cloudflare API token 直書き | `grep -rE 'CF[a-zA-Z0-9_-]{32,}' .github/workflows/lighthouse.yml lighthouserc.json` | hit 0 |
| S-03 | OAuth client secret | `grep -rE 'client_secret\|oauth_token' .github/workflows/lighthouse.yml lighthouserc.json` | hit 0（コメント除く） |
| S-04 | 1Password reference の流出 | `grep -rE 'op://' .github/workflows/lighthouse.yml` | hit 0 |
| S-05 | localhost 以外の URL | `grep -rE 'http(s)?://(?!localhost)' lighthouserc.json` | hit 0 |
| S-06 | `wrangler` 直叩き | `grep -E '\bwrangler\b' .github/workflows/lighthouse.yml` | hit 0 |
| S-07 | `process.env.*` の `apps/web/src` への新規追加 | `git diff --stat apps/web/src/` | 0 ファイル（本 PR-A スコープ） |

---

## 6. CI 実 run の事前 sanity check

| # | 内容 | 期待 |
|---|------|------|
| SC-01 | PR-A の `lighthouse-ci` job が draft PR 上で 1 回 success | green |
| SC-02 | job 所要時間が Phase 6 §1 の試算範囲内 | <= 15 min |
| SC-03 | artifact `lhci-report-${{ github.sha }}` が retention 7 日でアップロード | `gh run download` 可 |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Q-01 / Q-02 全 pass |
| EX-02 | Y-01..Y-06 / L-01..L-02 全 pass |
| EX-03 | J-01..J-04 全 pass |
| EX-04 | S-01..S-07 全て期待値（hit 0 / 0 ファイル） |
| EX-05 | SC-01..SC-03 全 pass（draft PR 観測） |

---

## 8. 引き継ぎ（Phase 10 へ）

| 項目 | 内容 |
|------|------|
| Phase 10 入力 | 本 phase の検証ログ集約（`outputs/phase-9/` 任意 evidence） |
| solo 運用 | レビュアー必須化なし。self-review + checklist 確認のみ |

---

## DoD（Phase 9 完了条件）

| # | 条件 |
|---|------|
| D-01 | Q-01..Q-02 / Y-01..Y-06 / L-01..L-02 / J-01..J-04 / S-01..S-07 / SC-01..SC-03 が実行可能なコマンドで記述済 |
| D-02 | hit 0 期待が全項目で確定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 9
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

YAML / JSON 構文 / typecheck / lint / actionlint / secret 静的検査の品質ゲートを 1 ファイルに集約する。

## 実行タスク

- typecheck / lint / actionlint / yamllint / lhci healthcheck を確定。
- secret leak grep を S-01..S-07 で網羅。
- CI 実 run sanity check を確定。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-9.md
- phase-5.md（本サブタスク内）

## 実行手順

1. typecheck / lint を確認。
2. actionlint / yamllint を確認。
3. lhci healthcheck で JSON schema を検証。
4. secret hardcode を grep で検査。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- Phase 11 で再利用する検証コマンド集

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
