import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../simapi/src/generated/schema.graphql',

  // Point to files containing GraphQL operations (queries, mutations, etc.)
  documents: ['src/graphql/**/*.ts', 'src/app/**/*.tsx'],

  ignoreNoDocuments: true,

  generates: {
    // Specify the output path for the generated code
    './src/generated/gql/': {
      preset: 'client',
      plugins: [],
      config: {
        enumsAsTypes: true,
      },
    },
  },
};

export default config;
