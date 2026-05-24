# Phase 3 — タスク分解

## 1. 分解結果

CONST_007 に従い、本 workflow を **2 タスク**で 1 サイクル内に完了させる:

| ID | タスク | 並列性 | 依存 |
| --- | --- | --- | --- |
| task-01 | 公開トップ用 CSS rule 追加（PublicHeader / Stats / ZoneIntro / Timeline / PublicFooter / MemberGrid） | core | なし |
| task-02 | CallToActionCTA の className ハイブリッド整理（data-role/data-component 統一） | serial-after-task-01 | task-01（同一 `legacy-public.css` 編集のため） |

両 task は **同 PR に含める**ことを前提とする。先送り無し。

## 2. なぜこの粒度か

- **task-01 を 1 ファイル (`legacy-public.css`) への追記タスクとして括る理由**: 6 件の selector が全て同ファイル末尾の単一責務領域に追加されるため、分割すると merge コンフリクト・rhythm 不整合を生む。
- **task-02 を task-01 後に直列化する理由**: CallToActionCTA は `apps/web/src/components/public/CallToActionCTA.tsx` に加えて `legacy-public.css` の既存 selector 群も編集する。共有 CSS 編集のため、task-01 marker block 追加後に既存 CTA selector rewrite を行い、marker 外の既存領域だけを触る。

## 3. 単一サイクル完了の根拠

- 変更行数想定: task-01 ≈ 150 行 CSS 追記 / task-02 ≈ 30 行 TSX + 既存 CSS selector rewrite
- snapshot test 既存・構造変更なし → CI 影響限定
- runtime evidence は staging deploy 後の screenshot 1 枚で確認可能

## 4. 完了条件（Phase 3）

- 2 task の粒度確定
- 並列性 / 依存関係確定（共有 CSS のため task-02 は task-01 後）
- 単一サイクル完了根拠明記
