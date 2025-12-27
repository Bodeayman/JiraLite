import { render } from '@testing-library/react';
import App from './App';
import { BoardProvider } from './context/BoardProvider';

test('renders learn react link', () => {
    render(
        <BoardProvider>
            <App />
        </BoardProvider>
    );




});
