/**
 * MentorHub Mobile — edição Expo Snack.
 *
 * Entrada única App.js (o Snack não suporta expo-router): navegação via React
 * Navigation com bottom-tabs + native-stack, mesma identidade visual e
 * mesmas telas da versão local (mobile-app/).
 *
 * Estrutura:
 *   SafeAreaProvider → AuthProvider → gate de sessão
 *     - loading       → splash
 *     - anonymous     → LoginScreen (com campo "Servidor da API")
 *     - authenticated → NavigationContainer
 *         RootStack (headerShown: false)
 *           ├─ Main (BottomTabs): Início · Livros · Cursos · Mentorias · Perfil
 *           ├─ Livro  (params: { id })
 *           ├─ Curso  (params: { id })
 *           └─ Mentor (params: { id })
 */
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./src/lib/auth";
import { theme } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LivrosScreen from "./src/screens/LivrosScreen";
import CursosScreen from "./src/screens/CursosScreen";
import MentoriasScreen from "./src/screens/MentoriasScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import LivroScreen from "./src/screens/LivroScreen";
import CursoScreen from "./src/screens/CursoScreen";
import MentorScreen from "./src/screens/MentorScreen";

/* ----------------------------- Tema de navegação ---------------------------- */

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.accent,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.accent,
  },
};

/* --------------------------------- Splash ----------------------------------- */

function Splash() {
  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <Text style={styles.splashLogo}>
        Mentor<Text style={styles.splashAccent}>Hub</Text>
      </Text>
      <ActivityIndicator color={theme.colors.accent} style={styles.splashSpinner} />
    </View>
  );
}

/* ---------------------------------- Abas ------------------------------------ */

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Livros"
        component={LivrosScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Cursos"
        component={CursosScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="play-circle-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Mentorias"
        component={MentoriasScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

/* ------------------------------ Stack principal ----------------------------- */

const Stack = createNativeStackNavigator();

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Livro" component={LivroScreen} />
      <Stack.Screen name="Curso" component={CursoScreen} />
      <Stack.Screen name="Mentor" component={MentorScreen} />
    </Stack.Navigator>
  );
}

/* ------------------------------ Gate de sessão ------------------------------ */

function Root() {
  const { status } = useAuth();

  if (status === "loading") return <Splash />;
  if (status !== "authenticated") return <LoginScreen />;

  return (
    <NavigationContainer theme={NavTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

/* ---------------------------------- App ------------------------------------- */

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/* --------------------------------- Estilos ---------------------------------- */

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogo: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  splashAccent: { color: theme.colors.accent },
  splashSpinner: { marginTop: 18 },
});
