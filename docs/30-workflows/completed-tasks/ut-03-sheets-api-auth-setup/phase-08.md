# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |

## 目的

`packages/integrations/google` 配下で本タスクが導入する認証ロジック（JWT 署名・token cache・redact）を、将来の Google API（Drive / Calendar 等）追加時に再利用可能な抽象を持たせるかを判断する。**過剰抽象は避ける**（CLAUDE.md「3 similar lines is better than a premature abstraction」）。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-08/main.md | 抽象化方針の決定（YAGNI 判定含む） |
| outputs/phase-08/before-after.md | 重複コード除去の before / after |

## 完了条件

- [ ] YAGNI 判定（抽象化する / しない）が明示される
- [ ] 抽象化する場合のみ before/after が記述
- [ ] 抽象化しない場合は判定理由を記録
