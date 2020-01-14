import { getCategoriesFromSitemap, getProductsFromSitemap } from '../src/modules/googleanalytics';
import { describe, it } from './helpers/mochahelper';
import assert from 'assert';

describe('Sitemap requests', function () {
    this.timeout(16000);

    describe('#getCategoriesFromSitemap()', function () {
        it.allowFail('should return a list of categories extracted from the sitemap', function () {
            assert.strictEqual(getCategoriesFromSitemap('http://mercury-dev-v2.westeurope.cloudapp.azure.com/sitemap_categories_mercury-food.xml').length > 0, true);
        });

        it('should return empty array because of wrong URL', function () {
            assert.strictEqual(getCategoriesFromSitemap('').length === 0, true);
        });
    });

    describe('#getProductsFromSitemap()', function () {
        it.allowFail('should return a list of products extracted from the sitemap', function () {
            assert.strictEqual(getProductsFromSitemap('http://mercury-dev-v2.westeurope.cloudapp.azure.com/sitemap_products_mercury-food.xml').length > 0, true);
        });

        it('should return empty array because of wrong URL', function () {
            assert.strictEqual(getProductsFromSitemap('').length === 0, true);
        });
    });
});
