import { createContext, useContext, useState, useEffect } from 'react';

// Translations embedded directly — no external file imports needed
const ar = {
  appName:'نظام إدارة محطة الوقود', appShort:'محطة الوقود',
  login:'تسجيل الدخول', logout:'تسجيل الخروج',
  username:'اسم المستخدم', password:'كلمة المرور',
  newPassword:'كلمة مرور جديدة', oldPassword:'كلمة المرور القديمة',
  changePassword:'تغيير كلمة المرور', register:'تسجيل عامل جديد',
  manager:'مدير المحطة', team_leader:'رئيس الفريق', worker:'عامل',
  dashboard:'لوحة التحكم', employees:'الموظفون', shifts:'الفترات والحضور',
  inventory:'مخزون الوقود', sales:'المبيعات', reports:'التقارير',
  invoices:'الفواتير', institutions:'المؤسسات', messages:'الرسائل',
  payroll:'مواعيد الأجور', settings:'الإعدادات',
  fuelType:'نوع الوقود', unleaded95:'بنزين عادي 95', unleaded98:'بنزين ممتاز 98',
  diesel:'مازوت', gpl:'غاز البترول', liters:'لتر',
  pricePerLiter:'السعر/لتر', totalAmount:'المجموع', currency:'دج',
  tankLevel:'مستوى الخزان', lastRefill:'آخر ملء', refillNow:'ملء الخزان',
  lowStock:'مخزون منخفض', criticalStock:'مخزون حرج',
  newSale:'تسجيل بيع', pumpNumber:'رقم المضخة',
  paymentMethod:'طريقة الدفع', cash:'نقداً', card:'بطاقة',
  loyalty:'نقاط الولاء', credit:'دين مؤسسة',
  morningShift:'فترة الصباح (08:00 - 14:00)',
  afternoonShift:'فترة المساء (14:00 - 20:00)',
  nightShift:'فترة الليل (20:00 - 08:00)',
  morningTeam:'فريق الصباح', afternoonTeam:'فريق المساء',
  nightTeam:'فريق الليل', reserveTeam:'فريق الاحتياط',
  attendance:'الحضور والغياب', present:'حاضر', absent:'غائب',
  late:'متأخر', excused:'مبرر',
  checkIn:'وقت الحضور', checkOut:'وقت الانصراف',
  fullName:'الاسم الكامل', phone:'الهاتف', nationalId:'رقم الهوية',
  hireDate:'تاريخ التوظيف', salary:'الراتب', team:'الفريق',
  active:'نشط', inactive:'موقوف',
  sendMessage:'إرسال رسالة', typeMessage:'اكتب رسالتك...',
  send:'إرسال', broadcast:'إرسال للجميع',
  todayRevenue:'إيرادات اليوم', monthRevenue:'إيرادات الشهر',
  totalSales:'إجمالي المبيعات', transactions:'العمليات',
  exportReport:'تصدير التقرير',
  invoiceNumber:'رقم الفاتورة', issueDate:'تاريخ الإصدار',
  dueDate:'تاريخ الاستحقاق', taxAmount:'الضريبة (19%)',
  netAmount:'المبلغ الصافي', status:'الحالة',
  pending:'معلق', paid:'مدفوع', cancelled:'ملغى',
  payDate:'تاريخ صرف الأجر', nextPayDate:'موعد الراتب القادم',
  save:'حفظ', cancel:'إلغاء', delete:'حذف', edit:'تعديل', add:'إضافة',
  search:'بحث', loading:'جاري التحميل...', error:'حدث خطأ',
  success:'تمت العملية بنجاح', confirm:'تأكيد', back:'رجوع',
  date:'التاريخ', notes:'ملاحظات', actions:'الإجراءات',
  credits: 'الديون',   // Arabic
  
  total:'الإجمالي', name:'الاسم', yes:'نعم', no:'لا', language:'اللغة',
  fuelSoldToday: 'كميّة الوقود المباعة اليوم', mySalesToday: 'مبيعاتي اليوم', biggestTransaction: 'أكبر عملية',
  avgTransaction: 'متوسط العملية', fuelAvailability: 'توفر الوقود', mySalesByFuel: 'مبيعاتي اليوم حسب الوقود',
  myLatestSales: 'آخر مبيعاتي اليوم', todayOperations: 'عمليات اليوم', monthSales: 'مبيعات الشهر (دج)',
  todaySalesBreakdown: 'تفصيل مبيعات اليوم حسب نوع الوقود', todayBreakdown: 'تفصيل اليوم',
  fuelTypeTitle: 'نوع الوقود', quantityTitle: 'الكميّة (L)', salesTitle: 'المبيعات (دج)', operationsTitle: 'العمليات',
  noSalesToday: 'لا توجد مبيعات اليوم', noSalesYet: 'لا توجد مبيعات بعد', noData: 'لا توجد بيانات',
  pumpStr: 'مضخة', hello: 'مرحباً،',
};

