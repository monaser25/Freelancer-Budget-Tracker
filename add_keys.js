const fs = require('fs');

const enPath = 'apps/web/src/messages/en.ts';
const arPath = 'apps/web/src/messages/ar.ts';

function addKeys(newEn, newAr) {
  let en = fs.readFileSync(enPath, 'utf8');
  let ar = fs.readFileSync(arPath, 'utf8');

  const enMatch = en.lastIndexOf('};');
  const arMatch = ar.lastIndexOf('};');

  if (enMatch !== -1) {
    en = en.slice(0, enMatch) + newEn + '\n' + en.slice(enMatch);
    fs.writeFileSync(enPath, en);
  }
  if (arMatch !== -1) {
    ar = ar.slice(0, arMatch) + newAr + '\n' + ar.slice(arMatch);
    fs.writeFileSync(arPath, ar);
  }
}

const newEn = `
  // Dashboard
  'dashboard.relativeDate.today': 'Today',
  'dashboard.relativeDate.yesterday': 'Yesterday',
  'dashboard.relativeDate.daysAgo': '{days} days ago',
  'dashboard.error.createTransaction': 'Failed to create transaction',
  'dashboard.error.createClient': 'Failed to create client',
  'dashboard.error.createSubscription': 'Failed to create subscription',
  'dashboard.error.missingClientFields': 'Name and a positive amount are required.',
  'dashboard.error.missingSubFields': 'Name, amount, and next billing date are required.',
  'dashboard.alert.syncIssue': 'Sync Issue',
  'dashboard.actions.addRevenue': 'Add revenue',
  'dashboard.actions.logExpense': 'Log expense',
  'dashboard.actions.addSubscription': 'Add subscription',
  'dashboard.actions.addClient': 'Add client',
  
  'dashboard.stats.totalClients': 'Total clients',
  'dashboard.stats.totalRevenue': 'Total revenue',
  'dashboard.stats.totalExpenses': 'Total expenses',
  'dashboard.stats.netProfit': 'Net profit',
  'dashboard.stats.activeSubscriptions': 'Active subscriptions',
  'dashboard.stats.perMonth': '/mo',
  
  'dashboard.chart.title': 'Revenue vs Expenses',
  'dashboard.chart.subtitle': 'Last 6 months',
  'dashboard.chart.margin': '{margin}% margin',
  
  'dashboard.subs.title': 'Active subscriptions',
  'dashboard.subs.viewAll': 'View all',
  'dashboard.subs.renews': 'Renews {date}',
  'dashboard.subs.perYear': '/yr',
  'dashboard.subs.perMonth': '/mo',
  'dashboard.subs.empty': 'No active subscriptions',
  
  'dashboard.topClient.title': 'Top client',
  'dashboard.topClient.fallbackRole': 'Client',
  'dashboard.topClient.totalPaid': 'Total paid',
  
  'dashboard.recent.title': 'Recent transactions',
  'dashboard.recent.viewLedger': 'View ledger',
  'dashboard.recent.empty': 'No transactions yet.',
  'dashboard.recent.emptyAction': 'Add revenue to get started',
  
  'dashboard.forms.cancel': 'Cancel',
  'dashboard.forms.saving': 'Saving...',
  
  'dashboard.forms.income.title': 'Add revenue',
  'dashboard.forms.income.subtitle': 'Record a client payment or project win.',
  'dashboard.forms.expense.title': 'Log expense',
  'dashboard.forms.expense.subtitle': 'Record a tool, tax, or operating cost.',
  'dashboard.forms.tx.nameLabel': 'Transaction name',
  'dashboard.forms.tx.nameIncomePlaceholder': 'Website design project',
  'dashboard.forms.tx.nameExpensePlaceholder': 'Adobe Creative Cloud',
  'dashboard.forms.tx.notesLabel': 'Notes',
  'dashboard.forms.tx.notesPlaceholder': 'Optional details',
  'dashboard.forms.tx.amountLabel': 'Amount',
  'dashboard.forms.tx.dateLabel': 'Date',
  'dashboard.forms.tx.categoryLabel': 'Category',
  'dashboard.forms.tx.catClient': 'Client Payment',
  'dashboard.forms.tx.catProject': 'Project Revenue',
  'dashboard.forms.tx.catOtherIncome': 'Other Income',
  'dashboard.forms.tx.catTools': 'Tools',
  'dashboard.forms.tx.catOps': 'Operations',
  'dashboard.forms.tx.catTaxes': 'Taxes',
  'dashboard.forms.tx.catOtherExpense': 'Other Expense',
  'dashboard.forms.tx.save': 'Save entry',
  
  'dashboard.forms.client.title': 'Add client',
  'dashboard.forms.client.subtitle': 'Create a one-time client or monthly retainer from here.',
  'dashboard.forms.client.nameLabel': 'Client name',
  'dashboard.forms.client.amountLabel': 'Amount',
  'dashboard.forms.client.companyLabel': 'Company',
  'dashboard.forms.client.emailLabel': 'Email',
  'dashboard.forms.client.typeLabel': 'Client type',
  'dashboard.forms.client.typeCompany': 'Company',
  'dashboard.forms.client.typeIndividual': 'Individual',
  'dashboard.forms.client.paymentTypeLabel': 'Payment type',
  'dashboard.forms.client.paymentOneTime': 'One-time payment',
  'dashboard.forms.client.paymentRetainer': 'Monthly retainer',
  'dashboard.forms.client.nextBillingLabel': 'Next billing date',
  'dashboard.forms.client.paymentDateLabel': 'Payment date',
  'dashboard.forms.client.save': 'Save client',
  
  'dashboard.forms.sub.title': 'Add subscription',
  'dashboard.forms.sub.subtitle': 'Track a recurring software or service cost.',
  'dashboard.forms.sub.nameLabel': 'Service name',
  'dashboard.forms.sub.namePlaceholder': 'Vercel Pro',
  'dashboard.forms.sub.costLabel': 'Cost',
  'dashboard.forms.sub.nextBillingLabel': 'Next billing date',
  'dashboard.forms.sub.cycleLabel': 'Billing cycle',
  'dashboard.forms.sub.cycleMonthly': 'Monthly',
  'dashboard.forms.sub.cycleQuarterly': 'Quarterly',
  'dashboard.forms.sub.cycleYearly': 'Yearly',
  'dashboard.forms.sub.notesLabel': 'Notes',
  'dashboard.forms.sub.notesPlaceholder': 'Optional',
  'dashboard.forms.sub.save': 'Save subscription',
`;

