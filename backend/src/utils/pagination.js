// backend/src/utils/pagination.js
export const parsePagination = (query = {}, { defaultLimit = 10, maxLimit = 5000 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const paginated = (data, total, { page, limit }, extras = {}) => ({
  data,
  total,
  page,
  pages: Math.max(1, Math.ceil(total / limit)),
  limit,
  ...extras,
});
