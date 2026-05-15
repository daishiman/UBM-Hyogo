# Phase 13 — PR 作成（ユーザー明示承認 gate）

> ⚠️ **commit / push / `gh pr create` はユーザーの明示的な承認後にのみ実行する**（CLAUDE.md / CONST_002 / skill 共通ルール）。
> 本 phase は **予約テンプレート**。実コード・Phase 11 evidence・Phase 12 strict 7 runtime close-out が未生成の間、PR body の checkboxes は未完了のまま扱う。
> Issue 参照方針: `Refs #667`（CLOSED のまま reopen しない / `Closes` 禁止）

## メタ情報

| key | value |
|-----|-------|
| Phase | 13 |
| Phase Name | PR 作成（approval-gated） |
| 作成日 | 2026-05-14 |
| 前 Phase | 12 |
| 次 Phase | なし（本 workflow close-out） |
| 承認形態 | 三役ゲート（commit / push / PR create を個別承認） |
| PR base | `dev`（CLAUDE.md 既定） |

## 1. PR base ブランチ

| 環境 | base | 適用条件 |
|------|------|---------|
| 通常 | `dev` | 本 workflow（feature → dev） |
| production リリース時のみ | `main` | 本 workflow では適用しない |

## 2. ブランチ命名

`feat/e2e-stage3b-mock-api-fixture-coverage-issue-667`

（または `feat/issue-667-stage3b-mock-api-fixture-coverage`）

## 3. commit 粒度方針（4 concern × 1 commit 基準）

Phase 2 の concern A-D に対応し、revert 単位 = commit 単位を保つ。レビュー / 部分 rollback の容易性を優先する。

| # | 粒度 | 含むファイル例 | revert 影響範囲 |
|---|------|---------------|----------------|
| 1 | concern A: `packages/contracts/` 新設 | `packages/contracts/package.json` / `tsconfig.json` / `plain ESM .mjs exports` / `src/**` / `vitest.config.ts` / `pnpm-workspace.yaml` 編集 / `apps/{api,web}/package.json` の dep 追加 | contracts package 不在に戻る |
| 2 | concern B: `scripts/e2e-mock-api.mjs` 拡張 | `scripts/e2e-mock-api.mjs` 単体差分 | mock のみ revert（旧 463 行に戻る） |
| 3 | concern C: 契約テスト | `scripts/__tests__/e2e-mock-api.contract.spec.ts` / vitest config 調整 | contract test のみ revert |
| 4 | concern D: workflow patch + docs | `.github/workflows/e2e-tests.yml` patch + `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/**` + `outputs/**` + aiworkflow-requirements 同期差分 + LOGS row | CI 健全化 + docs のみ revert |

### 代替: 1 まとめ commit を選ぶ基準

以下を **全て満たす** 場合に限り、4 concern を 1 まとめ commit にしてよい:

- concern A-D の差分が相互依存（contract test は contracts package と mock 拡張が同時にないと PASS しない）
- レビュアー（solo dev のため自己レビュー）が「分割すると中間 commit が CI red」と判断
- PR description に「単一 commit で完結。部分 revert 時は `git revert --no-commit <SHA>` + ファイル単位 reset 推奨」を明記

## 4. PR title

```
feat(e2e): stage3b mock-api fixture coverage (issue-667)
```

## 5. PR body テンプレ（Refs #667 / Closes 禁止）

```markdown
## Summary

- `packages/contracts/` を新設し、API / mock / web で共有する zod schema の SSOT を確立
- `scripts/e2e-mock-api.mjs` を拡張: 全 endpoint 網羅、`schema.parse()` 必須化、`{ok:true}` fallthrough 廃止、`/health` 追加
- `scripts/__tests__/e2e-mock-api.contract.spec.ts` を新設: mock 起動 → 全 endpoint へ HTTP → web 側 schema で再 parse
- `.github/workflows/e2e-tests.yml` に readiness wait (`curl --retry`) + `actions/upload-artifact@v4` (retention 7 日) を追加
- seed canonical 値を `packages/contracts/src/fixtures.mjs` に集約 (member 3 / zone 2 / membership 2 / negative case / tag facet 2)

詳細は `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-12/implementation-guide.md` 参照。

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/contracts test` completed (local evidence, coverage ≥80%)
- [ ] `mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts` completed (local evidence)
- [ ] `curl -i http://127.0.0.1:8787/health` → HTTP/1.1 200
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium` 既存 spec 全件 green
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] CI `ci.yml` test job（contract test 含む）completed (PR 作成後)
- [ ] CI `e2e-tests` 全 matrix PASS（PR 作成後）
- [ ] CI `verify-test-suffix` PASS
- [ ] CI `coverage-guard` PASS

## 不変条件チェック

- [ ] `apps/api` ↔ `apps/web` 循環参照なし（contracts 経由のみ）
- [ ] mock は D1 を一切触らない
- [ ] `apps/web/src` 配下に `127.0.0.1:8787` の焼き込みなし（task-18 grep gate）
- [ ] mock 全レスポンスが `schema.parse()` を通過
- [ ] 新規 fixture 追加なし（Playwright 3 ロール固定）
- [ ] seed canonical を `packages/contracts/src/fixtures.mjs` に集約
- [ ] workflow_state vocabulary は canonical のみ（`spec_created` / `runtime_pending` / `completed`）

## Evidence

- Local 8 evidence: `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-11/evidence/`
- Phase 12 strict 7 outputs: `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-12/`
- Artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory.md`

