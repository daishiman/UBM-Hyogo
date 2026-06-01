# Phase 3: 設計レビュー（Phase 4 進行可否ゲート）

> **[実装区分: 実装仕様書]** — Phase 1-2 設計が実装可能粒度に達したかを判定するゲート。

## 3.1 4 条件評価（一次結論）

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | member の写真更新が admin 代行不要で即時化。admin の運用コストを下げる対象が明確（Issue 動機に直結） |
| 実現性 | PASS | 既存 admin route / presign util / Avatar src / rateLimit middleware を再利用し、新規面は endpoint 2 本 + source 列 + proxy/client/component に限定。1 サイクルに収まる（CONST_007） |
| 整合性 | PASS | invariant #4（photo は admin-managed data で Form 本文ではない）/ #5（D1・R2 は api に閉じる）/ #11（memberId を path に出さない）と矛盾しない。Phase 2 §2.2 で証明 |
| 運用性 | PASS | last-write-wins で R2 orphan 無し。audit `member.photo_*` + `source` で本人/管理者を区別追跡。additive migration で既存行 backfill |

## 3.2 因果ループ（システム観点）

- **強化ループ（狙い）**: 本人が写真を更新できる → avatar の鮮度が上がる → member directory の信頼性が上がる → 更新動機が高まる。
- **バランスループ（防御）**: 自由更新 → 不適切画像のリスク → MIME/size server 検証 + audit + rate limit + （将来）public 表示は別ゲート（followup-002）で抑制。
- **状態所有権**: R2 object（写真実体）と D1 `member_photos`（metadata）は `apps/api` が所有。`apps/web` は presigned URL の表示と multipart の proxy のみ。所有権は混在しない。

## 3.3 設計レビュー指摘（MINOR）

| # | 指摘 | 対応 |
|---|------|------|
| MINOR-1 | `MeRouteEnv` の presign secret キー名が admin route と一致しているか未確定 | Phase 5 着手時に admin の `resolvePhotoUrl` / env binding を grep し同名に揃える（Phase 2 §2.6 に注記済み） |
| MINOR-2 | web proxy の multipart 透過方式（formData 再構築 vs stream） | Phase 4 で proxy route の multipart 透過 test を先に書き、実装方式を test で固定 |
| MINOR-3 | パッケージ filter 名 | 2026-06-01 実測で `@ubm-hyogo/api` / `@ubm-hyogo/web` / `@ubm-hyogo/shared` に確定。`@repo/*` は stale command として使用禁止 |
| MINOR-4 | upload 成功後の UI 反映（router.refresh の二重 fetch） | Phase 11 で体感確認。MINOR のため未タスク化候補（Phase 12 で判定） |

> MINOR-1〜3 は Phase 4/5 着手時に解消可能な確認事項。設計の根本を変えるものではないため **Phase 4 進行を承認**。

## 3.4 ゲート判定

| 項目 | 判定 |
|------|------|
| 設計の単一責務性 | PASS（self-service photo mutation の垂直スライス） |
| 既存不変条件との整合 | PASS |
| 実装可能粒度（ファイル・関数・型・SQL が特定済み） | PASS |
| 1 サイクル完了スコープ（CONST_007） | PASS |
| **総合** | **Phase 4 へ進行可（APPROVED）** |

## 完了条件

- [x] 4 条件評価が全 PASS
- [x] MINOR 指摘を記録し対応先（Phase 4/5/12）を割当
- [x] Phase 4 進行を承認
