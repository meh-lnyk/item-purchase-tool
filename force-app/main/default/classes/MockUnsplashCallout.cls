@isTest
global class MockUnsplashCallout implements HttpCalloutMock {
    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"results":[{"urls":{"regular":"https://mockimage.com"}}]}');
        res.setStatusCode(200);
        return res;
    }
}
