import { expect } from 'chai';

import * as helpers from './helpers';

import { __RewireAPI__ as __Rewire__ } from './helpers';

describe('Helper Functions', () => {
    describe('assert function', () => {

        it('should be a function', () => {
            expect(helpers.assert).to.be.a('function');
        });

        it('should throw a detailed error in development', () => {
            process.env.NODE_ENV = 'development';
            expect(() => helpers.assert(false, 'message')).to.throw(TypeError, 'message');
        });

        it('should throw generic error in production', () => {
            process.env.NODE_ENV = 'production';
            expect(() => helpers.assert(false, 'message')).to.throw(TypeError, '');
        });

        it('should throw when assertion is false', () => {
            expect(() => helpers.assert(false, 'message')).to.throw(TypeError);
        });

        it('should not throw when assertion is true', () => {
            expect(() => helpers.assert(true, 'message')).to.not.throw();
        });

        after(() => {
            process.env.NODE_ENV = 'test';
        });
    });

    describe('getAvailableErrorProps function', () => {
        before(() => {
            __Rewire__.__Rewire__('pickTruthy', () => []);
        });

        it('should be a function', () => {
            expect(helpers.getAvailableErrorProps).to.be.a('function');
        });

        it('should return an array', () => {
            expect(helpers.getAvailableErrorProps()).to.be.an('array');
        });

        after(() => {
            __Rewire__.__ResetDependency__('pickTruthy');
        });
    });

    describe('getGlobalNamespace function', () => {
        it('should be a function', () => {
            expect(helpers.getGlobalNamespace).to.be.a('function');
        });

        it('should return the global object', () => {
            // Since tests are run on node, global object is global
            expect(helpers.getGlobalNamespace()).to.deep.equal(global);
        });

        it('should return the window object', () => {
            global.window = { a: 1 };
            expect(helpers.getGlobalNamespace()).to.deep.equal({ a: 1 });
            delete global.window;
        });

        it('should return the self object', () => {
            global.self = { a: 1 };
            expect(helpers.getGlobalNamespace()).to.deep.equal({ a: 1 });
            delete global.self;
        });
    });

    describe('isError', () => {
        it('should be a function', () => {
            expect(helpers.isError).to.be.a('function');
        });

        it('should return true when it recives an error', () => {
            expect(helpers.isError(new Error())).to.be.true;
            expect(helpers.isError(new TypeError())).to.be.true;
        });

        it('should return true when it recive an exception', () => {
            const toString = { call: () => '[object Exception]' };
            const originalToString = global.toString;
            global.toString = toString;

            expect(helpers.isError()).to.be.true;
            global.toString = originalToString;
        });

        it('should return true when it recive an exception', () => {
            const toString = { call: () => '[object DOMException]' };
            const originalToString = global.toString;
            global.toString = toString;

            expect(helpers.isError()).to.be.true;
            global.toString = originalToString;
        });

        it('should return false when it doesnt recive an error', () => {
            expect(helpers.isError(x => x)).to.be.false;
            expect(helpers.isError([])).to.be.false;
            expect(helpers.isError({ a: 1 })).to.be.false;
        });
    });

    describe('patterns array', () => {
        it('should be an array', () => {
            expect(helpers.patterns).to.be.an('array');
        });

        it('should have length 6', () => {
            expect(helpers.patterns).to.have.length(6);
        });

        it('should contain only RegExs', () => {
            helpers.patterns.forEach(pattern => {
                expect(toString.call(pattern)).to.equal('[object RegExp]');
            });
        });
    });

    describe('pickTruthy function', () => {
        it('should be a function', () => {
            expect(helpers.pickTruthy).to.be.a('function');
        });

        it('should return only truthy props', () => {
            const testObj = { a: true, b: false, c: true };
            expect(helpers.pickTruthy(testObj)).to.deep.equal(['a', 'c']);
        });
    });
});
