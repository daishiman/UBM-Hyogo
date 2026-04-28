# Phase 8 Output: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 |
| 下流 | Phase 9（品質保証） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ

本タスクは spec_only / docs-only / NON_VISUAL のため、コードリファクタリングの対象は存在しない。「リファクタリング」は **比較表本文の表現整理 / 用語統一 / 冗長削減** を意味する。本ファイルでは指摘ログを残し、書き換えが必要な場合は Phase 5 `comparison.md` を直接更新する形を取る。

## 1. 表現整理 Before / After 対応

| 対象 | Before（旧 stub） | After（修正後） | 理由 |
| --- | --- | --- | --- |
| outputs 実体 | `artifacts.json` に列挙のみで本文未充実 | 全 30 ファイル本文を Phase 仕様に揃えて充実 | Phase 9 parity を満たす |
| Phase 5 比較表参照 | `outputs/phase-3/comparison.md` という誤参照を残すリスク | 比較表は `outputs/phase-5/comparison.md` を正本とする | 比較表正本の所在を明確化 |
| Phase 12 完了条件 | 「実行完了ラベル」を前提にした記述 | `artifacts.json` の outputs と同期、`spec_created` 維持 | spec_created と矛盾させない |

## 2. 用語統一チェック

| 用語 | 統一表記 | 揺れ排除確認 |
| --- | --- | --- |
| 採用案 | `bypassPermissions`（公式表記そのまま） | OK |
| 階層名 | `global` / `global.local` / `project` / `project.local` | OK（"glb-local" 等の独自略記なし） |
| パス表記 | `~/.claude/settings.json` / `<project>/.claude/settings.local.json` | OK |
| ラッパー | `scripts/cf.sh` 経由で記述、`wrangler` 直接実行を勧めない | OK |
| シークレット注入 | `op run --env-file=.env` で記述 | OK |
| フラグ表記 | `--dangerously-skip-permissions`（公式そのまま） | OK |

## 3. 冗長削減点（指摘ログ）

| 箇所 | 指摘 | 対応 |
| --- | --- | --- |
| 比較表 Section 3 と Section 5 | 「他プロジェクト副作用」が重複しがち | Section 3.1 では評価値のみ、Section 5 で詳細表として分離（既に実施済み） |
| Phase 3 / Phase 5 のシナリオ A〜D | 双方に表を持つ | Phase 3 は影響分析、Phase 5 は比較対比に焦点を分けた（既に実施済み） |
| rollback 手順 | Phase 5 と Phase 12 implementation-guide で重複しないよう注意 | implementation-guide からは Phase 5 §4 への参照に留める |

## 4. spec_only 境界の維持確認

| 項目 | 状態 |
| --- | --- |
| 実 settings ファイル書き換え | していない |
| 実 zshrc 書き換え | していない |
| `.env` 中身読み取り | していない |
| API token / OAuth 値転記 | していない |
| `wrangler` 直接実行手順の混入 | なし |

## 5. 完了条件チェック

- [x] 用語統一が完了
- [x] 表現整理の指摘ログを記録
- [x] spec_only 境界が維持されている

## 6. 次 Phase へのハンドオフ

- Phase 9: リンク整合 / CLAUDE.md ルール準拠を最終確認
- Phase 10: 採用案確定の最終レビュー

## 7. 参照資料

- `phase-08.md`
- `outputs/phase-5/comparison.md`
- CLAUDE.md
