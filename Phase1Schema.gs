const INPUT_AI_LAST_COLUMN = 21;
const INPUT_USER_FIRST_COLUMN = 22;

const INPUT_BLOCKS = Object.freeze([
  Object.freeze({ from: 1, to: 12, title: '共通入力' }),
  Object.freeze({ from: 13, to: 17, title: '楽天入力' }),
  Object.freeze({ from: 18, to: 21, title: 'Yahoo入力' }),
  Object.freeze({ from: 22, to: 30, title: '確認と出力設定' })
]);

const PHASE1_INPUT_SCHEMA = Object.freeze([
  { key: 'product_code', label: '商品コード', required: true, note: 'AIからまとめて貼る欄です。英小文字、数字、-、_ を使います。', example: 'uji-matcha-200g' },
  { key: 'title', label: '共通の商品名', required: true, note: '共通で使う基本の商品名です。楽天名やYahoo名を別に入れる場合の土台になります。', example: '宇治抹茶 200g 送料無料' },
  { key: 'category', label: '共通カテゴリ', required: true, note: 'item Robot のカテゴリIDです。数字だけ、または 683|530 のように入れます。', example: '683|530' },
  { key: 'rakuten_genre_id', label: '楽天ジャンルID', required: true, note: '楽天用のジャンルIDです。数字だけで入れます。', example: '100227' },
  { key: 'yahoo_product_category', label: 'Yahoo productカテゴリ', required: true, note: 'Yahoo用のプロダクトカテゴリです。数字だけで入れます。', example: '1001100' },
  { key: 'sale_price', label: '販売価格', required: true, note: '共通の販売価格です。数字だけで入れます。', example: '1480' },
  { key: 'jan_code', label: 'JANコード', required: false, note: 'JANコードがある商品のみ入れます。', example: '4542320580542' },
  { key: 'food_flag', label: '食品フラグ', required: true, note: '1=食品、0=非食品です。税率の分岐に使います。', example: '1' },
  { key: 'image_count', label: '画像枚数', required: true, note: '画像URLを何枚作るかです。0 から 20 の整数で入れます。', example: '3' },
  { key: 'image_ext', label: '画像の種類', required: true, note: 'jpg や png のような拡張子だけを入れます。', example: 'jpg' },
  { key: 'ai_catchcopy', label: '共通の短い説明', required: false, note: 'Phase1のキャッチコピーに使います。楽天やYahoo専用が空欄のときの土台にもなります。', example: '毎日使いやすい大容量サイズ' },
  { key: 'ai_description_material', label: '共通の説明文の元', required: false, note: 'Phase1の商品説明に使います。楽天やYahoo専用の説明が空欄なら土台として使います。', example: '国産茶葉を使った粉末抹茶です。製菓やドリンクにも使えます。' },
  { key: 'rakuten_title', label: '楽天の商品名', required: false, note: '楽天だけ商品名を変えたいときに入れます。空欄なら共通の商品名を使います。', example: '宇治抹茶 200g お菓子作りにも使いやすい粉末茶' },
  { key: 'rakuten_catchcopy', label: '楽天のキャッチコピー', required: false, note: '楽天だけ別の短い説明を使いたいときに入れます。空欄なら共通の短い説明を使います。', example: '毎日の一杯にも製菓にも使いやすい' },
  { key: 'rakuten_pc_desc', label: '楽天PC説明文', required: false, note: '楽天のPC説明文です。空欄なら共通の説明文の元を使います。', example: '楽天PC用の説明文です。素材や使い方を入れます。' },
  { key: 'rakuten_sales_desc', label: '楽天販売説明文', required: false, note: '楽天の販売説明文です。セール情報や補足案内に使います。', example: '期間限定のおすすめ価格です。' },
  { key: 'rakuten_sp_desc', label: '楽天スマホ説明文', required: false, note: '楽天のスマホ用説明文です。空欄なら共通の説明文の元を使います。', example: 'スマホで見やすい短めの説明文です。' },
  { key: 'yahoo_title', label: 'Yahooの商品名', required: false, note: 'Yahooだけ商品名を変えたいときに入れます。空欄なら共通の商品名を使います。', example: '宇治抹茶 200g 国産茶葉使用' },
  { key: 'yahoo_catchcopy', label: 'Yahooのキャッチコピー', required: false, note: 'Yahooだけ別の短い説明を使いたいときに入れます。空欄なら共通の短い説明を使います。', example: 'お菓子作りにも飲用にも使いやすい' },
  { key: 'yahoo_desc', label: 'Yahooの商品説明', required: false, note: 'Yahooの商品説明です。空欄なら共通の説明文の元を使います。', example: 'Yahoo用の商品説明です。HTMLも扱う想定です。' },
  { key: 'yahoo_sp_free', label: 'Yahooスマホ自由欄', required: false, note: 'Yahooのスマホ向け自由欄です。', example: 'スマホだけで見せたい補足情報を入れます。' },
  { key: 'rakuten_delivery_set_id', label: '楽天の配送方法セット番号', required: false, note: '人が確認して入れる欄です。送料はここから自動で決まります。5なら送料込み、2なら送料別として出します。', example: '5' },
  { key: 'rakuten_display_price', label: '楽天の表示価格', required: false, note: '楽天 itemsub の「表示価格」です。空欄なら sale_price と同じ値を使います。', example: '1480' },
  { key: 'rakuten_double_price_text_mode', label: '楽天の二重価格文言', required: false, note: '楽天 itemsub の「二重価格文言」です。0=表示しない、1=比較対照価格、2=メーカー希望小売価格、空欄=設定しません。', example: '1' },
  { key: 'yahoo_shipping_group_id', label: 'Yahooの配送グループ番号', required: false, note: '人が確認して入れる欄です。Yahooの配送グループ管理番号を入れます。', example: '2' },
  { key: 'attribute_template_key', label: '属性テンプレート名', required: false, note: '「楽天商品属性テンプレート」シートとつなぐための名前です。楽天ジャンルIDを使う行では、この名前に合う属性セットを使います。', example: 'default' },
  { key: 'note', label: 'メモ', required: false, note: '社内メモです。CSVには出ません。', example: '初回出品分' },
  { key: 'publish_phase1', label: 'Phase1を出力するか', required: true, note: 'ir-item.csv に出したい行だけ 1 を入れます。', example: '1' },
  { key: 'publish_rakuten', label: '楽天itemsubを出力するか', required: true, note: '楽天用 ir-itemsub に出したい行だけ 1 を入れます。', example: '1' },
  { key: 'publish_yahoo', label: 'Yahoo itemsubを出力するか', required: true, note: 'Yahoo用 ir-itemsub に出したい行だけ 1 を入れます。', example: '1' }
]);

