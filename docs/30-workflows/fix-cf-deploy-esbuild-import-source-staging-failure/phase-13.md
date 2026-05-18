# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | 12 (正本同期) |
| 次 Phase | なし |

## 目的

CLAUDE.md「PR 作成の完全自律フロー」に従い、本タスクの PR を作成する。
PR 本文は Phase 12 `implementation-guide.md` を直接転記する。

## commit メッセージ案

```
fix(deps): bump pnpm.overrides.esbuild to 0.27.3 to unblock Cloudflare deploys

wrangler 4.85.0 が内部で要求する esbuild 0.27.x の "supported.import-source"
feature 名を、override 0.25.4 が parse できず web-cd / backend-ci の deploy が
全 env で失敗していた。override を wrangler 同梱版に整合させ、deploy 経路を復旧する。

- package.json: pnpm.overrides.esbuild "0.25.4" → "0.27.3"
- pnpm-lock.yaml: pnpm install --force で再生成
- (条件付) scripts/cf.sh: nested esbuild が hoisted 化された場合の fallback 拡張

Spec: docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## PR タイトル案

```
fix(deps): bump esbuild override to unblock Cloudflare deploy
```

## PR 本文テンプレ（`.claude/commands/ai/diff-to-pr.md` 準拠）

```markdown
## Summary

- `pnpm.overrides.esbuild` を `0.25.4` → `0.27.3` に bump し、wrangler 4.85.0 の `supported.import-source` feature を esbuild が parse できるようにする
- `pnpm-lock.yaml` を `pnpm install --force` で再生成
- `web-cd / deploy-staging` と `backend-ci / deploy-staging` の `"import-source" is not a valid feature name` エラーを解消

## Background

wrangler 4.85.0 は内部で esbuild 0.27.x を要求する。一方ルート `package.json` の
`pnpm.overrides.esbuild` は 0.25.4 にピン留めされており、pnpm overrides の transitive 強制で
wrangler の nested esbuild も 0.25.4 にダウングレードされていた。`supported: { "import-source": ... }`
build option は 0.25.5 以降の feature 名で、0.25.4 では parse error になり deploy 不能になっていた。

override の存在意義は `scripts/cf.sh` コメントの通り「OpenNext / wrangler 間の host/binary mismatch
対策」のため、削除ではなく wrangler 同梱版への bump で対処した。

## Changes

- `package.json`: `pnpm.overrides.esbuild` を `0.27.3` に bump
- `pnpm-lock.yaml`: `pnpm install --force` で再生成
- （適用された場合）`scripts/cf.sh`: `ESBUILD_BINARY_PATH` 解決の fallback を hoisted esbuild にも対応

## Verification

ローカル:

- `mise exec -- pnpm typecheck`: PASS
- `mise exec -- pnpm lint`: PASS
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web build`: PASS

CI:

- `web-cd / deploy-staging`: <Run URL>
- `backend-ci / deploy-staging`: <Run URL>

## Rollback

`docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/outputs/phase-10/rollback.md` 参照。
- 範囲 1: Cloudflare version 直前へ rollback
- 範囲 2: override を `0.25.4` に戻し `pnpm install --force`
- 範囲 3: wrangler 4.92.0 採用時のみ workflow 4 箇所を 4.85.0 に戻す
- 範囲 4: `scripts/cf.sh` 拡張を git revert

## Follow-up

- `outputs/phase-12/unassigned-task-detection.md` は新規未タスク 0 件。build-only gate は既存 PR build / Cloudflare build gate と Phase 11 evidence で扱う。

## Spec

`docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/`

## Test plan

- [ ] PR push 後、`web-cd / deploy-staging` が緑
- [ ] PR push 後、`backend-ci / deploy-staging` が緑
- [ ] dev マージ後、`web-cd / deploy-production` / `backend-ci / deploy-production` も緑（main へのリリース時）
```

## PR 作成コマンド（参考）

```bash
gh pr create --base dev --title "fix(deps): bump esbuild override to unblock Cloudflare deploy" --body "$(cat <<'EOF'
...（上記テンプレ）...
EOF
)"
```

## 振り返り観点

| 観点 | 記録項目 |
| --- | --- |
| 原因切り分け時間 | エラーメッセージから esbuild feature 名 → リリースノート → override 値の連鎖を辿る時間 |
| 修正 PR サイズ | package.json 1 行 + pnpm-lock.yaml |
| 再発防止 | 既存 PR build / Cloudflare build gate と Phase 11 evidence を利用し、追加 unassigned-task は作らない |
| ドキュメント変更 | scripts/cf.sh コメント追従更新の必要性 |

## 実行タスク

- [ ] commit / push / PR 作成（user-gated）
- [ ] PR Run の staging 2 job 緑化を確認
- [ ] `outputs/phase-13/pr-summary.md` に PR URL と振り返りを記載

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-summary.md | PR URL / commit メッセージ / 振り返り |

## 完了条件

- [ ] PR URL が記録されている
- [ ] staging 2 job が緑化済
- [ ] 振り返りが記載されている

## ブロック条件

- Phase 12 strict 7 outputs に欠落がある場合は実行しない
- ローカル検証（Phase 5 / 9）が PASS していない場合は実行しない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
