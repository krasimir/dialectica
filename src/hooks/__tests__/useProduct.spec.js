/** @jsx A */

import { A, run } from '../../';

const delay = (ms, func) => new Promise(resolve => setTimeout(() => resolve(func()), ms));

describe('Given the ActML library', () => {
  describe('and we use the useProduct hook', () => {
    it('should provide a way to update the value', async () => {
      async function E({ useProduct }) {
        const [ setValue ] = useProduct('foo');

        await delay(20, () => setValue('bar'));
      };

      const C = jest.fn();

      await run(<E exports='bar'><C $bar/></E>);
      expect(C).toBeCalledWith(expect.objectContaining({ bar: 'bar' }));
    });
    it('should allow export and import', async () => {
      function E({ useProduct }) {
        const [ setValue ] = useProduct();

        return delay(20, () => setValue(42));
      }
      const B = () => {};
      const C = jest.fn();

      await run(
        <E exports='data'>
          <B>
            <C $data/>
          </B>
        </E>
      );

      expect(C).toBeCalledWith(expect.objectContaining({ data: 42 }));
    });
    it('should throw an error if the prop is not found', async () => {
      const Root = () => {};
      const E = () => {};
      const B = () => {};
      const C = function C() {};

      try {
      await run(
        <Root>
          <E>
            <B>
              <C $foobar/>
            </B>
          </E>
        </Root>
      );
      } catch (error) {
        expect(error.message).toBe(`"foobar" prop requested by "C" can not be found.

Stack:
  <Root>
  <E>
  <B>
  <C>`);
      }
    });
    it('should pass down undefined if that is the value of the scoped variable', async () => {
      async function E() {
        return await delay(100, () => {});
      }
      const C = jest.fn();

      await run(<E exports='user'><C $user/></E>);

      expect(C).toBeCalledWith(expect.objectContaining({ user: undefined }));
    });
    it('should throw an error if the value is not exported', async () => {
      function E({ useProduct }) {
        useProduct('foo');
      }

      const C = jest.fn();

      try {
        await run(<E><C $bar/></E>);
      } catch (error) {
        expect(error.message).toMatch('"bar" prop requested');
      }
    });
    it('should have our child re-run if the data is changed (binding)', async () => {
      var value = 2;

      async function E({ useProduct }) {
        let [ setValue ] = useProduct(value);

        await delay(20, () => (value = setValue(value * 2)));
        delay(10, () => (value = setValue(value * 2)));
        delay(30, () => (value = setValue(value * 2)));
        delay(20, () => (value = setValue(value * 2)));
      }

      const C = jest.fn();

      await run(
        <E exports='foo'>
          <C $foo/>
        </E>
      );

      await delay(200, () => {});

      expect(C).toBeCalledTimes(4);
      expect(C).toBeCalledWith(expect.objectContaining({ foo: 4 }));
      expect(C).toBeCalledWith(expect.objectContaining({ foo: 8 }));
      expect(C).toBeCalledWith(expect.objectContaining({ foo: 16 }));
      expect(C).toBeCalledWith(expect.objectContaining({ foo: 32 }));
    });
    it('should subscribe the dependent only once', async () => {
      var value = 1;
      const E = ({ useProduct }) => {
        useProduct(value);
        value += 1;
      };
      const D = jest.fn();
      const El = <E exports='foo'><D $foo/></E>;

      await El.run();
      await El.run();
      await El.run();
      await El.run();

      expect(D).toBeCalledTimes(4);
      expect(D).toBeCalledWith(expect.objectContaining({ foo: 1 }));
      expect(D).toBeCalledWith(expect.objectContaining({ foo: 2 }));
      expect(D).toBeCalledWith(expect.objectContaining({ foo: 3 }));
      expect(D).toBeCalledWith(expect.objectContaining({ foo: 4 }));
    });
  });
});
