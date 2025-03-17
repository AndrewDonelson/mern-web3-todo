// file: ./client/src/App.test.js
// description: This file tests the main component for the client application.
// module: client
// author: Andrew Donelson
// license: MIT
// copyright: 2025, Andrew Donelson
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
