const CONSTANTS = {
  API_URL: 'http://localhost:3001/api',

  ROLES: {
    MANAGER:     'manager',
    TEAM_LEADER: 'team_leader',
    WORKER:      'worker',
  },

  SHIFTS: [
    { id: 1, name: 'Morning',   name_ar: 'الصباح',  start: '08:00', end: '14:00', type: 'morning'   },
    { id: 2, name: 'Afternoon', name_ar: 'المساء',  start: '14:00', end: '20:00', type: 'afternoon' },
    { id: 3, name: 'Night',     name_ar: 'الليل',   start: '20:00', end: '08:00', type: 'night'     },
  ],

  TEAMS: [
    { id: 1, type: 'morning',   name: 'Morning Team',   name_ar: 'فريق الصباح'    },
    { id: 2, type: 'afternoon', name: 'Afternoon Team', name_ar: 'فريق المساء'    },
    { id: 3, type: 'night',     name: 'Night Team',     name_ar: 'فريق الليل'     },
    { id: 4, type: 'reserve',   name: 'Reserve Team',   name_ar: 'فريق الاحتياط' },
  ],

  FUEL_TYPES: [
    { id: 1, name: 'Unleaded 95', name_ar: 'بنزين عادي 95',  color: '#E85D24' },
    { id: 2, name: 'Unleaded 98', name_ar: 'بنزين ممتاز 98', color: '#5DCAA5' },
    { id: 3, name: 'Diesel',      name_ar: 'مازوت',           color: '#185FA5' },
    { id: 4, name: 'GPL',         name_ar: 'غاز البترول',     color: '#BA7517' },
  ],

  PAYMENT_METHODS: [
    { value: 'cash',    label: 'Cash',    label_ar: 'نقداً'      },
    { value: 'card',    label: 'Card',    label_ar: 'بطاقة'      },
    { value: 'loyalty', label: 'Loyalty', label_ar: 'نقاط الولاء'},
    { value: 'credit',  label: 'Credit',  label_ar: 'دين مؤسسة' },
  ],

  ATTENDANCE_STATUS: [
    { value: 'present', label: 'Present', label_ar: 'حاضر',   color: '#1D9E75' },
    { value: 'absent',  label: 'Absent',  label_ar: 'غائب',   color: '#E24B4A' },
    { value: 'late',    label: 'Late',    label_ar: 'متأخر',  color: '#BA7517' },
    { value: 'excused', label: 'Excused', label_ar: 'مبرر',   color: '#5DCAA5' },
  ],

  CURRENCY:   'دج',
  PUMPS:      [1, 2, 3, 4, 5, 6, 7, 8],
  TAX_RATE:   0.19,
  LANGUAGES:  ['ar', 'fr'],
};

module.exports = CONSTANTS;
// For browser: export default CONSTANTS;
