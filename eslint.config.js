const globals = require('globals');

// Les scripts du navigateur partagent l'espace global : no-unused-vars/no-undef sont donc assouplis.
module.exports = [
    {
        files: ['js/**/*.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, jspdf: 'readonly', mammoth: 'readonly' } },
        rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'no-redeclare': 'off',
            'no-eval': 'error',
            'no-new-func': 'error',
            'no-implied-eval': 'error',
            eqeqeq: ['warn', 'smart'],
            'no-empty': ['warn', { allowEmptyCatch: false }]
        }
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } }
    }
];
