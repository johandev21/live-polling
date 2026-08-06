import { type ComponentType } from 'react';

import { DefaultRouteFallback } from './route-fallback';

export type RouteLocation = Readonly<{
  hash: string;
  pathname: string;
  search: string;
}>;

export type NavigateOptions = Readonly<{
  hash?: boolean;
  replace?: boolean;
}>;

export type Navigate = (to: string, options?: NavigateOptions) => void;

export type AppRouteProps = {
  hash: string;
  location: RouteLocation;
  navigate: Navigate;
  params: Readonly<Record<string, string>>;
  pathname: string;
  search: string;
};

export type AppRoute = {
  component: ComponentType<AppRouteProps>;
  path: string;
};

export type RouteMatch = Readonly<{
  location: RouteLocation;
  params: Readonly<Record<string, string>>;
  route: AppRoute;
}>;

export type RouteFallbackProps = AppRouteProps;
export type RouteFallback = ComponentType<RouteFallbackProps>;

export type AppRouter = Readonly<{
  fallback: RouteFallback;
  getServerSnapshot: () => RouteLocation;
  getSnapshot: () => RouteLocation;
  match: (location?: RouteLocation) => RouteMatch | undefined;
  navigate: Navigate;
  routes: readonly AppRoute[];
  subscribe: (listener: () => void) => () => void;
}>;

function normalizePathname(pathname: string): string {
  const trimmedPathname = pathname.trim();
  const withLeadingSlash = trimmedPathname.startsWith('/')
    ? trimmedPathname
    : `/${trimmedPathname}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (collapsed.length <= 1) {
    return '/';
  }

  return collapsed.replace(/\/+$/, '');
}

function splitPath(value: string): Pick<RouteLocation, 'pathname' | 'search'> {
  const queryIndex = value.indexOf('?');
  const pathname = queryIndex === -1 ? value : value.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : value.slice(queryIndex);

  return {
    pathname: normalizePathname(pathname || '/'),
    search,
  };
}

function readLocation(): RouteLocation {
  if (typeof window === 'undefined') {
    return { hash: '', pathname: '/', search: '' };
  }

  const hash = window.location.hash;
  const hashPath = hash.startsWith('#') ? hash.slice(1) : hash;
  const normalPath = `${window.location.pathname}${window.location.search}`;
  const source =
    window.location.pathname === '/' && hashPath
      ? hashPath.replace(/^!/, '')
      : normalPath;
  const { pathname, search } = splitPath(source);

  return { hash, pathname, search };
}

function decodePathValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pathSegments(pathname: string): string[] {
  const normalized = normalizePathname(pathname);
  return normalized === '/' ? [] : normalized.slice(1).split('/');
}

function matchPath(
  pattern: string,
  pathname: string,
): Readonly<Record<string, string>> | undefined {
  const normalizedPattern = normalizePathname(pattern);
  const routeSegments = pathSegments(normalizedPattern);
  const currentSegments = pathSegments(pathname);
  const params: Record<string, string> = {};

  if (normalizedPattern === '/*' || normalizedPattern === '*') {
    return { '*': currentSegments.map(decodePathValue).join('/') };
  }

  const wildcardIndex = routeSegments.indexOf('*');
  if (wildcardIndex !== -1) {
    if (currentSegments.length < wildcardIndex) {
      return undefined;
    }
  } else if (routeSegments.length !== currentSegments.length) {
    return undefined;
  }

  for (const [index, routeSegment] of routeSegments.entries()) {
    if (routeSegment === '*') {
      params['*'] = currentSegments.slice(index).map(decodePathValue).join('/');
      break;
    }

    const currentSegment = currentSegments[index];
    if (currentSegment === undefined) {
      return undefined;
    }

    if (routeSegment.startsWith(':')) {
      params[routeSegment.slice(1)] = decodePathValue(currentSegment);
      continue;
    }

    if (routeSegment !== currentSegment) {
      return undefined;
    }
  }

  return params;
}

function parseNavigationTarget(
  to: string,
): Pick<RouteLocation, 'pathname' | 'search'> {
  const withoutHash = to.trim().replace(/^#!?/, '');
  const hashIndex = withoutHash.indexOf('#');
  const source =
    hashIndex === -1 ? withoutHash : withoutHash.slice(0, hashIndex);

  return splitPath(source || '/');
}

export function definePageRoutes(
  routes: readonly AppRoute[],
): readonly AppRoute[] {
  return routes;
}

export function createAppRouter(
  routes: readonly AppRoute[],
  fallback: RouteFallback = DefaultRouteFallback,
): AppRouter {
  let snapshot = readLocation();
  const listeners = new Set<() => void>();
  let browserListenersAttached = false;

  const notify = () => {
    snapshot = readLocation();
    for (const listener of listeners) {
      listener();
    }
  };

  const attachBrowserListeners = () => {
    if (browserListenersAttached || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('hashchange', notify);
    window.addEventListener('popstate', notify);
    browserListenersAttached = true;
  };

  const detachBrowserListeners = () => {
    if (!browserListenersAttached || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('hashchange', notify);
    window.removeEventListener('popstate', notify);
    browserListenersAttached = false;
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    attachBrowserListeners();

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        detachBrowserListeners();
      }
    };
  };

  const navigate: Navigate = (to, options = {}) => {
    if (typeof window === 'undefined') {
      return;
    }

    const target = parseNavigationTarget(to);
    const useHash = options.hash ?? to.trim().startsWith('#');
    const nextUrl = useHash
      ? `/#${target.pathname}${target.search}`
      : `${target.pathname}${target.search}`;
    const method = options.replace ? 'replaceState' : 'pushState';

    window.history[method]({}, '', nextUrl);
    notify();
  };

  const match = (location = snapshot): RouteMatch | undefined => {
    for (const route of routes) {
      const params = matchPath(route.path, location.pathname);
      if (params) {
        return { location, params, route };
      }
    }

    return undefined;
  };

  return {
    fallback,
    getServerSnapshot: () => snapshot,
    getSnapshot: () => snapshot,
    match,
    navigate,
    routes,
    subscribe,
  };
}
