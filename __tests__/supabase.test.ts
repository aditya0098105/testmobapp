const mockCreateClient = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

const mockSecureStore = {
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};

jest.mock("expo-secure-store", () => mockSecureStore);
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

describe("supabase client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with the expected credentials", () => {
    jest.isolateModules(() => {
      require("../lib/supabase");
    });

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://zuzxgvriikesremzorkl.supabase.co",
      "YOUR-ANON-KEY",
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storage: expect.any(Object),
        }),
      })
    );

    const storage = mockCreateClient.mock.calls[0]?.[2]?.auth?.storage;
    expect(storage).toBeDefined();

    storage?.getItem("token");
    storage?.setItem("token", "value");
    storage?.removeItem("token");

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("token");
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith("token", "value");
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("token");
  });
});
