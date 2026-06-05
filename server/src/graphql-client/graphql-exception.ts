import { GraphQLError } from "./types/graphql-response"

/**
 * Exception thrown when a GraphQL response returns errors.
 */
export class GraphQLException extends Error {

    readonly errors: GraphQLError[];
    
    constructor(message: string, errors: GraphQLError[]) {
        super(message);
        this.errors = errors;
    }
}