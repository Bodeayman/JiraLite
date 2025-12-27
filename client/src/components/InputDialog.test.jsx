import { render, screen, fireEvent } from '@testing-library/react';
import InputDialog from './InputDialog';

describe('InputDialog - Robust', () => {
    const defaultProps = {
        isOpen: true,
        title: 'New List',
        message: 'Enter name',
        placeholder: 'List name...',
        initialValue: 'Initial',
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(<InputDialog {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render title, message and input with initial value', () => {
        render(<InputDialog {...defaultProps} />);
        expect(screen.getByText('New List')).toBeInTheDocument();
        expect(screen.getByText('Enter name')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('List name...');
        expect(input.value).toBe('Initial');
    });

    it('should update input value on change', () => {
        render(<InputDialog {...defaultProps} />);
        const input = screen.getByPlaceholderText('List name...');
        fireEvent.change(input, { target: { value: 'New Value' } });
        expect(input.value).toBe('New Value');
    });

    it('should call onConfirm with trimmed value and clear it', () => {
        render(<InputDialog {...defaultProps} />);
        const input = screen.getByPlaceholderText('List name...');
        fireEvent.change(input, { target: { value: '   Trim Me   ' } });
        fireEvent.click(screen.getByText('Confirm'));

        expect(defaultProps.onConfirm).toHaveBeenCalledWith('Trim Me');

        expect(input.value).toBe('');
    });

    it('should disable Confirm button when input is empty or whitespace', () => {
        render(<InputDialog {...defaultProps} initialValue="" />);
        const confirmBtn = screen.getByText('Confirm');
        expect(confirmBtn).toBeDisabled();

        const input = screen.getByPlaceholderText('List name...');
        fireEvent.change(input, { target: { value: '   ' } });
        expect(confirmBtn).toBeDisabled();

        fireEvent.change(input, { target: { value: 'valid' } });
        expect(confirmBtn).not.toBeDisabled();
    });

    it('should call onConfirm on Enter key', () => {
        render(<InputDialog {...defaultProps} />);
        const input = screen.getByPlaceholderText('List name...');
        fireEvent.change(input, { target: { value: 'Enter Press' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(defaultProps.onConfirm).toHaveBeenCalledWith('Enter Press');
    });

    it('should call onCancel on Escape key', () => {
        render(<InputDialog {...defaultProps} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should call onCancel on backdrop click', () => {
        render(<InputDialog {...defaultProps} />);

        fireEvent.click(screen.getByRole('dialog').parentElement);
        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should select text on open', () => {
        render(<InputDialog {...defaultProps} />);
        const input = screen.getByPlaceholderText('List name...');


        expect(document.activeElement).toBe(input);
    });
});
