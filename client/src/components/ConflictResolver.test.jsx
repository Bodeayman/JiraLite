import { render, screen, fireEvent } from '@testing-library/react';
import ConflictResolver from './ConflictResolver';

const mockConflicts = [
    {
        id: 'conflict-1',
        local: { title: 'Local Title', description: 'Local desc' },
        server: { title: 'Server Title', description: 'Server desc' },
    },
];

describe('ConflictResolver', () => {
    it('should render conflict details', () => {
        render(
            <ConflictResolver
                conflicts={mockConflicts}
                onResolve={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        expect(screen.getByText(/sync conflict detected/i)).toBeInTheDocument();
        expect(screen.getByText('Local Title')).toBeInTheDocument();
        expect(screen.getByText('Server Title')).toBeInTheDocument();
    });

    it('should call onResolve with local when Keep Mine is clicked', () => {
        const mockOnResolve = jest.fn();
        render(
            <ConflictResolver
                conflicts={mockConflicts}
                onResolve={mockOnResolve}
                onCancel={jest.fn()}
            />
        );

        fireEvent.click(screen.getByText(/keep mine/i));
        expect(mockOnResolve).toHaveBeenCalledWith('conflict-1', 'local');
    });

    it('should call onResolve with server when Keep Theirs is clicked', () => {
        const mockOnResolve = jest.fn();
        render(
            <ConflictResolver
                conflicts={mockConflicts}
                onResolve={mockOnResolve}
                onCancel={jest.fn()}
            />
        );

        fireEvent.click(screen.getByText(/keep theirs/i));
        expect(mockOnResolve).toHaveBeenCalledWith('conflict-1', 'server');
    });

    it('should call onCancel when Cancel Sync is clicked', () => {
        const mockOnCancel = jest.fn();
        render(
            <ConflictResolver
                conflicts={mockConflicts}
                onResolve={jest.fn()}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByText(/cancel sync/i));
        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show conflict count', () => {
        render(
            <ConflictResolver
                conflicts={mockConflicts}
                onResolve={jest.fn()}
                onCancel={jest.fn()}
            />
        );

        expect(screen.getByText(/conflict 1 of 1/i)).toBeInTheDocument();
    });
});
