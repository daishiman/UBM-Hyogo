# テスト拡充結果 — issue-1030

## 追加する fail path / degrade ケース

| ID | 対象 | 固定する挙動 |
| --- | --- | --- |
| RESIZE-F-1 | `image-resize.spec.ts` | WebP 生成不能時も例外を投げず `original_fallback` |
| RESIZE-F-2 | `image-resize.spec.ts` | thumb 生成のみ失敗しても display を壊さず fallback |
| ROUTE-F-1 | `member-photo.contract.spec.ts` | thumb 不在 multipart は `original_fallback` で 200 |
| ROUTE-F-2 | `member-photo.contract.spec.ts` | `contentHash` 省略は null 保存、status は thumb 有無で決定 |
| ROUTE-F-3 | `member-photo.contract.spec.ts` | presign が両方失敗しても detail は 200 |

## 境界・回帰 guard

| ID | 対象 | 固定する挙動 |
| --- | --- | --- |
| ROUTE-B-1..3 | route | display 256KB / thumb 64KB の境界と +1 rejection、副作用ゼロ |
| ROUTE-R-1..2 | route | 旧 `file` upload と 0023 以前相当行の後方互換 |
| REPO-B-1 | repository | `content_hash` は null 許容 |
| SCHEMA-T-1..4 | shared | `photoThumbUrl?` の present/absent/invalid/strict unknown を明確化 |
| AVATAR-B-1 | UI | thumb onError は display へ自動再試行せず既存 placeholder 挙動を維持 |

## カバレッジ意図

- 画像処理 failure はサーバ側有料処理へ逃がさず、client fallback と route 受理で完結させる。
- 旧 client / 旧 row / 旧 schema を壊さない。
- 上限定数の変更が route contract で検知できる。

## 完了判定

本ファイルは root [phase-6.md](../../phase-6.md) の出力実体。実装 wave では上記 ID を test report に対応付け、既存スイート回帰ゼロを確認する。
