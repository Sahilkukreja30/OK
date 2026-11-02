import { HttpError } from '../_lib/errors.js';
import { handle } from '../_lib/http.js';
import { addResources, getResourceEntry, listResource, removeResource, saveResource } from '../_lib/contentStore.js';

const requireParam = (value, name) => {
  if (!value) throw new HttpError(400, `Missing "${name}".`);
  return value;
};

export default handle({
  GET: ({ query }) => {
    const resource = requireParam(query.resource, 'resource');
    return query.id ? getResourceEntry(resource, query.id) : listResource(resource);
  },

  POST: ({ body }) => {
    const resource = requireParam(body?.resource, 'resource');
    if (body.items) return addResources(resource, body.items);
    return saveResource(resource, { values: requireParam(body.values, 'values'), publish: Boolean(body.publish) });
  },

  PUT: ({ body }) =>
    saveResource(requireParam(body?.resource, 'resource'), {
      id: requireParam(body.id, 'id'),
      values: requireParam(body.values, 'values'),
      publish: Boolean(body.publish)
    }),

  DELETE: ({ query }) =>
    removeResource(requireParam(query.resource, 'resource'), requireParam(query.id, 'id'))
});
