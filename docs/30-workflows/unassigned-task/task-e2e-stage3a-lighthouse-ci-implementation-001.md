# Stage 3 サブタスク 3a — Lighthouse CI 導入（実装着手用未タスク仕様書）

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-e2e-stage3a-lighthouse-ci-implementation-001                     |
| タスク名     | e2e-quality-uplift Stage 3a — Lighthouse CI 導入（並走実装）          |
| 分類         | CI gate 追加 / Performance & Accessibility 自動測定                   |
| 対象機能     | `.github/workflows/lighthouse.yml` / `lighthouserc.json` / `apps/web` 主要 4 routes |
| 優先度       | HIGH                                                                  |
| 推奨 Wave    | 後続即時（Stage 2 完了直後・3b / 3c と並走可能）                      |
| 見積もり規模 | 中規模                                                                |
| ステータス   | 未実施 (proposed)                                                     |
| 親タスク     | e2e-quality-uplift-stage-3                                            |
| 発見元       | e2e-quality-uplift-stage-3 `index.md` AC-01..AC-06 / `phase-12.md` の `lighthouse-ci` context 追記要件 |
| 発見日       | 2026-05-09                                                            |
| taskType     | implementation                                                        |
| visualEvidence | NON_VISUAL（Lighthouse JSON / lhci log のみ。スクリーンショット不要） |
| workflow_state | spec_verified_pending_dependency（親 Stage 3 が pending implementation）|

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`docs/30-workflows/e2e-quality-uplift-stage-3/index.md` は `workflow_state: spec_verified` / `evidence_state: runtime_pending` で確定しているが、Stage 3 全体としては **branch protection 適用（3c）まで含む単一 PR scope** として組成されているため、3a / 3b / 3c の順序依存が直列化しがちで実装着手が遅れる。

3a「Lighthouse CI 導入」は branch protection への追加 (3c) と切り離して **PR to `dev` で先行運用可能** な独立単位（owning unit）であり、Stage 3 全体着手前に並走実装することで critical path を短縮できる。

### 1.2 問題点・課題

- 現状 `.github/workflows/` 配下に `lighthouse.yml` が存在せず、perf / a11y / best-practices / seo の自動測定が不在
- `apps/web` の主要 4 routes（`/`, `/(public)/members`, `/profile`, `/login`）に対する数値 baseline が未取得で、回帰検知が人手レビュー任せ
- Stage 3 が未着手のままだと、Stage 0-2 で整備した E2E / coverage 資産が **数値 SLA を伴わない soft gate** に留まる
- Cloudflare Workers + `@opennextjs/cloudflare` 経由の Next.js は preview deploy URL 取得タイミングが特殊で、安定取得手順を別タスクで先行検証しないと 3 全体がブロックされる

### 1.3 放置した場合の影響

