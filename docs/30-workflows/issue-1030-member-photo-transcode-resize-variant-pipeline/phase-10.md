# Phase 10 — 最終レビュー

> **実装区分: 実装仕様書**。本 Phase は受入条件 AC-1..AC-5 の達成判定と blocker 判定、Phase 11（VISUAL_ON_EXECUTION）進行条件を固定する。

## 1. 受入条件 達成判定マトリクス

| AC | 受入内容（Phase 1 最適化後） | 検証手段 | 想定結果 |
|----|------------------------------|----------|----------|
| AC-1 | 原本/表示用 variant の保存方針が ADR 化 | `outputs/phase-2/adr-1030-image-processing.md` の決定・帰結を確認 | ✅ ADR-1030 に「display canonical（既存 key）+ thumb 併存・サーバ原本処理なし」を明記 |
| AC-2 | 処理方式のコスト/無料枠/失敗時 fallback 比較 | ADR 比較表（Cloudflare Images / Image Resizing / client Canvas）と fallback 設計 | ✅ 3 方式比較＋採用根拠（無料枠 invariant）＋original_fallback 設計を記載 |
| AC-3 | `member_photos` metadata に variant 識別情報追加 | migration 0023 / `MemberPhotoRow` 新列 / upsert 経路 | ✅ `thumb_object_key`/`thumb_byte_size`/`content_hash`/`processing_status` を後方互換 ADD COLUMN |
| AC-4 | admin drawer avatar が小サイズ variant を使用 | `MemberAvatar`(sm/md)=thumb / list 行 / drawer header / `MemberAvatar.spec.tsx` | ✅ sm/md → `photoThumbUrl ?? photoUrl`、lg → `photoUrl`。テストで src 選択確認 |
| AC-5 | 処理失敗時も原本/placeholder へ安全 fallback | 3 段 fallback（thumb→display→hue placeholder）/ Canvas 失敗 original_fallback / presign fail-soft | ✅ client 失敗で破壊なし・detail 200 維持・`<img onError>` placeholder 継続 |

## 2. blocker 判定

| 観点 | 判定 |
|------|------|
| 後方互換破壊 | なし（既存 key 維持・新列 nullable・旧 client 受理・既存行 200） |
| 無料枠違反 | なし（サーバ/外部画像処理ゼロ・Canvas は client） |
| invariant 違反（#4/#5/#8） | なし（variant メタ admin-managed 分離・D1/R2 は api 限定・テスト `*.spec` のみ） |
| 未解決の設計 GAP | なし |

**blocker: なし。**

## 3. MINOR 指摘（本サイクル外・別レーン）

| # | 指摘 | 判定 | 取り扱い |
|---|------|------|----------|
| M-1 | `content_hash` による R2 dedup（同一画像 put skip） | 本タスクは hash **記録のみ** | **未タスク化候補**。Phase 12 の未タスク検出で起票要否を判定（CONST_007 将来送りではなく責務分離の別レーン） |
| M-2 | 公開メンバー表示での thumb 露出 | #1029 の責務（公開ディレクトリ） | scope 外明記済。本タスクは admin 経路のみ |
| M-3 | 複数解像度（2x retina）variant | over-scope | 96/512 の 2 variant に限定（追加しない） |

> M-1 のみ Phase 12 で未タスク化要否を評価する。M-2/M-3 は別 issue / over-scope として固定。

## 4. Phase 11（VISUAL_ON_EXECUTION）へ進む条件

本タスクは VISUAL_ON_EXECUTION（admin UI に thumb avatar が表示される）のため、Phase 11 で実行時スクリーンショット証跡を要する。進行条件:

- [ ] AC-1..AC-5 がすべて ✅（達成判定マトリクスに未確定なし）
- [ ] blocker なし
- [ ] Phase 9 の Q-1..Q-12 が全 PASS（typecheck/lint/test/後方互換/gate）
- [ ] Phase 11 で取得する evidence の対象が確定:
  - admin members list 行の小 avatar（thumb 使用）
  - MemberDrawer header avatar（thumb 使用）
  - 拡大表示（display 使用）
  - thumb 欠落時の hue placeholder fallback

> 上記すべてを満たした時点で Phase 11 へ進行可。未達があれば該当 Phase（6/7/9）へ差し戻す。

## 完了条件（Phase 10）

- [ ] AC-1..AC-5 達成判定マトリクス（検証手段→想定結果）
- [ ] blocker 判定（なし）
- [ ] MINOR 指摘 M-1..M-3 の仕分け（M-1 のみ Phase 12 評価）
- [ ] Phase 11 進行条件を明示
- [ ] 出力: [outputs/phase-10/final-review-result.md](outputs/phase-10/final-review-result.md)
