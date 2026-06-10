# Skill Feedback Report

> 改善点の有無に関わらず、Template / Workflow / Documentation の 3 観点を固定出力する。

## Template Improvements

- implemented_local_runtime_pending VISUAL workflow では local static screenshot と staging runtime screenshot の境界を明示すること。local PNG が実在する場合は Phase 11 evidence inventory を `present` とし、`outputs/phase-11/metadata.json` の `status: local_static_visual_present_staging_pending` / `evidenceType: local-static-visual` と parity を取る。
- UI 表現層のみの改修（CSS + 最小 markup）では Phase 12 Step 2（ドメイン正本反映）を **N/A 判定**として根拠付きで明記するテンプレ分岐が有効。公開 surface 不変なら specs/*.md 更新は不要。

## Workflow Improvements

- 「UI が見にくい」というユーザー報告を、短絡的な API/機能追加に向けず、まず実コードを Read して CSS 表現層の欠落（本件は `[data-role="tag-picker-options"]` の `display` 不在による block flow 縦積み）を主因と確定するパターンが再現性高い。データ・API の無罪を grep + Read で裏取りしてから設計に入る。
- 副因（選択強調セレクタ `aria-selected` ↔ markup `aria-checked` の不一致）のように、主因調査中に発見した既存バグを同サイクルで併せて是正できると UX 改善の完成度が上がる（INV-7 = 機能不変・見た目のみ改善 に整合する範囲で）。

## Documentation Improvements

- 「strict 7 outputs」は staging runtime PASS を意味しない。implemented-local サイクルでは strict 7 が「local 実装 + static visual + staging pending 境界」の自己診断証跡であることを各 output 冒頭で明示すべき。
- スコープ外項目（category グルーピング / タグ検索 / カード刷新）は「先送り」ではなく「YAGNI による非起票 baseline」として理由付きで記録し、CONST_007（1 サイクル完結・先送り 0）と整合させる。
