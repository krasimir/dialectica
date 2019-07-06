/** @jsx A */

import { A, run, Fragment, processor, useChildren, useReducer, usePubSub, useProduct } from '../';
import { delay, exerciseTree } from '../__helpers__/utils';

describe('Given the ActML library', () => {
  describe('when we use bunch of hooks', () => {
    it('should work :)', async () => {
      const reducer = (state, action) => {
        return state + 1;
      };
      const Computer = async function () {
        const [ children ] = useChildren();
        const [ numOfKeyPressed, pressed ] = useReducer(reducer, 0);
        const { subscribe } = usePubSub();
        const [ setProduct ] = useProduct();

        subscribe('keyup', (key) => {
          pressed(numOfKeyPressed + 1);
          setProduct(numOfKeyPressed + 1);
        });
        setProduct(numOfKeyPressed);
        children();
      };
      const Keyboard = function () {
        const { subscribe, publish } = usePubSub();

        subscribe('hit', key => publish('keyup', key));
      };
      const Button = function ({ timeout, letter }) {
        const { publish } = usePubSub();

        delay(timeout, () => publish('hit', letter));
      };
      const Print = jest.fn();

      const el = (
        <Fragment>
          <Computer exports='hits'>
            <Print $hits />
          </Computer>
          <Keyboard>
            <Button timeout={ 10 } letter='a' />
            <Button timeout={ 15 } letter='b' />
            <Button timeout={ 20 } letter='c' />
          </Keyboard>
        </Fragment>
      );

      await run(el);
      await delay(40);
      exerciseTree(processor, `
        Fragment(1)
        Computer(4)
        mockConstructor(4)
        Keyboard(1)
        Button(1)
        Button(1)
        Button(1)
      `);
      expect(Print).toBeCalledTimes(4);
    });
  });
});