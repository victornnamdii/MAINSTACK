type subquery = {
  [keys: string]: string | number | { [keys: string]: number };
};

type query = {
  [keys: string]: string | number | RegExp | subquery | subquery[] | undefined;
};

const PAGE_SIZE = 20;

const pipelineBuilder = (
  page: number,
  queryParameters: { [keys: string]: string }
) => {
  const query: query = {};
  const { exactPrice, ltePrice, gtePrice, name, options } = queryParameters;

  const skip = (page - 1) * PAGE_SIZE;

  const pipeline = [
    {
      $match: query,
    },
  ];

  const exactPricePresent = !isNaN(Number(exactPrice));
  const ltePricePresent = !isNaN(Number(ltePrice));
  const gtePricePresent = !isNaN(Number(gtePrice));

  if (exactPricePresent || ltePricePresent || gtePricePresent || options) {
    // @ts-expect-error: Aggregation Pipeline
    pipeline.unshift({ $unwind: "$variants" });

    if (exactPricePresent) {
      query["variants.price"] = Number(exactPrice);
    } else if (ltePricePresent || gtePricePresent) {
      query["variants.price"] = ltePricePresent
        ? { $lte: Number(ltePrice) }
        : undefined;
      query["variants.price"] = gtePricePresent
        ? { $gte: Number(gtePrice) }
        : undefined;
    }

    if (options) {
      const requiredOptions = options.split(",");
      requiredOptions.forEach((option) => {
        const multipleSubQueries = query.$or as subquery[] | undefined;

        const subquery: subquery = { "variants.options": option };
        subquery[`variants.quantity.${option}`] = { $gt: 0 };

        if (!multipleSubQueries) {
          query.$or = [subquery];
        } else {
          multipleSubQueries.push(subquery);
        }
      });
    }

    pipeline.push({
      // @ts-expect-error: Aggregation Pipeline
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        variants: { $push: "$variants" },
        categoryId: { $first: "$categoryId" },
        brandId: { $first: "$brandId" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
      },
    });
  }

  if (name) {
    const regex = new RegExp(name, "i");
    query.name = regex;
  }

  pipeline.push({
    // @ts-expect-error: Aggregation Pipeline
    $facet: {
      metadata: [{ $count: "totalProducts" }],
      products: [
        {
          $sort: { createdAt: 1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: PAGE_SIZE,
        },
      ],
    },
  });

  return pipeline;
};

export default pipelineBuilder;
