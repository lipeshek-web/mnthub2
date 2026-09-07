/**
 * Órbita — edição Expo Snack.
 *
 * Entrada única App.js: navegação via React Navigation com stack JS
 * (@react-navigation/stack) — a navegação nativa de stack não resolve no
 * runtime do Snack; mesma identidade visual e mesmas telas da versão local.
 *
 * Navegação MINIMALISTA estilo iOS: 4 abas apenas (Início · Explorar ·
 * Mensagens · Perfil) em um pager horizontal (ScrollView pagingEnabled)
 * com TAB BAR nativa no rodapé — barra sólida com hairline, ícone + rótulo,
 * como no UIKit. Cursos, Livros e Mentores vivem DENTRO de Explorar (um
 * segmented control iOS), eliminando três telas/abas do app. O estado da
 * aba ativa (e do segmento da Explorar) vive no Root, ACIMA do
 * NavigationContainer, para que telas do stack também consigam trocar de
 * aba (useTabs().setTab) antes de desempilhar.
 *
 * Estrutura:
 *   SafeAreaProvider
 *     └─ ThemeProvider (modo Claro/Escuro persistido em SecureStore)
 *         └─ AuthProvider → gate de sessão
 *             - loading       → splash (marca Órbita)
 *             - anonymous     → LoginScreen (minimalista: só e-mail + senha)
 *             - authenticated → TabsContext.Provider
 *                 └─ NavigationContainer
 *                     RootStack (headerShown: false)
 *                       ├─ Main (pager + tab bar nativa): Início ·
 *                       │   Explorar (Cursos|Livros|Mentores) · Mensagens ·
 *                       │   Perfil
 *                       ├─ Livro  (params: { id })
 *                       ├─ Curso  (params: { id }) — conteúdo em foco
 *                       ├─ Checkout (params: { id }) — compra PIX/cartão no app
 *                       ├─ Mentor (params: { id })
 *                       ├─ Conversa (params: { peerId, peerName }) — chat 1:1
 *                       ├─ Sala   (params: { bookingId, ... }) — reunião ao
 *                       │   vivo DENTRO do app (WebView → /live.html)
 *                       ├─ Evento (params: { id }) — reunião MULTI-participante
 *                       │   (WebView → /room.html, malha WebRTC)
 *                       ├─ Ranking (ranking de XP da semana — gamificação)
 *                       ├─ Busca  (busca global: cursos + livros + mentores)
 *                       └─ Salvos (favoritos locais do aparelho)
 *
 * Ao trocar de tema, a árvore de navegação é remontada com key={mode}: como os
 * componentes criam os estilos com factories (makeStyles) a cada montagem, toda
 * a interface recalcula as cores da paleta nova.
 */
import "react-native-gesture-handler";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
/* No react-native-web Alert.alert é um no-op — avisos como "Inscrição        */
/* confirmada!" e erros de envio simplesmente não aparecem no preview do      */
/* Snack. No web mapeamos para alert()/confirm() do navegador (o app no Expo  */
/* Go / aparelho continua usando o Alert nativo, sem mudança alguma).         */
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
import { DefaultTheme, NavigationContainer, useIsFocused, useRoute } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./src/lib/auth";
import { ThemeProvider, useThemeMode } from "./src/lib/theme";
import { TabsContext, useTabs, isTabName, isSegmentName } from "./src/lib/tabs";
import { theme } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ExplorarScreen from "./src/screens/ExplorarScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import LivroScreen from "./src/screens/LivroScreen";
import CursoScreen from "./src/screens/CursoScreen";
import MentorScreen from "./src/screens/MentorScreen";
import BuscaScreen from "./src/screens/BuscaScreen";
import SalvosScreen from "./src/screens/SalvosScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import MensagensScreen, { MessagesTabPage } from "./src/screens/MensagensScreen";
import SalaScreen from "./src/screens/SalaScreen";
import EventoScreen from "./src/screens/EventoScreen";
import RankingScreen from "./src/screens/RankingScreen";
import { unreadStore } from "./src/lib/unread";

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

/** Marca Órbita: planeta com anel elíptico — desenhado só com Views. */
function OrbitMark({ size = 96 }) {
  const styles = makeStyles();
  const ringW = size * 1.55;
  const ringH = size * 0.56;
  return (
    <View style={[styles.markStage, { width: ringW, height: ringW }]}>
      <View
        style={[
          styles.markRing,
          { width: ringW, height: ringH, borderRadius: ringH / 2 },
        ]}
      />
      <View style={[styles.markMoon, { width: size * 0.14, height: size * 0.14 }]} />
      <View style={[styles.markPlanet, { width: size, height: size, borderRadius: size / 2 }]} />
    </View>
  );
}

function Splash() {
  const styles = makeStyles();
  return (
    <View style={styles.splash}>
      <OrbitMark size={84} />
      <Text style={styles.splashLogo}>Órbita</Text>
      <Text style={styles.splashTagline}>Seu universo de aprendizado</Text>
      <ActivityIndicator color={theme.colors.accent} style={styles.splashSpinner} />
    </View>
  );
}

/* ------------------------------ Abas (pager) -------------------------------- */

/** Itens da tab bar nativa — 4 abas; Cursos/Livros/Mentores vivem em Explorar. */
const TABS = [
  { name: "Início", icon: "home", Component: HomeScreen },
  { name: "Explorar", icon: "compass", Component: ExplorarScreen },
  { name: "Mensagens", icon: "chatbubble-ellipses", Component: MessagesTabPage },
  { name: "Perfil", icon: "person", Component: PerfilScreen },
];

