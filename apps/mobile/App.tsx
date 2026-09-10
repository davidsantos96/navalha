import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
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
import { TelaCarregamento } from "./src/components/TelaCarregamento";
import { useAuth } from "./src/hooks/useAuth";
import { useProfissional } from "./src/hooks/useProfissional";
import { cores } from "./src/theme";

const qc = new QueryClient();

SplashScreen.preventAutoHideAsync().catch(() => {});

function Raiz() {
  const { session, carregando: carregandoAuth } = useAuth();
  const profissional = useProfissional(session?.user.id);
  const queryClient = useQueryClient();

  if (carregandoAuth) return <TelaCarregamento />;
  if (!session) return <LoginScreen />;
  if (profissional.isLoading) return <TelaCarregamento />;

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

  // Esconde o splash nativo assim que a 1ª tela em JS (a própria
  // TelaCarregamento, mesma marca do splash) já está desenhada — antes
  // disso o app renderiza `null` e o onLayout nunca dispararia.
  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
          <StatusBar barStyle="dark-content" />
          {pronto ? <Raiz /> : <TelaCarregamento />}
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
