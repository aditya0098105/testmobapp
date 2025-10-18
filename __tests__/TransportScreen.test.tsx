import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

const { useLocalSearchParams } = require("expo-router");
const useLocalSearchParamsMock = useLocalSearchParams as jest.Mock;

describe("Transport screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows London transport options", () => {
    useLocalSearchParamsMock.mockReturnValue({ cityId: "london" });
    const Screen = require("../app/city/[cityId]/transport").default;

    const { getByText, queryByText } = render(<Screen />);

    expect(getByText("🚍 Transportation in London")).toBeTruthy();
    expect(getByText("Underground (Tube)")).toBeTruthy();
    expect(getByText("Buses")).toBeTruthy();
    expect(getByText("Overground")).toBeTruthy();
    expect(queryByText("No transport info available.")).toBeNull();
  });

  it("falls back when the city is unknown", () => {
    useLocalSearchParamsMock.mockReturnValue({ cityId: "atlantis" });
    const Screen = require("../app/city/[cityId]/transport").default;

    const { getByText } = render(<Screen />);
    expect(getByText("No transport info available.")).toBeTruthy();
  });
});
