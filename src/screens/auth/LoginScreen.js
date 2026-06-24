import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { Colors, Spacing, Radius, FontSize } from '../../theme/colors'

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!email.trim())    return Alert.alert('Perhatian', 'Email wajib diisi')
    if (!password)        return Alert.alert('Perhatian', 'Kata sandi wajib diisi')

    setLoading(true)
    try {
      await signIn(email.trim(), password)
      // Navigator otomatis beralih ke MainTabs via AuthContext
    } catch (err) {
      const msg = err.message.includes('Invalid')
        ? 'Email atau kata sandi salah. Silakan coba lagi.'
        : err.message
      Alert.alert('Login Gagal', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <Image
              source={require('../../../assets/logo.png')}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Text style={s.appTagline}>we love, we care</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Selamat Datang 👋</Text>
            <Text style={s.cardSubtitle}>Masuk ke akun Anda untuk melanjutkan</Text>

            {/* Email */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Alamat Email</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>✉️</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contoh@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Kata Sandi</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[s.btnPrimary, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={s.btnPrimaryText}>🚀 Masuk Sekarang</Text>
              }
            </TouchableOpacity>

            {/* Register link */}
            <View style={s.linkRow}>
              <Text style={s.linkText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.link}>Daftar di sini</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features */}
          <View style={s.features}>
            {[
              { icon: '📅', text: 'Jadwal perawatan terpusat' },
              { icon: '🔔', text: 'Notifikasi real-time' },
              { icon: '👥', text: 'Koordinasi admin & keluarga' },
            ].map((f, i) => (
              <View key={i} style={s.featureItem}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.bgBase },
  scroll:    { flexGrow: 1, padding: Spacing.lg },
  header:    { alignItems: 'center', paddingVertical: Spacing.xl },
  logoImg:    { width: 160, height: 160, marginBottom: Spacing.xs },
  appTagline: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 0, marginBottom: Spacing.sm },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  cardTitle:    { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },

  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: {
    flex: 1, paddingVertical: 13,
    color: Colors.textPrimary, fontSize: FontSize.md,
  },
  eyeBtn:  { padding: Spacing.sm },
  eyeIcon: { fontSize: 16 },

  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', marginTop: Spacing.md,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  btnDisabled:    { opacity: 0.6 },
  btnPrimaryText: { color: 'white', fontSize: FontSize.md, fontWeight: '700' },

  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  linkText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  link:     { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.sm },

  features:     { gap: Spacing.sm },
  featureItem:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
  featureIcon:  { fontSize: 18 },
  featureText:  { color: Colors.textSecondary, fontSize: FontSize.sm },
})
