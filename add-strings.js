const fs = require('fs');
const path = require('path');

const newEnStrings = {
  'errors.validationFailed': 'Validation failed',
  'errors.resourceNotFound': 'Resource not found',
  'errors.duplicateTransaction': 'Duplicate generated transaction for this billing date',
  'errors.accountNotSetup': 'Your account is not fully set up. Please sign out and sign in again.',
  'errors.internalServer': 'Internal server error',
  'errors.invalidDate': 'Invalid date',
  'errors.minLineItem': 'Add at least one line item',
  'errors.clientNotFound': 'Client not found',
  'errors.clientNotRetainer': 'Only monthly retainer clients can record recurring payments',
  'errors.clientNotActive': 'Only active clients can record recurring payments',
  'errors.subNotFound': 'Subscription not found',
  'errors.subNotActive': 'Only active subscriptions can record payments',
  'tx.suffix.retainer': ' retainer payment',
  'tx.suffix.oneTime': ' one-time payment',
  'tx.suffix.subscription': ' subscription payment'
};

const newArStrings = {
  'errors.validationFailed': 'فشل التحقق',
  'errors.resourceNotFound': 'المورد غير موجود',
  'errors.duplicateTransaction': 'توجد معاملة مكررة لتاريخ الفوترة هذا',
  'errors.accountNotSetup': 'حسابك غير مكتمل الإعداد. يرجى تسجيل الخروج ثم الدخول مرة أخرى.',
  'errors.internalServer': 'خطأ في الخادم الداخلي',
  'errors.invalidDate': 'تاريخ غير صالح',
  'errors.minLineItem': 'أضف بنداً واحداً على الأقل',
  'errors.clientNotFound': 'العميل غير موجود',
  'errors.clientNotRetainer': 'فقط عملاء الاشتراكات الشهرية يمكنهم تسجيل مدفوعات متكررة',
  'errors.clientNotActive': 'فقط العملاء النشطون يمكنهم تسجيل مدفوعات متكررة',
  'errors.subNotFound': 'الاشتراك غير موجود',
  'errors.subNotActive': 'فقط الاشتراكات النشطة يمكنها تسجيل المدفوعات',
  'tx.suffix.retainer': ' (دفعة اشتراك عميل)',
  'tx.suffix.oneTime': ' (دفعة لمرة واحدة)',
  'tx.suffix.subscription': ' (دفعة اشتراك)'
};

function insertStrings(filePath, newStrings) {
  let content = fs.readFileSync(filePath, 'utf8');
  const insertIndex = content.lastIndexOf('};');
  if (insertIndex === -1) {
    console.error('Could not find }; in', filePath);
    return;
  }
  
  const entries = Object.entries(newStrings).map(([k, v]) => `  '${k}': '${v.replace(/'/g, "\\'")}',`).join('\n');
  const newContent = content.slice(0, insertIndex) + entries + '\n' + content.slice(insertIndex);
  fs.writeFileSync(filePath, newContent);
}

insertStrings(path.join(__dirname, 'apps/web/src/messages/en.ts'), newEnStrings);
insertStrings(path.join(__dirname, 'apps/web/src/messages/ar.ts'), newArStrings);
console.log('Strings added');
