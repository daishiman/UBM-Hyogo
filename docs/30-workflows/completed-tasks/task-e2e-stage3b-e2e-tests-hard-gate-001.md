# e2e-tests.yml hard gate 化 + monocart-reporter 統合 + coverage-gate-e2e.sh 実装 - タスク指示書

## メタ情報

| 項目             | 内容                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| タスクID         | task-e2e-stage3b-e2e-tests-hard-gate-001                                            |
| タスク名         | e2e-tests.yml hard gate 化 + monocart-reporter 統合 + coverage-gate-e2e.sh 実装     |
| 分類             | CI / CD ハードゲート整備 / coverage 計測パイプライン                                |
| 対象機能         | `.github/workflows/e2e-tests.yml` / `apps/web/playwright.config.ts` / coverage gate |
| 優先度           | HIGH                                                                                |
| 見積もり規模     | 中規模                                                                              |
| ステータス       | 未実施 (proposed)                                                                   |
| 親タスク         | e2e-quality-uplift-stage-3                                                          |
| サブタスク識別子 | Stage 3 サブタスク 3b                                                               |
| taskType         | implementation                                                                      |
| visualEvidence   | NON_VISUAL                                                                          |
| 発見日           | 2026-05-09                                                                          |
| 発見元           | e2e-quality-uplift-stage-3 phase-12 hand-off pending                                |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

e2e-quality-uplift Stage 2 で apps/web E2E のスケルトン（auth fixture / public-flow / profile-visibility-request / profile-delete-request）と Stage 2 の coverage 70% 達成までは実装済み。一方、Stage 3 hand-off で「CI 上で `pnpm e2e` が hard gate として PR を block する」ところまでは未連結であり、現状の `.github/workflows/e2e-tests.yml` は soft（advisory）モードに留まっている。

具体的には:

- `pnpm e2e` 実行が CI で fail しても PR merge を block していない
- E2E line coverage が 70% を割っても fail にならない（gate スクリプト未実装）
- `monocart-reporter` 未導入で、Playwright run から `coverage/e2e/coverage-summary.json` が出力されない
- HTML report / coverage 成果物が `actions/upload-artifact` で外部参照できない

### 1.2 問題点・課題

- Stage 2 で整備した critical-route smoke が「壊れていても気付けない」状態のまま PR が merge される
- coverage 70% baseline（`quality-gates.md §7.5` standard tier）が CI で機械的に保証されない
- 障害再現のため Playwright の HTML report を後追いしたいが、artifact 化されておらず CI ログのみで分析することになる
- Stage 3c（branch protection 適用）に進む前提条件である「CI required check name の確定」が未達

### 1.3 放置した場合の影響

- Stage 2 で投資した E2E スケルトンが回帰検知に寄与せず、Stage 3 の投資対効果が損なわれる
- coverage<70% を見逃した PR が merge され、quality-gates.md §7.5 standard tier に対する drift が累積する
- Stage 3c で branch protection に required check として追加する name（`e2e-tests / hard-gate` 等）が定まらず、後続作業が block される

---

## 2. 何を達成するか（What）

### 2.1 目的

`.github/workflows/e2e-tests.yml` を hard gate 化し、`pnpm e2e` 実行 + line coverage<70% / critical-route smoke fail を PR merge を block する fail 条件として CI に組み込む。`monocart-reporter` で coverage を計測し、`scripts/coverage-gate-e2e.sh` で閾値判定する。

### 2.2 最終ゴール（AC 引用）

`docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md` の AC を引用する。

- **AC-02**: `pnpm e2e` 実行で critical-route smoke が fail した場合、CI workflow が exit≠0 を返し PR merge を block する。
- **AC-03**: `apps/web/playwright.config.ts` の reporter に `monocart-reporter` を追加し、`coverage/e2e/coverage-summary.json`（line / branch / function / statement の summary）が生成される。
- **AC-04**: `scripts/coverage-gate-e2e.sh` が `coverage/e2e/coverage-summary.json` を読み、`line < 70%` の場合に exit 1 を返す。CI で artifact（HTML report + coverage-summary.json）が `actions/upload-artifact@v4` で upload される。

### 2.3 検証エビデンス

