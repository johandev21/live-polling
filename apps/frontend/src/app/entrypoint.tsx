import { RouterProvider } from '@tanstack/react-router';

import { router } from './router';

export function AppEntrypoint() {
  return <RouterProvider router={router} />;
}
