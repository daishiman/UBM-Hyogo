# Phase 3 成果物: 影響範囲マトリクス

4 施策（A-1 / A-2 / A-3 / B-1）が、影響領域（worktree 数 / hook / render script / skill 利用者 / CI）に与える影響を整理。
影響度: HIGH / MEDIUM / LOW / NONE。

## 1. マトリクス

| 影響領域 \ 施策 | A-1 (gitignore) | A-2 (fragment) | A-3 (Progressive Disclosure) | B-1 (merge=union) |
| --- | --- | --- | --- | --- |
| **worktree 数（並列開発）** | HIGH: 派生物の競合が消滅し、worktree 数を増やしても conflict 増えない | HIGH: 同時 fragment 生成は別 path のため衝突 0 | MEDIUM: SKILL.md 分割で編集箇所が散る → 衝突確率低下 | MEDIUM: 暫定救済。worktree 数が増えても EOF 競合を自動解決 |
| **post-commit / post-merge hook** | HIGH: 「無ければ生成」ガード追加が必要（`[[ -f ... ]] || regenerate`） | MEDIUM: 追記先が `LOGS.md` → `LOGS/<fragment>.md` に変わる。書き込み API 修正必要 | LOW: hook は SKILL.md を直接書かないので影響軽微 | LOW: hook はそのまま。merge driver は git 側で動作 |
| **render script (`pnpm skill:logs:render`)** | LOW: `--out` の出力先を gitignore に揃える程度 | HIGH: 主入力が `LOGS/` ディレクトリに変わる。新規実装 | NONE | NONE |
| **skill 利用者（Claude / 開発者）** | LOW: 派生物が tree から消えるが Progressive Disclosure 経路は不変 | MEDIUM: 旧 `LOGS.md` 直読みコードが壊れる可能性 → 移行ガイド必要 | MEDIUM: SKILL.md 内の章番号・見出しが変わるため bookmark 不可 | LOW: ファイル名は変わらない |
| **CI（lint / typecheck / test）** | LOW: ignore 化された path を追跡確認するチェックが必要なら追加 | MEDIUM: fragment 命名 regex を CI で validate 推奨 | LOW: SKILL.md 行数チェックを CI 追加可能 | LOW: `.gitattributes` の syntax 確認のみ |

## 2. HIGH 影響セルへの対応方針

| セル | 対応 | 担当 Phase |
| --- | --- | --- |
| A-1 × hook | hook ガード仕様を実装ランブックに明記 | Phase 5 |
| A-1 × worktree | 検証手順を並列 commit シミュレーションに含める | Phase 4 / 11 |
| A-2 × worktree | fragment 命名一意性を Phase 4 で検証 | Phase 4 |
| A-2 × render | render-api 仕様書を実装入力に固定 | Phase 6 |

## 3. MEDIUM 影響セルへの対応方針

| セル | 対応 |
| --- | --- |
| A-2 × skill 利用者 | `_legacy.md` 退避と移行ガイド（backward-compat.md 参照） |
| A-3 × 利用者 | 新しい `references/<topic>.md` 一覧を SKILL.md 冒頭で索引化 |
| A-2 × CI | fragment filename 正規表現 validator を Phase 6 で設計 |
| A-2 × hook | 書き込み先を環境変数で切替可能にし、A-2 移行期間中は両方併用可 |

## 4. NONE 影響領域

- runtime application（`apps/web`, `apps/api`, D1, Workers binding）には一切触らない
- `package.json` / `pnpm-workspace.yaml` には render script の bin 追加のみ（Phase 6 実装）
- Cloudflare 設定（`wrangler.toml`）には影響なし

## 5. AC-8 への寄与

- 既存 `LOGS.md` 555 行を破壊しないため、A-2 移行は `_legacy.md` 退避方式（backward-compat.md 推奨案）
- A-3 は SKILL.md を分割するが Anchors / メタ情報は残置 → skill 起動経路を破壊しない
