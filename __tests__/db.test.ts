const mockExecAsync = jest.fn();

jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: mockExecAsync,
  })),
}));

describe("initDB", () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    jest.resetModules();
    mockExecAsync.mockReset();
    mockExecAsync.mockResolvedValue(undefined);
    logSpy.mockClear();
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it("creates the bookings and itineraries tables", async () => {
    const { initDB } = require("../lib/db");

    await initDB();

    expect(mockExecAsync).toHaveBeenCalledTimes(2);
    expect(mockExecAsync.mock.calls[0]?.[0]).toContain("CREATE TABLE IF NOT EXISTS bookings");
    expect(mockExecAsync.mock.calls[1]?.[0]).toContain("CREATE TABLE IF NOT EXISTS itineraries");
  });

  it("logs an error if setup fails", async () => {
    mockExecAsync.mockRejectedValueOnce(new Error("boom"));

    const { initDB } = require("../lib/db");

    await initDB();

    expect(logSpy).toHaveBeenCalledWith("❌ DB init error:", expect.any(Error));
  });
});
