import {PropTypes} from 'react';
import createConnector from '../core/createConnector';
import {omit, has} from 'lodash';

function getId() {
  return 'hitsPerPage';
}

function getIndex(context) {
  return context && context.multiIndexContext ? context.multiIndexContext.targettedIndex : context.ais.mainTargettedIndex;
}

function hasMultipleIndex(context) {
  return context && context.multiIndexContext;
}

function getCurrentRefinement(props, searchState, context) {
  const id = getId();
  const index = getIndex(context);
  const refinements = hasMultipleIndex(context) && has(searchState, `indices.${index}.${id}`)
    || !hasMultipleIndex(context) && has(searchState, id);
  if (refinements) {
    const subState = hasMultipleIndex(context) ? searchState.indices[index] : searchState;
    if (typeof subState[id] === 'string') {
      return parseInt(subState[id], 10);
    }
    return subState[id];
  }
  return props.defaultRefinement;
}

/**
 * connectHitsPerPage connector provides the logic to create connected
 * components that will allow a user to choose to display more or less results from Algolia.
 * @name connectHitsPerPage
 * @kind connector
 * @propType {number} defaultRefinement - The number of items selected by default
 * @propType {{value: number, label: string}[]} items - List of hits per page options.
 * @propType {function} [transformItems] - If provided, this function can be used to modify the `items` provided prop of the wrapped component (ex: for filtering or sorting items). this function takes the `items` prop as a parameter and expects it back in return.
 * @providedPropType {function} refine - a function to remove a single filter
 * @providedPropType {function} createURL - a function to generate a URL for the corresponding search state
 * @providedPropType {string} currentRefinement - the refinement currently applied
 * @providedPropType {array.<{isRefined: boolean, label?: string, value: number}>} items - the list of items the HitsPerPage can display. If no label provided, the value will be displayed.
 */
export default createConnector({
  displayName: 'AlgoliaHitsPerPage',

  propTypes: {
    defaultRefinement: PropTypes.number.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number.isRequired,
    })).isRequired,
    transformItems: PropTypes.func,
  },

  getProvidedProps(props, searchState) {
    const currentRefinement = getCurrentRefinement(props, searchState, this.context);
    const items = props.items.map(item => item.value === currentRefinement
      ? {...item, isRefined: true} : {...item, isRefined: false});
    return {
      items: props.transformItems ? props.transformItems(items) : items,
      currentRefinement,
    };
  },

  refine(props, searchState, nextRefinement) {
    const id = getId();
    const nextValue = {[id]: nextRefinement};
    const context = this.context;
    const index = getIndex(context);
    if (hasMultipleIndex(context)) {
      const state = has(searchState, `indices.${index}`)
        ? {...searchState.indices, [index]: {...searchState.indices[index], ...nextValue}}
        : {...searchState.indices, ...{[index]: nextValue}};
      return {...searchState, indices: state};
    } else {
      return {...searchState, ...nextValue};
    }
  },

  cleanUp(props, searchState) {
    const index = getIndex(this.context);
    return hasMultipleIndex(this.context)
      ? omit(searchState, `indices.${index}.${getId()}`)
      : omit(searchState, getId());
  },

  getSearchParameters(searchParameters, props, searchState) {
    return searchParameters.setHitsPerPage(getCurrentRefinement(props, searchState, this.context));
  },

  getMetadata() {
    return {id: getId()};
  },
});
