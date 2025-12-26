import { render, screen, fireEvent, act } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog - Robust', () => {
    const defaultProps = {
        isOpen: true,
        title: 'Confirm Delete',
        message: 'Are you sure?',
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render anything when isOpen is false', () => {
        const { container } = render(<ConfirmDialog {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render title and message correctly', () => {
        render(<ConfirmDialog {...defaultProps} />);
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should call onConfirm when the confirm/delete button is clicked', () => {
        render(<ConfirmDialog {...defaultProps} />);
        const confirmBtn = screen.getByRole('button', { name: /delete|confirm/i });
        fireEvent.click(confirmBtn);
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when the cancel button is clicked', () => {
        render(<ConfirmDialog {...defaultProps} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when the backdrop is clicked', () => {
        render(<ConfirmDialog {...defaultProps} />);
        // The backdrop is the parent of the dialog element
        fireEvent.click(screen.getByRole('dialog').parentElement);
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should close on Escape key', () => {
        render(<ConfirmDialog {...defaultProps} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should detect danger type based on title', () => {
        render(<ConfirmDialog {...defaultProps} title="Archive Item" />);
        // Checking for the SVG or red classes might be too implementation-specific, 
        // but it should render "Delete" if it's danger-like
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render "Confirm" if not danger', () => {
        render(<ConfirmDialog {...defaultProps} title="Normal Title" type="info" />);
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should trap focus (Shift+Tab from first to last)', async () => {
        render(<ConfirmDialog {...defaultProps} />);
        const buttons = screen.getAllByRole('button');
        const first = buttons[0]; // Cancel
        const last = buttons[1];  // Delete

        first.focus();
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        // In JSDOM, we need to manually trigger the focus trap logic since real focus doesn't always flow
        // The component attaches a listener to document for 'keydown'
        expect(document.activeElement).toBe(last);
    });

    it('should trap focus (Tab from last to first)', async () => {
        render(<ConfirmDialog {...defaultProps} />);
        const buttons = screen.getAllByRole('button');
        const first = buttons[0];
        const last = buttons[1];

        last.focus();
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
        expect(document.activeElement).toBe(first);
    });
});
