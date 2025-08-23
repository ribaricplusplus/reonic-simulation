import { gql } from '@apollo/client';

export const RUN_SIMULATION = gql`
  mutation RunSimulation($input: SimulationInput!) {
    runSimulation(input: $input) {
      id
      status
      name
      results
    }
  }
`;

export const GET_SIMULATIONS = gql`
  query GetSimulations {
    allSimulationRuns {
      id
      status
      name
    }
  }
`;

export const GET_SIMULATION = gql`
  query GetSimulation($id: String!) {
    simulationRunById(id: $id) {
      id
      status
      name
      inputs
      results
      totalConsumedEnergy
    }
  }
`;
