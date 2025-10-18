import { act, fireEvent, render } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ cityId: "london", city: "London" }),
}));

jest.mock("../lib/db", () => ({
  db: {
    runAsync: jest.fn(),
  },
}));

import BookHotel from "../app/city/[cityId]/book";

const { db } = require("../lib/db");
const runAsyncMock = db.runAsync as jest.Mock;

const alertSpy = jest.spyOn(Alert, "alert");

describe("BookHotel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockImplementation(() => {});
    runAsyncMock.mockResolvedValue(undefined);
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it("shows an alert when details are missing", async () => {
    const { getByPlaceholderText, getByText } = render(<BookHotel />);

    fireEvent.changeText(getByPlaceholderText("Your address"), "221B Baker Street");
    fireEvent.changeText(getByPlaceholderText("Start date (YYYY-MM-DD)"), "2025-09-10");

    await act(async () => {
      fireEvent.press(getByText("Confirm booking"));
    });

    expect(alertSpy).toHaveBeenCalledWith("⚠️ Missing Info", "Please fill all fields before booking.");
    expect(runAsyncMock).not.toHaveBeenCalled();
  });

  it("saves a booking when the form is complete", async () => {
    const { getByPlaceholderText, getByText } = render(<BookHotel />);

    fireEvent.changeText(getByPlaceholderText("Your name"), "Alice");
    fireEvent.changeText(getByPlaceholderText("Your address"), "1 Infinite Loop");
    fireEvent.changeText(getByPlaceholderText("Start date (YYYY-MM-DD)"), "2025-05-01");
    fireEvent.changeText(getByPlaceholderText("End date (YYYY-MM-DD)"), "2025-05-05");

    await act(async () => {
      fireEvent.press(getByText("Confirm booking"));
    });

    expect(runAsyncMock).toHaveBeenCalledWith(
      "INSERT INTO bookings (hotel_name, city, customer_name, customer_address, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)",
      ["CityHop Stay Hotel", "london", "Alice", "1 Infinite Loop", "2025-05-01", "2025-05-05"]
    );
    expect(alertSpy).toHaveBeenCalledWith("✅ Success", "Booking confirmed!");
  });
});
