# Phase 01 — 要件定義 / Requirements

## 目的

Forms 同期から `tag_assignment_queue` への candidate enqueue を、再デプロイのみで停止/再開できる zero-downtime guard 経路として導入する。

## 背景

- 上流 issue #109（07a workflow）で auto enqueue 経路が稼働中。
- 障害時 / queue 暴走時 / schema 変更追従中に enqueue だけ即時停止したい運用要求が発生（#378）。
- admin UI toggle は MVP scope 外。env binding ベースで最小実装する。

## 受入条件

- AC-1: `TAG_QUEUE_PAUSED` env binding が存在し、未設定 / `"false"` / `"true"` の3値を厳密解釈。default = enqueue 有効。
- AC-2: paused=true のとき `enqueueTagCandidate` は D1 INSERT を発行せず `{ enqueued: false, reason: "paused" }` を返す。
- AC-3: 停止時に code `UBM-TAGQ-PAUSED` の structured log を出力（`reason: "paused"` を含む）。
- AC-4: runbook を `docs/30-workflows/runbooks/tag-queue-pause.md` に新設。
- AC-5: unit test PASS（unset / "false" / "true" + log spy + strict parser）。
- AC-6: 不変条件 #5（D1 は apps/api 内）/ #13（resolve workflow を唯一の `member_tags` 書き込み経路に保持）を遵守。

## スコープ外

- admin UI toggle / `tag_assignment_queue` schema 変更 / 07a resolve workflow への影響。
