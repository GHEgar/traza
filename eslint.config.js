import base from '@ghegar/eslint-config';
import ts from '@ghegar/eslint-config/ts';

export default [
    { ignores: ['demo-dist/', 'test-results/'] },
    ...base,
    ...ts,
];
