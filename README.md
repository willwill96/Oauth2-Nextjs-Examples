# Oauth2-Nextjs-Examples
Repo of examples integrating nextjs apps with an Oauth2 provider

In these examples I will be using a locally running [keycloak](https://www.keycloak.org/) instance, but these approaches should work for most Oauth2 providers.

# Folder Structure

- `keycloak/` - All information relevant to the keycloak docker image used in each of the examples. Things of note:
    - The realm being used for examples listed below are using the realm `test-realm` and the client `test-client`
    - You can sign in with the following credentials: `
- `vanilla-next-auth` - Example of a repo using next-auth as a library
- `oauth2-proxy` - 

# Running Examples

Each example is implemented using docker-compose. navigate to the example you want to check out and run `docker-compose up`. 
You should be able to access the nextjs app in each case at `http://host.docker.internal:3000`