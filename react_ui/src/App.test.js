import React from "react";
import { render } from "@testing-library/react";
import App from "./OLMapUI";

test("renders Open Logistics Map", () => {
  const { getByText } = render(<App />);
  const heading = getByText(/open logistics map/i);
  expect(heading).toBeInTheDocument();
});
