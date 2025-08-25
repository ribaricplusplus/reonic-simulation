import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '../generated/pothos-types.js';
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../prisma.js';
import { executeSimulation } from '@/simulation.js';
import { z } from 'zod';

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

const ChargerConfigSchema = z.object({
  id: z.string(),
  count: z.number().int().min(1),
  power: z.number().min(0).max(1000),
});

const SimulationInputSchema = z.object({
  name: z.string().min(1).optional(),
  chargers: z.array(ChargerConfigSchema)
    .min(1)
    .refine((chargers) => {
      const totalCount = chargers.reduce((sum, charger) => sum + charger.count, 0);
      return totalCount <= 1000;
    }, { message: "Total number of chargers must not exceed 1000" }),
  arrivalProbabilities: z.array(z.number().min(0).max(100)),
  energyConsumption: z.number().min(0.001).max(9999.999),
})

function formatValidationError(error: z.ZodError): string {
  const messages: string[] = [];
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    
    switch (issue.code) {
      case 'too_small':
        if (path.includes('chargers') && path.includes('count')) {
          messages.push(`Charger count must be at least ${issue.minimum}`);
        } else if (path.includes('chargers') && path.includes('power')) {
          messages.push(`Charger power must be at least ${issue.minimum} kW`);
        } else if (path.includes('arrivalProbabilities')) {
          messages.push(`Arrival probabilities must be at least ${issue.minimum}%`);
        } else if (path.includes('energyConsumption')) {
          messages.push(`Energy consumption must be greater than ${issue.minimum} kWh/100km`);
        } else if (path.includes('name')) {
          messages.push('Simulation name cannot be empty');
        } else {
          messages.push(`${path}: Must be at least ${issue.minimum}`);
        }
        break;
        
      case 'too_big':
        if (path.includes('chargers') && path.includes('power')) {
          messages.push(`Charger power must be at most ${issue.maximum} kW`);
        } else if (path.includes('arrivalProbabilities')) {
          messages.push(`Arrival probabilities must be at most ${issue.maximum}%`);
        } else if (path.includes('energyConsumption')) {
          messages.push(`Energy consumption must be less than ${issue.maximum} kWh/100km`);
        } else {
          messages.push(`${path}: Must be at most ${issue.maximum}`);
        }
        break;
        
      case 'invalid_type':
        if (path.includes('chargers')) {
          messages.push('Charger configuration is invalid');
        } else if (path.includes('arrivalProbabilities')) {
          messages.push('Arrival probabilities must be valid numbers');
        } else if (path.includes('energyConsumption')) {
          messages.push('Energy consumption must be a valid number');
        } else {
          messages.push(`${path}: Invalid type`);
        }
        break;
        
      case 'custom':
        messages.push(issue.message);
        break;
        
      default:
        messages.push(issue.message);
    }
  }
  
  return messages.length > 1 
    ? `Validation errors:\n• ${messages.join('\n• ')}`
    : messages[0] || 'Invalid input provided';
};

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
        const validationResult = SimulationInputSchema.safeParse(args.input);
        
        if (!validationResult.success) {
          throw new Error(formatValidationError(validationResult.error));
        }

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
