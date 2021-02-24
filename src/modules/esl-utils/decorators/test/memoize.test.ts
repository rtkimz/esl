import {memoize} from '../memoize';

describe('common @memoize decorator test', () => {
  describe('accessor', () => {
    const fn = jest.fn();
    class TestClass {
      @memoize()
      get test() {
        return fn(this);
      }
    }
    const instance = new TestClass();

    test('cache / clear', () => {
      fn.mockReturnValue(NaN);
      expect(instance.test).toBe(NaN);
      expect(instance.test).toBe(NaN);
      expect(fn).toBeCalledTimes(1);

      memoize.clear(instance, 'test');
      expect(instance.test).toBe(NaN);
      expect(fn).toBeCalledTimes(2);
    });
  });

  describe('static accessor', () => {
    const fn = jest.fn();
    class TestClass {
      @memoize()
      static get test() {
        return fn();
      }
    }

    test('cache / clear', () => {
      fn.mockReturnValue(NaN);
      expect(TestClass.test).toBe(NaN);
      expect(TestClass.test).toBe(NaN);
      expect(fn).toBeCalledTimes(1);

      memoize.clear(TestClass, 'test');
      expect(TestClass.test).toBe(NaN);
      expect(fn).toBeCalledTimes(2);
    });
  });

  describe('cache / clear', () => {
    const fn = jest.fn();
    class TestClass {
      @memoize()
      test() {
        return fn();
      }
    }
    const instance = new TestClass();

    test('cache / clear', () => {
      fn.mockReturnValue('a');
      expect(instance.test()).toBe('a');
      expect(instance.test()).toBe('a');
      expect(fn).toBeCalledTimes(1);

      memoize.clear(instance, 'test');
      expect(instance.test()).toBe('a');
      expect(instance.test()).toBe('a');
      expect(fn).toBeCalledTimes(2);
    });
  });

  describe('static method', () => {
    const fn = jest.fn();
    class TestClass {
      @memoize()
      static test() {
        return fn();
      }
    }

    test('cache / clear', () => {
      fn.mockReturnValue('a');
      expect(TestClass.test()).toBe('a');
      expect(TestClass.test()).toBe('a');
      expect(fn).toBeCalledTimes(1);

      memoize.clear(TestClass, 'test');
      expect(TestClass.test()).toBe('a');
      expect(TestClass.test()).toBe('a');
      expect(fn).toBeCalledTimes(2);
    });
  });

  describe('cashed result instance check', () => {
    class A {}

    class TestClass {
      @memoize() get test() { return new A(); }

      @memoize()
      static get test() { return new A() }
    }

    const instance1 = new TestClass();
    const instance2 = new TestClass();

    test('accessor', () => {
      const res1 = instance1.test;
      const res2 = instance1.test;
      const res3 = instance2.test;

      expect(res1).toBe(res2);
      expect(res1).not.toBe(res3);
    });

    test('static accessor', () => {
      const res1 = TestClass.test;
      const res2 = TestClass.test;

      expect(res1).toBe(res2);
    });
  });

  test('deprecated target',  () => {
    expect(function() {
      class TestClass {
        // @ts-ignore
        @memoize()
        test = 'a';
      }
      new TestClass();
    }).toThrowError();
  });
});
