# Phase 7: カバレッジ確認 — issue-230-lefthook-edit-guard

> **[実装区分: 実装仕様書 / NON_VISUAL]**
> 本タスクの被テスト対象は **shell script 2 本**（`lefthook-edit-guard.sh` / `verify-hook-integrity.sh`）。
> shell は vitest の line/branch coverage 計測対象外（istanbul は JS/TS のみ計測）。
> よって line coverage 数値ではなく **要件（R-1..R-4）× 分岐のケースマトリクス網羅**で被覆を担保する。

## 7.1 カバレッジ代替方針

| 項目 | 方針 |
|------|------|
| 計測手段 | line/branch coverage は**計測しない**（shell は istanbul 非対象） |
| 代替指標 | R-1..R-4 の各要件と、各 script の主要分岐を spec ケースが 1:1 以上で被覆していることをマトリクスで証明 |
| 合格基準 | (1) 全要件 R-1..R-4 が ≥1 ケースで被覆、(2) 各 script の全分岐（marker skip / ack ゲート / offender 検知 / .sample・署名除外 / 参照欠落 / stray / min_version / 空入力）が被覆、(3) 「検知しない」を固定する回帰ケースが存在 |

## 7.2 R-1..R-4 × ケース被覆マトリクス（lefthook-edit-guard.sh）

| 要件 | 内容 | 被覆ケース（Phase 4/6） |
|------|------|------------------------|
| R-1 (local) | 手書き `.git/hooks/*` 検知で exit 1 | LG-d / LG-h（複数）/ LG-i（CRLF）|
| R-2 | staged `lefthook.yml` を ack 無で exit 1 / ack 有で exit 0 | LG-b（ack 無 fail）/ LG-c（ack=1 pass）/ LG-o（曖昧 ack fail）|
| R-3 | 拒否メッセージに `LEFTHOOK_EDIT_ACK` / `CLAUDE.md` / `lefthook-operations.md` を含む | LG-b（lefthook 編集メッセージ）/ LG-d（手書き hook メッセージ）|
| R-4 | false positive 抑制（`.sample` 除外 / 署名除外 / merge等 skip） | LG-e（.sample）/ LG-f（署名）/ LG-g + LG-p（4 marker skip）|

### 分岐被覆（lefthook-edit-guard.sh）

| 分岐 | true 被覆 | false 被覆 |
|------|----------|-----------|
| marker 存在 → skip | LG-g / LG-p | LG-a 他全ケース |
| staged lefthook.yml あり | LG-b / LG-c | LG-a / LG-d |
| `LEFTHOOK_EDIT_ACK == "1"` | LG-c | LG-b / LG-o |
| `.git/hooks` ディレクトリ存在 | LG-d 他 | LG-l |
| `.sample` 除外 continue | LG-e | LG-d |
| 署名 grep ヒット → continue | LG-f | LG-d |
| offender 非空 → exit 1 | LG-d / LG-h | LG-a / LG-k |
| `-type f` のみ（symlink 除外） | — | LG-j（symlink は検知しない固定） |

## 7.3 R-1 (CI 面) × ケース被覆マトリクス（verify-hook-integrity.sh）

| 検査 | 内容 | 被覆ケース（Phase 4/6） |
|------|------|------------------------|
| A: 参照 script 実在 | 欠落で exit 1 + `::error::` | VI-b / VI-e（複数）/ VI-f（誤検出回避）/ VI-g（node）/ VI-h（run なし）|
| B: tracked stray hook | 検知で exit 1 | VI-d / VI-j（途中パス）/ VI-i（誤検出回避）|
| C: min_version 健全性 | 欠落で exit 1 | VI-c |
| 正常系 | 全検査 pass で exit 0 + `OK` | VI-a |
| 異常: lefthook.yml 不在 | 非ゼロ exit | VI-k |

### 分岐被覆（verify-hook-integrity.sh）

| 分岐 | true 被覆 | false 被覆 |
|------|----------|-----------|
| 参照 script 不在 → fail=1 | VI-b / VI-e | VI-a / VI-f / VI-g |
| 第2トークン抽出（引数読み捨て） | VI-f / VI-g | VI-a |
| stray hook あり → fail=1 | VI-d / VI-j | VI-a / VI-i |
| min_version 欠落 → fail=1 | VI-c | VI-a |
| `fail == 0` → OK 出力 | VI-a | VI-b / VI-c / VI-d / VI-e |

## 7.4 被覆判定

- R-1（local + CI）/ R-2 / R-3 / R-4 すべてが ≥1 ケースで被覆 → **要件被覆 100%**。
- 両 script の主要分岐が true/false 双方で被覆（symlink・空 hooks dir 等の片側固定ケースは「検知しない」を凍結する回帰ガードとして妥当）。
- 「検知しない」固定ケース（LG-j / LG-n / VI-f / VI-g / VI-i）で過検知 drift を防止。

→ shell script の line coverage 非計測を、**要件 × 分岐マトリクス網羅で代替する基準を満たす**。

## 7.5 実行コマンドと期待 pass 件数

```bash
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
```

| spec | 想定ケース数（Phase 4 + Phase 6） | 備考 |
|------|----------------------------------|------|
| `lefthook-edit-guard.spec.ts` | 基本 7（LG-a〜g）+ 境界 8（LG-h〜p、marker/ack パラメタライズ展開で実 test 数は増加）= **15+** | パラメタライズ（marker 4 + ack 4）で実行 case は 20 前後になり得る |
| `verify-hook-integrity.spec.ts` | 基本 4（VI-a〜d）+ 境界 7（VI-e〜k）= **11** | — |
| 合計（最小） | **26+ 件すべて pass（exit 0、failed 0）** | パラメタライズ展開で件数は増えるが failed は 0 が合格 |

- 合格基準: `Test Files 2 passed` / `Tests <N> passed`（failed 0 / skipped 0）。
- shell の `set -euo pipefail` により未定義変数・想定外失敗があれば spec が RED になるため、GREEN は分岐健全性のシグナルも兼ねる。

## 完了条件（Phase 7）

- shell coverage 非計測を要件 × 分岐マトリクス網羅で代替する方針が表で示されている。
- R-1..R-4 が全分岐被覆されることを 2 script 分のマトリクスで証明している。
- `pnpm vitest run <2 specs>` の 1 行実行コマンドと期待 pass 件数の目安（合計 26+ 件 / failed 0）が記載されている。
