import { terser } from "rollup-plugin-terser";
import merge from 'deepmerge';

const dev = {
    input: 'src/index.js',
    external: [
        'jquery'
    ],
    output: {
        name: 'HeroMultirangeslider',
        file: 'dist/hero-multirangeslider.js',
        format: 'iife',
        globals: {
            'jquery': '$'
        }
    }
}

const prod = merge(dev, {
    output: {
        file: 'dist/hero-multirangeslider.min.js'
    },
    plugins: [terser()]
});

export default [dev, prod];