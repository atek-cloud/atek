import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'

export default {
    input: 'index.jsx',
    output: {
        file: 'index.build.js',
        format: 'iife'
    },
    plugins: [
        json(),
        commonjs(),
        nodePolyfills(),
        resolve({browser: true, preferBuiltins: false, extensions: ['.jsx', '.js', '.tsx']}),
        babel({
            extensions: ['.jsx', '.js', '.tsx'], 
            exclude: 'node_modules/**'
        })
    ]
};