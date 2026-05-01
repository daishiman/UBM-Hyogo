# Phase 8 成果物: DRY 化方針（main）

## 原則

**why は ADR のみ / 他は what + リンク**

決定根拠（why）は ADR を source of truth とし、他 3 ファイルは結果（what）+ ADR リンクのみ持つ。各ファイルの **役割**は残しつつ「決定根拠」を ADR に集約する。

## source of truth 指定

| ファイル | 役割 | 内容深度 |
| --- | --- | --- |
| **ADR (`docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`)** | source of truth | Context / Decision / Consequences の完全記述 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` 判定表 | 実装ガイダンス | 「現状 / 将来 / 根拠リンク / 更新日」表記 + ADR への参照リンク |
| `CLAUDE.md` スタック表 | プロジェクト概要 | 1 行表記（`Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare`）+ 詳細は ADR 参照 |
| `apps/web/wrangler.toml` | 実 deploy 設定 | コードリテラル（Workers 形式: `main` + `[assets]`）+ 冒頭コメントで ADR 参照（任意改善・cutover stub に含める） |

## リンク方向

他 3 ファイル → ADR の **片方向リンクのみ**。ADR から他ファイルへの双方向リンクは drift 温床のため避ける（リンク先の更新が ADR に伝播しない）。

## 完了確認

- [x] source of truth 指定（4 ファイル）
- [x] DRY 化原則「why は ADR のみ / 他は what + リンク」宣言
- [x] リンク方向（片方向）明示
