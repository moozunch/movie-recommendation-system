import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SelectedMovieCard } from '@/components/selected-movie-card';

const sampleMovie = {
  id: 1,
  title: 'Interstellar',
  year: 2014,
  poster_path: null,
  vote_average: 8.6,
};

describe('SelectedMovieCard component', () => {
  it('renders title, year, and rating', () => {
    const onRemove = () => {};
    render(<SelectedMovieCard movie={sampleMovie} onRemove={onRemove} />);

    expect(screen.getByText('Interstellar')).toBeInTheDocument();
    expect(screen.getByText('2014')).toBeInTheDocument();
    expect(screen.getByText('8.6')).toBeInTheDocument();
  });

  it('triggers onRemove when clicking remove button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<SelectedMovieCard movie={sampleMovie} onRemove={onRemove} />);

    const btn = screen.getByRole('button', { name: /remove movie/i });
    await user.click(btn);

    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
