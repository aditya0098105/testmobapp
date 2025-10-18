import { fireEvent, render } from "@testing-library/react-native";

// ✅ Mock expo-router
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ cityId: "test-city", hotel: "Test Hotel", city: "Test City" }),
}));

// ✅ Mock db correctly (path fixed)
jest.mock("../lib/db", () => ({
  db: { runAsync: jest.fn() },
}));

import BookHotel from "../app/city/[cityId]/book";

describe("BookHotel screen", () => {
  it("updates the name input when text is entered", () => {
    const { getByPlaceholderText } = render(<BookHotel />);
    const nameInput = getByPlaceholderText("Your name");

    fireEvent.changeText(nameInput, "Aditya");
    expect(nameInput.props.value).toBe("Aditya");
  });

  it("renders the confirm booking button", () => {
    const { getByText } = render(<BookHotel />);
    expect(getByText("Confirm booking")).toBeTruthy();
  });
});
