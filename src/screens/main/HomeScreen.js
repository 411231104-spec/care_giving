import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Colors, Spacing, Radius, FontSize } from '../../theme/colors'

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={s.statIcon}>{icon}</Text>
      <View>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={[s.statValue, { color }]}>{value ?? '-'}</Text>
      </View>
    </View>
  )
}

function BookingItem({ item }) {
  const statusColor = {
    pending: Colors.warning, approved: Colors.success,
    rejected: Colors.danger, cancelled: Colors.textMuted,
  }
  const statusLabel = {
    pending: 'Menunggu', approved: 'Disetujui',
    rejected: 'Ditolak', cancelled: 'Dibatalkan',
  }
  const d = new Date(item.booking_date)
  const day   = d.getDate()
  const month = d.toLocaleString('id-ID', { month: 'short' })

  return (
    <View style={s.bookingItem}>
      <View style={s.dateBadge}>
        <Text style={s.dateDay}>{day}</Text>
        <Text style={s.dateMonth}>{month}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.bookingName}>{item.care_receivers?.full_name || '-'}</Text>
        <Text style={s.bookingDetail}>
          {item.time_start?.substring(0, 5)} – {item.time_end?.substring(0, 5)}  •  {item.service_type}
        </Text>
      </View>
      <View style={[s.statusBadge, { backgroundColor: statusColor[item.status] + '22', borderColor: statusColor[item.status] + '55' }]}>
        <Text style={[s.statusText, { color: statusColor[item.status] }]}>
          {statusLabel[item.status]}
        </Text>
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const { user, profile } = useAuth()
  const [stats, setStats]           = useState({})
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam'

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [
        { count: totalLansia },
        { count: pendingBookings },
        { count: todaySchedules },
        { data: todayBookingsData }
      ] = await Promise.all([
        supabase.from('care_receivers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('schedules').select('*', { count: 'exact', head: true })
          .gte('shift_start', today).lt('shift_start', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
        supabase.from('bookings')
          .select('*, care_receivers(full_name)')
          .eq('booking_date', today)
          .order('time_start')
          .limit(5)
      ])
      setStats({ totalLansia, pendingBookings, todaySchedules })
      setBookings(todayBookingsData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    // Realtime subscription
    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadData])

  if (loading) return (
    <View style={s.loadingContainer}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  )

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{profile?.full_name || 'Pengguna'}</Text>
            <View style={[s.roleBadge, { backgroundColor: profile?.role === 'admin' ? Colors.primary + '22' : Colors.success + '22' }]}>
              <Text style={[s.roleText, { color: profile?.role === 'admin' ? Colors.primaryLight : Colors.success }]}>
                {profile?.role === 'admin' ? '👨‍💼 Administrator' : '👨‍👩‍👧 Keluarga'}
              </Text>
            </View>
          </View>
          <Text style={s.appLogo}>💞</Text>
        </View>

        {/* Stat Cards */}
        <View style={s.statsGrid}>
          <StatCard icon="👴" label="Total Lansia"      value={stats.totalLansia}    color={Colors.primary} />
          <StatCard icon="📋" label="Booking Pending"   value={stats.pendingBookings} color={Colors.warning} />
          <StatCard icon="📅" label="Jadwal Hari Ini"   value={stats.todaySchedules} color={Colors.success} />
        </View>

        {/* Booking Hari Ini */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📋 Booking Hari Ini</Text>
            <View style={s.liveIndicator}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live</Text>
            </View>
          </View>
          {bookings.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>Tidak ada booking hari ini</Text>
              <Text style={s.emptySub}>Buat pemesanan baru di tab Pemesanan</Text>
            </View>
          ) : (
            bookings.map(b => <BookingItem key={b.id} item={b} />)
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  scroll:   { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bgBase, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  greeting: { fontSize: FontSize.sm, color: Colors.textMuted },
  userName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  roleText:  { fontSize: FontSize.xs, fontWeight: '700' },
  appLogo:   { fontSize: 44 },

  statsGrid: { padding: Spacing.md, gap: Spacing.sm },
  statCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  statIcon:  { fontSize: 28 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', lineHeight: 32 },

  section:       { padding: Spacing.md, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot:       { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.success },
  liveText:      { fontSize: FontSize.xs, color: Colors.success, fontWeight: '700' },

  bookingItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  dateBadge:   { width: 46, height: 46, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  dateDay:     { fontSize: FontSize.lg, fontWeight: '800', color: 'white', lineHeight: 22 },
  dateMonth:   { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase' },
  bookingName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  bookingDetail:{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText:  { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyIcon:  { fontSize: 40, opacity: 0.5 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
})
