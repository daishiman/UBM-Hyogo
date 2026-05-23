[実装区分: 実装仕様書]

# Phase 3: 設計レビュー / PASS-MINOR-MAJOR 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-03/main.md` |

## レビュー観点

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| Detector 1 が AC-1/AC-3 を満たすか | PASS | regex に `[\s\S]{0,400}?` / `[\s\S]{0,160}?` を含め、quoted / schema-qualified SQL fixture もカバー |
| Detector 2 が AC-2 を満たすか | PASS | `\.update(schemaQuestions).set({ ... stable_key/stableKey })` chain を検出 |
| Detector 3 の false positive リスク | MINOR | `updateStableKey(` 呼び出しだけを warning 固定で扱い、関数定義は除外 |
| 例外許可範囲が AC-4 を満たすか | PASS | migrations / __fixtures__ / __tests__ / *.spec.* 限定 |
| 失敗メッセージが AC-5 を満たすか | PASS | `schema_aliases` / `/admin/schema/aliases` 誘導文を template に固定 |
| `--strict` 切替が AC-6 を満たすか | PASS | CLI flag + env var の二系統 |
| CI workflow が AC-7 を満たすか | PASS | push / PR (dev, main) 対応 |
| dead code 削除が AC-8 を満たすか | PASS | caller 0 件確認済（P50） |

## MINOR 追跡

| MINOR ID | 指摘 | 解決予定 | 解決確認 |
| --- | --- | --- | --- |
| M-01 | Detector 3 の関数名検出は false positive 余地 | Phase 5 実装で warning 固定 | Phase 9 grep gate |
| M-02 | 後続で SQL AST guard へ強化する余地（regex の限界） | 現時点 no-op。quoted/schema-qualified/複数違反 fixture を同一 wave で追加し、AST 化は新たな実回避パターンが出た時点で判断 | Phase 12 unassigned-task-detection |

## simpler alternative 検討

| 代替案 | 採用判定 | 理由 |
| --- | --- | --- |
| grep のみ（`rg`） | reject | multiline / template literal 分断に弱い |
| ESLint custom rule | reject | drizzle method chain 検出に AST plugin が必要で導入コストが大 |
| Node script + comment-stripped regex | **採用** | 既存 `lint-stablekey-literal.mjs` 構造を流用でき、メンテ容易 |

## Phase 4 開始条件

- AC-1〜AC-8 確定
- Detector 1/2/3 regex 確定
- EXCEPTION_GLOBS 確定
- 失敗メッセージ template 確定

## Phase 13 blocked 条件

- user approval 未取得（spec 完了でも commit / push / PR は user 承認後）

## 完了条件

- [ ] PASS / MINOR / MAJOR 表が埋まっている
- [ ] MINOR 追跡テーブル登録
- [ ] simpler alternative 検討記録あり

## 次Phase

Phase 4（テスト設計）
