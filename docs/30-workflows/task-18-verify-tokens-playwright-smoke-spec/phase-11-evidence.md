[実装区分: 実装仕様書]

# Phase 11: Evidence 収集（VISUAL_ON_EXECUTION 区分）

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 11 / 13 |
| 名称 | `outputs/phase-11/` への evidence・screenshot 配置 / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING 判定 |
| 依存 (前) | Phase 9（ローカル log）/ Phase 10（branch protection JSON） |
| 依存 (後) | Phase 12（ドキュメント更新） |
| 想定工数 | 0.1 人日 |
| 区分 | VISUAL_ON_EXECUTION（実 runtime 完了をもって PASS 昇格） |

## 2. ゴール / 非ゴール

### ゴール
1. `outputs/phase-11/` canonical paths に main.md + evidence ファイル群を配置
2. Playwright report (HTML / JSON) を CI artifact upload で参照可能にし、ローカル抜粋を `evidence/` に保管
3. 4 png baseline が `apps/web/tests/e2e/visual/__screenshots__/**` に commit 済みであることを確認
4. PR 状態を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で記録（runtime green で `PASS` 昇格）

### 非ゴール
- runtime green までの待機（CI 結果は Phase 13 PR 作成後の状況遷移）
- baseline 画像の意図的更新（付録 A 例外運用）

## 3. 変更対象ファイル

| パス | 種別 | 説明 |
|------|------|------|
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-11/main.md` | new | Phase 11 メインレポート |
| `outputs/phase-11/evidence/typecheck.log` | new | Phase 9 ステップ 1 log |
| `outputs/phase-11/evidence/lint.log` | new | Phase 9 ステップ 2 log |
| `outputs/phase-11/evidence/test.log` | new | Phase 9 ステップ 4 vitest log |
| `outputs/phase-11/evidence/verify-tokens.log` | new | Phase 9 ステップ 3 log |
| `outputs/phase-11/evidence/e2e-smoke.log` | new | Phase 9 ステップ 5 log |
| `outputs/phase-11/evidence/e2e-visual.log` | new | Phase 9 ステップ 6 log |
| `outputs/phase-11/evidence/branch-protection-main-before.json` | new | Phase 10 read-only before |
| `outputs/phase-11/evidence/branch-protection-main-after.json` | new | Phase 10 mutation 後（user 承認後） |
| `outputs/phase-11/evidence/branch-protection-dev-before.json` | new | 同上 (dev) |
| `outputs/phase-11/evidence/branch-protection-dev-after.json` | new | 同上 (dev) |
| `outputs/phase-11/evidence/playwright-report.json` | new | `apps/web/playwright-report/results.json` をコピー |

## 4. canonical paths と main.md 構造

### 4.1 ディレクトリレイアウト

```
docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-11/
├── main.md
└── evidence/
    ├── typecheck.log
    ├── lint.log
    ├── test.log
    ├── verify-tokens.log
    ├── e2e-smoke.log
    ├── e2e-visual.log
    ├── playwright-report.json
    ├── branch-protection-main-before.json
    ├── branch-protection-main-after.json
    ├── branch-protection-dev-before.json
    └── branch-protection-dev-after.json
