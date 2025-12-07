import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { toast } from 'sonner';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Clerk
const mockSignIn = vi.fn();
const mockSetActive = vi.fn();

vi.mock('@clerk/clerk-react', async () => {
  const actual = await vi.importActual('@clerk/clerk-react');
  return {
    ...actual,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSignIn: () => ({
      signIn: {
        create: mockSignIn,
      },
      isLoaded: true,
      setActive: mockSetActive,
    }),
    useAuth: () => ({
      isSignedIn: false,
      userId: null,
    }),
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the login form heading', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      expect(screen.getByText(/Log in to My Account/i)).toBeDefined();
    });

    it('should render email input field', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeDefined();
      expect((emailInput as HTMLInputElement).type).toBe('email');
    });

    it('should render password input field', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toBeDefined();
      expect((passwordInput as HTMLInputElement).type).toBe('password');
    });

    it('should render remember me checkbox', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      expect(screen.getByText(/Remember me/i)).toBeDefined();
    });

    it('should render login button', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /Log In/i });
      expect(loginButton).toBeDefined();
    });

    it('should render forgot password link', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const forgotPasswordLink = screen.getByText(/Forgot your password/i);
      expect(forgotPasswordLink).toBeDefined();
    });

    it('should render create account link', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      expect(screen.getByText(/Create a free account/i)).toBeDefined();
    });
  });

  describe('form validation', () => {
    it('should show error when submitting empty form', async () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const loginButton = screen.getByRole('button', { name: /Log In/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Please fill in all fields/i)).toBeDefined();
      });
    });

    it('should show error when email is missing', async () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText(/Password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /Log In/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Please fill in all fields/i)).toBeDefined();
      });
    });

    it('should show error when password is missing', async () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const loginButton = screen.getByRole('button', { name: /Log In/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Please fill in all fields/i)).toBeDefined();
      });
    });
  });

  describe('successful login', () => {
    it('should login successfully with valid credentials', async () => {
      mockSignIn.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'sess_123',
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          identifier: 'test@example.com',
          password: 'password123',
        });
        expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_123' });
        expect(toast.success).toHaveBeenCalledWith('Login successful!');
        expect(mockNavigate).toHaveBeenCalledWith('/my-account');
      });
    });

    it('should login successfully even with needs_second_factor status', async () => {
      mockSignIn.mockResolvedValue({
        status: 'needs_second_factor',
        createdSessionId: 'sess_456',
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_456' });
        expect(toast.success).toHaveBeenCalledWith('Login successful!');
        expect(mockNavigate).toHaveBeenCalledWith('/my-account');
      });
    });
  });

  describe('failed login', () => {
    it('should show error message when login fails with unexpected status', async () => {
      mockSignIn.mockResolvedValue({
        status: 'needs_identifier',
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Login failed. Please check your credentials and try again./i)).toBeDefined();
      });
    });

    it('should handle Clerk errors with error array', async () => {
      mockSignIn.mockRejectedValue({
        errors: [
          {
            message: 'Invalid email or password',
          },
        ],
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/i)).toBeDefined();
        expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
      });
    });

    it('should handle Clerk errors with message property', async () => {
      mockSignIn.mockRejectedValue({
        message: 'Account locked due to too many failed attempts',
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Account locked due to too many failed attempts/i)).toBeDefined();
        expect(toast.error).toHaveBeenCalledWith('Account locked due to too many failed attempts');
      });
    });

    it('should show generic error for unknown error types', async () => {
      mockSignIn.mockRejectedValue(new Error());

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred during login/i)).toBeDefined();
      });
    });
  });

  describe('loading state', () => {
    it('should disable button and show loading state during login', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        status: 'complete',
        createdSessionId: 'sess_123',
      }), 100)));

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Button should be disabled during loading
      expect((loginButton as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByText(/Logging in.../i)).toBeDefined();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/my-account');
      });
    });
  });
});