const fr = {
  appName:"Système de gestion de station-service", appShort:'Station-service',
  login:'Se connecter', logout:'Se déconnecter',
  username:"Nom d'utilisateur", password:'Mot de passe',
  newPassword:'Nouveau mot de passe', oldPassword:'Ancien mot de passe',
  changePassword:'Changer le mot de passe', register:'Enregistrer un employé',
  manager:'Directeur de station', team_leader:"Chef d'équipe", worker:'Employé',
  dashboard:'Tableau de bord', employees:'Employés', shifts:'Équipes et présence',
  inventory:'Inventaire carburant', sales:'Ventes', reports:'Rapports',
  invoices:'Factures', institutions:'Institutions', messages:'Messages',
  payroll:'Dates de paie', settings:'Paramètres',
  fuelType:'Type de carburant', unleaded95:'Sans plomb 95', unleaded98:'Sans plomb 98',
  diesel:'Diesel', gpl:'GPL', liters:'litres',
  pricePerLiter:'Prix/litre', totalAmount:'Montant total', currency:'DA',
  tankLevel:'Niveau du réservoir', lastRefill:'Dernier remplissage',
  refillNow:'Remplir le réservoir', lowStock:'Stock faible', criticalStock:'Stock critique',
  newSale:'Nouvelle vente', pumpNumber:'N° de pompe',
  paymentMethod:'Mode de paiement', cash:'Espèces', card:'Carte',
  loyalty:'Points fidélité', credit:'Crédit institution',
  morningShift:'Équipe matin (08:00 - 14:00)',
  afternoonShift:"Équipe après-midi (14:00 - 20:00)",
  nightShift:'Équipe nuit (20:00 - 08:00)',
  morningTeam:'Équipe du matin', afternoonTeam:"Équipe de l'après-midi",
  nightTeam:'Équipe de nuit', reserveTeam:'Équipe de réserve',
  attendance:'Présences', present:'Présent', absent:'Absent',
  late:'En retard', excused:'Excusé',
  checkIn:"Heure d'arrivée", checkOut:'Heure de départ',
  fullName:'Nom complet', phone:'Téléphone', nationalId:'N° national',
  hireDate:"Date d'embauche", salary:'Salaire', team:'Équipe',
  active:'Actif', inactive:'Inactif',
  sendMessage:'Envoyer un message', typeMessage:'Écrivez votre message...',
  send:'Envoyer', broadcast:'Envoyer à tous',
  todayRevenue:"Chiffre d'affaires du jour", monthRevenue:'Chiffre du mois',
  totalSales:'Total des ventes', transactions:'Transactions',
  exportReport:'Exporter le rapport',
  invoiceNumber:'N° de facture', issueDate:"Date d'émission", dueDate:'Date limite',
  taxAmount:'TVA (19%)', netAmount:'Montant HT', status:'Statut',
  pending:'En attente', paid:'Payée', cancelled:'Annulée',
  payDate:'Date de paie', nextPayDate:'Prochaine paie',
  credits: 'Crédits',  // French
  save:'Enregistrer', cancel:'Annuler', delete:'Supprimer', edit:'Modifier', add:'Ajouter',
  search:'Rechercher', loading:'Chargement...', error:'Une erreur est survenue',
  success:'Opération réussie', confirm:'Confirmer', back:'Retour',
  date:'Date', notes:'Notes', actions:'Actions', total:'Total',
  name:'Nom', yes:'Oui', no:'Non', language:'Langue',
  fuelSoldToday: "Carburant vendu aujourd'hui", mySalesToday: "Mes ventes aujourd'hui", biggestTransaction: "Plus grosse transaction",
  avgTransaction: "Transaction moyenne", fuelAvailability: "Disponibilité du carburant", mySalesByFuel: "Mes ventes par carburant",
  myLatestSales: "Mes dernières ventes aujourd'hui", todayOperations: "Transactions aujourd'hui", monthSales: "Ventes du mois (DA)",
  todaySalesBreakdown: "Détail des ventes du jour par carburant", todayBreakdown: "Détail du jour",
  fuelTypeTitle: "Type de carburant", quantityTitle: "Quantité (L)", salesTitle: "Ventes (DA)", operationsTitle: "Transactions",
  noSalesToday: "Aucune vente aujourd'hui", noSalesYet: "Aucune vente pour le moment", noData: "Aucune donnée",
  pumpStr: "Pompe", hello: "Bonjour,",
};

const AuthContext  = createContext(null);
const TRANSLATIONS = { ar, fr };

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [lang,  setLang]  = useState(() => localStorage.getItem('lang') || 'ar');

  const t     = TRANSLATIONS[lang] || ar;
  const isRTL = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang, isRTL]);

  function doLogin(tokenStr, userData) {
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('user',  JSON.stringify(userData));
    setToken(tokenStr);
    setUser(userData);
  }

  function doLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  function toggleLang() {
    setLang(l => l === 'ar' ? 'fr' : 'ar');
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoggedIn: !!token,
      doLogin, doLogout, lang, toggleLang, t, isRTL,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
export default AuthContext;