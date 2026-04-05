# requirements_phase1.md

## 目的
AI が提案した商品情報を、GAS で整形・検証し、担当者が最終確認したうえで `ir-item.csv` を生成する。

## 今回の対象範囲
Phase1 は `ir-item.csv` のみを対象とする。

### 対象
- AI 提案データの受け取り
- GAS による整形・固定値補完・検証
- 確認用シート/確認用CSVの生成
- `ir-item.csv` の生成
- item Robot へのインポート前提のCSV出力

### 対象外
- 楽天用 `ir-itemsub.csv`
- Yahoo!用 `ir-itemsub.csv`
- バリエーションCSV
- オプションCSV
- item Robot から一度ダウンロードし直す前提の標準フロー

## 全体像
最終的には以下へ拡張可能な構造を維持する。

- `ir-item.csv`
- `ir-itemsub.csv`（楽天）
- `ir-itemsub.csv`（Yahoo!）
- バリエーションCSV
- 必要に応じた属性・オプション制御

ただし Phase1 実装では上記を実装しない。

## 標準フロー
1. 元データを投入する
2. AI が商品名・価格・説明素材などを提案する
3. GAS がデータを整形・補完・検証する
4. 人が確認用シートで最終確認・必要箇所のみ修正する
5. GAS が `ir-item.csv` を生成する
6. item Robot に `ir-item.csv` をインポートする

## 中間データ方針
- 中間データは 1商品1行
- 人とAIが触る項目のみを持つ
- 最終CSVの大量列は GAS で生成・固定値補完する
- `publish_flag = 1` の行だけを出力対象とする

## 中間データの想定項目
- `product_code_seed`
- `product_code`
- `raw_name`
- `ai_title`
- `final_title_override`
- `category_id_final`
- `price_suggested`
- `sale_price`
- `jan_code`
- `warehouse_flag`
- `tax_class`
- `image_count`
- `image_ext`
- `has_white_image`
- `ai_catchcopy`
- `ai_description_material`
- `attribute_template_key`
- `note`
- `publish_flag`

## GAS が担当すること
- 商品コードの正規化
- 商品名の確定
- カテゴリ形式の変換
- 税区分の補完
- 表示価格の設定
- 画像1〜20 URL の生成
- 在庫タイプ関連の固定値設定
- ヘッダ整合チェック
- 必須列チェック
- エラー一覧作成
- 確認用シート作成
- `ir-item.csv` 出力

## `ir-item.csv` の扱い
- A/B/C 列は必須として常に出力する
- 商品コードは一意であること
- GAS だけで最終CSVまで作り切る
- item Robot 再ダウンロードは標準フローに含めない

## 実装時の注意
- 将来の itemsub / バリエーション拡張を壊さない
- ただし Phase1 実装に itemsub / バリエーションのロジックを混ぜない
- シート名・列名は日本語優先
- README に「今回実装した範囲」と「将来拡張ポイント」を明記する