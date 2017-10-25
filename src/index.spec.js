import { expect } from 'chai';
import { spy, stub } from 'sinon';

import Vulture from './index';

describe('Vulture Class', () => {
    describe('Vulture constructor', () => {
        it('should create a new Vulture instance', () => {
            const myVulture = new Vulture();
            expect(myVulture).to.be.an.instanceOf(Vulture);
        });

        it('should initialize state', () => {
            const myVulture = new Vulture();
            expect(myVulture).to.have.property('state');
            expect(myVulture.state).to.have.property('subscribers').which.is.an('array');
            expect(myVulture.state).to.have.property('subCount').which.is.a('number');
            expect(myVulture.state).to.have.property('alive').which.is.a('boolean');
        });

        it('should initialize options with defaults', () => {
            const myVulture = new Vulture();
            expect(myVulture).to.have.property('options');
            expect(myVulture.options).to.have.property('purge', 'strict');
        });

        it('should initialize options with user preferences', () => {
            const myVulture = new Vulture({ purge: 'loose' });
            expect(myVulture).to.have.property('options');
            expect(myVulture.options).to.have.property('purge', 'loose');
        })

        it('should define all options as read-only', () => {
            const myVulture = new Vulture();
            expect(() => myVulture.options.purge = 'loose').to.throw(TypeError);
        });
    });

    describe('Vulture static isSensitive', () => {
        before(() => {
            Vulture.__Rewire__('patterns', [/sensitive/g, /sensitive/g]);
        });

        it('should be a static method', () => {
            expect(Vulture.isSensitive).to.be.a('function');
            expect(new Vulture().isSensitive).to.be.undefined;
        });

        it('should report sensitive strings', () => {
            expect(Vulture.isSensitive('sensitive')).to.be.true;
        });

        it('shouldnt report clean strings', () => {
            expect(Vulture.isSensitive('clean')).to.be.false;
        });

        after(() => {
            Vulture.__ResetDependency__('patterns');
        });
    });

    describe('Vulture static sanitize', () => {
        before(() => {
            Vulture.__Rewire__('patterns', [/sensitive/g]);
        });

        it('should be a static method', () => {
            expect(new Vulture().sanitize).to.be.undefined;
            expect(Vulture.sanitize).to.be.a('function');
        });

        it('should saniteze sensitive info', () => {
            expect(Vulture.sanitize('sensitive')).to.equal('############');
        });

        it('shouldnt mess with non-sesitive info', () => {
            expect(Vulture.sanitize('clean info')).to.equal('clean info');
        });

        after(() => {
            Vulture.__ResetDependency__('patterns');
        });
    });

    describe('Vulture bindToGlobal', () => {
        let myGlobal = {};

        before(() => {
            Vulture.__Rewire__('getGlobalNamespace', () => myGlobal);
        });

        it('should be a non-static method', () => {
            expect(Vulture.bindToGlobal).to.be.undefined;
            expect(new Vulture().bindToGlobal).to.be.a('function');
        });

        it('should create a global flag when bound', () => {
            new Vulture().bindToGlobal();
            expect(myGlobal).to.have.property('__VULTURE_IS_HOVERING__', true);
        });

        it('should add the listener to the onerror prop', () => {
            myGlobal = {};
            new Vulture().bindToGlobal();
            expect(myGlobal.onerror).to.be.a('function');
        });

        it('shouldt bind to global twice', () => {
            myGlobal = { __VULTURE_IS_HOVERING__: true };
                        let errored = false;
            Vulture.__Rewire__('assert', x => errored = !x);

            new Vulture().bindToGlobal();
            
            expect(errored).to.be.true;
            Vulture.__ResetDependency__('assert');
        });

        it('should report global erros', () => {
            myGlobal = {};

            Vulture.__Rewire__('assert', x => x);

            const myVulture = new Vulture();
            const mySpy = spy(myVulture, 'report');

            myVulture.bindToGlobal();
            myGlobal.onerror('a', 'b', 'c', 'd', 'e');

            const spyArgs = mySpy.getCall(0).args;

            expect(spyArgs[0]).to.equal('e');

            expect(spyArgs[1]).to.deep.equal({
                source: 'b',
                lineNumber: 'c',
                columnNumber: 'd'
            });

            Vulture.__ResetDependency__('assert');
        });

        after(() => {
            Vulture.__ResetDependency__('getGlobalNamespace');
        });
    });

    describe('Vulture unbindFromGlobal', () => {
        let myGlobal = {};

        before(() => {
            Vulture.__Rewire__('getGlobalNamespace', () => myGlobal);
        });

        it('should be a non-static method', () => {
            expect(Vulture.unbindFromGlobal).to.be.undefined;
            expect(new Vulture().unbindFromGlobal).to.be.a('function');
        });

        it('shouldt unbind if listener do not exists', () => {
            let errored = false;
            Vulture.__Rewire__('assert', x => errored = !x);

            new Vulture().unbindFromGlobal();

            expect(errored).to.be.true;
            Vulture.__ResetDependency__('assert');
        });

        it('should remove the flag from global namespace', () => {
            myGlobal = { __VULTURE_IS_HOVERING__: true };
            new Vulture().unbindFromGlobal();
            expect(myGlobal.__VULTURE_IS_HOVERING__).to.be.undefined;
        });

        it('should remove the listener from global namespace', () => {
            myGlobal = { __VULTURE_IS_HOVERING__: true, onerror: x => x };
            new Vulture().unbindFromGlobal();
            expect(myGlobal.onerror).to.be.null;
        });

        after(() => {
            Vulture.__ResetDependency__('getGlobalNamespace');
        });
    });

    describe('Vulture hover', () => {
        it('should be a non-static method', () => {
            expect(Vulture.hover).to.be.undefined;
            expect(new Vulture().hover).to.be.a('function');
        });

        it('should add a subscriber to the instance state', () => {
            const myVulture = new Vulture();
            const myFn = x => x;
            myVulture.hover(myFn);

            expect(myVulture.state.subscribers).to.have.length(1);
            expect(myVulture.state.subscribers[0]).to.equal(myFn);
            expect(myVulture.state.subCount).to.equal(1);
        });

        it('should return a unsubscriber function', () => {
            const myVulture = new Vulture();
            const result = myVulture.hover(x => x);
            expect(result).to.a('function');
        });

        it('should unsubscribe the listener', () => {
            const myVulture = new Vulture();
            myVulture.hover(x => x)();
            expect(myVulture.state.subscribers).to.have.length(0);
            expect(myVulture.state.subCount).to.equal(0);
        });
    });

    describe('Vulture report', () => {
        let isSensitiveStub;
        let sanitizeStub;

        before(() => {
            isSensitiveStub = stub(Vulture, 'isSensitive');
            sanitizeStub = stub(Vulture, 'sanitize');
            Vulture.__Rewire__('getAvailableErrorProps', () => ['name', 'message']);
        });

        it('should be a non-static method', () => {
            expect(Vulture.report).to.be.undefined;
            expect(new Vulture().report).to.be.a('function');
        });

        it('should report erros to all subscribers', () => {
            const mySpy = spy();
            const myVulture = new Vulture();
            myVulture.hover(mySpy);
            myVulture.report(new Error());

            expect(mySpy.calledOnce).to.be.true;
        });

        it('should not report erros with sensitive info', () => {
            isSensitiveStub.returns(true);

            const mySpy = spy();
            const myVulture = new Vulture();
            myVulture.hover(mySpy);
            myVulture.report(new Error());

            expect(mySpy.notCalled).to.be.true;

            isSensitiveStub.reset();
        });

        it('should blackline sensitive info when purge is loose', () => {
            isSensitiveStub.returns(true);
            sanitizeStub.returns('############');

            const mySpy = spy();
            const myVulture = new Vulture({ purge: 'loose' });

            myVulture.hover(mySpy);
            myVulture.report(new Error());

            expect(mySpy.calledOnce).to.be.true;
            expect(mySpy.getCall(0).args[0]).to.deep.equal({
                name: '############',
                message: '############',
            });

            isSensitiveStub.reset();
            sanitizeStub.reset();
        });

        it('should report the full error is its not sensitive', () => {
            isSensitiveStub.returns(false);

            const mySpy = spy();
            const myVulture = new Vulture();

            myVulture.hover(mySpy);
            myVulture.report(new TypeError());

            expect(mySpy.calledOnce).to.be.true;
            expect(mySpy.getCall(0).args[0]).to.deep.equal({ name: 'TypeError', message: '' });

            isSensitiveStub.reset();
        });

        it('should ignore sensitive info if purge is false', () => {
            isSensitiveStub.returns(true);

            const mySpy = spy();
            const myVulture = new Vulture({ purge: false });

            myVulture.hover(mySpy);
            myVulture.report(new RangeError());

            expect(mySpy.calledOnce).to.be.true;
            expect(mySpy.getCall(0).args[0]).to.deep.equal({ name: 'RangeError', message: '' });

            isSensitiveStub.reset();
        });

        after(() => {
            Vulture.__Rewire__('getAvailableErrorProps');
            isSensitiveStub.restore();
            sanitizeStub.restore();
        });
    });

    describe('Vulture wrap', () => {
        it('should be a non-static method', () => {
            expect(Vulture.wrap).to.be.undefined;
            expect(new Vulture().wrap).to.be.a('function');
        });

        it('should return a function', () => {
            expect(new Vulture().wrap(x => x)).to.be.a('function');
        });

        it('should report erros thrown be the function', () => {
            const myVulture = new Vulture();
            const myStub = stub(myVulture, 'report').returns();

            myVulture.wrap(() => { throw new TypeError('BOO'); })();

            expect(myStub.called).to.be.true;

            myStub.restore();
        });

        it('should return the value that the original fn returns', () => {
            const myVulture = new Vulture();
            expect(myVulture.wrap(() => 42)()).to.equal(42);
        });
    });

    describe('Vulture wrapCallback', () => {
        it('should be a non-static method', () => {
            expect(Vulture.wrapCallback).to.be.undefined;
            expect(new Vulture().wrapCallback).to.be.a('function');
        });

        it('should return a wrapped node-style callback function', () => {
            expect(new Vulture().wrapCallback(x => x)).to.be.a('function');
        });
    });

    describe('Vulture try', () => {
        it('should be a non-static method', () => {
            expect(Vulture.try).to.be.undefined;
            expect(new Vulture().try).to.be.a('function');
        });

        it('should wrap and call the given function', () => {
            const myVulture = new Vulture();
            const myStub = stub(myVulture, 'report');

            myVulture.try(() => { throw new TypeError(); });

            expect(myStub.called).to.be.true;
        });

        it('should return whatever the function returns', () => {
            const myVulture = new Vulture();
            expect(myVulture.try(() => 42)).to.equal(42);
        });
    });

    describe('Vulture tryCallback', () => {
        it('should be a non-static method', () => {
            expect(Vulture.tryCallback).to.be.undefined;
            expect(new Vulture().tryCallback).to.be.a('function');
        });

        it('should report erros if fn throws', () => {
            const myVulture = new Vulture();
            const mySpy = spy();
            const myStub = stub(myVulture, 'report').callsFake(mySpy);

            myVulture.tryCallback(() => { throw new Error(); }, mySpy);

            const cbArgs = mySpy.getCall(0).args;
            expect(cbArgs[0]).to.be.an('error');
            expect(cbArgs[1]).to.be.undefined;

            myStub.restore();
        });

        it('should pass along arguments correctly', () => {
            const myVulture = new Vulture();
            const mySpy = spy();

            myVulture.tryCallback(x => x, mySpy, 42);

            const cbArgs = mySpy.getCall(0).args;
            expect(cbArgs[0]).to.be.null;
            expect(cbArgs[1]).to.equal(42);
        });
    });

    describe('Vulture die method', () => {
        it('should be a non-static method', () => {
            expect(Vulture.die).to.be.undefined;
            expect(new Vulture().die).to.be.a('function');
        });

        it('should kill the instance', () => {
            const myVulture = new Vulture();
            myVulture.die();
            expect(myVulture.state).to.have.property('alive', false);
        });

        it('should throw when invoking methods on a dead instance', () => {
            const myVulture = new Vulture().die();
            expect(() => myVulture.hover(x => x)).to.throw();
        });
    })
});
