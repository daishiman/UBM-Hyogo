# Phase 4 成果物: テスト戦略

## 真の論点
あらゆる Cloudflare API 応答 / observability binding 形態に対して、token / secret / sink credential が一切出力に混入しないことを golden output で機械検証できるテストケース集を確定する。

## TC 一覧 (TC-01〜TC-06)

| TC | 目的 | カバー AC | 種別 | fixture | golden |
| --- | --- | --- | --- | --- | --- |
| TC-01 | clean state (新 Worker のみ) | AC-1 / AC-3 | golden | `tests/fixtures/observability/logpush-empty.json` | `tests/golden/diff-match.md` |
| TC-02 | 旧 Worker が Tail target に残存 | AC-1 / AC-3 | golden / diff | (Worker 名のみ判定) | `tests/golden/diff-mismatch.md` |
| TC-03 | 旧 Worker が Logpush job に残存 | AC-1 / AC-3 | golden / diff | (Phase 6 で再現) | (Phase 6) |
| TC-04 | 旧 Worker が Analytics binding に残存 | AC-1 / AC-3 | golden / diff | (Phase 6) | (Phase 6) |
| TC-05 | Logpush sink URL に bearer token | AC-2 | redaction contract | `tests/fixtures/observability/logpush-with-token.json` | redaction grep 0 件 |
| TC-06 | dataset credential が response に含む | AC-2 | redaction contract | (Phase 6 で再現) | redaction grep 0 件 |

## redaction 不変条件 (全 TC 共通)
- token-like (`ya29\.`, `Bearer `, 32 桁以上の hex / random) が出力に 0 件
- sink URL の query string / fragment は丸ごと redact
- account ID / zone ID は redact
- 出力最大 64KB を超えない

## 入出力契約
- 入力 fixture: `tests/fixtures/observability/*.json` (合成値のみ)
- 期待出力 golden: `tests/golden/*.md`
- 比較: `diff -u expected actual` (改行 LF / 末尾改行 / UTF-8)

## 制約
- C-1 fixture / golden に実 token / secret を書かない
- C-2 コマンド例は `bash scripts/cf.sh` のみ
- C-3 旧 Worker 名は親タスクの固有名詞のみ使用
