# Haseeela — Approved Arabic Terminology (Glossary) — bilingual EN/AR

> **Role in the bilingual system:** this is the **Arabic side** of the EN↔AR dictionary. The **English value** is the base (lives in `messages/en.ts`); the **AR (approved)** column is the value for the same key in `messages/ar.ts`. The **translation key** is the real contract in code — components call `t('key')`, never the literal text in either language.
> **Single source of truth for Arabic copy.** One approved Arabic equivalent per concept — **use it consistently everywhere**. English copy is **never removed**; it stays in `en.ts`.
> If a term is missing or ambiguous, add a row and flag it for the reviewer; **do not invent inconsistent variants.**
> Modern Standard Arabic (MSA), professional finance tone. Latin digits. Future languages get their own column/file using the **same English base + keys**. See [`ARABIC_LOCALIZATION_PLAN.md`](./ARABIC_LOCALIZATION_PLAN.md) §3/§5/§7.

Columns: **EN** · **AR (approved)** · **Notes** · **Where used** · **⚠ Do-not-translate-in-code**.

---

## Brand & product

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Haseeela (brand) | **Haseeela** (keep Latin) | Brand name. The owner may optionally adopt the Arabic **حصيلة** ("proceeds/outcome") as a wordmark — **brand decision, confirm with owner before changing the logo/wordmark.** Default: keep "Haseeela". | Logo, emails, metadata, PDF header | Never translate in `creator`, `applicationName`, manifest `name` keys, email `from` name code paths. Display label only. |

---

## Money & finance core

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Dashboard | **لوحة التحكم** | — | Sidebar, page titles | — |
| Overview | **نظرة عامة** | Distinct from Dashboard. | Overview page | — |
| Revenue | **الإيرادات** | Business income earned. Keep distinct from "Income". | Dashboard, reports, clients | — |
| Income | **الدخل** | Use only where source text says "Income"; otherwise prefer الإيرادات. | Add-revenue modal | enum `INCOME` stays English |
| Expenses | **المصروفات** | — | Transactions, reports | enum `EXPENSE` stays English |
| Net profit | **صافي الربح** | — | Reports (P&L) | — |
| Net | **الصافي** | Short form in tables/summaries. | Reports tables | — |
| Gross | **الإجمالي** | "Gross revenue" → **إجمالي الإيرادات**. | Tax report | — |
| Deductible expenses | **المصروفات القابلة للخصم** | — | Tax report | — |
| Taxable (net) | **الصافي الخاضع للضريبة** | — | Tax report | — |
| Balance | **الرصيد** | — | Dashboard/analytics | — |
| Amount | **المبلغ** | — | Forms, tables | field key `amount` |
| Total | **الإجمالي** | "Total paid" handled below. | Reports, invoices, xlsx "Total" | — |
| Currency | **العملة** | Currency **codes** (USD/EGP…) stay Latin, LTR. | Settings, invoices | codes unchanged |

---

## Clients & payments

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Clients | **العملاء** | — | Sidebar, clients page | — |
| Client | **عميل** | — | Modals, tables | field `clientId` |
| Client payment | **دفعة عميل** | — | Categories, transactions | category code `CLIENT` stays English |
| Retainer | **عميل دوري** (badge: **دوري**) | Recurring monthly client. Avoid "اشتراك" here (reserved for Subscriptions). Long form: **دفعة شهرية متكررة**. | Clients badges & copy | value `retainer` stays English |
| One-time payment | **دفعة واحدة** | Badge "One-time" → **دفعة واحدة**. | Clients badges & copy | value `onetime` stays English |
| Payment | **دفعة** (pl. **مدفوعات**) | — | Clients, invoices | — |
| Payment history | **سجل المدفوعات** | — | Client card | — |
| Record payment | **تسجيل دفعة** | CTA, keep short. | Clients | route `record-payment` unchanged |
| Total paid | **إجمالي المدفوع** | — | Client card | — |
| Recorded revenue | **الإيرادات المسجَّلة** | — | Clients stat card | — |
| No payments recorded yet | **لا توجد مدفوعات مسجَّلة بعد** | Empty state. | Client card | — |

---

