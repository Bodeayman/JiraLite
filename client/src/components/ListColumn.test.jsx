import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ListColumn from './ListColumn';
import { BoardContext } from '../context/BoardProvider';

const mockColumn = {
    id: '1',
    title: 'Test Column',
    cards: [
        { id: 'card-1', title: 'Card 1', description: '', labels: [], dueDate: null },
        { id: 'card-2', title: 'Card 2', description: '', labels: [], dueDate: null },
    ],
};

const mockContext = {
    board: { columns: [mockColumn] },
    dispatch: jest.fn(),
    loading: false,
    error: null,
};

describe('ListColumn', () => {
    test('renders column title', () => {
        render(
            <BoardContext.Provider value={mockContext}>
                <ListColumn column={mockColumn} />
            </BoardContext.Provider>
        );

        expect(screen.getByText('Test Column')).toBeInTheDocument();
    });

    test('renders cards', () => {
        render(
            <BoardContext.Provider value={mockContext}>
                <ListColumn column={mockColumn} />
            </BoardContext.Provider>
        );

        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('Card 2')).toBeInTheDocument();
    });
});