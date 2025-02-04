import {createDeferred, PromiseUtils, promisifyEvent, promisifyMarker, promisifyTimeout, rejectPromise, resolvePromise, tryUntil} from '../promise';

describe('promise utils', () => {
  beforeAll(() =>  jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  describe('promise chain', () => {
    test('resolve', () => {
      const payload = Symbol();
      return expect(Promise.reject(payload).catch(resolvePromise)).resolves.toBe(payload);
    });
    test('reject', () => {
      const payload = Symbol();
      return expect(Promise.resolve(payload).then(rejectPromise)).rejects.toBe(payload);
    });
  });

  describe('deferred', () => {
    test('resolve', () => {
      const def$$ = createDeferred();
      def$$.resolve(1);
      return def$$.promise.then((n) => expect(n).toBe(1));
    });
    test('reject', () => {
      const def$$ = createDeferred();
      def$$.reject(1);
      return def$$.promise.catch((n) => expect(n).toBe(1));
    });
  });

  describe('promisifyTimeout', () => {
    test('promisifyTimeout', () => {
      const resCb = jest.fn();
      const rejCb = jest.fn();

      const promise$ = promisifyTimeout(100, true);
      promise$.then(resCb, rejCb);

      jest.advanceTimersByTime(50);
      expect(resCb).not.toBeCalled();
      expect(rejCb).not.toBeCalled();
      jest.advanceTimersByTime(100);

      return expect(promise$).resolves.toBe(true);
    });
  });

  describe('promisifyEvent', () => {
    test('simple', () => {
      const el = document.createElement('div');
      const promise$ = promisifyEvent(el, 'test');
      el.dispatchEvent(new CustomEvent('test'));
      return expect(promise$.then((e) => e.type)).resolves.toBe('test');
    });
    test('timeout', () => {
      const el = document.createElement('div');
      const promise$ = promisifyEvent(el, 'test', 10);
      jest.advanceTimersByTime(100);
      return expect(promise$).rejects.toBeInstanceOf(Error);
    });
  });

  describe('promisifyMarker', () => {
    test('attribute', () => {
      const el = document.createElement('div');
      (el as any).test = true;
      const promise$ = promisifyMarker(el, 'test');
      return expect(promise$).resolves.toBe(el);
    });

    test('event', () => {
      const el = document.createElement('div');
      const promise$ = promisifyMarker(el, 'test');
      jest.advanceTimersByTime(50);
      el.dispatchEvent(new CustomEvent('test'));
      return expect(promise$).resolves.toBe(el);
    });
  });

  describe('tryUntil', () => {
    test.each([
      [(): any => undefined],
      [(): any => {throw new Error();}]
    ])('successful ( %s )', (testFn) => {
      const observedFn = jest.fn(testFn);
      const successFn = jest.fn();
      const promise$ = tryUntil(observedFn, 3, 100);
      promise$.then(successFn);

      expect(observedFn).toBeCalled();
      expect(successFn).not.toBeCalled();

      jest.advanceTimersByTime(110);

      expect(observedFn).toBeCalledTimes(2);
      expect(successFn).not.toBeCalled();

      observedFn.mockReturnValue(true);
      jest.advanceTimersByTime(110);

      return expect(promise$).resolves.toBe(true);
    });

    test('failed (() => false)', () => {
      const promise$ = tryUntil(() => false, 3, 100);
      jest.advanceTimersByTime(500);
      return expect(promise$).rejects.toBeTruthy();
    });
  });

  test('PromiseUtils wrapper', () => {
    expect(PromiseUtils.fromEvent).toBe(promisifyEvent);
    expect(PromiseUtils.fromTimeout).toBe(promisifyTimeout);
    expect(PromiseUtils.fromMarker).toBe(promisifyMarker);

    expect(PromiseUtils.deferred).toBe(createDeferred);
    expect(PromiseUtils.tryUntil).toBe(tryUntil);

    expect(PromiseUtils.resolve).toBe(resolvePromise);
    expect(PromiseUtils.reject).toBe(rejectPromise);
  });
});
