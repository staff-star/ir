# テストケース

## 自動テスト
- 商品コードの正規化
- カテゴリ文字列のパイプ形式変換
- 税区分 `reduced` の変換
- `price_suggested` からの価格フォールバック
- 画像URL生成と白背景画像付与
- `ir-item.csv` ヘッダ件数 393 の確認

## 手動確認ケース
1. 正常系
   `publish_flag = 1`、必須項目あり、画像3枚、白背景あり
   期待値: `確認用` に確定値が出て、`ir-item.csv` に出力される
2. 非出力
   `publish_flag = 0`
   期待値: `確認用` の出力対象が `0` で、CSV には入らない
3. 商品コード重複
   2 行で同じ `product_code`
   期待値: 両行とも `DUPLICATE_PRODUCT_CODE`
4. 商品名未確定
   `raw_name`, `ai_title`, `final_title_override` をすべて空欄
   期待値: `REQUIRED`
5. 価格不正
   `sale_price = 12a0`
   期待値: `INVALID`
6. カテゴリ不正
   `category_id_final = abc`
   期待値: `REQUIRED`
7. 画像数オーバー
   `image_count = 20`, `has_white_image = 1`
   期待値: `WHITE_IMAGE_OVERFLOW`
