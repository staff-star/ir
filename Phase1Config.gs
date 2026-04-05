const PHASE1_CONFIG = Object.freeze({
  sheetNames: Object.freeze({
    guide: '使い方',
    input: '中間入力',
    review: '確認用',
    errors: 'エラー一覧'
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
    irItem: 'Shift_JIS'
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
