import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useFocusEffect: (callback: any) => {
      React.useEffect(() => {
        const cleanup = callback();
        return cleanup;
      }, []);
    },
  };
});

jest.mock("../lib/db", () => ({
  db: {
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
  },
}));

const { db } = require("../lib/db");
const runAsyncMock = db.runAsync as jest.Mock;
const getAllAsyncMock = db.getAllAsync as jest.Mock;

const alertSpy = jest.spyOn(Alert, "alert");

describe("Itinerary planner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockImplementation(() => {});
    runAsyncMock.mockResolvedValue(undefined);
    getAllAsyncMock.mockResolvedValue([]);
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  const renderScreen = () => {
    const Screen = require("../app/itinerary").default;
    return render(<Screen />);
  };

  it("alerts when the title is missing", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Destination"), "Paris");

    await act(async () => {
      fireEvent.press(getByText("Save itinerary"));
    });

    expect(alertSpy).toHaveBeenCalledWith("Missing title", "Give your itinerary a memorable name.");
    expect(runAsyncMock).not.toHaveBeenCalled();
  });

  it("alerts when the destination is missing", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Trip title"), "Spring Adventure");

    await act(async () => {
      fireEvent.press(getByText("Save itinerary"));
    });

    expect(alertSpy).toHaveBeenCalledWith("Destination needed", "Where are you heading?");
    expect(runAsyncMock).not.toHaveBeenCalled();
  });

  it("saves a trip and refreshes the list", async () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText("Trip title"), "  Alpine Escape  ");
    fireEvent.changeText(getByPlaceholderText("Destination"), "  Zurich ");
    fireEvent.changeText(getByPlaceholderText("Start date"), "2025-03-01");
    fireEvent.changeText(getByPlaceholderText("End date"), "2025-03-06");
    fireEvent.changeText(getByPlaceholderText("Notes"), "Visit the old town");

    await act(async () => {
      fireEvent.press(getByText("Save itinerary"));
    });

    await waitFor(() => {
      expect(runAsyncMock).toHaveBeenCalledWith(
        "INSERT INTO itineraries (title, destination, start_date, end_date, experiences) VALUES (?, ?, ?, ?, ?)",
        ["Alpine Escape", "Zurich", "2025-03-01", "2025-03-06", "Visit the old town"]
      );
      expect(getAllAsyncMock).toHaveBeenCalledTimes(2);
    });
  });

  it("deletes a trip and reloads the plans", async () => {
    getAllAsyncMock.mockResolvedValueOnce([
      {
        id: 7,
        title: "Desert Journey",
        destination: "Jaipur",
        start_date: null,
        end_date: null,
        experiences: null,
      },
    ]);
    getAllAsyncMock.mockResolvedValue([]);

    const { getByLabelText, getByText } = renderScreen();

    await waitFor(() => expect(getByText("Desert Journey")).toBeTruthy());

    fireEvent.press(getByLabelText("Delete Desert Journey"));

    const [, , actions] = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const confirm = actions?.find((action: any) => action.text === "Delete");

    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(runAsyncMock).toHaveBeenCalledWith("DELETE FROM itineraries WHERE id=?", [7]);
    expect(getAllAsyncMock).toHaveBeenCalledTimes(2);
  });
});
