import * as React from 'react';
import '@testing-library/jest-dom';
import { render, RenderResult } from '@testing-library/react';
import Home from '../../../pages/index';

describe('Render Index Home Correctly', () => {
    let component: RenderResult;
    beforeEach(() => {
        component = render(<Home />, {});
    });

    it('should render the home page correctly', () => {
        expect(component).toMatchSnapshot();
    });
});
