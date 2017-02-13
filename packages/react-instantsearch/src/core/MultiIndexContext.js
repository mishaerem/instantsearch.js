import React, {PropTypes, Component, Children} from 'react';

class MultiIndexContext extends Component {
  getChildContext() {
    return {
      multiIndexContext: {
        targettedIndex: this.props.indexName,
      },
    };
  }

  render() {
    // see about root div later
    const childrenCount = Children.count(this.props.children);
    if (childrenCount === 0)
      return <div></div>;
    else
      return <div>{this.props.children}</div>;
  }
}

MultiIndexContext.propTypes = {
  // @TODO: These props are currently constant.
  indexName: PropTypes.string.isRequired,
  children: PropTypes.node,
};

MultiIndexContext.childContextTypes = {
  // @TODO: more precise widgets manager propType
  multiIndexContext: PropTypes.object.isRequired,
};

export default MultiIndexContext;
