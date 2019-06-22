const resolveProp = (prop, parent, errorMessage, stack) => {
  if (prop in parent.scope) {
    return parent.scope[prop];
  } else if (parent.parent) {
    stack.push(parent.meta.name);
    return resolveProp(prop, parent.parent, errorMessage, stack);
  }
  stack.push(parent.meta.name);
  throw new Error(errorMessage + '\n\nStack:\n' + stack.reverse().map(n => `  <${ n }>`).join('\n'));
};

export default function getNormalizeProps(element) {
  const { props, propNames, name: elementName } = element.meta;

  if (!props) {
    return props;
  }

  propNames.forEach(propName => {
    if (propName.charAt(0) === '$') {
      delete props[propName];
      const cleanPropName = propName.substr(1, propName.length);

      props[cleanPropName] = resolveProp(
        cleanPropName,
        element.parent,
        `"${ cleanPropName }" prop requested by "${ elementName }" can not be found.`,
        [ elementName ]
      );
    }
  });
  return props;
};
