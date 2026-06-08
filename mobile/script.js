const fs = require('fs');
const file = 'c:/GasStation/mobile/src/screens/worker/Sales.js';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(
  `import { createSale, getFuelTypes, getInstitutions } from '../../utils/api';`,
  `import { createSale, getFuelTypes, getInstitutions, getPumps } from '../../utils/api';`
);

// Constants
content = content.replace(
  `const PUMPS    = [1, 2, 3, 4, 5, 6, 7, 8];`,
  `const VOUCHER_VALUES = [850, 1200];`
);

// State
content = content.replace(
  `  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '' });`,
  `  const [institutions, setInstitutions] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [isCustomVoucher, setIsCustomVoucher] = useState(false);
  const [form, setForm] = useState({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '', voucher_amount: '' });`
);

// UseEffect
content = content.replace(
  `getInstitutions().then(r => setInstitutions(r.data || [])).catch(() => {});`,
  `getInstitutions().then(r => setInstitutions(r.data || [])).catch(() => {});
    getPumps().then(r => setPumps(r.data || [])).catch(() => {});`
);

// Handle Submit
content = content.replace(
  `      const res = await createSale(form);
      setSuccess(res.data);
      setForm({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '' });`,
  `      const payload = { ...form };
      if (payload.payment_method !== 'loyalty') delete payload.voucher_amount;
      const res = await createSale(payload);
      setSuccess(res.data);
      setForm({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '', voucher_amount: '' });
      setIsCustomVoucher(false);`
);

// Pump UI
content = content.replace(
  /<View style=\{s\.pumpGrid\}>[\s\S]*?<\/View>/,
  `<View style={s.pumpGrid}>
          {pumps.map(p => {
             const out = p.status === 'out_of_service';
             return (
               <TouchableOpacity key={p.id}
                 disabled={out}
                 style={[s.pumpBtn, form.pump_number == p.pump_number && s.selectBtnActive, out && {opacity: 0.5}]}
                 onPress={() => set('pump_number', p.pump_number)}>
                 <Text style={[s.pumpText, form.pump_number == p.pump_number && { color: '#fff' }, out && {textDecorationLine: 'line-through'}]}>{p.pump_number}</Text>
               </TouchableOpacity>
             );
          })}
        </View>`
);

// Loyalty UI (after Institution UI)
content = content.replace(
  `        {form.payment_method === 'credit' && (`,
  `        {form.payment_method === 'loyalty' && (
          <>
            <Text style={s.label}>قيمة القسيمة (Voucher Amount)</Text>
            <View style={{flexDirection: 'row', gap: rp(8), marginBottom: rp(8)}}>
              {VOUCHER_VALUES.map(val => (
                <TouchableOpacity key={val}
                  style={[s.payBtn, !isCustomVoucher && form.voucher_amount == val && s.selectBtnActive]}
                  onPress={() => { setIsCustomVoucher(false); set('voucher_amount', val.toString()); }}>
                  <Text style={[s.payText, !isCustomVoucher && form.voucher_amount == val && { color: '#fff' }]}>{val} دج</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[s.payBtn, isCustomVoucher && s.selectBtnActive]}
                onPress={() => { setIsCustomVoucher(true); set('voucher_amount', ''); }}>
                <Text style={[s.payText, isCustomVoucher && { color: '#fff' }]}>مخصص</Text>
              </TouchableOpacity>
            </View>
            {isCustomVoucher && (
               <TextInput
                 style={s.input}
                 value={form.voucher_amount}
                 onChangeText={v => set('voucher_amount', v)}
                 keyboardType="decimal-pad"
                 placeholder="أدخل القيمة"
                 placeholderTextColor="#555e7a"
                 textAlign="right"
               />
            )}
          </>
        )}

        {form.payment_method === 'credit' && (`
);

fs.writeFileSync(file, content);
console.log("Updated Sales.js");
