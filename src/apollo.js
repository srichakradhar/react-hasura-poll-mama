import {
  ApolloClient,
  HttpLink,
  ApolloLink,
  InMemoryCache,
  split,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const scheme = (proto) =>
  window.location.protocol === "https:" ? `${proto}` : proto;

const splitter = ({ query }) => {
  const { kind, operation } = getMainDefinition(query) || {};
  const isSubscription =
    kind === "OperationDefinition" && operation === "subscription";
  return isSubscription;
};

const GRAPHQL_ENDPOINT = "pollmama.hasura.app";
const cache = new InMemoryCache();
const options = { reconnect: true };

const wsURI = `${scheme("wss")}://${GRAPHQL_ENDPOINT}/v1/graphql`;
const httpurl = `${scheme("https")}://${GRAPHQL_ENDPOINT}/v1/graphql`;

const wsLink = new GraphQLWsLink(
  createClient({ url: wsURI, connectionParams: { options } }),
);

const authLink = new ApolloLink((operation, forward) => {
  // Retrieve the authorization token from local storage.
  const token = localStorage.getItem("auth_token");

  // Use the setContext method to set the HTTP headers.
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "X-Hasura-Access-Key":
        "7YbuFTsHW3MD7RKjFHvwC9KOfGaDT0yxeAsIvIqpzyA6VgoAhlbYHrX5T0idaEty",
    },
  }));

  // Call the next link in the middleware chain.
  return forward(operation);
});

const httpLink = authLink.concat(new HttpLink({ uri: httpurl }));
const link = split(splitter, wsLink, httpLink);
const client = new ApolloClient({ link, cache });
export default client;
