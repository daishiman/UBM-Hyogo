# `apps/web/next.config.ts` OpenNext 互換性確認

Phase 2 設計時点では Phase 1 の open question 1 に対する確認方針のみ確定。実ファイル grep / 棚卸しは Phase 4 サブタスクとして実施する。

## 確認対象キー一覧

Phase 2 ステップとして以下のキーが含まれていないこと、または OpenNext 互換であることを確認する。

| key | OpenNext 互換性 | 確認結果（本ファイルに追記） |
| --- | --- | --- |
| `output` | `"export"` は非互換 | 不在を確認（grep `output:` で `"export"` 値がない） |
| `assetPrefix` | 固定文字列は要注意 | 互換性確認（dynamic 取得 or 不在） |
| `images.unoptimized` | OpenNext 側で image optimization 未対応の場合 true 推奨 | 確認（true 推奨だが必須ではない） |
| `experimental.runtime` | `"edge"` 強制は不要 | 確認（OpenNext は Workers 上で nodejs_compat 動作） |
| `basePath` | OpenNext は対応するが Workers route と整合させる必要 | 確認（apps/web では未使用想定） |

## 確認手順

```bash
# 非互換 key の検知
grep -nE 'output\s*:\s*["\x27]export["\x27]' apps/web/next.config.ts   # ヒットゼロを期待
grep -nE 'assetPrefix\s*:' apps/web/next.config.ts                     # ヒット時は内容レビュー
grep -nE 'experimental\s*:\s*\{[^}]*runtime' apps/web/next.config.ts   # ヒット時は edge 強制でないか確認
grep -nE 'basePath\s*:' apps/web/next.config.ts                        # ヒット時は wrangler route と整合確認
```

## 結果記録欄（Phase 4 で更新）

| key | 検出有無 | 値 / 備考 | 判定 |
| --- | --- | --- | --- |
| `output` | （未確認） | — | （未判定） |
| `assetPrefix` | （未確認） | — | （未判定） |
| `images.unoptimized` | （未確認） | — | （未判定） |
| `experimental.runtime` | （未確認） | — | （未判定） |
| `basePath` | （未確認） | — | （未判定） |

## 判定基準

- 全項目 `OpenNext 互換` または `不在` → **next.config.ts 改修なし**で Phase 5 implementation template を確定
- 1 件でも `非互換` → Phase 4 で改修サブタスクを起票（本タスク本体は設計 close-out のため改修は別 Issue で fork）

## Phase 1 open question との対応

Phase 1 open question 1（`next.config.ts` に OpenNext 非互換オプションが混入していないかの棚卸し）への解。本ファイルが棚卸し計画と結果記録欄を提供することで open question 1 を closeable な形に落とす。
