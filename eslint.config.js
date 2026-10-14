import base from '@npmegar/eslint-config';
import ts from '@npmegar/eslint-config/ts';

export default [
    { ignores: ['demo-dist/'] },
    ...base,
    ...ts,
];
