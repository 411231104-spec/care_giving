import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
  ScrollView, Modal, Platform, KeyboardAvoidingView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Colors, Spacing, Radius, FontSize } from '../../theme/colors'

const LAYANAN = [
  { id: 'Perawatan Umum',     icon: '🏥', desc: 'Perawatan rutin sehari-hari' },
  { id: 'Terapi Fisik',       icon: '🏃', desc: 'Latihan fisik & terapi mobilitas' },
  { id: 'Pendampingan Medis', icon: '💊', desc: 'Pengawasan obat & vital sign' },
  { id: 'Perawatan Malam',    icon: '🌙', desc: 'Layanan perawatan sepanjang malam' },
  { id: 'Konsultasi',         icon: '💬', desc: 'Sesi konsultasi kesehatan' },
]

const STATUS_COLOR = { pending: Colors.warning, approved: Colors.success, rejected: Colors.danger, cancelled: Colors.textMuted }
const STATUS_LABEL = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak', cancelled: 'Dibatalkan' }
const STEPS = ['Pilih Lansia', 'Pilih Layanan', 'Jadwal', 'Konfirmasi']

function getInitials(name = '') { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?' }

export default function BookingScreen() {
  const { user, profile } = useAuth()
  const [tab,        setTab]        = useState('list') // 'list' | 'new'
  const [bookings,   setBookings]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lansia,     setLansia]     = useState([])

  // Multi-step form state
  const [step,      setStep]      = useState(0)
  const [booking,   setBooking]   = useState({ care_receiver_id: null, care_receiver_name: '', service_type: '', booking_date: '', time_start: '08:00', time_end: '12:00', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  // Date modal
  const [dateInput, setDateInput]   = useState('')

  const loadBookings = useCallback(async () => {
    let q = supabase.from('bookings')
      .select('*, care_receivers(full_name, age), requester:requested_by(full_name)')
      .order('created_at', { ascending: false })
    if (profile?.role === 'family') q = q.eq('requested_by', user.id)
    const { data } = await q
    setBookings(data || [])
    setLoading(false)
    setRefreshing(false)
  }, [user, profile])

  const loadLansia = useCallback(async () => {
    const { data } = await supabase.from('care_receivers').select('id, full_name, age, gender, medical_notes').eq('is_active', true).order('full_name')
    setLansia(data || [])
  }, [])

  useEffect(() => {
    loadBookings()
    loadLansia()
    const ch = supabase.channel('booking-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadBookings)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loadBookings, loadLansia])

  async function handleStatusChange(id, status) {
    const labels = { approved: 'disetujui', rejected: 'ditolak', cancelled: 'dibatalkan' }
    Alert.alert('Konfirmasi', `Tandai booking sebagai "${labels[status]}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ya', onPress: async () => {
          await supabase.from('bookings').update({ status, assigned_admin: status === 'approved' ? user.id : null }).eq('id', id)
          await loadBookings()
        }
      }
    ])
  }

  async function handleDelete(id) {
    Alert.alert('Hapus', 'Hapus data booking ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
          await supabase.from('bookings').delete().eq('id', id)
          await loadBookings()
        }
      }
    ])
  }

  function handleNext() {
    if (step === 0 && !booking.care_receiver_id) return Alert.alert('Perhatian', 'Pilih lansia terlebih dahulu')
    if (step === 1 && !booking.service_type)     return Alert.alert('Perhatian', 'Pilih jenis layanan terlebih dahulu')
    if (step === 2 && !booking.booking_date)     return Alert.alert('Perhatian', 'Masukkan tanggal pemesanan')
    if (step === 2 && booking.time_start >= booking.time_end) return Alert.alert('Perhatian', 'Waktu selesai harus lebih dari waktu mulai')
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        care_receiver_id: booking.care_receiver_id,
        requested_by:     user.id,
        booking_date:     booking.booking_date,
        time_start:       booking.time_start,
        time_end:         booking.time_end,
        service_type:     booking.service_type,
        notes:            booking.notes || null,
        status:           'pending',
      })
      if (error) throw error
      Alert.alert('Berhasil! 🎉', 'Pemesanan Anda telah dikirim dan menunggu persetujuan admin.')
      setStep(0)
      setBooking({ care_receiver_id: null, care_receiver_name: '', service_type: '', booking_date: '', time_start: '08:00', time_end: '12:00', notes: '' })
      setTab('list')
      await loadBookings()
    } catch (e) {
      Alert.alert('Gagal', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ---- RENDER BOOKING ROW ----
  function renderBookingItem({ item }) {
    const color = STATUS_COLOR[item.status]
    const d = new Date(item.booking_date)
    const day   = d.getDate()
    const month = d.toLocaleString('id-ID', { month: 'short' })
    return (
      <View style={s.bookingCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={s.dateBadge}>
            <Text style={s.dateDay}>{day}</Text>
            <Text style={s.dateMonth}>{month}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bookingName}>{item.care_receivers?.full_name || '-'}</Text>
            <Text style={s.bookingDetail}>{item.service_type} • {item.time_start?.substring(0,5)} – {item.time_end?.substring(0,5)}</Text>
            <Text style={s.bookingBy}>Diminta: {item.requester?.full_name || '-'}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[s.statusText, { color }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>
        {/* Actions */}
        <View style={s.bookingActions}>
          {profile?.role === 'admin' && item.status === 'pending' && (<>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.success + '22', borderColor: Colors.success + '55' }]} onPress={() => handleStatusChange(item.id, 'approved')}>
              <Text style={{ color: Colors.success, fontSize: 12, fontWeight: '700' }}>✅ Setujui</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.danger + '22', borderColor: Colors.danger + '55' }]} onPress={() => handleStatusChange(item.id, 'rejected')}>
              <Text style={{ color: Colors.danger, fontSize: 12, fontWeight: '700' }}>❌ Tolak</Text>
            </TouchableOpacity>
          </>)}
          {item.status === 'pending' && (
            <TouchableOpacity style={[s.actionBtn, { borderColor: Colors.border }]} onPress={() => handleStatusChange(item.id, 'cancelled')}>
              <Text style={{ color: Colors.textMuted, fontSize: 12 }}>🚫 Batal</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.actionBtn, { borderColor: Colors.border }]} onPress={() => handleDelete(item.id)}>
            <Text style={{ color: Colors.textMuted, fontSize: 12 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ---- RENDER FORM STEP ----
  function renderStep() {
    if (step === 0) return (
      <ScrollView contentContainerStyle={{ gap: Spacing.sm }}>
        <Text style={s.stepDesc}>Pilih lansia yang akan mendapatkan layanan perawatan</Text>
        {lansia.length === 0
          ? <View style={s.emptyState}><Text style={{ fontSize: 36 }}>👴</Text><Text style={s.emptyTitle}>Belum ada data lansia</Text><Text style={s.emptySub}>Tambah lansia di tab Lansia terlebih dahulu</Text></View>
          : lansia.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[s.selectCard, booking.care_receiver_id === l.id && s.selectCardActive]}
              onPress={() => setBooking(p => ({ ...p, care_receiver_id: l.id, care_receiver_name: l.full_name }))}
              activeOpacity={0.8}
            >
              <View style={[s.miniAvatar]}><Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>{getInitials(l.full_name)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.selectName}>{l.full_name}</Text>
                <Text style={s.selectMeta}>{l.gender === 'Laki-laki' ? '👴' : '👵'} {l.gender || '-'}  •  {l.age ? l.age + ' thn' : '-'}</Text>
              </View>
              <View style={[s.checkCircle, booking.care_receiver_id === l.id && s.checkCircleActive]}>
                {booking.care_receiver_id === l.id && <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    )

    if (step === 1) return (
      <ScrollView contentContainerStyle={{ gap: Spacing.sm }}>
        <Text style={s.stepDesc}>Tentukan jenis layanan perawatan yang dibutuhkan</Text>
        {LAYANAN.map(l => (
          <TouchableOpacity
            key={l.id}
            style={[s.selectCard, booking.service_type === l.id && s.selectCardActive]}
            onPress={() => setBooking(p => ({ ...p, service_type: l.id }))}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 28 }}>{l.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.selectName}>{l.id}</Text>
              <Text style={s.selectMeta}>{l.desc}</Text>
            </View>
            <View style={[s.checkCircle, booking.service_type === l.id && s.checkCircleActive]}>
              {booking.service_type === l.id && <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )

    if (step === 2) return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Spacing.md }}>
        <Text style={s.stepDesc}>Pilih tanggal dan waktu layanan perawatan</Text>
        {[
          { label: 'Tanggal (YYYY-MM-DD)', key: 'booking_date', placeholder: new Date().toISOString().split('T')[0], icon: '📅', keyboardType: 'default' },
          { label: 'Waktu Mulai (HH:MM)', key: 'time_start', placeholder: '08:00', icon: '⏰', keyboardType: 'default' },
          { label: 'Waktu Selesai (HH:MM)', key: 'time_end', placeholder: '12:00', icon: '⏰', keyboardType: 'default' },
        ].map(f => (
          <View key={f.key} style={s.inputGroup}>
            <Text style={s.label}>{f.label}</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>{f.icon}</Text>
              <TextInput
                style={s.input} value={booking[f.key]} onChangeText={v => setBooking(p => ({ ...p, [f.key]: v }))}
                placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                keyboardType={f.keyboardType}
              />
            </View>
          </View>
        ))}
        <View style={s.inputGroup}>
          <Text style={s.label}>Catatan Tambahan (Opsional)</Text>
          <View style={[s.inputRow, { alignItems: 'flex-start', paddingTop: 12 }]}>
            <Text style={[s.inputIcon, { marginTop: 2 }]}>📝</Text>
            <TextInput
              style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={booking.notes} onChangeText={v => setBooking(p => ({ ...p, notes: v }))}
              placeholder="Instruksi khusus, kondisi terkini..." placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>
        </View>
      </ScrollView>
    )

    if (step === 3) return (
      <ScrollView>
        <Text style={s.stepDesc}>Periksa kembali detail pemesanan sebelum mengirim</Text>
        <View style={s.confirmBox}>
          {[
            ['👴 Lansia',       booking.care_receiver_name],
            ['🏥 Layanan',      `${LAYANAN.find(l => l.id === booking.service_type)?.icon || ''} ${booking.service_type}`],
            ['📅 Tanggal',      booking.booking_date],
            ['⏰ Waktu',        `${booking.time_start} – ${booking.time_end}`],
            booking.notes && ['📝 Catatan', booking.notes],
          ].filter(Boolean).map(([label, value], i) => (
            <View key={i} style={[s.confirmRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Text style={s.confirmLabel}>{label}</Text>
              <Text style={s.confirmValue}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={s.warningBox}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.warning }}>⏳ Proses Persetujuan</Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4, lineHeight: 16 }}>
            Pemesanan akan berstatus Menunggu dan perlu disetujui oleh Admin sebelum terkonfirmasi.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (loading) return <View style={s.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Topbar */}
      <View style={s.topbar}>
        <Text style={s.pageTitle}>📋 Pemesanan</Text>
      </View>

      {/* Tab Switch */}
      <View style={s.tabBar}>
        {[['list', '📋 Daftar'], ['new', '➕ Buat Baru']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]}
            onPress={() => { setTab(key); if (key === 'new') { setStep(0) } }}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'list' ? (
        <FlatList
          data={bookings}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings() }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={s.emptyTitle}>Belum ada pemesanan</Text>
              <Text style={s.emptySub}>Ketuk "+ Buat Baru" untuk membuat pemesanan</Text>
            </View>
          }
          renderItem={renderBookingItem}
        />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Step Indicator */}
          <View style={s.stepIndicator}>
            {STEPS.map((label, i) => (
              <View key={i} style={[s.stepItemWrap, { flex: 1 }]}>
                <View style={[s.stepCircle, i === step && s.stepCircleActive, i < step && s.stepCircleDone]}>
                  <Text style={[s.stepNum, (i === step || i < step) && { color: 'white' }]}>{i < step ? '✓' : i + 1}</Text>
                </View>
                <Text style={[s.stepLabel, i === step && { color: Colors.primaryLight }, i < step && { color: Colors.success }]} numberOfLines={1}>{label}</Text>
                {i < STEPS.length - 1 && <View style={[s.stepLine, i < step && { backgroundColor: Colors.success }]} />}
              </View>
            ))}
          </View>

          <View style={{ flex: 1, padding: Spacing.md }}>
            <Text style={s.stepTitle}>{['👴 Pilih Lansia', '🏥 Pilih Layanan', '📅 Tentukan Jadwal', '✅ Konfirmasi'][step]}</Text>
            <View style={{ flex: 1, marginTop: Spacing.sm }}>
              {renderStep()}
            </View>
            {/* Nav Buttons */}
            <View style={s.navBtns}>
              {step > 0 && (
                <TouchableOpacity style={s.btnSecondary} onPress={() => setStep(s => s - 1)}>
                  <Text style={s.btnSecondaryText}>← Sebelumnya</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {step < 3
                ? <TouchableOpacity style={s.btnPrimary} onPress={handleNext}><Text style={s.btnPrimaryText}>Selanjutnya →</Text></TouchableOpacity>
                : <TouchableOpacity style={[s.btnPrimary, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="white" /> : <Text style={s.btnPrimaryText}>🚀 Kirim Pemesanan</Text>}
                  </TouchableOpacity>
              }
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  loading:  { flex: 1, backgroundColor: Colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  topbar:   { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgSurface },
  pageTitle:{ fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },

  tabBar: { flexDirection: 'row', margin: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tab:    { flex: 1, paddingVertical: 9, borderRadius: Radius.sm, alignItems: 'center' },
  tabActive:    { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, elevation: 6 },
  tabText:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive:{ color: 'white' },

  bookingCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  dateBadge:   { width: 46, height: 46, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  dateDay:     { fontSize: FontSize.lg, fontWeight: '800', color: 'white', lineHeight: 22 },
  dateMonth:   { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase' },
  bookingName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  bookingDetail:{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  bookingBy:   { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  bookingActions:{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, backgroundColor: 'transparent' },

  stepIndicator: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 0 },
  stepItemWrap:  { alignItems: 'center', position: 'relative' },
  stepCircle:    { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepCircleActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepCircleDone:  { backgroundColor: Colors.success, borderColor: Colors.success },
  stepNum:    { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  stepLabel:  { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  stepLine:   { position: 'absolute', top: 15, left: '60%', right: '-40%', height: 2, backgroundColor: Colors.border, zIndex: 0 },
  stepTitle:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  stepDesc:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

  selectCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bgSurface },
  selectCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(79,70,229,0.08)' },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  selectName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  selectMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  checkCircle:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },

  inputGroup: { marginBottom: 0 },
  label:      { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon:  { fontSize: 16, marginRight: Spacing.sm },
  input:      { flex: 1, paddingVertical: 13, color: Colors.textPrimary, fontSize: FontSize.md },

  confirmBox: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.md },
  confirmRow: { padding: Spacing.md },
  confirmLabel:{ fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  confirmValue:{ fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  warningBox: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },

  navBtns:        { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
  btnPrimary:     { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13, paddingHorizontal: Spacing.lg, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, elevation: 6 },
  btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: FontSize.sm },
  btnSecondary:   { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 13, paddingHorizontal: Spacing.lg, alignItems: 'center', backgroundColor: Colors.bgCard },
  btnSecondaryText:{ color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },

  emptyState: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
})
