// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock browser APIs required by mapbox-gl
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock mapbox-gl to avoid canvas and WebGL issues in Jest
jest.mock("mapbox-gl/dist/mapbox-gl", () => ({
  Map: jest.fn(),
}));
