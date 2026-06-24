import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert, ActivityIndicator,
  RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Colors, Spacing, Radius, FontSize } from '../../theme/colors'

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function Avatar({ name, size = 44 }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: 'white', fontWeight: '800', fontSize: size * 0.35 }}>{getInitials(name)}</Text>
    </View>
  )
}

function LansiaCard({ item, onEdit, onDelete, onBooking }) {
  const statusColor = item.is_active ? Colors.success : Colors.textMuted
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Avatar name={item.full_name} size={52} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={s.cardName}>{item.full_name}</Text>
          <Text style={s.cardMeta}>
            {item.gender === 'Laki-laki' ? '👴' : '👵'} {item.gender || '-'}  •  🎂 {item.age ? item.age + ' tahun' : '-'}
          </Text>
          <View style={[s.activeBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[s.activeDot, { backgroundColor: statusColor }]} />
            <Text style={[s.activeText, { color: statusColor }]}>{item.is_active ? 'Aktif' : 'Tidak Aktif'}</Text>
          </View>
        </View>
      </View>

      {item.address ? (
        <View style={s.infoRow}><Text style={s.infoIcon}>📍</Text><Text style={s.infoText}>{item.address}</Text></View>
      ) : null}

      {item.medical_notes ? (
        <View style={s.medicalBox}>
          <Text style={s.medicalLabel}>🏥 CATATAN MEDIS</Text>
          <Text style={s.medicalText} numberOfLines={2}>{item.medical_notes}</Text>
        </View>
      ) : null}

      <View style={s.cardActions}>
        <TouchableOpacity style={s.btnBook} onPress={onBooking} activeOpacity={0.8}>
          <Text style={s.btnBookText}>📋 Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnEdit} onPress={onEdit} activeOpacity={0.8}>
          <Text style={s.btnIconText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnDel} onPress={onDelete} activeOpacity={0.8}>
          <Text style={s.btnIconText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const EMPTY_FORM = { full_name: '', age: '', gender: '', address: '', medical_notes: '', is_active: true }

export default function LansiaScreen({ navigation }) {
  const { user } = useAuth()
  const [data,       setData]       = useState([])
  const [filtered,   setFiltered]   = useState([])
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)

  const loadData = useCallback(async () => {
    const { data: rows } = await supabase
      .from('care_receivers')
      .select('*')
      .order('created_at', { ascending: false })
    setData(rows || [])
    setFiltered(rows || [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!search.trim()) { setFiltered(data); return }
    const q = search.toLowerCase()
    setFiltered(data.filter(l =>
      l.full_name.toLowerCase().includes(q) ||
      l.address?.toLowerCase().includes(q) ||
      l.medical_notes?.toLowerCase().includes(q)
    ))
  }, [search, data])

  function openAdd()    { setEditId(null); setForm(EMPTY_FORM); setModalOpen(true) }
  function openEdit(l)  { setEditId(l.id); setForm({ full_name: l.full_name, age: String(l.age || ''), gender: l.gender || '', address: l.address || '', medical_notes: l.medical_notes || '', is_active: l.is_active }); setModalOpen(true) }
  function closeModal() { setModalOpen(false) }

  async function handleSave() {
    if (!form.full_name.trim()) return Alert.alert('Perhatian', 'Nama lengkap wajib diisi')
    setSaving(true)
    const payload = {
      full_name:     form.full_name.trim(),
      age:           parseInt(form.age) || null,
      gender:        form.gender || null,
      address:       form.address.trim() || null,
      medical_notes: form.medical_notes.trim() || null,
      is_active:     form.is_active,
    }
    try {
      if (editId) {
        const { error } = await supabase.from('care_receivers').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('care_receivers').insert({ ...payload, created_by: user.id })
        if (error) throw error
      }
      closeModal()
      await loadData()
      Alert.alert('Berhasil', editId ? 'Data lansia diperbarui ✅' : 'Lansia baru berhasil ditambahkan ✅')
    } catch (e) {
      Alert.alert('Gagal', e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    Alert.alert('Hapus Lansia', `Hapus data "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('care_receivers').delete().eq('id', id)
          if (error) Alert.alert('Gagal', error.message)
          else await loadData()
        }
      }
    ])
  }

  if (loading) return <View style={s.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Topbar */}
      <View style={s.topbar}>
        <View>
          <Text style={s.pageTitle}>👴 Data Lansia</Text>
          <Text style={s.pageCount}>{filtered.length} terdaftar</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Text style={s.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder="Cari nama, alamat, catatan medis..."
          placeholderTextColor={Colors.textMuted}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: Colors.textMuted }}>✕</Text></TouchableOpacity> : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: Spacing.md, paddingTop: 0, gap: Spacing.sm, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={{ fontSize: 40 }}>👴</Text>
            <Text style={s.emptyTitle}>{search ? 'Tidak ditemukan' : 'Belum ada data lansia'}</Text>
            <Text style={s.emptySub}>{search ? 'Coba kata kunci lain' : 'Ketuk "+ Tambah" untuk menambahkan'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <LansiaCard
            item={item}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item.id, item.full_name)}
            onBooking={() => Alert.alert('Info', 'Buka tab Pemesanan untuk membuat booking')}
          />
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgBase }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editId ? '✏️ Edit Lansia' : '➕ Tambah Lansia'}</Text>
              <TouchableOpacity onPress={closeModal} style={s.closeBtn}><Text style={s.closeText}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.lg }} keyboardShouldPersistTaps="handled">

              {[
                { label: 'Nama Lengkap *', key: 'full_name', placeholder: 'Masukkan nama lengkap', icon: '👤' },
                { label: 'Usia (Tahun)',   key: 'age',       placeholder: 'contoh: 75',            icon: '🎂', keyboardType: 'numeric' },
                { label: 'Alamat',         key: 'address',   placeholder: 'Alamat lengkap',         icon: '📍', multiline: true },
                { label: 'Catatan Medis',  key: 'medical_notes', placeholder: 'Kondisi, alergi, obat...', icon: '🏥', multiline: true },
              ].map(f => (
                <View key={f.key} style={s.inputGroup}>
                  <Text style={s.label}>{f.label}</Text>
                  <View style={[s.inputRow, f.multiline && { alignItems: 'flex-start', paddingTop: 12 }]}>
                    <Text style={[s.inputIcon, f.multiline && { marginTop: 2 }]}>{f.icon}</Text>
                    <TextInput
                      style={[s.input, f.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
                      value={form[f.key]}
                      onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={f.keyboardType || 'default'}
                      multiline={f.multiline}
                    />
                  </View>
                </View>
              ))}

              {/* Gender */}
              <View style={s.inputGroup}>
                <Text style={s.label}>Jenis Kelamin</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {['Laki-laki', 'Perempuan'].map(g => (
                    <TouchableOpacity
                      key={g} style={[s.genderBtn, form.gender === g && s.genderBtnActive]}
                      onPress={() => setForm(p => ({ ...p, gender: g }))}
                    >
                      <Text style={{ fontSize: 18 }}>{g === 'Laki-laki' ? '👴' : '👵'}</Text>
                      <Text style={[s.genderText, form.gender === g && { color: Colors.primaryLight }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Aktif */}
              <View style={s.inputGroup}>
                <Text style={s.label}>Status</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {[true, false].map(v => (
                    <TouchableOpacity
                      key={String(v)} style={[s.genderBtn, form.is_active === v && s.genderBtnActive]}
                      onPress={() => setForm(p => ({ ...p, is_active: v }))}
                    >
                      <Text style={[s.genderText, form.is_active === v && { color: Colors.primaryLight }]}>{v ? '✅ Aktif' : '❌ Tidak Aktif'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={s.saveBtnText}>💾 Simpan Data</Text>}
              </TouchableOpacity>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bgBase },
  loading:  { flex: 1, backgroundColor: Colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  topbar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgSurface },
  pageTitle:{ fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  pageCount:{ fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  addBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 9, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, elevation: 6 },
  addBtnText:{ color: 'white', fontWeight: '700', fontSize: FontSize.sm },
  searchWrap:{ flexDirection: 'row', alignItems: 'center', margin: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchIcon:{ fontSize: 16, marginRight: Spacing.sm },
  searchInput:{ flex: 1, paddingVertical: 11, color: Colors.textPrimary, fontSize: FontSize.sm },

  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  cardName:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardMeta:  { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3 },
  activeBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  activeDot:  { width: 6, height: 6, borderRadius: 99 },
  activeText: { fontSize: 10, fontWeight: '700' },
  infoRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: Spacing.sm },
  infoIcon:   { fontSize: 12 },
  infoText:   { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  medicalBox: { marginTop: Spacing.sm, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.danger },
  medicalLabel:{ fontSize: 9, fontWeight: '800', color: Colors.danger, letterSpacing: 0.5 },
  medicalText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  btnBook:  { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingVertical: 9, alignItems: 'center' },
  btnBookText:{ color: 'white', fontWeight: '700', fontSize: FontSize.xs },
  btnEdit:  { width: 38, height: 38, backgroundColor: Colors.bgSurface, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  btnDel:   { width: 38, height: 38, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  btnIconText:{ fontSize: 16 },
  emptyState: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  emptySub:   { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  modalHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  closeBtn:   { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.bgHover, alignItems: 'center', justifyContent: 'center' },
  closeText:  { color: Colors.textSecondary, fontSize: 16 },
  inputGroup: { marginBottom: Spacing.md },
  label:      { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon:  { fontSize: 16, marginRight: Spacing.sm },
  input:      { flex: 1, paddingVertical: 13, color: Colors.textPrimary, fontSize: FontSize.md },
  genderBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bgSurface },
  genderBtnActive:{ borderColor: Colors.primary, backgroundColor: 'rgba(79,70,229,0.1)' },
  genderText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  saveBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.md, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, elevation: 8 },
  saveBtnText:{ color: 'white', fontSize: FontSize.md, fontWeight: '700' },
})