- perf / a11y 退行（hydration コスト増・無意味な layout shift・aria 欠落）が PR 時点で検知できず本番反映後に発覚する
- Stage 3 が直列着手のまま膨らみ、`required_status_checks.contexts` 更新（3c）まで一括 PR 化することで diff が肥大化しレビュー困難になる
- `phase-12.md` 1.2 で正本化される `lighthouse-ci` context が CLAUDE.md 文書化先行 / 実体未稼働の drift 状態を生む

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web` の Cloudflare Workers preview deploy 上で Lighthouse CI を実行し、4 routes に対する perf / a11y / best-practices / seo の閾値を **PR fail 可能な assertion** として CI 上に常駐させる。

本タスクのスコープでは branch protection への context 追加は行わず、**PR to `dev` の job として常時実行（required 化は 3c に委譲）** する形で運用開始する。

### 2.2 最終ゴール（AC）

| # | 受入基準 | 検証 |
|---|----------|------|
| AC-01 | `.github/workflows/lighthouse.yml` が PR to `dev` 時に起動し、`/`, `/(public)/members`, `/profile`, `/login` の 4 routes に対し Lighthouse run を実行する | `gh pr checks` で `lighthouse-ci` job が見える |
| AC-02 | `lighthouserc.json` で `categories:performance >= 0.80` / `accessibility >= 0.90` / `best-practices >= 0.90` / `seo >= 0.80` を assertion し、しきい値割れで step が `failure` を返す | dummy PR で a11y 違反を仕込み job fail を観測 |
| AC-03 | Lighthouse JSON / HTML レポートが `actions/upload-artifact@v4` で取得可能（保管期間 14 日以上） | `gh run download` で artifact 取得 |
| AC-04 | `main` への PR では実行しない（dev 経由で通過済み前提）— `on.pull_request.branches: [dev]` のみで起動条件を限定 | workflow YAML で `branches: [dev]` を確認 |
| AC-05 | Stage 3 親 index.md の AC-01 / EX-01..EX-05 と整合（しきい値・対象 routes・PR fail 挙動） | 親 index.md と本タスクの対応表で trace |
| AC-06 | `wrangler` 直叩きを workflow 内で行わない（preview URL 取得は GitHub deploy status / Cloudflare Pages preview comment / `scripts/cf.sh` のいずれかに限定） | workflow YAML grep で `wrangler ` 直接行が 0 |

### 2.3 成果物

- `.github/workflows/lighthouse.yml`（新規）
- `lighthouserc.json`（新規・リポジトリルート）
- `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/lhci-baseline.log`（4 routes baseline）
- `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/lhci-thresholds.json`（しきい値スナップショット）

---

## 3. スコープ（含む / 含まない）

### 3.1 含むもの

- `.github/workflows/lighthouse.yml` の新規作成（`pull_request` trigger / `branches: [dev]`）
- `lighthouserc.json` の新規作成（4 routes / 4 categories assertion）
- preview deploy URL を取得する step 設計（GitHub deployment status または Cloudflare Pages preview comment 解析）
- baseline 計測 evidence の取得と Stage 3 phase-11 evidence への保存
- workflow が PR で fail することの dry-run 検証

### 3.2 含まないもの（理由付き）

- `dev` / `main` の branch protection `required_status_checks.contexts` への `lighthouse-ci` 追加 → **3c の所掌**。本タスクでは job 追加のみで required 化はしない
- `e2e-tests.yml` の hard gate 化 / `monocart-reporter` 導入 / coverage line gate 70% → **3b の所掌**
- CLAUDE.md の `required_status_checks.contexts` 正本表更新 → 3c で `gh api` 適用と同時に行う
- 4 routes 以外（管理画面群 / register / privacy / terms）への展開 → MVP recovery 完了後に別タスク化
- Visual regression / Chromatic 等の導入 → スコープ外（別 workflow）

---

## 4. どのように実行するか（How）

### 4.1 前提条件

- Stage 2 完了済み（critical-route smoke / coverage 70% baseline 整備済み）
- `apps/web` の Cloudflare Workers preview deploy が PR 時に自動構築される（既存 CI）
- `scripts/cf.sh` が利用可能で `wrangler` 直叩きを置換できる

### 4.2 推奨アプローチ

1. **Step 1: preview URL 取得手段の決定**
   既存 CI の Cloudflare Pages / Workers preview deploy の output 形式を確認。`actions/github-script` で deployment status / PR comment から preview URL を抽出する step を試作する。
2. **Step 2: `lighthouserc.json` 作成**
   ```json
   {
     "ci": {
       "collect": {
         "url": [
           "${PREVIEW_URL}/",
           "${PREVIEW_URL}/members",
           "${PREVIEW_URL}/profile",
           "${PREVIEW_URL}/login"
         ],
         "numberOfRuns": 3
       },
       "assert": {
         "assertions": {
           "categories:performance": ["error", {"minScore": 0.8}],
           "categories:accessibility": ["error", {"minScore": 0.9}],
           "categories:best-practices": ["error", {"minScore": 0.9}],
           "categories:seo": ["error", {"minScore": 0.8}]
         }
       },
       "upload": {"target": "temporary-public-storage"}
     }
   }
   ```
3. **Step 3: `.github/workflows/lighthouse.yml` 作成**
   - `on.pull_request.branches: [dev]` のみ
   - `permissions: pull-requests: write / deployments: read`
   - `treosh/lighthouse-ci-action@v12` を使用
   - artifact upload step で JSON / HTML を保存
4. **Step 4: dry-run**
   閾値割れを意図的に仕込んだ PR を立て、`lighthouse-ci` job が `failure` になることを確認。
5. **Step 5: baseline evidence**
   閾値割れ修正後の合格 PR で 4 routes の baseline JSON を `phase-11/evidence/` に保存。

### 4.3 実装注意点

- `pnpm` / Node 24 を `mise exec --` 経由で実行する（CLAUDE.md 不変条件）。
- `${PREVIEW_URL}` の取得失敗時は job を `cancelled` ではなく `failure` で終了させる（silent skip 禁止）。
- Lighthouse の `numberOfRuns: 3` で中央値判定とし、flaky な perf score の影響を抑制する。

---

## 5. 苦戦箇所【記入必須】

- 対象: `.github/workflows/lighthouse.yml`（新規作成予定）/ Cloudflare Workers preview deploy URL の取得 step
- 症状（projected struggles）:
  - **(a) preview URL の取得タイミング**: Cloudflare Workers + `@opennextjs/cloudflare` の preview deploy は GitHub deployment event 着信より遅延することがあり、`needs:` のみで wait させると undefined のまま lhci に渡って即 fail する
  - **(b) SPA hydration 待機**: Next.js App Router の hydration 完了前に Lighthouse が collect すると perf score が安定しない。`waitForUrl` / `settings.onlyCategories` だけでは不十分なケースがある
  - **(c) a11y 違反 baseline**: 既存 prototype 由来の `aria-label` 欠落 / contrast 不足が `accessibility >= 0.90` を満たさない可能性。Stage 3a 着手時点での baseline を 1 度測定し、満たさなければ閾値割れを `apps/web` 側 fix で先行解消する必要がある
  - **(d) `error.tsx` / `not-found.tsx` の干渉**: `/profile` / `/login` 未認証時の redirect が Lighthouse の URL collect 結果と乖離するため、認証バイパス手段（既存 e2e fixture / cookie 注入）を流用する必要がある
- 参照:
  - `docs/30-workflows/e2e-quality-uplift-stage-3/index.md` AC-01 / 不変条件 §3
  - `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md` 1.2 表（`lighthouse-ci` context）
  - `apps/web/playwright/fixtures/auth.ts`（auth bypass の既存実装）

---

## 6. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Cloudflare preview deploy URL 取得遅延で `${PREVIEW_URL}` が未定義になる | 高 | deployment status を polling する step を `actions/github-script` で追加し、最大 N 分 wait → timeout 時は `failure` で fail-fast |
| `accessibility >= 0.90` が prototype 由来 baseline で満たせない | 高 | 着手前に 1 度 baseline を取り、未達 route があれば 3a の前段に小タスク（a11y fix）を切り出す |
| `numberOfRuns: 3` でも perf score が flaky | 中 | 中央値ベース assertion・`throttlingMethod: simulate` 固定・CI runner spec を `ubuntu-latest` で固定 |
| `wrangler` 直叩きを誤って混入 | 中 | workflow YAML lint で `grep -E "^\s*wrangler "` を 0 件確認する CI step を追加 |
| `main` への PR で重複実行される | 中 | `on.pull_request.branches: [dev]` を厳守。`if: github.base_ref == 'dev'` を job 条件にも二重化 |
| solo dev policy（`required_pull_request_reviews=null`）の drift | 高 | 本タスクは context 追加（3c）を行わないため drift 発生余地なし。誤って branch protection を編集しないことを PR description に明記 |
| 認証必須 route（`/profile`）の Lighthouse 計測失敗 | 中 | e2e fixture で発行する session cookie を Lighthouse の `extraHeaders` 経由で注入する |

---

## 7. 検証方法

### 7.1 単体検証

```bash
# lighthouserc.json の構文検証
mise exec -- npx --yes @lhci/cli@latest assert --config=lighthouserc.json --dry-run

