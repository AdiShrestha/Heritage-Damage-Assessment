import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AssessScreen from './src/screens/AssessScreen';
import CompareScreen from './src/screens/CompareScreen';
import BatchScreen from './src/screens/BatchScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import AboutScreen from './src/screens/AboutScreen';
import { useHealth } from './src/hooks/useHealth';
import { THEME } from './src/constants';

const Tab = createBottomTabNavigator();

function getStatusColor(status) {
  if (status === 'ok') return THEME.success;
  if (status === 'degraded') return THEME.warning;
  if (status === 'error') return THEME.danger;
  return THEME.textMuted;
}

function getStatusLabel(status) {
  if (status === 'ok') return 'Online';
  if (status === 'degraded') return 'Degraded';
  if (status === 'error') return 'Offline';
  return 'Checking';
}

function HealthDot({ status }) {
  return (
    <View style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: getStatusColor(status),
    }} />
  );
}

function PagodaIcon() {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
    }}>
      <Ionicons name="layers" size={20} color={THEME.goldLight} />
      <Text style={{
        marginLeft: 6,
        fontSize: 10,
        fontWeight: '600',
        color: THEME.goldLight,
        letterSpacing: 0.5,
        opacity: 0.7,
      }}>
        ༄
      </Text>
    </View>
  );
}

function AppContent() {
  const { status } = useHealth();
  const [toastConfig] = useState({
    success: (internal) => (
      <View style={{
        backgroundColor: THEME.text,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: THEME.success,
      }}>
        <Text style={{ color: THEME.surface, fontSize: 14 }}>{internal.text1}</Text>
      </View>
    ),
    error: (internal) => (
      <View style={{
        backgroundColor: THEME.primaryDark,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: THEME.danger,
      }}>
        <Text style={{ color: THEME.surface, fontSize: 14 }}>{internal.text1}</Text>
      </View>
    ),
  });

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Assess') {
                iconName = focused ? 'camera' : 'camera-outline';
              } else if (route.name === 'Compare') {
                iconName = focused ? 'git-compare' : 'git-compare-outline';
              } else if (route.name === 'Batch') {
                iconName = focused ? 'layers' : 'layers-outline';
              } else if (route.name === 'Models') {
                iconName = focused ? 'cube' : 'cube-outline';
              } else {
                iconName = focused ? 'information-circle' : 'information-circle-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: THEME.primary,
            tabBarInactiveTintColor: THEME.stone,
            tabBarStyle: {
              backgroundColor: THEME.surface,
              borderTopColor: THEME.borderLight,
              borderTopWidth: 1,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
              paddingTop: 8,
              height: Platform.OS === 'ios' ? 85 : 65,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 4,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: THEME.text,
            },
            headerTintColor: THEME.surface,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 17,
            },
            headerTitleAlign: 'left',
            headerLeft: () => <PagodaIcon />,
            headerRight: () => (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginRight: 16,
              }}>
                <HealthDot status={status} />
                <Text style={{ color: THEME.surface, fontSize: 12, opacity: 0.85 }}>
                  {getStatusLabel(status)}
                </Text>
              </View>
            ),
          })}
        >
          <Tab.Screen name="Assess" component={AssessScreen} options={{ title: 'Assess' }} />
          <Tab.Screen name="Compare" component={CompareScreen} options={{ title: 'Compare' }} />
          <Tab.Screen name="Batch" component={BatchScreen} options={{ title: 'Batch' }} />
          <Tab.Screen name="Models" component={ModelsScreen} options={{ title: 'Models' }} />
          <Tab.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
        </Tab.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
