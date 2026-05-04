[実装区分: 実装仕様書]

# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |
| 依存 | UT-07B-FU-03 (main merged) |

---

## 目的

Phase 5〜8 で実施した
`.claude/skills/aiworkflow-requirements/indexes/resource-map.md` 追記、
`.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` 追記、
`pnpm indexes:rebuild` による `topic-map.md` 再生成について、
typecheck / lint / indexes drift / CI gate 相当 / secret hygiene / free-tier / a11y の 7 観点で最終 quality gate にかけ、
Phase 10 の GO/NO-GO 判定材料を整える。
NON_VISUAL タスクのため screenshot は取得せず、grep evidence と CI gate ローカル相当 PASS で代替する。

---

## 実行タスク

1. `mise exec -- pnpm typecheck` を実行し evidence（コマンド + 結果サマリ）を記録
2. `mise exec -- pnpm lint` を実行し同上
3. `mise exec -- pnpm indexes:rebuild` を実行し `topic-map.md` 再生成後の `git diff` が空であることを確認
4. `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）のローカル相当検証として `pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/` を実行
5. resource-map / quick-reference に追記行が確実に存在することを `rg` で確認（grep evidence）
6. NON_VISUAL のため screenshot は不要。代替 evidence を grep + CI gate PASS で記録
7. secret hygiene / free-tier 影響 / a11y N/A 理由を記述

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-07.md | AC マトリクス / coverage 実測 |
| 必須 | phase-08.md | DRY 化後の構成 |
| 必須 | CLAUDE.md | 不変条件 #5 / #10 / Cloudflare CLI ポリシー |
| 必須 | `.github/workflows/verify-indexes.yml` | CI gate 仕様 |
| 必須 | `package.json#scripts.indexes:rebuild` | 再生成コマンドの実体 |
| 参考 | `docs/00-getting-started-manual/lefthook-operations.md` | indexes 再生成の運用方針 |

---

## Quality Gate チェック表

| # | 観点 | コマンド / 確認方法 | 期待値 | 判定 |
| --- | --- | --- | --- | --- |
| Q-1 | typecheck | `mise exec -- pnpm typecheck` | エラー 0 件 | completed |
| Q-2 | lint | `mise exec -- pnpm lint` | エラー 0 件 | completed |
| Q-3 | indexes 再生成冪等性 | `mise exec -- pnpm indexes:rebuild` | 再実行で `git diff` 空 | completed |
| Q-4 | CI gate ローカル相当 | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/` | exit 0 | completed |
| Q-5 | resource-map 追記行 grep | `rg "d1-migration\|d1/.+\.sh\|d1-migration-verify" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | hit ≥ 1 行（合成逆引き行）| completed |
| Q-6 | quick-reference 追記行 grep | `rg "cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | hit 1 件 | completed |
| Q-7 | topic-map 手書き混入なし | `git log -1 --name-only -- .claude/skills/aiworkflow-requirements/indexes/topic-map.md` | rebuild commit のみ | completed |
| Q-8 | references 本体への副作用 0 | `git diff main...HEAD -- .claude/skills/aiworkflow-requirements/references/` | dead path claim 補正以外 0 件 | completed |
| Q-9 | UT-07B-FU-03 との二重逆引きなし | `rg "<runbook path>" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | hit 行の役割注記が区別される | completed |
| Q-10 | secret hygiene | `git diff main...HEAD` | secret / token 値の混入 0 件 | completed |
| Q-11 | free-tier 影響 | 後述見積もり表 | Workers / D1 / KV / R2 すべて ±0 | completed |
| Q-12 | a11y | NON_VISUAL のため N/A | N/A 理由明示 | completed |

---

## NON_VISUAL evidence の取得方針

- 本タスクは indexes（純粋 documentation artifact）への 1〜2 行追記のみで UI を一切伴わない
- screenshot は取得しない（visualEvidence: NON_VISUAL）
- 代替 evidence として以下を `outputs/phase-09/main.md` に転記する:
  - Q-1 / Q-2 のコマンド出力サマリ
  - Q-5 / Q-6 の `rg` hit 行（追記行そのもの）
  - Q-3 / Q-4 の `git diff --exit-code` exit code（0 であること）
  - Q-7 の `git log` 出力（手書き commit がないこと）
- 上記 evidence で `verify-indexes-up-to-date` CI gate がローカル相当で PASS することを示す

---

## Free-tier 見積もり

