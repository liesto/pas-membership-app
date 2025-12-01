import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateAccount from '@/pages/CreateAccount';

// Mock Clerk to avoid authentication issues in tests
vi.mock('@clerk/clerk-react', async () => {
  const actual = await vi.importActual('@clerk/clerk-react');
  return {
    ...actual,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSignUp: () => ({
      signUp: {
        create: vi.fn(),
      },
      isLoaded: true,
      setActive: vi.fn(),
    }),
    useAuth: () => ({
      getToken: vi.fn().mockResolvedValue('test-token'),
      isSignedIn: false,
      userId: null,
    }),
    useUser: () => ({
      user: null,
      isLoaded: true,
    }),
  };
});

describe('CreateAccount', () => {
  describe('rendering', () => {
    it('should render the login form heading', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      expect(screen.getByText(/Log in to My Account/i)).toBeDefined();
    });

    it('should render the create account form heading', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      expect(screen.getByText(/Create a free Pisgah Area SORBA Account/i)).toBeDefined();
    });

    it('should render email and password labels in login form', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      // Login form should have email label
      const emailLabels = screen.getAllByText(/Email Address/i);
      expect(emailLabels.length).toBeGreaterThan(0);

      // Login form should have password label
      const passwordLabels = screen.getAllByText(/Password/i);
      expect(passwordLabels.length).toBeGreaterThan(0);
    });

    it('should render first name input field', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(/First Name/i);
      expect(firstNameInput).toBeDefined();
      expect((firstNameInput as HTMLInputElement).type).toBe('text');
    });

    it('should render last name input field', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      const lastNameInput = screen.getByPlaceholderText(/Last Name/i);
      expect(lastNameInput).toBeDefined();
      expect((lastNameInput as HTMLInputElement).type).toBe('text');
    });

    it('should render phone input field', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      const phoneInput = screen.getByPlaceholderText(/Phone/i);
      expect(phoneInput).toBeDefined();
      expect((phoneInput as HTMLInputElement).type).toBe('tel');
    });

    it('should render city input field', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      const cityInput = screen.getByPlaceholderText(/City/i);
      expect(cityInput).toBeDefined();
    });

    it('should render GO buttons', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button', { name: /GO!/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('should display the Pisgah Area SORBA logo', () => {
      render(
        <BrowserRouter>
          <CreateAccount />
        </BrowserRouter>
      );

      const logo = screen.getByAltText(/Pisgah Area SORBA/i);
      expect(logo).toBeDefined();
      expect((logo as HTMLImageElement).src).toContain('logo');
    });
  });
});
