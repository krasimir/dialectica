/** @jsx A */
import { createStore, applyMiddleware } from 'redux';
import { A, run, Redux } from '../../../';

const {
  middleware,
  Subscribe,
  SubscribeOnce,
  Inspect,
  Action,
  Select,
  reset
} = Redux;

const delay = (d = 10) => new Promise(done => setTimeout(done, d));
const setup = (initialState = {}, reducer = s => s) => {
  return createStore(reducer, initialState, applyMiddleware(middleware));
}

describe('Given the Redux integration', () => {
  beforeEach(() => {
    reset();
  });
  describe('when using the Subscribe element', () => {
    it('should subscribe to a Redux action', async () => { 
      const store = setup(
        { answer: null },
        (state, action) => (action.type === 'ANSWER' ? { answer: action.value } : state)
      );
      const Z = jest.fn();
      
      await run(
        <Subscribe type='ANSWER'>
          {
            action => {
              return <Z value={ action.value } />
            }
          }
        </Subscribe>
      );

      store.dispatch({ type: 'ANSWER', value: 100 });
      store.dispatch({ type: 'ANOTHER_ANSWER' });
      store.dispatch({ type: 'ANSWER', value: 200 });

      await delay();

      expect(Z).toHaveBeenCalledTimes(2);
      expect(Z).toBeCalledWith(expect.objectContaining({ value: 200 }));
      expect(Z).toBeCalledWith(expect.objectContaining({ value: 100 }));
    });
  });
  describe('when using the SubscribeOnce element', () => {
    it('should subscribe to a Redux action only once', async () => { 
      const store = setup(
        { answer: null },
        (state, action) => (action.type === 'ANSWER' ? { answer: action.value } : state)
      );
      const Z = jest.fn();
      const B = jest.fn();
      const C = jest.fn();
      
      await run(
        <A>
          <SubscribeOnce type='FOO' />
          <SubscribeOnce type='ZAR'>
            {
              action => {
                return <C { ...action } />
              }
            }
          </SubscribeOnce>
          <SubscribeOnce type='ANSWER' exports='data'>
            {
              ({ value }) => (
                <A>
                  <Z value={ value } />
                  <Inspect>{ ({ numOfSubscribes }) => <B numOfSubscribes={ numOfSubscribes } /> }</Inspect>
                </A>
              )
            }
          </SubscribeOnce>
          <SubscribeOnce type='BAR' />
        </A>
      );

      store.dispatch({ type: 'ANSWER', value: 100 });
      store.dispatch({ type: 'ANOTHER_ANSWER' });
      store.dispatch({ type: 'ANSWER', value: 200 });
      store.dispatch({ type: 'ZAR', foo: 'bar' });

      await delay();

      expect(Z).toHaveBeenCalledTimes(1);
      expect(Z).toBeCalledWith(expect.objectContaining({ value: 100 }));
      expect(B).toBeCalledWith(expect.objectContaining({ numOfSubscribes: 2 }));
      expect(C).toBeCalledWith(expect.objectContaining({ type: 'ZAR', foo: 'bar' }));
    });
  });
  describe('when using the Action element', () => {
    it('should dispatch an action', async () => {
      const store = setup(
        { counter: 0 },
        (state, action) => (action.type === 'INCREASE' ? { counter: state.counter + action.n } : state)
      );
      const Z = () => 2;
      
      await run(
        <A>
          <Z exports='amount' />
          <Action type='INCREASE' $amount='n'/>
          <Action type='INCREASE' $amount='n'/>
          <Action type='INCREASE' n={10}/>
        </A>
      );

      expect(store.getState().counter).toBe(14);
    });
  });
  describe('when using the Select element', () => {
    it('should get the data from the store', async () => {
      const store = setup(
        { user: { age: 40 } }
      );
      const Z = jest.fn();
      const selector = function (state) {
        return state.user.age;
      }
      
      await run(
        <A>
          <Select selector={ selector } exports='age' />
          <Z $age />
        </A>
      );

      expect(Z).toBeCalledWith(expect.objectContaining({ age: 40 }));
    });
    describe('and we have parameterized selector', () => {
      it('should get the data from the store', async () => {
        const store = setup(
          { user: { age: 40 } }
        );
        const Z = () => 50;
        const B = jest.fn();
        const IsItOver = ({ over }) => ({ user }) => {
          return user.age > over;
        }
        
        await run(
          <A>
            <Z exports='over'/>
            <Select selector={ <IsItOver $over /> } exports='answer' />
            <B $answer />
          </A>
        );
  
        expect(B).toBeCalledWith(expect.objectContaining({ answer: false }));
      });
    });
  });
});