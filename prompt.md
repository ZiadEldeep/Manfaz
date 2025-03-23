# تطوير واجهة المستخدم لنظام المدفوعات

## التقنيات المستخدمة
- Material-UI (MUI) v5
- Tabler Icons
- Framer Motion
- React Query
- Axios
- React Hook Form
- Zod (للتحقق من صحة النماذج)
- next-intil (لإدارة الترجمات)

## نظرة عامة
نحتاج إلى تطوير واجهة مستخدم لنظام المدفوعات يتضمن:
1. شحن رصيد للمحفظة
2. سحب رصيد من المحفظة
3. عرض سجل المعاملات
4. إدارة عمليات السحب للعمال

## ملفات الترجمة
يجب إنشاء ثلاثة ملفات ترجمة:

### ar.json
```json
{
  "wallet": {
    "title": "المحفظة",
    "balance": "الرصيد الحالي",
    "deposit": "شحن رصيد",
    "withdraw": "سحب رصيد",
    "transactions": "سجل المعاملات",
    "amount": "المبلغ",
    "email": "البريد الإلكتروني",
    "confirm": "تأكيد",
    "cancel": "إلغاء",
    "status": {
      "pending": "قيد المعالجة",
      "completed": "مكتمل",
      "failed": "فشل"
    },
    "types": {
      "deposit": "شحن",
      "withdraw": "سحب"
    }
  }
}
```

### en.json
```json
{
  "wallet": {
    "title": "Wallet",
    "balance": "Current Balance",
    "deposit": "Deposit",
    "withdraw": "Withdraw",
    "transactions": "Transaction History",
    "amount": "Amount",
    "email": "Email",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "status": {
      "pending": "Processing",
      "completed": "Completed",
      "failed": "Failed"
    },
    "types": {
      "deposit": "Deposit",
      "withdraw": "Withdraw"
    }
  }
}
```

### ur.json
```json
{
  "wallet": {
    "title": "والٹ",
    "balance": "موجودہ رقم",
    "deposit": "رقم جمع کریں",
    "withdraw": "رقم نکالیں",
    "transactions": "لین دین کی تاریخ",
    "amount": "رقم",
    "email": "ای میل",
    "confirm": "تصدیق کریں",
    "cancel": "منسوخ کریں",
    "status": {
      "pending": "زیر التوا",
      "completed": "مکمل",
      "failed": "ناکام"
    },
    "types": {
      "deposit": "جمع",
      "withdraw": "نکال"
    }
  }
}
```

## نقاط النهاية API المتاحة
انا عايز اضيف الurl لل لفايل @/lib/apis.ts
وعايز استخدم axios اللي موجوده في @/lib/axios.ts

### شحن رصيد للمحفظة
```http
POST /payments/wallet/deposit
Content-Type: application/json
Authorization: Bearer {token}

{
    "amount": number
}
```

### سحب رصيد من المحفظة
```http
POST /payments/wallet/withdraw
Content-Type: application/json
Authorization: Bearer {token}

{
    "amount": number
}
```

### سحب رصيد للعامل (PayPal)
```http
POST /payments/worker/payout
Content-Type: application/json
Authorization: Bearer {token}

{
    "amount": number,
    "email": string // البريد الإلكتروني المرتبط بحساب PayPal
}
```

### التحقق من حالة السحب
```http
GET /payments/worker/payout/{payoutId}
Authorization: Bearer {token}
```

### عرض سجل المعاملات
```http
GET /wallets/{walletId}/transactions/user
Authorization: Bearer {token}
```

## المتطلبات الوظيفية

### صفحة المحفظة
1. عرض الرصيد الحالي
   - استخدام `Card` من MUI مع تأثير حركي من Framer Motion
   - أيقونة `Wallet` من Tabler Icons
   - عرض المبلغ بتنسيق جميل مع تأثير حركي عند التغيير
   - دعم اتجاه النص RTL للغة العربية والأردية
   - استخدام `Typography` من MUI مع `dir` ديناميكي

2. زر لشحن رصيد جديد
   - استخدام `Button` من MUI مع تأثير حركي
   - أيقونة `Plus` من Tabler Icons
   - نافذة منبثقة `Dialog` من MUI تحتوي على:
     - حقل إدخال المبلغ باستخدام `TextField` من MUI
     - أيقونة `CurrencyDollar` من Tabler Icons
     - زر تأكيد مع تأثير حركي
     - دعم اتجاه النص RTL للغة العربية والأردية

3. زر لسحب رصيد
   - استخدام `Button` من MUI مع تأثير حركي
   - أيقونة `Minus` من Tabler Icons
   - نافذة منبثقة `Dialog` من MUI تحتوي على:
     - حقل إدخال المبلغ باستخدام `TextField` من MUI
     - أيقونة `CurrencyDollar` من Tabler Icons
     - زر تأكيد مع تأثير حركي
     - دعم اتجاه النص RTL للغة العربية والأردية

