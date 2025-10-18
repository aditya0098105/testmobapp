import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";

const mockRecordedTabs: any[] = [];
const mockRecordedStacks: any[] = [];
let mockLastStackOptions: any;
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  const Tabs = ({ children }: any) => {
    return <>{children}</>;
  };
  Tabs.Screen = ({ name, options }: any) => {
    mockRecordedTabs.push({ name, options });
    return null;
  };
  const Stack = ({ children, screenOptions }: any) => {
    mockLastStackOptions = screenOptions;
    return <>{children}</>;
  };
  Stack.Screen = ({ name, options }: any) => {
    mockRecordedStacks.push({ name, options });
    return null;
  };
  return {
    Tabs,
    Stack,
    useRouter: () => ({ push: mockPush, back: mockBack }),
    __tabs: mockRecordedTabs,
    __stacks: mockRecordedStacks,
    __stackOptions: () => mockLastStackOptions,
  };
});

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: jest.fn((props) => <mock-ionicon {...props} />),
  Feather: () => null,
}));

jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: any) => callback(),
}));

jest.mock("../components/Hero", () => () => null);
jest.mock("../lib/db", () => ({ initDB: jest.fn() }));

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

const IoniconsMock = require("@expo/vector-icons").Ionicons as jest.Mock;
const expoRouterMock = require("expo-router");

beforeEach(() => {
  mockRecordedTabs.length = 0;
  mockRecordedStacks.length = 0;
  mockLastStackOptions = undefined;
  mockPush.mockClear();
  mockBack.mockClear();
  IoniconsMock.mockClear();
  mockAuth.getSession.mockResolvedValue({
    data: { session: { user: { id: "u1", email: "city@hop.com" } } },
  });
  mockAuth.getUser.mockReturnValue(asImmediate({ data: { user: { id: "u1" } } }));
  fromChain.order.mockResolvedValue({ data: [], error: null });
});

describe("Navigation layout", () => {
  it("renders the tab icon for the Home screen", () => {
    const TabsLayout = require("../app/(tabs)/_layout").default;
    render(<TabsLayout />);

    const tabsRecorded = expoRouterMock.__tabs as any[];
    expect(tabsRecorded).toEqual([
      expect.objectContaining({ name: "index" }),
    ]);

    const iconRenderer = tabsRecorded[0].options.tabBarIcon;
    const iconElement = iconRenderer({ color: "#123", size: 22, focused: true });

    expect(iconElement.props.name).toBe("home-outline");
    expect(iconElement.props.color).toBe("#123");
    expect(iconElement.props.size).toBe(22);
  });

  it("sets the global header title to CityHop", () => {
    const RootLayout = require("../app/_layout").default;
    render(<RootLayout />);

    expect(expoRouterMock.__stackOptions().headerTitle).toBe("CityHop");
  });

  it("navigates from Home to the itinerary screen via the tab link", async () => {
    const Home = require("../app/(tabs)/index").default;
    const { getByText } = render(<Home />);

    await waitFor(() => expect(mockAuth.getUser).toHaveBeenCalled());
    const itineraryLink = await waitFor(() => getByText("Itinerary"));
    fireEvent.press(itineraryLink);

    expect(mockPush).toHaveBeenCalledWith("/itinerary");
  });

  it("invokes router.back when the back button is pressed", () => {
    function BackTester() {
      const router = expoRouterMock.useRouter();
      return (
        <TouchableOpacity onPress={() => router.back()}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      );
    }

    const { getByText } = render(<BackTester />);
    fireEvent.press(getByText("Go Back"));

    expect(mockBack).toHaveBeenCalled();
  });
});
