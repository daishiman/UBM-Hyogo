# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 |
| 下流 | Phase 10 |
| 状態 | completed |

## 目的

Phase 8 で確定した命名 / DRY 方針を踏まえ、`verify-indexes.yml` 仕様の品質を
**quantitative に** 確認する。本タスクは docs + CI / NON_VISUAL であり実装ランタイム
コードを伴わないため、品質チェックの対象は (a) workflow YAML の line budget、
(b) ドキュメント間の link 健全性、(c) `.claude` ↔ `.agents` mirror parity、
(d) secret hygiene、(e) GitHub Actions 無料枠の見積もり、の 5 領域に絞る。

## 品質チェック

### 1. line budget（YAML）

| # | 項目 | 期待 | 算出根拠 |
| --- | --- | --- | --- |
| Q-1 | `.github/workflows/verify-indexes.yml` 総行数 | **≤ 60 行** | header(name/on/concurrency/permissions/jobs) ≈ 15 行 + steps(checkout/pnpm/setup-node/install/rebuild/diff/report) ≈ 30 行 + 余白 ≈ 15 行 |
| Q-2 | step 数 | ≤ 7 step | checkout / pnpm-setup / setup-node / pnpm install / indexes:rebuild / detect-drift / report-drift |
| Q-3 | inline shell の最長行 | ≤ 120 char | 可読性確保 |
| Q-4 | comment 行 | ≥ 3 行 | (a) why this gate exists、(b) drift 検出範囲限定の根拠、(c) 撤去手順への参照 |

### 2. link チェック（ドキュメント間）

| # | リンク元 | リンク先 | 確認内容 |
| --- | --- | --- | --- |
| L-1 | `CLAUDE.md`（Phase 12 で追記予定の CI gate 言及） | `.github/workflows/verify-indexes.yml` 相対パス | 存在前提・タイポ無し |
| L-2 | `doc/00-getting-started-manual/lefthook-operations.md` | 本タスク仕様書 index.md | post-merge 廃止の代替経路として CI gate を指す |
| L-3 | 本仕様書 index.md | phase-01.md 〜 phase-13.md | 全 phase 相互参照が dead link でない |
| L-4 | phase-08 navigation-drift.md | N-1〜N-4 各対象ファイル | 対象 path が実在 |
| L-5 | phase-12（予定）の implementation-guide.md | `.github/workflows/verify-indexes.yml` | 実装ファイル（本タスクで配置）への path が一致 |

### 3. mirror parity（`.claude` ↔ `.agents`）

| # | 項目 | 確認 | 結果想定 |
| --- | --- | --- | --- |
| M-1 | 本タスクの workflow が `.claude/skills/aiworkflow-requirements/indexes/` 自体の **生成内容** を変更するか | **しない**（gate 追加のみ。`generate-index.js` も非改変） | parity 影響なし |
| M-2 | `.claude` 正本と `.agents` mirror の同期スクリプトに変更があるか | なし | parity 影響なし |
| M-3 | drift 検出範囲は `.claude/skills/aiworkflow-requirements/indexes/` のみで、`.agents` 配下を監視しないか | しない（path 引数で限定） | mirror 側 drift は別経路で担保 |
| M-4 | 本タスク導入で `.agents` 側に追加すべき index 検証 gate が発生するか | **発生しない**（mirror は読み取り専用） | スコープ外 |

> 本タスクでは `aiworkflow-requirements` の `indexes/` ディレクトリ自体の生成物には触れず、
> `.claude` ↔ `.agents` の mirror parity に対する影響は **無し** と確定する。

### 4. secret hygiene

| # | 項目 | 確認 | 期待 |
| --- | --- | --- | --- |
| S-1 | 新規 GitHub Secrets を導入するか | しない | `secrets_introduced: []`（artifacts.json と一致） |
| S-2 | workflow が `secrets.*` を参照するか | しない | `${{ secrets.* }}` を含まない |
| S-3 | `permissions:` の最小化 | `contents: read` のみ | write 権限なし。`pull-requests` / `issues` / `id-token` も付与しない |
| S-4 | `GH_TOKEN` / `GITHUB_TOKEN` の明示利用 | しない | checkout が default token のみで動作 |
| S-5 | Cloudflare / 1Password への接触 | しない | `scripts/cf.sh` / `op run` を呼ばない |
| S-6 | 外部 action の version pin | major tag pin（`@v4`）を採用 | 既存 ci.yml と整合 |
| S-7 | 出力 log への secret 漏洩リスク | なし | drift 出力は file 名のみで内容を dump しない |

### 5. a11y

CI gate であり UI 成果物を持たない。a11y 観点 N/A。Phase 12 で追記する CLAUDE.md
1 行は markdown であり、見出しレベル整合と list 構造のみ確認対象（Phase 12 で実施）。

### 6. GitHub Actions 無料枠（free-tier）見積もり

GitHub Free / Pro プラン: **2,000 minutes / 月**（private repo の Linux runner）。

