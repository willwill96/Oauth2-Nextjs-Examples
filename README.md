# Oauth2-Nextjs-Examples
Repo of examples integrating nextjs apps with an Oauth2 provider using the [Authorization code flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow)

In these examples I will be using a locally running [keycloak](https://www.keycloak.org/) instance, but these approaches should work for most Oauth2 providers.

# Folder Structure

- `keycloak/` - All information relevant to the keycloak docker image used in each of the examples. Things of note:
    - The realm being used for examples listed below are using the realm `test-realm` and the client `test-client`
    - You can sign in with the following username/password: `test@test.com`/`test`
- `vanilla-next-auth/` - Example of a repo using next-auth as a library, mostly as documented from the [next-auth docs](https://next-auth.js.org/)    
- `oauth2-proxy/` - Example of wrapping nextjs in [oauth2-proxy](https://github.com/oauth2-proxy/oauth2-proxy)
- `next-auth-as-a-service/` - Example of hosting two nextjs apps behind a [Caddy](https://caddyserver.com/) reverse proxy. One serves the routes necessary for the auth.js implementation. The other serves all other routes. This is most useful in a microservice architecture

# Running Examples

Each example is implemented using docker-compose. Navigate to the example you want to check out and run `docker-compose up`. 
You should be able to access the nextjs app in each case at `http://host.docker.internal:3000`

# Vanilla next-auth

This example integrates `next-auth` as described in their docs. At its core, `next-auth` provides two things for this example:
1. A set of API routes to support authentication flows, including Oauth2 flows. The specific routes can be customized but the default is that they get hosted at `/api/auth`.
2. A client-side library for managing session state which utilizes the API routes that it provides. It includes some efficiencies by polling the session endpoint and refetching on window focus.

The Good:
- Auth is integrated directly into your app, so you only need to run the one app
- next-auth makes the authorization code flow easy to implement
- next-auth allows for a lot of customization
The Bad:
- Requires you to get your hands dirty with a fair amount of code to customize your instance
- Access/Refresh/Id Tokens have to be added to your session manually: [Implemented here](./vanilla-next-auth/src/lib/next-auth.ts#L55-L61)
- Doesn't automatically handle refresh token rotation for you. [Implemented here](./vanilla-next-auth/src/lib/next-auth.ts#L64-L87)
- Doesn't handle backchannel logout (although it is relatively straightforward to implement): [Implemented here](./vanilla-next-auth/src/lib/next-auth.ts#L95-98)
The Ugly:
- next-auth is not really built to align itself to a single provider. next-auth maintains its own session that is not automatically aligned to any of your providers. next-auth's session refreshes anytime you hit one of the next-auth APIs, which ends up being pretty frequent. There are some workarounds, but you can end up in some states where you don't have a valid access_token, but next-auth still identifies you as "authenticated". In my opinion, next-auth really shines more in a situation where you need to support multiple providers.


# Oauth2 Proxy

This example uses Oauth2 Proxy to wrap the next.js app in a reverse proxy. Oauth2 Proxy provides two things for this example:
1. A set of API routes to support authentication flows, including Oauth2 flows. These APIs are served out of `/oauth2`.
2. A reverse proxy to upstream service(s) - in this case, our next.js app. Oauth2 Proxy can provide auth gating to protected pages and can forward auth related headers to the upstream service (i.e. username, email, access token)

The Good:
- Can be configured without any code - only some env vars as configuration were necessary in the service definition
- Handles refresh tokens and backchannel logouts out of the box
- Can easily be extended to non-next.js apps
- Abstracts the auth implementation from application developers - From the perspective of the upstream app, there is just an access token attached as a header.
- This isn't 
The Bad:
- Customization is a bit lacking in comparison to next-auth when it comes to executing custom code & custom templates.
- Networking setup is more complex as you have to run two apps for the setup to work properly
The Ugly:
- Compared to next-auth, there is not a client-side library to manage your session state (although it was easy enough to implement).  [Implementation here](./oauth2-proxy/src/app/page.tsx#L6-L13)
- Unlike next-auth, oauth2-proxy does not currently support multiple providers out of the box.


# Next-Auth as a Service

This example uses Caddy server to reverse proxy two nextjs apps behind the same domain:
1. One app hosts the `next-auth` base endpoints in addition to two more endpoints which are relevant to the Caddy implementation
    - `/api/login` - an endpoint that can be navigated to initiate the authorization code flow: [Implementation here](./next-auth-as-a-service/next-auth/src/app/api/login/route.ts)
    - `/api/is-authed` - an endpoint that will return either a 202 with an access token as an `X-Auth-Request-Access-Token` or a 401: [Implementation here](./next-auth-as-a-service/next-auth/src/app/api/is-authed/route.ts)
2. The other app hosts the application itself - any pages or business logic unrelated to auth

The Caddy server is responsible for several things:
1. Reverse proxying any routes from the next-auth app behind `localhost:3000` - any routes that match `/api/login`, `/api/is-authed`, `/api/auth/*`: [Implementation here](./next-auth-as-a-service/caddy/Caddyfile#L7-L15)
2. Reverse proxying any other routes from the application server behind `localhost:3000`: [Implementation here](./next-auth-as-a-service/caddy/Caddyfile#L18-L45)
3. Using the [forward_auth](https://caddyserver.com/docs/caddyfile/directives/forward_auth) Caddy directive to provide authentication gating and state to the upstream next.js app
    a. When a request is made to `/private-page`, Caddy checks the user's authentication status using the `/api/is-authed` endpoint. If unauthenticated, Caddy redirects the user to login at `/api/login`. If authenticated, Caddy reverse proxies the route to your application, and forwards the `X-Auth-Request-Access-Token` header: [Implementation here](./next-auth-as-a-service/caddy/Caddyfile#L23-L31)
    b. When a request is made to any other page or route, Caddy checks the user's authentication status using the `/api/is-authed` endpoint. Caddy reverse proxies the route to your application, and if authenticated, forwards the `X-Auth-Request-Access-Token` header: [Implementation here](./next-auth-as-a-service/caddy/Caddyfile#L36-L45)


> Note: You can accomplish something similar to Caddy's `forward_auth` with the [nginx module auth_request](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html). In my limited experience, Caddy's implementation is more straightforward & flexible though.

The Good:
- This shares most of the good from the vanilla next-auth implementation
- Relatively simple to add protected routes reverse proxied behind more services
- Abstracts authentication away from applications. This would be valuable in a micro-frontend architecture, so that not every app is responsible for setting up and maintaining next-auth APIs
The Bad:
- This is a more complicated setup, however it is most likely to be beneficial to micro-service or micro-frontend setups which tend to be more complex as is. If you have a single app, it probably makes sense to go with one of the other approaches

