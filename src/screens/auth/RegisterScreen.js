import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { Colors, Spacing, Radius, FontSize } from '../../theme/colors'

const ROLES = [
  { id: 'admin',  icon: '👨‍💼', label: 'Admin',    desc: 'Kelola jadwal & booking' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'Keluarga', desc: 'Pantau & buat permintaan' },
]

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth()
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [role,     setRole]     = useState('family')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  // Password strength
  function getStrength(p) {
    let s = 0
    if (p.length >= 6)          s++
    if (p.length >= 10)         s++
    if (/[A-Z]/.test(p))        s++
    if (/[0-9]/.test(p))        s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    const map = [
      { label: '',              color: Colors.border,  pct: 0   },
      { label: 'Sangat lemah',  color: Colors.danger,  pct: 0.2 },
      { label: 'Lemah',         color: Colors.warning, pct: 0.4 },
      { label: 'Cukup kuat',    color: Colors.warning, pct: 0.6 },
      { label: 'Kuat',          color: Colors.success, pct: 0.8 },
      { label: 'Sangat kuat 💪',color: Colors.success, pct: 1.0 },
    ]
    return map[s] || map[0]
  }
  const strength = getStrength(password)

  async function handleRegister() {
    if (!name.trim())      return Alert.alert('Perhatian', 'Nama lengkap wajib diisi')
    if (!email.trim())     return Alert.alert('Perhatian', 'Email wajib diisi')
    if (password.length < 6) return Alert.alert('Perhatian', 'Kata sandi minimal 6 karakter')
    if (password !== confirm) return Alert.alert('Perhatian', 'Konfirmasi kata sandi tidak cocok')

    setLoading(true)
    try {
      await signUp(email.trim(), password, { full_name: name.trim(), phone: phone.trim(), role })
      Alert.alert(
        'Pendaftaran Berhasil! 🎉',
        'Akun Anda telah dibuat. Silakan cek email untuk konfirmasi (jika diaktifkan).',
        [{ text: 'Masuk Sekarang', onPress: () => navigation.navigate('Login') }]
      )
    } catch (err) {
      Alert.alert('Pendaftaran Gagal', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <Text style={s.logo}>💞</Text>
            <Text style={s.title}>Buat Akun Baru</Text>
            <Text style={s.subtitle}>Bergabung dengan platform perawatan digital</Text>
          </View>

          <View style={s.card}>

            {/* Pilihan Peran */}
            <Text style={s.label}>Saya adalah</Text>
            <View style={s.roleRow}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[s.roleCard, role === r.id && s.roleCardActive]}
                  onPress={() => setRole(r.id)}
                  activeOpacity={0.8}
                >
                  <Text style={s.roleIcon}>{r.icon}</Text>
                  <Text style={[s.roleName, role === r.id && s.roleNameActive]}>{r.label}</Text>
                  <Text style={s.roleDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nama */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Nama Lengkap</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>👤</Text>
                <TextInput style={s.input} value={name} onChangeText={setName}
                  placeholder="Masukkan nama lengkap" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            {/* Telepon */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Nomor Telepon</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>📱</Text>
                <TextInput style={s.input} value={phone} onChangeText={setPhone}
                  placeholder="08xxxxxxxxxx" placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad" />
              </View>
            </View>

            {/* Email */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Alamat Email</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>✉️</Text>
                <TextInput style={s.input} value={email} onChangeText={setEmail}
                  placeholder="contoh@email.com" placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            {/* Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Kata Sandi</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
                  placeholder="Minimal 6 karakter" placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  <Text>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {/* Strength bar */}
              {password.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <View style={s.strengthBar}>
                    <View style={[s.strengthFill, { width: `${strength.pct * 100}%`, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Konfirmasi Kata Sandi</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>🔐</Text>
                <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
                  placeholder="Ulangi kata sandi" placeholderTextColor={Colors.textMuted}
                  secureTextEntry autoCapitalize="none" />
              </View>
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={handleRegister} disabled={loading} activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={s.btnText}>✨ Buat Akun Sekarang</Text>
              }
            </TouchableOpacity>

            <View style={s.linkRow}>
              <Text style={s.linkText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.link}>Masuk di sini</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.bgBase },
  scroll:    { flexGrow: 1, padding: Spacing.lg },
  header:    { alignItems: 'center', paddingVertical: Spacing.lg },
  logo:      { fontSize: 44, marginBottom: Spacing.sm },
  title:     { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:  { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  label: {
    fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 6,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleCard: {
    flex: 1, alignItems: 'center', padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(79,70,229,0.1)' },
  roleIcon:      { fontSize: 28, marginBottom: 4 },
  roleName:      { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  roleNameActive:{ color: Colors.primaryLight },
  roleDesc:      { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  inputGroup:    { marginBottom: Spacing.md },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSurface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: { flex: 1, paddingVertical: 13, color: Colors.textPrimary, fontSize: FontSize.md },
  eyeBtn: { padding: Spacing.sm },
  strengthBar: { height: 4, backgroundColor: Colors.bgSurface, borderRadius: 99, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 99 },
  strengthLabel: { fontSize: 11, marginTop: 4 },
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing.md,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  btnText:  { color: 'white', fontSize: FontSize.md, fontWeight: '700' },
  linkRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  linkText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  link:     { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.sm },
})
