# skill-md-codex-validation-fix - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-SKILL-CODEX-VALIDATION-001 |
| タスク名 | SKILL.md Codex 検証エラーの恒久対策 |
| ディレクトリ | docs/30-workflows/skill-md-codex-validation-fix |
| Wave | 1（即時） |
| 実行種別 | parallel-internal（タスク内に並列レーン3本） |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |
| 状態 | completed |
| タスク種別 | tooling_implementation / NON_VISUAL（Node スクリプト改修 + Markdown/YAML 編集のみ。UI 変更なし） |
| implementation_mode | "new"（generate_skill_md.js / init_skill.js への新規ガード追加と既存 SKILL.md 是正） |
| PR 方針 | **単一 PR で完結**（タスク内全 Lane を 1 PR に集約） |
| 既存タスク組み込み | なし |
| GitHub Issue | 未起票（Phase 13 直前にユーザー判断） |

## 目的

Codex CLI 0.125.0 が `~/.agents/skills/` および `.claude/skills/` を再帰スキャンする際の SKILL.md 検証ルール（YAML frontmatter 必須・description ≤ 1024 文字・description は文字列型・YAML 構文有効）に対し、現存する 3 件の実 SKILL.md と 28 件のテストフィクスチャが失敗している。本タスクで以下の 2 軸を同時に解決する。

1. **現状是正**: 既存違反 SKILL.md を仕様準拠に書き直し、テストフィクスチャはスキル走査から外す。
2. **再発防止**: skill-creator の生成ロジックに事前ゲート・YAML エスケープ・要素数上限を組み込み、新規スキル作成時に同種の崩壊が起きないようにする。

## スコープ

### 含む

- `~/.agents/skills/aiworkflow-requirements/SKILL.md` の description 圧縮（≤ 1024 字）と keywords/anchors の `references/` 退避
- `.claude/skills/automation-30/SKILL.md` の YAML 修復（プロンプト本文を `references/elegant-review-prompt.md` に分離、description は要約 1 段落）
- `.claude/skills/skill-creator/SKILL.md` の description 短縮と Anchors の `references/anchors.md` 外出し
- `.claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md` の拡張子を `SKILL.md.fixture` に変更し、テストコード側で読み替えに対応
- `scripts/generate_skill_md.js` への description 事前ゲート、YAML safe escape、Anchors/Trigger 件数上限の追加
- `scripts/init_skill.js` への書き込み前検証フックの追加
- `scripts/quick_validate.js` のロジックを共通化し、generate / write 経路から再利用
- フィクスチャ生成スクリプト（あれば）の出力拡張子を `.fixture` に切替
- `.claude/skills/` 正本と `.agents/skills/` mirror の parity 維持

### 含まない

- Codex CLI 自体の改修（外部ツール）
- skill-creator 以外のスキル新規作成
- aiworkflow-requirements の references/ 内コンテンツの再構成（既存ファイル維持、退避先ファイルのみ新規追加）
- Codex / Claude Code 双方の skill discovery 経路の変更（読み込み側ロジックは触らない）
- description 内に書かれていた keywords を完全網羅して references に保持する作業（必要十分な要約に圧縮する判断はタスク内で行う）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | なし | 本タスクは独立着手可能 |
| 下流 | 今後の任意 skill 新規作成タスク | generate_skill_md.js のガード強化を前提に新規スキルが作成される |
| 並列（タスク内） | Lane A / Lane B / Lane C | 後述 |

### タスク内 Lane 構造

| Lane | 内容 | 並列性 |
| --- | --- | --- |
| **Lane A**（既存 SKILL.md 是正） | 3 ファイルの description 圧縮と references 分離 | A-1 / A-2 / A-3 を相互並列可 |
| **Lane B**（テストフィクスチャ拡張子変更） | `*/SKILL.md` → `*/SKILL.md.fixture` のリネームと test code の読み替え | A と完全並列 |
| **Lane C**（skill-creator 改修） | generate_skill_md.js / init_skill.js のガード追加とフィクスチャ出力先切替 | **C は B 完了後に最終確認**（Lane B のリネーム結果と C のフィクスチャ生成パス出力が一致する必要がある） |

