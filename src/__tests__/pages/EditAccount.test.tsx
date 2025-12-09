import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import EditAccount from '@/pages/EditAccount';
import { server } from '../setup';
import { contactUpdateErrorHandler, contactFetchErrorHandler } from '../mocks/salesforceHandlers';

// Mock navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Clerk
vi.mock('@clerk/clerk-react', async () => {
  const actual = await vi.importActual('@clerk/clerk-react');
  return {
    ...actual,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
      getToken: vi.fn().mockResolvedValue('test-token'),
      isSignedIn: true,
      userId: 'test-user-id',
    }),
    useUser: () => ({
      user: {
        id: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [{ emailAddress: 'john.doe@example.com' }],
      },
      isLoaded: true,
    }),
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditAccount', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Loading state', () => {
    it('should show loading spinner while fetching data', () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      expect(screen.getByText(/Loading account data.../i)).toBeDefined();
    });
  });

  describe('Form rendering', () => {
    it('should render the edit account form heading', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Edit Your Account/i)).toBeDefined();
      });
    });

    it('should render back to my account link', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const backLink = screen.getByText(/Back to My Account/i);
        expect(backLink).toBeDefined();
      });
    });

    it('should render first name input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const firstNameInput = screen.getByPlaceholderText(/John/i);
        expect(firstNameInput).toBeDefined();
        expect((firstNameInput as HTMLInputElement).value).toBe('John');
      });
    });

    it('should render last name input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const lastNameInput = screen.getByPlaceholderText(/Doe/i);
        expect(lastNameInput).toBeDefined();
        expect((lastNameInput as HTMLInputElement).value).toBe('Doe');
      });
    });

    it('should render email input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/john@example.com/i);
        expect(emailInput).toBeDefined();
        expect((emailInput as HTMLInputElement).value).toBe('john.doe@example.com');
      });
    });

    it('should render phone input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const phoneInputs = screen.getAllByPlaceholderText(/555/i);
        const phoneInput = phoneInputs.find(input => (input as HTMLInputElement).value === '5551234567');
        expect(phoneInput).toBeDefined();
      });
    });

    it('should render address input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const addressInput = screen.getByPlaceholderText(/123 Main St/i);
        expect(addressInput).toBeDefined();
        expect((addressInput as HTMLInputElement).value).toBe('123 Main St');
      });
    });

    it('should render city input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const cityInput = screen.getByPlaceholderText(/Asheville/i);
        expect(cityInput).toBeDefined();
        expect((cityInput as HTMLInputElement).value).toBe('Asheville');
      });
    });

    it('should render state input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const stateInput = screen.getByPlaceholderText(/NC/i);
        expect(stateInput).toBeDefined();
        expect((stateInput as HTMLInputElement).value).toBe('NC');
      });
    });

    it('should render zip code input field with loaded data', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const zipInputs = screen.getAllByPlaceholderText(/28801/i);
        const zipInput = zipInputs.find(input => (input as HTMLInputElement).value === '28801');
        expect(zipInput).toBeDefined();
      });
    });

    it('should render email opt-in checkbox', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeDefined();
      });
    });

    it('should render update account button', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const updateButton = screen.getByRole('button', { name: /Update Account/i });
        expect(updateButton).toBeDefined();
      });
    });

    it('should display the Pisgah Area SORBA logo', async () => {
      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        const logo = screen.getByAltText(/Pisgah Area SORBA/i);
        expect(logo).toBeDefined();
        expect((logo as HTMLImageElement).src).toContain('logo');
      });
    });
  });

  describe('Form validation', () => {
    it('should show validation error for invalid first name', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/John/i)).toBeDefined();
      });

      const firstNameInput = screen.getByPlaceholderText(/John/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /Update Account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/First name must be at least 2 characters/i)).toBeDefined();
      });
    });

    it('should show validation error for invalid last name', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Doe/i)).toBeDefined();
      });

      const lastNameInput = screen.getByPlaceholderText(/Doe/i);
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'B');

      const submitButton = screen.getByRole('button', { name: /Update Account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Last name must be at least 2 characters/i)).toBeDefined();
      });
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/john@example.com/i)).toBeDefined();
      });

      const emailInput = screen.getByPlaceholderText(/john@example.com/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Update Account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email address/i)).toBeDefined();
      });
    });
  });

  describe('Form submission', () => {
    it('should successfully update contact and navigate to my account', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/John/i)).toBeDefined();
      });

      const firstNameInput = screen.getByPlaceholderText(/John/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      const submitButton = screen.getByRole('button', { name: /Update Account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/my-account');
      });
    });

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup();

      // Override handler to simulate error
      server.use(contactUpdateErrorHandler);

      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/John/i)).toBeDefined();
      });

      const firstNameInput = screen.getByPlaceholderText(/John/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      const submitButton = screen.getByRole('button', { name: /Update Account/i });
      await user.click(submitButton);

      // Should not navigate on error
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      // Override handler to simulate error
      server.use(contactFetchErrorHandler);

      render(
        <BrowserRouter>
          <EditAccount />
        </BrowserRouter>
      );

      // Should still render the form even if fetch fails
      await waitFor(() => {
        expect(screen.queryByText(/Loading account data.../i)).toBeNull();
      }, { timeout: 3000 });
    });
  });
});
