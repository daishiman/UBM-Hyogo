# Phase 10 — デプロイ / rollback / PR commit 戦略

## 1. デプロイ概要

本タスクは **テストファイル名規約変更** であり、runtime 成果物（`apps/web` の Workers bundle）には一切影響しない。よって **Cloudflare Workers / Pages への deploy は不要**。影響範囲は CI/CD パイプラインの test 実行 step と pre-commit / pre-push hook の glob、`apps/web/package.json:19` の `verify-design-tokens` script のみ。

| 項目 | 値 |
| --- | --- |
| Cloudflare Workers / Pages deploy | 不要（runtime 変更ゼロ） |
| D1 migration | 不要 |
| KV / R2 / Queue 変更 | 不要 |
| CI/CD パイプライン影響 | あり（`verify-design-tokens` script の参照ファイル名のみ） |
| lefthook 影響 | なし（`.test.` 直接参照ゼロ） |
| 想定 downtime | 0 秒（runtime 無影響） |

## 2. PR commit 戦略（3 commit / 1 PR）

`git mv` の意図と config 変更の意図を機械的に分離するため、1 PR を以下 3 commit で構成する。順序は固定。

### Commit 1: `refactor(web): rename *.test.ts(x) to suffix-classified *.spec.ts(x) (Refs #621)`

- 内容: `git mv` 70 件のみ
- diff filter: `git log -1 --diff-filter=R --summary HEAD` で 70 件すべてが rename (R) として現れ、Modified (M) / Added (A) / Deleted (D) が **0 件であること**
- `+`/`-` 行数: 0（rename のみ）
- レビュアーは次のコマンドで「rename commit pure」を機械確認できる:
  ```bash
  git log -1 --diff-filter=R --summary <commit-1-sha> | wc -l   # 70
  git diff --stat <commit-1-sha>~..<commit-1-sha>               # +/- 0
  git diff <commit-1-sha>~..<commit-1-sha> -- '*.spec.ts' '*.spec.tsx' | wc -l  # 0
  ```

### Commit 2: `chore(web): sync test glob to *.spec.ts(x) (Refs #621)`

- 内容: 以下ファイルの glob 同期のみ
  - `apps/web/package.json:19`（`verify-design-tokens` script の参照ファイル名）
  - `.github/workflows/ci.yml:159` 周辺コメント（該当時のみ）
- rename ファイル本文は触らない（diff 0 維持）
- レビュアー確認: `git diff <commit-2-sha>~..<commit-2-sha> -- 'apps/web/src/**'` が空であること

### Commit 3: `docs(web): add apps/web test file suffix ADR (Refs #621)`

- 内容: `outputs/phase-12/test-file-suffix-adr-apps-web.md` の追加 + Phase 12 系 evidence ファイル（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md）
- runtime / config に一切触らない

### 3 commit 分割の根拠

| 観点 | 根拠 |
| --- | --- |
| レビュー効率 | 「rename 部分は機械的（diff 0）」を一目で確認できる |
| rollback 性 | 万一の rollback 時、commit 1 のみ revert すれば内容変更を含まない元状態に戻せる |
| 責務分離 | rename の正しさ（commit 1）/ glob の追従（commit 2）/ ADR の文書化（commit 3）が独立して評価できる |
| squash 禁止 | merge 時に squash すると 3 commit 構造が失われる。merge commit 必須 |

## 3. rollback 戦略

### Pattern A: PR merge 前

ブランチを破棄するだけ:

```bash
git fetch origin dev
git reset --hard origin/dev
```

### Pattern B: PR merge 後（完全 rollback）

3 commit を逆順に revert:

```bash
git revert --no-edit <commit-3-sha>   # ADR
git revert --no-edit <commit-2-sha>   # config 同期
git revert --no-edit <commit-1-sha>   # rename
```

commit 1 は pure rename のため revert で `.test.ts(x)` 名に完全復元される。

### Pattern C: PR merge 後（部分 rollback）

ADR は残したいが rename を戻したい場合:

```bash
git revert --no-edit <commit-2-sha>   # config 同期を先に戻す
git revert --no-edit <commit-1-sha>   # rename を戻す
# commit 3（ADR）はそのまま残す
```

ADR が残ることで「規約は確定済み・実 rename だけ後追い」状態に戻る。再 rename PR が容易。

### Pattern D: 部分復旧（CSV と physical 乖離）

Phase 8 §2.2 を参照。CSV を再生成して残差のみ追加 rename する。

## 4. CI / hook の事前準備

| Hook / CI | 期待挙動 | 失敗時の対処 |
| --- | --- | --- |
| pre-commit `staged-task-dir-guard` | 70 件の rename を許容 | E-13（Phase 8）で hook 側を改善 |
| pre-commit `lefthook lint` | typecheck / lint 連動 | E-8 / E-9 で fix |
| pre-push `coverage-guard` | rename commit はrename commit pure → PASS | E-12 で hook 側改善 |
| CI `verify-design-tokens` (commit 1 push 時点) | 一時的に FAIL（commit 2 で復旧） | commit 1 単独 push を避け、commit 2 まで含めて push |
| CI `verify-indexes-up-to-date` | 影響なし（rename と無関係） | — |

`--no-verify` / `--no-gpg-sign` を使わない。

## 5. デプロイチェックリスト

- [ ] Cloudflare deploy 不要が明記されている
- [ ] 3 commit 構造（rename / config / ADR）が確定している
- [ ] commit 1 が pure rename（R100 のみ・diff 0）であることが assert される
- [ ] commit 2 が `apps/web/src/**` を触らないことが assert される
- [ ] squash merge 禁止・merge commit 採用が明記されている
- [ ] rollback 4 パターン（merge 前 / 完全 / 部分 / 部分復旧）が記述されている
- [ ] CI / hook の事前準備が網羅されている
