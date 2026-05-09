# Phase 4: テスト作成（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` / `phase-3.md` |
| 出力 | ローカル smoke テスト手順 / 閾値割れ再現テスト / dry-run コマンド集 |

---

## 0. 前提確認（着手前 必須チェック）

| # | チェック項目 | コマンド | 期待値 |
|---|-------------|----------|--------|
| P-01 | Stage 2 完了 | `cat docs/30-workflows/e2e-quality-uplift-stage-2/index.md \| grep -E 'Phase\s+13'` | `done` 表記 |
| P-02 | `pnpm --filter @ubm-hyogo/web build` green | `gh run list --workflow=pr-build-test.yml --branch=dev --limit=3` | 直近 3 run 全て `success` |
| P-03 | `dev` 現契約 contexts | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \| jq -r '.required_status_checks.contexts'` | `lighthouse-ci` を **含まない**（3c 未適用前提） |
| P-04 | Node / pnpm | `mise exec -- node -v && mise exec -- pnpm -v` | `v24.15.0` / `10.33.2` |

P-01 が NG なら本 Phase 以降を着手しない（CONDITIONAL GO 解消未達）。

---

## 1. 構文・schema 検証（事前 dry-run）

| # | 検証 | コマンド | 期待 |
|---|------|---------|------|
| T-01 | `lighthouserc.json` JSON 構文 | `jq . lighthouserc.json` | parse 成功 |
| T-02 | `lighthouserc.json` schema | `mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json` | exit 0 |
| T-03 | workflow YAML 構文 | `mise exec -- pnpm dlx actionlint .github/workflows/lighthouse.yml` | violation 0 |
| T-04 | route URL 列挙の重複なし | `jq '.ci.collect.url \| length, (. \| unique \| length)' lighthouserc.json` | 4 / 4（縮退時 3 / 3） |
| T-05 | `name:` と context 名一致 | `grep -E '^name:\s*lighthouse-ci' .github/workflows/lighthouse.yml` | hit 1 |
| T-06 | `jobs.<id>.name:` 一致 | `grep -E 'name:\s*lighthouse-ci' .github/workflows/lighthouse.yml \| wc -l` | >= 2（top-level + job-level） |

---

## 2. ローカル smoke テスト手順

### 2.1 ハッピーパス（4 routes 全 pass）

```bash
# 1) 依存インストール
mise exec -- pnpm install --frozen-lockfile

# 2) production build
mise exec -- pnpm --filter @ubm-hyogo/web build

# 3) サーバ起動（バックグラウンド）
mise exec -- pnpm --filter @ubm-hyogo/web start &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT

# 4) 起動完了待機
for i in {1..60}; do curl -fsS http://localhost:3000 >/dev/null && break; sleep 1; done

# 5) lhci autorun
mise exec -- pnpm exec lhci autorun --config=./lighthouserc.json
echo "exit=$?"

# 6) artifact 確認
ls -la .lighthouseci/lhr-*.html | wc -l   # >= 4 期待
```

### 2.2 期待結果

| # | 内容 | 期待 |
|---|------|------|
| T-07 | autorun exit code | 0 |
| T-08 | `.lighthouseci/lhr-*.html` 件数 | 4（縮退時 3） |
| T-09 | `.lighthouseci/assertion-results.json` の `failed` 件数 | 0 |

---

## 3. 閾値割れ再現テスト（assertion failure）

### 3.1 故意割れの作り方

`lighthouserc.json` の `assertions.categories:performance.minScore` を **一時的に 0.99 に書換** して autorun を実行する。実 perf スコア 0.80〜0.95 の前提下で必ず assertion が走り fail する。

```bash
# 一時的に閾値を 0.99 に変更
jq '.ci.assert.assertions["categories:performance"][1].minScore = 0.99' lighthouserc.json > /tmp/lhci-fail.json

# fail 期待で実行
mise exec -- pnpm exec lhci autorun --config=/tmp/lhci-fail.json
echo "exit=$?"   # 期待: 1
```

### 3.2 期待結果

| # | 内容 | 期待 |
|---|------|------|
| T-10 | autorun exit code | 1（assertion failure） |
| T-11 | stdout に `Failed assertion` または同等の文字列 | 1 件以上 hit |
| T-12 | `.lighthouseci/assertion-results.json` の `failed` 件数 | 1 件以上 |

### 3.3 evidence 保存

```bash
mise exec -- pnpm exec lhci autorun --config=/tmp/lhci-fail.json 2>&1 \
  | tee outputs/phase-11/lighthouse-fail.log