- dummy PR で `coverage-summary.json` の `total.lines.pct` を **69%** に書き換え、CI が `coverage-gate-e2e.sh` で fail することを観測（再現手順は §3.5 参照）
- critical-route smoke を 1 件意図的に fail させ、`e2e-tests.yml` が exit≠0 で job 失敗することを観測
- `coverage/e2e/coverage-summary.json` が `monocart-reporter` から生成されること（artifact ダウンロードで確認）

### 2.4 スコープ

#### 含むもの

- `.github/workflows/e2e-tests.yml` の hard gate 化（major edit）
- `apps/web/playwright.config.ts` の reporter swap（既存 `html` / `json` / `list` に `monocart-reporter` を追加）
- `scripts/coverage-gate-e2e.sh` 新規作成（jq ベース・bash）
- CI artifact upload（`actions/upload-artifact@v4`、HTML report + coverage-summary.json + Playwright trace）
- `apps/web/package.json` への `monocart-reporter` 追加

#### 含まないもの

- **Stage 3a（lighthouse-ci 導入）はこのタスクの対象外**
- **Stage 3c（branch protection への required check 追加 / dev / main protection JSON 更新）はこのタスクの対象外**
- 新規 critical-route smoke の追加（Stage 2 で確定した route セットを利用）
- Vitest unit coverage gate の改修（task-e2e-playwright-coverage-001 系列の議論は維持）

### 2.5 成果物

- `.github/workflows/e2e-tests.yml`（new major edit）
- `apps/web/playwright.config.ts`（reporter array swap）
- `scripts/coverage-gate-e2e.sh`（新規 / 実行権限付与）
- `apps/web/package.json` に `monocart-reporter` を `devDependencies` 追加
- `pnpm-lock.yaml` 更新（`monocart-reporter` 解決）
- Phase 11 evidence: `outputs/phase-11/evidence/{e2e-list.txt, e2e-run.txt, e2e-skip-count.txt, runner-version.txt}`（CONST_007 single cycle に従い canonical path のみ）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- e2e-quality-uplift Stage 2 が完了し、`pnpm --filter @ubm-hyogo/web e2e` ローカル実行で全 critical-route smoke が green であること
- `coverage/e2e/` が `.gitignore` に追加されていること（`coverage/` 既存除外で OK の場合は追加不要）
- `pnpm typecheck` / `pnpm lint` が dev branch 同期後に green

### 3.2 依存関係

- **depends-on**: `e2e-quality-uplift-stage-2`（coverage 70% 達成 + critical-route smoke 整備）
- **blocks**: `e2e-quality-uplift-stage-3c`（branch protection への required check 追加）
- **関連**: `task-08b-flaky-test-retry-strategy-001`（retry 戦略との整合）/ `task-09a` 系列（Cloudflare Workers staging で E2E を流す履歴）

### 3.3 critical-route smoke 対象 route（Stage 2 整備済み）

`apps/web/playwright/tests/` 配下の以下を critical-route と見なす:

| Route                          | spec ファイル                          | 用途                    |
| ------------------------------ | -------------------------------------- | ----------------------- |
| `/`（公開トップ）              | `public-flow.spec.ts`                  | 公開ディレクトリ smoke  |
| `/(public)/members`            | `public-flow.spec.ts`                  | members 一覧 smoke      |
| `/(public)/members/[id]`       | `public-flow.spec.ts`                  | members 詳細 smoke      |
| `/profile`（visibility 変更）  | `profile-visibility-request.spec.ts`   | 会員 self-service       |
| `/profile`（delete 申請）      | `profile-delete-request.spec.ts`       | 会員 self-service       |

これらが `e2e-tests.yml` の hard gate 対象。`@critical` tag を付与して `--grep @critical` で限定実行する場合も Stage 2 の合意に従う（Stage 2 の `outputs/phase-12/main.md` を参照）。

### 3.4 coverage 計測パイプライン

```
playwright test
  └── monocart-reporter（V8 coverage を Chromium から収集）
        └── coverage/e2e/coverage-summary.json（istanbul-compatible summary）
              └── scripts/coverage-gate-e2e.sh
                    └── jq で .total.lines.pct を抽出 / 70 と比較
                          └── line<70 なら exit 1
```

#### 3.4.1 `apps/web/playwright.config.ts` reporter 例

`apps/web/playwright.config.ts:15-19` の `reporter` array に `monocart-reporter` を追加する想定（既存 `html` / `json` / `list` は維持し、coverage 経路のみ追加）。

