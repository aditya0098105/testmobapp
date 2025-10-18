import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock("react-native-maps", () => ({
  __esModule: true,
  default: () => null,
  Marker: () => null,
}));

const { useLocalSearchParams } = require("expo-router");
const useLocalSearchParamsMock = useLocalSearchParams as jest.Mock;

const { CITY_DATA } = require("../app/city/[cityId]/index");
const originalLondonEvents = [...(CITY_DATA.london.events || [])];

describe("Events screen", () => {
  afterEach(() => {
    CITY_DATA.london.events = [...originalLondonEvents];
  });

  it("renders event cards for a city with events", () => {
    useLocalSearchParamsMock.mockReturnValue({ cityId: "london" });
    const Screen = require("../app/city/[cityId]/events").default;

    const { getByText } = render(<Screen />);

    expect(getByText("Events in London")).toBeTruthy();
    expect(getByText("Royal Albert Concert")).toBeTruthy();
  });

  it("shows an empty state when the city has no events", () => {
    CITY_DATA.london.events = [];
    useLocalSearchParamsMock.mockReturnValue({ cityId: "london" });
    const Screen = require("../app/city/[cityId]/events").default;

    const { getByText } = render(<Screen />);

    expect(getByText("Events in London")).toBeTruthy();
    expect(getByText("We don’t have any happenings right now. Check back soon!")).toBeTruthy();
  });
});
