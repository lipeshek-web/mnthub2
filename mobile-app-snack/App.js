/**
 * MentorHub Mobile — edição Expo Snack.
 *
 * Entrada única App.js: navegação via React Navigation com stack JS
 * (@react-navigation/stack) — a navegação nativa de stack não resolve no
 * runtime do Snack; mesma identidade visual e mesmas telas da versão local.
 *
 * As 5 abas principais (Início · Livros · Cursos · Mentorias · Perfil) NÃO usam
 * mais bottom-tabs: são páginas de um pager horizontal (ScrollView pagingEnabled)
 * com tab bar custom, sincronizadas pelo TabsContext (src/lib/tabs.tsx) — dá para
 * deslizar entre as abas com o dedo ou tocar na tab bar. O estado da aba ativa
 * vive no Root, ACIMA do NavigationContainer, para que telas do stack também
 * consigam trocar de aba (useTabs().setTab) antes de desempilhar.
 *
 * Estrutura:
 *   SafeAreaProvider
 *     └─ ThemeProvider (modo Claro/Escuro persistido em SecureStore)
 *         └─ AuthProvider → gate de sessão
 *             - loading       → splash
 *             - anonymous     → LoginScreen (com campo "Servidor da API")
 *             - authenticated → TabsContext.Provider
 *                 └─ NavigationContainer
 *                     RootStack (headerShown: false)
 *                       ├─ Main (pager horizontal + tab bar custom): Início ·
 *                       │   Livros · Cursos · Mentorias
 *                       ├─ Livro  (params: { id })
 *                       ├─ Curso  (params: { id })
 *                       ├─ Mentor (params: { id })
 *                       ├─ Perfil (aberto pelo ícone da conta na Home)
 *                       ├─ Busca  (busca global: cursos + livros + mentores)
 *                       └─ Salvos (favoritos locais do aparelho)
 *
 * Ao trocar de tema, a árvore de navegação é remontada com key={mode}: como os
 * componentes criam os estilos com factories (makeStyles) a cada montagem, toda
 * a interface recalcula as cores da paleta nova.
 */
import "react-native-gesture-handler";
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

/* ------------------- Polyfill de Alert.alert para a web -------------------- */
/* No react-native-web Alert.alert é um no-op — botões como "Sair da conta"   */
/* ou avisos de inscrição simplesmente não fazem nada no preview do Snack.    */
/* No web mapeamos para confirm()/alert() do navegador (o app no Expo Go /    */
/* aparelho continua usando o Alert nativo, sem mudança alguma).              */
if (Platform.OS === "web") {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join("\n\n");
    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }
    const confirmButton = buttons.find((b) => b && b.style !== "cancel");
    const cancelButton = buttons.find((b) => b && b.style === "cancel");
    if (window.confirm(text)) {
      if (confirmButton && typeof confirmButton.onPress === "function") confirmButton.onPress();
    } else if (cancelButton && typeof cancelButton.onPress === "function") {
      cancelButton.onPress();
    }
  };
}
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { DefaultTheme, NavigationContainer, useRoute } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./src/lib/auth";
import { ThemeProvider, useThemeMode } from "./src/lib/theme";
import { TabsContext, useTabs, isTabName } from "./src/lib/tabs";
import { unreadStore } from "./src/lib/unread";
import { theme } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LivrosScreen from "./src/screens/LivrosScreen";
import CursosScreen from "./src/screens/CursosScreen";
import MentoriasScreen from "./src/screens/MentoriasScreen";
import MensagensScreen from "./src/screens/MensagensScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import LivroScreen from "./src/screens/LivroScreen";
import CursoScreen from "./src/screens/CursoScreen";
import MentorScreen from "./src/screens/MentorScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import ChatScreen from "./src/screens/ChatScreen";
import BuscaScreen from "./src/screens/BuscaScreen";
import SalvosScreen from "./src/screens/SalvosScreen";

/* ----------------------------- Tema de navegação ---------------------------- */

