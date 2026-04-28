# Phase 2: 設計 — 成果物（要約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13（設計） |
| 種別 | docs-only / spec_created |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3（設計レビュー） |

## 1. 設計サマリ

Phase 1 で確定した採用方針（案 A）に基づき、以下の 3 つの設計成果物を分離して出力する。

| 成果物 | 内容 | ファイル |
| --- | --- | --- |
| E-1 | settings 階層 `defaultMode` 統一の完全形 diff（案 A / 案 B） | `settings-diff.md` |
| E-2 | `cc` alias 書き換え diff（before / after） | `alias-diff.md` |
| E-3 | `permissions.allow` / `deny` whitelist 完全形 | `whitelist-design.md` |

## 2. 採用方針

| 項目 | 採用 | 根拠 |
| --- | --- | --- |
| settings 統一案 | 案 A（全層 `bypassPermissions`） | 全層明示で「どの値が効いているか」を後から読める |
| alias 強化 | `--permission-mode bypassPermissions` + `--dangerously-skip-permissions` 併用 | 起動初期化中の prompt も含め確定スキップを狙う |
| whitelist 配置 | project 層 (`<project>/.claude/settings.json`) のみ | global 追記は他プロジェクトへ silent 波及するため避ける |

## 3. 階層優先順位（仮説）

```
project/.claude/settings.local.json   ← 最優先
project/.claude/settings.json
~/.claude/settings.local.json
~/.claude/settings.json               ← 最下位
```

> 実挙動の最終確定は Phase 3 レビュー時に Anthropic 公式ドキュメントで再確認する。

## 4. ステップ間 state 引き渡し

| 入力 (from Phase 1) | 出力 (to Phase 3) |
| --- | --- |
| 3 層 settings ダンプ（キー名のみ） | 統一後の完全形 diff（案 A / 案 B） |
| 既存 alias 行 | 書き換え diff |
| whitelist 候補リスト | allow / deny 完全形（project 層配置） |
| 階層優先順位の仮説 | レビュー対象として明示（Phase 3 R-1） |

## 5. 安全設計の優先順位（Phase 3 へ）

1. 第一候補: project-local settings + `cc` alias の最小変更
2. 第二候補: global.local settings を使い、global 本体の変更は避ける
3. 最終候補: global 本体の `defaultMode` 統一（他プロジェクト影響レビュー必須）
4. `--dangerously-skip-permissions` は deny 実効性が確認できるまで「保険」と断定しない

## 6. 次 Phase への確認質問（Phase 3 にて確定）

1. global `~/.claude/settings.json` の `defaultMode` 変更が、`permissions` を未定義の他プロジェクトへどう波及するか
2. `--dangerously-skip-permissions` は MCP server / hook 起動時の permission も完全スキップするか
3. whitelist の `Edit(*)` / `Write(*)` を「project 内に限定」と表現できる構文があるか

## 7. 完了条件

- [x] `main.md` / `settings-diff.md` / `alias-diff.md` / `whitelist-design.md` の 4 ファイルを出力
- [x] 案 A / 案 B の両方を diff 形式で残し、Phase 3 でフォールバック判定可能にした
- [x] 実値は記録せず、キー名と値の種別のみ記載
