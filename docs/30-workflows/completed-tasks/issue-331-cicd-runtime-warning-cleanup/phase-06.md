# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 6 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 異常シナリオと対応

| ID | シナリオ | 期待挙動 | 対応 |
| --- | --- | --- | --- |
| E-1 | apps/api dry-run で別 warning が新規出現 | warning 内容を分類 | bindings 関連は Phase 2 結論に従い別タスク化 |
| E-2 | TOML parse エラー | wrangler が config invalid で fail | git revert + 構文確認 |
| E-3 | web-cd staging が `script not found` で fail | apps/web/wrangler.toml の `name` mismatch | `name` を staging script に合わせて編集 |
| E-4 | web-cd で API Token 認証失敗 | 401 / 10000 | environment scope と `CLOUDFLARE_API_TOKEN` の値を確認（実値は op に） |
| E-5 | OpenNext build が CI で失敗 | `.open-next/worker.js` 未生成 | build step の前段に明示的 `opennextjs-cloudflare build` を追加 |
| E-6 | staging Pages project が orphan 化 | 古い URL が 404 / 旧 build を返す | Phase 11 で削除手順を実行（CF dashboard / API） |
| E-7 | `CLOUDFLARE_PAGES_PROJECT` Variable 未参照化 | drift 警告 | Phase 12 で削除起票（本タスクスコープ外） |
| E-8 | `bash scripts/cf.sh` が CI ランナーで `op` 未認証 | scripts/cf.sh は CI では op を bypass する設計のため env 経由で Token を渡す | env 注入経路で `CLOUDFLARE_API_TOKEN` を export 済みであることを確認 |

## 検証コマンド

```bash
# E-2: TOML parse
node -e "require('@iarna/toml').parse(require('fs').readFileSync('apps/api/wrangler.toml','utf8'))"

# E-3: script name 確認
grep -E '^name\s*=' apps/web/wrangler.toml

# E-5: OpenNext build artifact 確認
ls -la apps/web/.open-next/worker.js apps/web/.open-next/assets/ 2>/dev/null
```

## ロールバック

| ステップ | コマンド |
| --- | --- |
| S1 ロールバック | `git restore apps/api/wrangler.toml`（コミット前）/ `git revert <commit>` |
| S2 ロールバック | 同上 |
| 本番影響時 | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env production` |

## 完了条件

- [ ] E-1〜E-8 が表化されている
- [ ] ロールバック手順が記載されている
- [ ] 検証コマンドが実行可能な形で示されている

## 成果物

- `outputs/phase-06/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

## 依存Phase参照

- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