```ts
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'playwright-report/results.json' }],
  ['list'],
  ['monocart-reporter', {
    name: 'apps/web E2E',
    outputFile: 'playwright-report/monocart/index.html',
    coverage: {
      reports: [
        ['v8'],
        ['json-summary', { file: '../coverage/e2e/coverage-summary.json' }],
        ['lcov'],
      ],
      entryFilter: { '**/node_modules/**': false },
      sourceFilter: { 'apps/web/src/**': true },
    },
  }],
],
```

> 厳密な API は `monocart-reporter` 公式 README に従って Phase 7 で確定する。

#### 3.4.2 `scripts/coverage-gate-e2e.sh` 想定

```bash
#!/usr/bin/env bash
set -euo pipefail
SUMMARY="${1:-coverage/e2e/coverage-summary.json}"
THRESHOLD="${E2E_COVERAGE_LINE_THRESHOLD:-70}"
if [[ ! -f "$SUMMARY" ]]; then
  echo "[coverage-gate-e2e] missing $SUMMARY" >&2
  exit 1
fi
PCT=$(jq -r '.total.lines.pct' "$SUMMARY")
awk -v p="$PCT" -v t="$THRESHOLD" 'BEGIN { exit !(p+0 < t+0) }' \
  && { echo "[coverage-gate-e2e] line=$PCT < $THRESHOLD%, FAIL"; exit 1; } \
  || { echo "[coverage-gate-e2e] line=$PCT >= $THRESHOLD%, PASS"; exit 0; }
```

> しきい値は `quality-gates.md §7.5` standard tier = 70% を正本とし、独自しきい値を持たない。`E2E_COVERAGE_LINE_THRESHOLD` env はエスケープ用 override であり、CI の通常運用で値を変更しない。

### 3.5 dummy PR で coverage<70% を再現する手順

1. branch を `feat/dummy-coverage-gate-check` で切る
2. critical-route smoke の 1 ファイル冒頭に `test.skip(...)` を 2〜3 件追加し coverage を 69% 程度まで意図的に下げる、または直接 `coverage/e2e/coverage-summary.json` を `total.lines.pct=69` で artifact mock し gate スクリプトを単独実行する
3. push → e2e-tests.yml が `coverage-gate-e2e.sh` で exit 1 → PR が `e2e-tests / hard-gate` required check fail を表示することを確認
4. Stage 3c で branch protection に追加する required check name はこの PR で観測した job name に揃える
5. dummy 変更は revert（merge しない）

### 3.6 CI artifact upload

- `actions/upload-artifact@v4` で以下を upload:
  - `apps/web/playwright-report/`（HTML report 一式）
  - `apps/web/coverage/e2e/coverage-summary.json`
  - `apps/web/playwright-report/monocart/`
  - `apps/web/test-results/`（failure 時の trace / video）
- retention は CI ポリシー既定（30 日）に従う