```

---

## 4. negative test（縮退分岐 Q-02）

### 4.1 `/profile` 未認証 a11y 実測

```bash
# 3 連続計測
mise exec -- pnpm exec lhci collect \
  --url=http://localhost:3000/profile \
  --numberOfRuns=3 \
  --settings.preset=desktop
```

| # | 内容 | 判定 |
|---|------|------|
| T-13 | a11y score 中央値 >= 0.90 | 4 routes 維持 |
| T-14 | a11y score 中央値 < 0.90 | 3 routes に縮退（lighthouserc から `/profile` 削除） |

### 4.2 縮退時の lighthouserc 差分

```diff
   "url": [
     "http://localhost:3000/",
     "http://localhost:3000/members",
-    "http://localhost:3000/profile",
     "http://localhost:3000/login"
   ],
```

---

## 5. テスト方針サマリ

| カテゴリ | 内容 | 実行タイミング |
|----------|------|---------------|
| 構文検証 | T-01..T-06 | Phase 5 実装直後 / Phase 9 品質保証 |
| ローカル smoke | T-07..T-09 | Phase 5 実装直後 / Phase 11 |
| 閾値割れ再現 | T-10..T-12 | Phase 11 evidence 取得時 |
| 縮退判定 | T-13..T-14 | Phase 7 実測時 |

---

## 6. 入出力

| 入力 | 出力 |
|------|------|
| `lighthouserc.json`（Phase 5 産物） | `.lighthouseci/lhr-*.html`、`.lighthouseci/assertion-results.json` |
| `.github/workflows/lighthouse.yml`（Phase 5 産物） | check-run `lighthouse-ci`、artifact `lhci-report-${{ github.sha }}` |

---

## 7. ローカル実行コマンド一覧（集約）

```bash
# 構文検証
jq . lighthouserc.json
mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json
mise exec -- pnpm dlx actionlint .github/workflows/lighthouse.yml

# smoke
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start &
for i in {1..60}; do curl -fsS http://localhost:3000 >/dev/null && break; sleep 1; done
mise exec -- pnpm exec lhci autorun --config=./lighthouserc.json
```

---

## 8. exit criteria（Phase 4 完了条件）

| # | 条件 |
|---|------|
| E-01 | T-01..T-06 の検証手順が確定 |
| E-02 | T-07..T-09 の smoke コマンドが確定 |
| E-03 | T-10..T-12 の閾値割れ再現コマンドが確定 |
| E-04 | T-13..T-14 の Q-02 縮退判定手順が Phase 7 へ引き継がれている |

---

## 9. 引き継ぎ（Phase 5 へ）

| 項目 | 内容 |
|------|------|
| 新規ファイル | `lighthouserc.json` / `.github/workflows/lighthouse.yml` |
| 編集ファイル | `apps/web/package.json` / `pnpm-lock.yaml` |
| 依存追加 | `@lhci/cli@^0.14.0`（apps/web devDependencies） |
| 自己テスト | 本 Phase §2 / §3 をそのまま流用 |

---

## DoD（Phase 4 完了条件）

| # | 条件 |
|---|------|
| D-01 | T-01..T-14 全て実行可能なコマンドで記述済 |
| D-02 | smoke / failure / 縮退 の 3 系統がカバーされている |
| D-03 | evidence 保存パス（`outputs/phase-11/lighthouse-fail.log`）が確定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 4
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

Phase 5 実装に対する受入テストを smoke / failure / 縮退の 3 系統で確定する。

## 実行タスク

- 構文検証 / smoke / failure / 縮退の 4 系統を T-01..T-14 で網羅。
- ローカル実行コマンドを集約。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-4.md §1
- phase-1.md / phase-2.md / phase-3.md（本サブタスク内）

## 実行手順

1. P-01..P-04 で着手前提確認。
2. T-01..T-06 構文 dry-run 仕様化。
3. T-07..T-09 smoke 手順化。
4. T-10..T-12 failure 再現手順化。
5. T-13..T-14 縮退判定を Phase 7 に引き継ぐ。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- Phase 11 evidence 計画

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
