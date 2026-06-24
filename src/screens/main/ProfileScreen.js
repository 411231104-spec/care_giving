import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Colors, Spacing, Radius, FontSize } from '../../theme/colors'

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export default function ProfileScreen() {
  const { user, profile, fetchProfile, signOut } = useAuth()
  const [stats,      setStats]      = useState({})
  const [editMode,   setEditMode]   = useState(false)
  const [passMode,   setPassMode]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [form,       setForm]       = useState({ full_name: '', phone: '' })
  const [passwords,  setPasswords]  = useState({ newPass: '', confirm: '' })
  const [showPw,     setShowPw]     = useState(false)

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
    loadStats()
  }, [profile])

  async function loadStats() {
    try {
      const [{ count: myBookings }, { count: pendingBookings }] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('requested_by', user.id),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('requested_by', user.id).eq('status', 'pending'),
      ])
      let extra = {}
      if (profile?.role === 'admin') {
        const [{ count: totalLansia }, { count: totalUsers }] = await Promise.all([
          supabase.from('care_receivers').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('users').select('*', { count: 'exact', head: true }),
        ])
        extra = { totalLansia, totalUsers }
      }
      setStats({ myBookings, pendingBookings, ...extra })
    } catch {}
  }

  async function handleSave() {
    if (!form.full_name.trim()) return Alert.alert('Perhatian', 'Nama lengkap tidak boleh kosong')
    setSaving(true)
    const { error } = await supabase.from('users').update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null }).eq('id', user.id)
    setSaving(false)
    if (error) return Alert.alert('Gagal', error.message)
    Alert.alert('Berhasil', 'Profil berhasil diperbarui ✅')
    setEditMode(false)
    await fetchProfile(user.id)
  }

  async function handleChangePassword() {
    if (!passwords.newPass || passwords.newPass.length < 6) return Alert.alert('Perhatian', 'Kata sandi minimal 6 karakter')
    if (passwords.newPass !== passwords.confirm) return Alert.alert('Perhatian', 'Konfirmasi kata sandi tidak cocok')
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
    setChangingPw(false)
    if (error) return Alert.alert('Gagal', error.message)
    Alert.alert('Berhasil', 'Kata sandi berhasil diubah ✅')
    setPassMode(false)
    setPasswords({ newPass: '', confirm: '' })
  }

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ])
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Profil */}
        <View style={s.profileHeader}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getInitials(profile?.full_name || '?')}</Text>
            </View>
            <View style={[s.onlineDot, { backgroundColor: Colors.success }]} />
          </View>
          <Text style={s.profileName}>{profile?.full_name || 'Pengguna'}</Text>
          <Text style={s.profileEmail}>{user?.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: isAdmin ? Colors.primary + '22' : Colors.success + '22' }]}>
            <Text style={[s.roleText, { color: isAdmin ? Colors.primaryLight : Colors.success }]}>
              {isAdmin ? '👨‍💼 Administrator' : '👨‍👩‍👧 Keluarga'}
            </Text>
          </View>
        </View>

        {/* Statistik */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📊 Statistik Akun</Text>
          <View style={s.statsGrid}>
            <View style={s.statMini}>
              <Text style={s.statVal}>{stats.myBookings ?? '-'}</Text>
              <Text style={s.statLabel}>Total Booking</Text>
            </View>
            <View style={s.statMini}>
              <Text style={[s.statVal, { color: Colors.warning }]}>{stats.pendingBookings ?? '-'}</Text>
              <Text style={s.statLabel}>Menunggu</Text>
            </View>
            {isAdmin && (<>
              <View style={s.statMini}>
                <Text style={[s.statVal, { color: Colors.accent }]}>{stats.totalLansia ?? '-'}</Text>
                <Text style={s.statLabel}>Lansia Aktif</Text>
              </View>
              <View style={s.statMini}>
                <Text style={[s.statVal, { color: Colors.success }]}>{stats.totalUsers ?? '-'}</Text>
                <Text style={s.statLabel}>Total User</Text>
              </View>
            </>)}
          </View>
        </View>

        {/* Edit Profil */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>✏️ Informasi Profil</Text>
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Text style={{ color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.sm }}>
                {editMode ? 'Batal' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          {editMode ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {[
                { label: 'Nama Lengkap', key: 'full_name', icon: '👤', placeholder: 'Nama lengkap' },
                { label: 'Nomor Telepon', key: 'phone', icon: '📱', placeholder: '08xxxxxxxxxx', keyboardType: 'phone-pad' },
              ].map(f => (
                <View key={f.key} style={s.inputGroup}>
                  <Text style={s.label}>{f.label}</Text>
                  <View style={s.inputRow}>
                    <Text style={s.inputIcon}>{f.icon}</Text>
                    <TextInput style={s.input} value={form[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                      placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                      keyboardType={f.keyboardType || 'default'} />
                  </View>
                </View>
              ))}
              <TouchableOpacity style={[s.btnPrimary, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={s.btnPrimaryText}>💾 Simpan Perubahan</Text>}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          ) : (
            <View style={s.infoBox}>
              {[
                ['✉️ Email',     user?.email],
                ['📱 Telepon',  profile?.phone || 'Belum ditambahkan'],
                ['📅 Bergabung', new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
              ].map(([label, value], i) => (
                <View key={i} style={[s.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                  <Text style={s.infoLabel}>{label}</Text>
                  <Text style={s.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ubah Kata Sandi */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🔐 Keamanan</Text>
            <TouchableOpacity onPress={() => setPassMode(!passMode)}>
              <Text style={{ color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.sm }}>
                {passMode ? 'Batal' : 'Ubah Kata Sandi'}
              </Text>
            </TouchableOpacity>
          </View>
          {passMode && (
            <View>
              {[
                { label: 'Kata Sandi Baru', key: 'newPass', placeholder: 'Minimal 6 karakter' },
                { label: 'Konfirmasi',      key: 'confirm', placeholder: 'Ulangi kata sandi baru' },
              ].map(f => (
                <View key={f.key} style={s.inputGroup}>
                  <Text style={s.label}>{f.label}</Text>
                  <View style={s.inputRow}>
                    <Text style={s.inputIcon}>🔒</Text>
                    <TextInput style={[s.input, { flex: 1 }]} value={passwords[f.key]}
                      onChangeText={v => setPasswords(p => ({ ...p, [f.key]: v }))}
                      placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPw} autoCapitalize="none" />
                    {f.key === 'newPass' && (
                      <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: Spacing.sm }}>
                        <Text>{showPw ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              <TouchableOpacity style={[s.btnPrimary, changingPw && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={changingPw}>
                {changingPw ? <ActivityIndicator color="white" /> : <Text style={s.btnPrimaryText}>🔐 Simpan Kata Sandi</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Zona Bahaya */}
        <View style={[s.section, { borderColor: 'rgba(239,68,68,0.25)' }]}>
          <Text style={[s.sectionTitle, { color: Colors.danger }]}>⚠️ Zona Bahaya</Text>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={s.logoutText}>🚪 Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  profileHeader: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.bgSurface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primaryLight },
  avatarText: { color: 'white', fontSize: 32, fontWeight: '800' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.bgSurface },
  profileName:  { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  roleBadge: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
  roleText:  { fontSize: FontSize.xs, fontWeight: '700' },

  section: { margin: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statMini:  { flex: 1, minWidth: '45%', backgroundColor: Colors.bgSurface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statVal:   { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },

  infoBox:   { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  infoRow:   { padding: Spacing.md },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginBottom: 3 },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },

  inputGroup:{ marginBottom: Spacing.md },
  label:     { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input:     { flex: 1, paddingVertical: 13, color: Colors.textPrimary, fontSize: FontSize.md },

  btnPrimary:    { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, elevation: 6 },
  btnPrimaryText:{ color: 'white', fontWeight: '700', fontSize: FontSize.sm },

  logoutBtn:  { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.sm },
})
