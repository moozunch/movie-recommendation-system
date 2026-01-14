import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import React from 'react';
import { MovieSearch } from '@/components/movie-search';

function mockFetchResults(count: number) {
  return {
    results: Array.from({ length: count }).map((_, i) => ({
      id: i + 1,
      title: `Movie ${i + 1}`,
      year: 2000 + i,
      poster_path: null,
      vote_average: 7.5,
    })),
  };
}

describe('MovieSearch component', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => mockFetchResults(3),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders input and performs debounced search', async () => {
    const onSelectMovie = vi.fn();
    render(<MovieSearch onSelectMovie={onSelectMovie} placeholder="Search for a movie" />);

    const input = screen.getByPlaceholderText(/search for a movie/i);
    fireEvent.change(input, { target: { value: 'Inception' } });

    // ensure fetched items render
    expect(await screen.findByText('Movie 1')).toBeInTheDocument();
  });

  it('calls onSelectMovie when item is selected', async () => {
    const onSelectMovie = vi.fn();
    render(<MovieSearch onSelectMovie={onSelectMovie} placeholder="Search for a movie" />);

    const input = screen.getByPlaceholderText(/search for a movie/i);
    fireEvent.change(input, { target: { value: 'Inception' } });
    // wait for items to render after debounce and fetch
    await screen.findByText('Movie 1');

    const item = await screen.findByText('Movie 1');
    fireEvent.click(item);

    expect(onSelectMovie).toHaveBeenCalledTimes(1);
    expect(onSelectMovie.mock.calls[0][0]).toMatchObject({ title: 'Movie 1' });
  });
});
