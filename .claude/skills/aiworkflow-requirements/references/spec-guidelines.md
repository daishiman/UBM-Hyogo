# 仕様書記述ガイドライン

> 本ドキュメントは aiworkflow-requirements スキルの記述ルールを定義する。

---

## テンプレート一覧

新規仕様作成時は、カテゴリに応じたテンプレートを使用する。

| カテゴリ         | prefix          | テンプレート             | 用途                       |
| ---------------- | --------------- | ------------------------ | -------------------------- |
| インターフェース | `interfaces-`   | interfaces-template.md   | 型定義、IPC、Preload API   |
| アーキテクチャ   | `architecture-` | architecture-template.md | 設計パターン、レイヤー構成 |
| API設計          | `api-`          | api-template.md          | REST/IPC エンドポイント    |
| データベース     | `database-`     | database-template.md     | スキーマ、マイグレーション |
| UI/UX            | `ui-ux-`        | ui-ux-template.md        | コンポーネント、状態管理   |
| セキュリティ     | `security-`     | security-template.md     | 脅威モデル、対策           |
| 技術スタック     | `technology-`   | technology-template.md   | 技術選定、バージョン管理   |
| Claude Code      | `claude-code-`  | claude-code-template.md  | Skill/Agent/Command        |
| デプロイ         | `deployment-`   | deployment-template.md   | CI/CD、環境構成            |
| ワークフロー     | `workflow-`     | workflow-template.md     | フェーズ構成、トリガー     |
| その他           | (なし)          | spec-template.md         | 汎用仕様書                 |

**テンプレート配置**: `assets/` ディレクトリ

---

## 命名規則

仕様更新は classification-first で対象を決める。責務に合わない既存ファイルへ追記せず、semantic filename で分離する。旧連番・旧 path が関係する場合は `legacy-ordinal-family-register.md` を先に確認し、同一 wave で `resource-map` / `quick-reference` / `topic-map` / artifact inventory / mirror validation まで閉じる。

### ADR / deploy target decision の同期

ADR や deploy target decision を正本へ追加する場合は、decision record だけで閉じない。classification-first で次を同一 wave に同期する。

| 対象 | 反映内容 |
| --- | --- |
| decision record | Status / Decision / Consequences / related task |
| parent docs | 現状、将来状態、stale contract withdrawal、移行責務 |
| indexes | `resource-map` / `quick-reference` / `topic-map` / `keywords` |
| workflow docs | task-workflow、artifact inventory、LOGS |
| backlog | 既存 unassigned task との duplicate / blocks / related 更新 |
| lessons | 苦戦箇所、base case 切替、重複起票回避の知見 |

Pages / Workers のように現状と採択後状態が分かれる decision は、`現状` / `将来` / `根拠` の列を持つ表で記録する。`wrangler.toml` や GitHub Actions workflow など source of truth が複数ある場合は、実ファイルに残る drift を `stale` として明示し、実 cutover は別 task へ委譲する。

### Promoted implementation workflow の同期

`spec_created` で作成した workflow が同じブランチ内で実装 evidence まで進んだ場合、Phase 12 summary に `pending same-wave sync` を残したまま完了扱いにしない。少なくとも次を同一 wave で揃える。

| 対象 | 反映内容 |
| --- | --- |
| workflow root | `artifacts.json` と `index.md` の lifecycle を `verified` / `implementation_complete_pending_pr` など実態に合わせる |
| indexes | `resource-map` / `quick-reference` に current canonical workflow と主要実装ファイルを登録する |
| workflow docs | `task-workflow-active.md` に状態、Phase 11/12 evidence、Phase 13 approval gate を登録する |
| legacy mapping | 起票元・旧 stub がある場合は `legacy-ordinal-family-register.md` に canonical path を登録する |
| residual work | manifest stale detection や外部 branch risk など大きな残課題は unassigned task に formalize する |

### Generated artifact を暫定正本とする workflow の retirement 条件

`apps/api/src/repository/_shared/generated/static-manifest.json` のような generated artifact を「暫定 baseline source」として採用する場合、無期限に残留しないよう retirement 条件を仕様側に明記する。最低限次を Phase 1 / Phase 12 ドキュメントへ記録する。

| 記録項目 | 内容 |
| --- | --- |
| 採用理由 | なぜ generated artifact を一時的に正本扱いするか（例: 03a alias queue 完成までの interim baseline） |
| 退役条件 | どの workflow / Phase / contract が満たされたら artifact を破棄・差し替えるか |
| stale detection | drift 検知方法（schema version / hash / regenerate command）と検知時の責務 owner |
| diagnostics 経路 | resolver / builder が emit する `diagnostics` を Phase 11 evidence と CI gate に流す経路 |
| follow-up task | retirement work を担当する unassigned task ID（例: `task-ut02a-canonical-metadata-diagnostics-hardening-001`） |