const newAr = `
  // Dashboard
  'dashboard.relativeDate.today': 'اليوم',
  'dashboard.relativeDate.yesterday': 'أمس',
  'dashboard.relativeDate.daysAgo': 'منذ {days} أيام',
  'dashboard.error.createTransaction': 'فشل في إنشاء المعاملة',
  'dashboard.error.createClient': 'فشل في إنشاء العميل',
  'dashboard.error.createSubscription': 'فشل في إنشاء الاشتراك',
  'dashboard.error.missingClientFields': 'الاسم والمبلغ الإيجابي مطلوبان.',
  'dashboard.error.missingSubFields': 'الاسم والمبلغ وتاريخ الفوترة التالي مطلوبان.',
  'dashboard.alert.syncIssue': 'مشكلة في المزامنة',
  'dashboard.actions.addRevenue': 'إضافة إيرادات',
  'dashboard.actions.logExpense': 'تسجيل النفقات',
  'dashboard.actions.addSubscription': 'إضافة اشتراك',
  'dashboard.actions.addClient': 'إضافة عميل',
  
  'dashboard.stats.totalClients': 'إجمالي العملاء',
  'dashboard.stats.totalRevenue': 'إجمالي الإيرادات',
  'dashboard.stats.totalExpenses': 'إجمالي النفقات',
  'dashboard.stats.netProfit': 'صافي الربح',
  'dashboard.stats.activeSubscriptions': 'الاشتراكات النشطة',
  'dashboard.stats.perMonth': '/شهر',
  
  'dashboard.chart.title': 'الإيرادات مقابل النفقات',
  'dashboard.chart.subtitle': 'آخر 6 أشهر',
  'dashboard.chart.margin': '{margin}% هامش',
  
  'dashboard.subs.title': 'الاشتراكات النشطة',
  'dashboard.subs.viewAll': 'عرض الكل',
  'dashboard.subs.renews': 'يتجدد في {date}',
  'dashboard.subs.perYear': '/سنة',
  'dashboard.subs.perMonth': '/شهر',
  'dashboard.subs.empty': 'لا توجد اشتراكات نشطة',
  
  'dashboard.topClient.title': 'أفضل عميل',
  'dashboard.topClient.fallbackRole': 'عميل',
  'dashboard.topClient.totalPaid': 'إجمالي المدفوعات',
  
  'dashboard.recent.title': 'المعاملات الأخيرة',
  'dashboard.recent.viewLedger': 'عرض السجل',
  'dashboard.recent.empty': 'لا توجد معاملات بعد.',
  'dashboard.recent.emptyAction': 'أضف إيرادات للبدء',
  
  'dashboard.forms.cancel': 'إلغاء',
  'dashboard.forms.saving': 'جاري الحفظ...',
  
  'dashboard.forms.income.title': 'إضافة إيرادات',
  'dashboard.forms.income.subtitle': 'سجل دفعة عميل أو ربح مشروع.',
  'dashboard.forms.expense.title': 'تسجيل نفقات',
  'dashboard.forms.expense.subtitle': 'سجل تكلفة أداة، ضريبة، أو تشغيل.',
  'dashboard.forms.tx.nameLabel': 'اسم المعاملة',
  'dashboard.forms.tx.nameIncomePlaceholder': 'مشروع تصميم موقع',
  'dashboard.forms.tx.nameExpensePlaceholder': 'Adobe Creative Cloud',
  'dashboard.forms.tx.notesLabel': 'ملاحظات',
  'dashboard.forms.tx.notesPlaceholder': 'تفاصيل اختيارية',
  'dashboard.forms.tx.amountLabel': 'المبلغ',
  'dashboard.forms.tx.dateLabel': 'التاريخ',
  'dashboard.forms.tx.categoryLabel': 'الفئة',
  'dashboard.forms.tx.catClient': 'دفعة عميل',
  'dashboard.forms.tx.catProject': 'إيرادات مشروع',
  'dashboard.forms.tx.catOtherIncome': 'إيرادات أخرى',
  'dashboard.forms.tx.catTools': 'أدوات',
  'dashboard.forms.tx.catOps': 'عمليات',
  'dashboard.forms.tx.catTaxes': 'ضرائب',
  'dashboard.forms.tx.catOtherExpense': 'نفقات أخرى',
  'dashboard.forms.tx.save': 'حفظ المعاملة',
  
  'dashboard.forms.client.title': 'إضافة عميل',
  'dashboard.forms.client.subtitle': 'أنشئ عميلاً لمرة واحدة أو عميل دوري من هنا.',
  'dashboard.forms.client.nameLabel': 'اسم العميل',
  'dashboard.forms.client.amountLabel': 'المبلغ',
  'dashboard.forms.client.companyLabel': 'الشركة',
  'dashboard.forms.client.emailLabel': 'البريد الإلكتروني',
  'dashboard.forms.client.typeLabel': 'نوع العميل',
  'dashboard.forms.client.typeCompany': 'شركة',
  'dashboard.forms.client.typeIndividual': 'فرد',
  'dashboard.forms.client.paymentTypeLabel': 'نوع الدفعة',
  'dashboard.forms.client.paymentOneTime': 'دفعة واحدة',
  'dashboard.forms.client.paymentRetainer': 'عميل دوري',
  'dashboard.forms.client.nextBillingLabel': 'تاريخ الفوترة التالي',
  'dashboard.forms.client.paymentDateLabel': 'تاريخ الدفع',
  'dashboard.forms.client.save': 'حفظ العميل',
  
  'dashboard.forms.sub.title': 'إضافة اشتراك',
  'dashboard.forms.sub.subtitle': 'تتبع تكلفة برنامج أو خدمة متكررة.',
  'dashboard.forms.sub.nameLabel': 'اسم الخدمة',
  'dashboard.forms.sub.namePlaceholder': 'Vercel Pro',
  'dashboard.forms.sub.costLabel': 'التكلفة',
  'dashboard.forms.sub.nextBillingLabel': 'تاريخ الفوترة التالي',
  'dashboard.forms.sub.cycleLabel': 'دورة الفوترة',
  'dashboard.forms.sub.cycleMonthly': 'شهري',
  'dashboard.forms.sub.cycleQuarterly': 'ربع سنوي',
  'dashboard.forms.sub.cycleYearly': 'سنوي',
  'dashboard.forms.sub.notesLabel': 'ملاحظات',
  'dashboard.forms.sub.notesPlaceholder': 'اختياري',
  'dashboard.forms.sub.save': 'حفظ الاشتراك',
`;

addKeys(newEn, newAr);