| リソース | 算出 | 増減 | 備考 |
| --- | --- | --- | --- |
| Workers requests | indexes は ランタイム成果物ではない | ±0 | runtime に影響しない |
| D1 reads / writes | 同上 | ±0 | 同上 |
| KV ops | 不使用 | ±0 | 同上 |
| R2 ops | 不使用 | ±0 | 同上 |

> 不変条件 #10（無料枠維持）への影響は皆無。

---

## Secret Hygiene

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| 新規 Cloudflare Secrets 追加 | なし | indexes 追記のみ |
| 新規 GitHub Secrets 追加 | なし | CI 構成変更なし |
| `.env` 変更 | なし | 1Password 参照に追加項目なし |
| ログ / ドキュメントへの secret 転記 | なし | quick-reference の追加コマンドは `bash scripts/cf.sh d1:apply-prod` のみで実値を含まない |

---

## a11y（N/A 理由明示）

- 本タスクは aiworkflow-requirements skill の indexes への文字列追記のみで UI を変更しない
- visualEvidence: NON_VISUAL（artifacts.json 既定値）
- a11y 観点（キーボード操作 / コントラスト / aria 属性 / スクリーンリーダー）はいずれも本タスク scope に該当する変更要素を含まない

---

## CI Gate ローカル相当検証手順

```bash
# 1. indexes 再生成
mise exec -- pnpm indexes:rebuild

# 2. drift がないことを CI と同じ条件で確認
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/

# 3. 追記行存在確認
rg "cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
rg "d1-migration\|d1-migration-verify" .claude/skills/aiworkflow-requirements/indexes/resource-map.md
```

> 上記 3 ステップが exit 0 / hit 1 件以上であることを Q-3 / Q-4 / Q-5 / Q-6 evidence として記録する。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC マトリクス（grep evidence による達成判定）の最終確定 |
| Phase 8 | DRY 化後構成が Q-3 / Q-4 を pass することを確認 |
| Phase 10 | Q-1〜Q-12 の判定を GO/NO-GO 判定基準表に投入 |
| Phase 11 | NON_VISUAL evidence（grep + CI gate PASS）を再利用 |

---

## 多角的チェック観点

- 不変条件 #5: indexes 追記は D1 binding に依存しない（純テキスト）
- 不変条件 #10: free-tier 見積もりがすべて ±0
- secret hygiene: 1Password 参照に追加項目なし
- CI: `verify-indexes-up-to-date` gate を破壊しない（むしろ満たす方向）
- 整合性: UT-07B-FU-03 の追記との二重逆引きが発生していない

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck / lint 実行 | 9 | completed | Q-1 / Q-2 |
| 2 | indexes:rebuild 冪等性確認 | 9 | completed | Q-3 / Q-4 |
| 3 | 追記行 grep evidence 取得 | 9 | completed | Q-5 / Q-6 |
| 4 | topic-map 手書き混入なし確認 | 9 | completed | Q-7 |
| 5 | dead path claim 補正のみ確認 | 9 | completed | Q-8 |
| 6 | UT-07B-FU-03 との二重逆引きなし確認 | 9 | completed | Q-9 |
| 7 | secret hygiene / free-tier / a11y 記述 | 9 | completed | Q-10〜Q-12 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | Quality Gate チェック表 / NON_VISUAL evidence / Free-tier / Secret Hygiene / a11y N/A |
| メタ | artifacts.json | Phase 9 を completed に更新 |

---

## 完了条件 (DoD)

- [ ] Q-1〜Q-12 の全項目が「達成 / N/A」のいずれかで判定済み
- [ ] `pnpm indexes:rebuild` の冪等性が `git diff --exit-code` で PASS（Q-3 / Q-4）
- [ ] resource-map / quick-reference の追記行 grep evidence が記録済（Q-5 / Q-6）
- [ ] secret 追加 0 / free-tier ±0 / a11y N/A 理由明示
- [ ] references 本体への副作用が 0 件であることを diff で確認

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-09/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- いずれかの Q-* が「未達」の場合 Phase 5 / 8 への戻り経路を明記
- artifacts.json の phase 9 を completed に更新

---

## 次 Phase

- 次: 10 (最終レビューゲート)
- 引き継ぎ事項: Q-1〜Q-12 判定 / NON_VISUAL evidence 一式 / CI gate ローカル相当 PASS evidence
- ブロック条件: Q-1〜Q-4 のいずれかが red の場合は Phase 5 / 8 に戻る
