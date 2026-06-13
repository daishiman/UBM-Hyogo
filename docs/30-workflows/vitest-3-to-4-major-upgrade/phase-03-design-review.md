# Phase 3: Design Review（設計レビュー）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-01 / phase-02 |
| 判定 | **PASS（Phase 4 へ進行可）** |

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点が固定されているか | OK | 論点は「v4 で**確定的に壊れる設定**（pool API / CLI / plugin-react peer）を bump と同一 wave で消化し、全 693 spec + coverage ゲートを green に保つこと」。version bump 単体でも RED 観測単体でもなく、確定修正と観測修正の二層構造が主問題と明示 |
| 依存関係・責務境界 | OK | 修正はテスト期待値/モック/snapshot/config/package.json scripts に閉じ、プロダクトコード不変。Lane 0 の確定修正と Lane A-C の観測修正の境界が明確 |
| 価値とコストの均衡 | OK | 価値=テスト基盤の v4 系更新による v3 EOL リスク・v3→v5 二段跳び強制の回避、dependabot ノイズ抑止。コスト=不確実なテスト修正幅（C2-C4）。確定修正（C1/C5/C7）は調査で範囲固定済みで、不確実部分は RED 観測で早期に規模を測る |
| 改善優先順位 | OK | Lane 0（確定修正 + bump）→ A/B/C（shard 修正・並列）→ D（締め）の順序が妥当。確定修正を先行させることで RED ノイズ（起動不能 fail）と観測対象（挙動変化 fail）が分離される |
| 4条件評価 | OK | 下表 |

## 4条件評価

- **価値性**: 開発者のテスト実行基盤を vitest 4 系へ更新し、v3 系の保守終了・v5 強制移行リスクを回避する。issue #1200 の「放置した場合の影響」（EOL 強制移行 / dependabot ノイズ / 移行知見の風化）に直接対応する。
- **実現性**: 1サイクルで bump + 確定設定修正 + lockfile + テスト/snapshot 修正 + 閾値整合が収まる想定。Node/Vite 互換は調査で解消済みのため外部依存ゼロ。693 spec のうち実 fail は C2-C4 起因の局所と見込む（全書き換えではない）。
- **整合性**: vitest/coverage-v8 の exact pin 整合、D1 直列化の v4 等価表現、react alias / optimizeDeps 維持、plugin-react ^5.2 による vite 6-8 全域 peer 整合で矛盾なく閉じる。
- **運用性**: CI 5 shard + 補助 suite の green 回復を完了条件に置き、coverage-guard / verify-pr-ready.sh で回帰を担保。後続 resume も `pnpm install` 起点で再現可能。検証コマンドは全て `mise exec --` 固定。

## 因果ループ（簡易）

- 強化ループ: 確定修正の先行消化 → RED ノイズ減少 → C2-C4 分類精度向上 → 修正の的確化 → GREEN 到達速度向上。
- バランスループ: 修正範囲拡大 → プロダクトコード巻き込み・閾値恣意調整リスク増 → 「責務境界（Phase 2）」「不変条件8」で抑制 → 範囲をテスト/config/閾値最小調整に収束。

## エスカレーション条件（CONST_007 例外の発火点）

以下のいずれかを RED 観測時に検知したら、実装を止めてユーザーへ確認する:

1. 単一の破壊的変更で**数百件規模**のテスト書き換えが必要（局所修正で収まらない）。
2. プロダクトコードの挙動変更なしには green にできない fail がある（snapshot が実挙動変化を示す場合を含む）。
3. coverage 閾値を実測ずれの範囲（目安: shard あたり 2pt 級）を超えて下げないと通らない（品質低下を伴う）。
4. `isolate: false` 化による D1 shard の状態リークが `vi.resetModules()` でも解消せず、かつ `maxWorkers: 1` 単独では port exhaustion が再発する（直列化設計の再設計が必要になる場合）。

> いずれも現時点の調査では発生可能性は低い（C1/C5/C7 は確定済みの機械的修正、C2-C4 は期待値/snapshot 修正で解決する性質）。

## 残課題（Phase 4 への申し送り）

- RED 採取は shard 単位で行い、fail を C1〜C8（v4 版）のどのカテゴリかタグ付けして記録する（Phase 4 のテスト設計表に反映）。
- C8 残党（`workspace` / `poolMatchGlobs` / `deps.inline` / `test('n', fn, {opts})` 形式 / `basic` reporter / `UserConfig` 型 import）の有無は `grep -rn` で事前検出しておく（未使用確認の証跡化）。
- snapshot を含む spec の所在を事前 grep し（`toMatchSnapshot` / `toMatchInlineSnapshot` / `__snapshots__`）、C4 の影響範囲を RED 前に見積もる。
- `--update` 実行は「初回生成」と「既存 snapshot との diff 確認」を別ステップとして記録する（FB-IPC-SNAP-002）。

## 判定

**PASS** — 設計は実装可能な粒度に達している。確定修正と観測修正の二層構造、エスカレーション条件、責務境界が固定された。Phase 4（テスト作成 / RED 設計）へ進む。

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-01-requirements.md`, `phase-02-design.md`, task-specification-creator review gates
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-03-design-review.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。

## 完了条件

- Gate-A の設計レビュー判断が記録されている。
- C1-C8 v4 版の確定修正と観測修正の境界が明確である。
- 後続 Phase 4-5 に進むための blocker が残っていない。
