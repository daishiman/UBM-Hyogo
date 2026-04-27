# Phase 12 出力: implementation-guide.md
# 実装ガイド (中学生レベル概念説明 + 技術者レベル詳細)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 12 / 13 (ドキュメント更新) |
| 作成日 | 2026-04-23 |
| 状態 | completed |

---

## Part 1: 中学生レベル概念説明

このシステムがどのように動いているかを、身近なものに例えて説明します。

このドキュメントが必要なのは、Phase 12 で何を作ったかと次に何を渡すかを一目で分かるようにするためです。たとえば、配布物にラベルがないと、どれが正式版か探すだけで時間がかかります。

#### この機能でできること

- Phase 12 の成果物を1か所で確認できる
- 次の Phase に渡すファイルをすぐに見つけられる
- root `artifacts.json` と `outputs/artifacts.json` の同期状態を確認できる

---

### 今回作ったもの

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | 中学生向け説明と技術者向け詳細を1つにまとめる |
| `outputs/phase-12/system-spec-update-summary.md` | 仕様更新の要否と理由を残す |
| `outputs/phase-12/documentation-changelog.md` | この Phase で何を変えたかを残す |
| `outputs/phase-12/unassigned-task-detection.md` | scope 外にした次の候補を残す |
| `outputs/phase-12/skill-feedback-report.md` | skill への改善点を残す |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 の完了確認を1枚にまとめる |
| `outputs/artifacts.json` | root `artifacts.json` と同じ内容を保つ同期用ミラー |

### Google Sheets は「受付ノート」

Google Sheets (グーグルスプレッドシート) は、バンドの受付で使う「申し込みノート」に相当します。

- バンドのメンバーがここに名前や演奏希望曲を書き込みます
- 誰でも書き込みやすいシンプルな形式です
- ただし、このノートが「唯一の正式な記録」ではありません
- ノートに書かれた内容は、後で「正式な台帳」に転記されます

**ポイント**: Google Sheets はデータを入力するための入口であり、正式な記録 (canonical) ではありません。

---

### D1 は「図書館の正本台帳」

Cloudflare D1 (ディーワン) は、図書館にある「正式な貸出台帳」に相当します。

- 図書館の全ての本の情報が、正確に、整理されて記録されています
- 複数の人が同時に調べても矛盾が生じない構造になっています
- 書き換えには決まった手順 (API 経由) が必要です
- これが唯一の「正しいデータ」の保管場所です

**ポイント**: D1 は全てのアプリケーションデータの唯一の正本 (canonical) を保持します。Sheets から転記されたデータが正式に保存される場所です。

---

### Cloudflare は「窓口」

Cloudflare (クラウドフレア) Pages と Workers は、図書館の「受付窓口」と「調査員」に相当します。

- **Pages (受付窓口)**: 利用者 (ユーザー) が来たときに対応する画面 (ウェブページ) を表示します。「〇〇を調べたい」という要望を聞きます
- **Workers (調査員)**: 受付から依頼を受けて、台帳 (D1) を実際に調べたり、書き込んだりします。直接台帳に触れるのは調査員だけです

**ポイント**: Pages がユーザーと話し、Workers がデータ (D1) を操作します。この役割分担が重要です。

---

### GitHub は「変更履歴」

GitHub (ギットハブ) は、図書館の「工事記録台帳」に相当します。

- いつ、誰が、どこを変更したかが全て記録されています
- 間違えた場合でも、以前の状態に戻せます
- 変更を本番環境に反映する前に、複数人でチェックする仕組み (PR レビュー) があります
- `feature/*` → `dev` → `main` の順番で変更が承認されていきます

**ポイント**: `dev` は「試験運用中」の環境で、`main` が「本番稼働中」の環境です。

---

### 1Password は「鍵の保管庫」

1Password (ワンパスワード) は、図書館の「鍵の保管庫」に相当します。

- API キー (システムのパスワードのようなもの) が安全に保管されています
- 開発者が手元 (ローカル環境) で作業するときに、この保管庫から鍵を取り出して使います
- パスワードをノートに書いて机の上に置く (ソースコードにそのまま書く) ことは禁止されています

**ポイント**: 実際の秘密の値 (API キー等) は、どのドキュメントにも書かれません。必ず 1Password から取得します。

---

## Part 2: 技術者レベル詳細

### task root

```
doc/00-serial-architecture-and-scope-baseline/
```

- **Wave**: 0 (全 Wave の前提となるアーキテクチャ基準線を確立する)
- **execution_mode**: serial (直列実行)
- **docs_only**: true (コード実装なし)

### 型定義

