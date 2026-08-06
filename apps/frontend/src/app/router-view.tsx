import { useSyncExternalStore } from 'react';

import type { AppRouteProps, AppRouter } from './router';

export function RouterView({ router }: { router: AppRouter }) {
  const location = useSyncExternalStore(
    router.subscribe,
    router.getSnapshot,
    router.getServerSnapshot,
  );
  const routeMatch = router.match(location);
  const Component = routeMatch?.route.component ?? router.fallback;
  const routeProps: AppRouteProps = {
    hash: location.hash,
    location,
    navigate: router.navigate,
    params: routeMatch?.params ?? {},
    pathname: location.pathname,
    search: location.search,
  };

  return <Component {...routeProps} />;
}
