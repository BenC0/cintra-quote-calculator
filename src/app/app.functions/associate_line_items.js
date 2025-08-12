const Hubspot = require('@hubspot/api-client');

exports.main = async (context) => {
  const { deal_id, quote_id, products } = context.parameters;
  const hubspotClient = new Hubspot.Client({ accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN });

  try {
    const { results: existingItems = [], total: totalResults } = await hubspotClient.crm.lineItems.searchApi.doSearch({
      filterGroups: [{
            filters: [
                { propertyName: 'quote_id', operator: 'EQ', value: quote_id },
                { propertyName: 'qt_deal_id', operator: 'EQ', value: deal_id }
            ]
        }],
        properties: ['quote_id', 'qt_deal_id'],
        limit: 101
    });

    if (existingItems.length > 0) {
        // console.log(existingItems)
      await hubspotClient.crm.lineItems.batchApi.archive({ inputs: existingItems.map(li => ({ id: li.id })) });
    }

    const productIds = products.map(p => p.id);
    const prodPropsMap = {};
    if (products.length > 0) {
        const { results: prodResults = [] } = await hubspotClient.crm.products.batchApi.read({
            inputs: productIds.map(id => ({ id })),
            properties: ['name', 'product_name']
        });
        prodResults.forEach(p => { prodPropsMap[p.id] = p.properties || {}; });
    }

    const creationAndAssocPromises = products.map(async (prod) => {
        const apiProps = prodPropsMap[prod.id] || {};
        const props = {
            qt_deal_id: deal_id,
            quote_id: quote_id,
            name: apiProps.name || apiProps.product_name,
            ...prod.values
        };
        const lineItem = await hubspotClient.crm.lineItems.basicApi.create({ properties: props });
        const lineItemId = lineItem.id;

        await hubspotClient.crm.associations.batchApi.create('deals', 'line_items', {
            inputs: [{
                _from: { id: deal_id },
                to: { id: lineItemId },
                type: 'deal_to_line_item'
            }]
        });

        return { productId: prod.productId, lineItemId };
    });

    const processedItems = await Promise.all(creationAndAssocPromises);

    return {
      statusCode: 200,
      body: { message: 'Quote line items reset and associated successfully.', processedItems }
    };

  } catch (error) {
    console.error('Error in associate_line_items:', error);
    return {
      statusCode: error.statusCode || 500,
      body: { message: error.message || 'Internal Server Error' }
    };
  }
};
