# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

AC-1〜AC-8 の充足を、各 AC を担保するタスク・テスト・検査と対応付けて最終確認し、blocker の有無を判定する。本サイクルは仕様書作成段階のため、判定列は「実装時に満たすべき条件」と「充足エビデンス（実行時に取得）」を分離して記録する。

## 実行タスク

### 10.1 AC 充足チェック表

| AC | 内容（要約） | 担保タスク | 充足エビデンス | 判定 |
|----|--------------|-----------|----------------|------|
| AC-1 | `/me` 404（`MEMBER_SESSION_404`）時、生エラーを出さず再ログイン CTA（`/login?redirect=/profile`）つき明示エラー | T03 | PF-1（page）/ SE-1（SectionError CTA 描画） | implemented_local_evidence_captured: PASS 確認済 |
| AC-2 | `/me` 404 以外の非2xx 時、技術文字列を出さず一般文言 +「再読み込み」 | T03 | PF-2 | 同上 |
| AC-3 | `/me` 401 時は従来どおり `/login?redirect=/profile` redirect（回帰なし） | T03 | PF-3 | 同上（NO-GO 対象） |
| AC-4 | API が `GET /me/`（末尾スラッシュ）を 404 でなく `GET /me` と同じ解決へ（未認証 401） | T01 | TS-1/TS-6（unit 308）/ MM-2（統合 401） | 同上 |
| AC-5 | フルアプリ・マウント経由の統合テストが存在し `GET /me`→401・`GET /me/`→404 にならないことを保証 | T01 | MM-1〜MM-5（`me-route-mount.integration.spec.ts`） | 同上（再発検知の正本） |
| AC-6 | proxy が空 path（`/api/me`）で末尾スラッシュ無し `/me` を送る。子 path 回帰なし | T02 | PX-1（空 path）/ PX-2〜PX-5（子 path） | 同上 |
| AC-7 | `/me` の shape・path・D1 schema・Google Form 仕様を一切変更しない | T01/T02/T03 | Q-4（diff 静的検査）/ MM-5（shape 不変 assert） | 同上（NO-GO 対象） |
| AC-8 | `pnpm typecheck` / `pnpm lint` / 対象 vitest が全 PASS | T01/T02/T03 | L-1 / L-2 / L-3a〜L-3e（Phase 9） | 同上 |

### 10.2 blocker 判定

| 観点 | blocker か | 根拠 |
|------|-----------|------|
| 設計の実現性 | 非 blocker | 既存 middleware パターン / 既存 primitive 拡張 / 文字列構築修正のみ（Phase 3 §3.5 PASS） |
| AC-3 / AC-7（NO-GO 条件） | 実行時に要厳格確認 | 回帰すれば blocker。PF-3 / Q-4 / MM-5 で検知し、崩れた場合は該当タスクを revert（Phase 8 §8.4） |
| マウント検証の盲点（AC-5） | 解消方針確定 | サブアプリ直叩きをやめ実 `app` をマウント経由で叩く MM-1〜MM-5 で再発検知 |
| 未決事項 | なし | 3 タスクは独立・並列実装可能。先送り / 別 PR / バックログ送り無し |

判定: **blocker なし**。実装着手後は AC-3 / AC-7 の NO-GO を最優先で監視し、L-1〜L-3 全 PASS かつ Q-1〜Q-4 違反 0 をもって AC-8 充足とする。

### 10.3 VISUAL エビデンス取扱い

- T03 は `/profile` のエラーバナー UI を変更する（VISUAL_ON_EXECUTION）。staging スクリーンショットは認証必須のため user-gated とし、本サイクルでは取得しない。
- ローカルでの描画担保は PF-1/PF-2/PF-4・SE-1〜SE-4（jsdom render）で代替し、Phase 11 でスクリーンショット計画を記述する。

## 完了条件

- [x] AC-1〜AC-8 を担保タスク・充足エビデンスと対応付け
- [x] blocker 判定（blocker なし）と NO-GO 監視対象（AC-3 / AC-7）を明示
- [x] VISUAL エビデンスの user-gated 取扱いを記録

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | AC-3 / AC-4 の 401 境界根拠 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | AC-7 の shape / path 不変基準 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 境界（AC-5 解決根拠） |

- `outputs/phase-1/phase-1.md`（AC-1〜AC-8 正本）
- `outputs/phase-6/phase-6.md`（テストケース）
- `outputs/phase-9/phase-9.md`（L-1〜L-3 / Q-1〜Q-4）

## 統合テスト連携

AC-5 を担保する MM-1〜MM-5 が再発検知の正本。Phase 11 で `/profile` の手動テスト計画とスクリーンショット証跡（user-gated）を記述し、Phase 12 で実装ガイド・SSOT 同期・compliance へ引き継ぐ。
