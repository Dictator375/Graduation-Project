import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  StatusBar, ScrollView, Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { login, setAuthToken } from '../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../utils/layout';

const { height } = Dimensions.get('window');

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
    } finally { setLoading(false); }
  }

  return (
    <View style={s.screen}>
      <StatusBar backgroundColor="#0f1117" barStyle="light-content" />
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#0f1117' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <Text style={s.logoIcon}>⛽</Text>
            <Text style={s.title}>{t.appName}</Text>
            <Text style={s.subtitle}>{t.login}</Text>
          </View>
          <View style={s.card}>
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
                textAlign="right"
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
                textAlign="right"
              />
            </View>
            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>{t.login}</Text>
              }
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
            <Text style={s.langText}>
              {lang === 'ar' ? '🇫🇷 Passer en Français' : '🇩🇿 التبديل للعربية'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: '#0f1117' },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: rp(24), minHeight: height * 0.85 },
  logoWrap:   { alignItems: 'center', marginBottom: rp(32) },
  logoIcon:   { fontSize: rs(64), marginBottom: rp(12) },
  title:      { color: '#eef0f6', fontSize: rs(18), fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle:   { color: '#8b92a9', fontSize: rs(13), textAlign: 'center' },
  card:       { backgroundColor: '#1c2133', borderRadius: 16, padding: rp(24), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  inputGroup: { marginBottom: rp(16) },
  label:      { color: '#8b92a9', fontSize: rs(12), marginBottom: rp(6), textAlign: 'right' },
  input:      { backgroundColor: '#171b25', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', borderRadius: 10, color: '#eef0f6', fontSize: rs(15), paddingVertical: rp(12), paddingHorizontal: rp(14) },
  btn:        { backgroundColor: '#E85D24', borderRadius: 12, paddingVertical: rp(14), alignItems: 'center', marginTop: rp(8) },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: rs(16) },
  langBtn:    { marginTop: rp(20), alignItems: 'center' },
  langText:   { color: '#8b92a9', fontSize: rs(13) },
});