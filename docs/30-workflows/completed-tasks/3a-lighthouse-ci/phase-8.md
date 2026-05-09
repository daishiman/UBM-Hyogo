# Phase 8: リファクタリング（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-7.md` |
| 出力 | lighthouse 設定の重複削除判断 / URL 配列の YAML 化判断 / Stage 4 backlog |

---

## 1. 重複削減候補の評価

### 1.1 候補 A: `lighthouse.yml` build step を `pr-build-test.yml` から再利用

| 項目 | 値 |
|------|----|
| 効果 | build を 1 job 化し、`needs:` で受ける形に再構成 |
| コスト | `actions/upload-artifact` で `.next/` 出力を引き渡す必要・workflow 構造の大幅再設計 / artifact 上限 / cache key 設計再検討 |
| 副作用 | 既存 `pr-build-test.yml` の責務拡大 |
| **判定** | **見送り**（3a スコープに対しオーバーキル。Stage 4 backlog RB-01 に登録） |

### 1.2 候補 B: composite action `actions/setup-project`（checkout + pnpm + node + install）

| 項目 | 値 |
|------|----|
| 効果 | 5 workflow ×≈8 行の boilerplate 削減 |
| コスト | `.github/actions/setup-project/action.yml` 新規 + 全 workflow の `uses:` 書換 |
| 副作用 | `cache: pnpm` の hash key 経路変更 → cache 失効 1 回 |
| **判定** | **見送り**（3a 単独スコープ外。Stage 4 backlog RB-02 に登録） |

### 1.3 候補 C: `lighthouserc.json` の URL 配列を YAML inline 化

| 項目 | 値 |
|------|----|
| 効果 | route 一覧を `.github/workflows/lighthouse.yml` に集中 |
| コスト | `lighthouserc.json` を eliminate するためには autorun の `--url` パラメータ群を生成するスクリプト追加が必要 |
| 副作用 | lhci の `assertion` 設定が JSON ファイル不在で表現困難（CLI option では assertion をフルに表現できない） |
| **判定** | **見送り**（lhci 公式推奨は JSON config 単独運用。YAML 化は anti-pattern） |

---

## 2. Stage 3a 内で実施する軽微整理

| # | 対象 | 内容 |
|---|------|------|
| R-01 | `.github/workflows/lighthouse.yml` の `name:` / `jobs.lighthouse.name:` | `lighthouse-ci` 完全一致を再確認（タイポは BLK-01 を発動） |
| R-02 | `concurrency.group` の命名 | `lighthouse-${{ github.ref }}` に統一 |
| R-03 | `timeout-minutes` 値 | `15` で固定（Phase 6 §2 の試算根拠） |
| R-04 | `actions/upload-artifact@v4` の `retention-days` | `7` で固定 |
| R-05 | `pnpm/action-setup@v4` の `version` 値 | `10.33.2`（CLAUDE.md / `.mise.toml` 正本） |
| R-06 | `actions/setup-node@v4` の `node-version` 値 | `24.15.0`（同上） |
| R-07 | `lighthouserc.json` の URL 重複なし | `jq` で確認 |

> R-01〜R-07 は **新規ファイル内で初回から正しく書く** 性質のもので、別途リファクタコミットは発生しない。

---

## 3. lighthouse config 重複削除判断

`lighthouserc.json` 内で重複しうる項目:

| 項目 | 重複の可能性 | 判定 |
|------|-------------|------|
| URL 配列 | 4 件のうち重複なし（`/`, `/members`, `/profile`, `/login`） | OK |
| assertion 値 | `categories:*` 4 件で重複なし | OK |
| `numberOfRuns` | 単一スカラ | 重複対象外 |
| `preset` | 単一スカラ | 重複対象外 |

抽象化の余地はないため、現行 schema を最終形とする。

---

## 4. Stage 4 以降への refactor backlog

| ID | 内容 | 優先 | 引き取り先 |
|----|------|------|-----------|
| RB-01 | `lighthouse` / `pr-build-test` の build 共有 | low | Stage 4 |
| RB-02 | composite action `setup-project` | mid | Stage 4 |
| RB-03 | `paths` filter による docs-only PR の skip 戦略（dummy job pattern） | mid | Stage 4 |
| RB-04 | LHCI Server 自前ホスティング（履歴ダッシュボード） | low | Stage 5+ |

---

## 5. 終了基準

| # | 条件 |
|---|------|
| EX-01 | R-01..R-07 全て Phase 5 実装内で適用済 |
| EX-02 | RB-01..RB-04 が Stage 4 backlog として `docs/30-workflows/e2e-quality-uplift/backlog.md` に追記される（Phase 12 で対応） |
| EX-03 | 候補 A / B / C 全て見送り判断と理由が記載 |

---

## 6. 引き継ぎ（Phase 9 へ）

| 項目 | 内容 |
|------|------|
| Phase 9 検証対象 | YAML / JSON 構文 / token 列挙 / secret leak / shell injection 静的検査 |

---

## DoD（Phase 8 完了条件）

| # | 条件 |
|---|------|
| D-01 | 候補 A / B / C 全て判定済 |
| D-02 | R-01..R-07 が確定 |
| D-03 | RB-01..RB-04 が backlog 引き取り先付きで列挙 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3a Lighthouse CI 単独スコープの refactor 判断を行い、見送り項目を Stage 4 backlog に引き継ぐ。

## 実行タスク

- 候補 A / B / C を 1:1 で評価。
- 軽微整理 R-01..R-07 を確定。
- RB-01..RB-04 を backlog 化。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-8.md
- phase-5.md（本サブタスク内）

## 実行手順

1. 重複候補を評価。
2. 単独スコープ内 R を確定。
3. backlog を引き渡す。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- Phase 12 で `backlog.md` に転記する RB 群

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
