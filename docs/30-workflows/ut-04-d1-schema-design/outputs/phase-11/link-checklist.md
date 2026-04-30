# Phase 11 成果物 — リンク / 配線チェックリスト（NON_VISUAL）

> NON_VISUAL タスクのため screenshot 検証は不要。
> 本チェックリストは workflow 内リンク・正本仕様参照・migration / runbook 参照の整合を検証する代替 evidence。

## L1: workflow 内リンク（UT-04 自タスク Phase 間整合）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| L1-1 | phase-11.md「実行手順」 | outputs/phase-05/implementation-runbook.md | ✅ 参照あり |
| L1-2 | phase-11.md「manual evidence」 | outputs/phase-11/manual-smoke-log.md §1〜§7 | ✅ 1:1 対応 |
| L1-3 | phase-12.md「引き継ぎ」 | outputs/phase-11/main.md 既知制限 #1/#4/#5 | ✅ 委譲先明示 |
| L1-4 | phase-07.md AC matrix | outputs/phase-11/manual-smoke-log.md（AC 証跡列） | ✅ smoke 列に紐付く |

## L2: 正本仕様 / skill references

| # | 参照先 | 用途 | 状態 |
| --- | --- | --- | --- |
| L2-1 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | DDL 正本（Step 1-A 同期先） | ✅ 実在 |
| L2-2 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | scripts/cf.sh / wrangler 操作正本 | ✅ 実在 |
| L2-3 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-link-checklist.md` | NON_VISUAL evidence プレイブック | ✅ 実在 |
| L2-4 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | spec_created / docsOnly の落とし穴 | ✅ 参照済 |
| L2-5 | `CLAUDE.md`（ルート） | scripts/cf.sh ラッパー利用ルール | ✅ 厳守 |

## L3: migration / runbook 参照

| # | 参照先 | 用途 | 状態 |
| --- | --- | --- | --- |
| L3-1 | outputs/phase-02/ | DDL 設計成果物 | ⏳ 仕様化のみ（spec PR 段階） |
| L3-2 | outputs/phase-03/ | Sheets→D1 マッピング表 | ⏳ 仕様化のみ |
| L3-3 | outputs/phase-05/implementation-runbook.md | dev / production 適用手順 | ⏳ 仕様化のみ |
| L3-4 | apps/api/migrations/0001_init.sql | 実 DDL ファイル | 🚫 本 PR 非混入（実装 PR で commit） |
| L3-5 | apps/api/wrangler.toml `[[d1_databases]]` | binding 名 / database_id | ⏳ 既存 / 実装 Phase で確認 |

## L4: 参照リンク検証コマンド

```bash
# workflow 内 / 正本仕様への参照網羅
rg -n "outputs/phase-02|database-schema|deployment-cloudflare|apps/api/migrations" \
   docs/30-workflows/ut-04-d1-schema-design

# scripts/cf.sh 経由必須 / wrangler 直呼び 0 件確認（spec 文書内）
rg -n "wrangler\s+d1" docs/30-workflows/ut-04-d1-schema-design \
  | grep -v "scripts/cf.sh" \
  | grep -v "wrangler 直接呼び出し" \
  | grep -v "禁止" || echo "OK: wrangler 直呼び 0 件"
```

| 検証 | 期待 | 実行状態 |
| --- | --- | --- |
| 参照網羅 | 上記 L1〜L3 が全て hit | TBD（実 commit 後に確認） |
| wrangler 直呼び 0 | grep 結果が `OK:` | TBD |

## 保証範囲 / 保証外まとめ

| 保証範囲 | 保証外（委譲先） |
| --- | --- |
| spec 文書内の workflow リンク整合 | 実 D1 dev 環境への apply（→ 実装 Phase） |
| 正本仕様 reference の実在 | production 環境での DDL 適用（→ UT-06 / UT-26） |
| scripts/cf.sh 経由ルールの spec 文書整合 | 実トラフィック性能 / lock contention（→ UT-08） |
| migration runbook 構造の正しさ | 実会員データを使った mapping 確認（→ UT-09 phase-11） |