`generated/` 配下の artifact が Phase 12 時点で remove されない場合は、retirement 条件と stale 監視責務を明示した unassigned task を必ず起票し、`legacy-ordinal-family-register.md` の Current Alias Overrides 列で「暫定 baseline 採用中」を可視化する。

### ファイル命名

```
{prefix}-{topic}.md
```

| ルール     | 説明                               | 例                                          |
| ---------- | ---------------------------------- | ------------------------------------------- |
| kebab-case | 小文字・ハイフン区切り             | `api-endpoints.md`                          |
| prefix     | トピックカテゴリ                   | `architecture-`, `api-`, `ui-ux-`           |
| 番号なし   | ファイル追加時にリネンバリング不要 | ✅ `database-schema.md` ❌ `15-database.md` |

### prefix ガイド

| prefix          | 用途                     |
| --------------- | ------------------------ |
| `architecture-` | アーキテクチャ・設計     |
| `interfaces-`   | 型定義・インターフェース |
| `api-`          | API設計・エンドポイント  |
| `database-`     | データベース・スキーマ   |
| `ui-ux-`        | UI/UXデザイン            |
| `security-`     | セキュリティ             |
| `technology-`   | 技術スタック             |
| `claude-code-`  | Claude Code関連          |
| `workflow-`     | ワークフロー             |
| (なし)          | 単独トピック             |

## 記述形式

仕様は**文章中心**で記述する。ソースコードは避け、誰でも理解できる粒度で記述する。

### 推奨形式

| 形式     | 用途                          | 例                        |
| -------- | ----------------------------- | ------------------------- |
| 文章     | 設計意図、目的、概念の説明    | 「認証は2要素認証を採用」 |
| 表       | データ構造、設定項目、API仕様 | フィールド定義表          |
| 箇条書き | 手順、要件、チェックリスト    | 実装手順リスト            |

### 見出しルール

| ルール        | 例                  | 説明                   |
| ------------- | ------------------- | ---------------------- |
| 番号なし      | `## 概要` ✅        | `## 1. 概要` ❌        |
| 命名ベース    | `### 機能要件`      | 内容を表す名前で管理   |
| 階層は3段まで | `##`, `###`, `####` | 深すぎるネストを避ける |

## すべきこと

- 文章による説明（設計意図・目的を明確に）
- 表形式でデータ構造・設定項目を整理
- 箇条書きで手順・要件をリスト化
- 見出しは命名ベースで管理（番号なし）
- 500行を超える場合は分割を検討
- prefix命名規則に従う

## 避けるべきこと

- ソースコードの直接記述（TypeScript, JSON, SQL等）
- 見出しへの番号付け（例: `## 1. 概要` → `## 概要`）
- 実装詳細への偏り
- 専門用語の説明なしでの使用
- references/以外に仕様情報を分散
- 深いネスト構造

## 新規仕様の追加手順

1. **テンプレートをコピー**: `assets/spec-template.md`
2. **命名規則に従う**: `{prefix}-{topic}.md`
3. **配置**: `references/` 直下
4. **SKILL.md更新**: 不要（自動反映）
5. **インデックス更新**: `node scripts/generate-index.js`

## 完了タスクセクション標準化

全仕様書の「完了タスク」セクションは以下のフォーマットに統一する。Phase 12 Step 1-A で仕様書にタスク完了記録を追加する際に、このフォーマットに従うこと。

### 標準フォーマット

```markdown
## 完了タスク

### タスク: {{TASK_NAME}}（{{YYYY-MM-DD}}完了）

| 項目 | 内容 |
| --- | --- |
| タスクID | {{TASK_ID}} |
| ステータス | **完了** |
| 完了日 | {{YYYY-MM-DD}} |
| 実装内容 | {{実装内容の1行サマリー}} |

**テスト結果サマリー**:
- テスト数: {{N}}件全PASS
- カバレッジ: Line {{X}}% / Branch {{Y}}% / Function {{Z}}%

**成果物**:

| 成果物 | パス |
| --- | --- |
| {{成果物名}} | {{相対パス}} |
```

### 記載ルール

| ルール | 説明 |
| --- | --- |
| 見出しレベル | `### タスク:` で統一（`##` ではない） |
| 日付形式 | ISO 8601（`YYYY-MM-DD`） |
| テスト結果 | 件数とカバレッジを必ず記載 |
| 成果物テーブル | 実際の出力ファイルパスを記載 |
| 複数タスク | 完了日降順で並べる（最新が上） |

### 避けるべきパターン

- 「完了」の一言だけで詳細なし
- テスト結果・カバレッジの省略
- 成果物テーブルの省略
- 日付なしの完了記録

---

## ファイルサイズ管理

| 閾値      | アクション |
| --------- | ---------- |
| 500行以下 | 適正       |
| 500-700行 | 分割検討   |
| 700行超   | 要分割     |

### 分割スクリプト

```bash
# 分割候補を分析
node scripts/split-reference.js --analyze

# 設定に基づいて分割
node scripts/split-reference.js --split <file> <config.json>
```
