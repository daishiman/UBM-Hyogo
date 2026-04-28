# Phase 7 — カバレッジ確認 main

## 概念 / dependency edge / 数値の 3 軸

### 概念軸

- 変更行に限定して line / branch を実測（広域 X% 指定に逃げない）
- 対象は `scripts/skill-logs-{render,append}.ts` と `scripts/lib/*.ts` の公開関数

### Dependency edge 図

```
appendFragment ──► Fragment Store (filesystem) ──► renderSkillLogs ──► stdout / file
                                                          ▲
                                                          │
                                              extractTimestampFromLegacy
                                                  (Legacy bridge)
                                                          ▲
                                                          │
                                                  _legacy.md (heuristic)

appendFragment / renderSkillLogs ◄── git grep (CI guard, 検出のみ)
```

### 数値軸

詳細は [`coverage.md`](./coverage.md) を参照。16/16 vitest Green、変更行はテストで網羅。

## 100% 未達への対応

- 現状: `extractTimestampFromLegacy` の mtime fallback ブランチは外部依存（`statSync` 失敗時）のためテスト覆っていない（catch 経路）。
- 対応: catch 経路は `try/return 0` の安全策で、`fs.statSync` が同期 reject される現実的な状況がほぼないため許容。Phase 12 unassigned task に "mtime statSync 失敗時のテスト追加" として登録する候補ではあるが、本タスクでは MINOR とし不要判定はしない。

## 関連ファイル

- [`coverage.md`](./coverage.md)