# workflow YAML の構文検証
mise exec -- npx --yes @action-validator/cli .github/workflows/lighthouse.yml
```

期待: 両コマンドとも exit 0。

### 7.2 統合検証（CI 上）

1. dummy PR (`feat/test-lighthouse-fail`) を `dev` 宛てに立てる
2. 意図的に a11y 違反（ボタンの `aria-label` 削除等）を `apps/web` に仕込む
3. `gh pr checks <PR>` で `lighthouse-ci` job が `failure` になることを確認
4. 違反を revert し、再 push で `success` になることを確認
5. `gh run download <run-id>` で Lighthouse JSON / HTML artifact を取得

期待:
- 違反入り PR → `lighthouse-ci` = `failure`
- 違反 revert PR → `lighthouse-ci` = `success`
- artifact に `lhr-*.json` / `lhr-*.html` が 4 routes × 3 runs 分含まれる

### 7.3 evidence 保存

```bash
mkdir -p docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/
gh run download <success-run-id> -D docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/lhci/
```

期待: `lhci-baseline.log` / `lhci-thresholds.json` が成果物として保存される。

---

## 8. 影響範囲

- `.github/workflows/lighthouse.yml`（新規）
- `lighthouserc.json`（新規・リポジトリルート）
- `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/`（baseline 追加）
- 既存 `apps/web` の a11y 違反が見つかった場合のみ最小修正（HEX 直書き禁止 / OKLch tokens 維持）
- `package.json`（`@lhci/cli` を devDependency に追加する場合）

---

## 9. 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | Stage 2 完了（coverage 70% / critical-route smoke） | 完了 |
| depends-on | Stage 3 spec（`docs/30-workflows/e2e-quality-uplift-stage-3/index.md` / `phase-12.md`） | spec_verified |
| depends-on | Cloudflare Workers preview deploy が PR 時に有効 | 確認済み |
| blocks | 3c（branch protection contexts に `lighthouse-ci` を追加する作業） | — |
| 関連 | 3b（`e2e-tests-coverage-gate` 追加）— 並走可能だが context 追加の最終 PR は 3c でまとめる | — |

---

## 10. 不変条件（Stage 3 固有 + プロジェクト共通）

1. solo dev policy: `required_pull_request_reviews=null` を保持。本タスクで branch protection を編集しない。
2. `lock_branch=false` / `enforce_admins=true` を drift させない（本タスクの編集対象外）。
3. Lighthouse CI は **PR to `dev`** のみで実行する（`main` PR では重複しない）。
4. `wrangler` 直叩きを workflow 内で禁止。Cloudflare CLI が必要な場合は `bash scripts/cf.sh` 経由で実装する。
5. coverage gate しきい値は `.claude/skills/task-specification-creator/references/quality-gates.md §7.5` の standard tier = 70% を正本とし、本タスクで独自しきい値を定義しない（lhci のしきい値は別系統）。
6. `apps/web` の色は OKLch tokens 正本（`apps/web/src/styles/tokens.css`）に準拠し、a11y fix で contrast 修正する場合も HEX 直書きを禁止。

---

## 11. システム仕様反映

### 11.1 反映先

| 反映先 | 内容 | タイミング |
|--------|------|-----------|
| `docs/00-getting-started-manual/specs/` | 直接の追記なし（CI workflow は specs ではなく workflows 配下管理） | 不要 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.json` | `lighthouse-ci` topic を追加（参照: 親 phase-12.md 3.2） | 3c 完了時に併せて反映 |
| `.claude/skills/task-specification-creator/references/quality-gates.md` | Lighthouse しきい値の正本記載（perf 80 / a11y 90 / best-practices 90 / seo 80） | 3a merge 時に同 PR で追記 |
| `CLAUDE.md` の `required_status_checks.contexts` 表 | `lighthouse-ci` 行は **3c 完了時に追加**。本タスクでは未追記 | 3c で対応 |

