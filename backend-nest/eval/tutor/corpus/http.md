# The HTTP Protocol

HTTP (HyperText Transfer Protocol) is the application-layer protocol that powers
the web. It follows a request-response model: a client sends a request and the
server returns a response. HTTP is stateless, meaning each request is handled
independently and the server keeps no memory of previous requests.

Every HTTP response includes a status code. Codes in the 200 range mean success,
300 codes mean redirection, 400 codes mean the client made an error (for example
404 Not Found means the requested resource does not exist), and 500 codes mean
the server failed to handle a valid request.

Common HTTP methods describe the intended action. GET retrieves a resource and
should not change server state. POST submits data to create a resource. PUT
replaces a resource, PATCH partially updates it, and DELETE removes it.

Because HTTP is stateless, web applications use cookies and tokens to remember
who a user is across multiple requests.