## Invoices

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Invoices | **الفواتير** | — | Sidebar, list | — |
| Invoice | **فاتورة** | — | Editor, detail | — |
| Invoice number | **رقم الفاتورة** | The number value (e.g. `INV-0001`) stays LTR. | Editor, detail, email, PDF | value LTR |
| Issue date | **تاريخ الإصدار** | — | Editor, detail | field `issueDate` |
| Due date | **تاريخ الاستحقاق** | — | Editor, detail | field `dueDate` |
| Bill to | **إلى** / **العميل** | Prefer **العميل** for clarity. | Invoice document | — |
| Line item | **بند** | — | Editor | — |
| Quantity | **الكمية** | — | Editor | — |
| Rate | **السعر** | Unit price. | Editor | — |
| Tax rate | **نسبة الضريبة** | — | Editor | — |
| Discount | **الخصم** | — | Editor | — |
| Terms | **الشروط** | — | Editor | — |
| Send invoice | **إرسال الفاتورة** | — | Detail, send modal | — |
| Mark paid | **تحديد كمدفوعة** | — | Detail | route `mark-paid` unchanged |
| Paid | **مدفوعة** | Status display. | Badges | enum `PAID` stays English |
| Unpaid | **غير مدفوعة** | — | Badges | — |
| Overdue | **متأخرة** | — | Badges | enum `OVERDUE` stays English |
| Pending | **قيد الانتظار** | Also "معلّقة" acceptable; pick **قيد الانتظار**. | Badges, transactions | enum `PENDING` stays English |
| Draft | **مسودة** | — | Badges | enum `DRAFT` stays English |
| Sent | **مُرسَلة** | — | Badges | enum `SENT` stays English |
| Cancelled | **ملغاة** | — | Badges | — |

---

## Subscriptions & transactions

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Subscriptions | **الاشتراكات** | — | Sidebar | — |
| Subscription | **اشتراك** | — | Modals | field `subscriptionId` |
| Transactions | **المعاملات** | — | Sidebar, page | — |
| Transaction | **معاملة** | — | Tables | — |
| Monthly | **شهري** | Cycle display. | Subscriptions | enum `MONTHLY` stays English |
| Quarterly | **ربع سنوي** | — | Subscriptions | enum `QUARTERLY` stays English |
| Yearly | **سنوي** | — | Subscriptions | enum `YEARLY` stays English |
| Next billing | **الفوترة القادمة** | — | Subscriptions, clients | — |

---

## Reports, budgets, exports

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Reports | **التقارير** | — | Sidebar | — |
| Report | **تقرير** | — | Reports | — |
| P&L Summary | **ملخص الأرباح والخسائر** | — | Reports | type `pl` stays English |
| Client Revenue | **إيرادات العملاء** | — | Reports | — |
| Tax report / Tax Summary | **التقرير الضريبي** / **الملخص الضريبي** | — | Reports | type `tax` stays English |
| Budgets | **الميزانيات** | No dedicated page yet — see Plan §1.3. | (future) | model `Budget` |
| Budget | **ميزانية** | — | (future) | — |
| Export | **تصدير** | — | Reports | — |
| Excel | **Excel** (keep) | "Export Excel" → **تصدير Excel**. | Reports | format `xlsx` |
| CSV | **CSV** (keep) | — | Reports | format `csv` |
| Download PDF | **تنزيل PDF** | — | Reports, invoices | — |
| Print | **طباعة** | "Print / PDF" → **طباعة / PDF**. | Reports | — |
| Generated | **تم الإنشاء في** | xlsx/print header. | Excel, print | — |

---

## Date ranges

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| All time | **كل الفترات** | Or **منذ البداية**; pick **كل الفترات**. | Reports preset | — |
| This month | **هذا الشهر** | — | Reports preset | — |
| Last month | **الشهر الماضي** | — | Reports preset | — |
| Last 3 months | **آخر 3 أشهر** | Latin digit `3`. | Reports preset | — |
| Custom range | **نطاق مخصص** | — | Reports | — |
| From | **من** | — | Reports | — |
| To | **إلى** | — | Reports | — |
| Month / Quarter / Year | **شهر / ربع / سنة** | Segmented presets. | Reports | — |

---

## Archive & destructive actions

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Archive | **الأرشيف** (verb: **أرشفة**) | Noun for page; verb for action. | Sidebar, actions | — |
| Archived | **مؤرشَف** | — | Badges, stat card | — |
| Restore | **استعادة** | — | Archive | route `restore` unchanged |
| Delete | **حذف** | — | Everywhere | — |
| Delete permanently | **حذف نهائي** | Keep distinct from Archive. | Archive, clients | route `delete-permanent` unchanged |
| Include archived | **عرض المؤرشَف** | Segmented. | Clients | — |
| Active | **نشط** | — | Badges, filters | enum `ACTIVE` stays English |

---

## Auth & account

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Sign up / Register | **إنشاء حساب** | — | Register | route `/register` |
| Log in / Sign in | **تسجيل الدخول** | — | Login | route `/login` |
| Sign out / Log out | **تسجيل الخروج** | — | Sidebar | — |
| Confirm sign up | **تأكيد إنشاء الحساب** | — | Email, verify | — |
| Verify email | **تأكيد البريد الإلكتروني** | — | Verify page/email | route `/verify` |
| Email confirmed | **تم تأكيد البريد الإلكتروني** | — | Verify success | — |
| Email updated | **تم تحديث البريد الإلكتروني** | email_change success screen. | Verify | — |
| Email change | **تغيير البريد الإلكتروني** | — | Profile, email | Supabase `email_change` type |
| Reset password | **إعادة تعيين كلمة المرور** | — | Reset/forgot | route `/reset-password` |
| Forgot password | **هل نسيت كلمة المرور؟** | — | Login/forgot | — |
| Current password | **كلمة المرور الحالية** | — | Profile | — |
| New password | **كلمة المرور الجديدة** | — | Profile/reset | — |
| Reauthentication | **إعادة المصادقة** | — | Supabase email | — |
| Magic link | **رابط الدخول السريع** | — | Supabase email | — |
| OTP | **رمز التحقق** | One-time code. | Supabase email | variable `{{ .Token }}` unchanged |
| Invite | **دعوة** | — | Supabase email | — |
| Confirm both emails | **يرجى تأكيد البريدين** | The both-inboxes banner. | Profile | — |