```ts
interface Phase12GuideValidation {
  workflowDir: string;
  guidePath: string;
  checks: Array<{
    id: string;
    label: string;
    ok: boolean;
  }>;
  errors: string[];
}
```

### APIシグネチャ

```ts
export function validatePhase12ImplementationGuide(
  workflowDir: string,
): Phase12GuideValidation;
```

### 使用例

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow doc/00-serial-architecture-and-scope-baseline --json
```

---

### key outputs

| ファイル | 役割 | 参照先 |
| --- | --- | --- |
| `outputs/phase-02/canonical-baseline.md` | アーキテクチャ確定値 / ブランチ対応表 / 責務境界 / シークレット配置 / downstream 参照パスの正本 | Wave 1 全タスクが参照 |
| `outputs/phase-02/decision-log.md` | 採用/非採用の判断根拠ログ / スコープ外決定リスト | 03-serial-data-source-and-storage-contract が参照 |
| `outputs/phase-01/baseline-inventory.md` | 正本仕様との一致確認 / ギャップ分析 | Phase 2 の入力として使用 |

---

### upstream

本タスクは Wave 0 に属し、upstream タスクは存在しない。

| 参照した正本仕様 | 役割 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | アーキテクチャ構成 (Pages/Workers/D1) の正本 |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | ブランチ戦略 (feature→dev→main) の正本 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | シークレット配置 (Cloudflare/GitHub/1Password) の正本 |

---

### downstream

| downstream タスク | 参照するファイル | 参照する情報 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | `canonical-baseline.md` セクション1,3,4 | アーキテクチャ構成 / 責務境界 / シークレット配置 |
| 03-serial-data-source-and-storage-contract | `canonical-baseline.md` セクション1,3 | DB層/入力源 / 入力源責務 |
| 03-serial-data-source-and-storage-contract | `decision-log.md` DL-03, DL-04 | Sheets/D1 採用根拠 |
| Wave 1 全タスク | `canonical-baseline.md` セクション2 | ブランチ/環境対応表 |

---

### validation focus

本タスクの検証における重点確認項目:

1. **AC-1**: `canonical-baseline.md` セクション3 の責務定義が Web/API/DB/入力源で矛盾なく分離されていること
2. **AC-2**: ブランチ/環境対応表が `feature/*→dev→main` / `local→staging→production` で完全に記述されていること
3. **AC-3**: `decision-log.md` に Sheets input / D1 canonical の技術的根拠が残っていること
4. **AC-4**: `decision-log.md` セクション3 にスコープ外項目 (OOS-01〜OOS-08) が分離されていること
5. **AC-5**: `phase-03/main.md` に価値性/実現性/整合性/運用性の4条件 PASS が記録されていること

### エラーハンドリング

- `workflowDir` が存在しない場合は、対象パスを明示して失敗する。
- `outputs/phase-12/implementation-guide.md` が欠けている場合は、Part 1 / Part 2 の両方を作り直す。
- `outputs/artifacts.json` が root と一致しない場合は、ミラーを再生成する。
- validator が `Part 1` または `Part 2` を見つけられない場合は、見出し構造から修正する。

### エッジケース

- docs-only のタスクでも、Phase 12 の記録は省略しない。
- UI 変更がないので、Phase 11 のスクリーンショット要求は発生しない。
- Phase 13 は承認待ちなので、`completed` にせず `pending` のまま扱う。
- `artifacts.json` の古い記録は履歴として残してよいが、現在値と混同しない。

### 設定項目と定数一覧

| 項目 | 値 | 意味 |
| --- | --- | --- |
| `workflowDir` | `doc/00-serial-architecture-and-scope-baseline` | 今回の task root |
| `outputsDir` | `outputs/phase-12` | Phase 12 の成果物置き場 |
| `requiredOutputs` | 6ファイル | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check |
| `phaseCount` | 13 | Phase 1〜13 の総数 |

### テスト構成

- `validate-phase12-implementation-guide.js` で Part 1 / Part 2 の見出しと必須要素を確認する。
- `validate-phase-output.js` で `artifacts.json` と `outputs/artifacts.json` の同期を確認する。
- `validate-schema.js` で `artifacts.json` が許容契約に合うか確認する。
- `manual-smoke-log.md` で Phase 11 の手動確認を残し、Phase 12 の引き継ぎと突き合わせる。

---

## 完了確認

- [x] Part 1: 中学生レベル概念説明作成済み (Sheets/D1/Cloudflare/GitHub/1Password の5項目)
- [x] Part 2: 技術者レベル詳細作成済み (task root / key outputs / upstream / downstream / validation focus)
