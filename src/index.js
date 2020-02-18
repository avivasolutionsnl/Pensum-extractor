import minimist from 'minimist';
import { getScenarios } from './modules/scenarios';

function toGenericPagePath (path) {
    // Implement in case you want to generalize certain page paths
    // e.g. using the sitemap to combine multiple product pages of the same type into one
    return path;
}

const args = minimist(process.argv.slice(2));
// Data option, generate option, treshold and configuration
getScenarios(args.data, args.generate, 1, args.configuration, toGenericPagePath);
