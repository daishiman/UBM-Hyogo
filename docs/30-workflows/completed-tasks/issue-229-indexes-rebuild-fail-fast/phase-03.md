# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-31 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| 実装区分 | 実装仕様書 |

## 目的

Phase 2 設計を代替案と比較し、Phase 4 以降へ進めるかを判定する。base case（案 A）を PASS で確定する。

## 代替案比較

| 案 | 概要 | 価値 | リスク | 判定 |
| --- | --- | --- | --- | --- |
| **A（base case）** | `generate-index.js` 単体に atomic write helper + decisive log + silent catch 分離 + CLI ガード + export 化。出力 byte-identical | AC-1〜AC-8 を最小差分で満たす。既存 CI / hook 無影響 | rename atomicity が同一 FS 前提（tmp を同一 dir に置けば回避） | **PASS** |
| B | 複数 skill 横断の rebuild orchestrator を新設し、各 skill の generate-index を子プロセスで集約 | 将来 skill 増加時に拡張容易 | 現状 `indexes:rebuild` は単一経路。orchestrator は over-scope（CONST_007 違反の先送り口実になる）。byte-identical 維持が複雑化 | MAJOR（却下） |
| C | アプリ側で index を完全静的化し rebuild 自体を廃止 | rebuild 失敗の概念が消える | drift 検出（CI verify-indexes）の前提が崩壊。skill ledger 運用全体の再設計が必要 | MAJOR（却下） |
| D | 例外を throw せず警告ログのみで継続（best-effort） | 部分成功でも index が更新される | AC-1（非ゼロ exit）と AC-2（部分書き込み防止）に正面衝突。decisive でない | MAJOR（却下） |

> 結論: 案 A を base case として確定。B/C は over-scope / 前提崩壊で却下、D は AC と衝突で却下。

## レビュー指摘（PASS / MINOR / MAJOR）

| 項目 | 判定 | 内容 / 対応 |
| --- | --- | --- |
| atomic 境界の所有権 | PASS | `writeAllIndexesAtomic` が唯一の atomic 境界所有者。state ownership 表で明確 |
| byte-identical 維持 | PASS | 出力文字列を不変とし書き込み経路のみ変更。Phase 4/11 で `git diff` 0 回帰 |
| rename の EXDEV リスク | MINOR | tmp を出力先と同一 `indexes/` dir に置くことで回避。Phase 2 D-1 / 苦戦箇所に明記済 |
| import 副作用 | PASS | CLI 実行ガード（`import.meta.url` 判定）で排除。TC-06 で回帰 |
| silent catch 分離の過剰 throw リスク | MINOR | ENOENT のみ空継続、その他 throw。ENOENT 以外で実際に index が壊れる場面は稀だが decisive 優先で許容。Phase 4 TC-04/TC-05 で両分岐を確認 |
| テスト配置 | PASS | `scripts/__tests__/` で root vitest glob に乗り CI 実行される（`.claude/skills/**` は glob 外） |
| scope（task-spec-creator 除外） | PASS | 未配線のため scope 外。Phase 12 未タスク候補に記録 |

## 着手可否ゲート

- base case（案 A）: **PASS（with notes: EXDEV 回避のため tmp は同一 dir / silent catch は ENOENT のみ空継続）**
- MAJOR 指摘: なし（B/C/D は却下済みで base case に含まれない）
- → Phase 4 へ進行可

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 実在 3 穴（部分書き込み / 原因不明ログ / silent catch）を塞ぐ |
| 実現性 | PASS | 最小差分。repo 内 atomic write 先例あり |
| 整合性 | PASS | byte-identical で既存 CI/hook/index と整合。不変条件 #5/#8 遵守 |
| 運用性 | PASS | 1 ファイル差分中心で revert 容易。hook/CI 挙動回帰維持 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | （本ワークフロー）phase-02.md | レビュー対象設計 |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例 |
| 必須 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビューゲート基準 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー主成果物（代替案 4 案 / PASS-MINOR-MAJOR / 着手可否ゲート / 4 条件） |
| メタ | artifacts.json | Phase 3 状態の更新（completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 代替案 4 案以上が PASS/MINOR/MAJOR で評価されている
- [x] base case（案 A）が PASS（with notes）で確定している
- [x] MAJOR 指摘が残っていない（残課題は MINOR で対応方針明記）
- [x] 4 条件が全 PASS で再確認されている

## タスク100%実行確認【必須】

- レビュータスクが全て completed
- outputs/phase-03/main.md が配置済み
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項: base case 案 A 確定 / MINOR 対応（tmp 同一 dir / ENOENT 分岐）/ TC-01〜TC-07
- ブロック条件: なし（Phase 4 進行可）
