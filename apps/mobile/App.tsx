import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, StatusBar, View, ActivityIndicator } from "react-native";
import { AgendaScreen } from "./src/screens/AgendaScreen";
import { LoginScreen } from "./src/screens/onboarding/LoginScreen";
import { OnboardingScreen } from "./src/screens/onboarding/OnboardingScreen";
import { useAuth } from "./src/hooks/useAuth";
import { useProfissional } from "./src/hooks/useProfissional";
import { cores } from "./src/theme";

const qc = new QueryClient();

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

  return <AgendaScreen onNovo={() => { /* TODO: fluxo turbo (F3) */ }} />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
        <StatusBar barStyle="dark-content" />
        <Raiz />
      </SafeAreaView>
    </QueryClientProvider>
  );
}