### 11.2 参照スキル

- `aiworkflow-requirements`: `topic-map.json` 更新の整合確認
- `task-specification-creator`: `unassigned-task-required-sections.md` の 4 必須セクション準拠
- `github-issue-manager`: 3c 着手時に Issue 化する場合の参照

---

## 12. 推奨タスクタイプ

implementation / NON_VISUAL（CI workflow 追加・JSON evidence のみで visual regression 観点を含まない）

---

## 13. 参照情報

- 親 spec: `docs/30-workflows/e2e-quality-uplift-stage-3/index.md`
- Phase 12 反映先: `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md`
- 必須セクション定義: `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md`
- フォーマット参考: `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md`
- branch protection 正本: `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`
- Lighthouse CI Action: `treosh/lighthouse-ci-action@v12`
- `@lhci/cli` 公式 docs: https://github.com/GoogleChrome/lighthouse-ci

---

## 14. 備考

- 本タスクは Stage 3 全体の `spec_verified_pending_dependency` を解消する **owning unit** として切り出されている。3a 完了後、3b（e2e hard gate）/ 3c（branch protection contexts 更新）が順次着手可能になり、Stage 3 全体の critical path が短縮される。
- 着手前に必ず baseline を 1 度取得し、`accessibility >= 0.90` 未達 route があれば 3a に小 fix を含めて吸収するか、別タスクとして切り出す判断を行う（後者の場合は本ファイルに後続未タスクへのリンクを追記）。
- PR は `dev` 宛て・solo policy（必須レビュアー 0）に従い CI gate 通過のみで merge 可能。`--no-verify` の使用は禁止。
