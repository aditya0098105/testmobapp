import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock("../lib/db", () => ({
  db: {
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
  },
}));

const { useLocalSearchParams } = require("expo-router");
const useLocalSearchParamsMock = useLocalSearchParams as jest.Mock;

const { db } = require("../lib/db");
const getAllAsyncMock = db.getAllAsync as jest.Mock;
const runAsyncMock = db.runAsync as jest.Mock;

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("Bookings screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocalSearchParamsMock.mockReturnValue({ cityId: "paris" });
    getAllAsyncMock.mockResolvedValue([]);
    runAsyncMock.mockResolvedValue(undefined);
  });

  it("shows the empty bookings message", async () => {
    const Screen = require("../app/city/[cityId]/bookings").default;
    const { getByText } = render(<Screen />);

    await waitFor(() => expect(getAllAsyncMock).toHaveBeenCalled());
    expect(getByText("No bookings yet")).toBeTruthy();
    expect(getByText("Add a reservation to see it listed here.")).toBeTruthy();
  });

  it("renders booking cards when data is returned", async () => {
    getAllAsyncMock.mockResolvedValue([
      {
        id: 10,
        hotel_name: "Hotel Lumière",
        city: "Paris",
        customer_name: "Amelie",
        customer_address: "123 Rue de Rivoli",
        start_date: "2025-06-01",
        end_date: "2025-06-05",
      },
    ]);

    const Screen = require("../app/city/[cityId]/bookings").default;
    const { getByText } = render(<Screen />);

    await waitFor(() => expect(getByText("Hotel Lumière")).toBeTruthy());
    expect(getByText("Guest: Amelie")).toBeTruthy();
    expect(getByText("Address: 123 Rue de Rivoli")).toBeTruthy();
  });

  it("edits a booking and shows a success alert", async () => {
    getAllAsyncMock.mockResolvedValue([
      {
        id: 3,
        hotel_name: "Skyline Suites",
        city: "Paris",
        customer_name: "Noah",
        customer_address: "10 Sunset Blvd",
        start_date: "2025-04-01",
        end_date: "2025-04-04",
      },
    ]);

    const Screen = require("../app/city/[cityId]/bookings").default;
    const { getByText, getByDisplayValue } = render(<Screen />);

    await waitFor(() => expect(getByText("Skyline Suites")).toBeTruthy());
    const editButton = getByText("Edit");
    fireEvent.press(editButton);

    const nameInput = await waitFor(() => getByDisplayValue("Noah"));
    fireEvent.changeText(nameInput, "Noah Parker");
    fireEvent.changeText(getByDisplayValue("10 Sunset Blvd"), "25 River Road");
    fireEvent.changeText(getByDisplayValue("2025-04-01"), "2025-04-03");
    fireEvent.changeText(getByDisplayValue("2025-04-04"), "2025-04-06");

    fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(runAsyncMock).toHaveBeenCalledWith(
        "UPDATE bookings SET customer_name=?, customer_address=?, start_date=?, end_date=? WHERE id=?",
        ["Noah Parker", "25 River Road", "2025-04-03", "2025-04-06", 3]
      );
      expect(alertSpy).toHaveBeenCalledWith("✅ Success", "Booking updated!");
    });
  });

  it("confirms and deletes a booking", async () => {
    getAllAsyncMock.mockResolvedValue([
      {
        id: 6,
        hotel_name: "Harbor Hotel",
        city: "Paris",
        customer_name: "Evelyn",
        customer_address: "45 Ocean Drive",
        start_date: "2025-05-01",
        end_date: "2025-05-05",
      },
    ]);

    const Screen = require("../app/city/[cityId]/bookings").default;
    const { getByText } = render(<Screen />);

    await waitFor(() => expect(getByText("Harbor Hotel")).toBeTruthy());
    fireEvent.press(getByText("Delete"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    const [, , actions] = alertSpy.mock.calls[0];
    const confirm = actions?.find((action: any) => action.text === "Delete");
    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(runAsyncMock).toHaveBeenCalledWith("DELETE FROM bookings WHERE id=?", [6]);
  });
});
