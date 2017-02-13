import {PropTypes} from 'react';
import {omit, isEmpty, orderBy, has} from 'lodash';

import createConnector from '../core/createConnector';

const namespace = 'menu';

function getId(props) {
  return props.attributeName;
}

function getIndex(context) {
  return context && context.multiIndexContext ? context.multiIndexContext.targettedIndex : context.ais.mainTargettedIndex;
}

function hasMultipleIndex(context) {
  return context && context.multiIndexContext;
}

function getCurrentRefinement(props, searchState, context) {
  const id = getId(props);
  const index = getIndex(context);
  const refinements = hasMultipleIndex(context) && has(searchState, `indices.${index}.${namespace}.${id}`)
    || !hasMultipleIndex(context) && has(searchState, `${namespace}.${id}`);
  if (refinements) {
    const subState = hasMultipleIndex(context) ? searchState.indices[index][namespace] : searchState[namespace];
    if (subState[id] === '') {
      return null;
    }
    return subState[id];
  }
  if (props.defaultRefinement) {
    return props.defaultRefinement;
  }
  return null;
}

function getValue(name, props, searchState, context) {
  const currentRefinement = getCurrentRefinement(props, searchState, context);
  return name === currentRefinement ? '' : name;
}

function refine(props, searchState, nextRefinement, context) {
  const id = getId(props);
  const nextValue = {[id]: nextRefinement ? nextRefinement : ''};
  const index = getIndex(context);
  if (hasMultipleIndex(context)) {
    const state = has(searchState, `indices.${index}`)
      ? {...searchState.indices, [index]: {[namespace]: {...searchState.indices[index][namespace], ...nextValue}}}
      : {...searchState.indices, ...{[index]: {[namespace]: nextValue}}};
    return {...searchState, indices: state};
  } else {
    return {...searchState, [namespace]: {...searchState[namespace], ...nextValue}};
  }
}

function cleanUp(props, searchState, context) {
  const index = getIndex(context);
  const prefix = hasMultipleIndex(context) && searchState.indices ? `indices.${index}.${namespace}` : namespace;
  const cleanState = omit(searchState, `${prefix}.${getId(props)}`);
  if (isEmpty(cleanState[namespace])) {
    return omit(cleanState, namespace);
  }
  return cleanState;
}

const sortBy = ['count:desc', 'name:asc'];

/**
 * connectMenu connector provides the logic to build a widget that will
 * give the user tha ability to choose a single value for a specific facet.
 * @name connectMenu
 * @kind connector
 * @propType {string} attributeName - the name of the attribute in the record
 * @propType {boolean} [showMore=false] - true if the component should display a button that will expand the number of items
 * @propType {number} [limitMin=10] - the minimum number of diplayed items
 * @propType {number} [limitMax=20] - the maximun number of displayed items. Only used when showMore is set to `true`
 * @propType {string} defaultRefinement - the value of the item selected by default
 * @propType {boolean} [withSearchBox=false] - allow search inside values
 * @providedPropType {function} refine - a function to toggle a refinement
 * @providedPropType {function} createURL - a function to generate a URL for the corresponding search state
 * @providedPropType {string} currentRefinement - the refinement currently applied
 * @providedPropType {array.<{count: number, isRefined: boolean, label: string, value: string}>} items - the list of items the Menu can display.
 * @providedPropType {function} searchForItems - a function to toggle a search inside items values
 * @providedPropType {boolean} isFromSearch - a boolean that says if the `items` props contains facet values from the global search or from the search inside items.
 */
export default createConnector({
  displayName: 'AlgoliaMenu',

  propTypes: {
    attributeName: PropTypes.string.isRequired,
    showMore: PropTypes.bool,
    limitMin: PropTypes.number,
    limitMax: PropTypes.number,
    defaultRefinement: PropTypes.string,
    transformItems: PropTypes.func,
    withSearchBox: PropTypes.bool,
    searchForFacetValues: PropTypes.bool, //@deprecated
  },

  defaultProps: {
    showMore: false,
    limitMin: 10,
    limitMax: 20,
  },

  getProvidedProps(props, searchState, searchResults, meta, searchForFacetValuesResults) {
    const {results} = searchResults;
    const {attributeName, showMore, limitMin, limitMax} = props;
    const limit = showMore ? limitMax : limitMin;
    const index = getIndex(this.context);

    const canRefine =
      Boolean(results) &&
      Boolean(results[index]) &&
      Boolean(results[index].getFacetByName(attributeName));

    const isFromSearch = Boolean(searchForFacetValuesResults
      && searchForFacetValuesResults[attributeName]
      && searchForFacetValuesResults.query !== '');
    const withSearchBox = props.withSearchBox || props.searchForFacetValues;
    if (process.env.NODE_ENV === 'development' && props.searchForFacetValues) {
      // eslint-disable-next-line no-console
      console.warn('react-instantsearch: `searchForFacetValues` has been renamed to' +
        '`withSearchBox`, this will break in the next major version.');
    }

    if (!canRefine) {
      return {
        items: [],
        currentRefinement: getCurrentRefinement(props, searchState, this.context),
        isFromSearch,
        withSearchBox,
        canRefine,
      };
    }

    const items = isFromSearch
      ? searchForFacetValuesResults[attributeName]
        .map(
          v => ({
            label: v.value,
            value: getValue(v.value, props, searchState, this.context),
            _highlightResult: {label: {value: v.highlighted}},
            count: v.count,
            isRefined: v.isRefined,
          }))
      : results[index]
        .getFacetValues(attributeName, {sortBy})
        .map(v => ({
          label: v.name,
          value: getValue(v.name, props, searchState, this.context),
          count: v.count,
          isRefined: v.isRefined,
        }));

    const sortedItems = withSearchBox && !isFromSearch ?
      orderBy(items, ['isRefined', 'count', 'label'], ['desc', 'desc', 'asc']) : items;
    const transformedItems = props.transformItems ? props.transformItems(sortedItems) : sortedItems;
    return {
      items: transformedItems.slice(0, limit),
      currentRefinement: getCurrentRefinement(props, searchState, this.context),
      isFromSearch,
      withSearchBox,
      canRefine: items.length > 0,
    };
  },

  refine(props, searchState, nextRefinement) {
    return refine(props, searchState, nextRefinement, this.context);
  },

  searchForFacetValues(props, searchState, nextRefinement) {
    return {facetName: props.attributeName, query: nextRefinement};
  },

  cleanUp(props, searchState) {
    return cleanUp(props, searchState, this.context);
  },

  getSearchParameters(searchParameters, props, searchState) {
    const {attributeName, showMore, limitMin, limitMax} = props;
    const limit = showMore ? limitMax : limitMin;

    searchParameters = searchParameters.setQueryParameters({
      maxValuesPerFacet: Math.max(
        searchParameters.maxValuesPerFacet || 0,
        limit
      ),
    });

    searchParameters = searchParameters.addDisjunctiveFacet(attributeName);

    const currentRefinement = getCurrentRefinement(props, searchState, this.context);
    if (currentRefinement !== null) {
      searchParameters = searchParameters.addDisjunctiveFacetRefinement(
        attributeName,
        currentRefinement
      );
    }

    return searchParameters;
  },

  getMetadata(props, searchState) {
    const id = getId(props);
    const currentRefinement = getCurrentRefinement(props, searchState, this.context);
    return {
      id,
      items: currentRefinement === null ? [] : [{
        label: `${props.attributeName}: ${currentRefinement}`,
        attributeName: props.attributeName,
        value: nextState => refine(props, nextState, '', this.context),
        currentRefinement,
      }],
    };
  },
});
