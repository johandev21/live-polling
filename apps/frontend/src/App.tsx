import { AppEntrypoint } from '@/app/entrypoint';
import { ThemeProvider } from '@/components/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppEntrypoint />
    </ThemeProvider>
  );
}

export default App;