/** Tema do NavigationContainer derivado do modo atual (recalculado por render). */
function makeNavTheme(mode) {
  return {
    ...DefaultTheme,
    dark: mode === "dark",
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
}

/* --------------------------------- Splash ----------------------------------- */

function Splash() {
  const styles = makeStyles();
  return (
    <View style={styles.splash}>
      <Text style={styles.splashLogo}>
        Mentor<Text style={styles.splashAccent}>Hub</Text>
      </Text>
      <ActivityIndicator color={theme.colors.accent} style={styles.splashSpinner} />
    </View>
  );
}

/* ------------------------------ Abas (pager) -------------------------------- */

/** Itens da tab bar — 5 abas; o Perfil fica no stack (ícone da conta na Home). */
const TABS = [
  { name: "Início", icon: "home-outline", Component: HomeScreen },
  { name: "Livros", icon: "book-outline", Component: LivrosScreen },
  { name: "Cursos", icon: "play-circle-outline", Component: CursosScreen },
  { name: "Mentorias", icon: "videocam-outline", Component: MentoriasScreen },
  { name: "Mensagens", icon: "chatbubbles-outline", Component: MensagensScreen },
];

function MainTabs() {
  const styles = makeStyles();
  const insets = useSafeAreaInsets();
  const { width, height: windowHeight } = useWindowDimensions();
  const route = useRoute();
  const { tab, setTab } = useTabs();
  const unread = useSyncExternalStore(unreadStore.subscribe, unreadStore.get);

  const scrollRef = useRef(null);
  // Lazy: cada tela só monta na primeira visita (e depois fica montada).
  const [visited, setVisited] = useState(() => new Set(["Início"]));
  // Altura real da área das páginas (viewport do pager, sem a tab bar).
  const [pagerHeight, setPagerHeight] = useState(windowHeight);

  // Garante que a aba ativa esteja sempre montada (lazy mount por aba).
  useEffect(() => {
    setVisited((prev) => (prev.has(tab) ? prev : new Set([...prev, tab])));
  }, [tab]);

  // Deep-link via params do stack: navigate("Main", { screen: "Mentorias" }).
  useEffect(() => {
    const target = route.params?.screen;
    if (target) setTab(target);
  }, [route.params, setTab]);

  // Aba ativa → rola o pager até a página (toque na tab bar ou setTab externo).
  useEffect(() => {
    const index = TABS.findIndex((item) => item.name === tab);
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: index * width, animated: true });
    }
  }, [tab, width]);

  // Durante o deslizamento, já marca a página visível como visitada (lazy mount).
  const handleScroll = useCallback(
    (event) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      const name = TABS[index]?.name;
      if (name) {
        setVisited((prev) => (prev.has(name) ? prev : new Set([...prev, name])));
      }
    },
    [width]
  );

  // Fim do deslizamento manual → sincroniza a aba ativa com a página visível.
  const handleMomentumEnd = useCallback(
    (event) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      const next = TABS[index];
      if (next) setTab(next.name);
    },
    [width, setTab]
  );

  return (
    <View style={styles.mainFlex}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setPagerHeight(event.nativeEvent.layout.height)}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {TABS.map(({ name, Component }) => (
          <View key={name} style={[styles.page, { width, height: pagerHeight }]}>
            {visited.has(name) ? <Component /> : null}
          </View>
        ))}
      </ScrollView>

      {/* Tab bar custom — mesmo visual do bottom-tabs anterior */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map(({ name, icon }) => {
          const active = tab === name;
          return (
            <TouchableOpacity
              key={name}
              style={styles.tabItem}
              onPress={() => setTab(name)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={name}
            >
              <View>
                <Ionicons
                  name={icon}
                  size={24}
                  color={active ? theme.colors.accent : theme.colors.textFaint}
                />
                {name === "Mensagens" && unread > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{unread > 9 ? "9+" : unread}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? theme.colors.accent : theme.colors.textFaint },
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------ Stack principal ----------------------------- */

const Stack = createStackNavigator();

function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Fundo do tema também na animação de transição (sem flash branco).
        cardStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Livro" component={LivroScreen} />
      <Stack.Screen name="Curso" component={CursoScreen} />
      <Stack.Screen name="Mentor" component={MentorScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Perfil" component={PerfilScreen} />
      <Stack.Screen name="Busca" component={BuscaScreen} />
      <Stack.Screen name="Salvos" component={SalvosScreen} />
    </Stack.Navigator>
  );
}

/* ------------------------------ Gate de sessão ------------------------------ */

function Root() {
  const { status } = useAuth();
  const { mode } = useThemeMode();

  // Estado da aba ativa vive aqui (acima do NavigationContainer) para que as
  // telas do stack (Livro/Curso/Mentor) também possam trocar de aba via useTabs.
  const [tab, setTabState] = useState("Início");
  const setTab = useCallback((next) => {
    if (isTabName(next)) setTabState(next);
  }, []);
  const tabsValue = useMemo(() => ({ tab, setTab }), [tab, setTab]);

  if (status === "loading") return <Splash />;
  if (status !== "authenticated") return <LoginScreen />;

  // key={mode} remonta o navegador inteiro ao trocar de tema — os estilos
  // (makeStyles) recalculam com a paleta nova; o estado de navegação fica no
  // NavigationContainer, que NÃO é remontado (aba/route atuais são mantidas).
  return (
    <NavigationContainer theme={makeNavTheme(mode)}>
      <TabsContext.Provider value={tabsValue}>
        <View key={mode} style={{ flex: 1 }}>
          <RootNavigator />
        </View>
      </TabsContext.Provider>
    </NavigationContainer>
  );
}

/* --------------------------- Barra de status ------------------------------- */

function ThemedStatusBar() {
  const { mode } = useThemeMode();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

/* ---------------------------------- App ------------------------------------- */

export default function App() {
  return (
    <SafeAreaProvider style={{ height: "100%", width: "100%", overflow: "hidden" }}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/* --------------------------------- Estilos ---------------------------------- */

const makeStyles = () =>
  StyleSheet.create({
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

    /* Pager de abas */
    mainFlex: { flex: 1, backgroundColor: theme.colors.bg },
    flex: { flex: 1 },
    page: { backgroundColor: theme.colors.bg },

    /* Tab bar custom */
    tabBar: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      paddingTop: 7,
      minHeight: 50,
    },
    tabLabel: { fontSize: 11, fontWeight: "600" },
    tabBadge: {
      position: "absolute",
      top: -4,
      right: -8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.danger,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
    },
    tabBadgeText: { color: theme.colors.white, fontSize: 9.5, fontWeight: "800" },
  });
