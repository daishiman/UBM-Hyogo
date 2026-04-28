# Phase 6: テスト拡充 — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 6（テスト拡充） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 4 で固定した正常系テスト（AC-1〜AC-4 / EV-1〜EV-7）に対し、本フェーズでは **異常系・境界条件・運用劣化シナリオ**を docs として固定する。実装は後続タスクが担うが、ここで「再現手順 / 期待動作 / 検出手段」を一意に決めることで、後続実装で追加判断する余地を排除する。

## サマリ

- 失敗ケースは合計 6 件（F-1〜F-6）。それぞれを `failure-cases.md` に章立てで記述。
- Phase 1 §9 / Phase 2 §7 のリスク表に列挙されたリスクを **すべて 1 件以上の failure case にマッピング**することで網羅性を担保する。
- 本タスクは docs-only / NON_VISUAL のため、テスト「実行」は Phase 11 手動テストで行う。Phase 6 はテスト「定義」の拡充にとどめる。
- 失敗ケース表は Phase 7 の仕様網羅率マトリクスと相互参照する。

## リスク → 失敗ケース 対応

| Phase 1/2 リスク | 対応 failure case |
| --- | --- |
| skill symlink 撤去で既存ワークフローが壊れる | F-4（既存 symlink 残存） |
| macOS で `flock(1)` が無い | F-1（flock 不在環境） |
| 日本語パス（`個人開発`）で lock パスが破綻 | F-2（日本語パス） |
| tmux 既存セッション env 汚染 | F-3（tmux 多重 attach） |
| lock ファイル孤児化 / 競合 | F-6（lock 取得失敗） |
| `mise install` 未実施で Node バージョンずれ | F-5（mise install 未実施 worktree） |

## 成果物

- [`failure-cases.md`](./failure-cases.md) — 失敗ケース集（F-1〜F-6）

## 完了条件

- [x] テスト拡充 の成果物が artifacts.json と一致する（`outputs/phase-6/main.md` / `outputs/phase-6/failure-cases.md`）。
- [x] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。
- [x] 失敗ケースが Phase 1/2 のリスク表を網羅する。

## 後続 Phase への申し送り

- Phase 7 では本フェーズの failure case を仕様網羅率マトリクスに組み込む。
- Phase 11 手動テストでは F-1〜F-6 のうち **再現可能なもののみ実機確認**し、再現不可能なケース（NFS 等）は「想定外」として記録する。
