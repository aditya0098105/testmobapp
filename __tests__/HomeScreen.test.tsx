import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, Keyboard } from "react-native";

jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: () => undefined,
}));

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../components/Hero", () => () => null);

const fromChain: any = {};
fromChain.select = jest.fn(() => fromChain);
fromChain.eq = jest.fn(() => fromChain);
fromChain.order = jest.fn(() => Promise.resolve({ data: [], error: null }));

const mockAuth = {
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
};

const mockSupabase = {
  auth: mockAuth,
  from: jest.fn(() => fromChain),
};

const asImmediate = (value: any) => ({
  then: (resolve: (val: any) => void) => resolve(value),
});

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => mockSupabase,
}));

jest.mock("expo-router/entry", () => ({}));

const dismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("Home screen authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    mockAuth.getUser.mockReturnValue(asImmediate({ data: { user: null } }));
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any);
    mockSupabase.from.mockReturnValue(fromChain);
    fromChain.order.mockResolvedValue({ data: [], error: null });
  });

  it("renders the sign in form when no session exists", async () => {
    const Screen = require("../app/(tabs)/index").default;
    const { getByText } = render(<Screen />);

    await waitFor(() => {
      expect(getByText("Sign in to CityHop")).toBeTruthy();
      expect(getByText("Sign In")).toBeTruthy();
    });
  });

  it("toggles password visibility", async () => {
    const Screen = require("../app/(tabs)/index").default;
    const { getByPlaceholderText, getByLabelText } = render(<Screen />);

    const passwordInput = await waitFor(() => getByPlaceholderText("Password"));
    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText("Show password"));

    const updatedInput = getByPlaceholderText("Password");
    expect(updatedInput.props.secureTextEntry).toBe(false);
  });

  it("switches between sign in and sign up modes", async () => {
    const Screen = require("../app/(tabs)/index").default;
    const { getByText } = render(<Screen />);

    const toggle = await waitFor(() => getByText("New here? Create an account"));
    fireEvent.press(toggle);

    expect(getByText("Create your CityHop account")).toBeTruthy();
    fireEvent.press(getByText("Already have an account? Sign in"));
    expect(getByText("Sign in to CityHop")).toBeTruthy();
  });

  it("shows an alert when submitting with empty fields", async () => {
    const Screen = require("../app/(tabs)/index").default;
    const { getByText } = render(<Screen />);

    const submit = await waitFor(() => getByText("Sign In"));
    fireEvent.press(submit);

    expect(alertSpy).toHaveBeenCalledWith("Missing", "Enter email and password");
  });
});

describe("Home screen with an authenticated session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: "123", email: "traveler@cityhop.com" } } },
    });
    mockAuth.getUser.mockReturnValue(asImmediate({ data: { user: { id: "123" } } }));
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any);
    mockSupabase.from.mockReturnValue(fromChain);
    fromChain.order.mockResolvedValue({ data: [], error: null });
  });

  it("searches for a city and opens itinerary link", async () => {
    const Screen = require("../app/(tabs)/index").default;
    const { getByPlaceholderText, getByText } = render(<Screen />);

    const searchInput = await waitFor(() =>
      getByPlaceholderText("Search for a city or hidden gem")
    );
    fireEvent.changeText(searchInput, "Tokyo");
    fireEvent.press(getByText("Search destinations"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/city/Tokyo");
    });

    fireEvent.press(getByText("Itinerary"));
    expect(mockPush).toHaveBeenCalledWith("/itinerary");
    expect(dismissSpy).toHaveBeenCalled();
  });

  it("shows the sign out button for the current user", async () => {
    const Screen = require("../app/(tabs)/index").default;
    const { getByText } = render(<Screen />);

    const signOut = await waitFor(() => getByText("Sign out (traveler@cityhop.com)"));
    expect(signOut).toBeTruthy();
  });
});
