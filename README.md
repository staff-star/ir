# item Robot Phase1 / Phase2 GAS

`中間入力` は 1 枚のまま使い、共通 / 楽天 / Yahoo の CSV を分けて作る実装です。出力フラグは持たず、CSV を書き出したときは全行を対象にし、エラー行だけを自動で除外します。

## 中間入力列
左の AI 一括入力:
1. `product_code`
2. `title`
3. `category`
4. `rakuten_genre_id`
5. `yahoo_product_category`
6. `sale_price`
7. `rakuten_title`
8. `rakuten_catchcopy`
9. `rakuten_pc_desc`
10. `rakuten_sales_desc`
11. `rakuten_sp_desc`
12. `yahoo_title`
13. `yahoo_catchcopy`
14. `yahoo_desc`
15. `yahoo_sp_free`

右の人確認入力:
16. `food_flag`
17. `image_count`
18. `image_ext`
19. `rakuten_delivery_set_id`
20. `yahoo_shipping_group_id`
21. `attribute_template_key`
22. `note`
23. `jan_code`

## 廃止した入力
- `publish_phase1`
- `publish_rakuten`
- `publish_yahoo`
- `rakuten_display_price`
- `rakuten_double_price_text_mode`
- `ai_catchcopy`
- `ai_description_material`

## 共通 CSV
- 全行を対象にし、エラー行だけ除外します
- `表示価格` は `sale_price` と同じ値です
- `キャッチコピー` は空欄です
- `モバイルキャッチコピー` は空欄です
- `PC用商品説明文` は空欄です
- `モバイル用商品説明文` は空欄です
- `スマートフォン用商品説明文` は空欄です

## 楽天 itemsub
- 全行を対象にし、エラー行だけ除外します
- `表示価格` は `sale_price` と同じ値です
- `二重価格文言` は `1` 固定です
- `表示先カテゴリ` は空欄です
- `楽天ジャンルID` は空欄です
- `カタログID` は空欄です
- `商品画像1〜20` は空欄です
- `在庫あり時出荷リードタイム` は `リードタイム（１日）` 固定です
- `在庫あり時納期管理番号` は `1` 固定です
- `送料` は `rakuten_delivery_set_id` から導出します
  - `5 -> 1`
  - `2 -> 0`
- 商品属性の列見出しは CSV に残し、値は空欄です

## Yahoo itemsub
- 全行を対象にし、エラー行だけ除外します
- `商品コード` は空欄です
- `yahooプロダクトカテゴリ` は空欄です
- `通常販売価格` は空欄です
- `JANコード/ISBNコード` は空欄です
- `商品情報` は空欄です
- `商品説明` は `yahoo_desc` を使います
- `フリースペース（スマホのみ）` は `yahoo_sp_free` を使います
- 改行フラグは `0` 固定です
- `在庫あり時の表示文言` は列がある場合も空欄です

## メニュー
メニュー名は `CSV出力ツール` です。

- `シートを準備する`
- `使い方と見本を更新`
- `共通の確認を更新`
- `楽天の確認を更新`
- `Yahooの確認を更新`
- `共通CSVを書き出す`
- `楽天CSVを書き出す`
- `YahooCSVを書き出す`

## 実装ファイル
- `Phase1Config.gs`
- `Phase1Schema.gs`
- `Phase1Pipeline.gs`
- `Phase2Schema.gs`
- `Phase2RakutenPipeline.gs`
- `Phase2YahooPipeline.gs`
- `Phase1Tests.gs`
