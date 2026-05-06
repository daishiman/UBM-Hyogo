# Phase 4 — 実装方針

**[実装区分: 実装仕様書]**

## 1. 実装ストラテジ

| 項目 | 方針 |
| --- | --- |
| 言語 | shell (POSIX) / YAML / Markdown のみ。TypeScript / Node 依存禁止（GitHub Actions runner 標準のみ使用） |
| エラー処理 | `set -euo pipefail` + 明示 `trap` |
| 冪等性 | 同タイトル open Issue 検索 → 存在すれば exit 0（成功扱い） |
| 認証 | `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`（追加 secret 不要） |
| ログ | `gh` CLI の標準出力をそのまま runner ログへ |

## 2. workflow YAML 設計方針

- **schedule**: `cron: '0 9 * * *'`（毎日 09:00 UTC = 18:00 JST）— release から D+7 / D+30 を経過した日のみ起票
- **workflow_dispatch**: `release_date` (`YYYY-MM-DD`) と `offset_days` (`7` または `30`) を input として受ける fallback 経路
- **permissions**: 最小権限 `issues: write` / `contents: read`
- **concurrency**: `group: post-release-obs-reminder`, `cancel-in-progress: false`（reminder の重複起票は冪等性で吸収）

## 3. shell 設計方針

`create-reminder-issue.sh` の責務分離:

| サブコマンド | 動作 |
| --- | --- |
| `--resolve-only` | 直近 production release を `gh api repos/$REPO/releases/latest` で取得し、今日が +7 / +30 か判定。`should_remind` / `offset` / `release_date` を `$GITHUB_OUTPUT` に書出。`workflow_dispatch` 入力があればそちら優先 |
| `--create` | `reminder-issue-template.md` の placeholders を envsubst で展開し、冪等性チェック後 `gh issue create` |
| `--dry-run` | `--create` と同じだが標準出力にレンダ結果を出すのみ。CI / local テスト用 |

placeholder（`reminder-issue-template.md`）:
- `{{RELEASE_DATE}}` / `{{OFFSET}}` / `{{TARGET_DATE}}`

## 4. runbook 設計方針

`docs/runbooks/post-release-long-term-observation.md` セクション構成:

1. 目的 / 適用条件
2. 観測指標表（D+7 / D+30 の閾値 — Phase 1 と完全一致）
3. 取得手順（Cloudflare dashboard / `wrangler d1 insights` / `gh run list` でログ取得）
4. 判定 / 異常時分岐（WARN / CRITICAL / silent）
5. rollback 経路（09c rollback runbook へのリンク）
6. postmortem テンプレ
7. 履歴（observation Issue リンク表 — 起票後追記運用）

## 5. SSOT 反映方針

`.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` は frontmatter:

```yaml
---
topic: post-release-long-term-observation
applies_to: operations / deployment
related_workflows:
  - 09c-serial-production-deploy-and-post-release-verification
  - issue-350-long-term-production-observation
runbook_canonical: docs/runbooks/post-release-long-term-observation.md
last_updated: 2026-05-06
---
```

本文: 参照導線（runbook / 仕様書 / 09c trace）の 1 ページ要約。**runbook は docs 側を正本**にし、ここでは要約 + リンクのみとする（重複維持コスト回避）。

## 6. テスト方針サマリ（Phase 6 に展開）

- actionlint で YAML 構文 / GitHub Actions semantics
- shellcheck で shell 構文
- `--dry-run` で local Issue body レンダ確認
- workflow_dispatch で開発リポでない fork 上の dry-run（オプション）

## 7. 想定リスク

| リスク | 対策 |
| --- | --- |
| GitHub release が production deploy と紐付かない | workflow_dispatch input で release_date を override 可能にする |
| schedule が runner 過負荷で skip | daily 起動なので翌日リカバリ |
| 同日に既存 reminder と新規 reminder が衝突 | タイトル一致冪等性で skip |
| permissions 不足で issue create 失敗 | `permissions:` 明示 + repo settings で Actions issue write 許可必須 |

## 8. 完了条件

- [ ] 言語 / エラー処理 / 冪等性 / 認証方針が確定
- [ ] workflow YAML / shell / runbook / SSOT の役割境界が確定
- [ ] テスト方針サマリと想定リスクが列挙済
