import { render, screen } from '@testing-library/react';
import { BoardProvider } from '../context/BoardProvider';
import Board from './Board';

// Mock child components
jest.mock('./ListColumn', () => () => <div>Mocked ListColumn</div>);
jest.mock('./InputDialog', () => () => <div>Mocked InputDialog</div>);
jest.mock('./ConfirmDialog', () => () => <div>Mocked ConfirmDialog</div>);

// Mock storage
jest.mock('../services/storage', () => ({
    loadBoard: jest.fn(() => Promise.resolve({
        columns: [{ id: '1', title: 'Col1', cards: [] }]
    })),
    saveList: jest.fn(),
    saveCard: jest.fn(),
    deleteCard: jest.fn(),
    getQueue: jest.fn(() => []),
}));

// Mock localStorage
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};

describe('Board component', () => {
    test('renders Board with children', async () => {
        render(
            <BoardProvider>
                <Board />
            </BoardProvider>
        );

        expect(await screen.findByText('Mocked ListColumn')).toBeInTheDocument();
        expect(screen.getByText('Mocked InputDialog')).toBeInTheDocument();
        expect(screen.getByText('Mocked ConfirmDialog')).toBeInTheDocument();
    });
});
