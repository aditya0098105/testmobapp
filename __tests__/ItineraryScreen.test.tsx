import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: any) => callback(),
}));

jest.mock("../lib/db", () => ({
  db: {
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
  },
}));

const { db } = require("../lib/db");
const runAsyncMock = db.runAsync as jest.Mock;
const getAllAsyncMock = db.getAllAsync as jest.Mock;

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("Itinerary screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllAsyncMock.mockResolvedValue([]);
    runAsyncMock.mockResolvedValue(undefined);
  });

  it("adds a new trip with notes", async () => {
    const Screen = require("../app/itinerary").default;
    const { getByPlaceholderText, getByText } = render(<Screen />);

    const titleInput = await waitFor(() => getByPlaceholderText("Trip title"));
    const destinationInput = getByPlaceholderText("Destination");
    const notesInput = getByPlaceholderText("Notes");

    fireEvent.changeText(titleInput, "  Alpine Escape  ");
    fireEvent.changeText(destinationInput, "Zurich");
    fireEvent.changeText(getByPlaceholderText("Start date"), "2025-03-01");
    fireEvent.changeText(getByPlaceholderText("End date"), "2025-03-06");
    fireEvent.changeText(notesInput, "Visit the old town");

    fireEvent.press(getByText("Save itinerary"));

    await waitFor(() => {
      expect(runAsyncMock).toHaveBeenCalledWith(
        "INSERT INTO itineraries (title, destination, start_date, end_date, experiences) VALUES (?, ?, ?, ?, ?)",
        ["Alpine Escape", "Zurich", "2025-03-01", "2025-03-06", "Visit the old town"]
      );
      expect(alertSpy).toHaveBeenCalledWith("Saved", "Your itinerary has been added.");
    });
  });

  it("renders saved trips from the database", async () => {
    getAllAsyncMock.mockResolvedValue([
      {
        id: 1,
        title: "Summer in Paris",
        destination: "Paris",
        start_date: "2025-07-01",
        end_date: "2025-07-05",
        experiences: "Louvre and Seine cruise",
      },
    ]);

    const Screen = require("../app/itinerary").default;
    const { getByText } = render(<Screen />);

    await waitFor(() => {
      expect(getByText("Summer in Paris")).toBeTruthy();
      expect(getByText("Paris")).toBeTruthy();
      expect(getByText("Louvre and Seine cruise")).toBeTruthy();
    });
  });

  it("deletes a trip when confirmed", async () => {
    getAllAsyncMock.mockResolvedValue([
      {
        id: 7,
        title: "Desert Journey",
        destination: "Jaipur",
        start_date: null,
        end_date: null,
        experiences: null,
      },
    ]);

    const Screen = require("../app/itinerary").default;
    const { getByLabelText, getByText } = render(<Screen />);

    await waitFor(() => expect(getByText("Desert Journey")).toBeTruthy());
    fireEvent.press(getByLabelText("Delete Desert Journey"));

    const [, , actions] = alertSpy.mock.calls[0];
    const confirm = actions?.find((action: any) => action.text === "Delete");
    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(runAsyncMock).toHaveBeenCalledWith("DELETE FROM itineraries WHERE id=?", [7]);
  });

  it("shows the empty state when no trips are saved", async () => {
    const Screen = require("../app/itinerary").default;
    const { getByText } = render(<Screen />);

    await waitFor(() => {
      expect(getByText("No itineraries yet")).toBeTruthy();
      expect(getByText("Add your first trip using the form above.")).toBeTruthy();
    });
  });
});
