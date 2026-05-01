# task-03a-stablekey-literal-legacy-cleanup-001

## Metadata

| Field | Value |
| --- | --- |
| Source | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` Phase 12 |
| Status | unassigned |
| Priority | High |
| Owner candidate | apps/api + apps/web implementation owner |

## 苦戦箇所【記入必須】

`scripts/lint-stablekey-literal.mjs --strict` は fail 動作を確認できているが、既存コードに stableKey literal が残っているため、CI blocking へ昇格できない。

## スコープ（含む / 含まない）

含む:

- `apps/api`, `apps/web`, `packages/*` の allow-list 外 stableKey literal を正本 supply module 経由へ置換
- `node scripts/lint-stablekey-literal.mjs --strict` の violation count を 0 にする
- 既存 behavior を変えない focused tests / typecheck

含まない:

- GitHub Actions の required check 化
- runtime dynamic stableKey guard
- stableKey 値そのものの変更

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 表示・同期ロジックの key mapping を壊す | 置換前後で mapper / public member / admin member tests を走らせる |
| allow-list を広げて問題を隠す | allow-list 追加は正本 module だけに限定し、例外追加はレビュー必須 |
| 大量置換で unrelated behavior が混ざる | file family ごとに小さく分割し、strict count を段階的に下げる |

## 検証方法

- `node scripts/lint-stablekey-literal.mjs --strict`
- `pnpm exec vitest run scripts/lint-stablekey-literal.test.ts`
- 変更対象 package の focused tests
- `pnpm typecheck`

## 完了条件

- strict mode violation count が 0
- warning mode / strict mode の両方で `stableKeyCount=31`
- Phase 11 evidence を 0 violation として再取得できる
- 03a AC-7 を strict CI gate へ昇格可能な状態になる
