/**
 * An error returned in a GraphQL error response.
 * @see {@link https://spec.graphql.org/September2025/#sec-Errors}
 */
export interface GraphQLError {
    message: string
    locations?: { line: number, column: number }[]
    path?: string[]
}

/**
 * A GraphQL response.
 * @see {@link https://spec.graphql.org/September2025/#sec-Response}
 * 
 * @param T the type of the data contained in the response
 */
export interface GraphQLResponse<T> {
    errors?: GraphQLError[]
    data?: T,
    extensions?: unknown
}