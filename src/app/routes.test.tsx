import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe('routes', () => {
  it('renders the home page inside the site layout', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Programas de entrenamiento de los mejores coaches',
    );
    expect(screen.getByRole('link', { name: 'OhMyCoach Marketplace, inicio' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('renders the not-found page for an unknown path', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
  });
});