function MainTabs() {
  const styles = makeStyles();
  const insets = useSafeAreaInsets();
  const { width, height: windowHeight } = useWindowDimensions();
  const route = useRoute();
  const { tab, setTab } = useTabs();
  // Badge global de mensagens não lidas (o store é atualizado pela aba Mensagens).
  const unreadMessages = useSyncExternalStore(
    unreadStore.subscribe,
    unreadStore.get,
    unreadStore.get
  );
  // Foco do "Main" no stack: ao abrir uma tela por cima (Curso, Livro,
  // Mentor...), o pager PERDE foco — travamos a rolagem para que gestos de
  // transição nunca deixem o pager meio deslizado ao voltar (bug do voltar).
  const isFocused = useIsFocused();

  const scrollRef = useRef(null);
  // Lazy: cada tela só monta na primeira visita (e depois fica montada).
  const [visited, setVisited] = useState(() => new Set(["Início"]));
  // Altura real da área das páginas (viewport do pager, sem a tab bar).
  const [pagerHeight, setPagerHeight] = useState(windowHeight);

  // Garante que a aba ativa esteja sempre montada (lazy mount por aba).
  useEffect(() => {
    setVisited((prev) => (prev.has(tab) ? prev : new Set([...prev, tab])));
  }, [tab]);

  // Deep-link via params do stack: navigate("Main", { screen: "Explorar" }).
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

  // De volta do stack → encaixa o pager EXATAMENTE na aba ativa (sem
  // animação), garantindo que nenhum deslize pela metade sobreviva ao voltar.
  useEffect(() => {
    if (!isFocused) return;
    const index = TABS.findIndex((item) => item.name === tab);
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: index * width, animated: false });
    }
  }, [isFocused, tab, width]);

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
        scrollEnabled={isFocused}
        nestedScrollEnabled
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

      {/* Tab bar nativa estilo iOS — barra sólida no rodapé, hairline no topo,
          ícone + rótulo, sem pílula decorativa. */}
      <View
        style={[
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        {TABS.map(({ name, icon }) => {
          const active = tab === name;
          const color = active ? theme.colors.accent : theme.colors.textFaint;
          return (
            <TouchableOpacity
              key={name}
              style={styles.tabItem}
              onPress={() => setTab(name)}
              activeOpacity={0.65}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={name}
            >
              <View style={styles.tabIconWrap}>
                <Ionicons name={icon} size={24} color={color} />
                {name === "Mensagens" && unreadMessages > 0 ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {unreadMessages > 9 ? "9+" : String(unreadMessages)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
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
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Mentor" component={MentorScreen} />
      <Stack.Screen name="Conversa" component={MensagensScreen} />
      <Stack.Screen name="Sala" component={SalaScreen} />
      <Stack.Screen name="Evento" component={EventoScreen} />
      <Stack.Screen name="Ranking" component={RankingScreen} />
      <Stack.Screen name="Busca" component={BuscaScreen} />
      <Stack.Screen name="Salvos" component={SalvosScreen} />
    </Stack.Navigator>
  );
}

/* ------------------------------ Gate de sessão ------------------------------ */

function Root() {
  const { status } = useAuth();
  const { mode } = useThemeMode();

  // Estado da aba ativa + segmento da Explorar vivem aqui (acima do
  // NavigationContainer) para que as telas do stack também possam trocar de
  // aba/segmento via useTabs.
  const [tab, setTabState] = useState("Início");
  const [segment, setSegmentState] = useState("Cursos");
  const setTab = useCallback((next) => {
    if (isTabName(next)) setTabState(next);
  }, []);
  const setSegment = useCallback((next) => {
    if (isSegmentName(next)) setSegmentState(next);
  }, []);
  const tabsValue = useMemo(
    () => ({ tab, setTab, segment, setSegment }),
    [tab, setTab, segment, setSegment]
  );

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
    <SafeAreaProvider>
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
    markStage: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    markRing: {
      position: "absolute",
      borderWidth: 2.5,
      borderColor: theme.colors.accent,
      opacity: 0.55,
      transform: [{ rotate: "-18deg" }],
    },
    markMoon: {
      position: "absolute",
      backgroundColor: theme.colors.accent,
      opacity: 0.9,
      top: "12%",
      right: "8%",
    },
    markPlanet: {
      backgroundColor: theme.colors.accent,
      opacity: 0.28,
    },
    splashLogo: {
      color: theme.colors.text,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
    },
    splashTagline: {
      color: theme.colors.textFaint,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 6,
    },
    splashSpinner: { marginTop: 26 },

    /* Pager de abas */
    mainFlex: { flex: 1, backgroundColor: theme.colors.bg },
    flex: { flex: 1 },
    page: { backgroundColor: theme.colors.bg },

    /* Tab bar nativa estilo iOS — sólida, hairline no topo, sem flutuar */
    tabBar: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "stretch",
      paddingTop: 7,
      paddingHorizontal: 6,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 2,
    },
    tabIconWrap: { alignItems: "center", justifyContent: "center" },
    tabBadge: {
      position: "absolute",
      top: -4,
      right: -10,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.danger,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    tabBadgeText: { color: theme.colors.white, fontSize: 9, fontWeight: "800" },
    tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.1 },
  });
