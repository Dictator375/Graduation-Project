import React, { createContext, useContext, useState } from 'react';

// All translations embedded — no external imports
const ar = {
  appName:'نظام إدارة محطة الوقود', appShort:'محطة الوقود',
  login:'تسجيل الدخول', logout:'تسجيل الخروج',
  username:'اسم المستخدم', password:'كلمة المرور',
  manager:'مدير المحطة', team_leader:'رئيس الفريق', worker:'عامل',
  dashboard:'لوحة التحكم', employees:'الموظفون', shifts:'الفترات والحضور',
  inventory:'مخزون الوقود', sales:'المبيعات', messages:'الرسائل',
  payroll:'مواعيد الأجور', fuelType:'نوع الوقود',
  unleaded95:'بنزين عادي 95', unleaded98:'بنزين ممتاز 98',
  diesel:'مازوت', gpl:'غاز البترول', liters:'لتر',
  pricePerLiter:'السعر/لتر', currency:'دج',
  lowStock:'مخزون منخفض', criticalStock:'مخزون حرج',
  newSale:'تسجيل بيع', pumpNumber:'رقم المضخة',
  paymentMethod:'طريقة الدفع', cash:'نقداً', card:'بطاقة',
  loyalty:'قصيمة', credit:'دين مؤسسة',
  morningShift:'فترة الصباح (08:00 - 14:00)',
  afternoonShift:'فترة المساء (14:00 - 20:00)',
  nightShift:'فترة الليل (20:00 - 08:00)',
  attendance:'الحضور والغياب', present:'حاضر', absent:'غائب',
  late:'متأخر', excused:'مبرر', inactive:'غير نشط',
  sendMessage:'إرسال رسالة', typeMessage:'اكتب رسالتك...',
  send:'إرسال', todayRevenue:'إيرادات اليوم',
  totalSales:'إجمالي المبيعات', transactions:'العمليات',
  active:'نشط', nextPayDate:'موعد الراتب القادم',
  save:'حفظ', cancel:'إلغاء', loading:'جاري التحميل...',
  error:'حدث خطأ', success:'تمت العملية بنجاح',
  notes:'ملاحظات', name:'الاسم', language:'اللغة',
  pumps:'المضخات', add:'إضافة', edit:'تعديل', status:'الحالة',
  inService:'في الخدمة', outOfService:'خارج الخدمة',
  lastMaintenanceDate:'تاريخ آخر صيانة', maintenanceLog:'سجل الصيانة',
  faultLog:'سجل الأعطال', serviceStartDate:'تاريخ دخول الخدمة',
  pumpStr:'مضخة', actions:'إجراءات', noData:'لا توجد بيانات',
  demandDate:'تاريخ الطلب', arrivalDate:'تاريخ الوصول',
  daily:'يومي', weekly:'أسبوعي', monthly:'شهري', yearly:'سنوي',
  print:'طباعة', shiftSales:'مبيعات الفترات', employeeRanking:'ترتيب العمال',
  rank:'المرتبة', fullName:'الاسم الكامل', date:'التاريخ', team:'الفريق',
  fuelSoldToday:'الوقود المباع', monthRevenue:'إيرادات الشهر', monthSales:'مبيعات الشهر',
  inventory:'المخزون', todaySalesBreakdown:'تفاصيل مبيعات اليوم', noSalesToday:'لا توجد مبيعات',
  fuelTypeTitle:'نوع الوقود', quantityTitle:'الكمية', salesTitle:'المبيعات', operationsTitle:'العمليات',
  settings:'الإعدادات', darkMode:'الوضع الداكن', lightMode:'الوضع الفاتح', theme:'المظهر',
  credentials:'بيانات الدخول', newPasswordLabel:'كلمة المرور الجديدة', changeCredentials:'تغيير بيانات الدخول',
  chat:'دردشة', welcome:'مرحباً', mySalesToday:'مبيعاتي اليوم', fuelAvailability:'توفر الوقود',
  latestSalesToday:'آخر مبيعاتي اليوم', pump:'مضخة', overview:'نظرة عامة', operations:'العمليات',
  finance:'المالية', other:'أخرى', operationsCount:'عملية',
  managerDashboard:'لوحة تحكم المدير', teamLeaderDashboard:'لوحة تحكم رئيس الفريق',
  institutions:'المؤسسات', credits:'الديون غير المسددة', invoices:'الفواتير',
  reports:'التقارير', refillNow:'تسجيل ملء', manager:'مدير المحطة',
  // Login
  errorTitle:'خطأ', enterCredentials:'أدخل اسم المستخدم وكلمة المرور',
  loginError:'خطأ في تسجيل الدخول', checkCredentials:'تحقق من المعلومات المدخلة',
  switchToFr:'🇫🇷 Passer en Français', switchToAr:'🇩🇿 التبديل للعربية',
  // Attendance
  attendanceSaved:'تم حفظ الحضور', saving:'جاري الحفظ...',
  // Credits
  totalDebt:'إجمالي الديون', unpaidDebt:'دين غير مسدد',
  confirmPayment:'تأكيد السداد', confirmPaymentMsg:'هل تريد تأكيد سداد هذا الدين؟',
  paymentRegistered:'تم تسجيل السداد وإزالة الدين',
  allDebtsCleared:'جميع المؤسسات سددت ديونها', noUnpaidDebts:'لا توجد ديون غير مسددة',
  unknownClient:'عميل غير محدد', registerPayment:'✓ تسجيل السداد — يختفي الدين',
  // Employees
  confirmation:'تأكيد', deactivate:'تعطيل',
  deactivateConfirm:'هل تريد تعطيل هذا الموظف؟',
  searchPlaceholder:'بحث...',
  // Institutions
  institution:'المؤسسة', address:'العنوان', taxNumber:'الرقم الضريبي',
  phone:'الهاتف', editInstitution:'تعديل المؤسسة', addInstitution:'إضافة مؤسسة',
  fillRequired:'يرجى ملء الحقول المطلوبة', institutionDeleted:'تم حذف المؤسسة',
  deleteInstitutionConfirm:'هل تريد حذف هذه المؤسسة؟', noInstitutions:'لا توجد مؤسسات مسجلة',
  delete:'حذف',
  // Inventory
  selectFuelAndQuantity:'اختر نوع الوقود وأدخل الكميّة',
  stockUpdated:'تم تحديث المخزون', priceUpdated:'تم تحديث السعر',
  tankLevels:'مستويات الخزانات', newPrice:'سعر جديد',
  quantityLiters:'الكميّة (لتر)', purchasePrice:'سعر الشراء (دج/L) — اختياري',
  taxRate:'نسبة الضريبة (%)', netAmount:'المبلغ الصافي', tax:'الضريبة',
  total:'الإجمالي', supplier:'المورّد — اختياري', supplierName:'اسم المورّد',
  update:'تحديث', perLiter:'/لتر',
  // Invoices
  invoiceTotal:'الإجمالي', privateClient:'عميل خاص', noInvoices:'لا توجد فواتير',
  shareInvoice:'مشاركة الفاتورة', invoiceCreateFailed:'فشل إنشاء الفاتورة',
  officialInvoice:'فاتورة رسمية', issuedTo:'صادرة إلى', issueDate:'تاريخ الإصدار',
  quantity:'الكميّة', unitPrice:'السعر/L', subtotal:'المجموع',
  paid:'مدفوع', cancelled:'ملغى', confirm:'تأكيد',
  changeStatusConfirm:'هل تريد تغيير حالة الفاتورة إلى',
  // Payroll
  addPayDate:'إضافة موعد راتب', payDateDesc:'الوصف (اختياري)',
  enterPayDate:'أدخل تاريخ الراتب', deletePayDateConfirm:'هل تريد حذف هذا الموعد؟',
  daysRemaining:'يوم متبقي', upcoming:'مواعيد قادمة', past:'سابقة',
  noUpcoming:'لا توجد مواعيد قادمة', addPayDateBtn:'+ إضافة الموعد',
  // Pumps
  enterPumpNumber:'الرجاء إدخال رقم المضخة', pumpUpdated:'تم تحديث المضخة',
  maxPumps:'الحد الأقصى هو 12 مضخة', pumpAdded:'تمت إضافة المضخة',
  pumpEdit:'تعديل المضخة', pumpAdd:'إضافة مضخة (الحد الأقصى 12)',
  noPumps:'لا توجد مضخات', pumpHash:'مضخة #', alert:'تنبيه', successTitle:'نجاح',
  // Reports
  totalRevenue:'إجمالي الإيرادات', totalFuel:'إجمالي الوقود',
  noSalesInPeriod:'لا توجد مبيعات في هذه الفترة',
  fromDate:'من', toDate:'إلى', today:'اليوم', thisWeek:'هذا الأسبوع', thisMonth:'هذا الشهر',
  allTime:'كل الفترات',
  salesReport:'تقرير المبيعات', generatedBy:'تم إنشاء هذا التقرير بواسطة نظام إدارة محطة الوقود',
  shareReport:'مشاركة التقرير', reportError:'فشل إنشاء التقرير',
  employee:'العامل', institutionCol:'المؤسسة', payment:'الدفع',
  fuelCol:'الوقود', qtyCol:'الكميّة', priceCol:'السعر/L', totalCol:'المجموع',
  // Messages
  sendFailed:'فشل إرسال الرسالة', sendToAll:'إرسال للجميع',
  sendToAllEmployees:'إرسال رسالة للجميع', noMessages:'لا توجد رسائل بعد',
  // Chat
  teamChat:'فريقي', directMessages:'رسائل خاصة',
  broadcastNotice:'📢 هذه الرسائل تصل لجميع الموظفين', noMembers:'لا يوجد أعضاء',
  // Sales form
  newSaleSuccess:'تمت عملية البيع بنجاح', confirmSale:'✓ تأكيد البيع',
  selectInstitution:'اختر المؤسسة', customAmount:'مبلغ مخصص',
  enterQuantity:'أدخل الكميّة', selectFuel:'اختر نوع الوقود',
  selectPump:'اختر المضخة', estimatedTotal:'المجموع التقديري',
  // Settings
  switchLangDesc:'العربية ← الفرنسية', currentDark:'حالياً: الوضع الداكن',
  currentLight:'حالياً: الوضع الفاتح',
  // Worker dashboard
  seeAllSales:'عرض كل المبيعات',
  back:'رجوع',
};