4. جدول يعرض سجل المعاملات
   - استخدام `DataGrid` من MUI
   - أيقونات مختلفة من Tabler Icons حسب نوع المعاملة:
     - `ArrowUpRight` للشحن
     - `ArrowDownLeft` للسحب
   - تأثيرات حركية عند تحميل البيانات
   - خيارات تصفية وترتيب
   - تنسيق التواريخ باستخدام `date-fns`
   - دعم اتجاه النص RTL للغة العربية والأردية
   - ترجمة جميع العناوين والأزرار

### صفحة سحب الرصيد للعامل
1. حقل لإدخال المبلغ
   - استخدام `TextField` من MUI مع تأثير حركي
   - أيقونة `CurrencyDollar` من Tabler Icons
   - تحقق من صحة المدخلات باستخدام Zod
   - دعم اتجاه النص RTL للغة العربية والأردية

2. حقل لإدخال البريد الإلكتروني
   - استخدام `TextField` من MUI مع تأثير حركي
   - أيقونة `Mail` من Tabler Icons
   - تحقق من صحة البريد الإلكتروني باستخدام Zod
   - دعم اتجاه النص RTL للغة العربية والأردية

3. عرض الرصيد المتاح
   - استخدام `Card` من MUI مع تأثير حركي
   - أيقونة `Wallet` من Tabler Icons
   - عرض المبلغ بتنسيق جميل
   - دعم اتجاه النص RTL للغة العربية والأردية

4. زر لتأكيد عملية السحب
   - استخدام `Button` من MUI مع تأثير حركي
   - أيقونة `Check` من Tabler Icons
   - حالة التحميل باستخدام `CircularProgress` من MUI
   - دعم اتجاه النص RTL للغة العربية والأردية

5. عرض حالة عملية السحب
   - استخدام `Chip` من MUI مع ألوان مختلفة حسب الحالة
   - أيقونات مختلفة من Tabler Icons حسب الحالة:
     - `Loader` للتحميل
     - `Check` للنجاح
     - `X` للفشل
   - ترجمة جميع الحالات

6. جدول يعرض سجل عمليات السحب
   - استخدام `DataGrid` من MUI
   - أيقونات مختلفة من Tabler Icons حسب الحالة
   - تأثيرات حركية عند تحميل البيانات
   - خيارات تصفية وترتيب
   - دعم اتجاه النص RTL للغة العربية والأردية
   - ترجمة جميع العناوين والأزرار

## المتطلبات غير الوظيفية
1. تصميم متجاوب يعمل على جميع الأجهزة
   - استخدام `Grid` و `Container` من MUI
   - استخدام `useMediaQuery` من MUI للتحكم في العرض
   - تأثيرات حركية متجاوبة مع حجم الشاشة
   - دعم اتجاه النص RTL للغة العربية والأردية

2. واجهة مستخدم سهلة وبسيطة
   - استخدام نظام الألوان المتناسق من MUI
   - أيقونات واضحة من Tabler Icons
   - تأثيرات حركية بسيطة من Framer Motion
   - ترجمة جميع النصوص

3. رسائل تأكيد وتنبيهات واضحة
   - استخدام `Snackbar` و `Alert` من MUI
   - أيقونات مناسبة من Tabler Icons
   - تأثيرات حركية عند الظهور والاختفاء
   - ترجمة جميع الرسائل

4. تحقق من صحة النماذج
   - استخدام React Hook Form مع Zod
   - رسائل خطأ واضحة باستخدام `FormHelperText` من MUI
   - أيقونات `AlertCircle` من Tabler Icons للخطأ
   - ترجمة جميع رسائل الخطأ

5. عرض حالة التحميل
   - استخدام `Skeleton` من MUI
   - أيقونة `Loader` من Tabler Icons
   - تأثيرات حركية للتحميل
   - ترجمة جميع حالات التحميل

6. دعم اللغة العربية والإنجليزية والأردية
   - استخدام `RTL` من MUI
   - أيقونات متوافقة مع الاتجاه
   - تأثيرات حركية متوافقة مع الاتجاه

## التصميم المقترح
- استخدام نظام الألوان المتناسق من MUI
- أيقونات واضحة من Tabler Icons
- تأثيرات حركية من Framer Motion:
  - `fade` للظهور والاختفاء
  - `slide` للانتقالات
  - `scale` للتفاعلات
  - `spring` للحركات الطبيعية
- أزرار كبيرة وسهلة الضغط باستخدام `Button` من MUI
- تنسيق الأرقام باستخدام `formatCurrency` من `date-fns`
- عرض التواريخ باستخدام `format` من `date-fns`
- دعم اتجاه النص RTL للغة العربية والأردية
- ترجمة جميع النصوص باستخدام next-intil

## ملاحظات إضافية
1. يجب التحقق من صحة البريد الإلكتروني باستخدام Zod
2. يجب التحقق من أن المبلغ لا يتجاوز الرصيد المتاح
3. يجب عرض رسالة تأكيد باستخدام `Dialog` من MUI
4. يجب تحديث حالة المعاملة في الوقت الفعلي باستخدام React Query
5. يجب إضافة خيار لتحميل كشف حساب PDF باستخدام `Button` من MUI مع أيقونة `Download` من Tabler Icons
6. يجب ترجمة جميع النصوص في التطبيق
7. يجب دعم اتجاه النص RTL للغة العربية والأردية