# ADR-1030: member photo 画像処理方式

- ステータス: Accepted（spec 段階）
- 日付: 2026-05-31
- 文脈: issue-1030 / 親 #983（R2 static storage MVP）

## 決定

**client-side Canvas resize** を採用する。admin ブラウザでアップロード前に `display`(≤512px 長辺 webp) と `thumb`(96×96 cover webp) を生成し、API は受領した variant を R2 へ保存するだけにする。サーバ/外部の画像処理サービスは導入しない。

## 比較（AC-2）

| 方式 | 月額コスト | 無料枠適合 | 失敗時 fallback | レイテンシ | 判定 |
|------|-----------|-----------|-----------------|-----------|------|
| Cloudflare Images | 保存 + 配信課金（有料） | ✗ | service 障害で配信不可 | 低 | 却下 |
| Cloudflare Image Resizing(`cdn-cgi/image`) | 有料プラン必須 | ✗ | origin fetch | 低 | 却下 |
| client-side Canvas | 0（処理は client、R2 put/get のみ・egress 無料） | ✓ | 原 File を display 送信 | client CPU 依存 | **採用** |

`docs/00-getting-started-manual/specs/08-free-database.md` の無料枠 invariant により、課金が発生する上 2 方式は不採用。

## 帰結

- 保存: `display`（既存 key `members/{id}/avatar`・後方互換 canonical）+ `thumb`（新 key `members/{id}/thumb`）。原本を別途サーバ保持しない。
- 失敗時 fallback: Canvas 不可 → `processing_status='original_fallback'`（display=原 File、thumb なし）→ 表示は display / hue placeholder へ degrade。
- トレードオフ: client CPU を使うが、admin 操作は低頻度で許容。retina 2x や server dedup は scope 外（M-1/M-3）。

## 却下案の再検討トリガ

将来 admin 端末が貧弱で client 生成が常時失敗する、または公開トラフィックが無料枠 R2 制限に達した場合、Image Resizing の有料移行を別 ADR で再評価する（本タスクでは対象外）。
