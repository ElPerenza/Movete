import { Module } from '@nestjs/common';
import { GraphQLClientService } from './services/graphql-client.service';

/**
 * Module that provides a basic GraphQL client implementation.
 */
@Module({
    providers: [GraphQLClientService],
    exports: [GraphQLClientService]
})
export class GraphQLClientModule {}