const REVIEW_SCHEMA = Object.freeze([
  '入力した行番号',
  'Phase1を出力するか',
  '楽天itemsubを出力するか',
  'Yahoo itemsubを出力するか',
  'Phase1のCSVに出るか',
  '最終的な商品コード',
  'CSVに入る商品名',
  '入力した共通カテゴリ',
  'CSVに入るカテゴリ',
  '入力した楽天ジャンルID',
  'CSVに入る楽天ジャンルID',
  '入力したYahoo productカテゴリ',
  'CSVに入るYahoo productカテゴリ',
  '入力した販売価格',
  'CSVに入る販売価格',
  '確定表示価格',
  '入力したJANコード',
  '入力した食品フラグ',
  '消費税',
  '消費税率',
  '軽減税率',
  '入力した画像枚数',
  '入力した画像の種類',
  '生成画像枚数',
  '画像1',
  '画像2',
  '画像3',
  '画像4',
  '共通の短い説明',
  '共通の説明文の元',
  '属性テンプレート名',
  'メモ',
  'エラー件数',
  '止まっている理由'
]);

const ERROR_SCHEMA = Object.freeze([
  '入力した行番号',
  'どの項目で止まったか',
  '止まり方の種類',
  '直し方の案内',
  'Phase1を出力するか',
  '商品コード'
]);

const IR_ITEM_HEADER = buildIrItemHeader_();

function buildIrItemHeader_() {
  const header = [
    '商品コード（楽天URL）',
    '楽天商品番号',
    'カテゴリ',
    '商品名',
    '楽天ジャンルID',
    '非製品属性タグID',
    'yahooプロダクトカテゴリ',
    'キャッチコピー',
    'モバイルキャッチコピー',
    '販売価格',
    '消費税',
    '消費税率',
    '軽減税率',
    '表示価格',
    '送料',
    '個別送料',
    '置き配指定',
    '倉庫指定',
    'JANコード',
    'ソーシャルギフト',
    'PC用商品説明文',
    'PC用商品説明文改行',
    'モバイル用商品説明文',
    'モバイル用商品説明文改行',
    'スマートフォン用商品説明文',
    'スマートフォン用商品説明文改行',
    'PC用販売説明文',
    'PC用販売説明文改行'
  ];

  for (let i = 1; i <= PHASE1_CONFIG.maxImageSlots; i += 1) {
    header.push(`画像${i}`);
  }
  for (let i = 1; i <= PHASE1_CONFIG.maxImageSlots; i += 1) {
    header.push(`画像${i}の説明`);
  }

  header.push(
    '在庫タイプ',
    '選択肢項目名1（横軸）',
    '選択肢項目名2（縦軸）',
    'Yahoo スペック項目（横軸）',
    'Yahoo スペック項目（縦軸）',
    '在庫数',
    '在庫無制限',
    'au PAY マーケット管理ID',
    '付箋1',
    '付箋2',
    '付箋3',
    '新品・中古',
    'カタログIDなしの理由',
    'セット商品用カタログID',
    'オプションマスタ',
    '自由入力行（項目）1',
    '自由入力行（値）1',
    '自由入力行（項目）2',
    '自由入力行（値）2',
    '自由入力行（項目）3',
    '自由入力行（値）3',
    '自由入力行（項目）4',
    '自由入力行（値）4',
    '自由入力行（項目）5',
    '自由入力行（値）5'
  );

  for (let i = 1; i <= 100; i += 1) {
    header.push(`商品属性（項目）${i}`);
    header.push(`商品属性（値）${i}`);
    header.push(`商品属性（単位）${i}`);
  }

  return header;
}
