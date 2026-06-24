import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, ActivityIndicator, View } from 'react-native'

import { useAuth } from '../context/AuthContext'
import { Colors } from '../theme/colors'

// Auth Screens
import LoginScreen    from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'

// Main Screens
import HomeScreen    from '../screens/main/HomeScreen'
import LansiaScreen  from '../screens/main/LansiaScreen'
import BookingScreen from '../screens/main/BookingScreen'
import ProfileScreen from '../screens/main/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

function TabIcon({ name, focused }) {
  const icons = {
    Dashboard: focused ? '🏠' : '🏠',
    Lansia:    focused ? '👴' : '👴',
    Pemesanan: focused ? '📋' : '📋',
    Profil:    focused ? '👤' : '👤',
  }
  return <Text style={{ fontSize: 22 }}>{icons[name] || '●'}</Text>
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Lansia"    component={LansiaScreen} />
      <Tab.Screen name="Pemesanan" component={BookingScreen} />
      <Tab.Screen name="Profil"    component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgBase, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 48 }}>💞</Text>
        <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Care-Giver Sync</Text>
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 16 }} />
        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Memeriksa sesi...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}