```

### 4.2 main.md セクション構成

| セクション | 内容 |
|-----------|------|
| §1 サマリ | task-18 完了判定 / 区分 VISUAL_ON_EXECUTION |
| §2 ローカル検証結果 | 6 ログの行数・exit code・抜粋 |
| §3 baseline 画像 | 4 png のパス・サイズ・OS（ubuntu-latest 想定） |
| §4 branch protection | before/after JSON への参照と diff |
| §5 状態判定 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を明示し、runtime green 後の昇格条件 |
| §6 残課題 | 該当なしの場合は「なし」と明記 |

## 5. 手順 / コマンド

### 5.1 evidence ディレクトリ作成

```bash
WF=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-11
mkdir -p "$WF/evidence"
```

### 5.2 ローカル log を canonical paths にコピー

```bash
cp /tmp/task-18-evidence/typecheck.log       "$WF/evidence/typecheck.log"
cp /tmp/task-18-evidence/lint.log            "$WF/evidence/lint.log"
cp /tmp/task-18-evidence/test.log            "$WF/evidence/test.log"
cp /tmp/task-18-evidence/verify-tokens.log   "$WF/evidence/verify-tokens.log"
cp /tmp/task-18-evidence/e2e-smoke.log       "$WF/evidence/e2e-smoke.log"
cp /tmp/task-18-evidence/e2e-visual.log      "$WF/evidence/e2e-visual.log"
cp apps/web/playwright-report/results.json   "$WF/evidence/playwright-report.json"
cp /tmp/task-18-evidence/branch-protection-main-before.json "$WF/evidence/"
cp /tmp/task-18-evidence/branch-protection-main-after.json  "$WF/evidence/"
cp /tmp/task-18-evidence/branch-protection-dev-before.json  "$WF/evidence/"
cp /tmp/task-18-evidence/branch-protection-dev-after.json   "$WF/evidence/"
```

### 5.3 4 png baseline の commit 確認

```bash
git ls-files apps/web/tests/e2e/visual/__screenshots__/ | wc -l   # 4 を期待
git ls-files apps/web/tests/e2e/visual/__screenshots__/
```

期待出力（順不同）:
```
apps/web/tests/e2e/visual/__screenshots__/login.spec.ts/login.png
apps/web/tests/e2e/visual/__screenshots__/public-top.spec.ts/public-top.png
apps/web/tests/e2e/visual/__screenshots__/admin-dashboard.spec.ts/admin-dashboard.png
apps/web/tests/e2e/visual/__screenshots__/profile.spec.ts/profile.png
```

### 5.4 CI artifact upload 参照ポイント

`.github/workflows/playwright-smoke.yml` の以下 step が evidence の正本となる:

| step | artifact 名 | 内容 |
|------|------------|------|
| smoke job の `Upload report` | `playwright-smoke-report` | `apps/web/playwright-report/` 全体（HTML report + results.json） |
| visual job の failure 時 | `visual-diff` | `apps/web/test-results/` 配下の diff png |

main.md §3 に「runtime 上の artifact は GitHub Actions の該当 run 画面から取得可能」と明記し、URL は PR 作成後に追記する。

## 6. 状態判定

| 状態 | 条件 |
|------|------|
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | ローカル 6 コマンド全 exit 0 / 4 baseline commit 済み / branch protection 3 本追加済み / CI 上の実 run はこれから（Phase 13 後） |
| `PASS` | 上記 + PR 上で `verify-design-tokens / verify-design-tokens` / `playwright-smoke / smoke (chromium)` / `playwright-smoke / visual (chromium, 4 screens)` の 3 本が green |
| `FAIL` | いずれかの CI gate が red、または local 検証で再現不能な failure を残したまま PR を上げた状態 |

Phase 11 時点では `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を main.md に明記する。

## 7. ローカル実行コマンド

```bash
# evidence をまとめる
WF=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-11
mkdir -p "$WF/evidence"
cp /tmp/task-18-evidence/*.log  "$WF/evidence/"
cp /tmp/task-18-evidence/*.json "$WF/evidence/"
cp apps/web/playwright-report/results.json "$WF/evidence/playwright-report.json"

# baseline commit 確認
git ls-files apps/web/tests/e2e/visual/__screenshots__/

# evidence 一覧
ls -la "$WF/evidence/"
```

## 8. DoD チェックリスト

- [ ] `outputs/phase-11/main.md` を §1〜§6 で記載
- [ ] `evidence/` 配下に 11 ファイル（log 6 + playwright-report.json 1 + branch-protection JSON 4）配置
- [ ] 4 png baseline が `git ls-files` で確認できる
- [ ] main.md §5 に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を明示
- [ ] CI artifact upload 参照ポイント（artifact 名 2 種）を main.md §3 に記載
- [ ] 機密値（Secrets 実値・auth トークン）が evidence に含まれていないことを `grep -E '(session-token|TOKEN=)' evidence/*` 等で確認
