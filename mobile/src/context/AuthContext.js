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
  loyalty:'نقاط الولاء', credit:'دين مؤسسة',
  morningShift:'فترة الصباح (08:00 - 14:00)',
  afternoonShift:'فترة المساء (14:00 - 20:00)',
  nightShift:'فترة الليل (20:00 - 08:00)',
  attendance:'الحضور والغياب', present:'حاضر', absent:'غائب',
  sendMessage:'إرسال رسالة', typeMessage:'اكتب رسالتك...',
  send:'إرسال', todayRevenue:'إيرادات اليوم',
  totalSales:'إجمالي المبيعات', transactions:'العمليات',
  active:'نشط', nextPayDate:'موعد الراتب القادم',
  save:'حفظ', cancel:'إلغاء', loading:'جاري التحميل...',
  error:'حدث خطأ', success:'تمت العملية بنجاح',
  notes:'ملاحظات', name:'الاسم', language:'اللغة',
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
  loyalty:'Fidélité', credit:'Crédit',
  morningShift:'Matin (08:00-14:00)',
  afternoonShift:'Après-midi (14:00-20:00)',
  nightShift:'Nuit (20:00-08:00)',
  attendance:'Présences', present:'Présent', absent:'Absent',
  sendMessage:'Envoyer', typeMessage:'Votre message...',
  send:'Envoyer', todayRevenue:"CA du jour",
  totalSales:'Total ventes', transactions:'Transactions',
  active:'Actif', nextPayDate:'Prochaine paie',
  save:'Enregistrer', cancel:'Annuler', loading:'Chargement...',
  error:'Erreur', success:'Succès',
  notes:'Notes', name:'Nom', language:'Langue',
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
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [lang,  setLang]  = useState('ar');

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

  return (
    <AuthContext.Provider value={{
      user, token, isLoggedIn: !!token, loading: false,
      doLogin, doLogout, lang, toggleLang, t, isRTL,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
export default AuthContext;