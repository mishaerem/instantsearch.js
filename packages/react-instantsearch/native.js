import algoliasearch from 'algoliasearch/reactnative';
import createInstantSearch from './src/core/createInstantSearch';
import {View} from 'react-native';
const InstantSearch = createInstantSearch(algoliasearch, {
  Root: View,
});
export {InstantSearch};
export {default as MultiIndexContext} from './src/core/MultiIndexContext.js';
export {default as Configure} from './src/widgets/Configure.js';
