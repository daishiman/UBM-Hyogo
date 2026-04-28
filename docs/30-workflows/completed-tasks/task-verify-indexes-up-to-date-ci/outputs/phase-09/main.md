# Phase 9 — 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 9 / 13 |
| 状態 | completed |
| 上流 | Phase 8（命名規則確定 + navigation drift TODO） |
| 下流 | Phase 10（最終レビュー） |

## 結論サマリ

`verify-indexes.yml` 仕様の品質を 5 領域（line budget / link / mirror parity / secret hygiene /
free-tier）で確認。全領域 PASS。a11y / 認可境界は CI gate 性質上 N/A として明文化する。

## 1. line budget（YAML）

| # | 項目 | 期待値 | 実装見込み | 判定 |
| --- | --- | --- | --- | --- |
| Q-1 | `.github/workflows/verify-indexes.yml` 総行数 | ≤ 60 行 | 約 40 行（Phase 5 サンプル基準） | PASS |
| Q-2 | step 数 | ≤ 7 | 6 step（checkout / pnpm setup / setup-node / install / rebuild / detect-drift） | PASS |
| Q-3 | inline shell の最長行 | ≤ 120 char | `Detect drift` step の最長行 ≤ 100 char | PASS |
| Q-4 | comment 行 | ≥ 0（必須化しない） | 必要に応じ追加（Phase 5 サンプルでは省略） | optional |

## 2. link チェック（ドキュメント間）

| # | リンク元 | リンク先 | 確認内容 | 判定 |
| --- | --- | --- | --- | --- |
| L-1 | `CLAUDE.md`（Phase 12 で追記） | `.github/workflows/verify-indexes.yml` 相対パス | 存在前提・タイポなし | Phase 12 で確定 |
| L-2 | `doc/00-getting-started-manual/lefthook-operations.md` | 本仕様書 index.md（CI gate への cross-ref） | post-merge 廃止の代替経路 | Phase 12 で確定 |
| L-3 | 本仕様書 index.md | phase-01.md 〜 phase-13.md | 全 phase 相互参照 dead link なし | PASS（既存仕様書） |
| L-4 | phase-08 navigation-drift（本 main.md 内 N-1〜N-4） | 各対象ファイル | 対象 path 実在 | PASS |
| L-5 | Phase 12 implementation-guide.md | `.github/workflows/verify-indexes.yml` | 実装ファイル path 一致 | Phase 12 で確定 |

## 3. mirror parity（`.claude` ↔ `.agents`）

| # | 項目 | 確認 | 判定 |
| --- | --- | --- | --- |
| M-1 | 本 workflow が `.claude/skills/aiworkflow-requirements/indexes/` の生成内容を変更するか | しない（gate 追加のみ。`generate-index.js` も非改変） | 影響なし |
| M-2 | `.claude` ↔ `.agents` 同期スクリプトに変更があるか | なし | 影響なし |
| M-3 | drift 検出範囲は `.claude/...indexes` のみで `.agents` を監視するか | 監視しない（path 引数で限定） | 影響なし |
| M-4 | 本タスク導入で `.agents` 側に追加 gate が必要か | 不要（mirror は読み取り専用） | スコープ外 |

> mirror parity は **本タスクの影響範囲外**。`.agents` 側の追加対応なし。

## 4. secret hygiene

| # | 項目 | 確認 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| S-1 | 新規 GitHub Secrets 導入 | しない | `secrets_introduced: []` | PASS |
| S-2 | workflow が `secrets.*` を参照するか | しない | `${{ secrets.* }}` を含まない | PASS |
| S-3 | `permissions:` の最小化 | `contents: read` のみ | write 権限なし | PASS |
| S-4 | `GH_TOKEN` / `GITHUB_TOKEN` 明示利用 | しない | checkout が default token のみで動作 | PASS |
| S-5 | Cloudflare / 1Password への接触 | しない | `scripts/cf.sh` / `op run` を呼ばない | PASS |
| S-6 | 外部 action の version pin | major tag pin（`@v4`） | 既存 ci.yml と整合 | PASS |
| S-7 | log への secret 漏洩リスク | なし | drift 出力は file 名のみ（内容 dump なし） | PASS |

## 5. a11y

CI gate であり UI 成果物を持たない。**N/A**。Phase 12 で追記する CLAUDE.md 1 行は markdown
であり、見出しレベル整合と list 構造のみ確認対象（Phase 12 で実施）。

## 6. GitHub Actions 無料枠（free-tier）見積もり

GitHub Free / Pro: **2,000 minutes / 月**（private repo / Linux runner）。

| 項目 | 見積もり | 根拠 |
| --- | --- | --- |
| 1 PR あたり所要時間 | ≤ 2 min（最悪）/ 約 45 秒（cache hit） | checkout 5s + pnpm setup 5s + setup-node 10s + pnpm install 60s（cache hit 15s） + indexes:rebuild 5s + detect-drift 1s |
| 1 PR あたり起動回数 | 平均 2〜3 回（open + synchronize） | — |
| 月間 PR 数（solo） | ≤ 30 PR / 月 | feature → dev → main の 2 段運用 |
| push to main/dev 起動 | merge 1 回ごと、約 30 回 / 月 | PR 数とほぼ同数 |
| **月間消費分数（保守的最悪）** | **30 × 3 × 2 + 30 × 2 = 240 min / 月** | 全 cache miss 想定 |
| **対 2,000 min 比率** | **≤ 12%** | 残り 88% は既存 4 workflow + 余裕 |
| 実態見積（cache hit） | 約 90 min / 月 | 1 起動 ≒ 45 秒 |

判定: 無料枠に対し十分余裕。AC-3 false positive なし運用と整合。**PASS**。

## 7. 認可境界

CI gate は read-only で D1 / 本番システムに触れない。**N/A**（不変条件 #5 抵触なし）。

## yaml syntax 検証手段

| ツール | 用途 |
| --- | --- |
| `yamllint .github/workflows/verify-indexes.yml` | indent / 空白 / 構文 |
| `actionlint .github/workflows/verify-indexes.yml` | GitHub Actions 専用 lint（`uses:` バージョン / `runs-on` / context 参照） |
| `act -j verify-indexes-up-to-date -W .github/workflows/verify-indexes.yml` | ローカル simulation（Phase 4 L4） |

> typecheck / lint / build の対象は `apps/api` / `apps/web` のソースコードであり、本 workflow yaml は
> 該当範囲外。yaml syntax は yamllint / actionlint で担保し、CI で本 workflow 自身が
> 起動した時点で構文 OK が間接的に検証される。

## 完了条件

- [x] Q-1〜Q-4 で line budget ≤ 60 行が成立する設計
- [x] L-1〜L-5 dead link なし（L-1 / L-2 / L-5 は Phase 12 で確定）
- [x] M-1〜M-4 全て「parity 影響なし」と確定
- [x] S-1〜S-7 全 PASS（permissions: contents: read のみ）
- [x] 月間消費分数（最悪値）≤ 12%（240 min / 2,000 min）
- [x] a11y / 認可境界 N/A を明文化
- [x] yaml syntax 検証手段（yamllint / actionlint / act）を明記

## 次 Phase

Phase 10 へ 5 領域全 PASS / free-tier 12% 以下 / mirror parity 影響なしを引き継ぐ。