| 項目 | 見積もり | 根拠 |
| --- | --- | --- |
| 1 PR あたりの所要時間 | **≤ 2 min** | checkout(5s) + pnpm setup(5s) + setup-node(10s) + pnpm install(60s, cache hit 時 15s) + indexes:rebuild(5s) + git diff(1s) + report(1s) ≒ 30〜90s |
| 1 PR あたりの起動回数 | 1 回（`pull_request` open + 必要に応じ synchronize で +N） | 平均 2〜3 回 / PR を見込む |
| 月間 PR 数（solo 開発前提） | ≤ 30 PR / 月 | feature/* → dev → main の 2 段ブランチ運用 |
| `push to main/dev` 起動 | merge 1 回ごと、約 30 回 / 月 | PR 数とほぼ同数 |
| **月間消費分数（保守的試算）** | **30 × 3 × 2 + 30 × 2 = 240 min / 月** | 全 PR が cache miss で 2 min を要した最悪ケース |
| **対 2,000 min 比率** | **≤ 12%** | 残り 88% は既存 4 workflow + 余裕 |
| **実態見積もり（cache hit 想定）** | 約 90 min / 月 | 1 起動 ≒ 45 秒（pnpm cache hit） |

判定: 無料枠に対し十分余裕。AC-3（false positive なし）に加えて運用上もコスト健全。

### 7. 認可境界

CI gate は read-only で D1 / 本番システムに触れない。認可境界の検査対象なし
（不変条件 #5 抵触なし）。

## 実行タスク

1. line budget Q-1〜Q-4 を `outputs/phase-09/main.md`
2. link チェック L-1〜L-5 を `outputs/phase-09/link-check.md`
3. mirror parity M-1〜M-4 を `outputs/phase-09/mirror-parity.md`
4. secret hygiene S-1〜S-7 を `outputs/phase-09/secret-hygiene.md`
5. free-tier 見積もりを `outputs/phase-09/free-tier.md`
6. a11y N/A 申し送りを main.md
7. 認可境界 N/A 申し送りを main.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 outputs/phase-05/main.md | step 数 / shell の最長行を実測する base |
| 必須 | Phase 8 outputs/phase-08/main.md | 命名・concurrency 確定 |
| 必須 | Phase 8 outputs/phase-08/navigation-drift.md | link 対象 N-1〜N-4 |
| 必須 | .github/workflows/ci.yml | secret hygiene の比較対象 |
| 参考 | https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration | free-tier 上限 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠運用の思想 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定の根拠（line budget / link / mirror / secret / 無料枠） |
| Phase 11 | 手動 smoke で実測（cache hit / miss の所要時間） |
| Phase 12 | navigation drift N-1〜N-4 を消化、L-1/L-2 を反映 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 無料枠 | #10 | 240 min / 月（最悪値）≤ 12% |
| boundary | #5 | D1 アクセスなし、`apps/api` / `apps/web` 改変なし |
| secret hygiene | — | `permissions: contents: read` のみ |
| mirror parity | — | `.claude` ↔ `.agents` への影響なし |
| navigation 整合 | — | L-1〜L-5 の dead link ゼロ |
| 不変条件全般 | #1〜#7 | 触れない |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | line budget Q-1〜Q-4 | completed |
| 2 | link チェック L-1〜L-5 | completed |
| 3 | mirror parity M-1〜M-4 | completed |
| 4 | secret hygiene S-1〜S-7 | completed |
| 5 | free-tier 見積もり | completed |
| 6 | a11y / 認可境界 N/A 申し送り | completed |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-09/main.md | 総括 + a11y / 認可境界 N/A |
| outputs/phase-09/link-check.md | L-1〜L-5 |
| outputs/phase-09/mirror-parity.md | M-1〜M-4 |
| outputs/phase-09/secret-hygiene.md | S-1〜S-7 |
| outputs/phase-09/free-tier.md | 無料枠見積もり |

## 完了条件

- [ ] Q-1〜Q-4 で line budget ≤ 60 行が成立する設計
- [ ] L-1〜L-5 全て alive
- [ ] M-1〜M-4 全て「parity 影響なし」と確定
- [ ] S-1〜S-7 全 PASS（permissions: contents: read のみ）
- [ ] 月間消費分数（最悪値）≤ 12%（240 min / 2000 min）
- [ ] a11y / 認可境界 N/A を明文化

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 completed
- [ ] outputs/phase-09/* 5 ファイル配置済み
- [ ] artifacts.json の Phase 9 を completed

## 次 Phase

- 次: Phase 10（最終レビュー）
- 引き継ぎ事項:
  - line budget / link / mirror / secret / 無料枠の 5 領域 全 PASS
  - free-tier 月間 12% 以下
  - mirror parity 影響なし（本タスクは indexes/ 自体の生成物には触れない）
- ブロック条件:
  - secret hygiene S-3 で `permissions` が write 化していたら Phase 5 戻し
  - free-tier 比率が 30% を超えたら Phase 2 設計戻し（trigger 削減検討）