### 3.7 ローカル検証手順

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web e2e
mise exec -- bash scripts/coverage-gate-e2e.sh apps/web/coverage/e2e/coverage-summary.json
```

---

## 4. 苦戦箇所【記入必須】

### 4.1 monocart-reporter と既存 Vitest coverage の二重計測競合

- Vitest は `coverage/` 直下に出力する設定（task-e2e-playwright-coverage-001 系列）。一方 monocart-reporter も `coverage/` を出力先として既定で取りに来るため、`coverage/e2e/` のサブディレクトリに分離して衝突回避する必要がある。
- CI で `pnpm test` と `pnpm e2e` が同一 job 内で順次実行される場合、後勝ちでファイルが上書きされないか checkout 前後の clean 戦略を確認すること。

### 4.2 Cloudflare Workers staging 環境での E2E 実行（task-09a 履歴参照）

- `@opennextjs/cloudflare` が Edge runtime を要求するため、ローカル `next dev` と Cloudflare Workers staging で挙動差（KV / D1 binding mock 戦略）が出る。
- CI では Cloudflare staging を直接叩かず、`pnpm --filter @ubm-hyogo/web preview`（OpenNext build + miniflare）で擬似環境を立ち上げる前提で組む。`wrangler` 直叩き禁止 / `scripts/cf.sh` 経由を遵守。

### 4.3 flaky test retry 戦略（task-08b-flaky-test-retry-strategy-001 と整合）

- Playwright の `retries: 2` を CI 時のみ有効化する設定は task-08b の合意に従う。critical-route smoke は flaky を許容しないため、retry 後も fail なら hard gate fail とする。
- monocart-reporter の coverage 集計が retry 試行と整合するかは Phase 7 で確認する。

### 4.4 coverage<70% を意図的に再現する dummy PR の作り方

- 真に coverage を下げるには smoke を skip する必要があるが、skip は `e2e-skip-count.txt` evidence に出てくるため、Phase 11 evidence の skip count drift にならないよう dummy PR は merge しない（push 後 close）。
- 推奨は `coverage/e2e/coverage-summary.json` を `total.lines.pct=69` で artifact mock し `coverage-gate-e2e.sh` 単独テストを CI 上で観測する経路。これなら critical-route smoke の skip を増やさずに gate fail を観測できる。

### 4.5 required check name 確定

- `e2e-tests.yml` の job 名 / step 名で workflow run 上の表示が決まる。Stage 3c で branch protection に追加する required status check 名と job 名の文字列一致が必須なため、命名は Phase 7 で 1 度だけ確定し、後続の rename を避ける。推奨: workflow name `e2e-tests` / job name `hard-gate` → check name `e2e-tests / hard-gate`。

---

## 5. 影響範囲

| パス                                       | 変更内容                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| `.github/workflows/e2e-tests.yml`          | major edit（advisory → hard gate, artifact upload 追加）|
| `apps/web/playwright.config.ts`            | reporter array に `monocart-reporter` 追加             |
| `scripts/coverage-gate-e2e.sh`             | 新規作成（実行権限付与）                                |
| `apps/web/package.json`                    | `monocart-reporter` を devDependencies に追加          |
| `pnpm-lock.yaml`                           | 自動更新                                                |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/` | canonical evidence 4 点更新 |

---

## 6. 推奨タスクタイプ

implementation / NON_VISUAL（CI workflow / shell script / config 編集のみで UI 描画変更を含まない）

---

## 7. 不変条件

1. **`wrangler` 直叩き禁止**: CI / ローカル双方で Cloudflare CLI は `bash scripts/cf.sh` 経由のみ。今回 staging 直叩きは行わないが、`scripts/cf.sh` を呼ぶ箇所が出た場合のみ適用。
2. **E2E coverage 70% は `quality-gates.md §7.5` standard tier 正本**: `coverage-gate-e2e.sh` のしきい値はこの正本値に従い、独自値を持たない。`E2E_COVERAGE_LINE_THRESHOLD` env override は緊急エスケープ専用。
3. **CONST_007 single cycle**: Phase 11 evidence は canonical path 1 セットのみ。複数 cycle 化を避ける。
4. **Phase 11 evidence canonical**:
   - `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/e2e-list.txt`
   - `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/e2e-run.txt`
   - `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/e2e-skip-count.txt`
   - `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/evidence/runner-version.txt`
5. **既存 API endpoint surface 不変**: 本タスクは CI / config / script のみで、`apps/api` の endpoint 追加・schema 変更を伴わない。
6. **OKLch トークン正本化**: 本タスクは UI を編集しないが、副次的な UI 変更は禁止（NON_VISUAL の維持）。
7. **D1 直接アクセス禁止**: `apps/web` から D1 を叩く差分を生まない。

---

## 8. 参照情報

- 仕様根拠: `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md`
- AC 根拠: 同 stage AC-02 / AC-03 / AC-04
- 関連: `quality-gates.md §7.5` standard tier = 70%
- フォーマット参照: `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md`
- 現状 reporter 構成: `apps/web/playwright.config.ts:15-19`（`html` / `json` / `list`）
- monocart-reporter: https://github.com/cenfun/monocart-reporter
- 関連スキル: `task-specification-creator` / `aiworkflow-requirements`

---

## 9. 備考

- Stage 3a（lighthouse-ci）/ Stage 3c（branch protection）と並行実行可能だが、3c は本タスク完了後に required check name が確定するため後続。
- monocart-reporter 採用の根拠は「Playwright 公式 trace の再生 + V8 coverage の istanbul 互換 summary 出力を 1 reporter で賄える」点。`@playwright/test` 標準には coverage 集計機能がないためサードパーティ reporter が必須。
- `coverage-gate-e2e.sh` は意図的に bash + jq + awk のみで構成し、Node ランタイム非依存にする（CI shell から最短経路で実行可能）。