> 直列依存は **B → C のフィクスチャ出力経路整合のみ**。それ以外は完全並列。

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/skill-creator/scripts/quick_validate.js` | description 1024 字制約の参照ロジック |
| 必須 | `.claude/skills/skill-creator/scripts/generate_skill_md.js` | description 組み立てロジックの改修対象 |
| 必須 | `.claude/skills/skill-creator/scripts/init_skill.js` | 書き込み前ゲートの差し込み箇所 |
| 必須 | `~/.agents/skills/aiworkflow-requirements/SKILL.md` | 是正対象（mirror 同期も同時実施） |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | canonical 正本 |
| 必須 | `.claude/skills/automation-30/SKILL.md` | 是正対象 |
| 必須 | `.claude/skills/skill-creator/SKILL.md` | 是正対象 |
| 必須 | `.claude/skills/skill-creator/scripts/__tests__/` | フィクスチャ拡張子変更対象 |
| 参考 | Codex CLI エラーメッセージ（前会話） | 検証ルールの根拠 |

## 受入条件 (AC)

- **AC-1**: 起動時に `Skipped loading N skill(s) due to invalid SKILL.md files` の警告が **0 件**になる（Codex / Claude Code 双方で確認）
- **AC-2**: 是正対象 3 件の SKILL.md がすべて description ≤ 1024 字、YAML 構文有効、frontmatter 必須キー充足
- **AC-3**: テストフィクスチャ `*/SKILL.md.fixture` への移行後、skill-creator の既存テストがすべて Green
- **AC-4**: `generate_skill_md.js` が description ≥ 1025 字を生成しようとした場合に **書き込み前** に throw する
- **AC-5**: `generate_skill_md.js` が summary / triggerLine 内に改行や `: ` を含む文字列を YAML safe にエスケープする
- **AC-6**: Anchors > 5 件、Trigger keywords > 15 件のとき、超過分が自動的に `references/anchors.md` / `references/triggers.md` へ退避される
- **AC-7**: `.agents/skills/` mirror が `.claude/skills/` 正本と diff 0
- **AC-8**: 単一 PR で完結（PR 内に 3 Lane の差分が共存）

## ベストプラクティス選定（採用根拠）

1. **「現状是正」と「再発防止」を 1 PR に統合**: 是正のみ先行マージすると skill-creator 側で同種失敗が再発し、ガード未実装期間に新規スキルが追加される事故を防ぐため。
2. **テストフィクスチャは拡張子戦略を採用**（`.skillignore` 等のディスカバリ除外設定ではなく）: 外部ツール（Codex / Claude Code）の除外仕様に依存せず、ファイル名で物理的に検証対象から外せるため最も確実。
3. **description 退避先は `references/keywords.json` ではなく `references/keywords.md`**: aiworkflow-requirements は元々 references/ に Markdown 群を持つため、形式整合を優先。
4. **ガードは generate_skill_md.js の戻り値検証 + init_skill.js の writeFile 直前 throw の二段構え**: 単一箇所だと将来の呼び出し経路追加時にバイパスされる。

## Phase 構成と依存

| Phase | 名称 | 並列/直列 | 期待成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | 直列 | scope, AC, inventory |
| 2 | 設計 | 直列 | Lane 設計、escape 規則、ガード仕様 |
| 3 | 設計レビュー | 直列 | review-result |
| 4 | テスト作成（RED） | 直列 | 失敗するテスト群 |
| 5 | 実装（GREEN） | **Lane A / B 並列、C は B 後に整合確認** | 全 Lane diff |
| 6 | テスト拡充 | 並列可 | 回帰テスト追加 |
| 7 | カバレッジ確認 | 直列 | coverage report（変更行限定） |
| 8 | リファクタリング | 直列 | refactor 結果 |
| 9 | 品質保証 | 直列 | line budget / link / mirror parity |
| 10 | 最終レビュー | 直列 | acceptance check |
| 11 | 手動テスト（NON_VISUAL） | 直列 | main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | 直列 | implementation-guide / 6 成果物 |
| 13 | PR 作成 | ユーザー承認後 | 単一 PR |

## NON_VISUAL 宣言

本タスクは UI 変更ゼロ（Node CLI 改修と Markdown/YAML 編集のみ）。Phase 11 のスクリーンショット採取は不要。代替証跡として `main.md` / `manual-smoke-log.md` / `link-checklist.md` に以下を記録する:

- Codex CLI 起動時の警告ゼロ確認ログ
- Claude Code セッション起動時の skill 一覧に warning が出ない確認
- skill-creator のユニットテスト全件 Green

## 関連タスク

| Task | 関係 | 状態 |
| --- | --- | --- |
| 今後の任意 skill 新規作成 | 本タスクの Lane C ガードを利用 | 未起票 |
| skill-fixture-runner | フィクスチャ拡張子変更の影響先 | 既存 |

## 未タスク候補（Phase 12 で再判定）

| 候補 | 内容 | 状態 |
| --- | --- | --- |
| TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001 | task-specification-creator/SKILL.md 500 行超過縮約 | unassigned |
| TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001 | valid-skill fixture の references/example.md リンク追加 | unassigned |
| TASK-DOC-SPEC-UPDATE-WORKFLOW-WARN3-001 | spec-update-workflow.md に Warning 3 段階分類セクション追記 | unassigned |

## Phase ファイル一覧

- [phase-1.md](phase-1.md) — 要件定義
- [phase-2.md](phase-2.md) — 設計
- [phase-3.md](phase-3.md) — 設計レビュー
- [phase-4.md](phase-4.md) — テスト作成（RED）
- [phase-5.md](phase-5.md) — 実装（GREEN）
- [phase-6.md](phase-6.md) — テスト拡充
- [phase-7.md](phase-7.md) — カバレッジ確認
- [phase-8.md](phase-8.md) — リファクタリング
- [phase-9.md](phase-9.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動テスト（NON_VISUAL）
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成
