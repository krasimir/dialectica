import Integration from './Integration';

function SubscribeOnce({ children, type }) {
  const { exports } = this.props;

  if (type) {
    const removeListener = Integration.addListener(action => {
      if (action.type === type) {
        children(action);
        removeListener();
      }
    });
  } else {
    throw new Error('<SubscribeOnce> requires `type` prop.');
  }
}
SubscribeOnce.ignoreChildren = true;

export default SubscribeOnce;