Refs: #667 (CLOSED 2026-05-14, 後追い適用), #650 (3b parent), #203 (template hardening)
```

> **Closes / Fixes / Resolves は使用禁止**。Issue #667 は CLOSED のまま、本 PR は後追い適用として `Refs #667` のみ。

## 6. CI gate 確認項目（PR 作成後の必須 status check）

| Gate name | 確認内容 | 失敗時の rollback |
|-----------|---------|------------------|
| `ci / test` | Vitest 全 completed（contract test 含む） | concern A or C を revert |
| `e2e-tests / e2e (chromium)` | Playwright desktop-chromium 全 PASS | concern B（mock dispatcher 差分）を revert |
| `e2e-tests / e2e (firefox)` | 同上 firefox | 同上 |
| `e2e-tests / e2e (webkit)` | 同上 webkit | 同上 |
| `verify-test-suffix` | `.spec.{ts,tsx}` のみ（`.test.*` 禁止） | 該当 spec を rename |
| `coverage-guard` | `bash scripts/coverage-guard.sh` exit 0 | coverage 不足箇所に test 追記 |
| `verify-indexes-up-to-date` | aiworkflow-requirements indexes drift なし | `pnpm indexes:rebuild` を別 commit で追加 |

## 7. rollback 戦略

| 失敗パターン | rollback 対象 | コマンド例 |
|--------------|--------------|-----------|
| contract test red | `packages/contracts/` パッケージ全体 | `git revert <commit-A-SHA>` |
| E2E regression（chromium / firefox / webkit いずれか） | `scripts/e2e-mock-api.mjs` のみ | `git revert <commit-B-SHA>`（concern B 単独 revert） |
| CI readiness wait timeout | `.github/workflows/e2e-tests.yml` のみ | `git revert <commit-D-SHA>` の部分適用 |
| coverage 不足 | 追加 test commit | revert せず test 追記 commit を push |

## 8. 三役ゲート（合算承認禁止）

| Gate | 内容 | 承認形態 | Claude の挙動 |
|------|------|---------|---------------|
| G1 | commit（ローカル mutation） | ユーザー明示承認後に `git add` + `git commit` | 承認前は commit しない |
| G2 | push（リモート mutation） | ユーザー明示承認後に `git push -u origin <branch>` | 承認前は push しない |
| G3 | PR 作成（GitHub mutation） | ユーザー明示承認後に `gh pr create` | 承認前は実行しない |

> 「いいよ」「OK」程度の曖昧合意では実行しない。`outputs/phase-13/change-summary.md` を提示した上で、各 gate ごとに individual な明示文言（例: 「G1 approve」「G2 approve」「G3 approve」）を要件とする。

## 9. Issue #667 のクローズ状態

- 本 PR で **Issue クローズ状態を変更しない**（CLOSED のまま）
- Issue 本文の参照パス更新（例: 「実装は workflow `issue-667-stage3b-mock-api-fixture-coverage` で完了」コメント追加）は **後段で提案するに留め、Phase 13 内では実施しない**
- `gh issue comment #667` は CI runtime PASS 確定後の Phase 13 後段で別途実行候補

## 10. Phase 13 必須成果物 4 点

| 必須成果物 | パス | 役割 |
|------------|------|------|
| local check 結果 | `outputs/phase-13/local-check-result.md` | typecheck / lint / vitest / coverage-guard のローカルログ要約 |
| 変更サマリー | `outputs/phase-13/change-summary.md` | G1-G3 承認前にユーザー提示。commit 粒度 / 含めるファイル一覧 / PR title・body |
| PR 情報 | `outputs/phase-13/pr-info.md` | PR URL / CI 結果 / Issue 参照 |
| PR 作成プロセスログ | `outputs/phase-13/pr-creation-result.md` | commit SHA list / push 結果 / `gh pr create` API response |

## 11. PR 作成コマンド（G3 承認後にのみ実行）

```bash
git push -u origin feat/e2e-stage3b-mock-api-fixture-coverage-issue-667

gh pr create --base dev \
  --title "feat(e2e): stage3b mock-api fixture coverage (issue-667)" \
  --body "$(cat <<'EOF'
[§5 の本文を貼り付け]
EOF
)"
```

## 完了条件

- [ ] commit 粒度方針が §3 で確定（4 concern 別 commit か 1 まとめ commit か明示）
- [ ] PR title / body / base ブランチが §4 / §5 / §1 と整合
- [ ] CI gate 確認項目 §6 を 7 件すべてマーク
- [ ] rollback 戦略 §7 が全失敗パターンをカバー
- [ ] 三役ゲート §8 を G1-G3 個別承認形態で記載
- [ ] Issue #667 のクローズ状態を変更しない方針を §9 で明記
- [ ] Phase 13 必須成果物 4 点を §10 で予約配置
- [ ] `Refs #667` のみ使用、`Closes` 禁止を §5 / §9 で重複明記

## やってはいけないこと

- 合算承認（「G1-G3 全部 approve」）を受け付ける
- `Closes #667` / `Fixes #667` / `Resolves #667` を PR body に書く
- ユーザー明示承認前に `git commit` / `git push` / `gh pr create` を実行する
- `--no-verify` で pre-commit / pre-push hook をスキップする
- CI gate 未確認のまま merge を促す
- Issue #667 を reopen する

## 次 Phase

なし。CI runtime completed 後に Phase 12 `compliance-check.md` を `completed (runtime PASS)` 状態へ昇格させ、本 workflow を close-out する。
