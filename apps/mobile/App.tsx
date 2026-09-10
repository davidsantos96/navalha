import { useCallback } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, StatusBar, View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useFontesBricolage,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  useFonts as useFontesFigtree,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import { AppShell } from "./src/navigation/AppShell";
import { LoginScreen } from "./src/screens/onboarding/LoginScreen";
import { OnboardingScreen } from "./src/screens/onboarding/OnboardingScreen";
import { useAuth } from "./src/hooks/useAuth";
import { useProfissional } from "./src/hooks/useProfissional";
import { cores } from "./src/theme";

const qc = new QueryClient();

SplashScreen.preventAutoHideAsync().catch(() => {});

function Carregando() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={cores.vermelho} size="large" />
    </View>
  );
}

function Raiz() {
  const { session, carregando: carregandoAuth } = useAuth();
  const profissional = useProfissional(session?.user.id);
  const queryClient = useQueryClient();

  if (carregandoAuth) return <Carregando />;
  if (!session) return <LoginScreen />;
  if (profissional.isLoading) return <Carregando />;

  if (!profissional.data) {
    return (
      <OnboardingScreen
        onConcluido={() => queryClient.invalidateQueries({ queryKey: ["profissional"] })}
      />
    );
  }

  return <AppShell profissional={profissional.data} />;
}

export default function App() {
  const [bricolageCarregada] = useFontesBricolage({ BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold });
  const [figtreeCarregada] = useFontesFigtree({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  const pronto = bricolageCarregada && figtreeCarregada;

  const aoLayoutRaiz = useCallback(async () => {
    if (pronto) await SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <QueryClientProvider client={qc}>
      <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }} onLayout={aoLayoutRaiz}>
        <StatusBar barStyle="dark-content" />
        <Raiz />
      </SafeAreaView>
    </QueryClientProvider>
  );
}
