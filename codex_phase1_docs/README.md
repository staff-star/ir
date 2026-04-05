# Codex Phase1 docs pack

## 目的
Codex に Phase1 (`ir-item.csv` 生成のみ) を実装させるための最小資料セット。

## フォルダ構成
### docs/
- `requirements_phase1.md`
- `current_decisions.md`
- `fixed_rules.md`
- `acceptance_criteria.md`
- `ir-item_template_official_note.md`
- `real_data_sample_note.md`

### samples/
- `ir-item_current_sample.csv`
- `ir-item_reference_header_from_sample.csv`
- `ir_item_header_analysis.csv`
- `ir_item_phase1_runtime_inputs.csv`

## 推奨の読ませる順序
1. `docs/requirements_phase1.md`
2. `docs/current_decisions.md`
3. `docs/fixed_rules.md`
4. `docs/acceptance_criteria.md`
5. `docs/ir-item_template_official_note.md`
6. `docs/real_data_sample_note.md`
7. `samples/ir-item_reference_header_from_sample.csv`
8. `samples/ir-item_current_sample.csv`

## Codex への注意
- 全体像は理解してよいが、実装対象は Phase1 のみ
- itemsub / バリエーションを勝手に実装しない
- 手元サンプルと公式テンプレートに差分があれば、公式テンプレートを優先する