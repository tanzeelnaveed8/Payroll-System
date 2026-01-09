import mongoose from 'mongoose';

/**
 * Optimize MongoDB queries
 * Adds select, lean, and limit optimizations
 */
export const optimizeQuery = (query, options = {}) => {
  const {
    select = '',
    lean = true,
    limit = null,
    skip = null,
    sort = null,
    populate = null,
  } = options;

  // Apply select to limit fields
  if (select) {
    query.select(select);
  }

  // Use lean for read-only queries (faster, returns plain objects)
  if (lean) {
    query.lean();
  }

  // Apply pagination
  if (skip !== null && skip > 0) {
    query.skip(skip);
  }

  if (limit !== null && limit > 0) {
    query.limit(Math.min(limit, 1000)); // Max limit of 1000
  }

  // Apply sorting
  if (sort) {
    query.sort(sort);
  }

  // Apply population
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        query.populate(pop);
      });
    } else {
      query.populate(populate);
    }
  }

  return query;
};

/**
 * Build efficient aggregation pipeline
 */
export const buildAggregationPipeline = (matchStage, options = {}) => {
  const {
    group = null,
    project = null,
    sort = null,
    limit = null,
    skip = null,
    lookup = null,
  } = options;

  const pipeline = [];

  // Match stage (filtering)
  if (matchStage && Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Lookup stage (joins)
  if (lookup) {
    if (Array.isArray(lookup)) {
      lookup.forEach(l => pipeline.push({ $lookup: l }));
    } else {
      pipeline.push({ $lookup: lookup });
    }
  }

  // Group stage (aggregation)
  if (group) {
    pipeline.push({ $group: group });
  }

  // Project stage (field selection)
  if (project) {
    pipeline.push({ $project: project });
  }

  // Sort stage
  if (sort) {
    pipeline.push({ $sort: sort });
  }

  // Skip stage
  if (skip !== null && skip > 0) {
    pipeline.push({ $skip: skip });
  }

  // Limit stage
  if (limit !== null && limit > 0) {
    pipeline.push({ $limit: Math.min(limit, 1000) });
  }

  return pipeline;
};

/**
 * Optimize find query with common patterns
 */
export const optimizedFind = async (Model, filter, options = {}) => {
  const {
    select = '',
    lean = true,
    limit = 100,
    skip = 0,
    sort = { createdAt: -1 },
    populate = null,
  } = options;

  let query = Model.find(filter);

  query = optimizeQuery(query, {
    select,
    lean,
    limit,
    skip,
    sort,
    populate,
  });

  return query.exec();
};

/**
 * Optimize findOne query
 */
export const optimizedFindOne = async (Model, filter, options = {}) => {
  const {
    select = '',
    lean = true,
    populate = null,
  } = options;

  let query = Model.findOne(filter);

  if (select) {
    query.select(select);
  }

  if (lean) {
    query.lean();
  }

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        query.populate(pop);
      });
    } else {
      query.populate(populate);
    }
  }

  return query.exec();
};

/**
 * Optimize count query
 */
export const optimizedCount = async (Model, filter) => {
  return Model.countDocuments(filter).exec();
};

/**
 * Batch operations for better performance
 */
export const batchOperation = async (items, batchSize, operation) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(item => operation(item)));
    results.push(...batchResults);
  }
  return results;
};

/**
 * Use indexes hint for better query performance
 */
export const useIndexHint = (query, indexName) => {
  return query.hint(indexName);
};

