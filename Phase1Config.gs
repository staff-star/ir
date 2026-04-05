const PHASE1_CONFIG = Object.freeze({
  sheetNames: Object.freeze({
    guide: '使い方',
    sample: '入力見本',
    input: '中間入力',
    rakutenAttributeTemplate: '楽天商品属性テンプレート',
    review: '確認用',
    errors: 'エラー一覧',
    rakutenReview: '楽天確認用',
    rakutenErrors: '楽天エラー一覧',
    yahooReview: 'Yahoo確認用',
    yahooErrors: 'Yahooエラー一覧'
  }),
  mallSettings: Object.freeze({
    rakuten: Object.freeze({
      shopName: '美味セレクト楽天市場店',
      defaults: Object.freeze({
        uploadTargetFlag: '1',
        saleStart: '',
        saleEnd: '',
        defaultDisplayPriceMode: 'same_as_sale_price',
        defaultDoublePriceTextMode: '',
        stockReturnFlag: '0',
        stockLeadTime: '',
        outOfStockLeadTime: '',
        deliveryLeadTime: '自社出荷/RSL',
        stockManagementId: '',
        searchVisibleFlag: '1',
        pageTemplate: '1',
        headerFooterLeftNavi: '自動選択',
        displayOrder: '自動選択',
        commonDescSmall: '自動選択',
        commonDescLarge: '自動選択',
        catalogIdNoneReason: ''
      })
    }),
    yahoo: Object.freeze({
      shopName: '美味セレクト Yahoo店',
      defaults: Object.freeze({
        path: '',
        pageCode: '',
        pageOpenFlag: '',
        uploadTargetFlag: '',
        hiddenPageFlag: '0',
        pointRateType: '1',
        pointRate: '0',
        allowOverOrder: '0',
        defaultShippingGroupId: '',
        stockLeadMessage: '在庫あり'
      })
    })
  }),
  imageBaseUrl: 'http://r-asp02.item-robot.com/upload/images/1681/',
  displayPriceMode: 'same_as_sale_price',
  defaultTaxClass: 'standard',
  defaultWarehouseFlag: '0',
  defaultShippingCode: '1',
  defaultIndividualShippingCode: '0',
  defaultStockType: '1',
  defaultStockQuantity: '0',
  defaultStockUnlimited: '0',
  defaultConditionCode: '0',
  defaultPcSalesCopyLineBreak: '0',
  exportEncoding: Object.freeze({
    intermediate: 'UTF-8',
    irItem: 'Shift_JIS',
    rakutenItemsub: 'Shift_JIS',
    yahooItemsub: 'Shift_JIS'
  }),
  maxProductCodeLength: 32,
  maxProductNameLength: 127,
  maxPriceDigits: 9,
  maxImageSlots: 20,
  copyProductCodeToRakutenItemNumber: true
});

const TAX_CLASS_RULES = Object.freeze({
  standard: Object.freeze({
    taxFlag: '1',
    taxRate: '10',
    reducedTaxRateFlag: '0'
  }),
  reduced: Object.freeze({
    taxFlag: '1',
    taxRate: '8',
    reducedTaxRateFlag: '1'
  })
});
