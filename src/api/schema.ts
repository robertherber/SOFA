import { GraphQLResolveInfo, StringValueNode } from 'graphql';

export function extendSchema(config: {
  modelMap: {
    [modelName: string]: (id: any, context: any) => any;
  };
}) {
  const typeDefs = `
    union RESTModel = ${Object.keys(config.modelMap).join(' | ')}

    extend type Query {
      _getRESTModelById(typename: String!, id: ID!): RESTModel
    }
  `;

  const resolvers = {
    RESTModel: {
      __resolveType(_: any, _context: any, info: GraphQLResolveInfo) {
        const firstField = info.operation.selectionSet.selections[0];
        if (firstField.kind !== 'Field') {
          throw new Error('RESTModel can be used only with _getRESTModelById!')
        } else {
          const typename = firstField.arguments!.find(arg => arg.name.value === 'typename')!;
          return (typename.value as StringValueNode).value;
        }
      },
    },
    Query: {
      _getRESTModelById(
        _: any,
        args: { id: any; typename: string },
        context: any,
      ) {
        const resolver = config.modelMap[args.typename];

        if (!resolver) {
          throw new Error(`Missing resolver for ${args.typename} model`);
        }

        return resolver(args.id, context);
      },
    },
  };

  return {
    typeDefs,
    resolvers
  };
}
