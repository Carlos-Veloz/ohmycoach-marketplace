import type { RouteObject } from 'react-router';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { SiteLayout } from './SiteLayout';

/** Route tree shared by the browser router and the tests. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
