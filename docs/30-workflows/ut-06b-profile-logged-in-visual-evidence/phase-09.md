# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

free-tier、secret hygiene、a11y、可搬性の 4 観点で gate を通し、Phase 10 GO 判定の前提を整える。

## 品質ゲート

| 観点 | 検査項目 | 検査方法 | 合格基準 |
| --- | --- | --- | --- |
| free-tier | staging session は単発・evidence は静的 png/txt のみ | 取得回数を runbook に明記 | Cloudflare 無料枠の Worker 実行回数を逸脱しない（M-14〜M-16 各 1 回） |
| secret hygiene | token / Cookie / Authorization が evidence に含まれない | `grep -RniE '(token\|cookie\|authorization\|bearer\|set-cookie)' outputs/phase-11/evidence` | 0 件 hit |
| secret hygiene | URL に query にあったら個人 PII を含めない | `?edit=true` 以外の query なし | URL `/profile` または `/profile?edit=true` のみ |
| a11y | read-only 表記が screen reader でも認識可能 | M-08, M-14 で aria-readonly / role 観察ノート | observation note に記録 |
| 可搬性 | runbook が他者でも再現可能 | 命名規約・snippet・grep を 1 箇所参照 | 重複なし（Phase 8 DRY 完了） |

## a11y 観察項目（observation note）

- `/profile` に form 0 件であることが「アプリ内で本文編集不可」を screen reader でも分かる構造か
- 表示要素に明示的な「閲覧専用」/「編集はフォーム再回答へ」の文言があるか
- リンク先（外部 Google Form 再回答）は `target=_blank` の場合 `rel=noopener` か

a11y は本タスクで「観察 note」止まり、修正は親 06b の責務。

## 無料枠運用

- staging session 実発行は M-14〜M-16 取得時のみ（不要な login 連打を runbook で抑制）
- evidence は静的ファイルのため Cloudflare R2 / KV を使わず repo にコミット

## 実行タスク

- [ ] `outputs/phase-09/main.md` に gate 結果記録
- [ ] secret hygiene grep を実行（Phase 11 後に実取得 evidence を対象に再実行する gate）
- [ ] a11y 観察 note 雛形を Phase 11 に渡す

## 完了条件

- [ ] free-tier / secret hygiene / a11y / 可搬性 4 gate 設計済み
- [ ] grep パターン明示
- [ ] 観察 note 雛形を Phase 11 に渡した

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (最終レビュー)
