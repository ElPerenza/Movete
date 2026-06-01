import { HttpException, Injectable } from '@nestjs/common';
import { GraphQLResponse } from '../types/graphql-response';
import { GraphQLException } from '../graphql-exception';

/**
 * Basic GraphQL client to make queries to a GraphQL server.
 * Made for working with servers that use HTTP POST and always use status code 200 even when the GraphQL query fails/is incorrect.
 */
@Injectable()
export class GraphQLClientService {

    /**
     * Sends the given query and variables to a GraphQL endpoint.  
     * If the HTTP request fails, a {@link HttpException} is thrown.
     * If the query execution fails, a {@link GraphQLException} is thrown.
     * 
     * @param T the type of the query response data
     * @param url URL to the GraphQL endpoint
     * @param query the query to send
     * @param variables the query variables to send
     * @returns the query response data
     */
    async makeQuery<T>(url: string, query: string, variables: unknown): Promise<T> {

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/graphql-response+json, application/json"
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        if(!response.ok) {
            throw new HttpException(`Failed fetching GraphQL query: ${await response.text()}`, response.status);
        }

        const graphQlResponse: GraphQLResponse<T> = await response.json();
        if(graphQlResponse.errors && graphQlResponse.errors.length != 0) {
            throw new GraphQLException(graphQlResponse.errors[0].message, graphQlResponse.errors);
        }

        return graphQlResponse.data!; // data always included if there are no errors
    }
}
