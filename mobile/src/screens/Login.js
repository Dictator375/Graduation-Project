import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { login, setAuthToken } from '../utils/api';

export default function LoginScreen() {
  const { doLogin, toggleLang, lang, t } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('خطأ', 'أدخل اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ username: username.trim(), password });
      setAuthToken(res.data.token);
      doLogin(res.data.token, res.data.user);
    } catch (err) {
      Alert.alert('خطأ في تسجيل الدخول', err.response?.data?.error || 'تحقق من المعلومات المدخلة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.container}
    >
      <View style={s.card}>
        <Text style={s.logo}>⛽</Text>
        <Text style={s.title}>{t.appName}</Text>
        <Text style={s.subtitle}>{t.login}</Text>

        <View style={s.inputGroup}>
          <Text style={s.label}>{t.username}</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#555e7a"
            placeholder="admin"
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>{t.password}</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#555e7a"
            placeholder="••••••••"
          />
        </View>

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>{t.login}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
          <Text style={s.langText}>
            {lang === 'ar' ? '🇫🇷 Passer en Français' : '🇩🇿 التبديل للعربية'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f1117', justifyContent:'center', padding:24 },
  card:      { backgroundColor:'#1c2133', borderRadius:16, padding:28, borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  logo:      { fontSize:52, textAlign:'center', marginBottom:10 },
  title:     { color:'#eef0f6', fontSize:17, fontWeight:'700', textAlign:'center', marginBottom:4 },
  subtitle:  { color:'#8b92a9', fontSize:13, textAlign:'center', marginBottom:24 },
  inputGroup:{ marginBottom:14 },
  label:     { color:'#8b92a9', fontSize:12, marginBottom:5 },
  input:     {
    backgroundColor:'#171b25', borderWidth:1, borderColor:'rgba(255,255,255,0.13)',
    borderRadius:8, color:'#eef0f6', fontSize:14, paddingVertical:10, paddingHorizontal:14,
  },
  btn:       { backgroundColor:'#E85D24', borderRadius:10, paddingVertical:13, alignItems:'center', marginTop:8 },
  btnText:   { color:'#fff', fontWeight:'700', fontSize:15 },
  langBtn:   { marginTop:18, alignItems:'center' },
  langText:  { color:'#8b92a9', fontSize:12 },
});