---

## Settings, profile, notifications

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Settings | **الإعدادات** | — | Sidebar | route `/settings` |
| Profile | **الملف الشخصي** | — | Sidebar/menu | route `/profile` |
| Notifications | **الإشعارات** | — | Sidebar/page | route `/notifications` |
| Account | **الحساب** | — | Settings | — |
| Workspace | **مساحة العمل** | — | Settings | — |
| Appearance | **المظهر** | — | Settings | — |
| System / Light / Dark | **النظام / فاتح / داكن** | Theme segmented. | Settings | values stay English in code |
| Billing reminders | **تذكيرات الفوترة** | — | Settings/notifications | pref key unchanged |
| Invoice due alerts | **تنبيهات استحقاق الفواتير** | — | Settings | pref key unchanged |
| Weekly summary | **الملخص الأسبوعي** | — | Settings | pref key unchanged |
| Delete account | **حذف الحساب** | — | Profile | — |

---

## Common actions & UI micro-copy

| EN | AR (approved) | Notes | Where used | ⚠ Code |
|---|---|---|---|---|
| Save | **حفظ** | Keep short. | Everywhere | — |
| Cancel | **إلغاء** | — | Everywhere | — |
| Confirm | **تأكيد** | — | Dialogs | — |
| Continue | **متابعة** | — | Auth/onboarding | — |
| Create | **إنشاء** | — | Modals | — |
| Add | **إضافة** | "Add client" → **إضافة عميل**. | Modals | — |
| Update | **تحديث** | — | Forms | — |
| Edit | **تعديل** | — | Rows/detail | — |
| New | **جديد** | Topbar "New". | Topbar | — |
| Search | **بحث** | Placeholder: **بحث…**. | Topbar/palette | — |
| Filter | **تصفية** | — | Lists | — |
| Sort | **ترتيب** | — | Tables | — |
| Status | **الحالة** | — | Tables | — |
| Category | **الفئة** | Display label; **codes** stay English. | Transactions, reports | codes unchanged |
| Notes | **ملاحظات** | — | Forms | field `notes` |
| Description | **الوصف** | Reports use "البيان" for ledger line; pick **الوصف** as default, **البيان** allowed for the report column. | Forms, reports | field `description` |
| Optional | **اختياري** | — | Form hints | — |
| Required | **مطلوب** | — | Validation | — |
| Date | **التاريخ** | — | Tables/forms | field `date` |
| Name | **الاسم** | — | Forms | field `name` |
| Email | **البريد الإلكتروني** | The address value stays LTR. | Forms | field `email` |
| Company | **الشركة** | — | Clients | field `company` |
| Loading… | **جارٍ التحميل…** | — | Skeletons | — |
| No data | **لا توجد بيانات** | Generic empty. | Empty states | — |
| Something went wrong | **حدث خطأ ما** | Generic error. | Toasts | — |
| Language | **اللغة** | — | Toggle, settings | locale codes `en`/`ar` stay English |
| Change language | **تغيير اللغة** | Toggle `aria-label`. | Language toggle | — |
| English | **English** (native label) | Show each language in its **own** script (native label) in the toggle. | Language toggle | value `en` |
| Arabic | **العربية** (native label) | — | Language toggle | value `ar` |

---

## Category labels (display only — codes stay English)

| Code (keep) | EN label | AR label |
|---|---|---|
| `CLIENT` | Client Payment | **دفعة عميل** |
| `PROJECT` | Project Revenue | **إيراد مشروع** |
| `TOOLS` | Tools | **أدوات** |
| `SOFTWARE` (if present) | Software | **برمجيات** |
| `OPERATIONS` | Operations | **التشغيل** |
| `OFFICE` (if present) | Office | **مصاريف مكتبية** |
| `TAXES` | Taxes | **الضرائب** |
| `OTHER` | Other | **أخرى** |

> Map these in `server/reports.ts` `CATEGORY_LABELS` and `components/modals/EntityModals.tsx` option labels. The **code** (left column) must never change.

---

### Consistency rules
- Pick the **approved** column value; never a synonym, even if "also correct."
- Keep CTAs ≤ 2 words where possible.
- Brand, currency codes, invoice numbers, emails, URLs, OTP tokens → **Latin, LTR**.
- When unsure, add a row + `⚠ reviewer` note in [`ARABIC_LOCALIZATION_PROGRESS.md`](./ARABIC_LOCALIZATION_PROGRESS.md) rather than guessing inconsistently.
