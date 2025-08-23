import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '../generated/pothos-types.js';
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../prisma.js';
import { executeSimulation } from '@/simulation.js';

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: {
    Json: {
      Input: Prisma.JsonValue;
      Output: Prisma.JsonValue;
    };
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

builder.scalarType('Json', {
  serialize: (value) => value,
  parseValue: (value) => value as Prisma.JsonValue,
});

const ChargerConfigInput = builder.inputType('ChargerConfig', {
  fields: (t) => ({
    id: t.string({ required: true }),
    count: t.int({ required: true }),
    power: t.float({ required: true }),
  }),
});

const SimulationInput = builder.inputType('SimulationInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    chargers: t.field({ type: [ChargerConfigInput], required: true }),
    arrivalProbabilities: t.floatList({ required: true }),
    energyConsumption: t.float({ required: true }),
  }),
});

builder.prismaObject('SimulationRun', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', { nullable: true }),
    totalConsumedEnergy: t.exposeFloat('totalConsumedEnergy', { nullable: true }),

    // Expose the enum field, mapping it to the enum type we just registered.
    status: t.exposeString('status'),

    // Expose the JSON fields using the custom 'Json' scalar type.
    results: t.expose('results', { type: 'Json', nullable: true }),
    inputs: t.expose('inputs', { type: 'Json' }),
  }),
});


builder.queryType({
  fields: (t) => ({
    simulationRunById: t.prismaField({
      type: 'SimulationRun',
      nullable: true,
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (query, root, args, ctx, info) => {
        return prisma.simulationRun.findUnique({
          ...query,
          where: { id: args.id },
        });
      },
    }),

    allSimulationRuns: t.prismaField({
        type: ['SimulationRun'],
        resolve: async (query, root, args, ctx, info) => {
            return prisma.simulationRun.findMany({
                ...query,
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }
    })
  }),
});

builder.mutationType({
  fields: (t) => ({
    runSimulation: t.prismaField({
      type: 'SimulationRun',
      args: {
        input: t.arg({ type: SimulationInput, required: true }),
      },
      resolve: async (query, root, args, ctx, info) => {
        let simulationResults: any;
        try {
          simulationResults = await executeSimulation(args.input);
        } catch (e) {
          simulationResults = { status: 'FAILED', data: null };
          console.error("Simulation run failed.")
          console.error(e)
        }
        return prisma.simulationRun.create({
          ...query,
          data: {
            name: args.input.name,
            inputs: {
              ...args.input
            },
            results: simulationResults.data,
            status: simulationResults.status,
          },
        });
      },
    }),
  }),
});
