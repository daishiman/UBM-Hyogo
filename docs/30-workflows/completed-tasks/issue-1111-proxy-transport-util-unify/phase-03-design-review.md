# Phase 03 — 設計レビュー（Phase 4 進行ゲート）

## 1. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | transport 仕様変更時の同期点が 3 → 1 に集約。drift 再発（親 workflow の 404 と同クラス）を構造的に防ぐ。誰の（保守者の）どのコスト（多箇所同期）をどれだけ（3→1）下げるか定義済み |
| 実現性 | PASS | 新規 util 1 file（純粋関数 3 export）+ 既存 3 ファイルの import 切替。1 実装サイクルで完了可能な厚み |
| 整合性 | PASS | per-caller の判定述語・fallback 戦略・ログ shape を呼び出し側に保持し、util は制御骨格のみ共通化。§4-7 真理値表で挙動不変を担保 |
| 運用性 | PASS | 既存回帰 spec（route / server-fetch / public）が緑なら抽出成功を機械判定可能。新規 util 単体テストで分岐網羅 |

## 2. 強化ループ / バランスループ

- **強化ループ**: 共通 util に集約 → 次回 transport 変更が 1 箇所修正で済む → 複製誘惑が減る → さらに util へ集約される（正のループ）。
- **バランスループ**: 過度な共通化（判定述語・fallback も潰す）→ per-caller 差異が壊れ pure refactor 違反 → 回帰 spec が赤 → 抽出を呼び出し側差分へ巻き戻す（自己抑制）。本設計は判定述語/fallback を呼び出し側に残すことでバランスループを設計時に内包。

## 3. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| `isTestOrPlaywright` / fallback の真理値が変わり transport drift 再発 | 高（404 と同クラス） | §4-6 真理値表を実装の不変参照とし、判定述語を util へ移送しない。`route.spec.ts` / `server-fetch.*.spec.ts` / `public.spec.ts` を pure refactor 回帰ガードとして緑維持 |
| server-fetch / public の fixture 経路（binding 無効化前提）が壊れる | 中 | fixture 判定は呼び出し側の `disableBinding` 計算に残し、util は boolean のみ受領。`server-fetch.binding.spec.ts` / `public.spec.ts` を抽出後に実行し PASS 確認 |
| `LOCAL_DEV_FALLBACK` 移動で 127.0.0.1 焼き込み gate（task-18）抵触 | 中 | `LOCAL_DEV_FALLBACK` を route.ts に残し util へ移送しない。util に 127.0.0.1 系文字列を一切書かない。静的 grep で確認 |
| 2 箇所のまま over-abstraction（YAGNI） | 中（解消済み） | 3 箇所目（public.ts）の存在で Rule of Three 成立を AC-1 で確認済み。user 承認で admin+public スコープ確定 |
| `auth.ts` を巻き込んで挙動変更 | 中 | `auth.ts` はスコープ外（§index スコープ）。軽量変種を統合しない |

## 4. ゲート判定

**判定: PASS（Phase 4 へ進行可）**

- util surface（`resolveServiceBinding` / `stripTrailingSlash` / `selectAndFetch`）が pure refactor 制約を満たす形で確定。
- 3 呼び出し側の差替マッピングが挙動不変で記述済み。
- 真理値表（§Phase 01 4-7）が実装の不変参照として固定済み。
- `auth.ts` 除外の技術的理由が明記済み（CONST_007 整合）。
