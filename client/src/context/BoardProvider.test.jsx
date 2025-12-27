import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BoardProvider, useBoardContext } from './BoardProvider';

// Mock storage
jest.mock('../services/storage');

// Mock useOfflineSync
jest.mock('../hooks/useOfflineSync', () => ({
    useOfflineSync: jest.fn(() => ({
        syncStatus: 'idle',
        pendingCount: 0,
        conflicts: [],
        resolveConflict: jest.fn(),
    })),
}));

const TestComponent = () => {
    const { board, loading, error } = useBoardContext();

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <div data-testid="board-title">{board?.title || 'No Board'}</div>
            <div data-testid="columns-count">{board?.columns?.length || 0}</div>
        </div>
    );
};

describe('BoardProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    test('provides board context to children', async () => {
        render(
            <BoardProvider>
                <TestComponent />
            </BoardProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('board-title')).toBeInTheDocument();
    });

    test('handles loading state', () => {
        render(
            <BoardProvider>
                <TestComponent />
            </BoardProvider>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('initializes with empty board', async () => {
        render(
            <BoardProvider>
                <TestComponent />
            </BoardProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('columns-count')).toHaveTextContent('0');
    });
});