const fr = {
  appName:"Système de gestion de station-service", appShort:'Station-service',
  login:'Se connecter', logout:'Se déconnecter',
  username:"Nom d'utilisateur", password:'Mot de passe',
  manager:'Directeur', team_leader:"Chef d'équipe", worker:'Employé',
  dashboard:'Tableau de bord', employees:'Employés', shifts:'Équipes',
  inventory:'Inventaire', sales:'Ventes', messages:'Messages',
  payroll:'Paie', fuelType:'Carburant',
  unleaded95:'Sans plomb 95', unleaded98:'Sans plomb 98',
  diesel:'Diesel', gpl:'GPL', liters:'litres',
  pricePerLiter:'Prix/L', currency:'DA',
  lowStock:'Stock faible', criticalStock:'Stock critique',
  newSale:'Nouvelle vente', pumpNumber:'N° pompe',
  paymentMethod:'Paiement', cash:'Espèces', card:'Carte',
  loyalty:'Bon d\'achat', credit:'Crédit',
  morningShift:'Matin (08:00-14:00)',
  afternoonShift:'Après-midi (14:00-20:00)',
  nightShift:'Nuit (20:00-08:00)',
  attendance:'Présences', present:'Présent', absent:'Absent',
  late:'En retard', excused:'Excusé', inactive:'Inactif',
  sendMessage:'Envoyer', typeMessage:'Votre message...',
  send:'Envoyer', todayRevenue:"CA du jour",
  totalSales:'Total ventes', transactions:'Transactions',
  active:'Actif', nextPayDate:'Prochaine paie',
  save:'Enregistrer', cancel:'Annuler', loading:'Chargement...',
  error:'Erreur', success:'Succès',
  notes:'Notes', name:'Nom', language:'Langue',
  pumps:'Pompes', add:'Ajouter', edit:'Modifier', status:'Statut',
  inService:'En service', outOfService:'Hors service',
  lastMaintenanceDate:'Dernière maintenance', maintenanceLog:'Journal de maintenance',
  faultLog:'Journal des pannes', serviceStartDate:'Date de mise en service',
  pumpStr:'Pompe', actions:'Actions', noData:'Aucune donnée',
  demandDate:'Date de demande', arrivalDate:"Date d'arrivée",
  daily:'Quotidien', weekly:'Hebdomadaire', monthly:'Mensuel', yearly:'Annuel',
  print:'Imprimer', shiftSales:'Ventes par équipe', employeeRanking:'Classement employés',
  rank:'Rang', fullName:'Nom complet', date:'Date', team:'Équipe',
  fuelSoldToday:'Carburant vendu', monthRevenue:'Revenus du mois', monthSales:'Ventes du mois',
  inventory:'Inventaire', todaySalesBreakdown:"Détails des ventes d'aujourd'hui", noSalesToday:'Aucune vente',
  fuelTypeTitle:'Type de carburant', quantityTitle:'Quantité', salesTitle:'Ventes', operationsTitle:'Opérations',
  settings:'Paramètres', darkMode:'Mode sombre', lightMode:'Mode clair', theme:'Thème',
  credentials:'Identifiants', newPasswordLabel:'Nouveau mot de passe', changeCredentials:'Modifier les identifiants',
  chat:'Discussion', welcome:'Bienvenue', mySalesToday:"Mes ventes d'aujourd'hui", fuelAvailability:'Disponibilité du carburant',
  latestSalesToday:"Dernières ventes d'aujourd'hui", pump:'Pompe', overview:'Aperçu', operations:'Opérations',
  finance:'Finances', other:'Autres', operationsCount:'opération(s)',
  managerDashboard:'Tableau de bord Directeur', teamLeaderDashboard:"Tableau de bord Chef d'équipe",
  institutions:'Institutions', credits:'Crédits impayés', invoices:'Factures',
  reports:'Rapports', refillNow:'Enregistrer ravitaillement', manager:'Directeur de station',
  // Login
  errorTitle:'Erreur', enterCredentials:"Entrez le nom d'utilisateur et le mot de passe",
  loginError:'Erreur de connexion', checkCredentials:'Vérifiez les informations saisies',
  switchToFr:'🇫🇷 Passer en Français', switchToAr:'🇩🇿 التبديل للعربية',
  // Attendance
  attendanceSaved:'Présence enregistrée', saving:'Enregistrement...',
  // Credits
  totalDebt:'Total des dettes', unpaidDebt:'Crédit impayé',
  confirmPayment:'Confirmer le paiement', confirmPaymentMsg:'Voulez-vous confirmer le paiement de cette dette ?',
  paymentRegistered:'Paiement enregistré, dette supprimée',
  allDebtsCleared:'Toutes les institutions ont réglé leurs dettes', noUnpaidDebts:'Aucune dette impayée',
  unknownClient:'Client inconnu', registerPayment:'✓ Enregistrer le paiement',
  // Employees
  confirmation:'Confirmation', deactivate:'Désactiver',
  deactivateConfirm:'Voulez-vous désactiver cet employé ?',
  searchPlaceholder:'Recherche...',
  // Institutions
  institution:'Institution', address:'Adresse', taxNumber:'Numéro fiscal',
  phone:'Téléphone', editInstitution:"Modifier l'institution", addInstitution:'Ajouter une institution',
  fillRequired:'Veuillez remplir les champs obligatoires', institutionDeleted:'Institution supprimée',
  deleteInstitutionConfirm:'Voulez-vous supprimer cette institution ?', noInstitutions:'Aucune institution enregistrée',
  delete:'Supprimer',
  // Inventory
  selectFuelAndQuantity:'Sélectionnez le carburant et entrez la quantité',
  stockUpdated:'Stock mis à jour', priceUpdated:'Prix mis à jour',
  tankLevels:'Niveaux des cuves', newPrice:'Nouveau prix',
  quantityLiters:'Quantité (Litres)', purchasePrice:"Prix d'achat (DA/L) — optionnel",
  taxRate:'Taux de taxe (%)', netAmount:'Montant net', tax:'Taxe',
  total:'Total', supplier:'Fournisseur — optionnel', supplierName:'Nom du fournisseur',
  update:'Mettre à jour', perLiter:'/L',
  // Invoices
  invoiceTotal:'Total', privateClient:'Client privé', noInvoices:'Aucune facture',
  shareInvoice:'Partager la facture', invoiceCreateFailed:'Échec de la création de la facture',
  officialInvoice:'Facture officielle', issuedTo:'Émise à', issueDate:"Date d'émission",
  quantity:'Quantité', unitPrice:'Prix/L', subtotal:'Sous-total',
  paid:'Payée', cancelled:'Annulée', confirm:'Confirmer',
  changeStatusConfirm:'Voulez-vous changer le statut de la facture à',
  // Payroll
  addPayDate:'Ajouter une date de paie', payDateDesc:'Description (optionnel)',
  enterPayDate:'Entrez la date de paie', deletePayDateConfirm:'Voulez-vous supprimer cette date ?',
  daysRemaining:'jours restants', upcoming:'À venir', past:'Passées',
  noUpcoming:'Aucune date à venir', addPayDateBtn:'+ Ajouter la date',
  // Pumps
  enterPumpNumber:'Veuillez entrer le numéro de la pompe', pumpUpdated:'Pompe mise à jour',
  maxPumps:'Maximum 12 pompes', pumpAdded:'Pompe ajoutée',
  pumpEdit:'Modifier la pompe', pumpAdd:'Ajouter une pompe (max 12)',
  noPumps:'Aucune pompe', pumpHash:'Pompe #', alert:'Alerte', successTitle:'Succès',
  // Reports
  totalRevenue:'Revenu total', totalFuel:'Carburant total',
  noSalesInPeriod:'Aucune vente dans cette période',
  fromDate:'Du', toDate:'Au', today:"Aujourd'hui", thisWeek:'Semaine', thisMonth:'Mois',
  allTime:'Tout',
  salesReport:'Rapport des Ventes', generatedBy:'Généré par le système de gestion de station-service',
  shareReport:'Partager le rapport', reportError:'Échec de la création du rapport',
  employee:'Employé', institutionCol:'Institution', payment:'Paiement',
  fuelCol:'Carburant', qtyCol:'Qté', priceCol:'Prix/L', totalCol:'Total',
  // Messages
  sendFailed:"Échec de l'envoi", sendToAll:'Envoyer à tous',
  sendToAllEmployees:'Envoyer à tous les employés', noMessages:'Aucun message',
  // Chat
  teamChat:'Mon équipe', directMessages:'Messages privés',
  broadcastNotice:'📢 Ces messages sont envoyés à tous les employés', noMembers:'Aucun membre',
  // Sales form
  newSaleSuccess:'Vente enregistrée avec succès', confirmSale:'✓ Confirmer la vente',
  selectInstitution:"Sélectionner l'institution", customAmount:'Montant personnalisé',
  enterQuantity:'Entrez la quantité', selectFuel:'Sélectionner le carburant',
  selectPump:'Sélectionner la pompe', estimatedTotal:'Total estimé',
  // Settings
  switchLangDesc:'Français ← Arabe', currentDark:'Actuellement: Mode sombre',
  currentLight:'Actuellement: Mode clair',
  // Worker dashboard
  seeAllSales:'Voir toutes les ventes',
  back:'Retour',
};

const AuthContext  = createContext(null);
const TRANSLATIONS = { ar, fr };

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [lang,  setLang]  = useState('ar');
  const [theme, setTheme] = useState('dark');

  const t     = TRANSLATIONS[lang] || ar;
  const isRTL = lang === 'ar';

  function doLogin(tokenStr, userData) {
    setToken(tokenStr);
    setUser(userData);
  }

  function doLogout() {
    setToken(null);
    setUser(null);
  }

  function toggleLang() {
    setLang(l => l === 'ar' ? 'fr' : 'ar');
  }

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoggedIn: !!token, loading: false,
      doLogin, doLogout, lang, toggleLang, t, isRTL, theme, toggleTheme,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
export default AuthContext;