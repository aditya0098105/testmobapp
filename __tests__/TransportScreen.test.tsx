import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Linking } from "react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

const { useLocalSearchParams } = require("expo-router");
const useLocalSearchParamsMock = useLocalSearchParams as jest.Mock;

const openUrlSpy = jest.spyOn(Linking, "openURL").mockResolvedValue();

describe("Transport screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows transport modes for a known city", () => {
    useLocalSearchParamsMock.mockReturnValue({ cityId: "tokyo" });
    const Screen = require("../app/city/[cityId]/transport").default;

    const { getByText } = render(<Screen />);

    expect(getByText("🚍 Transportation in Tokyo")).toBeTruthy();
    expect(getByText("Shinkansen (Bullet Train)")).toBeTruthy();

    fireEvent.press(getByText("🌐 More info on Tokyo transport"));
    expect(openUrlSpy).toHaveBeenCalledWith("https://www.japan-guide.com/e/e2017.html");
  });

  it("falls back to the empty state for unknown cities", () => {
    useLocalSearchParamsMock.mockReturnValue({ cityId: "atlantis" });
    const Screen = require("../app/city/[cityId]/transport").default;

    const { getByText } = render(<Screen />);
    expect(getByText("No transport info available.")).toBeTruthy();
  });
});
