# Phase 12 成果物: system-spec-update-summary

aiworkflow-requirements 側の正本仕様更新を Step 別に記録する。

## Step 1-A: 完了タスク記録（aiworkflow-requirements ledger 同期）

| 対象 | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` | ADR-0001 を正式配置。Status = Accepted、Decision = Workers cutover |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Phase 12 close-out 記録（task id / spec_created / 関連 ADR 配置先） |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Phase 12 close-out 記録（同上） |
| `.claude/skills/aiworkflow-requirements/indexes/*` | `generate-index.js` 実行で deploy-target / ADR-0001 キーワードを再生成 |

## Step 1-B: 実装状況テーブル更新

| 項目 | 値 |
| --- | --- |
| 本タスクのステータス | **`spec_created`**（`completed` にしない。実 cutover は別タスク） |
| 関連実装タスク `task-impl-opennext-workers-migration-001` | unassigned のまま（本 ADR 採択により blocks 解除可能状態） |

## Step 1-C: 関連タスクテーブル更新

| タスク | 旧ステータス | 新ステータス（current facts 2026-05-01） |
| --- | --- | --- |
| `task-impl-opennext-workers-migration-001` | unassigned（2026-04-28 起票） | unassigned 維持（本 ADR で blocks 解除条件確定） |
| `UT-GOV-006-web-deploy-target-canonical-sync` | completed | completed 維持（本 ADR-0001 を sync 対象 list に追加する 1 行更新） |

## Step 2: stale contract withdrawal / 正本同期（必須実施）

> **発火根拠**: 新規 API / 型追加ではないが、Pages / Workers topology drift と stale contract withdrawal を扱うため Step 2 を実施。docs-only タスクの close-out で Step 2 を N/A にしない（spec ルール）。

| 対象ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 判定表「現状 (2026-05-01)」を `wrangler.toml = Workers / web-cd.yml = Pages drift 残` に更新。**stale contract withdrawal**: 「wrangler.toml は Pages 形式」記述を撤回 |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | Web フロントエンドの platform と CD フローを ADR-0001 ベースに更新し、`web-cd.yml` Pages deploy 残を migration task へ委譲 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | CD 要件に ADR-0001 current facts を追記し、Workers deploy への置換責務を明記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | ADR-0001 への接続記述追加 |
| `CLAUDE.md` | base case = cutover につき変更不要（Workers 表記維持） |

### canonical 表現（base case 切替に堅牢な記述）

ADR Decision 採択（cutover）と矛盾せず、保留 / 段階移行を再採択した場合も書き直しが最小化されるよう、判定表は以下構造で更新：

```markdown
| ファイル | 現状 (2026-05-01) | 将来 (ADR-0001 採択後) | 根拠 |
| --- | --- | --- | --- |
| apps/web/wrangler.toml | Workers 形式（main + [assets]） | Workers 形式維持 | ADR-0001 |
| .github/workflows/web-cd.yml | Pages 形式（pages deploy） | Workers 形式（deploy --env） | ADR-0001 / migration-001 |
| CLAUDE.md L19/L37 | Workers 表記 | Workers 表記維持 | ADR-0001 |
```

## 完了確認

- [x] Step 1-A: 完了タスク記録 + LOGS×2 + topic-map
- [x] Step 1-B: 実装状況 = `spec_created`
- [x] Step 1-C: 関連タスク 2 件 current facts 同期
- [x] Step 2: stale contract withdrawal + 正本同期（発火根拠明記）
