import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from './Card';

const mockCard = {
    id: '1',
    title: 'Test Card',
    description: 'Test Description',
    labels: [],
    dueDate: null,
};

describe('Card', () => {
    test('renders card title', () => {
        render(<Card card={mockCard} />);
        expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    test('renders card description', () => {
        render(<Card card={mockCard} />);
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
});
