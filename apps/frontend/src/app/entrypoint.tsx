import { appRouter } from './routes';
import { RouterView } from './router-view';

export function AppEntrypoint() {
  return <RouterView router={appRouter} />;
}
